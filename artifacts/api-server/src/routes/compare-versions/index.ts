// ─── Compare Versions API Routes — Slices 1–5 ─────────────────────────────────
// Slice 1: Intake + session foundation.
// Slice 2: Dual-pane workspace, streaming, summary, notes.
// Slice 3: Async comparison engine, overlays, polling.
// Slice 4: Group zones, severity override, notes CRUD.
// Slice 5: AI semantic enrichment (post-scan async pass).
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import { uploadObject, downloadPdf, isObjectStorageAvailable } from "../../lib/pdfObjectStorage";
import { runComparison } from "../../lib/compareVersionsEngine";
import { runBackgroundEnrich } from "../../lib/compareVersionsEnrichment";

const router = Router();

// ─── Limits ────────────────────────────────────────────────────────────────────

const MAX_BYTES_PER_FILE = 50 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES_PER_FILE },
}).fields([
  { name: "originalFile", maxCount: 1 },
  { name: "revisedFile", maxCount: 1 },
]);

// ─── Auth ──────────────────────────────────────────────────────────────────────

function requireAuth(req: any, res: any, next: any) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

// ─── Background scan ───────────────────────────────────────────────────────────
// Fire-and-forget: run deterministic comparison engine and persist the result.
// After scan completes successfully, kicks off AI enrichment as a separate pass.

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
    // Kick off AI enrichment as a separate async pass — does not block the workspace
    runBackgroundEnrich(sessionId, false).catch((err) =>
      console.error(`[compare-versions] enrichment post-scan error for ${sessionId}:`, err),
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

// ─── PDF magic-byte validation ──────────────────────────────────────────────────

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 5 && buf.slice(0, 5).toString("ascii") === "%PDF-";
}

// ─── POST /api/compare-versions/sessions ──────────────────────────────────────

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

      if (!originalFile && !revisedFile) {
        return res.status(400).json({
          error: "files_required",
          message: "Both originalFile and revisedFile are required.",
        });
      }
      if (!originalFile) {
        return res.status(400).json({ error: "original_required", message: "originalFile is required." });
      }
      if (!revisedFile) {
        return res.status(400).json({ error: "revised_required", message: "revisedFile is required." });
      }

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

      if (!isPdfBuffer(originalFile.buffer)) {
        return res.status(422).json({ error: "invalid_pdf", message: "Original document does not appear to be a valid PDF." });
      }
      if (!isPdfBuffer(revisedFile.buffer)) {
        return res.status(422).json({ error: "invalid_pdf", message: "Revised document does not appear to be a valid PDF." });
      }

      const title =
        (req.body?.title as string | undefined)?.trim() ||
        `${originalFile.originalname} vs ${revisedFile.originalname}`;

      let managerNotes: any = { freeform: "", watchlist: [] };
      if (req.body?.managerNotes) {
        try {
          managerNotes = JSON.parse(req.body.managerNotes);
        } catch {
          // silently ignore malformed notes
        }
      }

      const sessionIdResult = await pool.query("SELECT gen_random_uuid()::text AS id");
      const sessionId: string = sessionIdResult.rows[0].id;

      let originalStorageKey = `compare-versions/${req.userId}/${sessionId}/original.pdf`;
      let revisedStorageKey = `compare-versions/${req.userId}/${sessionId}/revised.pdf`;

      if (isObjectStorageAvailable()) {
        const uploadedOrig = await uploadObject(originalStorageKey, originalFile.buffer);
        const uploadedRev = await uploadObject(revisedStorageKey, revisedFile.buffer);
        if (!uploadedOrig || !uploadedRev) {
          return res.status(500).json({ error: "storage_error", message: "Failed to upload documents. Please try again." });
        }
      }

      const result = await pool.query(
        `INSERT INTO compare_versions_sessions
           (id, user_id, title,
            original_storage_key, original_file_name,
            revised_storage_key, revised_file_name,
            status, manager_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
         RETURNING id, title, status, original_file_name, revised_file_name, created_at, updated_at`,
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

// ─── GET /api/compare-versions/sessions ───────────────────────────────────────

router.get("/sessions", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT id, title, status, original_file_name, revised_file_name, created_at, updated_at
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

// ─── GET /api/compare-versions/sessions/:id ───────────────────────────────────
// Includes ai_status and ai_enriched_at (Slice 5).

router.get("/sessions/:id", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT
         id, title, status,
         original_storage_key, original_file_name, original_page_count,
         revised_storage_key, revised_file_name, revised_page_count,
         manager_notes, diff_result, scanned_at,
         ai_status, ai_enriched_at,
         created_at, updated_at
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
      aiStatus: row.ai_status ?? "idle",
      aiEnrichedAt: row.ai_enriched_at ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("[compare-versions] get session error", err);
    return res.status(500).json({ error: "server_error", message: "Something went wrong." });
  }
});

