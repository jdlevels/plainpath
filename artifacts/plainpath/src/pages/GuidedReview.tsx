import { useState, useRef, useEffect, useCallback } from "react"
import { useLocation, useSearch } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { useUpdateChecklist, useGetDemoDocument } from "@workspace/api-client-react"
import type { DocumentAnalysis, DocumentSection } from "@workspace/api-client-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, ListTodo, ShieldCheck, AlertTriangle,
  FileText, CheckCircle2, AlignLeft, ArrowRight,
  ChevronRight, Layers
} from "lucide-react"

/* ── Color palette (matches Analyze.tsx SECTION_CARD_COLORS) ── */
const COLORS = [
  {
    badge: "bg-blue-500", label: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-500", ring: "ring-blue-400/50",
    activeBg: "bg-blue-50/40 dark:bg-blue-950/25", activeBorder: "border-blue-300/60 dark:border-blue-700/50",
    matchBg: "bg-blue-50/20 dark:bg-blue-950/15", matchBorder: "border-blue-200/50 dark:border-blue-800/40",
  },
  {
    badge: "bg-violet-500", label: "text-violet-600 dark:text-violet-400",
    bar: "bg-violet-500", ring: "ring-violet-400/50",
    activeBg: "bg-violet-50/40 dark:bg-violet-950/25", activeBorder: "border-violet-300/60 dark:border-violet-700/50",
    matchBg: "bg-violet-50/20 dark:bg-violet-950/15", matchBorder: "border-violet-200/50 dark:border-violet-800/40",
  },
  {
    badge: "bg-amber-500", label: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500", ring: "ring-amber-400/50",
    activeBg: "bg-amber-50/40 dark:bg-amber-950/25", activeBorder: "border-amber-300/60 dark:border-amber-700/50",
    matchBg: "bg-amber-50/20 dark:bg-amber-950/15", matchBorder: "border-amber-200/50 dark:border-amber-800/40",
  },
  {
    badge: "bg-emerald-500", label: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500", ring: "ring-emerald-400/50",
    activeBg: "bg-emerald-50/40 dark:bg-emerald-950/25", activeBorder: "border-emerald-300/60 dark:border-emerald-700/50",
    matchBg: "bg-emerald-50/20 dark:bg-emerald-950/15", matchBorder: "border-emerald-200/50 dark:border-emerald-800/40",
  },
  {
    badge: "bg-red-500", label: "text-red-600 dark:text-red-400",
    bar: "bg-red-500", ring: "ring-red-400/50",
    activeBg: "bg-red-50/40 dark:bg-red-950/25", activeBorder: "border-red-300/60 dark:border-red-700/50",
    matchBg: "bg-red-50/20 dark:bg-red-950/15", matchBorder: "border-red-200/50 dark:border-red-800/40",
  },
  {
    badge: "bg-teal-500", label: "text-teal-600 dark:text-teal-400",
    bar: "bg-teal-500", ring: "ring-teal-400/50",
    activeBg: "bg-teal-50/40 dark:bg-teal-950/25", activeBorder: "border-teal-300/60 dark:border-teal-700/50",
    matchBg: "bg-teal-50/20 dark:bg-teal-950/15", matchBorder: "border-teal-200/50 dark:border-teal-800/40",
  },
  {
    badge: "bg-orange-500", label: "text-orange-600 dark:text-orange-400",
    bar: "bg-orange-500", ring: "ring-orange-400/50",
    activeBg: "bg-orange-50/40 dark:bg-orange-950/25", activeBorder: "border-orange-300/60 dark:border-orange-700/50",
    matchBg: "bg-orange-50/20 dark:bg-orange-950/15", matchBorder: "border-orange-200/50 dark:border-orange-800/40",
  },
]

/* ── Text overlap matching ───────────────────────────────────── */
function hasOverlap(a?: string, b?: string, minLen = 14): boolean {
  if (!a || !b || a.length < minLen || b.length < minLen) return false
  const A = a.toLowerCase()
  const B = b.toLowerCase()
  for (let i = 0; i <= A.length - minLen; i++) {
    if (B.includes(A.slice(i, i + minLen))) return true
  }
  return false
}

/* ── Priority label ─────────────────────────────────────────── */
const PRIORITY_STYLES = {
  high:   "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50",
  medium: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  low:    "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50",
}
const SEVERITY_STYLES = {
  high:   "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50",
  medium: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  low:    "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
}

type RightTab = "tasks" | "docs" | "risks"

