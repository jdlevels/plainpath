import { useEffect, useState } from "react"
import { useLocation, useSearch } from "wouter"
import { motion } from "framer-motion"
import {
  ArrowLeft, ShieldCheck, AlertTriangle, XCircle, CheckCircle2,
  Phone, Mail, Globe, Calendar, Clock, Eye, CheckSquare,
  ArrowRight, AlertCircle, Flag, Shield, ExternalLink,
  Loader2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { getApiBaseUrl } from "@/lib/api"
import {
  type TrustCheckAnalysis, type TrustCheckVerdict,
  verdictColor, severityColor,
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

  const highIndicators = analysis.scamIndicators.filter((i) => i.severity === "high")
  const medIndicators = analysis.scamIndicators.filter((i) => i.severity === "medium")
  const lowIndicators = analysis.scamIndicators.filter((i) => i.severity === "low")

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
                Risk score: {analysis.riskScore}/100
              </p>
            </div>

            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${vc.badge}`}>
              {analysis.verdict}
            </span>

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

        {/* Risk Verdict banner */}
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
              <span className="font-medium text-muted-foreground">Risk Score</span>
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
        {analysis.scamIndicators.length > 0 && (
          <SectionCard icon={Shield} title={`Scam Indicators (${analysis.scamIndicators.length})`}>
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
            {analysis.scamIndicators.length === 0 && (
              <p className="text-sm text-muted-foreground">No specific scam indicators detected.</p>
            )}
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
            PlainPath Trust Check uses AI and rule-based analysis to assess risk. Results are not legal or financial advice. When in doubt, consult an official agency or attorney.
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
