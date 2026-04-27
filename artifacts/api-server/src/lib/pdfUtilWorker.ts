// ─── PDF Utilities Worker ──────────────────────────────────────────────────────
// Runs all pdf-lib document operations inside a dedicated worker_thread so that
// a parser-bomb PDF that causes unbounded allocation or synchronous event-loop
// spin cannot crash or stall the main API process.
//
// This file is compiled as a SEPARATE esbuild entry point (dist/pdfUtilWorker.mjs).
// The parent imports it via: new Worker(path.join(__dirname, "pdfUtilWorker.mjs"))
// ──────────────────────────────────────────────────────────────────────────────

import { workerData, parentPort } from "worker_threads";
import { PDFDocument, degrees } from "pdf-lib";

// ─── Shared constants ─────────────────────────────────────────────────────────
const MAX_PDF_UTIL_PAGES = 500;
const MAX_MERGED_TOTAL_PAGES = 1000;

// ─── Response types ───────────────────────────────────────────────────────────

interface WorkerSuccess {
  ok: true;
  /** Structured metadata (e.g. { pageCount: 5 } for page-count). */
  result: Record<string, unknown>;
  /** Output PDF bytes for operations that produce a document.
   *  This ArrayBuffer is listed in the postMessage transferList so it is
   *  moved (zero-copy) to the parent thread. */
  outBuf?: ArrayBuffer;
}

interface WorkerFailure {
  ok: false;
  /** true → limit was exceeded (parent should return HTTP 400). */
  limitError: boolean;
  message: string;
}

type WorkerMessage = WorkerSuccess | WorkerFailure;

function sendOk(result: Record<string, unknown>, outBuf?: ArrayBuffer): void {
  const msg: WorkerSuccess = { ok: true, result, ...(outBuf !== undefined && { outBuf }) };
  if (outBuf !== undefined) {
    parentPort?.postMessage(msg, [outBuf]);
  } else {
    parentPort?.postMessage(msg);
  }
}

function sendLimit(message: string): void {
  const msg: WorkerFailure = { ok: false, limitError: true, message };
  parentPort?.postMessage(msg);
}

function sendError(message: string): void {
  const msg: WorkerFailure = { ok: false, limitError: false, message };
  parentPort?.postMessage(msg);
}

// ─── Page-range parser ────────────────────────────────────────────────────────
function parsePageRange(rangeStr: string, total: number): number[] {
  const indexes = new Set<number>();
  for (const part of rangeStr.split(",")) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10) - 1;
      const end = parseInt(rangeMatch[2], 10) - 1;
      for (let i = Math.max(0, start); i <= Math.min(total - 1, end); i++) {
        indexes.add(i);
      }
    } else {
      const n = parseInt(trimmed, 10) - 1;
      if (!isNaN(n) && n >= 0 && n < total) indexes.add(n);
    }
  }
  return Array.from(indexes).sort((a, b) => a - b);
}

// ─── Operations ───────────────────────────────────────────────────────────────

