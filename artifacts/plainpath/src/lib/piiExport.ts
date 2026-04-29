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
// PDF REDACTION:
//   Client-side rasterization — every page is rendered to canvas with black
//   boxes drawn directly over matched text, then exported as JPEG and
//   assembled into an image-only PDF via pdf-lib (no text layer at all).
//   This guarantees redacted values are permanently unrecoverable regardless
//   of the original PDF's font encoding or content-stream structure.

import type { PiiSpanWithStatus } from "@/lib/piiTypes"
import { PII_TYPE_META } from "@/lib/piiTypes"
import * as pdfjsLib from "pdfjs-dist"

// Configure the pdfjs worker once at module load (same URL as PdfRedactViewer)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

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
// Server applies permanent black-box redactions and returns a new PDF binary.
// The original File object is never modified — the server works on a copy.

export async function downloadRedactedPdf(
  originalFile: File,
  approvedValues: string[],
  apiBase: string,
  token?: string | null,
): Promise<void> {
  const formData = new FormData()
  formData.append("file", originalFile)
  formData.append("redactValues", JSON.stringify(approvedValues))

  const res = await fetch(`${apiBase}/api/documents/redact-pdf`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(data.message ?? `PDF redaction failed (${res.status})`)
  }

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
}

// ─── Client-side rasterized PDF download (image-only, no text layer) ─────────
// Renders every page to a canvas, draws black boxes directly over matched text
// pixels, exports each page as a JPEG, then assembles an image-only PDF.
// Because there is no text layer in the output, redacted values are permanently
// unrecoverable regardless of the source PDF's font encoding.

export async function downloadRedactedPdfClient(
  file: File,
  approvedValues: string[],
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const EXPORT_SCALE = 2.0  // 2× render resolution → crisp high-DPI output
  const PAD = 1.5            // same padding used in PdfRedactViewer preview

  // Lazy-load pdf-lib so it only enters the bundle when the user downloads
  const { PDFDocument } = await import("pdf-lib")

  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib
    .getDocument({ data: new Uint8Array(buf), verbosity: 0 })
    .promise

  const totalPages = pdf.numPages
  const outPdf = await PDFDocument.create()

  for (let pn = 1; pn <= totalPages; pn++) {
    onProgress?.(pn, totalPages)

    const page = await pdf.getPage(pn)
    const viewport = page.getViewport({ scale: EXPORT_SCALE })
    const w = Math.floor(viewport.width)
    const h = Math.floor(viewport.height)

    // ── Extract text items with canvas-space coordinates ─────────────────────
    const tc = await page.getTextContent()
    const pageItems: { str: string; x: number; y: number; w: number; h: number }[] = []
    for (const raw of tc.items) {
      if (!("str" in raw)) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itm = raw as any
      if (!itm.str?.trim()) continue
      const t: number[] = itm.transform
      const pdfH: number = itm.height > 0 ? itm.height : Math.abs(t[3]) || 10
      const pdfW: number = itm.width
      if (pdfW <= 0 || pdfH <= 0) continue
      const cx = t[4] * EXPORT_SCALE
      const cy = h - (t[5] + pdfH) * EXPORT_SCALE
      const cw = pdfW * EXPORT_SCALE
      const ch = pdfH * EXPORT_SCALE
      if (cw > 0 && ch > 0) pageItems.push({ str: itm.str, x: cx, y: cy, w: cw, h: ch })
    }

    // ── Match approved values → pixel-space black boxes ───────────────────────
    const blackBoxes = _findRedactBoxes(pageItems, approvedValues, PAD)

    // ── Render page to canvas ─────────────────────────────────────────────────
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise

    // ── Paint black boxes directly onto the rendered pixels ───────────────────
    ctx.fillStyle = "#000000"
    for (const box of blackBoxes) {
      ctx.fillRect(box.x, box.y, box.w, box.h)
    }

    // ── Export canvas as JPEG → embed in output PDF ───────────────────────────
    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95)
    const jpegBase64 = jpegDataUrl.split(",")[1]
    const jpegBytes = Uint8Array.from(atob(jpegBase64), c => c.charCodeAt(0))
    const jpegImage = await outPdf.embedJpg(jpegBytes)

    // Output page keeps the original PDF dimensions (points at 72 dpi)
    const origVP = page.getViewport({ scale: 1 })
    const pdfPage = outPdf.addPage([origVP.width, origVP.height])
    pdfPage.drawImage(jpegImage, { x: 0, y: 0, width: origVP.width, height: origVP.height })

    page.cleanup()
  }

  pdf.destroy()

  const pdfBytes = await outPdf.save()
  const blob = new Blob([pdfBytes], { type: "application/pdf" })
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_\-]/g, "_")
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${base}_redacted.pdf`
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a) }, 1000)
}

// ─── Internal: flat-text match → pixel boxes ──────────────────────────────────
// Same dual-index algorithm as PdfRedactViewer so preview and export match.
function _findRedactBoxes(
  items: { str: string; x: number; y: number; w: number; h: number }[],
  values: string[],
  pad: number,
): { x: number; y: number; w: number; h: number }[] {
  if (!items.length || !values.length) return []

  let flatSpaced = ""
  const spacedOffsets: { s: number; e: number; i: number }[] = []
  let flatDense = ""
  const denseOffsets: { s: number; e: number; i: number }[] = []

  for (let i = 0; i < items.length; i++) {
    const ss = flatSpaced.length
    flatSpaced += items[i].str
    spacedOffsets.push({ s: ss, e: flatSpaced.length, i })
    flatSpaced += " "
    const ds = flatDense.length
    flatDense += items[i].str
    denseOffsets.push({ s: ds, e: flatDense.length, i })
  }

  const result: { x: number; y: number; w: number; h: number }[] = []
  const seen = new Set<string>()

  function scanFlat(flat: string, offsets: { s: number; e: number; i: number }[], v: string) {
    let pos = 0
    while (true) {
      const found = flat.indexOf(v, pos)
      if (found === -1) break
      const fe = found + v.length
      for (const o of offsets) {
        if (o.s < fe && o.e > found) {
          const it = items[o.i]
          const k = `${Math.round(it.x)}:${Math.round(it.y)}`
          if (!seen.has(k)) {
            seen.add(k)
            result.push({ x: it.x - pad, y: it.y - pad, w: it.w + pad * 2, h: it.h + pad * 2 })
          }
        }
      }
      pos = found + 1
    }
  }

  for (const raw of values) {
    const v = raw.trim()
    if (v.length < 2) continue
    scanFlat(flatSpaced, spacedOffsets, v)
    scanFlat(flatDense, denseOffsets, v)
  }

  return result
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
