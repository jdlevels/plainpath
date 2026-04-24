// ─── Compare Versions API Routes — Slices 1–6 ─────────────────────────────────
// Slice 6 (T001–T004): Audit export, session management.
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
} from "../../lib/pdfObjectStorage";
import { runComparison } from "../../lib/compareVersionsEngine";
import { runBackgroundEnrich } from "../../lib/compareVersionsEnrichment";
import { runChangeIntelligence } from "../../lib/compareVersionsIntelligence";

const router = Router();

const MAX_BYTES_PER_FILE = 50 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES_PER_FILE },
}).fields([
  { name: "originalFile", maxCount: 1 },
  { name: "revisedFile", maxCount: 1 },
]);

function requireAuth(req: any, res: any, next: any) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

function resolveUserId(req: any): string | null {
  const { userId } = getAuth(req);
  return userId ?? null;
}

async function runBackgroundScan(
  sessionId: string,
  originalBuf: Buffer,
  revisedBuf: Buffer,
): Promise<void> {
  try {
    console.debug(`[compare-versions] scan starting for session ${sessionId}`);
    const diffResult = await runComparison(originalBuf, revisedBuf);
    await pool.query(
      `UPDATE compare_versions_sessions
       SET diff_result = $1::jsonb, status = 'complete', scanned_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(diffResult), sessionId],
    );
    console.debug(`[compare-versions] scan complete for ${sessionId} — ${diffResult.stats.total} items`);
    runBackgroundEnrich(sessionId, false).catch((err) =>
      console.error(`[compare-versions] enrichment post-scan error for ${sessionId}:`, err),
    );
    runChangeIntelligence(sessionId, originalBuf, revisedBuf).catch((err) =>
      console.error(`[compare-versions] intelligence post-scan error for ${sessionId}:`, err),
    );
  } catch (err) {
    console.error(`[compare-versions] scan error for ${sessionId}:`, err);
    await pool
      .query(`UPDATE compare_versions_sessions SET status = 'error', updated_at = NOW() WHERE id = $1`, [sessionId])
      .catch(() => {});
  }
}

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
          return res.status(413).json({ error: "file_too_large", message: "Each file must be 50 MB or smaller." });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ error: "upload_field_error", message: "Unexpected file field." });
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

      if (!originalFile) return res.status(400).json({ error: "original_required", message: "originalFile is required." });
      if (!revisedFile) return res.status(400).json({ error: "revised_required", message: "revisedFile is required." });

      function rejectNonPdf(mime: string, name: string, label: string) {
        if (name.endsWith(".docx") || mime.includes("wordprocessingml"))
          return `${label}: Word (.docx) files are not yet supported — PDF only.`;
        if (name.endsWith(".txt") || mime === "text/plain")
          return `${label}: Plain text files are not accepted — please upload a PDF.`;
        if (mime.startsWith("image/"))
          return `${label}: Image files are not accepted — please upload a PDF.`;
        if (mime !== "application/pdf" && !name.endsWith(".pdf"))
          return `${label}: Only PDF files are accepted.`;
        return null;
      }

      const origMime = originalFile.mimetype.toLowerCase();
      const revMime  = revisedFile.mimetype.toLowerCase();
      const origName = (originalFile.originalname || "").toLowerCase();
      const revName  = (revisedFile.originalname || "").toLowerCase();

      const origRej = rejectNonPdf(origMime, origName, "Original document");
      if (origRej) return res.status(422).json({ error: "invalid_file_type", message: origRej });
      const revRej = rejectNonPdf(revMime, revName, "Revised document");
      if (revRej) return res.status(422).json({ error: "invalid_file_type", message: revRej });

      if (!isPdfBuffer(originalFile.buffer))
        return res.status(422).json({ error: "invalid_pdf", message: "Original document does not appear to be a valid PDF." });
      if (!isPdfBuffer(revisedFile.buffer))
        return res.status(422).json({ error: "invalid_pdf", message: "Revised document does not appear to be a valid PDF." });

      const title = (req.body?.title as string | undefined)?.trim()
        || `${originalFile.originalname} vs ${revisedFile.originalname}`;

      let managerNotes: any = { freeform: "", watchlist: [] };
      if (req.body?.managerNotes) {
        try { managerNotes = JSON.parse(req.body.managerNotes); } catch { /* ignore */ }
      }

      const sessionIdResult = await pool.query("SELECT gen_random_uuid()::text AS id");
      const sessionId: string = sessionIdResult.rows[0].id;

      const originalStorageKey = `compare-versions/${req.userId}/${sessionId}/original.pdf`;
      const revisedStorageKey  = `compare-versions/${req.userId}/${sessionId}/revised.pdf`;

      if (isObjectStorageAvailable()) {
        const uploadedOrig = await uploadObject(originalStorageKey, originalFile.buffer);
        const uploadedRev  = await uploadObject(revisedStorageKey, revisedFile.buffer);
        if (!uploadedOrig || !uploadedRev)
          return res.status(500).json({ error: "storage_error", message: "Failed to upload documents." });
      }

      const result = await pool.query(
        `INSERT INTO compare_versions_sessions
           (id, user_id, title, original_storage_key, original_file_name,
            revised_storage_key, revised_file_name, status, manager_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
         RETURNING id, title, status, original_file_name, revised_file_name, created_at, updated_at`,
        [sessionId, req.userId, title, originalStorageKey, originalFile.originalname,
         revisedStorageKey, revisedFile.originalname, "scanning", JSON.stringify(managerNotes)],
      );

      const row = result.rows[0];
      runBackgroundScan(sessionId, Buffer.from(originalFile.buffer), Buffer.from(revisedFile.buffer)).catch(() => {});

      return res.status(201).json({
        id: row.id, title: row.title, status: row.status,
        originalFileName: row.original_file_name, revisedFileName: row.revised_file_name,
        archivedAt: null, deletedAt: null, diffTotal: null, diffHigh: null, diffMedium: null, diffLow: null,
        createdAt: row.created_at, updatedAt: row.updated_at,
      });
    } catch (err) {
      console.error("[compare-versions] create session error", err);
      return res.status(500).json({ error: "server_error", message: "Something went wrong." });
    }
  },
);

// ─── GET /api/compare-versions/sessions ───────────────────────────────────────
// Returns all non-deleted sessions belonging to the user.
// ?archived=true  → return only archived sessions
// ?archived=false → return only non-archived sessions (default)
// diff stats extracted from persisted diff_result JSONB.

router.get("/sessions", requireAuth, async (req: any, res: any) => {
  try {
    const showArchived = req.query.archived === "true";
    const result = await pool.query(
      `SELECT
         id, title, status,
         original_file_name, revised_file_name,
         archived_at, deleted_at, created_at, updated_at,
         (diff_result->'stats'->>'total')::int   AS diff_total,
         (diff_result->'stats'->>'high')::int    AS diff_high,
         (diff_result->'stats'->>'medium')::int  AS diff_medium,
         (diff_result->'stats'->>'low')::int     AS diff_low
       FROM compare_versions_sessions
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND (archived_at IS ${showArchived ? "NOT NULL" : "NULL"})
       ORDER BY updated_at DESC`,
      [req.userId],
    );
    return res.json(
      result.rows.map((row) => ({
        id: row.id, title: row.title, status: row.status,
        originalFileName: row.original_file_name, revisedFileName: row.revised_file_name,
        archivedAt: row.archived_at ?? null, deletedAt: row.deleted_at ?? null,
        createdAt: row.created_at, updatedAt: row.updated_at,
        diffTotal: row.diff_total ?? null, diffHigh: row.diff_high ?? null,
        diffMedium: row.diff_medium ?? null, diffLow: row.diff_low ?? null,
      })),
    );
  } catch (err) {
    console.error("[compare-versions] list sessions error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/compare-versions/sessions/:id ───────────────────────────────────

router.get("/sessions/:id", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT id, title, status,
         original_storage_key, original_file_name, original_page_count,
         revised_storage_key, revised_file_name, revised_page_count,
         manager_notes, diff_result, scanned_at,
         ai_status, ai_enriched_at,
         change_intelligence, ci_status,
         archived_at, deleted_at, created_at, updated_at
       FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];

    // Auto-trigger intelligence if scan is done but analysis hasn't run yet
    if (row.status === "complete" && (row.ci_status === "pending" || !row.ci_status)) {
      if (isObjectStorageAvailable()) {
        (async () => {
          try {
            await pool.query(
              `UPDATE compare_versions_sessions SET ci_status = 'running', updated_at = NOW() WHERE id = $1 AND ci_status = 'pending'`,
              [row.id],
            );
            const [origBuf, revBuf] = await Promise.all([
              downloadPdf(row.original_storage_key),
              downloadPdf(row.revised_storage_key),
            ]);
            await runChangeIntelligence(row.id, origBuf, revBuf);
          } catch (err) {
            console.error(`[compare-versions] auto-intelligence error for ${row.id}:`, err);
          }
        })().catch(() => {});
        row.ci_status = "running";
      }
    }

    return res.json({
      id: row.id, title: row.title, status: row.status,
      originalStorageKey: row.original_storage_key, originalFileName: row.original_file_name,
      originalPageCount: row.original_page_count,
      revisedStorageKey: row.revised_storage_key, revisedFileName: row.revised_file_name,
      revisedPageCount: row.revised_page_count,
      managerNotes: row.manager_notes ?? { freeform: "", watchlist: [] },
      diffResult: row.diff_result ?? null, scannedAt: row.scanned_at,
      aiStatus: row.ai_status ?? "idle", aiEnrichedAt: row.ai_enriched_at ?? null,
      changeIntelligence: row.change_intelligence ?? null,
      ciStatus: row.ci_status ?? "pending",
      archivedAt: row.archived_at ?? null, deletedAt: row.deleted_at ?? null,
      createdAt: row.created_at, updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("[compare-versions] get session error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/compare-versions/sessions/:id/rename ──────────────────────────

router.patch("/sessions/:id/rename", requireAuth, async (req: any, res: any) => {
  try {
    const title = (req.body?.title as string | undefined)?.trim();
    if (!title) return res.status(400).json({ error: "title_required" });
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET title = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
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
// Slice 6: Toggle archive. Body: { archived: boolean }
// Archive is the PRIMARY non-destructive removal path.

router.patch("/sessions/:id/archive", requireAuth, async (req: any, res: any) => {
  try {
    const archived = req.body?.archived === true;
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET archived_at = ${archived ? "NOW()" : "NULL"}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
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
// SOFT DELETE — sets deleted_at. Row is never physically removed.
// Archive is the preferred first step; hard-delete is not exposed at this layer.

router.delete("/sessions/:id", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    return res.json({ id: req.params.id, deleted: true, soft: true });
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
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.userId],
    );
    if (!sessionResult.rows.length) return res.status(404).json({ error: "not_found" });
    const session = sessionResult.rows[0];
    if (session.status === "scanning")
      return res.status(409).json({ error: "already_scanning" });

    await pool.query(
      `UPDATE compare_versions_sessions SET status = 'scanning', ai_status = 'idle', ci_status = 'pending', change_intelligence = NULL, updated_at = NOW() WHERE id = $1`,
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
      `SELECT id, status, ai_status FROM compare_versions_sessions WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.userId],
    );
    if (!sessionResult.rows.length) return res.status(404).json({ error: "not_found" });
    const session = sessionResult.rows[0];
    if (session.status !== "complete")
      return res.status(409).json({ error: "not_complete" });
    if (session.ai_status === "running")
      return res.status(409).json({ error: "already_enriching" });

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
  const userId = resolveUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const result = await pool.query(
      `SELECT original_storage_key, original_file_name FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];
    const buf = await downloadPdf(row.original_storage_key);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(row.original_file_name ?? "original.pdf")}"`);
    return res.end(buf);
  } catch (err: any) {
    console.error("[compare-versions] get original pdf error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/compare-versions/sessions/:id/revised ───────────────────────────

router.get("/sessions/:id/revised", async (req: any, res) => {
  const userId = resolveUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const result = await pool.query(
      `SELECT revised_storage_key, revised_file_name FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];
    const buf = await downloadPdf(row.revised_storage_key);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(row.revised_file_name ?? "revised.pdf")}"`);
    return res.end(buf);
  } catch (err: any) {
    console.error("[compare-versions] get revised pdf error", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/compare-versions/sessions/:id/review ──────────────────────────

router.patch("/sessions/:id/review", async (req: any, res) => {
  const userId = resolveUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const { diffResult } = req.body ?? {};
    if (!diffResult || typeof diffResult !== "object")
      return res.status(400).json({ error: "invalid_body" });
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET diff_result = $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
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
  const userId = resolveUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const notes = req.body?.managerNotes;
    if (!notes || typeof notes !== "object")
      return res.status(400).json({ error: "invalid_body" });
    const result = await pool.query(
      `UPDATE compare_versions_sessions
       SET manager_notes = $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
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

// ─── GET /api/compare-versions/sessions/:id/export ────────────────────────────
// Slice 6 (T001): Generate PDF audit report from persisted session state.
//
// Report sections (all from DB, not UI memory):
//   1. Header + session title + metadata (original/revised filenames, scan date)
//   2. Severity summary counts (total / high / medium / low) from diff_result.stats
//   3. Full change list from diff_result.items with:
//      - change_type, severity (including any user overrides stored in diff_result)
//      - page references (page_revised or page_original)
//      - original_text / revised_text snippets
//      - ai_category + ai_explanation (if present)
//   4. Manager notes: freeform text + watchlist items with resolved/unresolved status
//   5. Footer on all pages: PlainPath · date · page N of N
//
// Responds 409 if status is not 'complete' or 'error'.
// Returns Content-Disposition: attachment; filename="compare-audit-{8charId}-{yyyy-mm-dd}.pdf"

router.get("/sessions/:id/export", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT id, title, status, original_file_name, revised_file_name,
              manager_notes, diff_result, scanned_at, created_at
       FROM compare_versions_sessions
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.userId],
    );
    if (!result.rows.length) return res.status(404).json({ error: "not_found" });
    const row = result.rows[0];

    if (row.status !== "complete" && row.status !== "error") {
      return res.status(409).json({ error: "not_ready", message: "Scan must complete before exporting." });
    }

    const diffResult = row.diff_result as any;
    const items: any[] = diffResult?.items ?? [];
    const stats = diffResult?.stats ?? { total: 0, high: 0, medium: 0, low: 0 };
    const notes = row.manager_notes as any ?? {};
    const freeformText: string = notes.freeform ?? "";
    const watchlist: any[] = notes.watchlist ?? [];

    // ── Build PDF with pdf-lib ─────────────────────────────────────────────

    const pdfDoc = await PDFDocument.create();
    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal  = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const PAGE_W = 595.28;
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
      page: any, text: string, x: number, y: number,
      opts: { size?: number; font?: any; color?: any; maxWidth?: number } = {},
    ): number {
      const size  = opts.size ?? 10;
      const font  = opts.font ?? fontNormal;
      const color = opts.color ?? BLACK;
      const maxW  = opts.maxWidth ?? CONTENT_W;
      const words = text.split(" ");
      let line = "";
      let cy = y;
      const lineHeight = size * 1.45;
      for (const word of words) {
        const trial = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(trial, size) > maxW && line) {
          page.drawText(line, { x, y: cy, size, font, color });
          cy -= lineHeight;
          line = word;
        } else {
          line = trial;
        }
      }
      if (line) { page.drawText(line, { x, y: cy, size, font, color }); cy -= lineHeight; }
      return cy;
    }

    function drawLine(page: any, y: number, color = LGRAY) {
      page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color });
    }

    // Page 1 header
    let { page, y } = newPage();
    page.drawRectangle({ x: 0, y: PAGE_H - 72, width: PAGE_W, height: 72, color: rgb(0.06, 0.08, 0.12) });
    page.drawText("PlainPath", { x: MARGIN, y: PAGE_H - 38, size: 18, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Comparison Audit Report", { x: MARGIN, y: PAGE_H - 56, size: 10, font: fontNormal, color: rgb(0.6, 0.65, 0.75) });

    y = PAGE_H - 95;
    y = drawText(page, row.title || "Untitled Comparison", MARGIN, y, { size: 16, font: fontBold });
    y -= 6;

    const scanDate = row.scanned_at
      ? new Date(row.scanned_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date(row.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    y = drawText(page, `Scan date: ${scanDate}`, MARGIN, y, { size: 9, color: GRAY });
    y = drawText(page, `Original:  ${row.original_file_name}`, MARGIN, y, { size: 9, color: GRAY });
    y = drawText(page, `Revised:   ${row.revised_file_name}`, MARGIN, y, { size: 9, color: GRAY });
    y -= 14;
    drawLine(page, y);
    y -= 18;

    // Severity summary
    y = drawText(page, "Summary", MARGIN, y, { size: 13, font: fontBold });
    y -= 4;

    const countBoxW = (CONTENT_W - 12) / 4;
    const countItems = [
      { label: "Total",  value: String(stats.total ?? 0),  color: BLACK },
      { label: "High",   value: String(stats.high ?? 0),   color: RED   },
      { label: "Medium", value: String(stats.medium ?? 0), color: AMBER },
      { label: "Low",    value: String(stats.low ?? 0),    color: GRAY  },
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

    // Change list
    y = drawText(page, "Change Details", MARGIN, y, { size: 13, font: fontBold });
    y -= 8;

    const SEV_COLOR_MAP: Record<string, any> = { high: RED, medium: AMBER, low: GRAY };

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (y < MARGIN + 58) ({ page, y } = newPage());

      const num = String(idx + 1).padStart(String(items.length).length, "0");
      const sev = (item.severity ?? "low") as string;
      const sevColor = SEV_COLOR_MAP[sev] ?? GRAY;

      page.drawRectangle({
        x: MARGIN - 4, y: y - 38,
        width: CONTENT_W + 8, height: 42,
        color: idx % 2 === 0 ? rgb(0.98, 0.99, 1.0) : rgb(1, 1, 1),
      });

      page.drawText(`#${num}`, { x: MARGIN, y: y - 12, size: 8, font: fontBold, color: GRAY });
      const sevLabel = sev.toUpperCase();
      const sevLabelW = fontBold.widthOfTextAtSize(sevLabel, 7);
      page.drawRectangle({ x: MARGIN + 22, y: y - 17, width: sevLabelW + 8, height: 13, color: sevColor, borderRadius: 3 });
      page.drawText(sevLabel, { x: MARGIN + 26, y: y - 14, size: 7, font: fontBold, color: rgb(1, 1, 1) });

      const pageRef = item.page_revised != null ? `p.${item.page_revised}` : item.page_original != null ? `p.${item.page_original}` : "";
      if (pageRef) page.drawText(pageRef, { x: PAGE_W - MARGIN - 30, y: y - 12, size: 8, font: fontNormal, color: GRAY });

      const ctLabel = (item.change_type ?? "").replace(/_/g, " ");
      y = drawText(page, ctLabel, MARGIN + 60, y - 3, { size: 9, font: fontBold, color: BLACK, maxWidth: CONTENT_W - 90 });

      // AI category (if enriched)
      if (item.ai_category) {
        y = drawText(page, `AI: ${item.ai_category.replace(/_/g, " ")}`, MARGIN + 60, y + 2, { size: 8, color: GRAY, maxWidth: CONTENT_W - 90 });
      }

      const origSnip = (item.original_text ?? "").slice(0, 110).trim();
      const revSnip  = (item.revised_text  ?? "").slice(0, 110).trim();
      if (origSnip) y = drawText(page, `— ${origSnip}`, MARGIN + 4, y, { size: 7.5, font: fontOblique, color: GRAY, maxWidth: CONTENT_W - 8 });
      if (revSnip)  y = drawText(page, `+ ${revSnip}`,  MARGIN + 4, y + 2, { size: 7.5, font: fontOblique, color: TEAL, maxWidth: CONTENT_W - 8 });

      // AI explanation (if enriched)
      if (item.ai_explanation) {
        y = drawText(page, item.ai_explanation.slice(0, 200), MARGIN + 4, y, { size: 7.5, color: rgb(0.3, 0.3, 0.35), maxWidth: CONTENT_W - 8 });
      }

      y -= 8;
    }

    if (items.length === 0) {
      y = drawText(page, "No changes detected in this comparison.", MARGIN, y, { size: 10, color: GRAY });
      y -= 8;
    }

    // Manager notes
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
          const resolvedMark = w.resolved ? "[resolved]" : "[open]";
          const sevTag = w.severity ? ` [${String(w.severity).toUpperCase()}]` : "";
          y = drawText(
            page,
            `${resolvedMark}${sevTag} ${w.text ?? ""}`,
            MARGIN + 4, y,
            { size: 9, color: w.resolved ? GRAY : BLACK, maxWidth: CONTENT_W - 8 },
          );
          y -= 2;
        }
      }
    }

    // Footer on all pages
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
    const dateStr  = new Date().toISOString().slice(0, 10);
    const shortId  = (row.id as string).slice(0, 8);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBytes.length);
    res.setHeader("Content-Disposition", `attachment; filename="compare-audit-${shortId}-${dateStr}.pdf"`);
    return res.end(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("[compare-versions] export error", err);
    return res.status(500).json({ error: "server_error", message: "Failed to generate report." });
  }
});

export default router;
