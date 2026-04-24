import { useEffect, useState } from "react"
import { useLocation, useSearch } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, ShieldCheck, AlertTriangle, XCircle, CheckCircle2,
  Phone, Mail, Globe, Calendar, Clock, Eye, CheckSquare,
  ArrowRight, AlertCircle, Flag, Shield, ExternalLink,
  FileText, BarChart2, Info,
  Copy, Check, Bookmark, BookmarkCheck,
  Download, BanIcon, AlertOctagon, Ban,
  Fingerprint, TrendingDown, Zap,
} from "lucide-react"
import { saveTrustCheck } from "@/lib/savedTrustChecks"
import { saveCloudTrustCheck } from "@/lib/cloudHistory"
import { useUser } from "@clerk/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { getApiBaseUrl } from "@/lib/api"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeModal from "@/components/UpgradeModal"
import {
  type TrustCheckAnalysis, type TrustCheckVerdict, type TrustCheckScores,
  verdictColor, severityColor,
  authenticityRiskColor, documentRiskColor, verificationConfidenceColor,
} from "@/lib/trustCheckTypes"
import { ResultStickyHeader } from "@/components/result/ResultStickyHeader"
import { ResultSectionCard } from "@/components/result/ResultSectionCard"
import { ResultMetaStrip } from "@/components/result/ResultMetaStrip"
import { ScoreLegend, TRUST_CHECK_LEGEND } from "@/components/ui/ScoreLegend"
import { DocumentScanScreen } from "@/components/DocumentScanScreen"

/* ── Helpers ────────────────────────────────────────────────────────────── */

function interpretRiskScore(score: number): string {
  if (score >= 80) return "Very high likelihood of fraudulent or manipulative behavior"
  if (score >= 60) return "High likelihood of scam or impersonation tactics"
  if (score >= 40) return "Moderate risk — significant suspicious elements present"
  if (score >= 20) return "Low-to-moderate risk — some elements warrant verification"
  return "Low likelihood of fraudulent activity"
}

function recommendedActions(verdict: TrustCheckVerdict): Array<{ text: string; icon: React.ElementType; color: string }> {
  switch (verdict) {
    case "High scam risk":
      return [
        { text: "Do not pay or respond to this document yet", icon: Ban, color: "text-red-600 dark:text-red-400" },
        { text: "Do not call phone numbers listed in the document", icon: Phone, color: "text-red-600 dark:text-red-400" },
        { text: "Contact the original company directly using their official website or phone number — not from this document", icon: Globe, color: "text-amber-600 dark:text-amber-400" },
        { text: "Keep a copy of this analysis result for your records", icon: Bookmark, color: "text-blue-600 dark:text-blue-400" },
      ]
    case "Suspicious — verify before acting":
      return [
        { text: "Do not act on this document until you have independently verified it", icon: AlertOctagon, color: "text-amber-600 dark:text-amber-400" },
        { text: "Look up the sender's official contact information independently — not from this document", icon: Globe, color: "text-amber-600 dark:text-amber-400" },
        { text: "Do not share personal or financial information until verified", icon: Shield, color: "text-amber-600 dark:text-amber-400" },
        { text: "Keep a copy of this analysis result for your records", icon: Bookmark, color: "text-blue-600 dark:text-blue-400" },
      ]
    case "Cannot verify authenticity":
      return [
        { text: "Proceed with caution — authenticity cannot be confirmed from content alone", icon: AlertCircle, color: "text-blue-600 dark:text-blue-400" },
        { text: "Independently verify the sender's identity through official public channels", icon: Globe, color: "text-blue-600 dark:text-blue-400" },
        { text: "Do not share personal or financial information until verified", icon: Shield, color: "text-amber-600 dark:text-amber-400" },
        { text: "Keep a copy of this analysis result for your records", icon: Bookmark, color: "text-blue-600 dark:text-blue-400" },
      ]
    case "Likely legitimate":
    default:
      return [
        { text: "Verify account numbers and deadlines match your personal records before acting", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
        { text: "Use only official contact information from your original account documentation", icon: Globe, color: "text-emerald-600 dark:text-emerald-400" },
        { text: "Keep a copy of this analysis result for your records", icon: Bookmark, color: "text-blue-600 dark:text-blue-400" },
      ]
  }
}

/* ── Verdict icon ───────────────────────────────────────────────────────── */

function VerdictIcon({ verdict }: { verdict: TrustCheckVerdict }) {
  switch (verdict) {
    case "High scam risk": return <XCircle className="w-5 h-5" />
    case "Suspicious — verify before acting": return <AlertTriangle className="w-5 h-5" />
    case "Cannot verify authenticity": return <AlertCircle className="w-5 h-5" />
    case "Likely legitimate": return <CheckCircle2 className="w-5 h-5" />
  }
}

/* CollapsibleSection and SectionCard are now ResultSectionCard from @/components/result */

/* ── Score card ─────────────────────────────────────────────────────────── */

function ScoreCard({
  label,
  score,
  description,
  tooltip,
  colorFn,
}: {
  label: string
  score: number
  description: string
  tooltip: string
  colorFn: (n: number) => { label: string; labelClass: string; barClass: string; textClass: string }
}) {
  const c = colorFn(score)
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-border/40 bg-card p-4 flex flex-col gap-2.5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 leading-none mb-1">{label}</p>
        <p className={`text-xl font-bold tabular-nums leading-none ${c.textClass}`}>{score}<span className="text-xs font-medium text-muted-foreground/50">/100</span></p>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${c.barClass}`}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${c.labelClass}`}>{c.label}</span>
      </div>
      <p className="text-[10px] text-muted-foreground/60 leading-snug border-t border-border/30 pt-2 mt-0.5">{tooltip}</p>
    </div>
  )
}

