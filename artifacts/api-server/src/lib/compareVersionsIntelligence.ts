// ─── Compare Versions — Change Intelligence (GPT-4o) ─────────────────────────
// Extracts text from both PDFs, calls GPT-4o to produce structured analysis
// of what changed between the two versions. Result stored as change_intelligence.
// ─────────────────────────────────────────────────────────────────────────────

import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { pool } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

// ─── Public types ──────────────────────────────────────────────────────────────

export interface CISection {
  id: string;
  heading: string;
  text: string;
  change_type: "unchanged" | "modified" | "removed" | "added";
  paired_id: string | null;
}

export interface CIKeyChange {
  id: string;
  type: "added" | "removed" | "modified";
  chip: string;
  title: string;
  plain: string;
  action: string | null;
  orig_id: string | null;
  rev_id: string | null;
}

export interface CIAddedLanguage {
  id: string;
  chip: string;
  term: string;
  where: string;
  meaning: string;
  action: string | null;
  rev_id: string;
}

export interface CIRemovedLanguage {
  id: string;
  chip: string;
  term: string;
  where: string;
  meaning: string;
  why: string;
  orig_id: string;
}

export interface CIModifiedTerm {
  id: string;
  chip: string;
  term: string;
  before: string;
  after: string;
  what_changed: string;
  action: string | null;
  orig_id: string;
  rev_id: string;
}

export interface CIRiskChange {
  id: string;
  chip: string;
  title: string;
  note: string;
}

export interface CVChangeIntelligence {
  document_type: string;
  parties: string;
  summary: {
    compared: string;
    what_changed: string;
    inspect_first: string;
  };
  stats: {
    total_changes: number;
    additions: number;
    removals: number;
    modifications: number;
    terms_to_verify: number;
  };
  sections_original: CISection[];
  sections_revised: CISection[];
  key_changes: CIKeyChange[];
  added_language: CIAddedLanguage[];
  removed_language: CIRemovedLanguage[];
  modified_terms: CIModifiedTerm[];
  risk_changes: CIRiskChange[];
  confidence: "high" | "partial" | "low_scan_quality";
}

// ─── Text extraction ───────────────────────────────────────────────────────────

async function extractText(buf: Buffer): Promise<string> {
  try {
    const result = await pdfParse(buf, { max: 0 });
    return result.text?.trim() ?? "";
  } catch {
    return "";
  }
}

// ─── Main analysis function ────────────────────────────────────────────────────

const MAX_CHARS = 12000;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n\n[... document truncated for analysis ...]";
}

const SYSTEM_PROMPT = `You are an expert legal document analyst specializing in contract comparison.
Compare two versions of a document and return ONLY a valid JSON object — no markdown, no code blocks, no commentary.
Be precise, factual, and source-backed. Never fabricate changes. If text is unclear say so in the relevant field.
Use plain English that non-lawyers can understand.`;

