// ─── Compare Versions — AI Enrichment Service (Slice 5) ──────────────────────
// Async enrichment pass that runs after deterministic scan completes.
// Sends text-based diff items to OpenAI, writes ai_category + ai_explanation
// back into existing diff_result items. Never deletes deterministic findings.
// Never downgrades below deterministic severity baseline.
// Manager override always wins over AI-suggested severity.
// ─────────────────────────────────────────────────────────────────────────────

import { pool } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

// ── Types ──────────────────────────────────────────────────────────────────────

export type CVAiCategory =
  | "meaning_change"
  | "policy_change"
  | "legal_language"
  | "financial_value"
  | "date_deadline"
  | "safety_threshold"
  | "rewrite_equivalent"
  | "typo_correction"
  | "cosmetic_text"
  | "unclear";

interface AiItemResult {
  category: CVAiCategory;
  explanation: string;
  confidence: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ENRICHABLE_TYPES = new Set(["text_modified", "text_added", "text_removed"]);

const VALID_CATEGORIES = new Set<string>([
  "meaning_change",
  "policy_change",
  "legal_language",
  "financial_value",
  "date_deadline",
  "safety_threshold",
  "rewrite_equivalent",
  "typo_correction",
  "cosmetic_text",
  "unclear",
]);

const SEV_ORDER: Record<string, number> = { high: 2, medium: 1, low: 0 };

const BATCH_SIZE = 8;

// ── Severity upgrade logic ─────────────────────────────────────────────────────
// AI may upgrade, never downgrade. Mapping is deterministic in code after AI returns category.

function maxSev(a: string, b: string): string {
  return (SEV_ORDER[a] ?? 0) >= (SEV_ORDER[b] ?? 0) ? a : b;
}

function categoryUpgrade(category: string, detSev: string): string {
  switch (category) {
    case "financial_value":
    case "date_deadline":
    case "safety_threshold":
    case "legal_language":
      return "high";
    case "policy_change":
    case "meaning_change":
      return maxSev(detSev, "medium");
    case "rewrite_equivalent":
    case "typo_correction":
    case "cosmetic_text":
    case "unclear":
    default:
      return detSev; // keep deterministic — no upgrade for these
  }
}

// ── Prompt ─────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a document review assistant analyzing changes between versions of legal and business documents.

For each change item provided, identify the category and write a plain-English explanation of what changed and why it may matter to a reviewer.

Respond with ONLY a JSON object in this exact format, no preamble, no markdown:
{"items": [{"id": "...", "category": "...", "explanation": "...", "confidence": 0.0}]}

Allowed categories:
- meaning_change — wording change that alters the meaning of an obligation or right
- policy_change — change to a policy, rule, or procedure
- legal_language — change to legal clauses, definitions, or liability terms
- financial_value — change to a monetary amount, rate, fee, or price
- date_deadline — change to a date, deadline, or time period
- safety_threshold — change to a safety requirement, limit, or threshold
- rewrite_equivalent — reworded but same meaning
- typo_correction — spelling or grammar fix only
- cosmetic_text — formatting or cosmetic text change
- unclear — cannot confidently classify

Rules:
- explanation: one sentence, plain English, max 140 chars, no markdown, no legal advice
- describe WHAT changed and WHY it matters, do not recommend action
- if uncertain, use category "unclear"
- confidence: float 0.0–1.0
- never reference page numbers or IDs not in the provided data`;

// ── OpenAI batch call ──────────────────────────────────────────────────────────

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

async function callOpenAiBatch(
  payload: Array<{
    id: string;
    change_type: string;
    original_text: string;
    revised_text: string;
    severity: string;
    page: number | null;
  }>,
): Promise<Map<string, AiItemResult>> {
  const userMsg = `Analyze these ${payload.length} document changes:\n\n${JSON.stringify(payload, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI enrichment returned invalid JSON");
  }

  const resultMap = new Map<string, AiItemResult>();
  const respItems = Array.isArray(parsed?.items) ? parsed.items : [];
  for (const r of respItems) {
    if (typeof r?.id !== "string") continue;
    const category: CVAiCategory = VALID_CATEGORIES.has(r.category)
      ? (r.category as CVAiCategory)
      : "unclear";
    resultMap.set(r.id, {
      category,
      explanation:
        typeof r.explanation === "string" ? r.explanation.slice(0, 200) : "",
      confidence:
        typeof r.confidence === "number"
          ? Math.min(1, Math.max(0, r.confidence))
          : 0,
    });
  }
  return resultMap;
}

// ── Main enrichment function ───────────────────────────────────────────────────
// Exported so it can be called from:
//   1. runBackgroundScan (auto-trigger after scan completes)
//   2. POST /sessions/:id/enrich (manual retry)

export async function runBackgroundEnrich(sessionId: string, forceAll = false): Promise<void> {
  try {
    console.log(`[compare-versions] enrichment starting for session ${sessionId}`);
    // NOTE: callers are responsible for atomically claiming ai_status = 'running'
    // before invoking this function. Do NOT set it here — that would re-introduce
    // the non-atomic read-then-write race between concurrent callers.

    const result = await pool.query(
      `SELECT diff_result FROM compare_versions_sessions WHERE id = $1`,
      [sessionId],
    );
    if (!result.rows.length || !result.rows[0].diff_result) {
      throw new Error("Session or diff_result not found");
    }

    const diffResult = result.rows[0].diff_result as any;
    const items: any[] = Array.isArray(diffResult.items) ? diffResult.items : [];

    // Filter enrichable items: text-type, has text content, and not yet enriched (unless forceAll)
    const enrichable = items.filter(
      (i: any) =>
        ENRICHABLE_TYPES.has(i.change_type) &&
        (i.original_text || i.revised_text) &&
        (forceAll || !i.ai_category),
    );

    if (enrichable.length === 0) {
      await pool.query(
        `UPDATE compare_versions_sessions
         SET ai_status = 'complete', ai_enriched_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [sessionId],
      );
      console.log(`[compare-versions] no enrichable items for ${sessionId} (all already enriched)`);
      return;
    }

    console.log(
      `[compare-versions] enriching ${enrichable.length} items for ${sessionId} in batches of ${BATCH_SIZE}`,
    );

    // Build enriched data map
    const enrichedData = new Map<string, AiItemResult>();
    let failedBatches = 0;

    for (let i = 0; i < enrichable.length; i += BATCH_SIZE) {
      const batch = enrichable.slice(i, i + BATCH_SIZE);
      const payload = batch.map((item: any) => ({
        id: item.id,
        change_type: item.change_type,
        original_text: truncate(item.original_text, 400),
        revised_text: truncate(item.revised_text, 400),
        severity: item.severity,
        page: item.page_original ?? item.page_revised ?? null,
      }));

      try {
        const batchResult = await callOpenAiBatch(payload);
        for (const [k, v] of batchResult) enrichedData.set(k, v);
      } catch (err) {
        failedBatches++;
        console.warn(
          `[compare-versions] batch ${Math.floor(i / BATCH_SIZE) + 1} enrichment failed:`,
          err,
        );
        // continue with remaining batches
      }
    }

    const now = new Date().toISOString();

    // Write AI data back into items
    const enrichedItems = items.map((item: any) => {
      const ai = enrichedData.get(item.id);
      if (!ai) return item;

      // Preserve original deterministic severity in meta (only first time)
      const detSev: string = item.meta?.severity_deterministic ?? item.severity;
      const aiSev = categoryUpgrade(ai.category, detSev);

      // Precedence: manager override > AI-upgraded > deterministic baseline
      // If manager has already overridden, keep their choice; AI still writes category/explanation
      const effectiveSev = item.severity_overridden
        ? item.severity
        : maxSev(detSev, aiSev);

      return {
        ...item,
        ai_category: ai.category,
        ai_explanation: ai.explanation,
        ai_confidence: ai.confidence,
        ai_enriched_at: now,
        severity: effectiveSev,
        meta: {
          ...item.meta,
          severity_deterministic: detSev,
          severity_ai: aiSev,
        },
      };
    });

    // Recompute stats
    let high = 0, medium = 0, low = 0;
    const pages = new Set<number>();
    for (const i of enrichedItems) {
      if (i.severity === "high") high++;
      else if (i.severity === "medium") medium++;
      else low++;
      if (i.page_original) pages.add(i.page_original);
      if (i.page_revised) pages.add(i.page_revised);
    }

    const updatedDiffResult = {
      ...diffResult,
      items: enrichedItems,
      stats: { total: enrichedItems.length, high, medium, low, pagesWithDiffs: pages.size },
    };

    const finalStatus = failedBatches > 0 && enrichedData.size === 0 ? "error" : "complete";

    await pool.query(
      `UPDATE compare_versions_sessions
       SET diff_result = $1::jsonb,
           ai_status = $2,
           ai_enriched_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(updatedDiffResult), finalStatus, sessionId],
    );

    console.log(
      `[compare-versions] enrichment ${finalStatus} for ${sessionId} — ` +
      `${enrichedData.size}/${enrichable.length} items enriched, ${failedBatches} batch(es) failed`,
    );
  } catch (err) {
    console.error(`[compare-versions] enrichment fatal error for ${sessionId}:`, err);
    await pool
      .query(
        `UPDATE compare_versions_sessions
         SET ai_status = 'error', updated_at = NOW()
         WHERE id = $1`,
        [sessionId],
      )
      .catch(() => {});
  }
}
