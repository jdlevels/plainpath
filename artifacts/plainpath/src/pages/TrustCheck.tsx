import { useEffect, useState } from "react"
import { useLocation, useSearch } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, ShieldCheck, AlertTriangle, XCircle, CheckCircle2,
  Phone, Mail, Globe, Calendar, Clock, Eye, CheckSquare,
  ArrowRight, AlertCircle, Flag, Shield, ExternalLink,
  Loader2, FileText, BarChart2, Info,
  Copy, Check,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { getApiBaseUrl } from "@/lib/api"
import {
  type TrustCheckAnalysis, type TrustCheckVerdict, type TrustCheckScores,
  verdictColor, severityColor,
  authenticityRiskColor, documentRiskColor, verificationConfidenceColor,
} from "@/lib/trustCheckTypes"

function VerdictIcon({ verdict }: { verdict: TrustCheckVerdict }) {
  switch (verdict) {
    case "High scam risk": return <XCircle className="w-5 h-5" />
    case "Suspicious — verify before acting": return <AlertTriangle className="w-5 h-5" />
    case "Cannot verify authenticity": return <AlertCircle className="w-5 h-5" />
    case "Likely legitimate": return <CheckCircle2 className="w-5 h-5" />
  }
}

function SectionCard({
  icon: Icon,
  title,
  children,
  className = "",
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`p-5 border-border/40 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary/70" />
          </div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
        {children}
      </Card>
    </motion.div>
  )
}

function ScoreCard({
  label,
  score,
  description,
  colorFn,
}: {
  label: string
  score: number
  description: string
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
        <span className="text-[10px] text-muted-foreground/60 leading-snug">{description}</span>
      </div>
    </div>
  )
}

function contactIcon(type: string) {
  switch (type) {
    case "phone": return Phone
    case "email": return Mail
    case "url": return Globe
    default: return Flag
  }
}

export default function TrustCheck() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const demoId = new URLSearchParams(searchString).get("demo")
  const { trustCheckAnalysis } = useAnalysisContext()
  const [demoAnalysis, setDemoAnalysis] = useState<TrustCheckAnalysis | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)
  const [copyDone, setCopyDone] = useState(false)

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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading trust check demo…</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-primary/60" />
          </div>
          <h2 className="text-base font-bold mb-2">{demoError || "No trust-check result found"}</h2>
          <p className="text-sm text-muted-foreground mb-5">Run a Document Trust Check to see a risk assessment here.</p>
          <Button onClick={() => setLocation("/import?mode=trust-check")} className="gap-2">
            Start a Trust Check <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const vc = verdictColor(analysis.verdict)
  const scores: TrustCheckScores | undefined = analysis.scores

  const highIndicators = analysis.scamIndicators.filter((i) => i.severity === "high")
  const medIndicators = analysis.scamIndicators.filter((i) => i.severity === "medium")
  const lowIndicators = analysis.scamIndicators.filter((i) => i.severity === "low")

  const hasStructural = (analysis.structuralFindings?.length ?? 0) > 0
  const hasMetadata = (analysis.metadataFindings?.length ?? 0) > 0

  function copyResults() {
    const lines: string[] = [
      `PLAINPATH — DOCUMENT TRUST CHECK`,
      `Verdict: ${analysis.verdict}`,
      `Authenticity Risk Score: ${analysis.riskScore}/100`,
      ``,
      `─── VERDICT EXPLANATION ───`,
      analysis.verdictExplanation ?? "",
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
      analysis.scamIndicators.forEach(i => lines.push(`[${i.severity.toUpperCase()}] ${i.indicator}`))
      lines.push(``)
    }
    if (analysis.structuralFindings?.length) {
      lines.push(`─── STRUCTURAL FINDINGS ───`)
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
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    })
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom) + 6rem)" }}
    >
      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-secondary active:bg-secondary rounded-xl transition-colors shrink-0"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <ShieldCheck className="w-3 h-3 text-primary/70" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                  Document Trust Check
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                Authenticity risk: {analysis.riskScore}/100
              </p>
            </div>

            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${vc.badge}`}>
              {analysis.verdict}
            </span>

            <button
              onClick={copyResults}
              title="Copy results as text"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
              aria-label="Copy results"
            >
              {copyDone ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/import?mode=trust-check")}
              className="text-xs h-8 hidden sm:flex gap-1.5 shrink-0"
            >
              New Check <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 space-y-4">

        {/* Primary Verdict banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 sm:p-6 ${vc.bg} ${vc.border}`}
        >
          <div className="flex items-start gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${vc.badge}`}>
              <VerdictIcon verdict={analysis.verdict} />
            </div>
            <div>
              <h1 className={`text-lg font-bold leading-snug ${vc.text}`}>{analysis.verdict}</h1>
              <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">{analysis.verdictExplanation}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Authenticity Risk Score</span>
              <span className={`font-bold tabular-nums ${vc.text}`}>{analysis.riskScore} / 100</span>
            </div>
            <div className="h-2 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.riskScore}%` }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${vc.bar}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/60 font-medium">
              <span>0 — Likely legitimate</span>
              <span>100 — High scam risk</span>
            </div>
          </div>
        </motion.div>

        {/* Score Summary — 3 dimensions */}
        {scores && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4 sm:p-5 border-border/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-3.5 h-3.5 text-primary/70" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Risk Score Summary</h3>
              </div>
              <div className="flex gap-3 flex-col sm:flex-row">
                <ScoreCard
                  label="Authenticity Risk"
                  score={scores.authenticityRisk}
                  description="Scam / impersonation signals"
                  colorFn={authenticityRiskColor}
                />
                <ScoreCard
                  label="Document Risk"
                  score={scores.documentRisk}
                  description="Harsh contract terms"
                  colorFn={documentRiskColor}
                />
                <ScoreCard
                  label="Verification Confidence"
                  score={scores.verificationConfidence}
                  description="How verifiable the sender appears"
                  colorFn={verificationConfidenceColor}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-3 leading-relaxed">
                These three scores are independent. A document can have low authenticity risk but high document risk, or vice versa.
              </p>
            </Card>
          </motion.div>
        )}

        {/* Contract Risk Callout — shown only for contract-type documents */}
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
                    These are contract-risk findings — separate from any scam or authenticity concerns. A document can be genuine and still contain terms that deserve careful attention.
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

        {/* What This Letter Claims */}
        {analysis.whatItClaims && (
          <SectionCard icon={Flag} title="What This Letter Claims">
            <p className="text-sm text-foreground/80 leading-relaxed">{analysis.whatItClaims}</p>
          </SectionCard>
        )}

        {/* Demanded Action */}
        {analysis.demandedAction && (
          <SectionCard icon={AlertCircle} title="Demanded Action">
            <p className="text-sm text-foreground/80 leading-relaxed">{analysis.demandedAction}</p>
          </SectionCard>
        )}

        {/* Scam Indicators */}
        <SectionCard icon={Shield} title={`Scam Indicators${analysis.scamIndicators.length > 0 ? ` (${analysis.scamIndicators.length})` : ""}`}>
          {analysis.scamIndicators.length > 0 ? (
            <div className="space-y-3">
              {[...highIndicators, ...medIndicators, ...lowIndicators].map((indicator, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${severityColor(indicator.severity)}`}>
                    {indicator.severity}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground leading-snug">{indicator.indicator}</p>
                    {indicator.sourceEvidence && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">"{indicator.sourceEvidence}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No significant scam indicators detected in this document.</p>
          )}
        </SectionCard>

        {/* Metadata Findings — only suspicious findings, only for uploaded PDFs */}
        {hasMetadata && (
          <SectionCard icon={Info} title={`File Metadata Findings (${analysis.metadataFindings!.length})`}>
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
          </SectionCard>
        )}

        {/* Structural Findings */}
        {hasStructural && (
          <SectionCard icon={AlertTriangle} title={`Structural Observations (${analysis.structuralFindings!.length})`}>
            <p className="text-[11px] text-muted-foreground/70 mb-3 font-medium">
              These are text-pattern and logic inconsistencies found in the document structure — distinct from scam indicators and contract terms.
            </p>
            <ul className="space-y-2.5">
              {analysis.structuralFindings!.map((finding, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{finding}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Suspicious Contact Details */}
        {analysis.contactDetails.length > 0 && (
          <SectionCard icon={Phone} title="Contact Details Found">
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
              Do not call or visit these contacts directly. Verify through official public channels first.
            </p>
          </SectionCard>
        )}

        {/* Deadlines & Pressure Tactics */}
        {analysis.deadlines.length > 0 && (
          <SectionCard icon={Clock} title="Deadlines & Pressure Tactics">
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
          </SectionCard>
        )}

        {/* What To Verify */}
        {analysis.whatToVerify.length > 0 && (
          <SectionCard icon={Eye} title="What To Verify Before Acting">
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
          </SectionCard>
        )}

        {/* Safe Next Steps */}
        {analysis.safeNextSteps.length > 0 && (
          <SectionCard icon={CheckSquare} title="Safe Next Steps">
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
          </SectionCard>
        )}

        {/* Footer disclaimer */}
        <div className="text-center py-4">
          <p className="text-[11px] text-muted-foreground/60 max-w-sm mx-auto leading-relaxed">
            PlainPath Trust Check uses AI and rule-based analysis to assess risk across three dimensions. Results are not legal or financial advice. When in doubt, consult an official agency or attorney.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/import?mode=trust-check")}
            className="mt-3 text-xs gap-1.5"
          >
            Check another document <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
