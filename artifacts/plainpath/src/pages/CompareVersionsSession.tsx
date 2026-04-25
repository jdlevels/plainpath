// ─── Compare Versions — Workspace (Change Intelligence Design) ────────────────
// Three-zone layout: Original text | Revised text | Change Intelligence (A–H)
// Replaces the PDF-viewer workspace with the approved text-comparison design.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useState, useEffect, useRef, useCallback,
} from "react"
import { useLocation } from "wouter"
import {
  ArrowLeft, ArrowLeftRight, BookOpen, Tag, Plus, Minus, Edit3,
  AlertTriangle, Info, ChevronDown, Layers, RefreshCcw, Download,
  FileText, Loader2, AlertCircle, X, Sparkles, CheckCircle2,
} from "lucide-react"
import { useCompareVersionsApi } from "@/hooks/useCompareVersionsApi"
import type {
  CVSessionDetail, CVChangeIntelligence,
  CISection, CIKeyChange, CIAddedLanguage, CIRemovedLanguage,
  CIModifiedTerm, CIRiskChange,
} from "@/lib/compareVersionsTypes"

// ─── Constants ─────────────────────────────────────────────────────────────────

const POLL_MS = 2500

const CV_TEXT_SIZES = [
  { label: "A",   body: "text-[10px]" },
  { label: "A+",  body: "text-xs"     },
  { label: "A++", body: "text-[13px]" },
] as const

// ─── Active change state ───────────────────────────────────────────────────────

interface ActiveChange {
  type: "added" | "removed" | "modified"
  title: string
  chip: string
  orig_id: string | null
  rev_id: string | null
  before?: string
  after?: string
}

// ─── Section color helpers ─────────────────────────────────────────────────────

function origSectionStyle(ct: CISection["change_type"], active: boolean): string {
  const ring = active ? " ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0c0c0f]" : ""
  switch (ct) {
    case "modified": return `border-amber-500/22 bg-amber-500/[0.04]${ring}`
    case "removed":  return `border-red-400/18 bg-red-400/[0.03]${ring}`
    default:         return `border-white/[0.06] bg-white/[0.015]${ring}`
  }
}

function revSectionStyle(ct: CISection["change_type"], active: boolean): string {
  const ring = active ? " ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0c0c0f]" : ""
  switch (ct) {
    case "added":    return `border-emerald-500/22 bg-emerald-500/[0.04]${ring}`
    case "modified": return `border-amber-500/22 bg-amber-500/[0.04]${ring}`
    case "removed":  return `border-white/[0.04] bg-white/[0.01] opacity-40${ring}`
    default:         return `border-white/[0.06] bg-white/[0.015]${ring}`
  }
}

function origTextStyle(ct: CISection["change_type"]): string {
  switch (ct) {
    case "removed":  return "text-white/52 line-through decoration-red-400/25"
    case "modified": return "text-white/68"
    default:         return "text-white/62"
  }
}

function revTextStyle(ct: CISection["change_type"]): string {
  switch (ct) {
    case "added":    return "text-emerald-300/80"
    case "modified": return "text-white/68"
    default:         return "text-white/62"
  }
}

// ─── Change chip ───────────────────────────────────────────────────────────────

