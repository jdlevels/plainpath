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

// ─── Analyses ────────────────────────────────────────────────────────────────

router.get("/analyses", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, source_kind, document_type_hint, analysis, created_at, updated_at
       FROM user_analyses WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    const rows = result.rows.map((r: any) => ({
      id: r.id,
      savedAt: r.created_at,
      title: r.title,
      sourceKind: r.source_kind,
      documentTypeHint: r.document_type_hint,
      analysis: r.analysis,
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/analyses", requireAuth, async (req: any, res) => {
  const { title, sourceKind = "document", documentTypeHint = null, analysis } = req.body;
  if (!title || !analysis) return res.status(400).json({ error: "missing_fields" });
  try {
    const result = await pool.query(
      `INSERT INTO user_analyses (user_id, title, source_kind, document_type_hint, analysis)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, source_kind, document_type_hint, analysis, created_at`,
      [req.userId, title, sourceKind, documentTypeHint, JSON.stringify(analysis)]
    );
    const r = result.rows[0];
    res.json({
      id: r.id,
      savedAt: r.created_at,
      title: r.title,
      sourceKind: r.source_kind,
      documentTypeHint: r.document_type_hint,
      analysis: r.analysis,
    });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

router.patch("/analyses/:id", requireAuth, async (req: any, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "missing_title" });
  try {
    const result = await pool.query(
      `UPDATE user_analyses SET title = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING id`,
      [title, req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

router.delete("/analyses/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM user_analyses WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Trust Checks ─────────────────────────────────────────────────────────────

router.get("/trust-checks", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, analysis, created_at FROM user_trust_checks
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    const rows = result.rows.map((r: any) => ({
      id: r.id,
      savedAt: r.created_at,
      title: r.title,
      analysis: r.analysis,
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/trust-checks", requireAuth, async (req: any, res) => {
  const { title, analysis } = req.body;
  if (!title || !analysis) return res.status(400).json({ error: "missing_fields" });
  try {
    const result = await pool.query(
      `INSERT INTO user_trust_checks (user_id, title, analysis)
       VALUES ($1, $2, $3)
       RETURNING id, title, analysis, created_at`,
      [req.userId, title, JSON.stringify(analysis)]
    );
    const r = result.rows[0];
    res.json({ id: r.id, savedAt: r.created_at, title: r.title, analysis: r.analysis });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

router.delete("/trust-checks/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM user_trust_checks WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
