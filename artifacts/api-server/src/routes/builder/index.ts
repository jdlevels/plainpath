import { Router } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireBuilderEnabled } from "../../middlewares/builderFeatureFlag.js";
import { requireEntitlement } from "../../lib/requireEntitlement.js";
import {
  validateCreateDocument,
  validateUpdateDocument,
} from "../../lib/builderValidation.js";

const router = Router();

// Apply feature flag middleware to all builder routes
router.use(requireBuilderEnabled);

// Require Pro/Team plan entitlement for all builder routes
router.use(requireEntitlement("builder"));

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
              server_version, latest_snapshot_id, created_at, updated_at,
              jsonb_array_length(content->'sections') AS section_count,
              (SELECT COALESCE(SUM(jsonb_array_length(s->'blocks')), 0)::int
               FROM jsonb_array_elements(content->'sections') AS s) AS block_count
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
        sectionCount: row.section_count ?? 0,
        blockCount: row.block_count ?? 0,
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

// ─── POST /api/builder/ai/block-action ───────────────────────────────────────
// Run an AI writing action on the selected block content.
// No DB writes — read-only inference, returns suggestion for preview-before-apply.

const ACTION_INSTRUCTIONS: Record<string, string> = {
  "Elaborate":          "Expand the text with more detail and context while keeping the same meaning and professional tone.",
  "Formalize":          "Rewrite the text in a more formal, professional register appropriate for a business document.",
  "Simplify":           "Rewrite the text to be clearer and easier to understand, using plain language.",
  "Shorten":            "Reduce the text to its key points, removing unnecessary words while keeping the core meaning.",
  "Correct spelling":   "Fix all spelling, grammar, and punctuation errors. Return only the corrected text with no other changes.",
  "Make professional":  "Refine the vocabulary, tone, and structure to sound polished and professional.",
  "Add missing details":"Identify and add important missing details that would be expected in this type of document section.",
  "Expand":             "Expand the content with additional relevant information, examples, or context.",
};

router.post("/ai/block-action", requireAuth, async (req: any, res) => {
  const { action, blockType, blockContent, documentTitle, category, sectionTitle } = req.body;

  if (!action || typeof action !== "string") {
    res.status(422).json({ error: "missing_action" }); return;
  }
  if (!blockType || typeof blockType !== "string") {
    res.status(422).json({ error: "missing_block_type" }); return;
  }
  if (typeof blockContent !== "string" || !blockContent.trim()) {
    res.status(422).json({ error: "missing_block_content" }); return;
  }

  // Table conversion — not yet supported
  if (action === "Turn into table") {
    res.json({ suggestion: "", newBlockType: null, safe: false, message: "Table editing support is coming soon." });
    return;
  }

  // Checklist conversion — only for paragraph/list block types
  const checklistSourceTypes = ["paragraph", "bullet-list", "numbered-list", "note"];
  if (action === "Turn into checklist" && !checklistSourceTypes.includes(blockType)) {
    res.json({
      suggestion: "",
      newBlockType: null,
      safe: false,
      message: "Select a paragraph or list block to convert to a checklist.",
    });
    return;
  }

  const docCtx = `Document: "${documentTitle || "Untitled"}". Category: ${category || "business document"}. Section: "${sectionTitle || "Untitled"}". Block type: ${blockType}.`;

  let systemPrompt: string;

  if (action === "Create next section") {
    systemPrompt = `You are a professional business document writer. ${docCtx}
The user wants to draft the next logical section for this document based on the existing content.
Return a JSON object with exactly two fields:
{ "sectionTitle": "...", "starterContent": "..." }
sectionTitle: concise, matching the document style.
starterContent: 1–3 sentences introducing what will go in that section.
Return only valid JSON. No markdown fences.`;
  } else if (action === "Turn into checklist") {
    systemPrompt = `You are a professional business document writer. ${docCtx}
Convert the following content into actionable checklist items.
Return a JSON array of strings, one item per element: ["Item 1", "Item 2"]
Each item should be a single, concise, actionable task.
Return only valid JSON. No markdown fences.`;
  } else {
    const instruction = ACTION_INSTRUCTIONS[action] ?? `Improve the text with this action: ${action}.`;
    systemPrompt = `You are a professional business document writer. ${docCtx}
${instruction}
Return only the improved text. No preamble, no explanation, no markdown fences.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: blockContent },
      ],
    });

    const raw = (completion.choices[0]?.message?.content ?? "").trim();
    if (!raw) {
      res.status(500).json({ error: "empty_response", message: "AI returned no content. Please try again." });
      return;
    }

    if (action === "Create next section") {
      let parsed: { sectionTitle?: string; starterContent?: string } = {};
      try {
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
        parsed = JSON.parse(cleaned);
      } catch {
        // Best-effort fallback
      }
      const suggestion = `${parsed.sectionTitle || "Next Section"}\n\n${parsed.starterContent || ""}`.trim();
      res.json({ suggestion, newBlockType: null, safe: true, message: null });
      return;
    }

    if (action === "Turn into checklist") {
      let items: string[] = [];
      try {
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          items = parsed.map((x: unknown) => String(x)).filter(Boolean);
        }
      } catch {
        items = raw.split("\n").map((l: string) => l.replace(/^[-*•\d.]+\s*/, "").trim()).filter(Boolean);
      }
      res.json({ suggestion: items.join("\n"), newBlockType: "checklist", safe: true, message: null });
      return;
    }

    res.json({ suggestion: raw, newBlockType: null, safe: true, message: null });
  } catch (err: any) {
    console.error("[builder] ai/block-action error", err?.message);
    res.status(500).json({ error: "ai_error", message: "AI request failed. Please try again." });
  }
});

export default router;
