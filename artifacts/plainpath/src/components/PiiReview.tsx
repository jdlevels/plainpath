// ─── PII Review Component ──────────────────────────────────────────────────────
// Shows detected PII, lets user approve/reject each item, previews result,
// applies true redactions, and exports the clean document.

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ShieldCheck, ShieldAlert, Check, X, Download, Copy, ChevronRight,
  Loader2, AlertCircle, RotateCcw, ArrowRight, Eye, EyeOff,
  CheckCheck, Trash2, ChevronDown, ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiBaseUrl } from "@/lib/api"
import type { PiiSpanWithStatus, PiiType } from "@/lib/piiTypes"
import { PII_TYPE_META, CATEGORY_ORDER } from "@/lib/piiTypes"
import {
  applyRedactions,
  buildPreviewSegments,
  downloadRedactedText,
  copyRedactedText,
  buildRedactionStats,
} from "@/lib/piiExport"
import type { RedactionStats } from "@/lib/piiExport"

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  text: string
  fileName?: string
  continueLabel?: string
  onAnalyzeRedacted: (redactedText: string) => void
  onCancel: () => void
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

// Extract surrounding context for an occurrence
function getContextSnippet(text: string, span: PiiSpanWithStatus, contextLen = 50): {
  before: string
  value: string
  after: string
  truncatedBefore: boolean
  truncatedAfter: boolean
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

// ─── Preview Renderer ─────────────────────────────────────────────────────────

function DocumentPreview({ text, spans }: { text: string; spans: PiiSpanWithStatus[] }) {
  const segments = useMemo(() => buildPreviewSegments(text, spans), [text, spans])
  const approvedCount = spans.filter(s => s.approved).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Redacted Preview
        </p>
        {approvedCount > 0 && (
          <span className="text-[11px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
            {approvedCount} will be redacted
          </span>
        )}
      </div>
      <div className="rounded-xl border border-border/50 bg-muted/20 dark:bg-muted/10 p-4 max-h-[380px] overflow-y-auto">
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono break-words">
          {segments.map((seg, i) => {
            if (seg.kind === "text") {
              return <span key={i}>{seg.text}</span>
            }
            const meta = PII_TYPE_META[seg.span.type]
            if (seg.span.approved) {
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs font-bold bg-black/85 dark:bg-black/90 text-white/90 not-italic mx-0.5 leading-tight"
                  title={`Will be redacted: ${meta.label}`}
                >
                  {meta.redactLabel}
                </span>
              )
            } else {
              return (
                <span
                  key={i}
                  className={`rounded px-0.5 ${meta.highlightBg} opacity-60`}
                  title={`Not redacting: ${meta.label}`}
                >
                  {seg.text}
                </span>
              )
            }
          })}
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground/50 text-center">
        Highlighted labels show items selected for redaction. Unselected values will remain unchanged.
      </p>
    </div>
  )
}

// ─── Span Group ────────────────────────────────────────────────────────────────
// Renders one row per unique value (with ×N count), expandable to see all
// occurrences with their surrounding context in the document.

