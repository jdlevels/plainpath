// ─── PII Review Component ──────────────────────────────────────────────────────
// Shows detected PII, lets user approve/reject each item, previews result,
// applies true redactions, and exports the clean document.
//
// Layout: two-column on lg+ (left=preview, right=controls), stacked on mobile.

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ShieldCheck, ShieldAlert, Check, X, Download, Copy, ChevronRight,
  Loader2, AlertCircle, RotateCcw, ArrowRight, ArrowLeft,
  CheckCheck, Trash2, ChevronDown, ChevronUp, FileDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiBaseUrl } from "@/lib/api"
import type { PiiSpanWithStatus } from "@/lib/piiTypes"
import { PII_TYPE_META, CATEGORY_ORDER } from "@/lib/piiTypes"
import {
  applyRedactions,
  buildPreviewSegments,
  downloadRedactedText,
  downloadRedactedPdf,
  copyRedactedText,
  buildRedactionStats,
} from "@/lib/piiExport"
import type { RedactionStats } from "@/lib/piiExport"
import { PdfRedactViewer } from "@/components/PdfRedactViewer"

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  text: string
  fileName?: string
  continueLabel?: string
  onAnalyzeRedacted: (redactedText: string, approvedValues?: string[]) => void
  onCancel: () => void
  sourcePdfFile?: File | null
  sourceImageFile?: File | null
}

// ─── Detection status ─────────────────────────────────────────────────────────

type DetectStatus = "idle" | "detecting" | "done" | "error"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateValue(value: string, max = 36): string {
  return value.length > max ? value.slice(0, max) + "…" : value
}

function groupByCategory(spans: PiiSpanWithStatus[]): Map<string, PiiSpanWithStatus[]> {
  const map = new Map<string, PiiSpanWithStatus[]>()
  for (const span of spans) {
    const cat = PII_TYPE_META[span.type].category
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(span)
  }
  const sorted = new Map<string, PiiSpanWithStatus[]>()
  for (const cat of CATEGORY_ORDER) {
    if (map.has(cat)) sorted.set(cat, map.get(cat)!)
  }
  for (const [cat, items] of map) {
    if (!sorted.has(cat)) sorted.set(cat, items)
  }
  return sorted
}

function getContextSnippet(text: string, span: PiiSpanWithStatus, contextLen = 50): {
  before: string; value: string; after: string; truncatedBefore: boolean; truncatedAfter: boolean
} {
  const rawBefore = text.slice(Math.max(0, span.start - contextLen), span.start)
  const rawAfter = text.slice(span.end, Math.min(text.length, span.end + contextLen))
  return {
    before: rawBefore.replace(/\s+/g, " "),
    value: span.value,
    after: rawAfter.replace(/\s+/g, " "),
    truncatedBefore: span.start > contextLen,
    truncatedAfter: span.end + contextLen < text.length,
  }
}

// ─── Document Preview (text with highlights) ─────────────────────────────────

