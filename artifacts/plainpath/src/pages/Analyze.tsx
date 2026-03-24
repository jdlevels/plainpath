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
  Printer, ArrowLeft, CheckCircle2, AlertCircle, XCircle
} from "lucide-react"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge"
import { EvidenceTooltip } from "@/components/shared/EvidenceTooltip"
import type { DocumentAnalysis } from "@workspace/api-client-react"

const TABS = [
  { id: "summary",   label: "Summary",       icon: FileText,       countKey: null },
  { id: "missing",   label: "What's Missing", icon: XCircle,       countKey: null },
  { id: "checklist", label: "Checklist",      icon: ListTodo,      countKey: "actionSteps" },
  { id: "documents", label: "Required Docs",  icon: FileText,      countKey: "requiredDocuments" },
  { id: "deadlines", label: "Deadlines",      icon: Calendar,      countKey: "deadlines" },
  { id: "risks",     label: "Risks & Notes",  icon: AlertTriangle, countKey: null },
]

export default function Analyze() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const demoId = new URLSearchParams(searchString).get("demo") as string | null

  const { analysis, setAnalysis, updateActionStep, updateRequiredDoc } = useAnalysisContext()
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

  const risksAndQCount = analysis.risks.length + analysis.followUpQuestions.length

  return (
    <div className="min-h-screen bg-[#F8F7F4] pb-24">

      {/* Sticky header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-border/60 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/import")} className="p-2 hover:bg-secondary rounded-xl transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{analysis.documentType}</span>
                <span className="text-border">·</span>
                <ConfidenceBadge level={analysis.overallConfidence} />
              </div>
              <h1 className="text-base sm:text-lg font-bold font-display truncate text-foreground">{analysis.title}</h1>
            </div>

            <div className="hidden sm:flex items-center gap-5 shrink-0">
              <div className="text-right min-w-[140px]">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-primary tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 w-36" />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 bg-white text-xs h-8" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">

        {/* Stat pills */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { label: "Steps", val: analysis.actionSteps.length, accent: false },
            { label: "Documents", val: analysis.requiredDocuments.length, accent: false },
            { label: "Deadlines", val: analysis.deadlines.filter(d => d.isHard).length, accent: true },
            { label: "Risks", val: analysis.risks.filter(r => r.severity === "high").length, accent: true },
          ].map(({ label, val, accent }) => (
            <div key={label} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border ${accent && val > 0 ? "bg-destructive/8 border-destructive/20 text-destructive" : "bg-white border-border/50 text-foreground shadow-sm"}`}>
              <span className="text-base font-bold tabular-nums">{val}</span>
              <span className={`${accent && val > 0 ? "text-destructive/70" : "text-muted-foreground"} font-medium`}>{label}</span>
            </div>
          ))}
        </div>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          {/* Tab bar */}
          <Tabs.List className="flex overflow-x-auto hide-scrollbar gap-0.5 p-1 bg-white border border-border/40 rounded-2xl shadow-sm mb-7">
            {TABS.map((tab) => {
              const count = tab.countKey ? (analysis as any)[tab.countKey]?.length : null
              return (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap outline-none flex-shrink-0 ${
                    activeTab === tab.id
                      ? "bg-foreground text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {count != null && count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-border/60 text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>

          {/* Content pane */}
          <div className="bg-white rounded-3xl border border-border/40 shadow-lg shadow-black/[0.04] overflow-hidden min-h-[540px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="p-7 md:p-10"
              >

                {activeTab === "summary" && <SummaryTab analysis={analysis} onTabChange={setActiveTab} />}

                {activeTab === "missing" && (
                  <WhatsMissingTab analysis={analysis} onActionToggle={handleActionToggle} onDocToggle={handleDocToggle} />
                )}

                {activeTab === "checklist" && (
                  <div className="space-y-6">
                    <SectionHeader title="Action Steps" subtitle={`${analysis.actionSteps.filter(s => !s.completed).length} remaining · check off items as you complete them`} />
                    {analysis.actionSteps.length === 0
                      ? <EmptyState icon={CheckCircle2} title="No action steps found" desc="This document doesn't appear to require specific actions." />
                      : <div className="space-y-2.5">
                          {analysis.actionSteps.map((step, i) => (
                            <ActionStepRow key={step.id} step={step} index={i + 1} onToggle={handleActionToggle} />
                          ))}
                        </div>
                    }
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="space-y-6">
                    <SectionHeader title="Required Documents" subtitle={`${analysis.requiredDocuments.filter(d => !d.obtained).length} still needed — gather these before submitting`} />
                    {analysis.requiredDocuments.length === 0
                      ? <EmptyState icon={FileText} title="No documents required" desc="No additional files are needed for this document." />
                      : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analysis.requiredDocuments.map((doc) => (
                            <DocRow key={doc.id} doc={doc} onToggle={handleDocToggle} />
                          ))}
                        </div>
                    }
                  </div>
                )}

                {activeTab === "deadlines" && (
                  <div className="space-y-6">
                    <SectionHeader title="Timeline & Deadlines" subtitle="Dates you cannot miss, extracted from the source document" />
                    {analysis.deadlines.length === 0
                      ? <EmptyState icon={Calendar} title="No deadlines found" desc="No specific dates were mentioned in this document." />
                      : <div className="space-y-3">
                          {analysis.deadlines.map((dl) => (
                            <div key={dl.id} className={`p-5 rounded-2xl border flex gap-5 ${dl.isHard ? "bg-destructive/5 border-destructive/20" : "bg-secondary/30 border-border/50"}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${dl.isHard ? "bg-destructive/10" : "bg-secondary"}`}>
                                <Calendar className={`w-5 h-5 ${dl.isHard ? "text-destructive" : "text-muted-foreground"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-1">
                                  <div>
                                    <p className={`font-bold text-sm ${dl.isHard ? "text-destructive" : "text-primary"}`}>{dl.date}</p>
                                    <h4 className="font-bold text-foreground">{dl.title}</h4>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    {dl.isHard && <Badge variant="destructive" className="text-[10px] uppercase tracking-wide">Hard</Badge>}
                                    <ConfidenceBadge level={dl.confidence} />
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{dl.description}</p>
                                <EvidenceTooltip text={dl.sourceEvidence} />
                              </div>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                )}

                {activeTab === "risks" && (
                  <div className="space-y-10">
                    <div>
                      <SectionHeader title="Risks & Warnings" subtitle="Potential issues that could delay or block your submission" />
                      {analysis.risks.length === 0
                        ? <EmptyState icon={AlertTriangle} title="No major risks detected" desc="No significant risks were found in this document." />
                        : <div className="grid gap-3 sm:grid-cols-2">
                            {analysis.risks.map((risk) => (
                              <div key={risk.id} className={`p-5 rounded-2xl border ${risk.severity === "high" ? "bg-destructive/5 border-destructive/20" : "bg-white border-border/50 shadow-sm"}`}>
                                <div className="flex justify-between items-start gap-3 mb-2">
                                  <h3 className="font-bold text-foreground leading-snug">{risk.title}</h3>
                                  <Badge variant={risk.severity === "high" ? "destructive" : "secondary"} className="uppercase text-[9px] tracking-wide shrink-0">
                                    {risk.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                                <EvidenceTooltip text={risk.sourceEvidence} />
                              </div>
                            ))}
                          </div>
                      }
                    </div>

                    {analysis.followUpQuestions.length > 0 && (
                      <div>
                        <SectionHeader title="Clarifications Needed" subtitle="Ambiguous areas that may affect which steps apply to your situation" />
                        <div className="space-y-2.5">
                          {analysis.followUpQuestions.map((q) => (
                            <div key={q.id} className="flex gap-3 p-4 rounded-xl border border-border/50 bg-secondary/30">
                              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="font-semibold text-sm text-foreground mb-1">{q.question}</p>
                                <p className="text-xs text-muted-foreground italic">{q.context}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs.Root>
      </div>
    </div>
  )
}

/* ─── Sub-components ────────────────────────────── */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold font-display">{title}</h2>
      {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
    </div>
  )
}

function SummaryTab({ analysis, onTabChange }: { analysis: DocumentAnalysis; onTabChange: (t: string) => void }) {
  const highPriority = analysis.actionSteps.filter(s => s.priority === "high" && !s.completed)
  const hardDeadlines = analysis.deadlines.filter(d => d.isHard)
  const highRisks = analysis.risks.filter(r => r.severity === "high")

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold font-display mb-3">Document Overview</h2>
        <p className="text-muted-foreground leading-relaxed text-base">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Action Steps", val: analysis.actionSteps.length, tab: "checklist", accent: false },
          { label: "Required Docs", val: analysis.requiredDocuments.length, tab: "documents", accent: false },
          { label: "Hard Deadlines", val: hardDeadlines.length, tab: "deadlines", accent: true },
        ].map(({ label, val, tab, accent }) => (
          <button key={tab} onClick={() => onTabChange(tab)} className="text-left group">
            <div className={`p-4 rounded-2xl border transition-all group-hover:shadow-md ${accent ? "bg-destructive/8 border-destructive/20" : "bg-secondary/40 border-transparent group-hover:border-primary/20"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${accent ? "text-destructive/70" : "text-muted-foreground"}`}>{label}</p>
              <p className={`text-3xl font-display font-bold ${accent ? "text-destructive" : "text-foreground"}`}>{val}</p>
            </div>
          </button>
        ))}
      </div>

      {(highPriority.length > 0 || highRisks.length > 0) && (
        <div>
          <h3 className="font-bold text-base mb-3 flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4" /> Needs immediate attention
          </h3>
          <div className="space-y-2">
            {highPriority.slice(0, 3).map(step => (
              <div key={step.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
                <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center mt-0.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.category}</p>
                </div>
              </div>
            ))}
            {highRisks.slice(0, 2).map(risk => (
              <div key={risk.id} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{risk.title}</p>
                  <p className="text-xs text-muted-foreground">High severity risk</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function WhatsMissingTab({
  analysis, onActionToggle, onDocToggle,
}: {
  analysis: DocumentAnalysis
  onActionToggle: (id: string, done: boolean) => void
  onDocToggle: (id: string, done: boolean) => void
}) {
  const pendingHigh = analysis.actionSteps.filter(s => s.priority === "high" && !s.completed)
  const pendingMed  = analysis.actionSteps.filter(s => s.priority === "medium" && !s.completed)
  const pendingDocs = analysis.requiredDocuments.filter(d => d.required && !d.obtained)
  const hardDls     = analysis.deadlines.filter(d => d.isHard)
  const highRisks   = analysis.risks.filter(r => r.severity === "high")
  const totalBlocking = pendingHigh.length + pendingDocs.length
  const allDone = totalBlocking === 0 && pendingMed.length === 0

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold font-display">What's Missing</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {allDone
            ? "Everything is accounted for — you're ready to submit."
            : `${totalBlocking} blocking item${totalBlocking !== 1 ? "s" : ""} must be resolved before you can proceed.`}
        </p>
      </div>

      {allDone ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
          <h3 className="text-xl font-bold text-foreground">All clear</h3>
          <p className="text-muted-foreground mt-1">Every required step and document has been marked complete.</p>
        </div>
      ) : (
        <>
          {pendingHigh.length > 0 && (
            <MissingSection
              title="Blocking — must complete first"
              color="destructive"
              icon={<XCircle className="w-4 h-4" />}
            >
              <div className="space-y-2">
                {pendingHigh.map(step => <ActionStepRow key={step.id} step={step} onToggle={onActionToggle} compact />)}
              </div>
            </MissingSection>
          )}

          {pendingDocs.length > 0 && (
            <MissingSection
              title="Documents not yet obtained"
              color="amber"
              icon={<AlertCircle className="w-4 h-4" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {pendingDocs.map(doc => <DocRow key={doc.id} doc={doc} onToggle={onDocToggle} compact />)}
              </div>
            </MissingSection>
          )}

          {hardDls.length > 0 && (
            <MissingSection title="Hard deadlines" color="default" icon={<Calendar className="w-4 h-4" />}>
              <div className="space-y-2">
                {hardDls.map(dl => (
                  <div key={dl.id} className="flex gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                    <Calendar className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-foreground">{dl.title}</p>
                      <p className="text-xs text-destructive font-semibold">{dl.date}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{dl.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </MissingSection>
          )}

          {highRisks.length > 0 && (
            <MissingSection title="High-severity risks" color="default" icon={<AlertTriangle className="w-4 h-4" />}>
              <div className="space-y-2">
                {highRisks.map(risk => (
                  <div key={risk.id} className="p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                    <p className="font-bold text-sm">{risk.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
                  </div>
                ))}
              </div>
            </MissingSection>
          )}

          {pendingMed.length > 0 && (
            <MissingSection title="Also pending (medium priority)" color="default" icon={<ListTodo className="w-4 h-4" />}>
              <div className="space-y-2">
                {pendingMed.map(step => <ActionStepRow key={step.id} step={step} onToggle={onActionToggle} compact />)}
              </div>
            </MissingSection>
          )}
        </>
      )}
    </div>
  )
}

function MissingSection({
  title, color, icon, children,
}: {
  title: string; color: "destructive" | "amber" | "default"; icon: React.ReactNode; children: React.ReactNode
}) {
  const colors = {
    destructive: "text-destructive border-destructive/30",
    amber: "text-amber-600 border-amber-200",
    default: "text-muted-foreground border-border",
  }
  return (
    <div>
      <h3 className={`font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2 ${colors[color].split(" ")[0]}`}>
        {icon} {title}
      </h3>
      {children}
    </div>
  )
}

function ActionStepRow({
  step, index, onToggle, compact = false,
}: {
  step: DocumentAnalysis["actionSteps"][0]
  index?: number
  onToggle: (id: string, done: boolean) => void
  compact?: boolean
}) {
  const priorityBorder = {
    high: "border-l-red-400",
    medium: "border-l-amber-400",
    low: "border-l-border",
  }[step.priority] ?? "border-l-border"

  return (
    <div className={`group flex items-start gap-4 rounded-2xl border border-l-4 transition-all ${priorityBorder} ${
      compact ? "p-3" : "p-4"
    } ${
      step.completed
        ? "bg-secondary/30 border-border/30 border-l-border/30 opacity-60"
        : "bg-white border-border/50 hover:shadow-md hover:border-primary/20"
    }`}>
      <div className="mt-0.5 shrink-0">
        <Checkbox
          checked={step.completed}
          onCheckedChange={(c) => onToggle(step.id, c === true)}
        />
      </div>
      {index !== undefined && !compact && (
        <span className="text-muted-foreground/40 text-sm font-bold font-mono mt-0.5 shrink-0 w-5 text-right">{index}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1.5">
          <h3 className={`font-semibold leading-snug ${step.completed ? "line-through text-muted-foreground" : "text-foreground"} ${compact ? "text-sm" : "text-base"}`}>
            {step.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <PriorityBadge level={step.priority} />
            <ConfidenceBadge level={step.confidence} />
          </div>
        </div>
        {!compact && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{step.description}</p>
        )}
        <div className="flex items-center gap-2">
          {step.category && <Badge variant="outline" className="text-[10px] bg-secondary/40 border-0 font-semibold">{step.category}</Badge>}
          <EvidenceTooltip text={step.sourceEvidence} />
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
    <div className={`group flex items-start gap-3 rounded-2xl border transition-all ${compact ? "p-3" : "p-4"} ${
      doc.obtained
        ? "bg-emerald-50/60 border-emerald-200/60 opacity-70"
        : "bg-white border-border/50 hover:shadow-md"
    }`}>
      <div className="mt-0.5 shrink-0">
        <Checkbox
          checked={doc.obtained}
          onCheckedChange={(c) => onToggle(doc.id, c === true)}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`font-semibold ${compact ? "text-sm" : "text-base"} ${doc.obtained ? "line-through text-muted-foreground" : "text-foreground"} leading-snug`}>
            {doc.name}
          </h3>
          {!doc.required && <Badge variant="secondary" className="text-[10px] shrink-0">Optional</Badge>}
        </div>
        {!compact && <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{doc.description}</p>}
        <div className="flex items-center justify-between">
          <ConfidenceBadge level={doc.confidence} />
          <EvidenceTooltip text={doc.sourceEvidence} />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/40 rounded-2xl bg-secondary/20">
      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
        <Icon className="w-7 h-7 text-muted-foreground/30" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] gap-6">
      <div className="w-16 h-16 rounded-2xl bg-white border border-border shadow-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold">Loading analysis…</h2>
        <p className="text-muted-foreground text-sm mt-1">Extracting action items, deadlines, and risks.</p>
      </div>
    </div>
  )
}

function ErrorScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4]">
      <Card className="p-10 rounded-2xl text-center max-w-sm shadow-xl">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Couldn't load demo</h2>
        <p className="text-muted-foreground text-sm mb-6">The requested demo document failed to load. Please try again.</p>
        <Button onClick={onBack} className="w-full">Go Back</Button>
      </Card>
    </div>
  )
}
