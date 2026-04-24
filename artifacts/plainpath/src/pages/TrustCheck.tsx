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

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom) + 6rem)" }}
    >
      {/* ── Sticky header ───────────────────────────────────────────── */}
      <ResultStickyHeader
        toolIcon={ShieldCheck}
        toolLabel="Document Trust Check"
        toolIconClass="text-primary/70"
        subtitleText={`Scam Risk Score: ${analysis.riskScore}/100`}
        verdictLabel={analysis.verdict}
        verdictBadgeClass={vc.badge}
        onBack={() => setLocation("/import?mode=trust-check")}
        actions={
          <>
            <button
              onClick={copyResults}
              title="Copy results as text"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
              aria-label="Copy summary"
            >
              {copyDone ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={exportPDF}
              title="Export as PDF"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
              aria-label="Export PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            {!demoId && (
              <button
                onClick={handleSave}
                title={savedId ? "Saved to My Analyses" : "Save this result"}
                className={`p-2 rounded-xl transition-colors shrink-0 ${
                  justSaved
                    ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                aria-label="Save result"
              >
                {savedId ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/import?mode=trust-check")}
              className="text-xs h-8 hidden sm:flex gap-1.5 shrink-0"
            >
              New Check <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </>
        }
      />

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 space-y-4">

        {/* ── 1. Primary Verdict banner ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 sm:p-6 ${vc.bg} ${vc.border}`}
        >
          {/* Score + verdict row */}
          <div className="flex items-start gap-6 flex-wrap mb-3">
            <div className="text-center min-w-[80px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Scam Risk Score</p>
              <p className={`text-6xl font-bold leading-none tabular-nums ${vc.text}`}>{analysis.riskScore}</p>
              <p className="text-xs text-muted-foreground mt-1">/ 100</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${vc.badge}`}>
                  <VerdictIcon verdict={analysis.verdict} />
                </div>
                <h1 className={`text-xl font-bold leading-snug ${vc.text}`}>{analysis.verdict}</h1>
              </div>
              <p className={`text-xs font-semibold mb-2 ${vc.text} opacity-70`}>{interpretRiskScore(analysis.riskScore)}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{analysis.verdictExplanation}</p>
            </div>
          </div>

          {/* Count summary pills */}
          {(() => {
            const high = analysis.scamIndicators.filter(i => i.severity === "high").length
            const total = analysis.scamIndicators.length
            const legit = analysis.legitimacyIndicators?.length ?? 0
            return (
              <div className="flex flex-wrap gap-2 mb-4">
                {total === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> No scam indicators
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20">
                    <XCircle className="w-3 h-3" />
                    {total} scam {total === 1 ? "indicator" : "indicators"}
                    {high > 0 && <span className="opacity-70">· {high} high-risk</span>}
                  </span>
                )}
                {legit > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> {legit} legitimacy {legit === 1 ? "signal" : "signals"}
                  </span>
                )}
              </div>
            )
          })()}

          {/* Progress bar + legend */}
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.riskScore}%` }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${vc.bar}`}
              />
            </div>
          </div>
          <ScoreLegend score={analysis.riskScore} config={TRUST_CHECK_LEGEND} />
        </motion.div>

        {/* ── 2. Recommended Action ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`p-5 border ${
            isHighRisk
              ? "border-red-200/70 dark:border-red-700/40 bg-red-50/40 dark:bg-red-950/20"
              : isSuspicious
              ? "border-amber-200/70 dark:border-amber-700/40 bg-amber-50/40 dark:bg-amber-950/20"
              : "border-blue-200/70 dark:border-blue-700/40 bg-blue-50/40 dark:bg-blue-950/20"
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                isHighRisk
                  ? "bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-700"
                  : isSuspicious
                  ? "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700"
                  : "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700"
              }`}>
                <CheckSquare className={`w-3.5 h-3.5 ${
                  isHighRisk ? "text-red-600 dark:text-red-400"
                  : isSuspicious ? "text-amber-600 dark:text-amber-400"
                  : "text-blue-600 dark:text-blue-400"
                }`} />
              </div>
              <h3 className={`text-sm font-bold ${
                isHighRisk ? "text-red-800 dark:text-red-300"
                : isSuspicious ? "text-amber-800 dark:text-amber-300"
                : "text-blue-800 dark:text-blue-300"
              }`}>Recommended Actions</h3>
            </div>
            <ul className="space-y-2.5">
              {recommendedActions(analysis.verdict).map((action, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <action.icon className={`w-4 h-4 shrink-0 mt-0.5 ${action.color}`} />
                  <p className="text-sm text-foreground/85 leading-snug">{action.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* ── 3. Metadata strip ─────────────────────────────────────── */}
        <ResultMetaStrip items={[
          { icon: Clock, text: `Analyzed ${formatAnalyzedAt(analysis.processedAt)}` },
          ...(analysis.documentType ? [{ icon: FileText, text: analysis.documentType }] : []),
          ...(demoId ? [{ icon: Info, text: "Demo document" }] : []),
        ]} />

        {/* ── 4. Score Summary — 3 dimensions ───────────────────────── */}
        {scores && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4 sm:p-5 border-border/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-3.5 h-3.5 text-primary/70" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Risk Score Breakdown</h3>
              </div>
              <div className="flex gap-3 flex-col sm:flex-row">
                <ScoreCard
                  label="Authenticity Risk"
                  score={scores.authenticityRisk}
                  description="Scam / impersonation signals"
                  tooltip="How strongly this document resembles known scam or impersonation patterns. High = strong scam characteristics."
                  colorFn={authenticityRiskColor}
                />
                <ScoreCard
                  label="Document Risk"
                  score={scores.documentRisk}
                  description="Harsh contract terms"
                  tooltip="Whether the document contains harmful, manipulative, or one-sided contract terms — regardless of whether it's a scam."
                  colorFn={documentRiskColor}
                />
                <ScoreCard
                  label="Verification Confidence"
                  score={scores.verificationConfidence}
                  description="How verifiable the sender appears"
                  tooltip="How many of the sender's claimed details (name, phone, address, domain) can be independently verified. High = easier to confirm."
                  colorFn={verificationConfidenceColor}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-3 leading-relaxed">
                Each score is independent. A legitimate company can still send a high-risk contract; a scam can still be sent on official letterhead.
              </p>
            </Card>
          </motion.div>
        )}

        {/* ── 5. Contract Risk Callout ───────────────────────────────── */}
        {(analysis.contractRiskNotes || (analysis.contractTermsFound && analysis.contractTermsFound.length > 0)) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5 border-amber-200/70 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">Contract Terms to Review</h3>
                  <p className="text-[11px] font-medium text-amber-700/70 dark:text-amber-400/60 mb-2.5">
                    Contract-risk findings — separate from scam or authenticity concerns. A document can be genuine and still contain terms that deserve careful attention.
                  </p>
                  {analysis.contractRiskNotes && (
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">{analysis.contractRiskNotes}</p>
                  )}
                  {analysis.contractTermsFound && analysis.contractTermsFound.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.contractTermsFound.map((term, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── 6. What This Letter Claims ─────────────────────────────── */}
        {analysis.whatItClaims && (
          <ResultSectionCard collapsible={false} icon={Flag} title="What This Document Claims">
            <p className="text-sm text-foreground/80 leading-relaxed">{analysis.whatItClaims}</p>
          </ResultSectionCard>
        )}

        {/* ── 7. Demanded Action ─────────────────────────────────────── */}
        {analysis.demandedAction && (
          <ResultSectionCard collapsible={false} icon={AlertCircle} title="What It Demands From You">
            <p className="text-sm text-foreground/80 leading-relaxed">{analysis.demandedAction}</p>
          </ResultSectionCard>
        )}

        {/* ── 8. Scam Indicators — collapsible ──────────────────────── */}
        <ResultSectionCard collapsible={true}
          icon={Shield}
          title="Scam Indicators"
          defaultOpen={isHighRisk || isSuspicious}
          badge={
            analysis.scamIndicators.length > 0 ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border mr-1 ${
                highIndicators.length > 0
                  ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                  : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
              }`}>
                {analysis.scamIndicators.length}
              </span>
            ) : null
          }
        >
          {analysis.scamIndicators.length > 0 ? (
            <div className="space-y-3">
              {[...highIndicators, ...medIndicators, ...lowIndicators].map((indicator, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${severityColor(indicator.severity)}`}>
                    {indicator.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">{indicator.indicator}</p>
                    {indicator.sourceEvidence && (
                      <div className="mt-1.5 flex items-start gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50 shrink-0 mt-0.5">Evidence</span>
                        <p className="text-xs text-muted-foreground italic bg-secondary/50 rounded-lg px-2.5 py-1.5 border border-border/30 leading-relaxed">
                          "{indicator.sourceEvidence}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No significant scam indicators detected in this document.</p>
          )}
        </ResultSectionCard>

        {/* ── 9. Legitimacy Signals ──────────────────────────────────── */}
        {analysis.legitimacyIndicators && analysis.legitimacyIndicators.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5 border-emerald-200/70 dark:border-emerald-700/40 bg-emerald-50/60 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    Legitimacy Signals ({analysis.legitimacyIndicators.length})
                  </h3>
                  <p className="text-[11px] font-medium text-emerald-700/70 dark:text-emerald-400/60 mb-2.5">
                    Observable signals that support this document's authenticity — specific elements that checked out during analysis.
                  </p>
                  <ul className="space-y-2">
                    {analysis.legitimacyIndicators.map((signal, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm text-foreground/80 leading-snug">{signal}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── 10. Metadata Findings ─────────────────────────────────── */}
        {hasMetadata && (
          <ResultSectionCard collapsible={true}
            icon={Info}
            title={`File Metadata Findings (${analysis.metadataFindings!.length})`}
            defaultOpen={false}
          >
            <p className="text-[11px] text-muted-foreground/70 mb-3 font-medium">
              These findings come from the PDF file's embedded metadata. Suspicious metadata may indicate the document was produced by unexpected software or modified after the fact.
            </p>
            <div className="space-y-2.5">
              {analysis.metadataFindings!.map((finding, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">{finding.field}</span>
                      <code className="text-xs font-mono text-muted-foreground">{finding.value}</code>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                        Suspicious
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{finding.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </ResultSectionCard>
        )}

        {/* ── 11. Structural Observations — collapsible ─────────────── */}
        {hasStructural && (
          <ResultSectionCard collapsible={true}
            icon={AlertTriangle}
            title={`Structural Observations (${analysis.structuralFindings!.length})`}
            defaultOpen={false}
            badge={
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 mr-1">
                {analysis.structuralFindings!.length}
              </span>
            }
          >
            <p className="text-[11px] text-muted-foreground/70 mb-3 font-medium">
              Text-pattern and logic inconsistencies in the document structure — distinct from scam indicators and contract terms.
            </p>
            <ul className="space-y-2.5">
              {analysis.structuralFindings!.map((finding, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{finding}</p>
                </li>
              ))}
            </ul>
          </ResultSectionCard>
        )}

        {/* ── 12. Contact Details — collapsible ─────────────────────── */}
        {analysis.contactDetails.length > 0 && (
          <ResultSectionCard collapsible={true}
            icon={Phone}
            title="Contact Details Found"
            defaultOpen={isHighRisk || isSuspicious}
            badge={
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-secondary text-muted-foreground border-border/40 mr-1">
                {analysis.contactDetails.length}
              </span>
            }
          >
            <div className="space-y-2.5">
              {analysis.contactDetails.map((contact, i) => {
                const Icon = contactIcon(contact.type)
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${contact.suspicious ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-secondary/30 border-border/30"}`}>
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${contact.suspicious ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono font-medium text-foreground break-all">{contact.value}</code>
                        {contact.suspicious && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                            Verify
                          </span>
                        )}
                        {!contact.suspicious && (
                          <span className="text-[10px] font-medium text-muted-foreground/60 shrink-0">
                            {contact.type}
                          </span>
                        )}
                      </div>
                      {contact.note && (
                        <p className="text-xs text-muted-foreground mt-0.5">{contact.note}</p>
                      )}
                    </div>
                    {contact.type === "url" && (
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 border-t border-border/30 pt-3">
              Do not call or visit these contacts from this document. Verify through official public channels first.
            </p>
          </ResultSectionCard>
        )}

        {/* ── 13. Deadlines & Pressure Tactics — collapsible ────────── */}
        {analysis.deadlines.length > 0 && (
          <ResultSectionCard collapsible={true}
            icon={Clock}
            title="Deadlines & Pressure Tactics"
            defaultOpen={isHighRisk || isSuspicious}
            badge={
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border mr-1 ${
                analysis.deadlines.some(d => d.type === "threat" || d.type === "escalation")
                  ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                  : "bg-secondary text-muted-foreground border-border/40"
              }`}>
                {analysis.deadlines.length}
              </span>
            }
          >
            <div className="space-y-2">
              {analysis.deadlines.map((dl, i) => {
                const isThreaten = dl.type === "threat" || dl.type === "escalation"
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isThreaten ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : "bg-secondary/30 border-border/30"}`}>
                    {isThreaten
                      ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      : <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{dl.text}</p>
                      {dl.note && <p className="text-xs text-muted-foreground mt-0.5">{dl.note}</p>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                      isThreaten
                        ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                        : dl.type === "relative"
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {dl.type === "explicit_date" ? "date" : dl.type === "relative" ? "urgency" : dl.type}
                    </span>
                  </div>
                )
              })}
            </div>
          </ResultSectionCard>
        )}

        {/* ── 14. What To Verify ─────────────────────────────────────── */}
        {analysis.whatToVerify.length > 0 && (
          <ResultSectionCard collapsible={false} icon={Eye} title="What To Verify Before Acting">
            <ul className="space-y-2.5">
              {analysis.whatToVerify.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/8 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary/70">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </ResultSectionCard>
        )}

        {/* ── 15. Safe Next Steps ────────────────────────────────────── */}
        {analysis.safeNextSteps.length > 0 && (
          <ResultSectionCard collapsible={false} icon={CheckSquare} title="Safe Next Steps">
            <ul className="space-y-2.5">
              {analysis.safeNextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-700 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{step}</p>
                </li>
              ))}
            </ul>
          </ResultSectionCard>
        )}

        {/* ── Footer disclaimer ──────────────────────────────────────── */}
        <div className="text-center py-4">
          <p className="text-[11px] text-muted-foreground/60 max-w-sm mx-auto leading-relaxed">
            PlainPath Trust Check uses AI and rule-based analysis to assess risk across three dimensions. Results are not legal or financial advice. When in doubt, consult an official agency or attorney.
          </p>
          <a href="/methodology" className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Methodology reviewed by licensed attorneys
          </a>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportPDF}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/import?mode=trust-check")}
              className="text-xs gap-1.5"
            >
              Check another document <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
