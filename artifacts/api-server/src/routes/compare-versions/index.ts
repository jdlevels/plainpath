// ─── Compare Versions API Routes — Slice 3 ────────────────────────────────────
// Intake + session foundation (Slice 1).
// Dual-pane workspace, streaming, summary, notes (Slice 2).
// Async comparison engine, overlays, polling (Slice 3).
// ──────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import { uploadObject, downloadPdf, isObjectStorageAvailable } from "../../lib/pdfObjectStorage";
import { runComparison } from "../../lib/compareVersionsEngine";

const router = Router();

// ─── Limits ───────────────────────────────────────────────────────────────────
// 50 MB per file — compare-versions handles larger documents than PDF Editor.

const MAX_BYTES_PER_FILE = 50 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES_PER_FILE },
}).fields([
  { name: "originalFile", maxCount: 1 },
  { name: "revisedFile", maxCount: 1 },
]);

// ─── Auth ─────────────────────────────────────────────────────────────────────

function requireAuth(req: any, res: any, next: any) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

// ─── Background scan ──────────────────────────────────────────────────────────
// Fire-and-forget: run the comparison engine and persist the result.
// Must never throw — all errors are caught and recorded as status="error".

async function runBackgroundScan(
  sessionId: string,
  originalBuf: Buffer,
  revisedBuf: Buffer,
): Promise<void> {
  try {
    console.log(`[compare-versions] scan starting for session ${sessionId}`);
    const diffResult = await runComparison(originalBuf, revisedBuf);
    await pool.query(
      `UPDATE compare_versions_sessions
       SET diff_result = $1::jsonb, status = 'complete', scanned_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(diffResult), sessionId],
    );
    console.log(
      `[compare-versions] scan complete for ${sessionId} — ${diffResult.stats.total} items`,
    );
  } catch (err) {
    console.error(`[compare-versions] scan error for ${sessionId}:`, err);
    await pool
      .query(
        `UPDATE compare_versions_sessions
         SET status = 'error', updated_at = NOW()
         WHERE id = $1`,
        [sessionId],
      )
      .catch(() => {});
  }
}

// ─── PDF magic-byte validation ─────────────────────────────────────────────────

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 5 && buf.slice(0, 5).toString("ascii") === "%PDF-";
}

// ─── POST /api/compare-versions/sessions ─────────────────────────────────────
// Accept originalFile + revisedFile (multipart/form-data).
// Both must be application/pdf. Max 50 MB each.
// Upload to object storage under compare-versions/{userId}/{sessionId}/.
// Insert session record and return minimal session metadata.

router.post(
  "/sessions",
  requireAuth,
  (req: any, res: any, next: any) => {
    upload(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: "file_too_large",
            message: "Each file must be 50 MB or smaller.",
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            error: "upload_field_error",
            message: "Unexpected file field. Use originalFile and revisedFile.",
          });
        }
        return res.status(400).json({ error: "upload_error", message: err.message });
      }
      next();
    });
  },
  async (req: any, res: any) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;

      const originalFile = files?.["originalFile"]?.[0];
      const revisedFile = files?.["revisedFile"]?.[0];

      // Both files required
      if (!originalFile && !revisedFile) {
        return res.status(400).json({
          error: "files_required",
          message: "Both originalFile and revisedFile are required.",
        });
      }
      if (!originalFile) {
        return res.status(400).json({
          error: "original_required",
          message: "originalFile is required.",
        });
      }
      if (!revisedFile) {
        return res.status(400).json({
          error: "revised_required",
          message: "revisedFile is required.",
        });
      }

      // PDF-only validation — V1 rejects docx, txt, images explicitly
      const origMime = originalFile.mimetype.toLowerCase();
      const revMime = revisedFile.mimetype.toLowerCase();
      const origName = (originalFile.originalname || "").toLowerCase();
      const revName = (revisedFile.originalname || "").toLowerCase();

      function rejectNonPdf(mime: string, name: string, label: string) {
        if (name.endsWith(".docx") || mime.includes("wordprocessingml")) {
          return `${label}: Word (.docx) files are not yet supported — PDF only in this version. Word support coming soon.`;
        }
        if (name.endsWith(".txt") || mime === "text/plain") {
          return `${label}: Plain text files are not accepted — please upload a PDF.`;
        }
        if (mime.startsWith("image/")) {
          return `${label}: Image files are not accepted — please upload a PDF.`;
        }
        if (mime !== "application/pdf" && !name.endsWith(".pdf")) {
          return `${label}: Only PDF files are accepted in this version.`;
        }
        return null;
      }

      const origRejection = rejectNonPdf(origMime, origName, "Original document");
      if (origRejection) {
        return res.status(422).json({ error: "invalid_file_type", message: origRejection });
      }

      const revRejection = rejectNonPdf(revMime, revName, "Revised document");
      if (revRejection) {
        return res.status(422).json({ error: "invalid_file_type", message: revRejection });
      }

      // Magic-byte check
      if (!isPdfBuffer(originalFile.buffer)) {
        return res.status(422).json({
          error: "invalid_pdf",
          message: "Original document does not appear to be a valid PDF.",
        });
      }
      if (!isPdfBuffer(revisedFile.buffer)) {
        return res.status(422).json({
          error: "invalid_pdf",
          message: "Revised document does not appear to be a valid PDF.",
        });
      }

      // Derive title
      const title =
        (req.body?.title as string | undefined)?.trim() ||
        `${originalFile.originalname} vs ${revisedFile.originalname}`;

      // Parse manager notes if provided
      let managerNotes: any = { freeform: "", watchlist: [] };
      if (req.body?.managerNotes) {
        try {
          managerNotes = JSON.parse(req.body.managerNotes);
        } catch {
          // silently ignore malformed notes — default to empty
        }
      }

      // Pre-generate session id for storage paths
      const sessionIdResult = await pool.query(
        "SELECT gen_random_uuid()::text AS id",
      );
      const sessionId: string = sessionIdResult.rows[0].id;

      // ── Object storage ────────────────────────────────────────────────────────
      // Paths: compare-versions/{userId}/{sessionId}/original.pdf + revised.pdf
      // If storage unavailable: store storage_key as placeholder sentinel and
      // note that retrieval will fail until storage is configured.

      let originalStorageKey = `compare-versions/${req.userId}/${sessionId}/original.pdf`;
      let revisedStorageKey = `compare-versions/${req.userId}/${sessionId}/revised.pdf`;

      if (isObjectStorageAvailable()) {
        const uploadedOrig = await uploadObject(originalStorageKey, originalFile.buffer);
        const uploadedRev = await uploadObject(revisedStorageKey, revisedFile.buffer);
        if (!uploadedOrig || !uploadedRev) {
          return res.status(500).json({
            error: "storage_error",
            message: "Failed to upload documents. Please try again.",
          });
        }
      }
      // When object storage is not available, we still record the intended key.
      // Slice 2 rendering will fail gracefully in that environment.

      // ── DB insert ─────────────────────────────────────────────────────────────
      const result = await pool.query(
        `INSERT INTO compare_versions_sessions
           (id, user_id, title,
            original_storage_key, original_file_name,
            revised_storage_key, revised_file_name,
            status, manager_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
         RETURNING
           id, title, status,
           original_file_name, revised_file_name,
           created_at, updated_at`,
        [
          sessionId,
          req.userId,
          title,
          originalStorageKey,
          originalFile.originalname,
          revisedStorageKey,
          revisedFile.originalname,
          "scanning",
          JSON.stringify(managerNotes),
        ],
      );

      const row = result.rows[0];

      // Fire background scan (no await — returns 201 immediately)
      const origBuf = Buffer.from(originalFile.buffer);
      const revBuf = Buffer.from(revisedFile.buffer);
      runBackgroundScan(sessionId, origBuf, revBuf).catch(() => {});

      return res.status(201).json({
        id: row.id,
        title: row.title,
        status: row.status,
        originalFileName: row.original_file_name,
        revisedFileName: row.revised_file_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch (err: any) {
      console.error("[compare-versions] create session error", err);
      return res.status(500).json({ error: "server_error", message: "Something went wrong. Please try again." });
    }
  },
);

// ─── GET /api/compare-versions/sessions ──────────────────────────────────────
// List the current user's sessions, most recent first.

router.get("/sessions", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT
         id, title, status,
         original_file_name, revised_file_name,
         created_at, updated_at
       FROM compare_versions_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId],
    );

    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        originalFileName: row.original_file_name,
        revisedFileName: row.revised_file_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    );
  } catch (err) {
    console.error("[compare-versions] list sessions error", err);
    return res.status(500).json({ error: "server_error", message: "Something went wrong." });
  }
});

// ─── GET /api/compare-versions/sessions/:id ──────────────────────────────────
// Return one session's metadata including manager_notes.
// No rendering, no diff processing.

router.get("/sessions/:id", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT
         id, title, status,
         original_storage_key, original_file_name, original_page_count,
         revised_storage_key, revised_file_name, revised_page_count,
         manager_notes, diff_result, scanned_at, created_at, updated_at
       FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found", message: "Session not found." });
    }

    const row = result.rows[0];
    return res.json({
      id: row.id,
      title: row.title,
      status: row.status,
      originalStorageKey: row.original_storage_key,
      originalFileName: row.original_file_name,
      originalPageCount: row.original_page_count,
      revisedStorageKey: row.revised_storage_key,
      revisedFileName: row.revised_file_name,
      revisedPageCount: row.revised_page_count,
      managerNotes: row.manager_notes ?? { freeform: "", watchlist: [] },
      diffResult: row.diff_result ?? null,
      scannedAt: row.scanned_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("[compare-versions] get session error", err);
    return res.status(500).json({ error: "server_error", message: "Something went wrong." });
  }
});

// ─── POST /api/compare-versions/sessions/:id/scan ────────────────────────────
// Re-trigger the comparison scan for an existing session.
// Downloads PDFs from object storage, fires background scan, returns 202.

router.post("/sessions/:id/scan", requireAuth, async (req: any, res: any) => {
  try {
    const sessionResult = await pool.query(
      `SELECT id, status, original_storage_key, revised_storage_key
       FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: "not_found", message: "Session not found." });
    }
    const session = sessionResult.rows[0];
    if (session.status === "scanning") {
      return res.status(409).json({ error: "already_scanning", message: "Scan already in progress." });
    }

    // Set status back to scanning
    await pool.query(
      `UPDATE compare_versions_sessions SET status = 'scanning', updated_at = NOW() WHERE id = $1`,
      [req.params.id],
    );

    // Download and re-scan in background
    (async () => {
      try {
        const [origBuf, revBuf] = await Promise.all([
          downloadPdf(session.original_storage_key),
          downloadPdf(session.revised_storage_key),
        ]);
        await runBackgroundScan(req.params.id, origBuf, revBuf);
      } catch (err) {
        console.error("[compare-versions] rescan download error:", err);
        await pool.query(
          `UPDATE compare_versions_sessions SET status = 'error', updated_at = NOW() WHERE id = $1`,
          [req.params.id],
        ).catch(() => {});
      }
    })().catch(() => {});

    return res.status(202).json({ id: req.params.id, status: "scanning" });
  } catch (err) {
    console.error("[compare-versions] rescan error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/compare-versions/sessions/:id/original ─────────────────────────
// Stream original PDF bytes. Requires auth + session ownership.

router.get("/sessions/:id/original", async (req: any, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const result = await pool.query(
      `SELECT original_storage_key, original_file_name
       FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    const row = result.rows[0];
    if (!row.original_storage_key) {
      return res.status(404).json({ error: "not_uploaded", message: "Original PDF has not been uploaded yet." });
    }
    const buf = await downloadPdf(row.original_storage_key);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(row.original_file_name ?? "original.pdf")}"`,
    );
    return res.end(buf);
  } catch (err: any) {
    console.error("[compare-versions] get original pdf error", err);
    if (err?.message?.includes("Object storage is not configured")) {
      return res.status(503).json({ error: "storage_unavailable", message: "Object storage is not configured." });
    }
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/compare-versions/sessions/:id/revised ──────────────────────────
// Stream revised PDF bytes. Requires auth + session ownership.

router.get("/sessions/:id/revised", async (req: any, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const result = await pool.query(
      `SELECT revised_storage_key, revised_file_name
       FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    const row = result.rows[0];
    if (!row.revised_storage_key) {
      return res.status(404).json({ error: "not_uploaded", message: "Revised PDF has not been uploaded yet." });
    }
    const buf = await downloadPdf(row.revised_storage_key);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(row.revised_file_name ?? "revised.pdf")}"`,
    );
    return res.end(buf);
  } catch (err: any) {
    console.error("[compare-versions] get revised pdf error", err);
    if (err?.message?.includes("Object storage is not configured")) {
      return res.status(503).json({ error: "storage_unavailable", message: "Object storage is not configured." });
    }
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/compare-versions/sessions/:id/review ─────────────────────────
// Persist manager severity overrides and any other diff_result mutations.
// Body: { diffResult: CVDiffResult }
// Does NOT re-run the engine — only updates the stored JSONB.

router.patch("/sessions/:id/review", async (req: any, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const { diffResult } = req.body ?? {};
    if (!diffResult || typeof diffResult !== "object") {
      return res
        .status(400)
        .json({ error: "invalid_body", message: "diffResult is required." });
    }
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET diff_result = $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, updated_at`,
      [JSON.stringify(diffResult), req.params.id, userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    const row = result.rows[0];
    return res.json({ id: row.id, updatedAt: row.updated_at });
  } catch (err) {
    console.error("[compare-versions] patch review error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/compare-versions/sessions/:id/notes ──────────────────────────
// Replace manager_notes (freeform + watchlist + notes). Safe Slice 2/4 edit.

router.patch("/sessions/:id/notes", async (req: any, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const notes = req.body?.managerNotes;
    if (!notes || typeof notes !== "object") {
      return res.status(400).json({ error: "invalid_body", message: "managerNotes is required." });
    }
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET manager_notes = $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, manager_notes, updated_at`,
      [JSON.stringify(notes), req.params.id, userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found" });
    }
    const row = result.rows[0];
    return res.json({
      id: row.id,
      managerNotes: row.manager_notes,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("[compare-versions] patch notes error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
