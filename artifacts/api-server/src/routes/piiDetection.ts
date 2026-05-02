// ─── PII Detection Route ──────────────────────────────────────────────────────
//
// POST /api/documents/detect-pii
// Input:  { text: string }
// Output: { spans: PiiSpan[] }
//
// DETECTION PIPELINE:
//   1. Regex pass — email, phone, SSN, dates, account/routing numbers,
//      credit cards, IP addresses (high confidence, exact positions)
//   2. OpenAI pass — names, addresses, policy IDs, member IDs,
//      license numbers, case/reference numbers (harder to regex)
//   3. Match AI values back to text to get character positions
//   4. Merge + deduplicate (remove spans fully contained within larger spans)
//   5. Return sorted span list
//
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express"
import { v4 as uuidv4 } from "uuid"
import { openai } from "@workspace/integrations-openai-ai-server"
import { requireEntitlement } from "../lib/requireEntitlement"

const router = Router()

// ─── Types ────────────────────────────────────────────────────────────────────

export type PiiType =
  | "NAME"
  | "ADDRESS"
  | "EMAIL"
  | "PHONE"
  | "SSN"
  | "TAX_ID"
  | "DOB"
  | "ACCOUNT_NUMBER"
  | "ROUTING_NUMBER"
  | "CREDIT_CARD"
  | "POLICY_ID"
  | "MEMBER_ID"
  | "CASE_NUMBER"
  | "LICENSE_NUMBER"
  | "IP_ADDRESS"
  | "OTHER_ID"

export type PiiSpan = {
  id: string
  type: PiiType
  label: string
  value: string
  start: number
  end: number
  confidence: "high" | "medium" | "low"
  source: "regex" | "ai" | "both"
}

// ─── Regex Detection ──────────────────────────────────────────────────────────
// Returns spans with precise character positions. All patterns are conservative
// to minimize false positives.