const USER_PROMPT = (origText: string, revText: string) => `Compare these two document versions and return ONLY a JSON object with this exact structure:

ORIGINAL DOCUMENT:
${origText}

REVISED DOCUMENT:
${revText}

Return ONLY valid JSON (no markdown wrapper) matching this exact structure:
{
  "document_type": "e.g. Residential Lease Agreement",
  "parties": "e.g. Jane Smith (Tenant) and Acme Realty LLC (Landlord)",
  "summary": {
    "compared": "one sentence describing what was compared and how many changes",
    "what_changed": "2-3 sentence plain-English summary of the main changes",
    "inspect_first": "comma-separated list of 2-4 most important things to check first"
  },
  "stats": {
    "total_changes": <number>,
    "additions": <number of newly added sections/clauses>,
    "removals": <number of removed sections/clauses>,
    "modifications": <number of modified terms/clauses>,
    "terms_to_verify": <number of terms that need user verification>
  },
  "sections_original": [
    {
      "id": "o-1",
      "heading": "§N · Section Title",
      "text": "full section text (up to 400 chars)",
      "change_type": "unchanged" | "modified" | "removed",
      "paired_id": "r-1" or null
    }
  ],
  "sections_revised": [
    {
      "id": "r-1",
      "heading": "§N · Section Title",
      "text": "full section text (up to 400 chars)",
      "change_type": "unchanged" | "modified" | "added",
      "paired_id": "o-1" or null
    }
  ],
  "key_changes": [
    {
      "id": "kc-1",
      "type": "added" | "removed" | "modified",
      "chip": "§N·p.X",
      "title": "short title",
      "plain": "plain-English explanation of what this change means",
      "action": "suggested action or null",
      "orig_id": "o-N or null",
      "rev_id": "r-N or null"
    }
  ],
  "added_language": [
    {
      "id": "al-1",
      "chip": "§N·p.X",
      "term": "term or clause name",
      "where": "§N · Section Name, p.X",
      "meaning": "what this addition means in plain language",
      "action": "suggested action or null",
      "rev_id": "r-N"
    }
  ],
  "removed_language": [
    {
      "id": "rl-1",
      "chip": "§N·p.X",
      "term": "term or clause name",
      "where": "§N · Section Name (original only)",
      "meaning": "what was removed and why it matters",
      "why": "what to verify or check as a result",
      "orig_id": "o-N"
    }
  ],
  "modified_terms": [
    {
      "id": "mt-1",
      "chip": "§N·p.X",
      "term": "term or clause name",
      "before": "exact original wording (up to 120 chars)",
      "after": "exact revised wording (up to 120 chars)",
      "what_changed": "plain-English explanation of the impact",
      "action": "suggested action or null",
      "orig_id": "o-N",
      "rev_id": "r-N"
    }
  ],
  "risk_changes": [
    {
      "id": "rc-1",
      "chip": "§N·p.X",
      "title": "short risk title",
      "note": "explain why this change could be risky"
    }
  ],
  "confidence": "high" | "partial" | "low_scan_quality"
}

Rules:
- sections_original: one entry per major section/clause in original doc (max 20)
- sections_revised: one entry per major section/clause in revised doc (max 20)
- key_changes: top 5-8 most significant changes only
- added_language: only genuinely new clauses/terms in revised (not present in original)
- removed_language: only genuinely removed clauses/terms from original (not in revised)
- modified_terms: only terms where the language meaningfully changed
- risk_changes: only 2-5 highest-risk changes
- Use "§N·p.X" format for chips where N=section number, X=approximate page
- If documents are identical, return empty arrays for changes and confidence "high"
- If text is garbled or unreadable, set confidence "low_scan_quality"`;

// ─── runChangeIntelligence ─────────────────────────────────────────────────────

export async function runChangeIntelligence(
  sessionId: string,
  origBuf: Buffer,
  revBuf: Buffer,
): Promise<void> {
  console.debug(`[cv-intelligence] starting for session ${sessionId}`);

  await pool.query(
    `UPDATE compare_versions_sessions SET ci_status = 'running', updated_at = NOW() WHERE id = $1`,
    [sessionId],
  );

  try {
    const [origText, revText] = await Promise.all([
      extractText(origBuf),
      extractText(revBuf),
    ]);

    if (!origText && !revText) {
      throw new Error("Could not extract text from either document");
    }

    const truncatedOrig = truncate(origText || "(no text extracted)", MAX_CHARS);
    const truncatedRev  = truncate(revText  || "(no text extracted)", MAX_CHARS);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: USER_PROMPT(truncatedOrig, truncatedRev) },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let intelligence: CVChangeIntelligence;
    try {
      intelligence = JSON.parse(raw) as CVChangeIntelligence;
    } catch {
      throw new Error("GPT-4o returned invalid JSON");
    }

    // Ensure arrays exist
    if (!Array.isArray(intelligence.sections_original)) intelligence.sections_original = [];
    if (!Array.isArray(intelligence.sections_revised))  intelligence.sections_revised  = [];
    if (!Array.isArray(intelligence.key_changes))       intelligence.key_changes       = [];
    if (!Array.isArray(intelligence.added_language))    intelligence.added_language    = [];
    if (!Array.isArray(intelligence.removed_language))  intelligence.removed_language  = [];
    if (!Array.isArray(intelligence.modified_terms))    intelligence.modified_terms    = [];
    if (!Array.isArray(intelligence.risk_changes))      intelligence.risk_changes      = [];

    await pool.query(
      `UPDATE compare_versions_sessions
       SET change_intelligence = $1::jsonb, ci_status = 'complete', updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(intelligence), sessionId],
    );

    console.debug(`[cv-intelligence] complete for session ${sessionId}`);
  } catch (err) {
    console.error(`[cv-intelligence] error for session ${sessionId}:`, err);
    await pool.query(
      `UPDATE compare_versions_sessions SET ci_status = 'error', updated_at = NOW() WHERE id = $1`,
      [sessionId],
    ).catch(() => {});
  }
}
