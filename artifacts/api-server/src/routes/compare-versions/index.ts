// ─── Compare Versions API Routes — Slices 1–6 ─────────────────────────────────
// Slice 1: Intake + session foundation.
// Slice 2: Dual-pane workspace, streaming, summary, notes.
// Slice 3: Async comparison engine, overlays, polling.
// Slice 4: Group zones, severity override, notes CRUD.
// Slice 5: AI semantic enrichment (post-scan async pass).
// Slice 6: Audit export, PDF Editor handoff, session management (rename/archive/delete).
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  uploadObject,
  downloadPdf,
  isObjectStorageAvailable,
  uploadPdf,
  resolvePdfBytes,
} from "../../lib/pdfObjectStorage";
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
// ?archived=true  → return only archived sessions
// ?archived=false (default) → return only non-archived sessions
// Includes diff stats extracted from diff_result JSONB.

router.get("/sessions", requireAuth, async (req: any, res: any) => {
  try {
    const showArchived = req.query.archived === "true";
    const result = await pool.query(
      `SELECT
         id, title, status,
         original_file_name, revised_file_name,
         archived_at, created_at, updated_at,
         (diff_result->'stats'->>'total')::int   AS diff_total,
         (diff_result->'stats'->>'high')::int    AS diff_high,
         (diff_result->'stats'->>'medium')::int  AS diff_medium,
         (diff_result->'stats'->>'low')::int     AS diff_low
       FROM compare_versions_sessions
       WHERE user_id = $1 AND (archived_at IS ${showArchived ? "NOT NULL" : "NULL"})
       ORDER BY updated_at DESC`,
      [req.userId],
    );
    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        originalFileName: row.original_file_name,
        revisedFileName: row.revised_file_name,
        archivedAt: row.archived_at ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        diffTotal:  row.diff_total  ?? null,
        diffHigh:   row.diff_high   ?? null,
        diffMedium: row.diff_medium ?? null,
        diffLow:    row.diff_low    ?? null,
      })),
    );
  } catch (err) {
    console.error("[compare-versions] list sessions error", err);
    return res.status(500).json({ error: "server_error", message: "Something went wrong." });
  }
});

// ─── GET /api/compare-versions/sessions/:id ───────────────────────────────────

router.get("/sessions/:id", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT
         id, title, status,
         original_storage_key, original_file_name, original_page_count,
         revised_storage_key, revised_file_name, revised_page_count,
         manager_notes, diff_result, scanned_at,
         ai_status, ai_enriched_at,
         archived_at, created_at, updated_at
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
      archivedAt: row.archived_at ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("[compare-versions] get session error", err);
    return res.status(500).json({ error: "server_error", message: "Something went wrong." });
  }
});

// ─── PATCH /api/compare-versions/sessions/:id/rename ──────────────────────────
// Slice 6: Rename a session title.

