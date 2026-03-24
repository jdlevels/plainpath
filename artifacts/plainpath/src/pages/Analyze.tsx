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

export default function Analyze() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const searchParams = new URLSearchParams(searchString)
  const demoId = searchParams.get("demo") as string | null

  const { analysis, setAnalysis, updateActionStep, updateRequiredDoc } = useAnalysisContext()
  const [activeTab, setActiveTab] = useState("checklist")

  const { data: demoData, isLoading: isLoadingDemo, error: demoError } = useGetDemoDocument(
    demoId as any,
    { query: { enabled: !!demoId && !analysis } }
  )

  const { mutate: updateChecklistServer } = useUpdateChecklist()

  useEffect(() => {
    if (demoData?.analysis && !analysis) setAnalysis(demoData.analysis)
  }, [demoData, analysis, setAnalysis])

  useEffect(() => {
    if (!demoId && !analysis) setLocation("/import")
  }, [demoId, analysis, setLocation])

  if (isLoadingDemo || (!analysis && demoId)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Loading analysis…</h2>
          <p className="text-muted-foreground mt-2">Extracting action items, deadlines, and risks.</p>
        </div>
      </div>
    )
  }

  if (demoError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4]">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Demo</h2>
          <p className="text-muted-foreground mb-6">We couldn't load the requested demo document.</p>
          <Button onClick={() => setLocation("/import")}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  const totalItems = analysis.actionSteps.length + analysis.requiredDocuments.length
  const completedItems =
    analysis.actionSteps.filter((s) => s.completed).length +
    analysis.requiredDocuments.filter((d) => d.obtained).length
  const progress = totalItems === 0 ? 100 : Math.round((completedItems / totalItems) * 100)

  const handleActionToggle = (id: string, completed: boolean) => {
    updateActionStep(id, completed)
    updateChecklistServer({ data: { itemId: id, itemType: "actionStep", completed } })
  }

  const handleDocToggle = (id: string, obtained: boolean) => {
    updateRequiredDoc(id, obtained)
    updateChecklistServer({ data: { itemId: id, itemType: "requiredDocument", completed: obtained } })
  }

  const tabs = [
    { id: "summary", label: "Summary", icon: FileText },
    { id: "missing", label: "What's Missing", icon: XCircle },
    { id: "checklist", label: "Checklist", icon: ListTodo, count: analysis.actionSteps.length },
    { id: "documents", label: "Required Docs", icon: FileText, count: analysis.requiredDocuments.length },
    { id: "deadlines", label: "Deadlines", icon: Calendar, count: analysis.deadlines.length },
    { id: "risks", label: "Risks & Notes", icon: AlertTriangle, count: analysis.risks.length + analysis.followUpQuestions.length },
  ]

  return (
    <div className="min-h-screen bg-[#F8F7F4] pb-24">
      {/* Sticky header */}
      <div className="bg-white border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/import")}
              className="p-2 hover:bg-secondary rounded-full transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold font-display truncate">{analysis.title}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="secondary" className="font-normal text-xs">{analysis.documentType}</Badge>
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <ConfidenceBadge level={analysis.overallConfidence} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:min-w-[240px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-muted-foreground">Completion</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex bg-white gap-2 shrink-0"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex overflow-x-auto hide-scrollbar gap-1 p-1 bg-white border border-border/50 rounded-2xl shadow-sm mb-8">
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap outline-none flex-shrink-0
                  ${activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? "bg-white/20" : "bg-border text-muted-foreground"}`}>
                    {tab.count}
                  </span>
                )}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-black/[0.03] border border-border/50 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >

                {/* SUMMARY */}
                {activeTab === "summary" && (
                  <SummaryTab analysis={analysis} onTabChange={setActiveTab} />
                )}

                {/* WHAT'S MISSING */}
                {activeTab === "missing" && (
                  <WhatssMissingTab analysis={analysis} onActionToggle={handleActionToggle} onDocToggle={handleDocToggle} />
                )}

                {/* CHECKLIST */}
                {activeTab === "checklist" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold font-display">Action Steps</h2>
                      <p className="text-muted-foreground mt-1">Check off items as you complete them.</p>
                    </div>
                    {analysis.actionSteps.length === 0 ? (
                      <EmptyState icon={CheckCircle2} title="No action steps found" desc="This document doesn't appear to require specific actions." />
                    ) : (
                      <div className="space-y-3">
                        {analysis.actionSteps.map((step) => (
                          <ActionStepRow key={step.id} step={step} onToggle={handleActionToggle} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* REQUIRED DOCS */}
                {activeTab === "documents" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold font-display">Required Documents</h2>
                      <p className="text-muted-foreground mt-1">Gather these before submitting.</p>
                    </div>
                    {analysis.requiredDocuments.length === 0 ? (
                      <EmptyState icon={FileText} title="No documents required" desc="You don't need to attach any additional files." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.requiredDocuments.map((doc) => (
                          <DocRow key={doc.id} doc={doc} onToggle={handleDocToggle} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DEADLINES */}
                {activeTab === "deadlines" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold font-display">Timeline & Deadlines</h2>
                      <p className="text-muted-foreground mt-1">Critical dates you cannot miss.</p>
                    </div>
                    {analysis.deadlines.length === 0 ? (
                      <EmptyState icon={Calendar} title="No deadlines found" desc="No specific dates were mentioned in this document." />
                    ) : (
                      <div className="space-y-4">
                        {analysis.deadlines.map((deadline) => (
                          <div
                            key={deadline.id}
                            className={`p-5 rounded-2xl border ${deadline.isHard ? "border-destructive/30 bg-destructive/5" : "border-border bg-white shadow-sm"}`}
                          >
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                                  <span className="font-bold text-primary">{deadline.date}</span>
                                  {deadline.isHard && <Badge variant="destructive" className="text-[10px]">Hard Deadline</Badge>}
                                </div>
                                <h4 className="font-bold text-foreground">{deadline.title}</h4>
                              </div>
                              <ConfidenceBadge level={deadline.confidence} />
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{deadline.description}</p>
                            <EvidenceTooltip text={deadline.sourceEvidence} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* RISKS & NOTES */}
                {activeTab === "risks" && (
                  <div className="space-y-12">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                        <h2 className="text-2xl font-bold font-display">Risks & Warnings</h2>
                      </div>
                      {analysis.risks.length === 0 ? (
                        <Card className="bg-secondary/30 p-6 text-center border-dashed">
                          <p className="text-muted-foreground">No major risks detected in this document.</p>
                        </Card>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {analysis.risks.map((risk) => (
                            <Card
                              key={risk.id}
                              className={`p-5 ${risk.severity === "high" ? "bg-destructive/5 border-destructive/25" : ""}`}
                            >
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <h3 className="font-bold text-foreground leading-snug">{risk.title}</h3>
                                <Badge
                                  variant={risk.severity === "high" ? "destructive" : "secondary"}
                                  className="uppercase text-[10px] shrink-0"
                                >
                                  {risk.severity} Risk
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                              <EvidenceTooltip text={risk.sourceEvidence} />
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {analysis.followUpQuestions.length > 0 && (
                      <div>
                        <div className="mb-6">
                          <h2 className="text-xl font-bold font-display">Clarifications Needed</h2>
                          <p className="text-sm text-muted-foreground mt-1">These ambiguous areas in the document may affect which steps apply to your situation.</p>
                        </div>
                        <div className="space-y-3">
                          {analysis.followUpQuestions.map((q) => (
                            <div key={q.id} className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                              <p className="font-semibold text-sm mb-1">{q.question}</p>
                              <p className="text-xs text-muted-foreground italic">{q.context}</p>
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

/* ─── Sub-components ─────────────────────────────────────── */

function SummaryTab({
  analysis,
  onTabChange,
}: {
  analysis: DocumentAnalysis
  onTabChange: (tab: string) => void
}) {
  const highPriority = analysis.actionSteps.filter((s) => s.priority === "high" && !s.completed)
  const hardDeadlines = analysis.deadlines.filter((d) => d.isHard)
  const highRisks = analysis.risks.filter((r) => r.severity === "high")

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold font-display mb-4">Document Summary</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => onTabChange("checklist")} className="text-left group">
          <Card className="p-4 bg-secondary/40 border-none shadow-none hover:bg-secondary/60 transition-colors">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Steps</p>
            <p className="text-3xl font-display font-bold text-foreground">{analysis.actionSteps.length}</p>
            <p className="text-xs text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View checklist →</p>
          </Card>
        </button>
        <button onClick={() => onTabChange("documents")} className="text-left group">
          <Card className="p-4 bg-secondary/40 border-none shadow-none hover:bg-secondary/60 transition-colors">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Required Docs</p>
            <p className="text-3xl font-display font-bold text-foreground">{analysis.requiredDocuments.length}</p>
            <p className="text-xs text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View docs →</p>
          </Card>
        </button>
        <button onClick={() => onTabChange("deadlines")} className="text-left group">
          <Card className="p-4 bg-destructive/10 border-none shadow-none hover:bg-destructive/15 transition-colors">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">Hard Deadlines</p>
            <p className="text-3xl font-display font-bold text-destructive">{hardDeadlines.length}</p>
            <p className="text-xs text-destructive mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View timeline →</p>
          </Card>
        </button>
      </div>

      {(highPriority.length > 0 || highRisks.length > 0) && (
        <div>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" /> Immediate attention needed
          </h3>
          <div className="space-y-2">
            {highPriority.slice(0, 3).map((step) => (
              <div key={step.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.category}</p>
                </div>
              </div>
            ))}
            {highRisks.slice(0, 2).map((risk) => (
              <div key={risk.id} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
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

function WhatssMissingTab({
  analysis,
  onActionToggle,
  onDocToggle,
}: {
  analysis: DocumentAnalysis
  onActionToggle: (id: string, completed: boolean) => void
  onDocToggle: (id: string, obtained: boolean) => void
}) {
  const pendingHighSteps = analysis.actionSteps.filter((s) => s.priority === "high" && !s.completed)
  const pendingMedSteps = analysis.actionSteps.filter((s) => s.priority === "medium" && !s.completed)
  const pendingDocs = analysis.requiredDocuments.filter((d) => d.required && !d.obtained)
  const hardDeadlines = analysis.deadlines.filter((d) => d.isHard)
  const highRisks = analysis.risks.filter((r) => r.severity === "high")

  const totalBlocking = pendingHighSteps.length + pendingDocs.length
  const allDone = totalBlocking === 0 && pendingMedSteps.length === 0

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold font-display">What's Missing</h2>
        <p className="text-muted-foreground mt-1">
          {allDone
            ? "Everything appears to be accounted for."
            : `${totalBlocking} blocking item${totalBlocking !== 1 ? "s" : ""} must be resolved before you can submit.`}
        </p>
      </div>

      {/* Blocking: high-priority steps not done */}
      {pendingHighSteps.length > 0 && (
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-destructive mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Blocking — must complete first
          </h3>
          <div className="space-y-2">
            {pendingHighSteps.map((step) => (
              <ActionStepRow key={step.id} step={step} onToggle={onActionToggle} compact />
            ))}
          </div>
        </div>
      )}

      {/* Required docs not obtained */}
      {pendingDocs.length > 0 && (
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Required documents not yet obtained
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingDocs.map((doc) => (
              <DocRow key={doc.id} doc={doc} onToggle={onDocToggle} compact />
            ))}
          </div>
        </div>
      )}

      {/* Hard deadlines */}
      {hardDeadlines.length > 0 && (
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Hard deadlines
          </h3>
          <div className="space-y-2">
            {hardDeadlines.map((dl) => (
              <div key={dl.id} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <Calendar className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{dl.title}</p>
                  <p className="text-xs text-destructive font-medium">{dl.date}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{dl.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High risks */}
      {highRisks.length > 0 && (
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> High-severity risks
          </h3>
          <div className="space-y-2">
            {highRisks.map((risk) => (
              <div key={risk.id} className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="font-semibold text-sm text-foreground">{risk.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending medium-priority steps */}
      {pendingMedSteps.length > 0 && (
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <ListTodo className="w-4 h-4" /> Also incomplete (medium priority)
          </h3>
          <div className="space-y-2">
            {pendingMedSteps.map((step) => (
              <ActionStepRow key={step.id} step={step} onToggle={onActionToggle} compact />
            ))}
          </div>
        </div>
      )}

      {allDone && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-foreground">All items accounted for</h3>
          <p className="text-muted-foreground mt-2">You've completed every required step and document.</p>
        </div>
      )}
    </div>
  )
}

function ActionStepRow({
  step,
  onToggle,
  compact = false,
}: {
  step: DocumentAnalysis["actionSteps"][0]
  onToggle: (id: string, completed: boolean) => void
  compact?: boolean
}) {
  return (
    <div
      className={`group flex items-start gap-4 rounded-2xl border transition-all duration-200 ${
        compact ? "p-3" : "p-4"
      } ${
        step.completed
          ? "bg-secondary/40 border-transparent opacity-70"
          : "bg-white border-border/60 hover:border-primary/30 hover:shadow-sm"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <Checkbox
          checked={step.completed}
          onCheckedChange={(c) => onToggle(step.id, c === true)}
        />
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <h3
            className={`font-semibold leading-snug ${
              step.completed ? "text-muted-foreground line-through" : "text-foreground"
            } ${compact ? "text-sm" : "text-base"}`}
          >
            {step.title}
          </h3>
          <div className="flex flex-wrap gap-2 shrink-0">
            <PriorityBadge level={step.priority} />
            <ConfidenceBadge level={step.confidence} />
          </div>
        </div>
        {!compact && (
          <p className={`text-sm ${step.completed ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
            {step.description}
          </p>
        )}
        <div className="flex items-center gap-3 pt-0.5">
          {step.category && (
            <Badge variant="outline" className="bg-white text-xs">{step.category}</Badge>
          )}
          <EvidenceTooltip text={step.sourceEvidence} />
        </div>
      </div>
    </div>
  )
}

function DocRow({
  doc,
  onToggle,
  compact = false,
}: {
  doc: DocumentAnalysis["requiredDocuments"][0]
  onToggle: (id: string, obtained: boolean) => void
  compact?: boolean
}) {
  return (
    <div
      className={`group flex items-start gap-4 rounded-2xl border transition-all ${
        compact ? "p-3" : "p-5"
      } ${
        doc.obtained
          ? "bg-green-50 border-green-200 opacity-70"
          : "bg-white border-border/60 hover:shadow-sm"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <Checkbox
          checked={doc.obtained}
          onCheckedChange={(c) => onToggle(doc.id, c === true)}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3
            className={`font-semibold ${
              doc.obtained ? "line-through opacity-70" : "text-foreground"
            } ${compact ? "text-sm" : ""}`}
          >
            {doc.name}
          </h3>
          {!doc.required && (
            <Badge variant="secondary" className="text-[10px] shrink-0">Optional</Badge>
          )}
        </div>
        {!compact && <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>}
        <div className="flex items-center justify-between">
          <ConfidenceBadge level={doc.confidence} />
          <EvidenceTooltip text={doc.sourceEvidence} />
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-2xl bg-secondary/20">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  )
}