/* ── Contact icon helper ────────────────────────────────────────────────── */

function contactIcon(type: string) {
  switch (type) {
    case "phone": return Phone
    case "email": return Mail
    case "url": return Globe
    default: return Flag
  }
}

/* ── Format date helper ─────────────────────────────────────────────────── */

function formatAnalyzedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    })
  } catch {
    return iso
  }
}

/* ════════════════════════════════════════════════════════════════════════ */
/*  Main component                                                         */
/* ════════════════════════════════════════════════════════════════════════ */

export default function TrustCheck() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const demoId = new URLSearchParams(searchString).get("demo")
  const { trustCheckAnalysis } = useAnalysisContext()
  const { isSignedIn } = useUser()
  const { entitlements } = useEntitlements()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [demoAnalysis, setDemoAnalysis] = useState<TrustCheckAnalysis | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)
  const [copyDone, setCopyDone] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")

  function handleCheckDocument() {
    const hasTrustCheck = entitlements?.toolAccess?.includes("trust-check") ?? false
    if (!hasTrustCheck) {
      setShowUpgrade(true)
      return
    }
    setLocation("/import?mode=trust-check")
  }

  useEffect(() => {
    document.title = "Document Trust Check — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => {
    if (!demoId) return
    setDemoLoading(true)
    setDemoError(null)
    const apiBase = getApiBaseUrl()
    fetch(`${apiBase}/api/documents/trust-check-demo/${encodeURIComponent(demoId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.analysis) setDemoAnalysis(data.analysis)
        else setDemoError("Demo not found.")
      })
      .catch(() => setDemoError("Failed to load demo."))
      .finally(() => setDemoLoading(false))
  }, [demoId])

  const analysis: TrustCheckAnalysis | null = demoId ? demoAnalysis : trustCheckAnalysis

  if (demoLoading) {
    return <DocumentScanScreen mode="trust-check" />
  }

  /* ── Empty / landing state ────────────────────────────────────────── */
  if (!analysis) {
    const TC_DEMO_CHIPS = [
      { id: "fake-utility-shutoff", label: "Fake Utility Shutoff Notice", verdict: "High scam risk", icon: XCircle, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/50" },
      { id: "fake-irs-collection", label: "Fake IRS Collection Letter", verdict: "High scam risk", icon: XCircle, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/50" },
      { id: "legitimate-utility-notice", label: "Legitimate Utility Notice", verdict: "Likely legitimate", icon: CheckCircle2, color: "text-green-500 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50" },
    ]
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-primary/60" />
          </div>
          <h2 className="text-base font-bold mb-2">{demoError || "Document Trust Check"}</h2>
          <p className="text-sm text-muted-foreground mb-5">Check if a document is legitimate. PlainPath detects scams, forgeries, and high-risk patterns.</p>
          <Button onClick={handleCheckDocument} className="gap-2">
            Check a Document <ArrowRight className="w-4 h-4" />
          </Button>
          <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="trustCheck" />

          <div className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-border/50" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Or try a demo</p>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <div className="flex flex-col gap-2">
              {TC_DEMO_CHIPS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setLocation(`/trust-check?demo=${d.id}`)}
                  style={{ touchAction: "manipulation" }}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-primary/40 hover:shadow-md transition-all text-left"
                >
                  <div className={`w-8 h-8 rounded-xl ${d.bg} flex items-center justify-center shrink-0`}>
                    <d.icon className={`w-4 h-4 ${d.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">{d.label}</p>
                    <p className="text-[11px] text-muted-foreground">{d.verdict}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Derived values ───────────────────────────────────────────────── */
  const vc = verdictColor(analysis.verdict)
  const scores: TrustCheckScores | undefined = analysis.scores

  const highIndicators = analysis.scamIndicators.filter((i) => i.severity === "high")
  const medIndicators = analysis.scamIndicators.filter((i) => i.severity === "medium")
  const lowIndicators = analysis.scamIndicators.filter((i) => i.severity === "low")

  const hasStructural = (analysis.structuralFindings?.length ?? 0) > 0
  const hasMetadata = (analysis.metadataFindings?.length ?? 0) > 0

  const isHighRisk = analysis.verdict === "High scam risk"
  const isSuspicious = analysis.verdict === "Suspicious — verify before acting"

  /* ── Actions ──────────────────────────────────────────────────────── */
  async function handleSave() {
    if (!analysis || demoId) return
    const title = `Trust Check — ${analysis.verdict} (${analysis.riskScore}/100)`
    if (isSignedIn) {
      try {
        const saved = await saveCloudTrustCheck({ title, analysis })
        setSavedId(saved.id)
      } catch {
        const saved = saveTrustCheck({ title, analysis })
        setSavedId(saved.id)
      }
    } else {
      const saved = saveTrustCheck({ title, analysis })
      setSavedId(saved.id)
    }
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }

  function copyResults() {
    const lines: string[] = [
      `PLAINPATH — DOCUMENT TRUST CHECK`,
      `Scam Risk Score: ${analysis.riskScore}/100`,
      `Verdict: ${analysis.verdict}`,
      `Interpretation: ${interpretRiskScore(analysis.riskScore)}`,
      ``,
      `─── VERDICT EXPLANATION ───`,
      analysis.verdictExplanation ?? "",
      ``,
      `─── RECOMMENDED ACTIONS ───`,
      ...recommendedActions(analysis.verdict).map(a => `• ${a.text}`),
      ``,
      `─── WHAT THIS DOCUMENT CLAIMS ───`,
      analysis.whatItClaims ?? "",
      ``,
    ]
    if (analysis.demandedAction) {
      lines.push(`─── WHAT IT DEMANDS ───`, analysis.demandedAction, ``)
    }
    if (analysis.scamIndicators?.length) {
      lines.push(`─── SCAM INDICATORS (${analysis.scamIndicators.length}) ───`)
      analysis.scamIndicators.forEach(i => {
        lines.push(`[${i.severity.toUpperCase()}] ${i.indicator}`)
        if (i.sourceEvidence) lines.push(`  Evidence: "${i.sourceEvidence}"`)
      })
      lines.push(``)
    }
    if (analysis.structuralFindings?.length) {
      lines.push(`─── STRUCTURAL OBSERVATIONS ───`)
      analysis.structuralFindings.forEach((f, n) => lines.push(`${n + 1}. ${f}`))
      lines.push(``)
    }
    if (analysis.whatToVerify?.length) {
      lines.push(`─── WHAT TO VERIFY ───`)
      analysis.whatToVerify.forEach((s, n) => lines.push(`${n + 1}. ${s}`))
      lines.push(``)
    }
    if (analysis.safeNextSteps?.length) {
      lines.push(`─── SAFE NEXT STEPS ───`)
      analysis.safeNextSteps.forEach((s, n) => lines.push(`${n + 1}. ${s}`))
    }
    if (analysis.processedAt) {
      lines.push(``, `Analyzed: ${formatAnalyzedAt(analysis.processedAt)}`)
      lines.push(`PlainPath — plainpathapp.com`)
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    })
  }

  function exportPDF() {
    window.print()
  }

  /* ── Sidebar section config ───────────────────────────────────────── */
  const SIDEBAR_SECTIONS = [
    { id: "overview",     label: "Verdict",              icon: ShieldCheck,  count: null },
    { id: "indicators",   label: "Scam Indicators",      icon: Flag,         count: analysis.scamIndicators.length,          warn: true  },
    { id: "contacts",     label: "Contact Details",      icon: Phone,        count: analysis.contactDetails.length,           warn: analysis.contactDetails.some(c => c.suspicious) },
    { id: "deadlines",    label: "Deadlines",            icon: Clock,        count: analysis.deadlines.length,                warn: analysis.deadlines.some(d => d.type === "threat" || d.type === "escalation") },
    { id: "legitimacy",   label: "Legitimacy Signals",   icon: CheckCircle2, count: analysis.legitimacyIndicators?.length ?? 0, warn: false },
    { id: "fingerprint",  label: "Doc Metadata",         icon: Fingerprint,  count: (analysis.metadataFindings?.length ?? 0) + (analysis.structuralFindings?.length ?? 0), warn: (analysis.metadataFindings?.length ?? 0) > 0 },
    { id: "verify",       label: "Verify & Next Steps",  icon: Eye,          count: analysis.whatToVerify.length + analysis.safeNextSteps.length, warn: false },
  ]

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">

      {/* ── Header ── */}
      <div className="no-print flex-shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3 bg-slate-900 border-b border-slate-800 z-30">
        <button
          onClick={() => setLocation("/import?mode=trust-check")}
          style={{ touchAction: "manipulation" }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-xl bg-blue-900/50 border border-blue-700/40 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Trust Check</span>
          <h1 className="text-sm font-bold text-slate-100 truncate leading-tight">{analysis.verdict}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
            <span className={`text-xs font-bold tabular-nums ${vc.text}`}>{analysis.riskScore}</span>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">risk / 100</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={copyResults}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors"
            title="Copy results"
          >
            {copyDone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={exportPDF}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors print:hidden"
            title="Export PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {!demoId && (
            <button
              onClick={handleSave}
              className={`p-1.5 rounded-lg border transition-colors ${
                justSaved
                  ? "border-emerald-700/50 bg-emerald-900/30 text-emerald-400"
                  : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
              }`}
              title={savedId ? "Saved" : "Save result"}
            >
              {savedId ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={() => setLocation("/import?mode=trust-check")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            New Check <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="no-print w-[200px] lg:w-[220px] flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto">

          {/* Risk score */}
          <div className="px-3 pt-4 pb-3 border-b border-slate-800/80">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Risk Score</p>
            <div className="flex items-end gap-1.5 mb-1.5">
              <span className={`text-3xl font-bold tabular-nums leading-none ${vc.text}`}>{analysis.riskScore}</span>
              <span className="text-xs text-slate-600 mb-0.5">/ 100</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.riskScore}%` }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${vc.bar}`}
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">{interpretRiskScore(analysis.riskScore)}</p>
          </div>

          {/* Sub-score breakdown */}
          {scores && (
            <div className="px-3 py-3 border-b border-slate-800/80">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Score Breakdown</p>
              <div className="space-y-2">
                {[
                  { label: "Authenticity Risk",     score: scores.authenticityRisk,       bad: true  },
                  { label: "Document Risk",          score: scores.documentRisk,           bad: true  },
                  { label: "Verification Conf.",     score: scores.verificationConfidence, bad: false },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-slate-500 leading-tight truncate">{s.label}</span>
                      <span className={`text-[9px] font-bold tabular-nums ${s.bad && s.score > 50 ? "text-red-400" : s.bad ? "text-amber-400" : s.score > 50 ? "text-emerald-400" : "text-slate-400"}`}>{s.score}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          s.bad
                            ? s.score > 60 ? "bg-red-500" : s.score > 35 ? "bg-amber-500" : "bg-emerald-500"
                            : s.score > 60 ? "bg-emerald-500" : s.score > 35 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stat tiles */}
          <div className="px-3 py-3 border-b border-slate-800/80 grid grid-cols-2 gap-1.5">
            {[
              { label: "Indicators", value: analysis.scamIndicators.length, warn: highIndicators.length > 0, id: "indicators" },
              { label: "High Risk",  value: highIndicators.length,          warn: highIndicators.length > 0, id: "indicators" },
              { label: "Contacts",   value: analysis.contactDetails.length, warn: analysis.contactDetails.some(c => c.suspicious), id: "contacts" },
              { label: "Deadlines",  value: analysis.deadlines.length,      warn: analysis.deadlines.some(d => d.type === "threat"), id: "deadlines" },
            ].map((tile, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(tile.id)}
                className={`rounded-lg p-2 text-left transition-colors hover:bg-slate-800 border ${
                  tile.warn && tile.value > 0 ? "border-amber-800/50 bg-amber-950/20" : "border-slate-800 bg-slate-800/40"
                }`}
              >
                <div className={`text-lg font-bold tabular-nums leading-none mb-0.5 ${tile.warn && tile.value > 0 ? "text-amber-300" : "text-slate-200"}`}>
                  {tile.value}
                </div>
                <div className="text-[9px] text-slate-500 font-medium leading-tight">{tile.label}</div>
              </button>
            ))}
          </div>

          {/* Section nav */}
          <nav className="flex-1 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1 mt-1">Sections</p>
            {SIDEBAR_SECTIONS.map(sec => {
              const isActive = activeSection === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`relative w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors outline-none ${
                    isActive
                      ? "bg-blue-900/30 text-blue-300"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-300"
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-blue-500" />}
                  <sec.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                  <span className="text-xs font-medium flex-1 truncate">{sec.label}</span>
                  {sec.count != null && sec.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                      isActive
                        ? "bg-blue-800 text-blue-200"
                        : sec.warn
                        ? "bg-red-900/60 text-red-400"
                        : "bg-slate-800 text-slate-500"
                    }`}>
                      {sec.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Upgrade nudge */}
          <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-blue-900/30 to-slate-800/80 border border-blue-800/40">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wide">Pro</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mb-2">Get sender intelligence, domain lookup & pattern matching</p>
            <a href="/upgrade" className="block w-full py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold text-center transition-colors">
              Upgrade
            </a>
          </div>

          <div className="px-3 pb-3">
            <a href="/methodology" className="flex items-center gap-1.5 text-[9px] text-slate-700 hover:text-slate-600 transition-colors">
              <Shield className="w-3 h-3" /> Reviewed by licensed attorneys
            </a>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto bg-slate-950 dark">
          <div className="max-w-2xl mx-auto px-5 sm:px-7 py-6" style={{ paddingBottom: "max(3rem, env(safe-area-inset-bottom) + 3rem)" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.14 }}
                className="space-y-4"
              >

                {/* ── Overview / Verdict ── */}
                {activeSection === "overview" && (
                  <>
                    {/* Verdict banner */}
                    <div className={`rounded-2xl border p-5 ${vc.bg} ${vc.border}`}>
                      <div className="flex items-start gap-5 flex-wrap mb-3">
                        <div className="text-center min-w-[72px]">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Risk Score</p>
                          <p className={`text-5xl font-bold leading-none tabular-nums ${vc.text}`}>{analysis.riskScore}</p>
                          <p className="text-xs text-muted-foreground mt-1">/ 100</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${vc.badge}`}>
                              <VerdictIcon verdict={analysis.verdict} />
                            </div>
                            <h2 className={`text-lg font-bold leading-snug ${vc.text}`}>{analysis.verdict}</h2>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed">{analysis.verdictExplanation}</p>
                        </div>
                      </div>
                      {/* Count pills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {analysis.scamIndicators.length === 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> No scam indicators
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveSection("indicators")}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            {analysis.scamIndicators.length} indicator{analysis.scamIndicators.length !== 1 ? "s" : ""}
                            {highIndicators.length > 0 && <span className="opacity-70">· {highIndicators.length} high-risk</span>}
                          </button>
                        )}
                        {(analysis.legitimacyIndicators?.length ?? 0) > 0 && (
                          <button
                            onClick={() => setActiveSection("legitimacy")}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" /> {analysis.legitimacyIndicators!.length} legitimacy signal{analysis.legitimacyIndicators!.length !== 1 ? "s" : ""}
                          </button>
                        )}
                      </div>
                      {/* Bar + legend */}
                      <div className="h-2 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${analysis.riskScore}%` }}
                          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                          className={`h-full rounded-full ${vc.bar}`}
                        />
                      </div>
                      <ScoreLegend score={analysis.riskScore} config={TRUST_CHECK_LEGEND} />
                    </div>

                    {/* Recommended Actions */}
                    <div className={`p-5 rounded-2xl border ${
                      isHighRisk
                        ? "border-red-200/70 dark:border-red-700/40 bg-red-50/40 dark:bg-red-950/20"
                        : isSuspicious
                        ? "border-amber-200/70 dark:border-amber-700/40 bg-amber-50/40 dark:bg-amber-950/20"
                        : "border-blue-200/70 dark:border-blue-700/40 bg-blue-50/40 dark:bg-blue-950/20"
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckSquare className={`w-4 h-4 ${isHighRisk ? "text-red-500 dark:text-red-400" : isSuspicious ? "text-amber-500 dark:text-amber-400" : "text-blue-500 dark:text-blue-400"}`} />
                        <h3 className={`text-sm font-bold ${isHighRisk ? "text-red-800 dark:text-red-300" : isSuspicious ? "text-amber-800 dark:text-amber-300" : "text-blue-800 dark:text-blue-300"}`}>
                          Recommended Actions
                        </h3>
                      </div>
                      <ul className="space-y-2.5">
                        {recommendedActions(analysis.verdict).map((action, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <action.icon className={`w-4 h-4 shrink-0 mt-0.5 ${action.color}`} />
                            <p className="text-sm text-foreground/85 leading-snug">{action.text}</p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* What it claims / demands */}
                    {analysis.whatItClaims && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">What This Document Claims</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{analysis.whatItClaims}</p>
                      </div>
                    )}
                    {analysis.demandedAction && (
                      <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">What It Demands From You</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{analysis.demandedAction}</p>
                      </div>
                    )}

                    {/* Meta strip */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{`Analyzed ${formatAnalyzedAt(analysis.processedAt)}`}</span>
                      {analysis.documentType && <><span>·</span><span>{analysis.documentType}</span></>}
                      {demoId && <><span>·</span><span>Demo document</span></>}
                    </div>
                  </>
                )}

                {/* ── Scam Indicators ── */}
                {activeSection === "indicators" && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="w-4 h-4 text-red-400" />
                      <h2 className="text-base font-bold text-slate-200">Scam Indicators</h2>
                      <span className="ml-auto text-xs text-slate-600">{analysis.scamIndicators.length} total</span>
                    </div>
                    {analysis.scamIndicators.length === 0 ? (
                      <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-8 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm text-emerald-300 font-semibold">No scam indicators detected</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...highIndicators, ...medIndicators, ...lowIndicators].map((indicator, i) => (
                          <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${
                            indicator.severity === "high"
                              ? "border-red-800/50 bg-red-950/20"
                              : indicator.severity === "medium"
                              ? "border-amber-800/40 bg-amber-950/15"
                              : "border-slate-800 bg-slate-900/60"
                          }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                              indicator.severity === "high"
                                ? "bg-red-900/60 text-red-300 border border-red-700/50"
                                : indicator.severity === "medium"
                                ? "bg-amber-900/60 text-amber-300 border border-amber-700/50"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}>
                              {indicator.severity}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground leading-snug">{indicator.indicator}</p>
                              {indicator.sourceEvidence && (
                                <div className="mt-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Evidence</p>
                                  <p className="text-xs text-slate-400 italic leading-relaxed">"{indicator.sourceEvidence}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ── Contact Details ── */}
                {activeSection === "contacts" && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-blue-400" />
                      <h2 className="text-base font-bold text-slate-200">Contact Details</h2>
                      <span className="ml-auto text-xs text-slate-600">{analysis.contactDetails.length} found</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">Do not call or click these — verify through official public channels first.</p>
                    {analysis.contactDetails.length === 0 ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                        <p className="text-sm text-slate-400">No contact details found in this document.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
                        {analysis.contactDetails.map((contact, i) => {
                          const Icon = contactIcon(contact.type)
                          return (
                            <div key={i} className={`flex items-start gap-3 px-4 py-3.5 ${contact.suspicious ? "bg-amber-950/20" : ""}`}>
                              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${contact.suspicious ? "text-amber-400" : "text-slate-500"}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-xs font-mono font-medium text-foreground/90 break-all">{contact.value}</code>
                                  {contact.suspicious && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50 shrink-0">
                                      Verify
                                    </span>
                                  )}
                                </div>
                                {contact.note && <p className="text-xs text-slate-500 mt-0.5">{contact.note}</p>}
                              </div>
                              {contact.type === "url" && <ExternalLink className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* ── Deadlines ── */}
                {activeSection === "deadlines" && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <h2 className="text-base font-bold text-slate-200">Deadlines & Pressure Tactics</h2>
                      <span className="ml-auto text-xs text-slate-600">{analysis.deadlines.length}</span>
                    </div>
                    {analysis.deadlines.length === 0 ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                        <p className="text-sm text-slate-400">No deadlines or pressure tactics detected.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {analysis.deadlines.map((dl, i) => {
                          const isThreaten = dl.type === "threat" || dl.type === "escalation"
                          return (
                            <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${isThreaten ? "border-red-800/50 bg-red-950/20" : "border-slate-800 bg-slate-900/60"}`}>
                              {isThreaten
                                ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                : <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                              }
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground leading-snug">{dl.text}</p>
                                {dl.note && <p className="text-xs text-slate-500 mt-0.5">{dl.note}</p>}
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 border ${
                                isThreaten ? "bg-red-900/60 text-red-300 border-red-700/50" : "bg-slate-800 text-slate-500 border-slate-700"
                              }`}>
                                {dl.type === "explicit_date" ? "date" : dl.type === "relative" ? "urgency" : dl.type}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* ── Legitimacy Signals ── */}
                {activeSection === "legitimacy" && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-base font-bold text-slate-200">Legitimacy Signals</h2>
                    </div>

                    {(analysis.legitimacyIndicators?.length ?? 0) === 0 ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                        <p className="text-sm text-slate-400">No legitimacy signals detected.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/15 divide-y divide-slate-800/60 overflow-hidden">
                        {analysis.legitimacyIndicators!.map((signal, i) => (
                          <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground/85 leading-snug">{signal}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {(analysis.contractRiskNotes || (analysis.contractTermsFound && analysis.contractTermsFound.length > 0)) && (
                      <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-4 mt-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Contract Terms to Review</p>
                        {analysis.contractRiskNotes && (
                          <p className="text-sm text-foreground/80 leading-relaxed mb-3">{analysis.contractRiskNotes}</p>
                        )}
                        {analysis.contractTermsFound && analysis.contractTermsFound.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.contractTermsFound.map((term, i) => (
                              <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/50">
                                {term}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ── Doc Metadata / Fingerprint ── */}
                {activeSection === "fingerprint" && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Fingerprint className="w-4 h-4 text-violet-400" />
                      <h2 className="text-base font-bold text-slate-200">Document Metadata</h2>
                    </div>

                    {hasMetadata && (
                      <>
                        <p className="text-xs text-slate-500 mb-2">Suspicious findings from the PDF file's embedded metadata — may indicate the document was produced by unexpected software or modified after the fact.</p>
                        <div className="rounded-2xl border border-amber-800/40 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
                          {analysis.metadataFindings!.map((finding, i) => (
                            <div key={i} className="px-4 py-4">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-semibold text-slate-200">{finding.field}</span>
                                <code className="text-xs font-mono text-amber-300">{finding.value}</code>
                                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50">Suspicious</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-snug">{finding.note}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {hasStructural && (
                      <>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mt-4 mb-2">Structural Observations</p>
                        <p className="text-xs text-slate-500 mb-2">Text-pattern and logic inconsistencies in the document structure — distinct from scam indicators.</p>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
                          {analysis.structuralFindings!.map((finding, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                              <p className="text-sm text-foreground/80 leading-relaxed">{finding}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {!hasMetadata && !hasStructural && (
                      <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-8 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm text-emerald-300 font-semibold">No metadata anomalies found</p>
                      </div>
                    )}
                  </>
                )}

                {/* ── Verify & Next Steps ── */}
                {activeSection === "verify" && (
                  <>
                    {analysis.whatToVerify.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-blue-400" />
                          <h2 className="text-base font-bold text-slate-200">What To Verify Before Acting</h2>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden mb-4">
                          {analysis.whatToVerify.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                              <div className="w-5 h-5 rounded-full bg-blue-900/60 border border-blue-700/50 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[9px] font-bold text-blue-300">{i + 1}</span>
                              </div>
                              <p className="text-sm text-foreground/85 leading-relaxed">{item}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {analysis.safeNextSteps.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                          <h2 className="text-base font-bold text-slate-200">Safe Next Steps</h2>
                        </div>
                        <div className="rounded-2xl border border-emerald-800/40 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
                          {analysis.safeNextSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[9px] font-bold text-emerald-300">{i + 1}</span>
                              </div>
                              <p className="text-sm text-foreground/85 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {analysis.whatToVerify.length === 0 && analysis.safeNextSteps.length === 0 && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                        <p className="text-sm text-slate-400">No verification steps generated.</p>
                      </div>
                    )}
                  </>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="trustCheck" />
    </div>
  )
}