// ─── POST /api/compare-versions/sessions/:id/scan ─────────────────────────────

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

    await pool.query(
      `UPDATE compare_versions_sessions
       SET status = 'scanning', ai_status = 'idle', updated_at = NOW()
       WHERE id = $1`,
      [req.params.id],
    );

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

// ─── POST /api/compare-versions/sessions/:id/enrich ───────────────────────────
// Slice 5: Manually trigger (or retry) AI enrichment for a completed session.
// forceAll=true in body re-enriches all text items, not just unenriched ones.

router.post("/sessions/:id/enrich", requireAuth, async (req: any, res: any) => {
  try {
    const sessionResult = await pool.query(
      `SELECT id, status, ai_status FROM compare_versions_sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: "not_found", message: "Session not found." });
    }
    const session = sessionResult.rows[0];

    if (session.status !== "complete") {
      return res.status(409).json({
        error: "not_complete",
        message: "Scan must complete before AI enrichment can run.",
      });
    }
    if (session.ai_status === "running") {
      return res.status(409).json({ error: "already_enriching", message: "AI enrichment already in progress." });
    }

    const forceAll = req.body?.forceAll === true;

    // Fire-and-forget enrichment
    runBackgroundEnrich(req.params.id, forceAll).catch((err) =>
      console.error(`[compare-versions] manual enrich error for ${req.params.id}:`, err),
    );

    return res.status(202).json({ id: req.params.id, aiStatus: "running" });
  } catch (err) {
    console.error("[compare-versions] enrich route error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/compare-versions/sessions/:id/original ──────────────────────────

router.get("/sessions/:id/original", async (req: any, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const result = await pool.query(
      `SELECT original_storage_key, original_file_name FROM compare_versions_sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];
    if (!row.original_storage_key) {
      return res.status(404).json({ error: "not_uploaded", message: "Original PDF has not been uploaded yet." });
    }
    const buf = await downloadPdf(row.original_storage_key);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(row.original_file_name ?? "original.pdf")}"`);
    return res.end(buf);
  } catch (err: any) {
    console.error("[compare-versions] get original pdf error", err);
    if (err?.message?.includes("Object storage is not configured")) {
      return res.status(503).json({ error: "storage_unavailable", message: "Object storage is not configured." });
    }
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/compare-versions/sessions/:id/revised ───────────────────────────

router.get("/sessions/:id/revised", async (req: any, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const result = await pool.query(
      `SELECT revised_storage_key, revised_file_name FROM compare_versions_sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];
    if (!row.revised_storage_key) {
      return res.status(404).json({ error: "not_uploaded", message: "Revised PDF has not been uploaded yet." });
    }
    const buf = await downloadPdf(row.revised_storage_key);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(row.revised_file_name ?? "revised.pdf")}"`);
    return res.end(buf);
  } catch (err: any) {
    console.error("[compare-versions] get revised pdf error", err);
    if (err?.message?.includes("Object storage is not configured")) {
      return res.status(503).json({ error: "storage_unavailable", message: "Object storage is not configured." });
    }
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/compare-versions/sessions/:id/review ──────────────────────────

router.patch("/sessions/:id/review", async (req: any, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const { diffResult } = req.body ?? {};
    if (!diffResult || typeof diffResult !== "object") {
      return res.status(400).json({ error: "invalid_body", message: "diffResult is required." });
    }
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET diff_result = $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, updated_at`,
      [JSON.stringify(diffResult), req.params.id, userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];
    return res.json({ id: row.id, updatedAt: row.updated_at });
  } catch (err) {
    console.error("[compare-versions] patch review error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/compare-versions/sessions/:id/notes ───────────────────────────

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
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];
    return res.json({ id: row.id, managerNotes: row.manager_notes, updatedAt: row.updated_at });
  } catch (err) {
    console.error("[compare-versions] patch notes error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
