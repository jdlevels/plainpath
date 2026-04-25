// ─── PII Export Utilities ──────────────────────────────────────────────────────
// Apply true redactions to text and export/copy the result.
//
// TRUE REDACTION:
//   For text-based input (paste, extracted file text), redaction replaces
//   the actual character spans in the source string. The original value is
//   permanently gone from the output — not hidden behind an overlay.
//
//   Exported .txt files contain only the redacted version.
//   There is no underlying original text. This is genuine redaction.
//
// PHASE 2 (NOT YET BUILT):
//   - PDF binary redaction (modify actual PDF object stream)
//   - DOCX binary redaction (modify XML content directly)
//   - Redaction audit log (what was redacted, when, by whom)

import type { PiiSpanWithStatus } from "@/lib/piiTypes"
import { PII_TYPE_META } from "@/lib/piiTypes"

// ─── Apply redactions to text ─────────────────────────────────────────────────
// Takes the original text and a list of spans. Replaces all approved spans
// with their [REDACTED · TYPE] placeholder. Spans must not overlap.

export function applyRedactions(text: string, spans: PiiSpanWithStatus[]): string {
  const approved = spans
    .filter(s => s.approved)
    .sort((a, b) => b.start - a.start) // Process in reverse order to preserve positions

  let result = text
  for (const span of approved) {
    const meta = PII_TYPE_META[span.type]
    const placeholder = `[${meta.redactLabel}]`
    result = result.slice(0, span.start) + placeholder + result.slice(span.end)
  }

  return result
}

// ─── Build text segments for preview rendering ─────────────────────────────
// Splits the document text into alternating non-PII and PII segments.
// Approved spans are marked for highlight; rejected spans are shown as-is.

export type TextSegment =
  | { kind: "text"; text: string }
  | { kind: "span"; text: string; span: PiiSpanWithStatus }

export function buildPreviewSegments(text: string, spans: PiiSpanWithStatus[]): TextSegment[] {
  // Sort by start position ascending, then take only non-overlapping spans
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const nonOverlapping: PiiSpanWithStatus[] = []
  let cursor = 0
  for (const span of sorted) {
    if (span.start >= cursor) {
      nonOverlapping.push(span)
      cursor = span.end
    }
  }

  const segments: TextSegment[] = []
  let pos = 0
  for (const span of nonOverlapping) {
    if (span.start > pos) {
      segments.push({ kind: "text", text: text.slice(pos, span.start) })
    }
    segments.push({ kind: "span", text: text.slice(span.start, span.end), span })
    pos = span.end
  }
  if (pos < text.length) {
    segments.push({ kind: "text", text: text.slice(pos) })
  }

  return segments
}

// ─── Download as .txt ─────────────────────────────────────────────────────────
// Creates a downloadable .txt file with the redacted text.
// This is the only export format for Phase 1.
// The downloaded file contains ONLY the redacted version.

export function downloadRedactedText(redactedText: string, originalName?: string): void {
  const base = originalName
    ? originalName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_\-]/g, "_")
    : "document"
  const filename = `${base}_redacted.txt`

  const blob = new Blob([redactedText], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 1000)
}

// ─── Download as redacted PDF ─────────────────────────────────────────────────
// Sends the original PDF + approved span values to the server.
// Server rasterizes each page, draws black bars, and returns a new image-only PDF.
// The original File object is never modified — the server works on a copy.
//
// Returns { matched, missed } — counts of how many approved values were found
// in the PDF text layer vs. not found. Callers can surface a warning if missed > 0.

export type RedactPdfResult = {
  matched: number
  missed: number
}