async function opPageCount(buf: ArrayBuffer): Promise<void> {
  const doc = await PDFDocument.load(Buffer.from(buf), { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  if (pageCount > MAX_PDF_UTIL_PAGES) {
    return sendLimit(`PDF has too many pages (${pageCount}). Maximum allowed is ${MAX_PDF_UTIL_PAGES} pages.`);
  }
  sendOk({ pageCount });
}

async function opMerge(bufs: ArrayBuffer[], count: number): Promise<void> {
  const merged = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < count; i++) {
    const src = await PDFDocument.load(Buffer.from(bufs[i]), { ignoreEncryption: true });
    const srcCount = src.getPageCount();
    if (srcCount > MAX_PDF_UTIL_PAGES) {
      return sendLimit(`file_${i} has too many pages (${srcCount}). Maximum allowed per file is ${MAX_PDF_UTIL_PAGES} pages.`);
    }
    totalPages += srcCount;
    if (totalPages > MAX_MERGED_TOTAL_PAGES) {
      return sendLimit(`Combined page count exceeds the maximum allowed ${MAX_MERGED_TOTAL_PAGES} pages for a single merge operation.`);
    }
    const indexes = Array.from({ length: srcCount }, (_, p) => p);
    const copied = await merged.copyPages(src, indexes);
    copied.forEach((p) => merged.addPage(p));
  }

  const outBytes = await merged.save(); // Uint8Array
  const outBuf = outBytes.buffer.slice(outBytes.byteOffset, outBytes.byteOffset + outBytes.byteLength);
  sendOk({}, outBuf);
}

async function opExtractPages(buf: ArrayBuffer, pageRange: string): Promise<void> {
  const src = await PDFDocument.load(Buffer.from(buf), { ignoreEncryption: true });
  const total = src.getPageCount();
  if (total > MAX_PDF_UTIL_PAGES) {
    return sendLimit(`PDF has too many pages (${total}). Maximum allowed is ${MAX_PDF_UTIL_PAGES} pages.`);
  }

  const indexes = parsePageRange(pageRange, total);
  if (indexes.length === 0) {
    return sendError(`No valid pages in range "${pageRange}" — document has ${total} pages`);
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indexes);
  copied.forEach((p) => out.addPage(p));

  const outBytes = await out.save(); // Uint8Array
  const outBuf = outBytes.buffer.slice(outBytes.byteOffset, outBytes.byteOffset + outBytes.byteLength);
  sendOk({}, outBuf);
}

interface PageOp {
  type: string;
  pageIndexes?: number[];
  degrees?: number;
  order?: number[];
}

async function opPageOps(buf: ArrayBuffer, ops: PageOp[]): Promise<void> {
  const src = await PDFDocument.load(Buffer.from(buf), { ignoreEncryption: true });
  const pageCount = src.getPageCount();
  if (pageCount > MAX_PDF_UTIL_PAGES) {
    return sendLimit(`PDF has too many pages (${pageCount}). Maximum allowed is ${MAX_PDF_UTIL_PAGES} pages.`);
  }

  const keepMask = Array.from({ length: pageCount }, () => true);
  for (const op of ops) {
    if (op.type === "delete" && Array.isArray(op.pageIndexes)) {
      for (const idx of op.pageIndexes) {
        if (idx >= 0 && idx < pageCount) keepMask[idx] = false;
      }
    }
  }

  let order: number[] = [];
  const reorderOp = ops.find((o) => o.type === "reorder");
  if (reorderOp && Array.isArray(reorderOp.order)) {
    order = reorderOp.order.filter((idx) => idx >= 0 && idx < pageCount && keepMask[idx]);
    for (let i = 0; i < pageCount; i++) {
      if (keepMask[i] && !order.includes(i)) order.push(i);
    }
  } else {
    order = keepMask.map((keep, i) => (keep ? i : -1)).filter((i) => i >= 0);
  }

  if (order.length === 0) {
    return sendError("All pages were deleted — at least one page must remain");
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, order);
  copied.forEach((p) => out.addPage(p));

  for (const op of ops) {
    if (op.type === "rotate" && Array.isArray(op.pageIndexes)) {
      const rotDeg = [90, 180, 270].includes(op.degrees ?? 0) ? (op.degrees ?? 90) : 90;
      for (const srcIdx of op.pageIndexes) {
        const destPos = order.indexOf(srcIdx);
        if (destPos >= 0) {
          const p = out.getPage(destPos);
          const current = p.getRotation().angle;
          p.setRotation(degrees((current + rotDeg) % 360));
        }
      }
    }
  }

  const outBytes = await out.save(); // Uint8Array
  const outBuf = outBytes.buffer.slice(outBytes.byteOffset, outBytes.byteOffset + outBytes.byteLength);
  sendOk({}, outBuf);
}

async function opCompress(buf: ArrayBuffer): Promise<void> {
  const src = await PDFDocument.load(Buffer.from(buf), { ignoreEncryption: true });
  const srcPageCount = src.getPageCount();
  if (srcPageCount > MAX_PDF_UTIL_PAGES) {
    return sendLimit(`PDF has too many pages (${srcPageCount}). Maximum allowed is ${MAX_PDF_UTIL_PAGES} pages.`);
  }

  const originalSize = buf.byteLength;
  const outBytes = await src.save({ useObjectStreams: true }); // Uint8Array
  const newSize = outBytes.byteLength;
  const outBuf = outBytes.buffer.slice(outBytes.byteOffset, outBytes.byteOffset + outBytes.byteLength);
  sendOk({ originalSize, newSize, savedBytes: originalSize - newSize }, outBuf);
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

interface WorkerData {
  op: string;
  params: {
    buf?: ArrayBuffer;
    bufs?: ArrayBuffer[];
    count?: number;
    pageRange?: string;
    ops?: PageOp[];
  };
}

async function main(): Promise<void> {
  const { op, params } = workerData as WorkerData;

  try {
    switch (op) {
      case "page-count":
        await opPageCount(params.buf!);
        break;
      case "merge":
        await opMerge(params.bufs!, params.count!);
        break;
      case "extract-pages":
        await opExtractPages(params.buf!, params.pageRange!);
        break;
      case "page-ops":
        await opPageOps(params.buf!, params.ops!);
        break;
      case "compress":
        await opCompress(params.buf!);
        break;
      default:
        sendError(`Unknown operation: ${op}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    sendError(message);
  }
}

main();