function SpanGroup({
  group,
  text,
  allApproved,
  onToggle,
}: {
  group: PiiSpanWithStatus[]
  text: string
  allApproved: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const representative = group[0]
  const count = group.length
  const meta = PII_TYPE_META[representative.type]

  return (
    <div className={`rounded-lg border transition-all ${
      allApproved
        ? "border-destructive/30 bg-destructive/5 dark:bg-destructive/10"
        : "border-border/50 bg-background hover:border-border/70"
    }`}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none transition-all hover:bg-muted/20"
        onClick={onToggle}
      >
        {/* Selection checkbox */}
        <button
          type="button"
          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
            allApproved
              ? "bg-destructive/15 border border-destructive/40 text-destructive"
              : "border-2 border-border/50 bg-background text-transparent hover:border-border"
          }`}
          aria-label={allApproved ? "Deselect — keep this value" : "Select for redaction"}
        >
          {allApproved && <X className="w-3 h-3" />}
        </button>

        {/* Label + value */}
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full mr-2 ${meta.badgeBg} ${meta.badgeText}`}>
            {meta.label}
          </span>
          <span className={`text-sm font-mono ${
            allApproved
              ? "line-through text-muted-foreground/60"
              : "text-foreground/85"
          }`}>
            {truncateValue(representative.value)}
          </span>
          {count > 1 && (
            <span className="ml-2 text-[10px] font-medium text-muted-foreground/60 bg-muted/60 rounded-full px-1.5 py-0.5">
              ×{count}
            </span>
          )}
        </div>

        {/* Confidence */}
        <span className={`text-[10px] shrink-0 ${
          representative.confidence === "high" ? "text-emerald-600 dark:text-emerald-400" :
          representative.confidence === "medium" ? "text-amber-600 dark:text-amber-400" :
          "text-muted-foreground/50"
        }`}>
          {representative.confidence}
        </span>

        {/* Expand toggle (only if multiple occurrences) */}
        {count > 1 && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
            className="ml-0.5 p-1 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors shrink-0"
            aria-label={expanded ? "Collapse occurrences" : "Show all occurrences"}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Expanded context panel */}
      {expanded && count > 1 && (
        <div className={`border-t px-3 py-2.5 space-y-2 ${
          allApproved ? "border-destructive/20 bg-destructive/5" : "border-border/20 bg-muted/10"
        }`}>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
            {count} occurrences in document
          </p>
          {group.map((span, i) => {
            const ctx = getContextSnippet(text, span, 50)
            return (
              <div key={span.id} className="text-xs font-mono leading-relaxed text-muted-foreground/70">
                <span className="text-muted-foreground/30 mr-1.5 select-none">{i + 1}.</span>
                {ctx.truncatedBefore && <span className="opacity-40">…</span>}
                <span>{ctx.before}</span>
                <span className={`font-semibold rounded px-0.5 mx-0.5 ${
                  allApproved
                    ? "bg-destructive/15 text-destructive dark:text-red-400"
                    : "bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                }`}>{ctx.value}</span>
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
// Shown after user clicks "Apply Redactions". Includes:
//  - Structured breakdown of what was redacted
//  - Format verification (proof of true redaction)
//  - Export + continue actions

function AppliedView({
  redactedText,
  spans,
  fileName,
  continueLabel,
  onAnalyze,
  onReset,
}: {
  redactedText: string
  spans: PiiSpanWithStatus[]
  fileName?: string
  continueLabel: string
  onAnalyze: () => void
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [showRedacted, setShowRedacted] = useState(false)
  const stats = useMemo(() => buildRedactionStats(spans), [spans])

  async function handleCopy() {
    await copyRedactedText(redactedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUploadedFile = !!fileName

  return (
    <div className="space-y-5">

      {/* ── Summary panel ─────────────────────────────────────────────────── */}
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

        {/* Per-type breakdown */}
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

      {/* ── Format verification ───────────────────────────────────────────── */}
      <div className="rounded-lg border border-border/40 bg-muted/20 dark:bg-muted/10 px-4 py-3 space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          What's safe to share
        </p>
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
            <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Original values permanently replaced in the output — not hidden, not recoverable</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
            <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Downloaded <span className="font-mono">.txt</span> file contains only the redacted version</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
            <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Copied text contains only the redacted version</span>
          </div>
          {isUploadedFile ? (
            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Source file <span className="font-mono">{fileName}</span> is not modified — <strong>do not share the original file</strong></span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Pasted input: original values gone — no source file to worry about</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Redacted preview (collapsible) ────────────────────────────────── */}
      <div className="space-y-2">
        <button
          onClick={() => setShowRedacted(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showRedacted ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showRedacted ? "Hide" : "Inspect"} redacted output
        </button>
        {showRedacted && (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 max-h-[240px] overflow-y-auto">
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono break-words text-foreground/80">
              {redactedText}
            </p>
          </div>
        )}
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full h-12 text-sm rounded-xl gap-2"
          onClick={onAnalyze}
        >
          <ChevronRight className="w-4 h-4" />
          {continueLabel}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-lg"
            onClick={() => downloadRedactedText(redactedText, fileName)}
          >
            <Download className="w-4 h-4" />
            Download .txt
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-lg"
            onClick={handleCopy}
          >
            {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy text"}
          </Button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground/40 pt-0.5">
          Downloaded file and copied text contain only the redacted version
        </p>

        <button
          onClick={onReset}
          className="w-full text-xs text-muted-foreground/50 hover:text-muted-foreground py-1.5 flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start over with full document
        </button>
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
}: Props) {
  const [status, setStatus] = useState<DetectStatus>("detecting")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [spans, setSpans] = useState<PiiSpanWithStatus[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [applied, setApplied] = useState(false)
  const [redactedText, setRedactedText] = useState<string | null>(null)

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
        // All items start unselected — user must explicitly choose what to redact
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

  // ── Toggle all spans sharing the same normalized value ─────────────────────
  const toggleSameValue = useCallback((normalizedValue: string, approve: boolean) => {
    setSpans(prev => prev.map(s =>
      s.value.toLowerCase().trim() === normalizedValue ? { ...s, approved: approve } : s
    ))
  }, [])

  // ── Toggle all in category ─────────────────────────────────────────────────
  const toggleCategory = useCallback((category: string, approve: boolean) => {
    setSpans(prev => prev.map(s =>
      PII_TYPE_META[s.type].category === category ? { ...s, approved: approve } : s
    ))
  }, [])

  // ── Apply redactions ───────────────────────────────────────────────────────
  const applyAndShowResult = useCallback(() => {
    const result = applyRedactions(text, spans)
    setRedactedText(result)
    setApplied(true)
    setShowPreview(false)
  }, [text, spans])

  // ── Derived state ──────────────────────────────────────────────────────────
  const groups = useMemo(() => groupByCategory(spans), [spans])
  const approvedCount = useMemo(() => spans.filter(s => s.approved).length, [spans])

  // Unique values (for display in the header)
  const uniqueValueCount = useMemo(() => {
    return new Set(spans.map(s => s.value.toLowerCase().trim())).size
  }, [spans])

  const totalInstances = spans.length

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
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
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
        onAnalyze={() => onAnalyzeRedacted(redactedText)}
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
          <p className="text-sm text-emerald-700/70 dark:text-emerald-400/70">
            No names, IDs, account numbers, or other common PII was found in this document.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onCancel} className="h-11 rounded-xl">
            Back
          </Button>
          <Button onClick={() => onAnalyzeRedacted(text)} className="h-11 rounded-xl gap-2">
            {continueLabel} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ─── REVIEW STATE ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Detection header ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 space-y-1.5">
        <div className="flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              PlainPath found {uniqueValueCount} possible sensitive value{uniqueValueCount !== 1 ? "s" : ""}
              {totalInstances !== uniqueValueCount && (
                <span className="font-normal text-amber-700/70 dark:text-amber-400/70">
                  {" "}({totalInstances} total instance{totalInstances !== 1 ? "s" : ""})
                </span>
              )}
            </p>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5 leading-relaxed">
              Review and choose what to redact. You control which values are removed.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-amber-700/60 dark:text-amber-400/50 pl-8 leading-relaxed">
          Nothing is permanently redacted until you apply selected redactions.
        </p>
      </div>

      {/* ── Selection controls ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSpans(prev => prev.map(s => ({ ...s, approved: true })))}
          className="text-xs px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted/40 flex items-center gap-1.5 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5 text-destructive" /> Select all
        </button>
        <button
          onClick={() => setSpans(prev => prev.map(s => ({ ...s, approved: false })))}
          className="text-xs px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted/40 flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" /> Deselect all
        </button>
        <button
          onClick={() => setShowPreview(v => !v)}
          className="text-xs px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted/40 flex items-center gap-1.5 transition-colors ml-auto"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "Hide preview" : "Preview"}
        </button>
      </div>

      {/* ── Grouped detection list ──────────────────────────────────────── */}
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
        {Array.from(groups.entries()).map(([category, catSpans]) => {
          const allApproved = catSpans.every(s => s.approved)
          const noneApproved = catSpans.every(s => !s.approved)

          // Deduplicate by normalized value — one row per unique value
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
                    ({valueGroups.length}{catSpans.length !== valueGroups.length
                      ? `, ${catSpans.length} total`
                      : ""
                    })
                  </span>
                </p>
                <div className="flex gap-1.5">
                  {!allApproved && (
                    <button
                      onClick={() => toggleCategory(category, true)}
                      className="text-[10px] text-destructive/70 hover:text-destructive transition-colors px-1.5"
                    >
                      Select all
                    </button>
                  )}
                  {!noneApproved && (
                    <button
                      onClick={() => toggleCategory(category, false)}
                      className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors px-1.5"
                    >
                      Clear
                    </button>
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

      {/* ── Live preview ────────────────────────────────────────────────── */}
      {showPreview && <DocumentPreview text={text} spans={spans} />}

      {/* ── Apply CTA ───────────────────────────────────────────────────── */}
      <div className="space-y-2 pt-1">
        <Button
          size="lg"
          variant="destructive"
          className="w-full h-12 text-sm rounded-xl gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={applyAndShowResult}
          disabled={approvedCount === 0}
        >
          <ShieldCheck className="w-4 h-4" />
          {approvedCount === 0
            ? "Select items to redact"
            : `Apply selected redactions (${approvedCount})`
          }
        </Button>
        <button
          onClick={onCancel}
          className="w-full text-xs text-muted-foreground/50 hover:text-muted-foreground py-1.5 transition-colors"
        >
          Cancel — continue without redacting
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground/35 text-center leading-relaxed">
        Only selected items are redacted. Unselected values remain in the document unchanged.
      </p>
    </div>
  )
}
