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
import { Loader2, FileText, ListTodo, Calendar, AlertTriangle, Printer, ArrowLeft, CheckCircle2 } from "lucide-react"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge"
import { EvidenceTooltip } from "@/components/shared/EvidenceTooltip"
import { format, parseISO } from "date-fns"

export default function Analyze() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const demoId = searchParams.get("demo") as any;

  const { analysis, setAnalysis, updateActionStep, updateRequiredDoc } = useAnalysisContext();
  const [activeTab, setActiveTab] = useState("checklist");

  const { data: demoData, isLoading: isLoadingDemo, error: demoError } = useGetDemoDocument(demoId, {
    query: { enabled: !!demoId && !analysis }
  });

  const { mutate: updateChecklistServer } = useUpdateChecklist();

  // Load demo data if it came in
  useEffect(() => {
    if (demoData?.analysis && !analysis) {
      setAnalysis(demoData.analysis);
    }
  }, [demoData, analysis, setAnalysis]);

  // Redirect if no data
  useEffect(() => {
    if (!demoId && !analysis) {
      setLocation("/import");
    }
  }, [demoId, analysis, setLocation]);

  if (isLoadingDemo || (!analysis && demoId)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Analyzing Document...</h2>
          <p className="text-muted-foreground mt-2">Extracting action items, deadlines, and risks.</p>
        </div>
      </div>
    );
  }

  if (demoError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4]">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error Loading Demo</h2>
          <p className="text-muted-foreground mb-6">We couldn't load the requested demo document.</p>
          <Button onClick={() => setLocation("/import")}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const totalItems = analysis.actionSteps.length + analysis.requiredDocuments.length;
  const completedItems = analysis.actionSteps.filter(s => s.completed).length + analysis.requiredDocuments.filter(d => d.obtained).length;
  const progress = totalItems === 0 ? 100 : Math.round((completedItems / totalItems) * 100);

  const handleActionToggle = (id: string, completed: boolean) => {
    updateActionStep(id, completed); // Optimistic UI
    updateChecklistServer({ data: { itemId: id, itemType: "actionStep", completed }});
  };

  const handleDocToggle = (id: string, obtained: boolean) => {
    updateRequiredDoc(id, obtained); // Optimistic UI
    updateChecklistServer({ data: { itemId: id, itemType: "requiredDocument", completed: obtained }});
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] pb-24">
      {/* Top Bar */}
      <div className="bg-white border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/import")} className="p-2 hover:bg-secondary rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold font-display truncate max-w-sm sm:max-w-md">{analysis.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="font-normal text-xs">{analysis.documentType}</Badge>
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <ConfidenceBadge level={analysis.overallConfidence} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:min-w-[250px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-muted-foreground">Completion</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex bg-white gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-white border border-border/50 rounded-2xl shadow-sm mb-8">
            {[
              { id: 'summary', label: 'Summary', icon: FileText },
              { id: 'checklist', label: 'Checklist', icon: ListTodo, count: analysis.actionSteps.length },
              { id: 'documents', label: 'Required Docs', icon: FileText, count: analysis.requiredDocuments.length },
              { id: 'deadlines', label: 'Deadlines', icon: Calendar, count: analysis.deadlines.length },
              { id: 'risks', label: 'Risks & Notes', icon: AlertTriangle, count: analysis.risks.length + analysis.followUpQuestions.length },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap outline-none
                  ${activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-border text-muted-foreground'}`}>
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* SUMMARY TAB */}
                {activeTab === 'summary' && (
                  <div className="space-y-8 max-w-3xl">
                    <div>
                      <h2 className="text-2xl font-bold font-display mb-4">Executive Summary</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="p-4 bg-secondary/50 border-none shadow-none">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Steps</p>
                        <p className="text-3xl font-display font-bold text-foreground">{analysis.actionSteps.length}</p>
                      </Card>
                      <Card className="p-4 bg-secondary/50 border-none shadow-none">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Required Docs</p>
                        <p className="text-3xl font-display font-bold text-foreground">{analysis.requiredDocuments.length}</p>
                      </Card>
                      <Card className="p-4 bg-destructive/10 border-none shadow-none">
                        <p className="text-sm font-semibold text-destructive uppercase tracking-wider mb-1">Hard Deadlines</p>
                        <p className="text-3xl font-display font-bold text-destructive">{analysis.deadlines.filter(d => d.isHard).length}</p>
                      </Card>
                    </div>
                  </div>
                )}

                {/* CHECKLIST TAB */}
                {activeTab === 'checklist' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold font-display">Action Steps</h2>
                        <p className="text-muted-foreground mt-1">Check off items as you complete them.</p>
                      </div>
                    </div>

                    {analysis.actionSteps.length === 0 ? (
                      <EmptyState icon={CheckCircle2} title="No action steps found" desc="This document doesn't seem to require any direct actions." />
                    ) : (
                      <div className="space-y-3">
                        {analysis.actionSteps.map((step) => (
                          <div 
                            key={step.id} 
                            className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                              step.completed 
                                ? 'bg-secondary/50 border-transparent opacity-75' 
                                : 'bg-white border-border/60 hover:border-primary/30 hover:shadow-md'
                            }`}
                          >
                            <div className="mt-1">
                              <Checkbox 
                                checked={step.completed}
                                onCheckedChange={(c) => handleActionToggle(step.id, c === true)}
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <h3 className={`font-semibold text-lg leading-snug transition-colors ${step.completed ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground'}`}>
                                  {step.title}
                                </h3>
                                <div className="flex flex-wrap gap-2 shrink-0">
                                  <PriorityBadge level={step.priority} />
                                  <ConfidenceBadge level={step.confidence} />
                                </div>
                              </div>
                              <p className={`text-sm ${step.completed ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                {step.description}
                              </p>
                              <div className="flex items-center gap-3 pt-1">
                                {step.category && <Badge variant="outline" className="bg-white">{step.category}</Badge>}
                                <EvidenceTooltip text={step.sourceEvidence} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DOCUMENTS TAB */}
                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold font-display">Required Documents</h2>
                      <p className="text-muted-foreground mt-1">Gather these files before submitting.</p>
                    </div>

                    {analysis.requiredDocuments.length === 0 ? (
                      <EmptyState icon={FileText} title="No documents required" desc="You don't need to attach any additional files." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.requiredDocuments.map((doc) => (
                          <div 
                            key={doc.id} 
                            className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                              doc.obtained 
                                ? 'bg-success/5 border-success/20' 
                                : 'bg-white border-border/60 hover:shadow-md'
                            }`}
                          >
                            <div className="mt-0.5">
                              <Checkbox 
                                checked={doc.obtained}
                                onCheckedChange={(c) => handleDocToggle(doc.id, c === true)}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className={`font-semibold ${doc.obtained ? 'text-success-foreground line-through opacity-70' : 'text-foreground'}`}>
                                  {doc.name}
                                </h3>
                                {!doc.required && <Badge variant="secondary" className="text-[10px]">Optional</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{doc.description}</p>
                              <div className="flex items-center justify-between">
                                <ConfidenceBadge level={doc.confidence} />
                                <EvidenceTooltip text={doc.sourceEvidence} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DEADLINES TAB */}
                {activeTab === 'deadlines' && (
                  <div className="space-y-6">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold font-display">Timeline & Deadlines</h2>
                      <p className="text-muted-foreground mt-1">Critical dates you cannot miss.</p>
                    </div>

                    {analysis.deadlines.length === 0 ? (
                      <EmptyState icon={Calendar} title="No deadlines found" desc="There are no specific dates mentioned in this document." />
                    ) : (
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                        {analysis.deadlines.map((deadline, i) => {
                          const dateObj = parseISO(deadline.date);
                          const isValidDate = !isNaN(dateObj.getTime());
                          
                          return (
                            <div key={deadline.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-secondary text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                                <Calendar className="w-4 h-4" />
                              </div>
                              
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-border/50 bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-bold text-lg text-primary">
                                    {isValidDate ? format(dateObj, "MMM d, yyyy") : deadline.date}
                                  </div>
                                  {deadline.isHard && <Badge variant="destructive">Hard Deadline</Badge>}
                                </div>
                                <h4 className="font-bold text-foreground mb-1">{deadline.title}</h4>
                                <p className="text-sm text-muted-foreground mb-3">{deadline.description}</p>
                                <div className="flex justify-between items-center">
                                  <ConfidenceBadge level={deadline.confidence} />
                                  <EvidenceTooltip text={deadline.sourceEvidence} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* RISKS TAB */}
                {activeTab === 'risks' && (
                  <div className="space-y-12">
                    
                    <div>
                      <div className="mb-6 flex items-center gap-3 text-destructive">
                        <AlertTriangle className="w-6 h-6" />
                        <h2 className="text-2xl font-bold font-display">Risks & Warnings</h2>
                      </div>
                      
                      {analysis.risks.length === 0 ? (
                        <Card className="bg-secondary/30 p-6 text-center border-dashed">
                          <p className="text-muted-foreground">No major risks detected.</p>
                        </Card>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {analysis.risks.map(risk => (
                            <Card key={risk.id} className={`p-5 ${risk.severity === 'high' ? 'bg-destructive/5 border-destructive/20' : ''}`}>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-foreground">{risk.title}</h3>
                                <Badge variant={risk.severity === 'high' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
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
                          <p className="text-sm text-muted-foreground">The AI found these ambiguous areas in the text.</p>
                        </div>
                        <div className="space-y-3">
                          {analysis.followUpQuestions.map(q => (
                            <div key={q.id} className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                              <p className="font-semibold text-sm mb-1">{q.question}</p>
                              <p className="text-xs text-muted-foreground italic">Context: {q.context}</p>
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

function EmptyState({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-2xl bg-secondary/20">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  )
}