function DocumentPreview({ text, spans }: { text: string; spans: PiiSpanWithStatus[] }) {
  const segments = useMemo(() => buildPreviewSegments(text, spans), [text, spans])
  const approvedCount = spans.filter(s => s.approved).length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          Document Preview
        </p>
        {approvedCount > 0 && (
          <span className="text-[11px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
            {approvedCount} will be redacted
          </span>
        )}
      </div>
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <div className="bg-neutral-100 dark:bg-zinc-900/70 p-4 max-h-[75vh] overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 rounded-sm shadow-sm px-8 py-8 min-h-[480px]">
        <p className="text-[13px] leading-[1.75] whitespace-pre-wrap font-mono break-words text-neutral-900 dark:text-neutral-100">
          {segments.map((seg, i) => {
            if (seg.kind === "text") return <span key={i}>{seg.text}</span>
            const meta = PII_TYPE_META[seg.span.type]
            if (seg.span.approved) {
              return (
                <span key={i} className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs font-bold bg-black/85 dark:bg-black/90 text-white/90 not-italic mx-0.5 leading-tight" title={`Will be redacted: ${meta.label}`}>
                  {meta.redactLabel}
                </span>
              )
            }
            return (
              <span key={i} className={`rounded px-0.5 ${meta.highlightBg} opacity-60`} title={`Not redacting: ${meta.label}`}>
                {seg.text}
              </span>
            )
          })}
        </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Span Group Row ───────────────────────────────────────────────────────────

function SpanGroup({
  group, text, allApproved, onToggle,
}: { group: PiiSpanWithStatus[]; text: string; allApproved: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const representative = group[0]
  const count = group.length
  const meta = PII_TYPE_META[representative.type]

  return (
    <div className={`rounded-lg border transition-all ${allApproved ? "border-destructive/30 bg-destructive/5 dark:bg-destructive/10" : "border-border/50 bg-background hover:border-border/70"}`}>
      <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none transition-all hover:bg-muted/20" onClick={onToggle}>
        <button type="button" className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${allApproved ? "bg-destructive/15 border border-destructive/40 text-destructive" : "border-2 border-border/50 bg-background text-transparent hover:border-border"}`} aria-label={allApproved ? "Deselect" : "Select for redaction"}>
          {allApproved && <X className="w-3 h-3" />}
        </button>
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full mr-2 ${meta.badgeBg} ${meta.badgeText}`}>{meta.label}</span>
          <span className={`text-sm font-mono ${allApproved ? "line-through text-muted-foreground/60" : "text-foreground/85"}`}>{truncateValue(representative.value)}</span>
          {count > 1 && <span className="ml-2 text-[10px] font-medium text-muted-foreground/60 bg-muted/60 rounded-full px-1.5 py-0.5">×{count}</span>}
        </div>
        <span className={`text-[10px] shrink-0 ${representative.confidence === "high" ? "text-emerald-600 dark:text-emerald-400" : representative.confidence === "medium" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/50"}`}>{representative.confidence}</span>
        {count > 1 && (
          <button type="button" onClick={e => { e.stopPropagation(); setExpanded(v => !v) }} className="ml-0.5 p-1 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors shrink-0">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>
      {expanded && count > 1 && (
        <div className={`border-t px-3 py-2.5 space-y-2 ${allApproved ? "border-destructive/20 bg-destructive/5" : "border-border/20 bg-muted/10"}`}>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">{count} occurrences in document</p>
          {group.map((span, i) => {
            const ctx = getContextSnippet(text, span, 50)
            return (
              <div key={span.id} className="text-xs font-mono leading-relaxed text-muted-foreground/70">
                <span className="text-muted-foreground/30 mr-1.5 select-none">{i + 1}.</span>
                {ctx.truncatedBefore && <span className="opacity-40">…</span>}
                <span>{ctx.before}</span>
                <span className={`font-semibold rounded px-0.5 mx-0.5 ${allApproved ? "bg-destructive/15 text-destructive dark:text-red-400" : "bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"}`}>{ctx.value}</span>
                <span>{ctx.after}</span>
                {ctx.truncatedAfter && <span className="opacity-40">…</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Applied / Summary View ────────────────────────────────────────────────────

function AppliedView({
  redactedText, spans, fileName, continueLabel, sourcePdfFile, sourceImageFile, imageObjectUrl, onAnalyze, onReset,
}: {
  redactedText: string
  spans: PiiSpanWithStatus[]
  fileName?: string
  continueLabel: string
  sourcePdfFile?: File | null
  sourceImageFile?: File | null
  imageObjectUrl?: string | null
  onAnalyze: () => void
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [showRedacted, setShowRedacted] = useState(false)
  const [pdfDownloading, setPdfDownloading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const stats = useMemo(() => buildRedactionStats(spans), [spans])

  const isPdfUpload = !!(sourcePdfFile && sourcePdfFile.name.toLowerCase().endsWith(".pdf"))
  const approvedValues = useMemo(
    () => [...new Set(spans.filter(s => s.approved).map(s => s.value))],
    [spans]
  )

  async function handleCopy() {
    await copyRedactedText(redactedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownloadPdf() {
    if (!sourcePdfFile || pdfDownloading) return
    setPdfDownloading(true)
    setPdfError(null)
    try {
      await downloadRedactedPdf(sourcePdfFile, approvedValues, getApiBaseUrl())
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF download failed. Please try again.")
    } finally {
      setPdfDownloading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-start gap-5">

      {/* ── LEFT: Final preview ──────────────────────────────────────────── */}
      <div className="w-full lg:w-[60%] lg:sticky lg:top-20 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isPdfUpload ? "Redacted PDF Preview" : "Redacted Document"}
          </p>
          {isPdfUpload && (
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
              black boxes = permanently hidden
            </span>
          )}
        </div>

        {isPdfUpload && sourcePdfFile && (
          <PdfRedactViewer file={sourcePdfFile} approvedValues={approvedValues} />
        )}

        {!isPdfUpload && sourceImageFile && imageObjectUrl && (
          <div className="rounded-xl border border-border/30 overflow-hidden bg-muted/10">
            <img src={imageObjectUrl} alt={sourceImageFile.name} className="w-full object-contain max-h-[70vh]" />
            <p className="text-[10px] text-center text-muted-foreground/50 py-1.5 border-t border-border/20">
              Source image — pixel redaction not available, see text output below
            </p>
          </div>
        )}

        {!isPdfUpload && !sourceImageFile && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Redacted text output</p>
              <button onClick={() => setShowRedacted(v => !v)} className="text-[10px] text-primary hover:text-primary/80 transition-colors">
                {showRedacted ? "Hide" : "Show"} full text
              </button>
            </div>
            {showRedacted && (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4 max-h-[65vh] overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono break-words text-foreground/80">{redactedText}</p>
              </div>
            )}
            {!showRedacted && (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground/60 italic text-center py-4">Click "Show full text" to inspect redacted output</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: Summary + actions ─────────────────────────────────────── */}
      <div className="flex-1 space-y-4">

        {/* Back link */}
        <button onClick={onReset} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Adjust redactions
        </button>

        {/* Summary panel */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {stats.totalRedacted === 0
                  ? "No items redacted — document unchanged"
                  : `${stats.uniqueRedacted} value${stats.uniqueRedacted !== 1 ? "s" : ""} permanently removed (${stats.totalRedacted} instance${stats.totalRedacted !== 1 ? "s" : ""})`
                }
              </p>
              {stats.totalSkipped > 0 && (
                <p className="text-xs text-emerald-700/60 dark:text-emerald-400/60 mt-0.5">
                  {stats.uniqueSkipped} value{stats.uniqueSkipped !== 1 ? "s" : ""} left unchanged by your choice
                </p>
              )}
            </div>
          </div>
          {stats.byType.some(t => t.redacted > 0) && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pl-7">
              {stats.byType.filter(t => t.redacted > 0).map(t => (
                <div key={t.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-800/70 dark:text-emerald-300/70 truncate">{t.label}</span>
                  <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">{t.redacted}</span>
                </div>
              ))}
              {stats.totalSkipped > 0 && (
                <div className="flex items-center justify-between gap-2 col-span-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-700/30 mt-0.5">
                  <span className="text-xs text-emerald-800/40 dark:text-emerald-400/40">Left unchanged</span>
                  <span className="text-xs font-mono text-emerald-800/40 dark:text-emerald-400/40">{stats.totalSkipped}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PDF status banners */}
        {isPdfUpload && (
          <div className="rounded-lg border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 px-4 py-3 space-y-1.5">
            <div className="flex items-start gap-2 text-xs text-violet-700 dark:text-violet-400">
              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
              <span><span className="font-semibold">Original PDF unchanged</span> — {sourcePdfFile?.name} was not modified</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-violet-700 dark:text-violet-400">
              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
              <span><span className="font-semibold">Redacted PDF copy ready</span> — solid black boxes permanently cover all selected items</span>
            </div>
          </div>
        )}

        {!isPdfUpload && (
          <div className="rounded-lg border border-border/40 bg-muted/20 dark:bg-muted/10 px-4 py-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">What's safe to share</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Original values permanently replaced — not hidden, not recoverable</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Downloaded <span className="font-mono">.txt</span> file contains only the redacted version</span>
              </div>
              {fileName && (
                <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Original file <span className="font-mono">{fileName}</span> is not modified — do not share it</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsible redacted text (for PDF uploads where text isn't the left panel) */}
        {isPdfUpload && (
          <div className="space-y-2">
            <button onClick={() => setShowRedacted(v => !v)} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              {showRedacted ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showRedacted ? "Hide" : "Inspect"} redacted text output
            </button>
            {showRedacted && (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4 max-h-[200px] overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono break-words text-foreground/80">{redactedText}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isPdfUpload && (
            <div className="space-y-1.5">
              <Button size="lg" className="w-full h-12 text-sm rounded-xl gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleDownloadPdf} disabled={pdfDownloading}>
                {pdfDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                {pdfDownloading ? "Building redacted PDF…" : "Download Redacted PDF"}
              </Button>
              {pdfError && <p className="text-xs text-destructive text-center">{pdfError}</p>}
              <p className="text-[10px] text-center text-muted-foreground/50">Black boxes permanently cover selected content · original file unchanged</p>
            </div>
          )}

          <Button size={isPdfUpload ? "sm" : "lg"} className={`w-full rounded-xl gap-2 ${isPdfUpload ? "h-10 text-xs" : "h-12 text-sm"}`} onClick={onAnalyze} variant={isPdfUpload ? "outline" : "default"}>
            <ChevronRight className="w-4 h-4" />
            {continueLabel}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-10 gap-2 rounded-lg" onClick={() => downloadRedactedText(redactedText, fileName)}>
              <Download className="w-4 h-4" />
              Download .txt
            </Button>
            <Button variant="outline" size="sm" className="h-10 gap-2 rounded-lg" onClick={handleCopy}>
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy text"}
            </Button>
          </div>

          {isPdfUpload && (
            <p className="text-[10px] text-center text-muted-foreground/40">.txt download is text-only — use PDF download above for a redacted copy of the original</p>
          )}
          {!isPdfUpload && (
            <p className="text-[11px] text-center text-muted-foreground/40 pt-0.5">Downloaded file and copied text contain only the redacted version</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PiiReview({
  text,
  fileName,
  continueLabel = "Analyze this document",
  onAnalyzeRedacted,
  onCancel,
  sourcePdfFile,
  sourceImageFile,
}: Props) {
  const [status, setStatus] = useState<DetectStatus>("detecting")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [spans, setSpans] = useState<PiiSpanWithStatus[]>([])
  const [applied, setApplied] = useState(false)
  const [redactedText, setRedactedText] = useState<string | null>(null)

  // Object URL for image preview (stable across renders)
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null)
  useEffect(() => {
    const file = sourceImageFile ?? null
    if (!file) { setImageObjectUrl(null); return }
    const url = URL.createObjectURL(file)
    setImageObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [sourceImageFile])

  // ── Detect PII on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setStatus("detecting")
    ;(async () => {
      try {
        const apiBase = getApiBaseUrl()
        const res = await fetch(`${apiBase}/api/documents/detect-pii`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })
        if (!res.ok) throw new Error(`Detection failed (${res.status})`)
        const data = await res.json() as { spans: Omit<PiiSpanWithStatus, "approved">[] }
        if (cancelled) return
        setSpans((data.spans ?? []).map(s => ({ ...s, approved: false })))
        setStatus("done")
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : "PII detection failed")
        setStatus("error")
      }
    })()
    return () => { cancelled = true }
  }, [text])

  const toggleSameValue = useCallback((normalizedValue: string, approve: boolean) => {
    setSpans(prev => prev.map(s => s.value.toLowerCase().trim() === normalizedValue ? { ...s, approved: approve } : s))
  }, [])

  const toggleCategory = useCallback((category: string, approve: boolean) => {
    setSpans(prev => prev.map(s => PII_TYPE_META[s.type].category === category ? { ...s, approved: approve } : s))
  }, [])

  const applyAndShowResult = useCallback(() => {
    const result = applyRedactions(text, spans)
    setRedactedText(result)
    setApplied(true)
  }, [text, spans])

  const groups = useMemo(() => groupByCategory(spans), [spans])
  const approvedCount = useMemo(() => spans.filter(s => s.approved).length, [spans])
  const uniqueValueCount = useMemo(() => new Set(spans.map(s => s.value.toLowerCase().trim())).size, [spans])
  const totalInstances = spans.length

  const isPdfSource = !!(sourcePdfFile && sourcePdfFile.name.toLowerCase().endsWith(".pdf"))

  const approvedValuesForViewer = useMemo(
    () => [...new Set(spans.filter(s => s.approved).map(s => s.value))],
    [spans]
  )

  const detectedValuesForViewer = useMemo(
    () => [...new Set(spans.filter(s => !s.approved).map(s => s.value))],
    [spans]
  )

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (status === "detecting") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-primary/10 scale-125 animate-pulse" />
          <div className="relative w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div>
          <p className="font-semibold text-foreground">Scanning for sensitive information</p>
          <p className="text-sm text-muted-foreground mt-1">Checking for names, IDs, financial data, and more…</p>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ─── ERROR ────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="space-y-4 py-8 text-center">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <p className="font-semibold">Detection failed</p>
        <p className="text-sm text-muted-foreground">{errorMsg}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onCancel} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
          <Button onClick={() => setStatus("detecting")}>Try again</Button>
        </div>
      </div>
    )
  }

  // ─── APPLIED STATE ────────────────────────────────────────────────────────
  if (applied && redactedText !== null) {
    return (
      <AppliedView
        redactedText={redactedText}
        spans={spans}
        fileName={fileName}
        continueLabel={continueLabel}
        sourcePdfFile={sourcePdfFile}
        sourceImageFile={sourceImageFile}
        imageObjectUrl={imageObjectUrl}
        onAnalyze={() => onAnalyzeRedacted(redactedText, approvedValuesForViewer)}
        onReset={() => { setApplied(false); setRedactedText(null) }}
      />
    )
  }

  // ─── NO PII FOUND ─────────────────────────────────────────────────────────
  if (totalInstances === 0) {
    return (
      <div className="space-y-5 py-4">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 p-5 text-center flex flex-col items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">No sensitive information detected</p>
          <p className="text-sm text-emerald-700/70 dark:text-emerald-400/70">No names, IDs, account numbers, or other common PII was found in this document.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onCancel} className="h-11 rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={() => onAnalyzeRedacted(text)} className="h-11 rounded-xl gap-2">
            {continueLabel} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ─── REVIEW STATE — two-column layout ────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row lg:items-start gap-5">

      {/* ── LEFT: Document preview (sticky on desktop) ───────────────────── */}
      <div className="w-full lg:w-[60%] lg:sticky lg:top-20 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isPdfSource ? "Live PDF Preview" : sourceImageFile ? "Source Document" : "Document Preview"}
          </p>
          {isPdfSource && (
            <>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
                updates as you select
              </span>
              <span className="text-[9px] text-muted-foreground/50">
                amber = detected · black = will be redacted
              </span>
            </>
          )}
          {sourceImageFile && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
              text extracted via AI
            </span>
          )}
        </div>

        {isPdfSource && sourcePdfFile && (
          <PdfRedactViewer
            file={sourcePdfFile}
            approvedValues={approvedValuesForViewer}
            detectedValues={detectedValuesForViewer}
          />
        )}

        {!isPdfSource && sourceImageFile && imageObjectUrl && (
          <div className="rounded-xl border border-border/30 overflow-hidden bg-muted/10">
            <img src={imageObjectUrl} alt={sourceImageFile.name} className="w-full object-contain max-h-[70vh]" />
            <p className="text-[10px] text-center text-muted-foreground/40 py-1.5 border-t border-border/20">
              Pixel-level redaction unavailable for images — select items to produce a redacted text copy
            </p>
          </div>
        )}

        {!isPdfSource && !sourceImageFile && (
          <DocumentPreview text={text} spans={spans} />
        )}
      </div>

      {/* ── RIGHT: Controls panel ────────────────────────────────────────── */}
      <div className="flex-1 space-y-4">

        {/* Back navigation */}
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to document
        </button>

        {/* Detection summary */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 space-y-1.5">
          <div className="flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                PlainPath found {uniqueValueCount} possible sensitive value{uniqueValueCount !== 1 ? "s" : ""}
                {totalInstances !== uniqueValueCount && (
                  <span className="font-normal text-amber-700/70 dark:text-amber-400/70"> ({totalInstances} total instance{totalInstances !== 1 ? "s" : ""})</span>
                )}
              </p>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5 leading-relaxed">
                Review and choose what to redact. You control which values are removed.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-amber-700/60 dark:text-amber-400/50 pl-8 leading-relaxed">
            Nothing is permanently redacted until you click Apply.
          </p>
        </div>

        {/* Bulk selection controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setSpans(prev => prev.map(s => ({ ...s, approved: true })))} className="text-xs px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted/40 flex items-center gap-1.5 transition-colors">
            <CheckCheck className="w-3.5 h-3.5 text-destructive" /> Select all
          </button>
          <button onClick={() => setSpans(prev => prev.map(s => ({ ...s, approved: false })))} className="text-xs px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted/40 flex items-center gap-1.5 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" /> Deselect all
          </button>
          {approvedCount > 0 && (
            <span className="ml-auto text-xs font-medium text-destructive/80 bg-destructive/8 px-2 py-1 rounded-lg">
              {approvedCount} selected
            </span>
          )}
        </div>

        {/* Detection groups list */}
        <div className="space-y-4">
          {Array.from(groups.entries()).map(([category, catSpans]) => {
            const allApproved = catSpans.every(s => s.approved)
            const noneApproved = catSpans.every(s => !s.approved)
            const valueGroups = Array.from(
              catSpans.reduce((acc, span) => {
                const key = span.value.toLowerCase().trim()
                if (!acc.has(key)) acc.set(key, [])
                acc.get(key)!.push(span)
                return acc
              }, new Map<string, PiiSpanWithStatus[]>())
            )

            return (
              <div key={category} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                    <span className="ml-1.5 font-normal text-muted-foreground/50">
                      ({valueGroups.length}{catSpans.length !== valueGroups.length ? `, ${catSpans.length} total` : ""})
                    </span>
                  </p>
                  <div className="flex gap-1.5">
                    {!allApproved && (
                      <button onClick={() => toggleCategory(category, true)} className="text-[10px] text-destructive/70 hover:text-destructive transition-colors px-1.5">Select all</button>
                    )}
                    {!noneApproved && (
                      <button onClick={() => toggleCategory(category, false)} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors px-1.5">Clear</button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  {valueGroups.map(([normVal, group]) => {
                    const allInGroupApproved = group.every(s => s.approved)
                    return (
                      <SpanGroup
                        key={normVal}
                        group={group}
                        text={text}
                        allApproved={allInGroupApproved}
                        onToggle={() => toggleSameValue(normVal, !allInGroupApproved)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Apply CTA */}
        <div className="space-y-2 pt-1 border-t border-border/30">
          <Button
            size="lg"
            variant="destructive"
            className="w-full h-12 text-sm rounded-xl gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={applyAndShowResult}
            disabled={approvedCount === 0}
          >
            <ShieldCheck className="w-4 h-4" />
            {approvedCount === 0 ? "Select items to redact" : `Apply redactions (${approvedCount} item${approvedCount !== 1 ? "s" : ""})`}
          </Button>
          <button onClick={onCancel} className="w-full text-xs text-muted-foreground/50 hover:text-muted-foreground py-1.5 transition-colors flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-3 h-3" />
            Cancel — continue without redacting
          </button>
        </div>

      </div>
    </div>
  )
}
