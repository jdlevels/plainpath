// ─── PDF Utility Worker Runner ────────────────────────────────────────────────
// Spawns a short-lived worker_thread to execute a single pdf-lib operation and
// returns the result.  If the worker does not respond within TIMEOUT_MS the
// thread is forcibly terminated, protecting the main process from parser-bomb
// PDFs that would otherwise spin synchronously on the event loop.
//
// Using a dedicated thread also bounds per-request heap growth: if the worker
// OOMs it crashes in isolation and the main API process continues serving.
// ──────────────────────────────────────────────────────────────────────────────

import { Worker } from "worker_threads";
import path from "path";
import { ParseResourceLimitError } from "./parseWithLimits.js";

const TIMEOUT_MS = 30_000; // 30 seconds max per PDF operation

// ─── Message shapes matching pdfUtilWorker.ts ─────────────────────────────────
interface WorkerSuccess {
  ok: true;
  result: Record<string, unknown>;
  outBuf?: ArrayBuffer;
}

interface WorkerFailure {
  ok: false;
  limitError: boolean;
  message: string;
}

type WorkerResponse = WorkerSuccess | WorkerFailure;

// ─── Result type exposed to callers ──────────────────────────────────────────
export interface PdfWorkerResult {
  /** Metadata returned by the operation (e.g. { pageCount: 5 }). */
  result: Record<string, unknown>;
  /** Output PDF bytes for operations that produce a document. */
  outBuf?: ArrayBuffer;
}

/**
 * Resolves the path to the compiled worker bundle at runtime.
 * esbuild preserves the source directory structure relative to the outdir, so
 * `src/lib/pdfUtilWorker.ts` becomes `dist/lib/pdfUtilWorker.mjs`.
 * The main bundle lands at `dist/index.mjs`, so `__dirname` there is `dist/`.
 * We must therefore step into the `lib/` subdirectory.
 *
 * __dirname is injected by the esbuild banner (globalThis.__dirname) and equals
 * the directory of whichever output file this code ends up in.
 */
function workerBundlePath(): string {
  // __dirname is injected by the esbuild banner added in build.mjs.
  return path.join(__dirname, "lib", "pdfUtilWorker.mjs");
}

/**
 * Runs a pdf-lib operation inside an isolated worker_thread.
 *
 * @param op              Operation name (must match a case in pdfUtilWorker.ts).
 * @param params          Parameters for the operation.  Any ArrayBuffers that
 *                        should be transferred (zero-copy) must also be listed
 *                        in `inputTransferBuffers`.
 * @param inputTransferBuffers  ArrayBuffers to transfer to the worker thread.
 * @returns Promise resolving to { result, outBuf? }.
 * @throws ParseResourceLimitError when a page-count or text limit is hit.
 * @throws Error for corrupt files, timeouts, or unexpected worker crashes.
 */
export function runPdfUtilInWorker(
  op: string,
  params: Record<string, unknown>,
  inputTransferBuffers: ArrayBuffer[] = [],
): Promise<PdfWorkerResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let worker: Worker;

    try {
      worker = new Worker(workerBundlePath(), {
        workerData: { op, params },
        transferList: inputTransferBuffers,
      });
    } catch (spawnErr) {
      return reject(spawnErr);
    }

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        worker.terminate().catch(() => {});
        reject(new Error(
          "PDF operation timed out — the file may be too complex or malformed.",
        ));
      }
    }, TIMEOUT_MS);

    worker.on("message", (msg: WorkerResponse) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate().catch(() => {});

      if (msg.ok) {
        resolve({ result: msg.result, outBuf: msg.outBuf });
      } else if (msg.limitError) {
        reject(new ParseResourceLimitError(msg.message));
      } else {
        reject(new Error(msg.message));
      }
    });

    worker.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    worker.on("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(
          `PDF worker exited unexpectedly (code ${code}) — the document may have caused an out-of-memory error.`,
        ));
      }
    });
  });
}

/**
 * Safely extracts a standalone ArrayBuffer from a Node.js Buffer so that it
 * can be transferred (zero-copy) to a worker_thread.  Node.js Buffers may
 * share an underlying ArrayBuffer with other allocations (pool slabs); this
 * helper always produces a correctly-sized, non-shared ArrayBuffer.
 */
export function toTransferableArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
}
