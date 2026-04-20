import { Router } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import { requireBuilderEnabled } from "../../middlewares/builderFeatureFlag.js";
import {
  validateCreateDocument,
  validateUpdateDocument,
} from "../../lib/builderValidation.js";

const router = Router();

// Apply feature flag middleware to all builder routes
router.use(requireBuilderEnabled);

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }
  req.userId = userId;
  next();
}

// ─── GET /api/builder/documents ───────────────────────────────────────────────
// List owned active builder documents, sorted by recency

router.get("/documents", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, title, category, status, source, template_id,
              server_version, latest_snapshot_id, created_at, updated_at
       FROM builder_documents
       WHERE user_id = $1 AND status != 'archived'
       ORDER BY updated_at DESC`,
      [req.userId],
    );
    res.json(
      result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        category: row.category,
        status: row.status,
        source: row.source,
        templateId: row.template_id,
        serverVersion: row.server_version,
        latestSnapshotId: row.latest_snapshot_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    );
  } catch (err) {
    console.error("[builder] list documents error", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/builder/documents ─────────────────────────────────────────────
// Create a new builder document

router.post("/documents", requireAuth, async (req: any, res) => {
  const validationError = validateCreateDocument(req.body);
  if (validationError) {
    console.error("[builder] create validation failed", JSON.stringify({ error: validationError, body: req.body }));
    res.status(422).json(validationError);
    return;
  }

  const { title, category, source = "blank", templateId = null, content } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO builder_documents
         (user_id, title, category, status, source, template_id, content, server_version, created_at, updated_at)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6, 1, NOW(), NOW())
       RETURNING id, user_id, title, category, status, source, template_id,
                 server_version, latest_snapshot_id, created_at, updated_at`,
      [req.userId, title.trim(), category, source, templateId, JSON.stringify(content)],
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      category: row.category,
      status: row.status,
      source: row.source,
      templateId: row.template_id,
      serverVersion: row.server_version,
      latestSnapshotId: row.latest_snapshot_id,
      content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("[builder] create document error", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/builder/documents/:id ──────────────────────────────────────────
// Get single builder document with full content

router.get("/documents/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, title, category, status, source, template_id,
              content, server_version, latest_snapshot_id, created_at, updated_at
       FROM builder_documents
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );

    if (result.rowCount === 0) { res.status(404).json({ error: "not_found" }); return; }

    const row = result.rows[0];
    res.json({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      category: row.category,
      status: row.status,
      source: row.source,
      templateId: row.template_id,
      serverVersion: row.server_version,
      latestSnapshotId: row.latest_snapshot_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("[builder] get document error", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── PUT /api/builder/documents/:id ──────────────────────────────────────────
// Full-content autosave with optimistic concurrency via server_version
//
// Conflict model: optimistic concurrency with stale-write rejection.
// If the client's server_version does not match the stored value, returns 409.

router.put("/documents/:id", requireAuth, async (req: any, res) => {
  const validationError = validateUpdateDocument(req.body);
  if (validationError) { res.status(422).json(validationError); return; }

  const { server_version: clientVersion, title, status, content } = req.body;

  try {
    // Atomic update: WHERE clause includes server_version check as the concurrency guard
    const setClause: string[] = ["updated_at = NOW()", "server_version = server_version + 1"];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (content !== undefined) {
      setClause.push(`content = $${paramIdx++}`);
      values.push(JSON.stringify(content));
    }
    if (title !== undefined) {
      setClause.push(`title = $${paramIdx++}`);
      values.push(title.trim());
    }
    if (status !== undefined) {
      setClause.push(`status = $${paramIdx++}`);
      values.push(status);
    }

    // Append WHERE clause params
    const docId = req.params.id;
    const userId = req.userId;

    const result = await pool.query(
      `UPDATE builder_documents
       SET ${setClause.join(", ")}
       WHERE id = $${paramIdx++} AND user_id = $${paramIdx++} AND server_version = $${paramIdx++}
       RETURNING id, server_version, updated_at, status, title`,
      [...values, docId, userId, clientVersion],
    );

    if (result.rowCount === 0) {
      // Either not found/owned or version mismatch — check which
      const existing = await pool.query(
        `SELECT server_version FROM builder_documents WHERE id = $1 AND user_id = $2`,
        [docId, userId],
      );
      if (existing.rowCount === 0) {
        res.status(404).json({ error: "not_found" }); return;
      }
      // Version mismatch → conflict
      res.status(409).json({
        error: "conflict",
        message: "Document was modified by another session. Reload to continue editing.",
        currentServerVersion: existing.rows[0].server_version,
      }); return;
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      serverVersion: row.server_version,
      updatedAt: row.updated_at,
      status: row.status,
      title: row.title,
    });
  } catch (err) {
    console.error("[builder] update document error", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/builder/documents/:id/archive ──────────────────────────────────
// Soft-delete: sets status to 'archived'. Only path to the archived state.

router.post("/documents/:id/archive", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `UPDATE builder_documents
       SET status = 'archived', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status != 'archived'
       RETURNING id`,
      [req.params.id, req.userId],
    );

    if (result.rowCount === 0) {
      const exists = await pool.query(
        `SELECT id, status FROM builder_documents WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.userId],
      );
      if (exists.rowCount === 0) { res.status(404).json({ error: "not_found" }); return; }
      // Already archived — idempotent
      res.status(200).json({ id: req.params.id, status: "archived" }); return;
    }

    res.json({ id: result.rows[0].id, status: "archived" });
  } catch (err) {
    console.error("[builder] archive document error", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/builder/templates ───────────────────────────────────────────────
// List system templates, optionally filtered by category

router.get("/templates", requireAuth, async (req: any, res) => {
  try {
    const { category } = req.query;
    let query =
      `SELECT id, name, category, description, is_system, content, created_at, updated_at
       FROM builder_templates
       WHERE is_system = true`;
    const params: unknown[] = [];

    if (category && typeof category === "string") {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += " ORDER BY category, name";

    const result = await pool.query(query, params);
    res.json(
      result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        isSystem: row.is_system,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    );
  } catch (err) {
    console.error("[builder] list templates error", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/builder/templates/:id ──────────────────────────────────────────
// Get a single template by ID

router.get("/templates/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, category, description, is_system, content, created_at, updated_at
       FROM builder_templates
       WHERE id = $1`,
      [req.params.id],
    );

    if (result.rowCount === 0) { res.status(404).json({ error: "not_found" }); return; }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      isSystem: row.is_system,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("[builder] get template error", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
