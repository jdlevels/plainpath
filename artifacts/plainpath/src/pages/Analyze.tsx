import { useEffect, useState } from "react"
import { useLocation, useSearch } from "wouter"
import { useGetDemoDocument, useUpdateChecklist } from "@workspace/api-client-react"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { motion, AnimatePresence } from "framer-motion"
import * as Tabs from "@radix-ui/react-tabs"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Loader2, FileText, ListTodo, Calendar, AlertTriangle,
  Printer, ArrowLeft, CheckCircle2, AlertCircle, XCircle,
  ArrowRight, ShieldCheck, Clock, TrendingUp
} from "lucide-react"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge"
import { EvidenceTooltip } from "@/components/shared/EvidenceTooltip"
import type { DocumentAnalysis } from "@workspace/api-client-react"
import { triggerPrint } from "@/lib/print"
import { isNative } from "@/lib/platform"

const TABS = [
  { id: "summary",   label: "Overview",       icon: FileText       },
  { id: "missing",   label: "What's Missing", icon: XCircle        },
  { id: "checklist", label: "Checklist",      icon: ListTodo,      countKey: "actionSteps"       },
  { id: "documents", label: "Required Docs",  icon: ShieldCheck,   countKey: "requiredDocuments" },
  { id: "deadlines", label: "Deadlines",      icon: Calendar,      countKey: "deadlines"         },
  { id: "risks",     label: "Risks & Notes",  icon: AlertTriangle                                },
]

