import { Router } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

// ─── List documents ────────────────────────────────────────────────────────────

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const docs = await pool.query(
      `SELECT d.id, d.title, d.source_kind, d.mime_type, d.original_filename,
              d.status, d.created_at, d.updated_at, d.metadata,
              COUNT(r.id)::int AS tool_run_count,
              COALESCE(
                json_agg(json_build_object(
                  'id', r.id,
                  'tool', r.tool,
                  'output_ref', r.output_ref,
                  'output_kind', r.output_kind,
                  'result_summary', r.result_summary,
                  'created_at', r.created_at
                ) ORDER BY r.created_at DESC) FILTER (WHERE r.id IS NOT NULL),
                '[]'
              ) AS tool_runs
       FROM documents d
       LEFT JOIN document_tool_runs r ON r.document_id = d.id
       WHERE d.user_id = $1 AND d.status = 'active'
       GROUP BY d.id
       ORDER BY d.updated_at DESC`,
      [req.userId]
    );
    res.json(docs.rows.map(row => ({
      id: row.id,
      title: row.title,
      sourceKind: row.source_kind,
      mimeType: row.mime_type,
      originalFilename: row.original_filename,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata,
      toolRunCount: row.tool_run_count,
      toolRuns: row.tool_runs,
    })));
  } catch (err) {
    console.error("[userDocs] list error", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Get single document ───────────────────────────────────────────────────────

router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const doc = await pool.query(
      `SELECT d.id, d.title, d.source_kind, d.mime_type, d.original_filename,
              d.extracted_text, d.status, d.created_at, d.updated_at, d.metadata
       FROM documents d
       WHERE d.id = $1 AND d.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (doc.rowCount === 0) return res.status(404).json({ error: "not_found" });

    const runs = await pool.query(
      `SELECT id, tool, output_ref, output_kind, result_summary, created_at, metadata
       FROM document_tool_runs
       WHERE document_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    const d = doc.rows[0];
    res.json({
      id: d.id,
      title: d.title,
      sourceKind: d.source_kind,
      mimeType: d.mime_type,
      originalFilename: d.original_filename,
      extractedText: d.extracted_text,
      status: d.status,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      metadata: d.metadata,
      toolRuns: runs.rows.map(r => ({
        id: r.id,
        tool: r.tool,
        outputRef: r.output_ref,
        outputKind: r.output_kind,
        resultSummary: r.result_summary,
        createdAt: r.created_at,
        metadata: r.metadata,
      })),
    });
  } catch (err) {
    console.error("[userDocs] get error", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Create document ───────────────────────────────────────────────────────────

router.post("/", requireAuth, async (req: any, res) => {
  const { title, sourceKind = "upload", mimeType, originalFilename, extractedText, metadata } = req.body;
  if (!title) return res.status(400).json({ error: "missing_title" });
  try {
    const result = await pool.query(
      `INSERT INTO documents (user_id, title, source_kind, mime_type, original_filename, extracted_text, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, source_kind, mime_type, original_filename, status, created_at, updated_at`,
      [req.userId, title, sourceKind, mimeType ?? null, originalFilename ?? null, extractedText ?? null, metadata ? JSON.stringify(metadata) : null]
    );
    const d = result.rows[0];
    res.json({
      id: d.id,
      title: d.title,
      sourceKind: d.source_kind,
      mimeType: d.mime_type,
      originalFilename: d.original_filename,
      status: d.status,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      toolRuns: [],
    });
  } catch (err) {
    console.error("[userDocs] create error", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Update document title ────────────────────────────────────────────────────

router.patch("/:id", requireAuth, async (req: any, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "missing_title" });
  try {
    const result = await pool.query(
      `UPDATE documents SET title = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING id`,
      [title, req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Delete document ───────────────────────────────────────────────────────────

router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `UPDATE documents SET status = 'deleted', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Attach tool run ───────────────────────────────────────────────────────────

router.post("/:id/tool-run", requireAuth, async (req: any, res) => {
  const { tool, outputRef, outputKind, resultSummary, metadata } = req.body;
  if (!tool) return res.status(400).json({ error: "missing_tool" });

  try {
    const doc = await pool.query(
      `SELECT id FROM documents WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (doc.rowCount === 0) return res.status(404).json({ error: "not_found" });

    const result = await pool.query(
      `INSERT INTO document_tool_runs (document_id, user_id, tool, output_ref, output_kind, result_summary, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, tool, output_ref, output_kind, result_summary, created_at`,
      [req.params.id, req.userId, tool, outputRef ?? null, outputKind ?? null, resultSummary ?? null, metadata ? JSON.stringify(metadata) : null]
    );
    await pool.query(`UPDATE documents SET updated_at = NOW() WHERE id = $1`, [req.params.id]);

    const r = result.rows[0];
    res.json({
      id: r.id,
      tool: r.tool,
      outputRef: r.output_ref,
      outputKind: r.output_kind,
      resultSummary: r.result_summary,
      createdAt: r.created_at,
    });
  } catch (err) {
    console.error("[userDocs] tool-run error", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
