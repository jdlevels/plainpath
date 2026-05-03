import { useEffect } from "react"
import { useLocation } from "wouter"
import { useGetDemoDocument } from "@workspace/api-client-react"
import { motion } from "framer-motion"
import {
  ArrowRight, AlertTriangle, Calendar, ListTodo, FileText,
  CheckCircle2, XCircle, Sparkles, Clock, Flag, BookOpen,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DocumentAnalysis } from "@workspace/api-client-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAIN_ENGLISH_LABELS: Record<string, string> = {
  whatItIs:       "What is this document?",
  whatItSays:     "What does it say?",
  whatItAsks:     "What does it ask of you?",
  obligations:    "Your obligations",
  payAttentionTo: "What to pay attention to",
  nextSteps:      "Recommended next steps",
}

// ─── Demo banner ──────────────────────────────────────────────────────────────

function DemoBanner() {
  const [, navigate] = useLocation()
  return (
    <div className="sticky top-16 z-30 w-full bg-amber-500 dark:bg-amber-600 text-white">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            <span className="font-bold">Demo mode</span>
            <span className="hidden sm:inline"> — this is sample data. Analyze your own documents free.</span>
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("/sign-up")}
          className="shrink-0 bg-white text-amber-700 hover:bg-amber-50 border-0 font-semibold text-xs h-7 px-3 rounded-full"
        >
          Open App <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="h-8 bg-muted/40 rounded-xl w-2/3 animate-pulse" />
      <div className="h-4 bg-muted/30 rounded-lg w-1/3 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {[0,1,2,3].map(i => <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-40 bg-muted/20 rounded-2xl animate-pulse" />
      <div className="h-48 bg-muted/20 rounded-2xl animate-pulse" />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, iconCls, bgCls,
}: { icon: React.ElementType; label: string; value: number | string; iconCls: string; bgCls: string }) {
  return (
    <Card className="border border-border/60 bg-card rounded-2xl p-4 text-center">
      <div className={`w-9 h-9 rounded-xl ${bgCls} flex items-center justify-center mx-auto mb-2`}>
        <Icon className={`w-4.5 h-4.5 ${iconCls}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Card>
  )
}

// ─── Sign-up CTA ──────────────────────────────────────────────────────────────

function SignUpCTA() {
  const [, navigate] = useLocation()
  return (
    <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-2xl p-6 text-center">
      <Lock className="w-8 h-8 text-primary mx-auto mb-3 opacity-70" />
      <h3 className="text-lg font-bold text-foreground mb-1">Analyze your own documents</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
        Upload or paste any document — lease, contract, medical bill, legal notice — and get a plain-English breakdown like this one in under 2 minutes.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={() => navigate("/sign-up")} className="gap-2 rounded-xl">
          Start free <ArrowRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate("/sign-in")} className="rounded-xl">
          Sign in
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-3">No credit card required · Free plan available</p>
    </Card>
  )
}

// ─── Main Demo page ───────────────────────────────────────────────────────────

export default function Demo({ id }: { id?: string }) {
  const demoId = id ?? "event-permit"
  const [, navigate] = useLocation()

  const { data, isLoading, error } = useGetDemoDocument(demoId as any)
  const analysis: DocumentAnalysis | undefined = data?.analysis

  useEffect(() => {
    if (analysis?.title) {
      document.title = `${analysis.title} (Demo) — PlainPath`
      return () => { document.title = "PlainPath" }
    }
  }, [analysis?.title])

  if (isLoading) {
    return (
      <>
        <DemoBanner />
        <LoadingSkeleton />
      </>
    )
  }

  if (error || !analysis) {
    return (
      <>
        <DemoBanner />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Demo not found</h2>
          <p className="text-sm text-muted-foreground mb-6">The requested demo document couldn't be loaded.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Back to PlainPath</Button>
        </div>
      </>
    )
  }

  const actionSteps  = analysis.actionSteps ?? []
  const deadlines    = analysis.deadlines ?? []
  const risks        = analysis.risks ?? []
  const plainEnglish = analysis.plainEnglish as Record<string, string> | undefined
  const peEntries    = plainEnglish
    ? Object.entries(plainEnglish).filter(([, v]) => typeof v === "string" && v.trim())
    : []
  const highRisks    = risks.filter((r: any) => r.severity === "high")

  return (
    <>
      <DemoBanner />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-amber-400/60 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
              Sample Document
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            {analysis.title}
          </h1>
          {(analysis as any).documentType && (
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {(analysis as any).documentType}
            </p>
          )}
        </motion.div>

        {/* At-a-glance stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <StatCard icon={ListTodo}      label="Action steps" value={actionSteps.length} iconCls="text-blue-500"   bgCls="bg-blue-50 dark:bg-blue-950/50" />
          <StatCard icon={Calendar}      label="Deadlines"    value={deadlines.length}   iconCls="text-orange-500" bgCls="bg-orange-50 dark:bg-orange-950/50" />
          <StatCard icon={AlertTriangle} label="High risks"   value={highRisks.length}   iconCls="text-red-500"    bgCls="bg-red-50 dark:bg-red-950/50" />
          <StatCard icon={BookOpen}      label="Sections"     value={peEntries.length}   iconCls="text-violet-500" bgCls="bg-violet-50 dark:bg-violet-950/50" />
        </motion.div>

        {/* Summary */}
        {analysis.summary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Overview
            </h2>
            <Card className="border border-border/60 bg-card rounded-2xl p-5">
              <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
            </Card>
          </motion.div>
        )}

        {/* Plain English sections (first 3, rest locked) */}
        {peEntries.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Plain English
            </h2>
            <Card className="border border-border/60 bg-card rounded-2xl divide-y divide-border/40">
              {peEntries.slice(0, 3).map(([key, value]) => (
                <div key={key} className="px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    {PLAIN_ENGLISH_LABELS[key] ?? key}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{value}</p>
                </div>
              ))}
              {peEntries.length > 3 && (
                <div className="flex items-center gap-2 px-5 py-3.5 text-sm text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  {peEntries.length - 3} more section{peEntries.length - 3 !== 1 ? "s" : ""} — sign up to read all
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Action steps (first 4) */}
        {actionSteps.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <ListTodo className="w-3.5 h-3.5" /> Action Steps
            </h2>
            <Card className="border border-border/60 bg-card rounded-2xl divide-y divide-border/40">
              {actionSteps.slice(0, 4).map((step: any, i: number) => (
                <div key={step.id ?? i} className="flex items-start gap-3 px-5 py-3.5">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{step.title ?? step.step}</p>
                    {(step.detail ?? step.description) && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.detail ?? step.description}</p>
                    )}
                  </div>
                  {step.priority === "high" && (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-full px-1.5 py-0.5">
                      High
                    </span>
                  )}
                </div>
              ))}
              {actionSteps.length > 4 && (
                <div className="flex items-center gap-2 px-5 py-3.5 text-sm text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  {actionSteps.length - 4} more step{actionSteps.length - 4 !== 1 ? "s" : ""} — sign up to view all
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Deadlines */}
        {deadlines.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Deadlines
            </h2>
            <Card className="border border-border/60 bg-card rounded-2xl divide-y divide-border/40">
              {deadlines.slice(0, 3).map((dl: any, i: number) => (
                <div key={dl.id ?? i} className="flex items-start gap-3 px-5 py-3.5">
                  <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${dl.isHard ? "text-red-500" : "text-orange-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{dl.description}</p>
                    {dl.date && <p className="text-xs text-muted-foreground mt-0.5">{dl.date}</p>}
                  </div>
                  {dl.isHard && (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-full px-1.5 py-0.5">
                      Hard
                    </span>
                  )}
                </div>
              ))}
              {deadlines.length > 3 && (
                <div className="flex items-center gap-2 px-5 py-3.5 text-sm text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  {deadlines.length - 3} more deadline{deadlines.length - 3 !== 1 ? "s" : ""} — sign up to view all
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* High risks */}
        {highRisks.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Flag className="w-3.5 h-3.5" /> Key Risks
            </h2>
            <Card className="border border-red-200/60 dark:border-red-800/30 bg-red-50/50 dark:bg-red-950/10 rounded-2xl divide-y divide-red-200/40 dark:divide-red-800/20">
              {highRisks.slice(0, 2).map((risk: any, i: number) => (
                <div key={risk.id ?? i} className="flex items-start gap-3 px-5 py-3.5">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">{risk.title ?? risk.risk}</p>
                    {(risk.detail ?? risk.description) && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{risk.detail ?? risk.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>
        )}

        {/* Sign-up CTA */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <SignUpCTA />
        </motion.div>

      </div>
    </>
  )
}