export default function Analyze() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const demoId = new URLSearchParams(searchString).get("demo") as string | null

  const { analysis, documentTypeHint, setAnalysis, updateActionStep, updateRequiredDoc } = useAnalysisContext()
  const [activeTab, setActiveTab] = useState("checklist")

  const { data: demoData, isLoading, error: demoError } = useGetDemoDocument(
    demoId as any,
    { query: { enabled: !!demoId && !analysis } }
  )
  const { mutate: updateChecklist } = useUpdateChecklist()

  useEffect(() => { if (demoData?.analysis && !analysis) setAnalysis(demoData.analysis) }, [demoData, analysis, setAnalysis])
  useEffect(() => { if (!demoId && !analysis) setLocation("/import") }, [demoId, analysis, setLocation])

  if (isLoading || (!analysis && demoId)) return <LoadingScreen />
  if (demoError) return <ErrorScreen onBack={() => setLocation("/import")} />
  if (!analysis) return null

  const totalItems = analysis.actionSteps.length + analysis.requiredDocuments.length
  const doneItems = analysis.actionSteps.filter(s => s.completed).length + analysis.requiredDocuments.filter(d => d.obtained).length
  const progress = totalItems === 0 ? 100 : Math.round((doneItems / totalItems) * 100)

  const handleActionToggle = (id: string, completed: boolean) => {
    updateActionStep(id, completed)
    updateChecklist({ data: { itemId: id, itemType: "actionStep", completed } })
  }
  const handleDocToggle = (id: string, obtained: boolean) => {
    updateRequiredDoc(id, obtained)
    updateChecklist({ data: { itemId: id, itemType: "requiredDocument", completed: obtained } })
  }

  const hardDeadlines = analysis.deadlines.filter(d => d.isHard)
  const highRisks = analysis.risks.filter(r => r.severity === "high")
  const incompleteHigh = analysis.actionSteps.filter(s => s.priority === "high" && !s.completed)

  // Missing count badge for the tab
  const missingCount = incompleteHigh.length + analysis.requiredDocuments.filter(d => d.required && !d.obtained).length

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom) + 6rem)" }}>

      {/* ── Sticky header ───────────────────────────── */}
      <div className="no-print bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 sm:py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/import")}
              style={{ touchAction: "manipulation" }}
              className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-secondary active:bg-secondary rounded-xl transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                {documentTypeHint && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded-md">
                    {documentTypeHint}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{analysis.documentType}</span>
              </div>
              <h1 className="text-base font-bold truncate text-foreground leading-tight">{analysis.title}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="hidden sm:block text-right">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Progress</span>
                  </div>
                  <span className="text-xs font-bold text-foreground tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 w-32" />
              </div>
              <div className="sm:hidden flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground tabular-nums">{progress}%</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                title={isNative() ? "PDF export coming soon on mobile" : "Print this action plan"}
                className="gap-1.5 bg-card text-xs h-8 border-border/60"
                onClick={() => triggerPrint()}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isNative() ? "PDF soon" : "Print"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── At-a-glance strip ───────────────────────── */}
        <div className="no-print mt-4 sm:mt-6 mb-5 sm:mb-7">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5">
            <StatPill label="Steps" value={analysis.actionSteps.length} onClick={() => setActiveTab("checklist")} />
            <StatPill label="Docs" value={analysis.requiredDocuments.length} onClick={() => setActiveTab("documents")} />
            <StatPill label="Deadlines" value={hardDeadlines.length} warn={hardDeadlines.length > 0} onClick={() => setActiveTab("deadlines")} />
            <StatPill label="Risks" value={highRisks.length} warn={highRisks.length > 0} onClick={() => setActiveTab("risks")} />
            <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2">
              <ConfidenceBadge level={analysis.overallConfidence} />
              <span className="text-xs text-muted-foreground hidden sm:inline">overall confidence</span>
            </div>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────── */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="no-print flex overflow-x-auto hide-scrollbar gap-0.5 p-1 bg-card border border-border/40 rounded-2xl shadow-sm mb-4 sm:mb-6 scroll-smooth">
            {TABS.map((tab) => {
              const count = (tab as any).countKey ? (analysis as any)[(tab as any).countKey]?.length : null
              const isMissing = tab.id === "missing"
              return (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  style={{ touchAction: "manipulation" }}
                  className={`relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap outline-none flex-shrink-0 min-h-[44px] ${
                    activeTab === tab.id
                      ? "bg-foreground text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {count != null && count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-border/50 text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                  {isMissing && missingCount > 0 && activeTab !== "missing" && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                      {missingCount > 9 ? "9+" : missingCount}
                    </span>
                  )}
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>

          {/* ── Content pane ────────────────────────────── */}
          <div className="bg-card rounded-3xl border border-border/30 shadow-lg shadow-black/[0.04] dark:shadow-black/20 overflow-hidden min-h-[400px] sm:min-h-[540px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.14 }}
                className="p-4 sm:p-7 md:p-10"
              >

                {activeTab === "summary"   && <SummaryTab   analysis={analysis} onTabChange={setActiveTab} />}
                {activeTab === "missing"   && <WhatsMissingTab analysis={analysis} onActionToggle={handleActionToggle} onDocToggle={handleDocToggle} onTabChange={setActiveTab} />}
                {activeTab === "checklist" && <ChecklistTab  analysis={analysis} onToggle={handleActionToggle} />}
                {activeTab === "documents" && <DocumentsTab  analysis={analysis} onToggle={handleDocToggle} />}
                {activeTab === "deadlines" && <DeadlinesTab  analysis={analysis} />}
                {activeTab === "risks"     && <RisksTab      analysis={analysis} />}

              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs.Root>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   STAT PILL
──────────────────────────────────────────────── */
function StatPill({ label, value, warn = false, onClick }: { label: string; value: number; warn?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ touchAction: "manipulation" }}
      className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all hover:shadow-sm flex-shrink-0 min-h-[40px] ${
        warn && value > 0
          ? "bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-900/40 text-red-700 dark:text-red-400 hover:border-red-300 dark:hover:border-red-800"
          : "bg-card border-border/50 text-foreground hover:border-primary/30"
      }`}
    >
      <span className="text-lg font-bold font-display tabular-nums">{value}</span>
      <span className={`text-xs font-medium ${warn && value > 0 ? "text-red-600/70 dark:text-red-400/80" : "text-muted-foreground"}`}>{label}</span>
    </button>
  )
}

/* ────────────────────────────────────────────────
   SUMMARY TAB
──────────────────────────────────────────────── */
function SummaryTab({ analysis, onTabChange }: { analysis: DocumentAnalysis; onTabChange: (t: string) => void }) {
  const highPriority = analysis.actionSteps.filter(s => s.priority === "high" && !s.completed)
  const hardDeadlines = analysis.deadlines.filter(d => d.isHard)
  const highRisks = analysis.risks.filter(r => r.severity === "high")

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-1">Document Overview</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-4">{analysis.documentType}</p>
        <p className="text-base text-foreground/80 leading-relaxed">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Action Steps",   value: analysis.actionSteps.length,        tab: "checklist",  warn: false },
          { label: "Required Docs",  value: analysis.requiredDocuments.length,   tab: "documents",  warn: false },
          { label: "Hard Deadlines", value: hardDeadlines.length,                tab: "deadlines",  warn: true  },
        ].map(({ label, value, tab, warn }) => (
          <button key={tab} onClick={() => onTabChange(tab)} style={{ touchAction: "manipulation" }} className="text-left group">
            <div className={`p-2.5 sm:p-4 rounded-2xl border transition-all group-hover:shadow-md ${warn ? "bg-red-50/60 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/40 group-hover:border-red-300" : "bg-secondary/30 border-transparent group-hover:border-primary/20"}`}>
              <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1 sm:mb-2 ${warn ? "text-red-600/70 dark:text-red-400/80" : "text-muted-foreground"}`}>{label}</p>
              <p className={`text-2xl sm:text-3xl font-display font-bold ${warn ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{value}</p>
            </div>
          </button>
        ))}
      </div>

      {(highPriority.length > 0 || highRisks.length > 0) && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Needs immediate attention
          </h3>
          <div className="space-y-2">
            {highPriority.slice(0, 3).map(step => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.category}</p>
                </div>
                <button onClick={() => {}} className="text-xs text-primary font-semibold shrink-0 hover:underline">
                  Go →
                </button>
              </div>
            ))}
            {highRisks.slice(0, 2).map(risk => (
              <div key={risk.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/40">
                <XCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{risk.title}</p>
                  <p className="text-xs text-muted-foreground">High severity risk</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.followUpQuestions.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Needs your input</h3>
          <div className="space-y-2">
            {analysis.followUpQuestions.map(q => (
              <div key={q.id} className="flex gap-3 p-3.5 rounded-xl border border-border/50 bg-secondary/20">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{q.question}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 italic">{q.context}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────
   WHAT'S MISSING TAB
──────────────────────────────────────────────── */
function WhatsMissingTab({
  analysis, onActionToggle, onDocToggle, onTabChange,
}: {
  analysis: DocumentAnalysis
  onActionToggle: (id: string, done: boolean) => void
  onDocToggle: (id: string, done: boolean) => void
  onTabChange: (t: string) => void
}) {
  const pendingHigh = analysis.actionSteps.filter(s => s.priority === "high" && !s.completed)
  const pendingMed  = analysis.actionSteps.filter(s => s.priority === "medium" && !s.completed)
  const pendingDocs = analysis.requiredDocuments.filter(d => d.required && !d.obtained)
  const hardDls     = analysis.deadlines.filter(d => d.isHard)
  const highRisks   = analysis.risks.filter(r => r.severity === "high")

  const totalBlocking = pendingHigh.length + pendingDocs.length
  const allDone = totalBlocking === 0 && pendingMed.length === 0

  const nextAction = pendingHigh[0] ?? null

  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-200 dark:border-emerald-900 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">All clear</h2>
        <p className="text-muted-foreground max-w-sm">Every required step and document has been checked off. You're ready to proceed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">

      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">What's Missing</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {totalBlocking} blocking item{totalBlocking !== 1 ? "s" : ""} must be resolved before you can proceed.
        </p>
      </div>

      {/* ── Next Best Action spotlight ─────────────── */}
      {nextAction && (
        <div className="rounded-2xl bg-primary/5 border border-primary/20 overflow-hidden">
          <div className="px-5 py-3 bg-primary/10 border-b border-primary/15 flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Next best action</span>
          </div>
          <div className="p-5 flex items-start gap-4">
            <div className="mt-0.5">
              <Checkbox
                checked={nextAction.completed}
                onCheckedChange={(c) => onActionToggle(nextAction.id, c === true)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="font-bold text-foreground text-base leading-snug">{nextAction.title}</h3>
                <PriorityBadge level={nextAction.priority} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">{nextAction.description}</p>
              {nextAction.sourceEvidence && (
                <EvidenceTooltip text={nextAction.sourceEvidence} />
              )}
            </div>
          </div>
          {pendingHigh.length > 1 && (
            <div className="px-5 pb-3.5">
              <button onClick={() => onTabChange("checklist")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                +{pendingHigh.length - 1} more blocking step{pendingHigh.length - 1 !== 1 ? "s" : ""} in Checklist <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Blocking steps (remaining) ────────────── */}
      {pendingHigh.length > 1 && (
        <MissingSection title="Blocking — must complete first" badge={pendingHigh.length} badgeColor="red" icon={<XCircle className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {pendingHigh.slice(1).map(step => (
              <ActionStepRow key={step.id} step={step} onToggle={onActionToggle} compact />
            ))}
          </div>
        </MissingSection>
      )}

      {/* ── Required docs not obtained ────────────── */}
      {pendingDocs.length > 0 && (
        <MissingSection title="Documents not yet gathered" badge={pendingDocs.length} badgeColor="amber" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pendingDocs.map(doc => <DocRow key={doc.id} doc={doc} onToggle={onDocToggle} compact />)}
          </div>
        </MissingSection>
      )}

      {/* ── Hard deadlines ────────────────────────── */}
      {hardDls.length > 0 && (
        <MissingSection title="Hard deadlines" icon={<Calendar className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {hardDls.map(dl => (
              <div key={dl.id} className="flex gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/40">
                <Clock className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-foreground">{dl.title}</p>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-0.5">{dl.date}</p>
                  <p className="text-xs text-muted-foreground mt-1">{dl.description}</p>
                </div>
              </div>
            ))}
          </div>
        </MissingSection>
      )}

      {/* ── High risks ────────────────────────────── */}
      {highRisks.length > 0 && (
        <MissingSection title="High-severity risks" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {highRisks.map(risk => (
              <div key={risk.id} className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/40">
                <p className="font-bold text-sm text-foreground mb-1">{risk.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{risk.description}</p>
              </div>
            ))}
          </div>
        </MissingSection>
      )}

      {/* ── Medium-priority pending ───────────────── */}
      {pendingMed.length > 0 && (
        <MissingSection title="Also pending (medium priority)" badge={pendingMed.length} icon={<ListTodo className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {pendingMed.map(step => <ActionStepRow key={step.id} step={step} onToggle={onActionToggle} compact />)}
          </div>
        </MissingSection>
      )}

    </div>
  )
}

/* ────────────────────────────────────────────────
   CHECKLIST TAB
──────────────────────────────────────────────── */
function ChecklistTab({ analysis, onToggle }: { analysis: DocumentAnalysis; onToggle: (id: string, done: boolean) => void }) {
  const remaining = analysis.actionSteps.filter(s => !s.completed).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Action Steps</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {remaining === 0 ? "All steps complete." : `${remaining} of ${analysis.actionSteps.length} remaining — check off items as you complete them`}
        </p>
      </div>
      {analysis.actionSteps.length === 0
        ? <EmptyState icon={CheckCircle2} title="No action steps found" desc="This document doesn't appear to require specific actions." />
        : <div className="space-y-2.5">
            {analysis.actionSteps.map((step, i) => (
              <ActionStepRow key={step.id} step={step} index={i + 1} onToggle={onToggle} />
            ))}
          </div>
      }
    </div>
  )
}

/* ────────────────────────────────────────────────
   DOCUMENTS TAB
──────────────────────────────────────────────── */
function DocumentsTab({ analysis, onToggle }: { analysis: DocumentAnalysis; onToggle: (id: string, done: boolean) => void }) {
  const remaining = analysis.requiredDocuments.filter(d => !d.obtained).length
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Required Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {remaining === 0 ? "All documents obtained." : `${remaining} of ${analysis.requiredDocuments.length} still needed — gather these before submitting`}
        </p>
      </div>
      {analysis.requiredDocuments.length === 0
        ? <EmptyState icon={ShieldCheck} title="No documents required" desc="No additional files are needed for this document." />
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.requiredDocuments.map(doc => <DocRow key={doc.id} doc={doc} onToggle={onToggle} />)}
          </div>
      }
    </div>
  )
}

/* ────────────────────────────────────────────────
   DEADLINES TAB
──────────────────────────────────────────────── */
function DeadlinesTab({ analysis }: { analysis: DocumentAnalysis }) {
  const hardCount = analysis.deadlines.filter(d => d.isHard).length
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Timeline & Deadlines</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {hardCount > 0 ? `${hardCount} hard deadline${hardCount !== 1 ? "s" : ""} — missing these may disqualify your submission` : "No hard deadlines identified — treat all dates as approximate"}
        </p>
      </div>
      {analysis.deadlines.length === 0
        ? <EmptyState icon={Calendar} title="No deadlines found" desc="No specific dates were mentioned in this document." />
        : <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[1.35rem] top-4 bottom-4 w-px bg-gradient-to-b from-border via-border to-transparent" />
            <div className="space-y-3">
              {analysis.deadlines.map((dl) => (
                <div key={dl.id} className="flex gap-3 sm:gap-4">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 mt-2 z-10 ${
                    dl.isHard ? "bg-red-50 dark:bg-red-950/50 border-red-400 dark:border-red-700" : "bg-card border-border"
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${dl.isHard ? "bg-red-400" : "bg-muted-foreground/40"}`} />
                  </div>
                  <div className={`flex-1 p-4 rounded-2xl border mb-1 ${dl.isHard ? "bg-red-50/60 dark:bg-red-950/30 border-red-200/60 dark:border-red-900/40" : "bg-card border-border/50 shadow-sm"}`}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p className={`text-sm font-bold ${dl.isHard ? "text-red-700 dark:text-red-400" : "text-primary"}`}>{dl.date}</p>
                        <h4 className="font-bold text-foreground">{dl.title}</h4>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {dl.isHard && <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">Hard</Badge>}
                        <ConfidenceBadge level={dl.confidence} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2.5">{dl.description}</p>
                    <EvidenceTooltip text={dl.sourceEvidence} />
                  </div>
                </div>
              ))}
            </div>
          </div>
      }
    </div>
  )
}

/* ────────────────────────────────────────────────
   RISKS TAB
──────────────────────────────────────────────── */
function RisksTab({ analysis }: { analysis: DocumentAnalysis }) {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Risks & Warnings</h2>
        <p className="text-sm text-muted-foreground mt-1">Potential issues that could delay, block, or invalidate your submission</p>
      </div>

      {analysis.risks.length === 0
        ? <EmptyState icon={AlertTriangle} title="No major risks detected" desc="No significant risks were identified in this document." />
        : <div className="space-y-3">
            {analysis.risks.map((risk) => {
              const isHigh = risk.severity === "high"
              return (
                <div key={risk.id} className={`rounded-2xl border p-5 ${isHigh ? "bg-red-50/60 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/40" : "bg-card border-border/50 shadow-sm"}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isHigh ? "bg-red-100 dark:bg-red-950/60" : "bg-secondary"}`}>
                        <AlertTriangle className={`w-4 h-4 ${isHigh ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground leading-snug">{risk.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{risk.description}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                      isHigh ? "bg-red-100 dark:bg-red-950/60 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400"
                      : risk.severity === "medium" ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400"
                      : "bg-secondary border-border text-muted-foreground"
                    }`}>
                      {risk.severity}
                    </span>
                  </div>
                  {risk.sourceEvidence && (
                    <div className="mt-3 pl-11">
                      <EvidenceTooltip text={risk.sourceEvidence} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      }

      {analysis.followUpQuestions.length > 0 && (
        <div>
          <h2 className="text-xl font-display font-bold mb-1">Clarifications Needed</h2>
          <p className="text-sm text-muted-foreground mb-5">These ambiguous areas may affect which steps or requirements apply to your situation.</p>
          <div className="space-y-2.5">
            {analysis.followUpQuestions.map(q => (
              <div key={q.id} className="flex gap-3 p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/30">
                <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{q.question}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">{q.context}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────
   SHARED SUB-COMPONENTS
──────────────────────────────────────────────── */

function MissingSection({
  title, badge, badgeColor = "default", icon, children,
}: {
  title: string
  badge?: number
  badgeColor?: "red" | "amber" | "default"
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  const badgeColors = {
    red:     "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400",
    amber:   "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
    default: "bg-secondary text-muted-foreground",
  }
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted-foreground/50">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
        {badge != null && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColors[badgeColor]}`}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  )
}

const PRIORITY_STYLES = {
  high:   { bar: "priority-bar-high", bg: "bg-red-50/30"   },
  medium: { bar: "priority-bar-med",  bg: "bg-amber-50/20" },
  low:    { bar: "priority-bar-low",  bg: ""               },
} as const

function ActionStepRow({
  step, index, onToggle, compact = false,
}: {
  step: DocumentAnalysis["actionSteps"][0]
  index?: number
  onToggle: (id: string, done: boolean) => void
  compact?: boolean
}) {
  const style = PRIORITY_STYLES[step.priority as keyof typeof PRIORITY_STYLES] ?? PRIORITY_STYLES.low

  return (
    <div className={`group flex items-start gap-3.5 rounded-xl border transition-all ${
      compact ? "p-3" : "p-4"
    } ${
      step.completed
        ? "bg-secondary/20 border-border/20 opacity-55 priority-bar-low"
        : `${style.bar} ${style.bg} bg-card border-border/40 hover:border-primary/20 hover:shadow-sm`
    }`}>
      <div className="shrink-0 mt-0.5">
        <Checkbox checked={step.completed} onCheckedChange={(c) => onToggle(step.id, c === true)} />
      </div>

      {index !== undefined && !compact && (
        <span className="text-[11px] text-muted-foreground/35 font-bold font-mono mt-0.5 shrink-0 w-4 text-right select-none">{index}</span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
          <h3 className={`font-semibold leading-snug ${
            step.completed ? "line-through text-muted-foreground/60" : "text-foreground"
          } ${compact ? "text-sm" : "text-base"}`}>
            {step.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <PriorityBadge level={step.priority} />
            <ConfidenceBadge level={step.confidence} showLabel={false} />
          </div>
        </div>

        {!compact && (
          <p className="text-sm text-muted-foreground/80 leading-relaxed mb-2.5">{step.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {step.category && (
            <Badge variant="outline" className="text-[10px] font-semibold bg-secondary/50 border-0 text-muted-foreground">{step.category}</Badge>
          )}
          {step.sourceEvidence && !compact && (
            <div className="flex-1 min-w-0">
              <EvidenceTooltip text={step.sourceEvidence} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DocRow({
  doc, onToggle, compact = false,
}: {
  doc: DocumentAnalysis["requiredDocuments"][0]
  onToggle: (id: string, done: boolean) => void
  compact?: boolean
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border transition-all ${compact ? "p-3" : "p-4"} ${
      doc.obtained
        ? "bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200/40 dark:border-emerald-900/40 opacity-60"
        : "bg-card border-border/40 hover:shadow-sm hover:border-primary/20"
    }`}>
      <div className="shrink-0 mt-0.5">
        <Checkbox checked={doc.obtained} onCheckedChange={(c) => onToggle(doc.id, c === true)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`font-semibold ${compact ? "text-sm" : "text-base"} ${doc.obtained ? "line-through text-muted-foreground/60" : "text-foreground"} leading-snug`}>
            {doc.name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {!doc.required && <Badge variant="secondary" className="text-[10px]">Optional</Badge>}
            <ConfidenceBadge level={doc.confidence} showLabel={false} />
          </div>
        </div>
        {!compact && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-2.5">{doc.description}</p>
        )}
        {doc.sourceEvidence && !compact && (
          <EvidenceTooltip text={doc.sourceEvidence} />
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/30 rounded-2xl bg-secondary/10">
      <Icon className="w-10 h-10 text-muted-foreground/20 mb-3" />
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Skeleton header */}
      <div className="bg-background/95 border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-32 rounded-full bg-secondary animate-pulse" />
            <div className="h-4 w-56 rounded-full bg-secondary animate-pulse" />
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-3 w-24 rounded-full bg-secondary animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-secondary animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-5 sm:space-y-6">
        {/* Stat pills skeleton */}
        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar">
          {[80, 100, 110, 90].map((w, i) => (
            <div key={i} className="h-10 rounded-xl bg-card border border-border/30 animate-pulse flex-shrink-0" style={{ width: w }} />
          ))}
        </div>

        {/* Tab bar skeleton */}
        <div className="h-12 sm:h-14 rounded-2xl bg-card border border-border/30 animate-pulse" />

        {/* Content skeleton */}
        <div className="bg-card rounded-3xl border border-border/20 p-4 sm:p-10 space-y-5">
          <div className="h-8 w-40 rounded-lg bg-secondary animate-pulse" />
          <div className="h-3 w-64 rounded-full bg-secondary animate-pulse" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="priority-bar-high h-20 rounded-xl bg-secondary/30 animate-pulse border border-border/20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Card className="p-10 rounded-2xl text-center max-w-sm shadow-xl">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Could not load document</h2>
        <p className="text-muted-foreground text-sm mb-6">The requested demo failed to load. Please try again.</p>
        <Button onClick={onBack} className="w-full">Go Back</Button>
      </Card>
    </div>
  )
}
