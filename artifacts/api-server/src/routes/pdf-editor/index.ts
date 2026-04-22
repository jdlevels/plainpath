// ─── PDF Editor API Routes ─────────────────────────────────────────────────────
// Slice 2: session CRUD + op persistence
// Slice 3: export/download (apply ops with pdf-lib, return modified PDF)
// Slice 4: object storage migration for source PDFs (additive, bytea legacy OK)
// Slice 5: PDF classification at upload + OCR foundation + rename/delete
// ──────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  uploadPdf,
  resolvePdfBytes,
  isObjectStorageAvailable,
  deletePdf,
} from "../../lib/pdfObjectStorage";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ─── File size / type limits ──────────────────────────────────────────────────

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

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

// ─── Auth ─────────────────────────────────────────────────────────────────────

function requireAuth(req: any, res: any, next: any) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

// ─── PDF classification helper ────────────────────────────────────────────────
// Returns "text" | "scanned" | "mixed" | "unknown".
// Uses pdf-parse to attempt text extraction; checks text density vs page count.

async function classifyPdf(
  buffer: Buffer,
): Promise<"text" | "scanned" | "mixed" | "unknown"> {
  try {
    const pdfMod = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse: (buf: Buffer) => Promise<{ text: string; numpages: number }> =
      (pdfMod as any).default ?? (pdfMod as any);
    const result = await pdfParse(buffer);
    const text = result.text ?? "";
    const pages = result.numpages ?? 1;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const wordsPerPage = wordCount / Math.max(1, pages);
    if (wordsPerPage >= 15) return "text";
    if (wordsPerPage >= 2) return "mixed";
    return "scanned";
  } catch {
    return "unknown";
  }
}

// ─── POST /api/pdf-editor/sessions ───────────────────────────────────────────
// Upload a PDF → classify → create session → return { id, fileName, fileSizeBytes, createdAt, pdfType }

router.post(
  "/sessions",
  requireAuth,
  upload.single("file"),
  async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file received" });
      }

      // Extra validation: check PDF magic bytes (%PDF-)
      if (
        file.buffer.length < 5 ||
        file.buffer.slice(0, 5).toString("ascii") !== "%PDF-"
      ) {
        return res
          .status(422)
          .json({ error: "File does not appear to be a valid PDF" });
      }

      const fileName =
        (req.body?.fileName as string | undefined)?.trim() ||
        file.originalname ||
        "Untitled.pdf";

      // Classify PDF (non-blocking fallback to "unknown")
      const pdfType = await classifyPdf(file.buffer).catch(() => "unknown");

      // Generate session id up-front
      const sessionIdResult = await pool.query(
        `SELECT gen_random_uuid()::text AS id`,
      );
      const sessionId: string = sessionIdResult.rows[0].id;

      // ── Object storage path (Slice 4) ─────────────────────────────────────
      let pdfStorageKey: string | null = null;
      let pdfBytesValue: Buffer | null = file.buffer;

      if (isObjectStorageAvailable()) {
        pdfStorageKey = await uploadPdf(req.userId, sessionId, file.buffer);
        if (pdfStorageKey) {
          pdfBytesValue = null;
        }
      }

      const result = await pool.query(
        `INSERT INTO pdf_editor_sessions
           (id, user_id, file_name, file_size_bytes, pdf_bytes, pdf_storage_key, ops, pdf_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, file_name, file_size_bytes, created_at, pdf_type`,
        [
          sessionId,
          req.userId,
          fileName,
          file.size,
          pdfBytesValue,
          pdfStorageKey,
          JSON.stringify([]),
          pdfType,
        ],
      );

      const row = result.rows[0];
      return res.status(201).json({
        id: row.id,
        fileName: row.file_name,
        fileSizeBytes: row.file_size_bytes,
        createdAt: row.created_at,
        pdfType: row.pdf_type,
      });
    } catch (err: any) {
      if (err?.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File exceeds 20 MB limit" });
      }
      console.error("[pdf-editor] create session error", err);
      return res.status(500).json({ error: "server_error" });
    }
  },
);

// ─── GET /api/pdf-editor/sessions ────────────────────────────────────────────