export default function GuidedReview() {
  const { analysis, setAnalysis } = useAnalysisContext()
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const demoId = new URLSearchParams(searchString).get("demo") as string | null

  const { data: demoData, isLoading } = useGetDemoDocument(
    demoId as any,
    { query: { enabled: !!demoId && !analysis } }
  )

  useEffect(() => {
    if (demoData?.analysis && !analysis) setAnalysis(demoData.analysis)
  }, [demoData, analysis, setAnalysis])

  useEffect(() => {
    document.title = "Guided Review — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => {
    if (!demoId && !analysis) setLocation("/import")
  }, [demoId, analysis, setLocation])

  if (isLoading || (!analysis && demoId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading analysis…</p>
        </div>
      </div>
    )
  }

  if (!analysis) return null
  const backHref = demoId ? `/analyze?demo=${demoId}` : "/analyze"
  return <GuidedReviewContent analysis={analysis} onBack={() => setLocation(backHref)} />
}

function GuidedReviewContent({
  analysis,
  onBack,
}: {
  analysis: DocumentAnalysis
  onBack: () => void
}) {
  const { updateActionStep, updateRequiredDoc } = useAnalysisContext()
  const { mutate: updateChecklist } = useUpdateChecklist()

  const sections = analysis.sections ?? []
  const actionSteps = analysis.actionSteps ?? []
  const requiredDocuments = analysis.requiredDocuments ?? []
  const risks = analysis.risks ?? []

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>("tasks")

  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  /* ── Matching helpers ──────────────────────────────────────── */
  const getMatchedItemIds = useCallback((section: DocumentSection): string[] => {
    const ids: string[] = []
    for (const s of actionSteps) if (hasOverlap(s.sourceEvidence, section.content)) ids.push(s.id)
    for (const d of requiredDocuments) if (hasOverlap(d.sourceEvidence, section.content)) ids.push(d.id)
    for (const r of risks) if (hasOverlap(r.sourceEvidence, section.content)) ids.push(r.id)
    return ids
  }, [actionSteps, requiredDocuments, risks])

  const getMatchedSectionIds = useCallback((sourceEvidence?: string): string[] => {
    if (!sourceEvidence) return []
    return sections.filter(s => hasOverlap(sourceEvidence, s.content)).map(s => s.id)
  }, [sections])

  /* ── Derived highlight sets ───────────────────────────────── */
  const matchedItemIds: string[] = selectedSectionId
    ? getMatchedItemIds(sections.find(s => s.id === selectedSectionId)!)
    : []

  const getSourceEvidenceForItem = (id: string): string | undefined => {
    return (
      actionSteps.find(s => s.id === id)?.sourceEvidence ??
      requiredDocuments.find(d => d.id === id)?.sourceEvidence ??
      risks.find(r => r.id === id)?.sourceEvidence
    )
  }

  const matchedSectionIds: string[] = selectedItemId
    ? getMatchedSectionIds(getSourceEvidenceForItem(selectedItemId))
    : []

  /* ── Click handlers ────────────────────────────────────────── */
  const handleSectionClick = useCallback((section: DocumentSection) => {
    if (selectedSectionId === section.id) {
      setSelectedSectionId(null)
      setSelectedItemId(null)
      return
    }
    setSelectedSectionId(section.id)
    setSelectedItemId(null)

    const matched = getMatchedItemIds(section)
    if (matched.length > 0) {
      const firstStep = actionSteps.find(s => matched.includes(s.id))
      const firstDoc   = requiredDocuments.find(d => matched.includes(d.id))
      const firstRisk  = risks.find(r => matched.includes(r.id))
      if (firstStep) setRightTab("tasks")
      else if (firstDoc) setRightTab("docs")
      else if (firstRisk) setRightTab("risks")

      setTimeout(() => {
        const el = itemRefs.current.get(matched[0])
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 80)
    }
  }, [selectedSectionId, getMatchedItemIds, actionSteps, requiredDocuments, risks])

  const handleItemClick = useCallback((id: string, sourceEvidence?: string) => {
    if (selectedItemId === id) {
      setSelectedItemId(null)
      setSelectedSectionId(null)
      return
    }
    setSelectedItemId(id)
    const matched = getMatchedSectionIds(sourceEvidence)
    if (matched.length > 0) {
      setSelectedSectionId(matched[0])
      setTimeout(() => {
        const el = sectionRefs.current.get(matched[0])
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 80)
    } else {
      setSelectedSectionId(null)
    }
  }, [selectedItemId, getMatchedSectionIds])

  /* ── Progress ──────────────────────────────────────────────── */
  const totalItems = actionSteps.length + requiredDocuments.length
  const doneItems = actionSteps.filter(s => s.completed).length + requiredDocuments.filter(d => d.obtained).length
  const pct = totalItems === 0 ? 100 : Math.round((doneItems / totalItems) * 100)

  /* ── Tab counts ─────────────────────────────────────────────── */
  const tabConfig: { id: RightTab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "tasks", label: "Tasks",   icon: ListTodo,       count: actionSteps.length },
    { id: "docs",  label: "Docs",    icon: ShieldCheck,    count: requiredDocuments.length },
    { id: "risks", label: "Risks",   icon: AlertTriangle,  count: risks.length },
  ]

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div
      className="flex flex-col bg-background"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/30 bg-card/60 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          style={{ touchAction: "manipulation" }}
          className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-secondary active:bg-secondary transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Guided Review
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-foreground truncate leading-tight">
            {analysis.title}
          </h1>
        </div>

        {/* Progress pill */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[11px] font-bold text-foreground">{pct}% done</span>
            <span className="text-[10px] text-muted-foreground/60">{doneItems}/{totalItems} items</span>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center relative">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-secondary" />
              <circle
                cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3.5"
                className="text-primary"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-foreground">{pct}%</span>
          </div>
        </div>
      </div>

      {/* ── Split layout ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">

        {/* ══ LEFT PANEL — Document Sections ══════════════════ */}
        <div
          ref={leftPanelRef}
          className="sm:w-[42%] shrink-0 overflow-y-auto border-b sm:border-b-0 sm:border-r border-border/20 h-[38vh] sm:h-auto"
        >

          <div className="p-4 pb-2 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/20">
            <div className="flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Document Sections</span>
              <span className="ml-auto text-xs text-muted-foreground/60 bg-secondary/60 px-2 py-0.5 rounded-full font-medium">
                {sections.length}
              </span>
            </div>
            {selectedSectionId && matchedItemIds.length > 0 && (
              <p className="text-[11px] text-primary/80 mt-1.5 flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                {matchedItemIds.length} related {matchedItemIds.length === 1 ? "item" : "items"} highlighted →
              </p>
            )}
            {selectedSectionId && matchedItemIds.length === 0 && (
              <p className="text-[11px] text-muted-foreground/60 mt-1.5">No direct task links for this section</p>
            )}
          </div>

          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <FileText className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/60">No sections extracted</p>
              <p className="text-xs text-muted-foreground/40 mt-1">This document was not split into sections</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {sections.map((section, i) => {
                const c = COLORS[i % COLORS.length]
                const isSelected = selectedSectionId === section.id
                const isMatched = matchedSectionIds.includes(section.id)

                return (
                  <div
                    key={section.id}
                    ref={el => { if (el) sectionRefs.current.set(section.id, el) }}
                  >
                    <motion.button
                      onClick={() => handleSectionClick(section)}
                      style={{ touchAction: "manipulation" }}
                      whileTap={{ scale: 0.99 }}
                      className={[
                        "w-full text-left rounded-xl border transition-all duration-150 overflow-hidden group",
                        isSelected
                          ? `${c.activeBorder} ${c.activeBg} ring-1 ${c.ring}`
                          : isMatched
                          ? `${c.matchBorder} ${c.matchBg} ring-1 ${c.ring}`
                          : "border-border/30 bg-card hover:border-border/60 hover:bg-secondary/20",
                      ].join(" ")}
                    >
                      <div className="flex items-stretch">
                        <div className={`w-1 shrink-0 ${c.bar} ${isSelected || isMatched ? "opacity-100" : "opacity-40 group-hover:opacity-70"} transition-opacity`} />
                        <div className="flex-1 min-w-0 p-3">
                          <div className="flex items-start gap-2.5 mb-1.5">
                            <span className={`shrink-0 w-5 h-5 rounded-full ${c.badge} ${isSelected || isMatched ? "opacity-100" : "opacity-50 group-hover:opacity-80"} text-white text-[10px] font-bold flex items-center justify-center mt-0.5 transition-opacity`}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              {section.title && (
                                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? c.label : "text-muted-foreground/70"}`}>
                                  {section.title}
                                </div>
                              )}
                              <p className="text-xs text-foreground/75 leading-relaxed line-clamp-3">
                                {section.content}
                              </p>
                            </div>
                          </div>
                          <div className={`ml-7 flex items-center gap-1 text-[10px] font-semibold transition-colors ${isSelected ? c.label : "text-muted-foreground/40 group-hover:text-muted-foreground/70"}`}>
                            {isSelected ? (
                              <><ChevronRight className="w-3 h-3 rotate-90" />Selected</>
                            ) : (
                              <><ChevronRight className="w-3 h-3" />Click to link tasks</>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL — Tasks / Docs / Risks ══════════════ */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Tab bar */}
          <div className="shrink-0 border-b border-border/20 px-3 pt-3 pb-0 bg-background/95 backdrop-blur-sm">
            <div className="flex gap-1">
              {tabConfig.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  style={{ touchAction: "manipulation" }}
                  className={[
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all",
                    rightTab === tab.id
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  ].join(" ")}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    rightTab === tab.id ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            {selectedItemId && matchedSectionIds.length > 0 && (
              <p className="text-[11px] text-primary/80 py-1.5 px-1 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                ← Section {sections.findIndex(s => s.id === matchedSectionIds[0]) + 1} highlighted
              </p>
            )}
            {selectedItemId && matchedSectionIds.length === 0 && (
              <p className="text-[11px] text-muted-foreground/50 py-1.5 px-1">No source section found for this item</p>
            )}
          </div>

          {/* Tab content */}
          <div ref={rightPanelRef} className="flex-1 overflow-y-auto p-3">
            <AnimatePresence mode="wait">

              {/* ── TASKS ─────────────────────────────────────── */}
              {rightTab === "tasks" && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2"
                >
                  {actionSteps.length === 0 ? (
                    <EmptyPane icon={ListTodo} text="No action steps identified" />
                  ) : (
                    <>
                      {(["high", "medium", "low"] as const).map(priority => {
                        const group = actionSteps.filter(s => s.priority === priority)
                        if (group.length === 0) return null
                        return (
                          <div key={priority}>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 mb-1.5 mt-3 first:mt-0">
                              {priority} priority
                            </div>
                            <div className="space-y-1.5">
                              {group.map(step => {
                                const isSelected = selectedItemId === step.id
                                const isMatched = matchedItemIds.includes(step.id)
                                return (
                                  <div
                                    key={step.id}
                                    ref={el => { if (el) itemRefs.current.set(step.id, el) }}
                                  >
                                    <motion.div
                                      whileTap={{ scale: 0.99 }}
                                      onClick={() => handleItemClick(step.id, step.sourceEvidence)}
                                      style={{ touchAction: "manipulation", cursor: "pointer" }}
                                      className={[
                                        "rounded-xl border p-3 transition-all duration-150 group",
                                        isSelected
                                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                                          : isMatched
                                          ? "border-primary/25 bg-primary/[0.03] ring-1 ring-primary/20"
                                          : "border-border/30 bg-card hover:border-border/60 hover:bg-secondary/20",
                                        step.completed ? "opacity-60" : "",
                                      ].join(" ")}
                                    >
                                      <div className="flex items-start gap-2.5">
                                        <div
                                          onClick={e => {
                                            e.stopPropagation()
                                            const next = !step.completed
                                            updateActionStep(step.id, next)
                                            updateChecklist({ data: { itemId: step.id, itemType: "actionStep", completed: next } })
                                          }}
                                          className="mt-0.5 shrink-0"
                                          style={{ touchAction: "manipulation" }}
                                        >
                                          <Checkbox
                                            checked={step.completed}
                                            className="w-4 h-4"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start gap-2 flex-wrap">
                                            <p className={`text-xs font-semibold leading-snug flex-1 min-w-0 ${step.completed ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                                              {step.title}
                                            </p>
                                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${PRIORITY_STYLES[step.priority as keyof typeof PRIORITY_STYLES] ?? PRIORITY_STYLES.low}`}>
                                              {step.priority}
                                            </span>
                                          </div>
                                          {step.description && (
                                            <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">
                                              {step.description}
                                            </p>
                                          )}
                                          {(isSelected || isMatched) && step.sourceEvidence && (
                                            <div className="mt-2 px-2.5 py-2 rounded-lg bg-primary/5 border border-primary/15">
                                              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Source evidence</p>
                                              <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic">
                                                "{step.sourceEvidence.slice(0, 200)}{step.sourceEvidence.length > 200 ? "…" : ""}"
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                        {step.completed && (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        )}
                                      </div>
                                    </motion.div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </motion.div>
              )}

              {/* ── DOCS ──────────────────────────────────────── */}
              {rightTab === "docs" && (
                <motion.div
                  key="docs"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1.5"
                >
                  {requiredDocuments.length === 0 ? (
                    <EmptyPane icon={ShieldCheck} text="No required documents identified" />
                  ) : (
                    requiredDocuments.map(doc => {
                      const isSelected = selectedItemId === doc.id
                      const isMatched = matchedItemIds.includes(doc.id)
                      return (
                        <div
                          key={doc.id}
                          ref={el => { if (el) itemRefs.current.set(doc.id, el) }}
                        >
                          <motion.div
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleItemClick(doc.id, doc.sourceEvidence)}
                            style={{ touchAction: "manipulation", cursor: "pointer" }}
                            className={[
                              "rounded-xl border p-3 transition-all duration-150",
                              isSelected
                                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                                : isMatched
                                ? "border-primary/25 bg-primary/[0.03] ring-1 ring-primary/20"
                                : "border-border/30 bg-card hover:border-border/60 hover:bg-secondary/20",
                              doc.obtained ? "opacity-60" : "",
                            ].join(" ")}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                onClick={e => {
                                  e.stopPropagation()
                                  const next = !doc.obtained
                                  updateRequiredDoc(doc.id, next)
                                  updateChecklist({ data: { itemId: doc.id, itemType: "requiredDocument", completed: next } })
                                }}
                                className="mt-0.5 shrink-0"
                                style={{ touchAction: "manipulation" }}
                              >
                                <Checkbox checked={doc.obtained} className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 flex-wrap">
                                  <p className={`text-xs font-semibold leading-snug flex-1 ${doc.obtained ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                                    {doc.name}
                                  </p>
                                  {doc.required && (
                                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50">
                                      Required
                                    </span>
                                  )}
                                </div>
                                {doc.description && (
                                  <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">
                                    {doc.description}
                                  </p>
                                )}
                                {(isSelected || isMatched) && doc.sourceEvidence && (
                                  <div className="mt-2 px-2.5 py-2 rounded-lg bg-primary/5 border border-primary/15">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Source evidence</p>
                                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic">
                                      "{doc.sourceEvidence.slice(0, 200)}{doc.sourceEvidence.length > 200 ? "…" : ""}"
                                    </p>
                                  </div>
                                )}
                              </div>
                              {doc.obtained && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                            </div>
                          </motion.div>
                        </div>
                      )
                    })
                  )}
                </motion.div>
              )}

              {/* ── RISKS ─────────────────────────────────────── */}
              {rightTab === "risks" && (
                <motion.div
                  key="risks"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1.5"
                >
                  {risks.length === 0 ? (
                    <EmptyPane icon={AlertTriangle} text="No risks identified" />
                  ) : (
                    risks.map(risk => {
                      const isSelected = selectedItemId === risk.id
                      const isMatched = matchedItemIds.includes(risk.id)
                      const sev = (risk.severity as string) in SEVERITY_STYLES
                        ? risk.severity as keyof typeof SEVERITY_STYLES
                        : "low"
                      return (
                        <div
                          key={risk.id}
                          ref={el => { if (el) itemRefs.current.set(risk.id, el) }}
                        >
                          <motion.div
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleItemClick(risk.id, risk.sourceEvidence)}
                            style={{ touchAction: "manipulation", cursor: "pointer" }}
                            className={[
                              "rounded-xl border p-3 transition-all duration-150",
                              isSelected
                                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                                : isMatched
                                ? "border-primary/25 bg-primary/[0.03] ring-1 ring-primary/20"
                                : "border-border/30 bg-card hover:border-border/60 hover:bg-secondary/20",
                            ].join(" ")}
                          >
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                                sev === "high" ? "text-red-500" : sev === "medium" ? "text-amber-500" : "text-blue-500"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 flex-wrap">
                                  <p className="text-xs font-semibold text-foreground leading-snug flex-1">
                                    {risk.title}
                                  </p>
                                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${SEVERITY_STYLES[sev]}`}>
                                    {risk.severity}
                                  </span>
                                </div>
                                {risk.description && (
                                  <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">
                                    {risk.description}
                                  </p>
                                )}
                                {(isSelected || isMatched) && risk.sourceEvidence && (
                                  <div className="mt-2 px-2.5 py-2 rounded-lg bg-primary/5 border border-primary/15">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Source evidence</p>
                                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic">
                                      "{risk.sourceEvidence.slice(0, 200)}{risk.sourceEvidence.length > 200 ? "…" : ""}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )
                    })
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyPane({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Icon className="w-8 h-8 text-muted-foreground/25 mb-3" />
      <p className="text-sm text-muted-foreground/50">{text}</p>
    </div>
  )
}
