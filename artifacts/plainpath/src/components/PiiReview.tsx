// ─── PII Review Component ──────────────────────────────────────────────────────
// Shows detected PII, lets user approve/reject each item, previews result,
// applies true redactions, and exports the clean document.

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ShieldCheck, ShieldAlert, Check, X, Download, Copy, ChevronRight,
  Loader2, AlertCircle, RotateCcw, ArrowRight, Eye, EyeOff,
  CheckCheck, Trash2,
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
  buildRedactionSummary,
} from "@/lib/piiExport"

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
  // Sort categories by CATEGORY_ORDER
  const sorted = new Map<string, PiiSpanWithStatus[]>()
  for (const cat of CATEGORY_ORDER) {
    if (map.has(cat)) sorted.set(cat, map.get(cat)!)
  }
  for (const [cat, items] of map) {
    if (!sorted.has(cat)) sorted.set(cat, items)
  }
  return sorted
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
            {approvedCount} item{approvedCount !== 1 ? "s" : ""} will be redacted
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
        Black labels show what will be replaced in the final export. Faded text will remain.
      </p>
    </div>
  )
}

// ─── Span Row ──────────────────────────────────────────────────────────────────

function SpanRow({ span, count = 1, allApproved, onToggle }: {
  span: PiiSpanWithStatus
  count?: number
  allApproved: boolean
  onToggle: () => void
}) {
  const meta = PII_TYPE_META[span.type]
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer select-none ${
        allApproved
          ? "border-border/60 bg-background hover:bg-muted/30"
          : "border-border/30 bg-muted/20 opacity-60 hover:opacity-80"
      }`}
      onClick={onToggle}
    >
      <button
        type="button"
        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
          allApproved
            ? "bg-destructive/15 border border-destructive/30 text-destructive"
            : "bg-muted border border-border/50 text-muted-foreground"
        }`}
        aria-label={allApproved ? "Click to keep (un-redact)" : "Click to redact"}
      >
        {allApproved ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full mr-2 ${meta.badgeBg} ${meta.badgeText}`}>
          {meta.label}
        </span>
        <span className={`text-sm font-mono ${allApproved ? "line-through text-muted-foreground/70" : "text-foreground/80"}`}>
          {truncateValue(span.value)}
        </span>
        {count > 1 && (
          <span className="ml-2 text-[10px] font-medium text-muted-foreground/60 bg-muted/50 rounded-full px-1.5 py-0.5">
            ×{count}
          </span>
        )}
      </div>

      <span className={`text-[10px] shrink-0 ${
        span.confidence === "high" ? "text-emerald-600 dark:text-emerald-400" :
        span.confidence === "medium" ? "text-amber-600 dark:text-amber-400" :
        "text-muted-foreground/50"
      }`}>
        {span.confidence}
      </span>
    </div>
  )
}

// ─── Applied State ────────────────────────────────────────────────────────────

function AppliedView({
  redactedText,
  spans,
  fileName,
  onAnalyze,
  onReset,
}: {
  redactedText: string
  spans: PiiSpanWithStatus[]
  fileName?: string
  onAnalyze: () => void
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)
  const summary = buildRedactionSummary(spans)
  const approvedCount = spans.filter(s => s.approved).length

  async function handleCopy() {
    await copyRedactedText(redactedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Summary banner */}
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            {approvedCount === 0 ? "No items redacted" : `${approvedCount} item${approvedCount !== 1 ? "s" : ""} permanently redacted`}
          </p>
          <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">{summary}</p>
        </div>
      </div>

      {/* Notice */}
      <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-3 flex gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
          <strong>These redactions are permanent in the exported output.</strong> The original values are not present in the downloaded file or copied text. Review before sharing externally.
        </p>
      </div>

      {/* Redacted preview */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Redacted Document</p>
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 max-h-[260px] overflow-y-auto">
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono break-words text-foreground/80">
            {redactedText}
          </p>
        </div>
      </div>

      {/* Export actions */}
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

        <button
          onClick={onReset}
          className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground py-1.5 flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start over with full document
        </button>
      </div>

      {/* Format note */}
      <p className="text-[11px] text-muted-foreground/40 text-center">
        Phase 1: text export only. PDF binary redaction coming in a future update.
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PiiReview({ text, fileName, continueLabel = "Analyze this document", onAnalyzeRedacted, onCancel }: Props) {
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
        setSpans((data.spans ?? []).map(s => ({ ...s, approved: true })))
        setStatus("done")
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : "PII detection failed")
        setStatus("error")
      }
    })()
    return () => { cancelled = true }
  }, [text])

  // ── Toggle individual span ─────────────────────────────────────────────────
  const toggleSpan = useCallback((id: string) => {
    setSpans(prev => prev.map(s => s.id === id ? { ...s, approved: !s.approved } : s))
  }, [])

  // ── Toggle all spans that share the same normalized value ──────────────────
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

  // ── Groups ─────────────────────────────────────────────────────────────────
  const groups = useMemo(() => groupByCategory(spans), [spans])
  const approvedCount = useMemo(() => spans.filter(s => s.approved).length, [spans])
  const totalCount = spans.length

  // ─── LOADING ────────────────────────────────────────────────────────────────
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

  // ─── ERROR ───────────────────────────────────────────────────────────────────
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
        onAnalyze={() => onAnalyzeRedacted(redactedText)}
        onReset={() => { setApplied(false); setRedactedText(null) }}
      />
    )
  }

  // ─── NO PII FOUND ─────────────────────────────────────────────────────────
  if (totalCount === 0) {
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

  // ─── REVIEW STATE ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Summary header */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {totalCount} item{totalCount !== 1 ? "s" : ""} detected
          </p>
          <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5 leading-relaxed">
            Review each item below. Checked items will be redacted. Click an item to toggle.
          </p>
        </div>
      </div>

      {/* Approve / Reject all */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSpans(prev => prev.map(s => ({ ...s, approved: true })))}
          className="text-xs px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted/40 flex items-center gap-1.5 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5 text-destructive" /> Redact all
        </button>
        <button
          onClick={() => setSpans(prev => prev.map(s => ({ ...s, approved: false })))}
          className="text-xs px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted/40 flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" /> Keep all
        </button>
        <button
          onClick={() => setShowPreview(v => !v)}
          className="text-xs px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted/40 flex items-center gap-1.5 transition-colors ml-auto"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "Hide" : "Preview"}
        </button>
      </div>

      {/* Grouped detection list */}
      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
        {Array.from(groups.entries()).map(([category, catSpans]) => {
          const allApproved = catSpans.every(s => s.approved)
          const noneApproved = catSpans.every(s => !s.approved)
          // Deduplicate by normalized value — group all occurrences of the same text together
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
                    <button
                      onClick={() => toggleCategory(category, true)}
                      className="text-[10px] text-destructive/70 hover:text-destructive transition-colors px-1.5"
                    >
                      Redact all
                    </button>
                  )}
                  {!noneApproved && (
                    <button
                      onClick={() => toggleCategory(category, false)}
                      className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors px-1.5"
                    >
                      Keep all
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                {valueGroups.map(([normVal, group]) => {
                  const representative = group[0]
                  const allInGroupApproved = group.every(s => s.approved)
                  return (
                    <SpanRow
                      key={normVal}
                      span={representative}
                      count={group.length}
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

      {/* Preview */}
      {showPreview && <DocumentPreview text={text} spans={spans} />}

      {/* Apply CTA */}
      <div className="space-y-2 pt-1">
        <Button
          size="lg"
          variant="destructive"
          className="w-full h-12 text-sm rounded-xl gap-2"
          onClick={applyAndShowResult}
        >
          <ShieldCheck className="w-4 h-4" />
          Apply {approvedCount} Redaction{approvedCount !== 1 ? "s" : ""}
        </Button>
        <button
          onClick={onCancel}
          className="w-full text-xs text-muted-foreground/50 hover:text-muted-foreground py-1.5 transition-colors"
        >
          Cancel — analyze without redacting
        </button>
      </div>

      {/* Phase 2 note */}
      <p className="text-[11px] text-muted-foreground/35 text-center leading-relaxed">
        Redactions permanently replace the selected values in the exported output.
        Manual selection and PDF redaction coming in a future update.
      </p>
    </div>
  )
}
