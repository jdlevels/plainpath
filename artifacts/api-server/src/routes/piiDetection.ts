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

Return JSON with this exact structure:
{
  "entities": [
    { "type": "NAME", "value": "exact text as it appears" },
    { "type": "ADDRESS", "value": "exact address text" },
    { "type": "MEMBER_ID", "value": "exact ID value" },
    { "type": "LICENSE_NUMBER", "value": "exact value" },
    { "type": "CASE_NUMBER", "value": "exact value" },
    { "type": "OTHER_ID", "value": "exact value" }
  ]
}

Types to detect:
- NAME: Full person names (first + last, or full name). Not organization names.
- ADDRESS: Street addresses including number, street, city, state, ZIP. Return the complete address string as it appears.
- MEMBER_ID: Health insurance member IDs, group numbers, subscriber IDs
- LICENSE_NUMBER: Professional license, medical license, contractor license numbers  
- CASE_NUMBER: Court case numbers, claim numbers, docket numbers
- OTHER_ID: Any other personal identifier (passport number, national ID, voter ID, etc.)

Rules:
- Only extract values that are clearly present in the text
- Return the exact string as it appears in the document
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

router.post("/detect-pii", async (req, res) => {
  try {
    const { text } = req.body as { text?: string }

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" })
    }

    if (text.trim().length < 10) {
      return res.json({ spans: [] })
    }

    const [regexSpans, aiSpans] = await Promise.all([
      Promise.resolve(runRegexDetection(text)),
      runAiDetection(text),
    ])

    const merged = mergeSpans(regexSpans, aiSpans)

    return res.json({ spans: merged })
  } catch (error) {
    console.error("PII detection error:", error)
    return res.status(500).json({ error: "PII detection failed" })
  }
})

export default router