function CChip({
  label, active, onClick,
}: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <span
      onClick={onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer transition-all ${
        active
          ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35"
          : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20"
      }`}
    >
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />}
      {label}
    </span>
  )
}

// ─── Type style map ────────────────────────────────────────────────────────────

const TYPE_STYLE = {
  added:    { dot:"bg-emerald-500", border:"border-emerald-500/18", bg:"bg-emerald-500/[0.04]", badge:"bg-emerald-500/12 border-emerald-500/20 text-emerald-300/80", icon:<Plus className="w-2.5 h-2.5" /> },
  removed:  { dot:"bg-red-400",    border:"border-red-400/18",    bg:"bg-red-400/[0.03]",    badge:"bg-red-400/10 border-red-400/15 text-red-300/70",             icon:<Minus className="w-2.5 h-2.5" /> },
  modified: { dot:"bg-amber-500",  border:"border-amber-500/18",  bg:"bg-amber-500/[0.04]",  badge:"bg-amber-500/12 border-amber-500/20 text-amber-300/75",        icon:<Edit3 className="w-2.5 h-2.5" /> },
}

// ─── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ c }: { c: CVChangeIntelligence["confidence"] }) {
  switch (c) {
    case "high":              return <span className="h-6 px-2.5 rounded-full border bg-emerald-500/12 border-emerald-500/18 text-[10px] text-emerald-300/70 font-medium">High compare confidence</span>
    case "partial":           return <span className="h-6 px-2.5 rounded-full border bg-amber-500/12 border-amber-500/18 text-[10px] text-amber-300/70 font-medium">Partial confidence</span>
    case "low_scan_quality":  return <span className="h-6 px-2.5 rounded-full border bg-red-400/10 border-red-400/15 text-[10px] text-red-300/65 font-medium">Low scan quality</span>
  }
}

// ─── Evidence banner ───────────────────────────────────────────────────────────

function EvidenceBanner({
  active, onClose,
}: { active: ActiveChange; onClose: () => void }) {
  const s = TYPE_STYLE[active.type]
  return (
    <div className={`shrink-0 mx-4 mb-3 rounded-xl border ${s.border} ${s.bg} p-3 flex gap-3 items-start`}>
      <div className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0 mt-1.5`} />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-semibold text-white/80">{active.title}</p>
          <CChip label={active.chip} active />
          <span className={`h-4 px-1.5 rounded border text-[9px] font-medium inline-flex items-center gap-0.5 ${s.badge}`}>
            {s.icon} {active.type}
          </span>
        </div>
        {(active.before || active.after) && (
          <div className="space-y-1">
            {active.before && (
              <div className="flex gap-2">
                <span className="text-[9px] text-red-300/50 font-medium w-10 shrink-0 mt-0.5">Before</span>
                <p className="text-[10px] text-white/42 leading-snug line-through decoration-red-400/25">{active.before}</p>
              </div>
            )}
            {active.after && (
              <div className="flex gap-2">
                <span className="text-[9px] text-emerald-300/55 font-medium w-10 shrink-0 mt-0.5">After</span>
                <p className="text-[10px] text-emerald-300/65 leading-snug">{active.after}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <button onClick={onClose} className="p-0.5 rounded hover:bg-white/[0.06] text-white/25 hover:text-white/50 shrink-0 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Section cards ─────────────────────────────────────────────────────────────

function OrigSectionCard({
  sec, active, onClick, refCallback, textSz = "text-[10px]",
}: {
  sec: CISection
  active: boolean
  onClick: () => void
  refCallback: (el: HTMLDivElement | null) => void
  textSz?: string
}) {
  return (
    <div
      ref={refCallback}
      onClick={onClick}
      className={`rounded-xl border p-3 cursor-pointer transition-all duration-100 ${origSectionStyle(sec.change_type, active)}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] text-white/45 font-medium">{sec.heading}</p>
        {sec.change_type === "modified" && <Edit3 className="w-2.5 h-2.5 text-amber-400/50 shrink-0" />}
        {sec.change_type === "removed"  && <Minus className="w-2.5 h-2.5 text-red-400/50 shrink-0" />}
      </div>
      <p className={`${textSz} leading-relaxed ${origTextStyle(sec.change_type)}`}>{sec.text}</p>
    </div>
  )
}

function RevSectionCard({
  sec, active, onClick, refCallback, textSz = "text-[10px]",
}: {
  sec: CISection
  active: boolean
  onClick: () => void
  refCallback: (el: HTMLDivElement | null) => void
  textSz?: string
}) {
  return (
    <div
      ref={refCallback}
      onClick={onClick}
      className={`rounded-xl border p-3 cursor-pointer transition-all duration-100 ${revSectionStyle(sec.change_type, active)}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] text-white/45 font-medium">{sec.heading}</p>
        {sec.change_type === "added"    && <span className="text-[9px] text-emerald-300/60 flex items-center gap-0.5 font-medium"><Plus className="w-2.5 h-2.5" />new</span>}
        {sec.change_type === "modified" && <Edit3 className="w-2.5 h-2.5 text-amber-400/50 shrink-0" />}
      </div>
      <p className={`${textSz} leading-relaxed ${revTextStyle(sec.change_type)}`}>{sec.text}</p>
    </div>
  )
}

// ─── Processing state ──────────────────────────────────────────────────────────

function ProcessingState({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-white/[0.05]" />
        <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 border-r-violet-500/30 animate-spin" />
        <div className="absolute inset-1.5 rounded-full border border-white/[0.04]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ArrowLeftRight className="w-4 h-4 text-violet-400/70" />
        </div>
      </div>
      <div className="space-y-3 w-48 text-center">
        <p className="text-sm font-medium text-white/70">{label}</p>
        {["Extracting document text", "Mapping section changes", "Generating change intelligence"].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-0.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500/60 animate-pulse"
                style={{ width: `${[100, 72, 45][i]}%`, animationDelay: `${i * 200}ms` }}
              />
            </div>
            <span className="text-[10px] text-white/25 text-left w-28 truncate">{step}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-white/22 max-w-xs text-center leading-relaxed">
        This usually takes 15–30 seconds. The workspace will open automatically when ready.
      </p>
    </div>
  )
}

// ─── Mobile type ───────────────────────────────────────────────────────────────

type MobileTab = "original" | "revised" | "analysis"

// ─── Main component ────────────────────────────────────────────────────────────

export default function CompareVersionsSession({ sessionId }: { sessionId: string }) {
  const [, navigate] = useLocation()
  const api = useCompareVersionsApi()

  const [session, setSession]             = useState<CVSessionDetail | null>(null)
  const [loadError, setLoadError]         = useState<string | null>(null)
  const [activeChange, setActiveChange]   = useState<ActiveChange | null>(null)
  const [mobileTab, setMobileTab]         = useState<MobileTab>("analysis")
  const [traceOpen, setTraceOpen]         = useState(false)
  const [rescanning, setRescanning]       = useState(false)
  const [sizeIdx, setSizeIdx]             = useState<0 | 1 | 2>(0)

  // Refs for scrollable panels
  const origScrollRef = useRef<HTMLDivElement>(null)
  const revScrollRef  = useRef<HTMLDivElement>(null)

  // Refs for individual section cards
  const sectionRefsOrig = useRef<Map<string, HTMLDivElement>>(new Map())
  const sectionRefsRev  = useRef<Map<string, HTMLDivElement>>(new Map())

  const ci = session?.changeIntelligence ?? null

  // ── Load & polling ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const sess = await api.getSession(sessionId)
        if (cancelled) return
        setSession(sess)
      } catch (err: any) {
        if (cancelled) return
        setLoadError(err?.status === 404 ? "Session not found." : "Failed to load session.")
      }
    }
    load()
    return () => { cancelled = true }
  }, [sessionId])

  // Poll while scanning or CI is pending/running
  useEffect(() => {
    if (!session) return
    const needsPoll =
      session.status === "scanning" ||
      session.ciStatus === "pending" ||
      session.ciStatus === "running"
    if (!needsPoll) return

    let cancelled = false
    const interval = setInterval(async () => {
      if (cancelled) return
      try {
        const updated = await api.getSession(sessionId)
        if (cancelled) return
        setSession(updated)
      } catch { /* ignore poll errors */ }
    }, POLL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [session?.status, session?.ciStatus, sessionId])

  // Page title
  useEffect(() => {
    document.title = session?.title ? `${session.title} — Compare Versions` : "Compare Versions — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [session?.title])

  // ── Scroll to section ────────────────────────────────────────────────────────
  const scrollToOrig = useCallback((id: string) => {
    const el = sectionRefsOrig.current.get(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  const scrollToRev = useCallback((id: string) => {
    const el = sectionRefsRev.current.get(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  // ── Chip click ───────────────────────────────────────────────────────────────
  const activateChange = useCallback((change: ActiveChange) => {
    setActiveChange(change)
    if (change.orig_id) { scrollToOrig(change.orig_id); setMobileTab("original") }
    if (change.rev_id)  { scrollToRev(change.rev_id);   if (!change.orig_id) setMobileTab("revised") }
  }, [scrollToOrig, scrollToRev])

  const clearActive = useCallback(() => setActiveChange(null), [])

  // ── Rescan ───────────────────────────────────────────────────────────────────
  async function handleRescan() {
    if (!session || rescanning) return
    setRescanning(true)
    setActiveChange(null)
    try {
      await api.rescanSession(session.id)
      setSession((s) => s ? { ...s, status: "scanning", ciStatus: "pending", changeIntelligence: null } : s)
    } catch (err) {
      console.error("[CompareVersions] rescan failed:", err)
    } finally { setRescanning(false) }
  }

  // ── Export ───────────────────────────────────────────────────────────────────
  function handleExport() {
    if (!session) return
    const url = api.exportReportUrl(session.id)
    const a = document.createElement("a")
    a.href = url
    a.download = `compare-audit-${session.id.slice(0, 8)}.pdf`
    a.click()
  }

  // ── Determine overall state ──────────────────────────────────────────────────
  const isLoading    = !session && !loadError
  const isNotFound   = loadError === "Session not found."
  const isLoadFailed = !!loadError && !isNotFound
  const isScanning   = session?.status === "scanning"
  const isProcessing = session?.status === "complete" && (session.ciStatus === "pending" || session.ciStatus === "running")
  const isCiError    = session?.status === "complete" && session.ciStatus === "error"
  const isComplete   = session?.status === "complete" && session.ciStatus === "complete" && !!ci
  const isScanError  = session?.status === "error"

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0c0c0f]">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (isNotFound) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#0c0c0f]">
        <FileText className="w-10 h-10 text-white/15" />
        <p className="text-white/50 font-medium">Session not found</p>
        <button onClick={() => navigate("/compare-versions")}
          className="h-8 px-4 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white/60 hover:bg-white/[0.08] transition-colors">
          Back to Compare Versions
        </button>
      </div>
    )
  }

  // ── Load error ───────────────────────────────────────────────────────────────
  if (isLoadFailed) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#0c0c0f]">
        <AlertCircle className="w-8 h-8 text-red-400/70" />
        <p className="text-white/50 font-medium">{loadError}</p>
        <button onClick={() => window.location.reload()}
          className="h-8 px-4 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white/60 hover:bg-white/[0.08] transition-colors">
          Retry
        </button>
      </div>
    )
  }

  // ── Header (shared across all session states) ─────────────────────────────────
  const header = (
    <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
      <button onClick={() => navigate("/compare-versions")}
        className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/35 hover:text-white/60 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
        <ArrowLeftRight className="w-3 h-3 text-white" />
      </div>
      <span className="text-white/40 text-xs hidden sm:block">Compare Versions</span>
      <span className="text-white/15 text-xs mx-0.5 hidden sm:block">›</span>
      <span className="text-white/60 text-xs font-medium truncate max-w-[180px]">
        {session?.title ?? "Loading…"}
      </span>
      <div className="ml-auto flex items-center gap-2">
        {/* Text size toggle */}
        <div className="flex items-center gap-0.5">
          {CV_TEXT_SIZES.map((s, i) => (
            <button
              key={i}
              onClick={() => setSizeIdx(i as 0 | 1 | 2)}
              title={`Text size: ${s.label}`}
              className={`h-6 px-1.5 rounded text-[9px] font-medium transition-colors ${
                i === sizeIdx
                  ? "bg-white/[0.09] text-white/70"
                  : "text-white/28 hover:text-white/55 hover:bg-white/[0.05]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {isComplete && (
          <>
            <button onClick={handleExport}
              className="h-7 px-2.5 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5 hover:bg-white/[0.04] transition-colors">
              <Download className="w-3 h-3" /> Export
            </button>
            <button onClick={handleRescan} disabled={rescanning}
              className="h-7 px-2.5 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5 hover:bg-white/[0.04] disabled:opacity-40 transition-colors">
              {rescanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
              Re-compare
            </button>
          </>
        )}
      </div>
    </div>
  )

  // ── Scan error ───────────────────────────────────────────────────────────────
  if (isScanError) {
    return (
      <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-white/70 font-semibold">Comparison failed</p>
            <p className="text-white/35 text-sm max-w-sm">
              There was a problem analyzing your documents. This can happen with scanned or image-based PDFs.
            </p>
          </div>
          <button onClick={handleRescan} disabled={rescanning}
            className="h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors">
            {rescanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Try again
          </button>
        </div>
      </div>
    )
  }

  // ── Scanning / processing ────────────────────────────────────────────────────
  if (isScanning || isProcessing) {
    return (
      <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden">
        {header}
        <ProcessingState label={isScanning ? "Scanning document changes…" : "Generating change intelligence…"} />
      </div>
    )
  }

  // ── CI error ─────────────────────────────────────────────────────────────────
  if (isCiError) {
    return (
      <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-white/70 font-semibold">Intelligence analysis failed</p>
            <p className="text-white/35 text-sm max-w-sm">
              The document scan completed but the AI analysis encountered an issue.
              You can retry to attempt the analysis again.
            </p>
          </div>
          <button onClick={handleRescan} disabled={rescanning}
            className="h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors">
            {rescanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Retry analysis
          </button>
        </div>
      </div>
    )
  }

  // ── No data yet (complete but CI not arrived) ────────────────────────────────
  if (!isComplete) {
    return (
      <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden">
        {header}
        <ProcessingState label="Preparing workspace…" />
      </div>
    )
  }

  // ── Change handlers for panels ────────────────────────────────────────────────

  function activateSection(sec: CISection, pane: "orig" | "rev") {
    const paired = pane === "orig"
      ? ci!.sections_revised.find((s) => s.id === sec.paired_id)
      : ci!.sections_original.find((s) => s.id === sec.paired_id)

    const change: ActiveChange = {
      type: sec.change_type === "unchanged"
        ? "modified"
        : (sec.change_type as "added" | "removed" | "modified"),
      title: sec.heading,
      chip: "§",
      orig_id: pane === "orig" ? sec.id : (paired?.id ?? null),
      rev_id:  pane === "rev"  ? sec.id : (paired?.id ?? null),
    }
    setActiveChange(change)
    if (change.orig_id) scrollToOrig(change.orig_id)
    if (change.rev_id)  scrollToRev(change.rev_id)
  }

  function activateKeyChange(ch: CIKeyChange) {
    const s = TYPE_STYLE[ch.type]
    const mt = ci!.modified_terms.find((m) => m.id === ch.id || (m.orig_id === ch.orig_id && m.rev_id === ch.rev_id))
    activateChange({
      type: ch.type,
      title: ch.title,
      chip: ch.chip,
      orig_id: ch.orig_id,
      rev_id: ch.rev_id,
      before: mt?.before,
      after: mt?.after,
    })
  }

  function activateAdded(a: CIAddedLanguage) {
    activateChange({
      type: "added",
      title: a.term,
      chip: a.chip,
      orig_id: null,
      rev_id: a.rev_id,
      after: a.meaning,
    })
    setMobileTab("revised")
  }

  function activateRemoved(r: CIRemovedLanguage) {
    activateChange({
      type: "removed",
      title: r.term,
      chip: r.chip,
      orig_id: r.orig_id,
      rev_id: null,
      before: r.meaning,
    })
    setMobileTab("original")
  }

  function activateModified(m: CIModifiedTerm) {
    activateChange({
      type: "modified",
      title: m.term,
      chip: m.chip,
      orig_id: m.orig_id,
      rev_id: m.rev_id,
      before: m.before,
      after: m.after,
    })
  }

  // ── All-chip count for H panel ────────────────────────────────────────────────
  const totalChips =
    ci.key_changes.length +
    ci.added_language.length +
    ci.removed_language.length +
    ci.modified_terms.length +
    ci.risk_changes.length

  // ── Active IDs ────────────────────────────────────────────────────────────────
  const activeOrigId = activeChange?.orig_id ?? null
  const activeRevId  = activeChange?.rev_id  ?? null

  // ── COMPLETE WORKSPACE ────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {header}

      {/* Evidence banner — shows when a change chip is active */}
      {activeChange && (
        <EvidenceBanner active={activeChange} onClose={clearActive} />
      )}

      {/* ── Desktop: three-zone body ── */}
      <div className="flex-1 min-h-0 hidden md:flex">

        {/* Left — Original (33%) */}
        <div className="w-[33%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 shrink-0 bg-white/[0.01]">
            <ArrowLeftRight className="w-3 h-3 text-white/22 shrink-0" />
            <span className="text-[10px] text-white/28 font-medium flex-1">Compare Versions</span>
            <span className="text-[9px] text-white/18">{ci.sections_original.length} sections</span>
          </div>
          <div className="h-8 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-white/25 shrink-0" />
            <span className="text-[11px] text-white/50 font-semibold">Original</span>
            <span className="text-[10px] text-white/22 ml-1 flex-1 truncate">{session.originalFileName}</span>
            {ci.removed_language.length > 0 && (
              <span className="h-4 px-1.5 rounded border border-red-400/22 bg-red-400/[0.07] text-red-300/60 text-[9px] font-medium shrink-0">
                {ci.removed_language.length} removed
              </span>
            )}
          </div>
          <div ref={origScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {ci.sections_original.map((sec) => (
              <OrigSectionCard
                key={sec.id}
                sec={sec}
                active={activeOrigId === sec.id}
                onClick={() => activateSection(sec, "orig")}
                textSz={CV_TEXT_SIZES[sizeIdx].body}
                refCallback={(el) => {
                  if (el) sectionRefsOrig.current.set(sec.id, el)
                  else    sectionRefsOrig.current.delete(sec.id)
                }}
              />
            ))}
          </div>
        </div>

        {/* Middle — Revised (33%) */}
        <div className="w-[33%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 shrink-0 bg-white/[0.01]">
            <span className="flex-1" />
            <span className="text-[9px] text-white/32">{ci.sections_revised.length} sections</span>
          </div>
          <div className="h-8 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-violet-400/55 shrink-0" />
            <span className="text-[11px] text-violet-300/65 font-semibold">Revised</span>
            <span className="text-[10px] text-white/42 ml-1 flex-1 truncate">{session.revisedFileName}</span>
            {ci.added_language.length > 0 && (
              <span className="h-4 px-1.5 rounded border border-emerald-400/22 bg-emerald-400/[0.07] text-emerald-300/60 text-[9px] font-medium shrink-0">
                {ci.added_language.length} added
              </span>
            )}
          </div>
          <div ref={revScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {ci.sections_revised.map((sec) => (
              <RevSectionCard
                key={sec.id}
                sec={sec}
                active={activeRevId === sec.id}
                onClick={() => activateSection(sec, "rev")}
                textSz={CV_TEXT_SIZES[sizeIdx].body}
                refCallback={(el) => {
                  if (el) sectionRefsRev.current.set(sec.id, el)
                  else    sectionRefsRev.current.delete(sec.id)
                }}
              />
            ))}
          </div>
        </div>

        {/* Right — Change Intelligence (34%) */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <ChangeIntelligencePanel
            ci={ci}
            session={session}
            activeChange={activeChange}
            traceOpen={traceOpen}
            setTraceOpen={setTraceOpen}
            totalChips={totalChips}
            activateKeyChange={activateKeyChange}
            activateAdded={activateAdded}
            activateRemoved={activateRemoved}
            activateModified={activateModified}
          />
        </div>
      </div>

      {/* ── Mobile: tab layout ── */}
      <div className="flex-1 min-h-0 flex flex-col md:hidden overflow-hidden">
        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === "original" && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
                <FileText className="w-3 h-3 text-white/25" />
                <span className="text-[11px] text-white/50 font-semibold">Original</span>
                <span className="text-[10px] text-white/22 ml-1 truncate">{session.originalFileName}</span>
              </div>
              <div ref={origScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {ci.sections_original.map((sec) => (
                  <OrigSectionCard
                    key={sec.id}
                    sec={sec}
                    active={activeOrigId === sec.id}
                    onClick={() => activateSection(sec, "orig")}
                    textSz={CV_TEXT_SIZES[sizeIdx].body}
                    refCallback={(el) => {
                      if (el) sectionRefsOrig.current.set(sec.id, el)
                      else    sectionRefsOrig.current.delete(sec.id)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {mobileTab === "revised" && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
                <FileText className="w-3 h-3 text-violet-400/55" />
                <span className="text-[11px] text-violet-300/65 font-semibold">Revised</span>
                <span className="text-[10px] text-white/22 ml-1 truncate">{session.revisedFileName}</span>
              </div>
              <div ref={revScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {ci.sections_revised.map((sec) => (
                  <RevSectionCard
                    key={sec.id}
                    sec={sec}
                    active={activeRevId === sec.id}
                    onClick={() => activateSection(sec, "rev")}
                    textSz={CV_TEXT_SIZES[sizeIdx].body}
                    refCallback={(el) => {
                      if (el) sectionRefsRev.current.set(sec.id, el)
                      else    sectionRefsRev.current.delete(sec.id)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {mobileTab === "analysis" && (
            <div className="h-full overflow-y-auto">
              <ChangeIntelligencePanel
                ci={ci}
                session={session}
                activeChange={activeChange}
                traceOpen={traceOpen}
                setTraceOpen={setTraceOpen}
                totalChips={totalChips}
                activateKeyChange={activateKeyChange}
                activateAdded={activateAdded}
                activateRemoved={activateRemoved}
                activateModified={activateModified}
              />
            </div>
          )}
        </div>

        {/* Mobile tab bar */}
        <div className="h-14 border-t border-white/[0.06] flex shrink-0 bg-[#0c0c0f]">
          {(["analysis", "original", "revised"] as MobileTab[]).map((tab) => {
            const labels: Record<MobileTab, string> = { analysis: "Summary", original: "Original", revised: "Revised" }
            const icons: Record<MobileTab, React.ReactNode> = {
              original: <FileText className="w-4 h-4" />,
              revised:  <FileText className="w-4 h-4 text-violet-400" />,
              analysis: <Sparkles className="w-4 h-4" />,
            }
            return (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  mobileTab === tab ? "text-violet-400" : "text-white/25 hover:text-white/45"
                }`}
              >
                {icons[tab]}
                <span className="text-[10px] font-medium">{labels[tab]}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Change Intelligence right panel ──────────────────────────────────────────

function ChangeIntelligencePanel({
  ci, session, activeChange, traceOpen, setTraceOpen, totalChips,
  activateKeyChange, activateAdded, activateRemoved, activateModified,
}: {
  ci: CVChangeIntelligence
  session: CVSessionDetail
  activeChange: ActiveChange | null
  traceOpen: boolean
  setTraceOpen: (v: boolean) => void
  totalChips: number
  activateKeyChange: (ch: CIKeyChange) => void
  activateAdded: (a: CIAddedLanguage) => void
  activateRemoved: (r: CIRemovedLanguage) => void
  activateModified: (m: CIModifiedTerm) => void
}) {
  return (
    <>
      {/* Doc identity header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-white/[0.04] shrink-0">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600/18 border border-violet-500/22 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-white/88 truncate">{ci.document_type || session.title}</p>
            <p className="text-[10px] text-white/28 mt-0.5 truncate">{ci.parties}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3.5 space-y-5">

        {/* A. Change Summary */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3 h-3 text-white/25" />
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">A. Change Summary</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[11px] text-white/55 leading-relaxed space-y-1.5">
            <p><strong className="text-white/70 font-semibold">Compared:</strong> {ci.summary.compared}</p>
            <p><strong className="text-white/70 font-semibold">What changed:</strong> {ci.summary.what_changed}</p>
            <p><strong className="text-white/70 font-semibold">Inspect first:</strong> <span className="text-amber-300/80 font-medium">{ci.summary.inspect_first}</span></p>
          </div>
          <div className="mt-2 flex items-start gap-1.5 px-1">
            <Info className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
            <p className="text-[10px] text-white/28">Change comparison support — source-backed changes, not legal advice.</p>
          </div>
        </div>

        {/* B. Change Strip */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowLeftRight className="w-3 h-3 text-white/25" />
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">B. Change Strip</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 flex flex-wrap gap-1.5">
            <span className="h-6 px-2.5 rounded-full border bg-violet-500/15 border-violet-500/22 text-[10px] text-violet-300/80 font-medium">
              {ci.stats.total_changes} change{ci.stats.total_changes !== 1 ? "s" : ""} found
            </span>
            {ci.stats.additions > 0 && (
              <span className="h-6 px-2.5 rounded-full border bg-emerald-500/15 border-emerald-500/22 text-[10px] text-emerald-300/80 font-medium">
                {ci.stats.additions} addition{ci.stats.additions !== 1 ? "s" : ""}
              </span>
            )}
            {ci.stats.removals > 0 && (
              <span className="h-6 px-2.5 rounded-full border bg-red-400/12 border-red-400/18 text-[10px] text-red-300/70 font-medium">
                {ci.stats.removals} removal{ci.stats.removals !== 1 ? "s" : ""}
              </span>
            )}
            {ci.stats.modifications > 0 && (
              <span className="h-6 px-2.5 rounded-full border bg-amber-500/15 border-amber-500/22 text-[10px] text-amber-300/80 font-medium">
                {ci.stats.modifications} modified term{ci.stats.modifications !== 1 ? "s" : ""}
              </span>
            )}
            {ci.stats.terms_to_verify > 0 && (
              <span className="h-6 px-2.5 rounded-full border bg-amber-500/15 border-amber-500/22 text-[10px] text-amber-300/80 font-medium">
                {ci.stats.terms_to_verify} term{ci.stats.terms_to_verify !== 1 ? "s" : ""} to verify
              </span>
            )}
            <ConfidenceBadge c={ci.confidence} />
          </div>
        </div>

        {/* C. Key Changes */}
        {ci.key_changes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">C. Key Changes</p>
              </div>
              <span className="text-[10px] text-white/28">{ci.key_changes.length} of {ci.stats.total_changes}</span>
            </div>
            <div className="space-y-1.5">
              {ci.key_changes.map((ch) => {
                const s = TYPE_STYLE[ch.type]
                const isActive = activeChange?.chip === ch.chip && activeChange?.title === ch.title
                return (
                  <div
                    key={ch.id}
                    onClick={() => activateKeyChange(ch)}
                    className={`rounded-xl border ${s.border} ${s.bg} p-3 cursor-pointer hover:brightness-110 transition-all ${isActive ? "ring-1 ring-violet-500/40" : ""}`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0 mt-1.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[11px] font-semibold text-white/80">{ch.title}</p>
                          <CChip label={ch.chip} active={isActive} />
                        </div>
                        <span className={`mt-0.5 h-4 px-1.5 rounded border text-[9px] font-medium inline-flex items-center gap-0.5 ${s.badge}`}>
                          {s.icon} {ch.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/45 pl-3.5 leading-snug">{ch.plain}</p>
                    {ch.action && <p className="text-[10px] text-violet-300/50 pl-3.5 mt-1">› {ch.action}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* D. Added Language */}
        {ci.added_language.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Plus className="w-3 h-3 text-emerald-400/50" />
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">D. Added Language</p>
            </div>
            <div className="space-y-1.5">
              {ci.added_language.map((a) => {
                const isActive = activeChange?.type === "added" && activeChange?.rev_id === a.rev_id
                return (
                  <div
                    key={a.id}
                    onClick={() => activateAdded(a)}
                    className={`rounded-xl border border-emerald-500/18 bg-emerald-500/[0.03] p-3 cursor-pointer hover:brightness-110 transition-all ${isActive ? "ring-1 ring-violet-500/40" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-[11px] font-semibold text-white/72 flex-1">{a.term}</p>
                      <CChip label={a.chip} active={isActive} />
                    </div>
                    <p className="text-[10px] text-white/32 pl-3.5 mb-0.5">{a.where}</p>
                    <p className="text-[10px] text-white/45 pl-3.5 leading-snug">{a.meaning}</p>
                    {a.action && <p className="text-[10px] text-violet-300/48 pl-3.5 mt-1">› {a.action}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* E. Removed Language */}
        {ci.removed_language.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Minus className="w-3 h-3 text-red-400/50" />
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">E. Removed Language</p>
            </div>
            <div className="space-y-1.5">
              {ci.removed_language.map((r) => {
                const isActive = activeChange?.type === "removed" && activeChange?.orig_id === r.orig_id
                return (
                  <div
                    key={r.id}
                    onClick={() => activateRemoved(r)}
                    className={`rounded-xl border border-red-400/15 bg-red-400/[0.03] p-3 cursor-pointer hover:brightness-110 transition-all ${isActive ? "ring-1 ring-violet-500/40" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <p className="text-[11px] font-semibold text-white/72 flex-1">{r.term}</p>
                      <CChip label={r.chip} active={isActive} />
                    </div>
                    <p className="text-[10px] text-white/30 pl-3.5 mb-0.5">{r.where}</p>
                    <p className="text-[10px] text-white/45 pl-3.5 leading-snug">{r.meaning}</p>
                    {r.why && <p className="text-[10px] text-white/32 pl-3.5 mt-1 italic">{r.why}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* F. Modified Terms */}
        {ci.modified_terms.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Edit3 className="w-3 h-3 text-amber-400/50" />
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">F. Modified Terms</p>
            </div>
            <div className="space-y-2">
              {ci.modified_terms.map((m) => {
                const isActive = activeChange?.type === "modified" && activeChange?.chip === m.chip
                return (
                  <div
                    key={m.id}
                    onClick={() => activateModified(m)}
                    className={`rounded-xl border border-amber-500/18 bg-amber-500/[0.03] p-3 cursor-pointer hover:brightness-110 transition-all ${isActive ? "ring-1 ring-violet-500/40" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <p className="text-[11px] font-semibold text-white/72 flex-1">{m.term}</p>
                      <CChip label={m.chip} active={isActive} />
                    </div>
                    <div className="pl-3.5 space-y-1.5">
                      <div className="flex gap-2">
                        <span className="text-[9px] text-red-300/50 font-medium w-10 shrink-0 mt-0.5">Before</span>
                        <p className="text-[10px] text-white/42 leading-snug line-through decoration-red-400/25">{m.before}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[9px] text-emerald-300/55 font-medium w-10 shrink-0 mt-0.5">After</span>
                        <p className="text-[10px] text-emerald-300/65 leading-snug">{m.after}</p>
                      </div>
                      <p className="text-[10px] text-white/38 leading-snug">{m.what_changed}</p>
                      {m.action && <p className="text-[10px] text-violet-300/48 mt-0.5">› {m.action}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* G. Possible Risk Changes */}
        {ci.risk_changes.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3 h-3 text-white/22" />
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">G. Possible Risk Changes</p>
            </div>
            <div className="space-y-1.5">
              {ci.risk_changes.map((r) => (
                <div key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/45 shrink-0" />
                    <p className="text-[10px] font-semibold text-white/58 flex-1 leading-snug">{r.title}</p>
                    <CChip label={r.chip} />
                  </div>
                  <p className="text-[10px] text-white/35 pl-3.5 leading-snug">{r.note}</p>
                  <p className="text-[10px] text-white/22 pl-3.5 mt-1 italic">Review with a qualified professional if high-risk.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* H. Source / Change Traceability */}
        <div
          onClick={() => setTraceOpen(!traceOpen)}
          className="rounded-xl border border-white/[0.06] bg-white/[0.01] cursor-pointer hover:bg-white/[0.025] transition-colors"
        >
          <div className="flex items-center gap-2.5 px-4 py-3">
            <Layers className="w-3.5 h-3.5 text-white/20" />
            <p className="text-white/35 text-xs font-medium flex-1">H. Source / Change Traceability</p>
            <span className="h-4 px-1.5 rounded border bg-violet-500/10 border-violet-500/18 text-[9px] text-violet-300/55">
              {totalChips} change chip{totalChips !== 1 ? "s" : ""}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-white/18 transition-transform ${traceOpen ? "rotate-180" : ""}`} />
          </div>
          {traceOpen && (
            <div className="border-t border-white/[0.04] px-4 py-3 flex flex-wrap gap-1.5">
              {[
                ...ci.key_changes.map((c) => c.chip),
                ...ci.added_language.map((a) => a.chip),
                ...ci.removed_language.map((r) => r.chip),
                ...ci.modified_terms.map((m) => m.chip),
                ...ci.risk_changes.map((r) => r.chip),
              ].filter((v, i, a) => a.indexOf(v) === i).map((chip) => (
                <CChip key={chip} label={chip} />
              ))}
              {totalChips === 0 && (
                <p className="text-[10px] text-white/25">No source chips detected.</p>
              )}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-1.5 px-1 pb-4">
          <CheckCircle2 className="w-3 h-3 text-white/15 shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/22 leading-relaxed">
            PlainPath surfaces changes for your review. This is not legal advice — verify important terms with a qualified professional before signing.
          </p>
        </div>

      </div>
    </>
  )
}