router.get("/sessions", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, file_name, file_size_bytes, page_count, updated_at, pdf_type,
              ocr_data IS NOT NULL AS has_ocr,
              jsonb_array_length(ops) AS op_count
       FROM pdf_editor_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 50`,
      [req.userId],
    );
    return res.json(
      result.rows.map((r) => ({
        id: r.id,
        fileName: r.file_name,
        fileSizeBytes: r.file_size_bytes,
        pageCount: r.page_count,
        updatedAt: r.updated_at,
        pdfType: r.pdf_type ?? "unknown",
        hasOcr: r.has_ocr ?? false,
        opCount: r.op_count ?? 0,
      })),
    );
  } catch (err) {
    console.error("[pdf-editor] list sessions error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/pdf-editor/sessions/:id ────────────────────────────────────────

router.get("/sessions/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, file_name, file_size_bytes, page_count, ops, created_at, updated_at, pdf_type, ocr_data
       FROM pdf_editor_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    const r = result.rows[0];
    return res.json({
      id: r.id,
      fileName: r.file_name,
      fileSizeBytes: r.file_size_bytes,
      pageCount: r.page_count,
      ops: r.ops ?? [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      pdfType: r.pdf_type ?? "unknown",
      ocrData: r.ocr_data ?? null,
    });
  } catch (err) {
    console.error("[pdf-editor] get session error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/pdf-editor/sessions/:id/pdf ────────────────────────────────────

router.get("/sessions/:id/pdf", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT file_name, pdf_bytes, pdf_storage_key
       FROM pdf_editor_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }

    const row = result.rows[0];
    const buf = await resolvePdfBytes(row);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(row.file_name)}"`,
    );
    return res.end(buf);
  } catch (err) {
    console.error("[pdf-editor] get pdf error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/pdf-editor/sessions/:id/ops ──────────────────────────────────

router.patch("/sessions/:id/ops", requireAuth, async (req: any, res) => {
  try {
    const { ops } = req.body;
    if (!Array.isArray(ops)) {
      return res.status(400).json({ error: "ops must be an array" });
    }
    const result = await pool.query(
      `UPDATE pdf_editor_sessions
       SET ops = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING updated_at`,
      [JSON.stringify(ops), req.params.id, req.userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.json({ updatedAt: result.rows[0].updated_at });
  } catch (err) {
    console.error("[pdf-editor] save ops error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/pdf-editor/sessions/:id/page-count ───────────────────────────

router.patch(
  "/sessions/:id/page-count",
  requireAuth,
  async (req: any, res) => {
    try {
      const { pageCount } = req.body;
      if (typeof pageCount !== "number" || pageCount < 1) {
        return res.status(400).json({ error: "invalid pageCount" });
      }
      await pool.query(
        `UPDATE pdf_editor_sessions
         SET page_count = $1
         WHERE id = $2 AND user_id = $3 AND page_count IS NULL`,
        [pageCount, req.params.id, req.userId],
      );
      return res.json({ ok: true });
    } catch (err) {
      console.error("[pdf-editor] set page count error", err);
      return res.status(500).json({ error: "server_error" });
    }
  },
);

// ─── PATCH /api/pdf-editor/sessions/:id/rename ───────────────────────────────

router.patch("/sessions/:id/rename", requireAuth, async (req: any, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName || typeof fileName !== "string" || !fileName.trim()) {
      return res.status(400).json({ error: "fileName is required" });
    }
    const result = await pool.query(
      `UPDATE pdf_editor_sessions
       SET file_name = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id`,
      [fileName.trim(), req.params.id, req.userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("[pdf-editor] rename session error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── DELETE /api/pdf-editor/sessions/:id ─────────────────────────────────────

router.delete("/sessions/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM pdf_editor_sessions
       WHERE id = $1 AND user_id = $2
       RETURNING pdf_storage_key`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    // Best-effort: remove GCS object if present
    const storageKey = result.rows[0].pdf_storage_key;
    if (storageKey) {
      deletePdf(storageKey).catch(() => {});
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("[pdf-editor] delete session error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/pdf-editor/sessions/:id/ocr ───────────────────────────────────
// Accept page images from the client (rendered by pdfjs in-browser), run
// OpenAI Vision OCR per page, store and return results.
// Body: { pages: Array<{ pageIndex: number; imageDataUrl: string }> }

router.post("/sessions/:id/ocr", requireAuth, async (req: any, res) => {
  try {
    const { pages } = req.body;
    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: "pages array is required" });
    }

    // Verify session ownership
    const sessionCheck = await pool.query(
      `SELECT id FROM pdf_editor_sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!sessionCheck.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }

    // Run OCR per page (up to 20 pages to stay within timeout)
    const MAX_PAGES = 20;
    const pagesToProcess = pages.slice(0, MAX_PAGES);
    const ocrPages: Array<{ pageIndex: number; text: string }> = [];

    for (const page of pagesToProcess) {
      const { pageIndex, imageDataUrl } = page;
      if (typeof pageIndex !== "number" || typeof imageDataUrl !== "string") continue;

      try {
        // Strip the data URL prefix to get base64 + media type
        const match = imageDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (!match) continue;
        const [, mediaType, b64] = match;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcribe ALL visible text from this PDF page exactly as it appears. Include every word, number, date, heading, and body text. Preserve paragraph structure with line breaks. If there is no text, respond with '[blank page]'.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType};base64,${b64}`,
                    detail: "high",
                  },
                },
              ],
            },
          ],
        });

        const text = response.choices?.[0]?.message?.content?.trim() ?? "";
        ocrPages.push({ pageIndex, text: text || "[blank page]" });
      } catch (pageErr) {
        console.error(`[pdf-editor] OCR failed for page ${pageIndex}:`, pageErr);
        ocrPages.push({ pageIndex, text: "[OCR failed for this page]" });
      }
    }

    const ocrData = { pages: ocrPages, runAt: new Date().toISOString() };

    // Persist OCR data in session
    await pool.query(
      `UPDATE pdf_editor_sessions SET ocr_data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
      [JSON.stringify(ocrData), req.params.id, req.userId],
    );

    return res.json(ocrData);
  } catch (err) {
    console.error("[pdf-editor] OCR error", err);
    return res.status(500).json({ error: "ocr_failed" });
  }
});

// ─── PATCH /api/pdf-editor/sessions/:id/ocr ──────────────────────────────────
// Save user corrections to OCR data.
// Body: { ocrData: OcrData }

router.patch("/sessions/:id/ocr", requireAuth, async (req: any, res) => {
  try {
    const { ocrData } = req.body;
    if (!ocrData || typeof ocrData !== "object") {
      return res.status(400).json({ error: "ocrData is required" });
    }
    const result = await pool.query(
      `UPDATE pdf_editor_sessions
       SET ocr_data = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id`,
      [JSON.stringify(ocrData), req.params.id, req.userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("[pdf-editor] save OCR edits error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/pdf-editor/sessions/:id/export ─────────────────────────────────

router.get("/sessions/:id/export", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT file_name, pdf_bytes, pdf_storage_key, ops
       FROM pdf_editor_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }

    const row = result.rows[0];
    const pdfBytes = await resolvePdfBytes(row);
    const editOps: any[] = Array.isArray(row.ops) ? row.ops : [];

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const op of editOps) {
      const pageIndex: number = op.pageIndex ?? 0;
      const page = pages[pageIndex];
      if (!page) continue;

      const W = page.getWidth();
      const H = page.getHeight();

      const x = op.x * W;
      const rectH = op.h * H;
      const rectW = op.w * W;
      const y = (1 - op.y - op.h) * H;

      if (op.kind === "mask") {
        page.drawRectangle({
          x, y, width: rectW, height: rectH,
          color: rgb(1, 1, 1), opacity: 1,
        });
      } else if (op.kind === "highlight") {
        const hlColor = hexToRgb(op.highlightColor ?? "#fde68a");
        page.drawRectangle({
          x, y, width: rectW, height: rectH,
          color: hlColor, opacity: op.opacity ?? 0.4,
        });
      } else if (op.kind === "text" && op.text) {
        const rawSize: number = op.fontSize ?? 16;
        // New ops store fontSize as a page-height fraction (0 < v < 1).
        // Legacy ops store absolute screen pixels (v >= 1 — treated as pts
        // because the original default of 16px happened to be acceptable).
        const fontSize: number = rawSize < 1 ? rawSize * H : rawSize;
        const textColor = hexToRgb(op.color ?? "#000000");
        const textY = (1 - op.y) * H - fontSize;
        const textX = x + 4;
        const lines = op.text.split("\n");
        const lineHeight = fontSize * 1.35;
        for (let li = 0; li < lines.length; li++) {
          const line = lines[li];
          if (!line) continue;
          const lineY = textY - li * lineHeight;
          if (lineY < 0) break;
          page.drawText(line, {
            x: textX, y: lineY, size: fontSize,
            font: helvetica, color: textColor,
          });
        }
      }
    }

    const exportedBytes = await pdfDoc.save();
    const exportedBuffer = Buffer.from(exportedBytes);
    const safeName = row.file_name.replace(/[^\w.\-]/g, "_");
    const downloadName = safeName.endsWith(".pdf")
      ? safeName.replace(/\.pdf$/, "-edited.pdf")
      : `${safeName}-edited.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", exportedBuffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    return res.end(exportedBuffer);
  } catch (err) {
    console.error("[pdf-editor] export error", err);
    return res.status(500).json({ error: "export_failed" });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(
    isNaN(r) ? 0 : r,
    isNaN(g) ? 0 : g,
    isNaN(b) ? 0 : b,
  );
}

export default router;
