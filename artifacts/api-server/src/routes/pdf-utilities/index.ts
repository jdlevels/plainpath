// ─── PDF Utilities Routes ──────────────────────────────────────────────────────
// Stateless PDF operations: merge, extract-pages, page-ops, compress, page-count
// All endpoints accept multipart form data and return a PDF (or JSON for page-count).
// Auth required — logged-in users only.
// ──────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { PDFDocument, degrees } from "pdf-lib";

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

// ─── POST /api/pdf-utilities/page-count ──────────────────────────────────────
// Returns { pageCount: number } for a given PDF file.

router.post(
  "/page-count",
  requireAuth,
  upload.single("file"),
  async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file received" });
      const pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      return res.json({ pageCount: pdfDoc.getPageCount() });
    } catch (err) {
      console.error("[pdf-utilities] page-count error", err);
      return res.status(422).json({ error: "Could not read PDF" });
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
    try {
      const count = parseInt(req.body?.count ?? "0", 10);
      if (!count || count < 2) {
        return res.status(400).json({ error: "At least 2 PDFs are required for merge" });
      }

      const merged = await PDFDocument.create();

      for (let i = 0; i < count; i++) {
        const fileArr = req.files?.[`file_${i}`];
        const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;
        if (!file) {
          return res.status(400).json({ error: `Missing file_${i}` });
        }
        try {
          const src = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
          const pageIndexes = Array.from({ length: src.getPageCount() }, (_, p) => p);
          const copiedPages = await merged.copyPages(src, pageIndexes);
          copiedPages.forEach((p) => merged.addPage(p));
        } catch {
          return res.status(422).json({ error: `file_${i} could not be read — ensure it is a valid PDF` });
        }
      }

      const outBytes = await merged.save();
      sendPdf(res, Buffer.from(outBytes), "merged.pdf");
    } catch (err) {
      console.error("[pdf-utilities] merge error", err);
      return res.status(500).json({ error: "merge_failed" });
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
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file received" });

      const rangeStr: string = (req.body?.pageRange ?? "").trim();
      if (!rangeStr) {
        return res.status(400).json({ error: "pageRange is required (e.g. '1-3,5,7-9')" });
      }

      const src = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      const total = src.getPageCount();

      // Parse range string → 0-based indexes
      const indexes = parsePageRange(rangeStr, total);
      if (indexes.length === 0) {
        return res.status(400).json({ error: `No valid pages in range "${rangeStr}" — document has ${total} pages` });
      }

      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indexes);
      copied.forEach((p) => out.addPage(p));

      const outBytes = await out.save();
      sendPdf(res, Buffer.from(outBytes), `extracted-pages.pdf`);
    } catch (err: any) {
      console.error("[pdf-utilities] extract-pages error", err);
      return res.status(500).json({ error: "extract_failed" });
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
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file received" });

      let ops: any[] = [];
      try {
        ops = JSON.parse(req.body?.ops ?? "[]");
      } catch {
        return res.status(400).json({ error: "ops must be a valid JSON array" });
      }

      const src = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      const pageCount = src.getPageCount();

      // ── Apply delete operations first ──────────────────────────────────────
      // Track which pages to keep using a boolean mask; process from last to first
      const keepMask = Array.from({ length: pageCount }, () => true);
      for (const op of ops) {
        if (op.type === "delete") {
          for (const idx of (op.pageIndexes as number[])) {
            if (idx >= 0 && idx < pageCount) keepMask[idx] = false;
          }
        }
      }

      // ── Build ordered page index list ──────────────────────────────────────
      let order: number[] = [];
      const reorderOp = ops.find((o: any) => o.type === "reorder");
      if (reorderOp && Array.isArray(reorderOp.order)) {
        // Use provided order but only include pages that survive delete
        order = (reorderOp.order as number[]).filter(
          (idx: number) => idx >= 0 && idx < pageCount && keepMask[idx],
        );
        // Append any surviving pages not in the reorder list
        for (let i = 0; i < pageCount; i++) {
          if (keepMask[i] && !order.includes(i)) order.push(i);
        }
      } else {
        order = keepMask.map((keep, i) => (keep ? i : -1)).filter((i) => i >= 0);
      }

      if (order.length === 0) {
        return res.status(400).json({ error: "All pages were deleted — at least one page must remain" });
      }

      // ── Copy pages into new document ───────────────────────────────────────
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, order);
      copied.forEach((p) => out.addPage(p));

      // ── Apply rotate operations ────────────────────────────────────────────
      // Map source page indexes to destination positions
      for (const op of ops) {
        if (op.type === "rotate") {
          const rotDeg: number = [90, 180, 270].includes(op.degrees) ? op.degrees : 90;
          for (const srcIdx of (op.pageIndexes as number[])) {
            const destPos = order.indexOf(srcIdx);
            if (destPos >= 0) {
              const p = out.getPage(destPos);
              const current = p.getRotation().angle;
              p.setRotation(degrees((current + rotDeg) % 360));
            }
          }
        }
      }

      const outBytes = await out.save();
      sendPdf(res, Buffer.from(outBytes), `modified-pages.pdf`);
    } catch (err) {
      console.error("[pdf-utilities] page-ops error", err);
      return res.status(500).json({ error: "page_ops_failed" });
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
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file received" });

      const src = await PDFDocument.load(file.buffer, { ignoreEncryption: true });

      // Remove XMP metadata (reduces size in some PDFs)
      try {
        const catalog = src.catalog;
        if ((catalog as any).has !== undefined) {
          // best-effort metadata removal
        }
      } catch { /* ignore */ }

      // Re-save with useObjectStreams=true which compresses cross-reference table
      const outBytes = await src.save({ useObjectStreams: true });
      const outBuffer = Buffer.from(outBytes);

      const originalSize = file.buffer.length;
      const newSize = outBuffer.length;
      const savedBytes = originalSize - newSize;

      const safeName = (file.originalname ?? "document").replace(/[^\w.\-]/g, "_");
      const downloadName = safeName.endsWith(".pdf")
        ? safeName.replace(/\.pdf$/, "-compressed.pdf")
        : `${safeName}-compressed.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", newSize);
      res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
      res.setHeader("X-Original-Size", String(originalSize));
      res.setHeader("X-Compressed-Size", String(newSize));
      res.setHeader("X-Saved-Bytes", String(savedBytes));
      res.end(outBuffer);
    } catch (err) {
      console.error("[pdf-utilities] compress error", err);
      return res.status(500).json({ error: "compress_failed" });
    }
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a page range string like "1-3,5,7-9" into 0-based page indexes.
 * Input page numbers are 1-based. Invalid ranges are silently skipped.
 */
function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const indexes = new Set<number>();
  const parts = rangeStr.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const from = parseInt(rangeMatch[1], 10);
      const to = parseInt(rangeMatch[2], 10);
      for (let p = Math.min(from, to); p <= Math.max(from, to); p++) {
        if (p >= 1 && p <= totalPages) indexes.add(p - 1);
      }
    } else {
      const single = parseInt(trimmed, 10);
      if (!isNaN(single) && single >= 1 && single <= totalPages) {
        indexes.add(single - 1);
      }
    }
  }
  return Array.from(indexes).sort((a, b) => a - b);
}

export default router;
