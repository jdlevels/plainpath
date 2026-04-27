// ─── PDF Utilities Routes ──────────────────────────────────────────────────────
// Stateless PDF operations: merge, extract-pages, page-ops, compress, page-count
// All endpoints accept multipart form data and return a PDF (or JSON for page-count).
// Auth required — logged-in users only.
//
// All pdf-lib work is delegated to an isolated worker_thread (pdfUtilWorker.mjs)
// so that a parser-bomb PDF cannot stall or crash the main API process.
// The worker is terminated after TIMEOUT_MS regardless of progress.
// ──────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { runPdfUtilInWorker, toTransferableArrayBuffer } from "../../lib/runPdfUtilInWorker.js";
import { ParseResourceLimitError } from "../../lib/parseWithLimits.js";

const router = Router();

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB per file
const MAX_FILES = 5;                // max files for merge

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(_req, file, cb) {
    const mime = file.mimetype.toLowerCase();
    const name = (file.originalname || "").toLowerCase();
    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"));
    }
  },
});

function requireAuth(req: any, res: any, next: any) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

function sendPdf(res: any, buf: Buffer, name: string) {
  const safeName = name.replace(/[^\w.\-]/g, "_");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", buf.length);
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
  res.end(buf);
}

/** Map worker errors to appropriate HTTP responses. */
function handleWorkerError(res: any, err: unknown, tag: string): void {
  if (err instanceof ParseResourceLimitError) {
    res.status(400).json({ error: "too_many_pages", message: err.message });
    return;
  }
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[pdf-utilities] ${tag} error:`, msg);
  res.status(422).json({ error: `${tag}_failed`, message: msg });
}

// ─── POST /api/pdf-utilities/page-count ──────────────────────────────────────
// Returns { pageCount: number } for a given PDF file.

router.post(
  "/page-count",
  requireAuth,
  upload.single("file"),
  async (req: any, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file received" });

    const ab = toTransferableArrayBuffer(file.buffer);
    try {
      const { result } = await runPdfUtilInWorker("page-count", { buf: ab }, [ab]);
      return res.json({ pageCount: result.pageCount });
    } catch (err) {
      handleWorkerError(res, err, "page-count");
    }
  },
);

// ─── POST /api/pdf-utilities/merge ───────────────────────────────────────────
// Merge multiple PDFs into one.
// Body: multipart form — files keyed as file_0, file_1, ..., file_{n-1}
//       field "count" = number of files

router.post(
  "/merge",
  requireAuth,
  upload.fields(
    Array.from({ length: MAX_FILES }, (_, i) => ({ name: `file_${i}`, maxCount: 1 })),
  ),
  async (req: any, res) => {
    const count = parseInt(req.body?.count ?? "0", 10);
    if (!count || count < 2) {
      return res.status(400).json({ error: "At least 2 PDFs are required for merge" });
    }

    const abs: ArrayBuffer[] = [];
    for (let i = 0; i < count; i++) {
      const fileArr = req.files?.[`file_${i}`];
      const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;
      if (!file) {
        return res.status(400).json({ error: `Missing file_${i}` });
      }
      abs.push(toTransferableArrayBuffer(file.buffer));
    }

    try {
      const { outBuf } = await runPdfUtilInWorker("merge", { bufs: abs, count }, abs);
      if (!outBuf) return res.status(500).json({ error: "merge_failed" });
      sendPdf(res, Buffer.from(outBuf), "merged.pdf");
    } catch (err) {
      handleWorkerError(res, err, "merge");
    }
  },
);

// ─── POST /api/pdf-utilities/extract-pages ───────────────────────────────────
// Extract a subset of pages from a PDF.
// Body: multipart form — "file" (PDF), "pageRange" (string like "1-3,5,7-9")
// Page numbers are 1-based.

router.post(
  "/extract-pages",
  requireAuth,
  upload.single("file"),
  async (req: any, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file received" });

    const pageRange: string = (req.body?.pageRange ?? "").trim();
    if (!pageRange) {
      return res.status(400).json({ error: "pageRange is required (e.g. '1-3,5,7-9')" });
    }

    const ab = toTransferableArrayBuffer(file.buffer);
    try {
      const { outBuf } = await runPdfUtilInWorker("extract-pages", { buf: ab, pageRange }, [ab]);
      if (!outBuf) return res.status(500).json({ error: "extract_failed" });
      sendPdf(res, Buffer.from(outBuf), "extracted-pages.pdf");
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("No valid pages")) {
        return res.status(400).json({ error: err.message });
      }
      handleWorkerError(res, err, "extract-pages");
    }
  },
);

// ─── POST /api/pdf-utilities/page-ops ────────────────────────────────────────
// Apply delete / rotate / reorder operations to a PDF.
// Body: multipart form — "file" (PDF), "ops" (JSON array)
//
// ops format:
//   { type: "delete",  pageIndexes: number[] }        // 0-based
//   { type: "rotate",  pageIndexes: number[], degrees: 90|180|270 }
//   { type: "reorder", order: number[] }              // new order, 0-based

router.post(
  "/page-ops",
  requireAuth,
  upload.single("file"),
  async (req: any, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file received" });

    let ops: unknown[];
    try {
      ops = JSON.parse(req.body?.ops ?? "[]");
    } catch {
      return res.status(400).json({ error: "ops must be a valid JSON array" });
    }

    const ab = toTransferableArrayBuffer(file.buffer);
    try {
      const { outBuf } = await runPdfUtilInWorker("page-ops", { buf: ab, ops }, [ab]);
      if (!outBuf) return res.status(500).json({ error: "page_ops_failed" });
      sendPdf(res, Buffer.from(outBuf), "modified-pages.pdf");
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("All pages were deleted")) {
        return res.status(400).json({ error: err.message });
      }
      handleWorkerError(res, err, "page-ops");
    }
  },
);

// ─── POST /api/pdf-utilities/compress ────────────────────────────────────────
// Re-linearize a PDF with pdf-lib to reduce redundant data.
// Note: pdf-lib does not re-compress embedded images. This reduces object overhead.
// Body: multipart form — "file" (PDF)

router.post(
  "/compress",
  requireAuth,
  upload.single("file"),
  async (req: any, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file received" });

    const ab = toTransferableArrayBuffer(file.buffer);
    try {
      const { outBuf, result } = await runPdfUtilInWorker("compress", { buf: ab }, [ab]);
      if (!outBuf) return res.status(500).json({ error: "compress_failed" });

      const safeName = (file.originalname ?? "document").replace(/[^\w.\-]/g, "_");
      const downloadName = safeName.endsWith(".pdf")
        ? safeName.replace(/\.pdf$/, "-compressed.pdf")
        : `${safeName}-compressed.pdf`;

      const outBuffer = Buffer.from(outBuf);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", outBuffer.length);
      res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
      res.setHeader("X-Original-Size", String(result.originalSize));
      res.setHeader("X-Compressed-Size", String(result.newSize));
      res.setHeader("X-Saved-Bytes", String(result.savedBytes));
      res.end(outBuffer);
    } catch (err) {
      handleWorkerError(res, err, "compress");
    }
  },
);

export default router;