export async function downloadRedactedPdf(
  originalFile: File,
  approvedValues: string[],
  apiBase: string,
): Promise<RedactPdfResult> {
  const formData = new FormData()
  formData.append("file", originalFile)
  formData.append("redactValues", JSON.stringify(approvedValues))

  const res = await fetch(`${apiBase}/api/documents/redact-pdf`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string; code?: string }
    // Surface specific, user-safe messages from structured error codes
    const code = data.code
    if (res.status === 401 || res.status === 403) {
      throw new Error("Your session expired. Please refresh the page and try again.")
    }
    if (code === "NO_TEXT_LAYER") {
      throw new Error("No selectable text found in this PDF. Try a text-based PDF rather than a scanned image.")
    }
    if (code === "FILE_TOO_LARGE" || res.status === 413) {
      throw new Error("This PDF exceeds the export limit. Try splitting it into smaller sections.")
    }
    if (code === "RASTERIZER_FAILED") {
      throw new Error("PDF rendering failed. Please try again or use a different PDF.")
    }
    throw new Error(data.message ?? "PDF redaction failed. Your document and selections were preserved.")
  }

  const matched = parseInt(res.headers.get("X-Redact-Matched") ?? "0", 10)
  const missed = parseInt(res.headers.get("X-Redact-Missed") ?? "0", 10)

  const blob = await res.blob()
  const base = originalFile.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_\-]/g, "_")
  const filename = `${base}_redacted.pdf`

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 1000)

  return { matched, missed }
}

// ─── Copy to clipboard ─────────────────────────────────────────────────────
// Copies the redacted text to the clipboard.
// The copied content is the fully redacted version only.

export async function copyRedactedText(redactedText: string): Promise<void> {
  await navigator.clipboard.writeText(redactedText)
}

// ─── Redaction summary (plain string) ─────────────────────────────────────
// Returns a human-readable one-liner of what was redacted.

export function buildRedactionSummary(spans: PiiSpanWithStatus[]): string {
  const approved = spans.filter(s => s.approved)
  if (approved.length === 0) return "No items were redacted."

  const counts: Partial<Record<string, number>> = {}
  for (const span of approved) {
    const label = PII_TYPE_META[span.type].label
    counts[label] = (counts[label] ?? 0) + 1
  }

  const lines = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => `${count} ${label}${count > 1 ? "s" : ""}`)

  return `${approved.length} item${approved.length > 1 ? "s" : ""} redacted: ${lines.join(", ")}.`
}

// ─── Redaction stats (structured) ──────────────────────────────────────────
// Returns a structured breakdown used for the summary panel.

export type RedactionStats = {
  totalInstances: number    // total span instances detected (not unique values)
  totalRedacted: number     // approved span instances
  totalSkipped: number      // rejected span instances
  uniqueValues: number      // unique distinct values across all spans
  uniqueRedacted: number    // unique values being redacted
  uniqueSkipped: number     // unique values being kept
  byType: { label: string; redacted: number; skipped: number }[]
  hasRepeatedValues: boolean
}

export function buildRedactionStats(spans: PiiSpanWithStatus[]): RedactionStats {
  const approved = spans.filter(s => s.approved)
  const skipped = spans.filter(s => !s.approved)

  const allValues = new Set(spans.map(s => s.value.toLowerCase().trim()))
  const redactedValues = new Set(approved.map(s => s.value.toLowerCase().trim()))
  const skippedValues = new Set(skipped.map(s => s.value.toLowerCase().trim()))

  const byLabel: Record<string, { redacted: number; skipped: number }> = {}
  for (const span of spans) {
    const label = PII_TYPE_META[span.type].label
    if (!byLabel[label]) byLabel[label] = { redacted: 0, skipped: 0 }
    if (span.approved) byLabel[label].redacted++
    else byLabel[label].skipped++
  }

  const byType = Object.entries(byLabel)
    .map(([label, counts]) => ({ label, ...counts }))
    .sort((a, b) => (b.redacted + b.skipped) - (a.redacted + a.skipped))

  return {
    totalInstances: spans.length,
    totalRedacted: approved.length,
    totalSkipped: skipped.length,
    uniqueValues: allValues.size,
    uniqueRedacted: redactedValues.size,
    uniqueSkipped: skippedValues.size,
    byType,
    hasRepeatedValues: spans.length > allValues.size,
  }
}