router.patch("/sessions/:id/rename", requireAuth, async (req: any, res: any) => {
  try {
    const title = (req.body?.title as string | undefined)?.trim();
    if (!title) {
      return res.status(400).json({ error: "title_required", message: "title is required." });
    }
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET title = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, title, updated_at`,
      [title, req.params.id, req.userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];
    return res.json({ id: row.id, title: row.title, updatedAt: row.updated_at });
  } catch (err) {
    console.error("[compare-versions] rename error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/compare-versions/sessions/:id/archive ─────────────────────────
// Slice 6: Toggle archive state. Body: { archived: boolean }

router.patch("/sessions/:id/archive", requireAuth, async (req: any, res: any) => {
  try {
    const archived = req.body?.archived === true;
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET archived_at = ${archived ? "NOW()" : "NULL"}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, archived_at, updated_at`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];
    return res.json({ id: row.id, archivedAt: row.archived_at ?? null, updatedAt: row.updated_at });
  } catch (err) {
    console.error("[compare-versions] archive error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── DELETE /api/compare-versions/sessions/:id ────────────────────────────────
// Slice 6: Hard delete. No recovery.

router.delete("/sessions/:id", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `DELETE FROM compare_versions_sessions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    return res.json({ id: req.params.id, deleted: true });
  } catch (err) {
    console.error("[compare-versions] delete error", err);
    return res.status(500).json({ error: "server_error" });
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

// ─── POST /api/compare-versions/sessions/:id/handoff ──────────────────────────
// Slice 6: Create a PDF Editor session from the revised document.
//
// Handoff contract:
//   Request body: { diffIds?: string[] }   — IDs of diffs to highlight; omit for all
//   Returns:      { pdfEditorSessionId: string }
//
// Storage: A new pdf_editor_sessions row is created using the revised PDF bytes.
// The initial ops array contains yellow highlight overlays for every selected diff
// that has a valid rect_revised and page_revised.
// PDF Editor opens /pdf-editor/:pdfEditorSessionId?fromCompare=1 so the workspace
// can show a contextual banner.

router.post("/sessions/:id/handoff", requireAuth, async (req: any, res: any) => {
  try {
    const cvResult = await pool.query(
      `SELECT
         id, title, revised_storage_key, revised_file_name, revised_page_count,
         diff_result, status
       FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!cvResult.rows.length) {
      return res.status(404).json({ error: "not_found", message: "Session not found." });
    }
    const cvRow = cvResult.rows[0];

    if (cvRow.status !== "complete") {
      return res.status(409).json({
        error: "not_complete",
        message: "Comparison must be complete before opening in PDF Editor.",
      });
    }

    if (!cvRow.revised_storage_key) {
      return res.status(409).json({ error: "no_revised", message: "Revised document not available." });
    }

    // Download the revised PDF
    const revisedBuf = await downloadPdf(cvRow.revised_storage_key);

    // Determine which diff items to highlight
    const diffResult = cvRow.diff_result as any;
    const allItems: any[] = diffResult?.items ?? [];
    const requestedIds: string[] | undefined = Array.isArray(req.body?.diffIds)
      ? req.body.diffIds
      : undefined;

    const itemsToHighlight = requestedIds
      ? allItems.filter((item: any) => requestedIds.includes(item.id))
      : allItems;

    // Build initial highlight ops for the PDF Editor workspace
    const SEV_COLOR: Record<string, string> = {
      high:   "#fca5a5", // red-300
      medium: "#fcd34d", // amber-300
      low:    "#6ee7b7", // emerald-300
    };

    const initialOps: any[] = [];
    for (const item of itemsToHighlight) {
      if (item.rect_revised && item.page_revised != null) {
        const pageIndex = Math.max(0, item.page_revised - 1); // engine is 1-indexed
        initialOps.push({
          id: `cv-${item.id}`,
          kind: "highlight",
          pageIndex,
          x: item.rect_revised.x,
          y: item.rect_revised.y,
          w: item.rect_revised.w,
          h: item.rect_revised.h,
          highlightColor: SEV_COLOR[item.severity] ?? "#fcd34d",
          opacity: 0.35,
        });
      }
    }

    // Create a PDF Editor session with the revised PDF
    const pdfEditorIdResult = await pool.query("SELECT gen_random_uuid()::text AS id");
    const pdfEditorSessionId: string = pdfEditorIdResult.rows[0].id;

    let pdfStorageKey: string | null = null;
    let pdfBytesValue: Buffer | null = revisedBuf;

    if (isObjectStorageAvailable()) {
      pdfStorageKey = await uploadPdf(req.userId, pdfEditorSessionId, revisedBuf);
      if (pdfStorageKey) pdfBytesValue = null;
    }

    const fileName = cvRow.revised_file_name || "revised.pdf";

    await pool.query(
      `INSERT INTO pdf_editor_sessions
         (id, user_id, file_name, file_size_bytes, pdf_bytes, pdf_storage_key, ops)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        pdfEditorSessionId,
        req.userId,
        fileName,
        revisedBuf.length,
        pdfBytesValue,
        pdfStorageKey,
        JSON.stringify(initialOps),
      ],
    );

    console.log(
      `[compare-versions] handoff: created pdf-editor session ${pdfEditorSessionId} ` +
      `from cv session ${req.params.id} with ${initialOps.length} highlight ops`,
    );

    return res.status(201).json({
      pdfEditorSessionId,
      highlightCount: initialOps.length,
    });
  } catch (err: any) {
    console.error("[compare-versions] handoff error", err);
    if (err?.message?.includes("Object storage is not configured")) {
      return res.status(503).json({ error: "storage_unavailable", message: "Object storage is not configured." });
    }
    return res.status(500).json({ error: "server_error", message: "Something went wrong." });
  }
});

// ─── GET /api/compare-versions/sessions/:id/export ────────────────────────────
// Slice 6: Generate a PDF audit report from the persisted session state.
// Report sections:
//   1. Title + session metadata
//   2. Severity summary counts
//   3. Change list with page refs, severity, AI category/explanation
//   4. Manager notes (freeform + watchlist)

router.get("/sessions/:id/export", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT
         id, title, status,
         original_file_name, revised_file_name,
         manager_notes, diff_result, scanned_at, created_at
       FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "not_found", message: "Session not found." });
    }
    const row = result.rows[0];

    if (row.status !== "complete" && row.status !== "error") {
      return res.status(409).json({
        error: "not_ready",
        message: "Scan must complete before exporting.",
      });
    }

    const diffResult = row.diff_result as any;
    const items: any[] = diffResult?.items ?? [];
    const stats = diffResult?.stats ?? { total: 0, high: 0, medium: 0, low: 0 };
    const notes = row.manager_notes as any ?? {};
    const freeformText: string = notes.freeform ?? "";
    const watchlist: any[] = notes.watchlist ?? [];

    // ── Build PDF report with pdf-lib ──────────────────────────────────────

    const pdfDoc = await PDFDocument.create();
    const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const PAGE_W = 595.28; // A4
    const PAGE_H = 841.89;
    const MARGIN = 52;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    const TEAL  = rgb(0.08, 0.72, 0.64);
    const RED   = rgb(0.85, 0.15, 0.15);
    const AMBER = rgb(0.87, 0.60, 0.05);
    const GRAY  = rgb(0.45, 0.45, 0.45);
    const LGRAY = rgb(0.85, 0.85, 0.85);
    const BLACK = rgb(0.08, 0.08, 0.08);

    function newPage(): { page: any; y: number } {
      const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      return { page, y: PAGE_H - MARGIN };
    }

    function drawText(
      page: any,
      text: string,
      x: number,
      y: number,
      opts: { size?: number; font?: any; color?: any; maxWidth?: number } = {},
    ): number {
      const size  = opts.size ?? 10;
      const font  = opts.font ?? fontNormal;
      const color = opts.color ?? BLACK;
      const maxW  = opts.maxWidth ?? CONTENT_W;
      // Simple word-wrap
      const words = text.split(" ");
      let line = "";
      let cy = y;
      const lineHeight = size * 1.45;
      for (const word of words) {
        const trial = line ? `${line} ${word}` : word;
        const tw = font.widthOfTextAtSize(trial, size);
        if (tw > maxW && line) {
          page.drawText(line, { x, y: cy, size, font, color });
          cy -= lineHeight;
          line = word;
        } else {
          line = trial;
        }
      }
      if (line) {
        page.drawText(line, { x, y: cy, size, font, color });
        cy -= lineHeight;
      }
      return cy; // next y position
    }

    function drawLine(page: any, y: number, color = LGRAY) {
      page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color });
    }

    function checkNewPage(y: number, needed = 40): { page: any; y: number } | null {
      if (y < MARGIN + needed) return newPage();
      return null;
    }

    // ── Page 1: Header ─────────────────────────────────────────────────────

    let { page, y } = newPage();

    // Header bar
    page.drawRectangle({ x: 0, y: PAGE_H - 72, width: PAGE_W, height: 72, color: rgb(0.06, 0.08, 0.12) });
    page.drawText("PlainPath", { x: MARGIN, y: PAGE_H - 38, size: 18, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Comparison Audit Report", { x: MARGIN, y: PAGE_H - 56, size: 10, font: fontNormal, color: rgb(0.6, 0.65, 0.75) });

    y = PAGE_H - 95;

    // Session title
    y = drawText(page, row.title || "Untitled Comparison", MARGIN, y, { size: 16, font: fontBold, color: rgb(0.08, 0.08, 0.12) });
    y -= 6;

    // Meta row
    const scanDate = row.scanned_at
      ? new Date(row.scanned_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date(row.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    y = drawText(page, `Scan date: ${scanDate}`, MARGIN, y, { size: 9, color: GRAY });
    y = drawText(page, `Original:  ${row.original_file_name}`, MARGIN, y, { size: 9, color: GRAY });
    y = drawText(page, `Revised:   ${row.revised_file_name}`, MARGIN, y, { size: 9, color: GRAY });
    y -= 14;
    drawLine(page, y);
    y -= 18;

    // Summary counts
    y = drawText(page, "Summary", MARGIN, y, { size: 13, font: fontBold });
    y -= 4;

    const countBoxW = (CONTENT_W - 12) / 4;
    const countItems = [
      { label: "Total",  value: String(stats.total),  color: BLACK },
      { label: "High",   value: String(stats.high),   color: RED   },
      { label: "Medium", value: String(stats.medium), color: AMBER },
      { label: "Low",    value: String(stats.low),    color: GRAY  },
    ];
    const BOX_H = 44;
    const boxY = y - BOX_H;
    countItems.forEach(({ label, value, color }, i) => {
      const bx = MARGIN + i * (countBoxW + 4);
      page.drawRectangle({ x: bx, y: boxY, width: countBoxW, height: BOX_H, color: rgb(0.96, 0.97, 0.99), borderColor: LGRAY, borderWidth: 0.7 });
      page.drawText(value, { x: bx + 10, y: boxY + BOX_H - 22, size: 18, font: fontBold, color });
      page.drawText(label, { x: bx + 10, y: boxY + 8, size: 8, font: fontNormal, color: GRAY });
    });
    y = boxY - 20;
    drawLine(page, y);
    y -= 18;

    // ── Change list ────────────────────────────────────────────────────────

    y = drawText(page, "Change Details", MARGIN, y, { size: 13, font: fontBold });
    y -= 8;

    const SEV_COLOR_MAP: Record<string, any> = { high: RED, medium: AMBER, low: GRAY };

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const needed = 58;
      if (y < MARGIN + needed) {
        ({ page, y } = newPage());
        y -= 8;
      }

      const num = String(idx + 1).padStart(String(items.length).length, "0");
      const sev = (item.severity ?? "low") as string;
      const sevColor = SEV_COLOR_MAP[sev] ?? GRAY;

      // Row background alternate
      page.drawRectangle({
        x: MARGIN - 4, y: y - 38,
        width: CONTENT_W + 8, height: 42,
        color: idx % 2 === 0 ? rgb(0.98, 0.99, 1.0) : rgb(1, 1, 1),
      });

      // Number + severity pill
      page.drawText(`#${num}`, { x: MARGIN, y: y - 12, size: 8, font: fontBold, color: GRAY });
      const sevLabel = sev.toUpperCase();
      const sevLabelW = fontBold.widthOfTextAtSize(sevLabel, 7);
      page.drawRectangle({ x: MARGIN + 22, y: y - 17, width: sevLabelW + 8, height: 13, color: sevColor, borderRadius: 3 });
      page.drawText(sevLabel, { x: MARGIN + 26, y: y - 14, size: 7, font: fontBold, color: rgb(1, 1, 1) });

      // Page reference
      const pageRef = item.page_revised != null ? `p.${item.page_revised}` : item.page_original != null ? `p.${item.page_original}` : "";
      if (pageRef) {
        page.drawText(pageRef, { x: PAGE_W - MARGIN - 30, y: y - 12, size: 8, font: fontNormal, color: GRAY });
      }

      // Change type label
      const ctLabel = (item.change_type ?? "").replace(/_/g, " ");
      y = drawText(page, ctLabel, MARGIN + 60, y - 3, { size: 9, font: fontBold, color: BLACK, maxWidth: CONTENT_W - 90 });

      // AI category
      if (item.ai_category) {
        const catLabel = item.ai_category.replace(/_/g, " ");
        y = drawText(page, `AI: ${catLabel}`, MARGIN + 60, y + 2, { size: 8, color: GRAY, maxWidth: CONTENT_W - 90 });
      }

      // Original / revised text
      if (item.original_text || item.revised_text) {
        const origSnip = (item.original_text ?? "").slice(0, 110).trim();
        const revSnip  = (item.revised_text  ?? "").slice(0, 110).trim();
        if (origSnip) {
          y = drawText(page, `— ${origSnip}`, MARGIN + 4, y, { size: 7.5, font: fontOblique, color: GRAY, maxWidth: CONTENT_W - 8 });
        }
        if (revSnip) {
          y = drawText(page, `+ ${revSnip}`, MARGIN + 4, y + 2, { size: 7.5, font: fontOblique, color: TEAL, maxWidth: CONTENT_W - 8 });
        }
      }

      // AI explanation
      if (item.ai_explanation) {
        y = drawText(page, item.ai_explanation.slice(0, 200), MARGIN + 4, y, { size: 7.5, color: rgb(0.3, 0.3, 0.35), maxWidth: CONTENT_W - 8 });
      }

      y -= 8;
    }

    if (items.length === 0) {
      y = drawText(page, "No changes detected in this comparison.", MARGIN, y, { size: 10, color: GRAY });
      y -= 8;
    }

    // ── Manager Notes ──────────────────────────────────────────────────────

    const hasFreeform = freeformText.trim().length > 0;
    const hasWatchlist = watchlist.length > 0;

    if (hasFreeform || hasWatchlist) {
      if (y < MARGIN + 80) ({ page, y } = newPage());
      drawLine(page, y);
      y -= 18;
      y = drawText(page, "Manager Notes", MARGIN, y, { size: 13, font: fontBold });
      y -= 8;

      if (hasFreeform) {
        y = drawText(page, "Freeform notes:", MARGIN, y, { size: 9, font: fontBold });
        y = drawText(page, freeformText.trim(), MARGIN + 4, y, { size: 9, color: GRAY, maxWidth: CONTENT_W - 8 });
        y -= 6;
      }

      if (hasWatchlist) {
        y = drawText(page, "Watchlist:", MARGIN, y, { size: 9, font: fontBold });
        y -= 4;
        for (const w of watchlist) {
          if (y < MARGIN + 30) ({ page, y } = newPage());
          const resolvedMark = w.resolved ? "[✓]" : "[ ]";
          const sevTag = w.severity ? ` [${String(w.severity).toUpperCase()}]` : "";
          y = drawText(page, `${resolvedMark}${sevTag} ${w.text ?? ""}`, MARGIN + 4, y, { size: 9, color: w.resolved ? GRAY : BLACK, maxWidth: CONTENT_W - 8 });
          y -= 2;
        }
      }
    }

    // ── Footer on all pages ────────────────────────────────────────────────

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    for (let pi = 0; pi < totalPages; pi++) {
      const pg = pages[pi];
      const footerY = MARGIN - 22;
      pg.drawText(`PlainPath · Compare Versions Audit  |  ${scanDate}`, {
        x: MARGIN, y: footerY, size: 7.5, font: fontNormal, color: GRAY,
      });
      pg.drawText(`Page ${pi + 1} of ${totalPages}`, {
        x: PAGE_W - MARGIN - 50, y: footerY, size: 7.5, font: fontNormal, color: GRAY,
      });
    }

    const pdfBytes = await pdfDoc.save();

    // Filename: compare-audit-{id-short}-{yyyy-mm-dd}.pdf
    const dateStr = new Date().toISOString().slice(0, 10);
    const shortId = (row.id as string).slice(0, 8);
    const downloadName = `compare-audit-${shortId}-${dateStr}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBytes.length);
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    return res.end(Buffer.from(pdfBytes));
  } catch (err: any) {
    console.error("[compare-versions] export error", err);
    return res.status(500).json({ error: "server_error", message: "Failed to generate report." });
  }
});

export default router;
