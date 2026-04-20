// ─── PDF Editor API Routes ─────────────────────────────────────────────────────
// Slice 2: session CRUD + op persistence
// Deferred: export/download, page ops, My Documents integration
// ──────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";

const router = Router();

// ─── File size / type limits ──────────────────────────────────────────────────
// 20 MB cap. PDF-only. Stored in memory as Buffer, then written to bytea.

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

// ─── POST /api/pdf-editor/sessions ───────────────────────────────────────────
// Upload a PDF → create session → return { id, fileName, fileSizeBytes, createdAt }

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

      const result = await pool.query(
        `INSERT INTO pdf_editor_sessions
           (user_id, file_name, file_size_bytes, pdf_bytes, ops)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, file_name, file_size_bytes, created_at`,
        [req.userId, fileName, file.size, file.buffer, JSON.stringify([])],
      );

      const row = result.rows[0];
      return res.status(201).json({
        id: row.id,
        fileName: row.file_name,
        fileSizeBytes: row.file_size_bytes,
        createdAt: row.created_at,
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
// List user sessions (minimal: id, fileName, fileSizeBytes, pageCount, updatedAt)

router.get("/sessions", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, file_name, file_size_bytes, page_count, updated_at
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
      })),
    );
  } catch (err) {
    console.error("[pdf-editor] list sessions error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/pdf-editor/sessions/:id ────────────────────────────────────────
// Session metadata + ops. No pdf_bytes.

router.get("/sessions/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, file_name, file_size_bytes, page_count, ops, created_at, updated_at
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
    });
  } catch (err) {
    console.error("[pdf-editor] get session error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/pdf-editor/sessions/:id/pdf ────────────────────────────────────
// Stream raw PDF bytes. Content-Type: application/pdf.

router.get("/sessions/:id/pdf", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT file_name, pdf_bytes
       FROM pdf_editor_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    const { file_name, pdf_bytes } = result.rows[0];
    const buf: Buffer = pdf_bytes;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(file_name)}"`,
    );
    return res.end(buf);
  } catch (err) {
    console.error("[pdf-editor] get pdf error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/pdf-editor/sessions/:id/ops ──────────────────────────────────
// Replace ops array. Body: { ops: EditOp[] }

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
// Set page count once (only when null). Body: { pageCount: number }

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

export default router;