function runRegexDetection(text: string): PiiSpan[] {
  const spans: PiiSpan[] = []

  function add(match: RegExpExecArray, type: PiiType, label: string, confidence: PiiSpan["confidence"]) {
    spans.push({
      id: uuidv4(),
      type,
      label,
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      confidence,
      source: "regex",
    })
  }

  const patterns: Array<{ regex: RegExp; type: PiiType; label: string; confidence: PiiSpan["confidence"] }> = [
    // Email addresses
    {
      regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
      type: "EMAIL",
      label: "Email Address",
      confidence: "high",
    },
    // US phone numbers (various formats)
    {
      regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      type: "PHONE",
      label: "Phone Number",
      confidence: "high",
    },
    // SSN — XXX-XX-XXXX or XXXXXXXXX (with word boundary check to avoid longer numbers)
    {
      regex: /\b(?!000|666|9\d{2})\d{3}[-\s](?!00)\d{2}[-\s](?!0000)\d{4}\b/g,
      type: "SSN",
      label: "Social Security Number",
      confidence: "high",
    },
    // EIN/Tax ID — XX-XXXXXXX
    {
      regex: /\b\d{2}-\d{7}\b/g,
      type: "TAX_ID",
      label: "Tax ID / EIN",
      confidence: "high",
    },
    // Credit card numbers — 16 digits, various separators
    {
      regex: /\b(?:\d{4}[-\s]){3}\d{4}\b|\b\d{16}\b/g,
      type: "CREDIT_CARD",
      label: "Credit Card Number",
      confidence: "high",
    },
    // IP addresses
    {
      regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
      type: "IP_ADDRESS",
      label: "IP Address",
      confidence: "high",
    },
    // Date of birth (common formats)
    {
      regex: /\b(?:DOB|Date of Birth|Born(?:\s+on)?|Birthday)[:\s]+\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi,
      type: "DOB",
      label: "Date of Birth",
      confidence: "high",
    },
    // Routing numbers — exactly 9 digits after routing number label
    {
      regex: /\b(?:routing(?:\s+number)?|ABA(?:\s+number)?)[:\s#]+\d{9}\b/gi,
      type: "ROUTING_NUMBER",
      label: "Routing Number",
      confidence: "high",
    },
    // Account numbers — labeled
    {
      regex: /\b(?:account(?:\s+(?:number|no|#))?|acct(?:\.|\s+no\.?)?)[:\s#]+[\dA-Z\-]{4,20}\b/gi,
      type: "ACCOUNT_NUMBER",
      label: "Account Number",
      confidence: "medium",
    },
    // Policy / Member IDs — labeled
    {
      regex: /\b(?:policy(?:\s+(?:number|no|#|id))?|member(?:\s+(?:id|number|no|#))?)[:\s#]+[\dA-Z\-]{4,20}\b/gi,
      type: "POLICY_ID",
      label: "Policy / Member ID",
      confidence: "medium",
    },
    // Case / Reference / Claim numbers — labeled
    {
      regex: /\b(?:case|claim|reference|ref|confirmation|docket)(?:\s+(?:number|no|#|id))?[:\s#]+[\dA-Z\-]{4,20}\b/gi,
      type: "CASE_NUMBER",
      label: "Case / Reference Number",
      confidence: "medium",
    },
    // Driver license / State ID — labeled
    {
      regex: /\b(?:driver['s]?\s+license|dl(?:\s+number)?|state\s+id)(?:\s+(?:number|no|#))?[:\s#]+[A-Z0-9\-]{4,20}\b/gi,
      type: "LICENSE_NUMBER",
      label: "Driver's License Number",
      confidence: "medium",
    },
  ]

  for (const { regex, type, label, confidence } of patterns) {
    regex.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      // Avoid adding empty matches
      if (match[0].trim().length > 0) {
        add(match, type, label, confidence)
      }
    }
  }

  return spans
}

// ─── AI Detection ─────────────────────────────────────────────────────────────
// Uses OpenAI to extract PII values that are hard to catch with regex:
// names, street addresses, policy IDs, medical record numbers, license numbers.
// We ask for the raw value strings, then match positions back into the source text.

async function runAiDetection(text: string): Promise<PiiSpan[]> {
  const truncated = text.slice(0, 8000) // limit for cost/latency

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a PII (Personally Identifiable Information) detection system.
Extract all personal information from the provided document text.
Return ONLY values that appear verbatim in the text — do not paraphrase or normalize.
Return the shortest possible string that identifies the PII — do not include surrounding context, labels, or role words.

Return JSON with this exact structure:
{
  "entities": [
    { "type": "NAME", "value": "exact person name only" },
    { "type": "ADDRESS", "value": "exact address text" },
    { "type": "MEMBER_ID", "value": "exact ID value only" },
    { "type": "LICENSE_NUMBER", "value": "exact value" },
    { "type": "CASE_NUMBER", "value": "exact case number only" },
    { "type": "OTHER_ID", "value": "exact value" }
  ]
}

Types to detect:
- NAME: Full person names (first + last, or full name). NOT organization names, court names, law firm names, or generic roles.
- ADDRESS: Complete street addresses with number, street, city, state, ZIP. Return the exact address string as it appears.
- MEMBER_ID: Health insurance member IDs, group numbers, subscriber IDs — exact alphanumeric ID only, not the label
- LICENSE_NUMBER: Professional license, medical license, contractor license numbers — exact number only
- CASE_NUMBER: Court case numbers, claim numbers, docket numbers — exact code only (e.g. "23CV-00456", "2:23-cv-00123"), not section references
- OTHER_ID: Other personal identifiers such as passport numbers, national IDs, voter IDs — exact number only

CRITICAL — Do NOT extract any of the following (these are never PII):
- Legal code citations and statute references: anything containing "§", "U.S.C.", "C.F.R.", "Fed. R.", code abbreviations, or statute numbers — e.g. "Evid. Code § 780(c)", "Pen. Code § 995", "18 U.S.C. § 1341", "Cal. Rules of Court, rule 3.1385", "42 C.F.R. § 440.10", "Fed. R. Civ. P. 26(a)"
- Document section headings: anything starting with a numbered section pattern like "4A.6 Cross-Examination Module", "Section 3. Definitions", "Article 4.2 Indemnification"
- Legal role labels: "Plaintiff", "Defendant", "Attorney", "Judge", "Witness", "Petitioner", "Respondent", "Appellant", "Appellee", "Claimant", "Declarant", "Deponent" — even when followed by a personal name, do not include the role word
- Organization names, company names, court names, agency names
- Table headers, column labels, or form field labels: "Name", "Date", "Address", "Phone", "Reference", "Description"
- Exhibit labels: "Exhibit A", "Ex. 1", "Attachment B", "Appendix C"
- Boilerplate legal phrases or terms of art

Rules:
- Only extract values clearly present in the text
- Return the exact shortest string as it appears — do NOT include surrounding words or context
- If text says "Patient: John Smith", return "John Smith" not "Patient: John Smith"
- If text says "Witness, Jane Doe", return "Jane Doe" not "Witness, Jane Doe"
- Do NOT invent or normalize values
- If unsure, omit rather than guess
- Return empty entities array if no PII found`,
      },
      {
        role: "user",
        content: `Document text:\n\n${truncated}`,
      },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? "{}"
  let parsed: { entities?: Array<{ type: string; value: string }> } = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  const entities = parsed.entities ?? []
  const spans: PiiSpan[] = []

  const AI_LABEL_MAP: Record<string, { type: PiiType; label: string }> = {
    NAME: { type: "NAME", label: "Full Name" },
    ADDRESS: { type: "ADDRESS", label: "Street Address" },
    MEMBER_ID: { type: "MEMBER_ID", label: "Member / Subscriber ID" },
    LICENSE_NUMBER: { type: "LICENSE_NUMBER", label: "License Number" },
    CASE_NUMBER: { type: "CASE_NUMBER", label: "Case / Reference Number" },
    OTHER_ID: { type: "OTHER_ID", label: "Personal Identifier" },
  }

  for (const entity of entities) {
    const meta = AI_LABEL_MAP[entity.type]
    if (!meta || !entity.value || entity.value.trim().length < 2) continue

    // Find all occurrences of this value in the text (case-insensitive match)
    const needle = entity.value.trim()
    // Find ALL occurrences of this value in the text so every instance gets redacted
    const lowerText = text.toLowerCase()
    const lowerNeedle = needle.toLowerCase()
    let searchFrom = 0
    while (searchFrom < text.length) {
      const ci = lowerText.indexOf(lowerNeedle, searchFrom)
      if (ci === -1) break
      spans.push({
        id: uuidv4(),
        type: meta.type,
        label: meta.label,
        value: text.slice(ci, ci + needle.length),
        start: ci,
        end: ci + needle.length,
        confidence: "medium",
        source: "ai",
      })
      searchFrom = ci + needle.length
    }
  }

  return spans
}

// ─── False Positive Filter ────────────────────────────────────────────────────
// Drops AI-returned spans that match known non-PII patterns such as legal
// citations, section headings, exhibit labels, and generic role words.
// Runs after AI detection, before merging with regex spans.

const LEGAL_CITATION_RE = /\b(?:Evid\.|Evidence\s+Code|Pen\.|Penal\s+Code|Cal\.(?:\s*App\.|Rptr\.|Civ\.|Com\.|Corp\.|Fam\.|Prob\.)?|Fam\.?\s*Code|Gov(?:ernment)?\s+Code|Bus\.?\s*&?\s*Prof\.?\s*Code|Lab\.\s*Code|Welf\.?\s*&?\s*Inst\.?\s*Code|Veh\.\s*Code|Health\s*&?\s*Saf\.?\s*Code|U\.S\.C\.?|C\.F\.R\.?|Fed\.?\s*R\.|A\.L\.R\.|U\.C\.C\.)\b/i
const CODE_SECTION_RE = /§\s*\d|\b\d+\s*§/
const SECTION_HEADING_RE = /^\d+[A-Za-z]?\.\d+(\.\d+)?\s+[A-Z]/
const LEGAL_ROLE_RE = /^(?:plaintiff|defendant|attorney|counsel|judge|witness|petitioner|respondent|appellee|appellant|claimant|complainant|declarant|deponent|court|jury|arbitrator|mediator|trustee|executor|guardian|conservator)s?$/i
const EXHIBIT_LABEL_RE = /^(?:exhibit|attachment|appendix|schedule|addendum|ex\.)\s+[A-Z0-9]/i
const TABLE_HEADER_RE = /^(?:date|name|address|phone|email|amount|total|balance|description|notes|comments|reference|type|status|category|id|no\.|number|item|qty|quantity|unit|rate|tax|subtotal)$/i
const ORG_SUFFIX_RE = /\b(?:llc|llp|inc\.?|corp\.?|ltd\.?|co\.?|pllc|pa|p\.c\.|l\.p\.|associates|group|foundation|institute|university|college|hospital|medical\s+center|department|agency|bureau|division|authority|commission|district)\b/i

function isFalsePositive(span: PiiSpan): boolean {
  const v = span.value.trim()
  if (v.length < 2) return true

  // Legal citations and code section references
  if (LEGAL_CITATION_RE.test(v)) return true
  if (CODE_SECTION_RE.test(v)) return true

  // Section headings (e.g. "4A.6 Cross-Examination Module")
  if (SECTION_HEADING_RE.test(v)) return true

  // Generic legal role labels (NAME type only)
  if (span.type === "NAME" && LEGAL_ROLE_RE.test(v)) return true

  // Exhibit/attachment labels (CASE_NUMBER type)
  if (span.type === "CASE_NUMBER" && EXHIBIT_LABEL_RE.test(v)) return true

  // Common table headers and form field labels
  if (TABLE_HEADER_RE.test(v)) return true

  // Organization names in NAME field (has common corporate/org suffix)
  if (span.type === "NAME" && ORG_SUFFIX_RE.test(v)) return true

  // Single generic placeholder words
  if (/^(?:yes|no|n\/a|none|unknown|other|see\s+above|see\s+below|same\s+as\s+above|tbd|to\s+be\s+determined)$/i.test(v)) return true

  return false
}

// ─── Merge + Deduplicate ──────────────────────────────────────────────────────
// Sort by start position, remove any span that is fully contained within
// a higher-priority span. Prefer longer spans (more specific).

function mergeSpans(regexSpans: PiiSpan[], aiSpans: PiiSpan[]): PiiSpan[] {
  const all = [...regexSpans, ...aiSpans]

  // Sort by start ascending, then by length descending (longer wins)
  all.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start))

  const result: PiiSpan[] = []
  let lastEnd = -1

  for (const span of all) {
    // Skip if this span starts before the last accepted span ends (overlap)
    if (span.start < lastEnd) {
      // But if this span extends beyond the last one, we still skip for simplicity
      continue
    }
    // Mark source as "both" if regex and AI agree on the same position
    const isDuplicate = result.some(r =>
      Math.abs(r.start - span.start) < 5 &&
      Math.abs(r.end - span.end) < 5 &&
      r.type === span.type
    )
    if (isDuplicate) continue

    result.push(span)
    lastEnd = span.end
  }

  return result
}

// ─── Route ────────────────────────────────────────────────────────────────────

router.post("/detect-pii", requireEntitlement("redact"), async (req, res) => {
  try {
    const { text } = req.body as { text?: string }

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" })
    }

    if (text.trim().length < 10) {
      return res.json({ spans: [] })
    }

    const [regexSpans, rawAiSpans] = await Promise.all([
      Promise.resolve(runRegexDetection(text)),
      runAiDetection(text),
    ])

    const aiSpans = rawAiSpans.filter(s => !isFalsePositive(s))
    const merged = mergeSpans(regexSpans, aiSpans)

    return res.json({ spans: merged })
  } catch (error) {
    console.error("PII detection error:", error)
    return res.status(500).json({ error: "PII detection failed" })
  }
})

export default router
