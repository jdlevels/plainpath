// ── PlainPath Completion Enricher ─────────────────────────────────────────────
// Deterministic helper functions that improve completion object field quality.
//
// Strict discipline:
//   - No AI calls. No external API calls.
//   - extractTrigger() returns ONLY text actually present in the input.
//     It never fabricates dates, deadlines, or timing language.
//   - inferWhereToGetThis() returns ONLY conservative, document-agnostic guidance.
//     It never invents office names, URLs, or form numbers.
//   - All functions return null rather than fabricating content.

// ── Trigger extraction ────────────────────────────────────────────────────────

/**
 * Scans text for timing-language phrases and returns the first match.
 * Only returns text that is actually present in the input — never fabricates.
 */
export function extractTrigger(text: string | null | undefined): string | null {
  if (!text || text.length < 3) return null

  const TRIGGER_PATTERNS: RegExp[] = [
    // "within N [calendar/business/working] days"
    /within\s+\d+\s+(?:calendar\s+|business\s+|working\s+)?days?/i,
    // "no later than ..."
    /no\s+later\s+than\s+[^,.;]{1,70}/i,
    // "at least N days [prior to/before] ..."
    /at\s+least\s+\d+\s+days?\s+(?:prior\s+to|before)[^,.;]{0,60}/i,
    // "prior to [submission/signing/start/etc.]"
    /prior\s+to\s+(?:the\s+)?(?:submission|signing|start(?:\s+date)?|deadline|enrollment|expiration|receipt|first\s+day)[^,.;]{0,50}/i,
    // "before [submission/signing/start date/etc.]"
    /before\s+(?:the\s+)?(?:submission|signing|start(?:\s+date)?|deadline|receipt|move[\s-]?in|enrollment|expiration|due\s+date|first\s+day)[^,.;]{0,50}/i,
    // "upon [signing/receipt/execution/etc.]"
    /upon\s+(?:signing|receipt|execution|enrollment|approval|acceptance|delivery|hire|start)[^,.;]{0,50}/i,
    // "after [receipt/signing/execution/etc.]"
    /after\s+(?:receipt|signing|execution|approval|acceptance|enrollment|delivery|hire|start)[^,.;]{0,50}/i,
    // "on or before ..."
    /on\s+or\s+before\s+[^,.;]{1,70}/i,
    // "immediately upon/after/following ..."
    /immediately\s+(?:upon|after|following)\s+[^,.;]{1,60}/i,
    // "N days after/from/following ..."
    /\d+\s+days?\s+(?:after|from|following)\s+[^,.;]{1,60}/i,
    // "by the [deadline/date/start date/etc.]"
    /by\s+the\s+(?:deadline|due\s+date|start\s+date|expiration\s+date|date|close\s+of\s+enrollment)[^,.;]{0,50}/i,
    // "before the deadline"
    /before\s+(?:the\s+)?deadline[^,.;]{0,40}/i,
  ]

  for (const pattern of TRIGGER_PATTERNS) {
    const match = text.match(pattern)
    if (match) return match[0].trim()
  }

  return null
}

// ── Where-to-get-this inference ───────────────────────────────────────────────

/**
 * Returns conservative, safe guidance on where to confirm or obtain an item,
 * based on the item category and document type.
 *
 * Strict discipline:
 *   - Never invents office names, URLs, form numbers, or specific contacts.
 *   - Only uses category and document type as signals — never fabricates.
 *   - Returns null when no meaningful inference can be made.
 */
export function inferWhereToGetThis(
  category: string | null | undefined,
  documentType: string | null | undefined,
): string | null {
  const cat     = (category    ?? "").toLowerCase()
  const docType = (documentType ?? "").toLowerCase()

  // ── Category-first inference ────────────────────────────────────────────────

  if (/financ|payment|banking|loan|mortgage|billing|lender|credit|payroll/.test(cat))
    return "Confirm with the financial institution, lender, payer, or billing office named in the document."

  if (/legal|law|court|attorney|counsel|litigation|contract/.test(cat))
    return "Confirm with the attorney, court, or legal entity named in the document."

  if (/health|medical|clinic|hospital|provider|physician|therapy|lab/.test(cat))
    return "Confirm with the healthcare provider, insurer, or medical office named in the document."

  if (/insuran/.test(cat))
    return "Confirm with the insurance carrier or agent named in the document."

  if (/govern|federal|state|agenc|department|official|municipal|public/.test(cat))
    return "Confirm with the government agency or office identified in the document."

  if (/educat|school|academ|universit|college|enrollment|registrar|student/.test(cat))
    return "Confirm with the school, university, or educational institution that issued this document."

  if (/employ|hr\b|human.?resource|work|job|hire|onboard|payroll/.test(cat))
    return "Confirm with your employer, HR department, or the hiring organization named in the document."

  if (/real.?estate|housing|rental|lease|landlord|property|tenant/.test(cat))
    return "Confirm with the landlord, property manager, or real estate office named in the document."

  if (/form|admin|registration|compliance/.test(cat))
    return "Contact the issuing office or organization named in the document to confirm where to obtain or submit this."

  // ── Document-type fallback ─────────────────────────────────────────────────

  if (/lease|rental|tenant/.test(docType))
    return "Confirm with the landlord, property manager, or real estate office named in the document."

  if (/employ|job|offer\s*letter|onboard/.test(docType))
    return "Confirm with your employer, HR department, or the hiring organization named in the document."

  if (/medical|health|eob|explanation.of.benefit|insurance.claim|remittance/.test(docType))
    return "Confirm with the healthcare provider, insurer, or medical office named in the document."

  if (/school|enrollment|academ|university|college/.test(docType))
    return "Confirm with the school, university, or educational institution that issued this document."

  if (/loan|mortgage|lender|financ/.test(docType))
    return "Confirm with the financial institution, lender, or billing office named in the document."

  if (/govern|agenc|official|department|municipal/.test(docType))
    return "Confirm with the government agency or office identified in the document."

  if (/service\s*agreement|renovation|contractor|vendor/.test(docType))
    return "Confirm with the contractor, service provider, or vendor named in the document."

  return null
}
