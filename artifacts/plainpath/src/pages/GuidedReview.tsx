import { useState, useRef, useEffect, useCallback } from "react"
import { useLocation, useSearch } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { useUpdateChecklist, useGetDemoDocument } from "@workspace/api-client-react"
import type { DocumentAnalysis, DocumentSection } from "@workspace/api-client-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft, ListTodo, ShieldCheck, AlertTriangle,
  FileText, CheckCircle2, AlignLeft, Layers, ChevronRight,
  Link2
} from "lucide-react"

/* ─────────────────────────────────────────────────────────────
   COLOR SYSTEM  (matches Analyze.tsx SECTION_CARD_COLORS)
───────────────────────────────────────────────────────────── */
const COLORS = [
  {
    badge:        "bg-blue-500",
    label:        "text-blue-600 dark:text-blue-400",
    bar:          "bg-blue-500",
    ring:         "ring-blue-400/60",
    activeBg:     "bg-blue-50/60 dark:bg-blue-950/30",
    activeBorder: "border-blue-400/60 dark:border-blue-600/50",
    matchAccent:  "bg-blue-500",
    matchBg:      "bg-blue-50/30 dark:bg-blue-950/20",
    matchBorder:  "border-blue-300/50 dark:border-blue-700/40",
    groupHdr:     "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
  },
  {
    badge:        "bg-violet-500",
    label:        "text-violet-600 dark:text-violet-400",
    bar:          "bg-violet-500",
    ring:         "ring-violet-400/60",
    activeBg:     "bg-violet-50/60 dark:bg-violet-950/30",
    activeBorder: "border-violet-400/60 dark:border-violet-600/50",
    matchAccent:  "bg-violet-500",
    matchBg:      "bg-violet-50/30 dark:bg-violet-950/20",
    matchBorder:  "border-violet-300/50 dark:border-violet-700/40",
    groupHdr:     "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/50",
  },
  {
    badge:        "bg-amber-500",
    label:        "text-amber-600 dark:text-amber-400",
    bar:          "bg-amber-500",
    ring:         "ring-amber-400/60",
    activeBg:     "bg-amber-50/60 dark:bg-amber-950/30",
    activeBorder: "border-amber-400/60 dark:border-amber-600/50",
    matchAccent:  "bg-amber-500",
    matchBg:      "bg-amber-50/30 dark:bg-amber-950/20",
    matchBorder:  "border-amber-300/50 dark:border-amber-700/40",
    groupHdr:     "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
  },
  {
    badge:        "bg-emerald-500",
    label:        "text-emerald-600 dark:text-emerald-400",
    bar:          "bg-emerald-500",
    ring:         "ring-emerald-400/60",
    activeBg:     "bg-emerald-50/60 dark:bg-emerald-950/30",
    activeBorder: "border-emerald-400/60 dark:border-emerald-600/50",
    matchAccent:  "bg-emerald-500",
    matchBg:      "bg-emerald-50/30 dark:bg-emerald-950/20",
    matchBorder:  "border-emerald-300/50 dark:border-emerald-700/40",
    groupHdr:     "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
  },
  {
    badge:        "bg-red-500",
    label:        "text-red-600 dark:text-red-400",
    bar:          "bg-red-500",
    ring:         "ring-red-400/60",
    activeBg:     "bg-red-50/60 dark:bg-red-950/30",
    activeBorder: "border-red-400/60 dark:border-red-600/50",
    matchAccent:  "bg-red-500",
    matchBg:      "bg-red-50/30 dark:bg-red-950/20",
    matchBorder:  "border-red-300/50 dark:border-red-700/40",
    groupHdr:     "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50",
  },
  {
    badge:        "bg-teal-500",
    label:        "text-teal-600 dark:text-teal-400",
    bar:          "bg-teal-500",
    ring:         "ring-teal-400/60",
    activeBg:     "bg-teal-50/60 dark:bg-teal-950/30",
    activeBorder: "border-teal-400/60 dark:border-teal-600/50",
    matchAccent:  "bg-teal-500",
    matchBg:      "bg-teal-50/30 dark:bg-teal-950/20",
    matchBorder:  "border-teal-300/50 dark:border-teal-700/40",
    groupHdr:     "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50",
  },
  {
    badge:        "bg-orange-500",
    label:        "text-orange-600 dark:text-orange-400",
    bar:          "bg-orange-500",
    ring:         "ring-orange-400/60",
    activeBg:     "bg-orange-50/60 dark:bg-orange-950/30",
    activeBorder: "border-orange-400/60 dark:border-orange-600/50",
    matchAccent:  "bg-orange-500",
    matchBg:      "bg-orange-50/30 dark:bg-orange-950/20",
    matchBorder:  "border-orange-300/50 dark:border-orange-700/40",
    groupHdr:     "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50",
  },
]

/* ─────────────────────────────────────────────────────────────
   TEXT OVERLAP MATCHING
───────────────────────────────────────────────────────────── */
function hasOverlap(a?: string, b?: string, minLen = 14): boolean {
  if (!a || !b || a.length < minLen || b.length < minLen) return false
  const A = a.toLowerCase()
  const B = b.toLowerCase()
  for (let i = 0; i <= A.length - minLen; i++) {
    if (B.includes(A.slice(i, i + minLen))) return true
  }
  return false
}

type RightTab = "tasks" | "docs" | "risks"

/* ─────────────────────────────────────────────────────────────
   ROOT — handles data loading + redirect
───────────────────────────────────────────────────────────── */
export default function GuidedReview() {
  const { analysis, setAnalysis } = useAnalysisContext()
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const params = new URLSearchParams(searchString)
  const demoId = params.get("demo") as string | null
  const launchTab = (params.get("tab") ?? "tasks") as RightTab

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
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading analysis…</p>
        </div>
      </div>
    )
  }

  if (!analysis) return null
  const backHref = demoId ? `/analyze?demo=${demoId}` : "/analyze"
  return <GuidedReviewContent analysis={analysis} launchTab={launchTab} onBack={() => setLocation(backHref)} />
}

/* ─────────────────────────────────────────────────────────────
   CONTENT
───────────────────────────────────────────────────────────── */
function GuidedReviewContent({
  analysis,
  launchTab,
  onBack,
}: {
  analysis: DocumentAnalysis
  launchTab: RightTab
  onBack: () => void
}) {
  const { updateActionStep, updateRequiredDoc } = useAnalysisContext()
  const { mutate: updateChecklist } = useUpdateChecklist()

  const sections          = analysis.sections ?? []
  const actionSteps       = analysis.actionSteps ?? []
  const requiredDocuments = analysis.requiredDocuments ?? []
  const risks             = analysis.risks ?? []

  /* ── State ──────────────────────────────────────────────── */
  const [selectedSectionId,  setSelectedSectionId]  = useState<string | null>(null)
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number>(-1)
  const [selectedItemId,     setSelectedItemId]     = useState<string | null>(null)
  const [rightTab,           setRightTab]           = useState<RightTab>(launchTab)

  const sectionRefs   = useRef<Map<string, HTMLDivElement>>(new Map())
  const itemRefs      = useRef<Map<string, HTMLDivElement>>(new Map())
  const rightBodyRef  = useRef<HTMLDivElement>(null)

  /* ── Matching ────────────────────────────────────────────── */
  const getMatchedItemIds = useCallback((section: DocumentSection): string[] => {
    const ids: string[] = []
    actionSteps.forEach(s => hasOverlap(s.sourceEvidence, section.content) && ids.push(s.id))
    requiredDocuments.forEach(d => hasOverlap(d.sourceEvidence, section.content) && ids.push(d.id))
    risks.forEach(r => hasOverlap(r.sourceEvidence, section.content) && ids.push(r.id))
    return ids
  }, [actionSteps, requiredDocuments, risks])

  const getMatchedSectionIds = useCallback((sourceEvidence?: string): string[] => {
    if (!sourceEvidence) return []
    return sections.filter(s => hasOverlap(sourceEvidence, s.content)).map(s => s.id)
  }, [sections])

  const getSourceEvidence = (id: string) =>
    actionSteps.find(s => s.id === id)?.sourceEvidence ??
    requiredDocuments.find(d => d.id === id)?.sourceEvidence ??
    risks.find(r => r.id === id)?.sourceEvidence

  /* ── Click: section → highlight tasks ───────────────────── */
  const handleSectionClick = useCallback((section: DocumentSection, idx: number) => {
    if (selectedSectionId === section.id) {
      setSelectedSectionId(null); setSelectedSectionIdx(-1); setSelectedItemId(null); return
    }
    setSelectedSectionId(section.id)
    setSelectedSectionIdx(idx)
    setSelectedItemId(null)

    const matched = getMatchedItemIds(section)
    if (matched.length > 0) {
      const hasStep = actionSteps.some(s => matched.includes(s.id))
      const hasDoc  = requiredDocuments.some(d => matched.includes(d.id))
      const hasRisk = risks.some(r => matched.includes(r.id))
      if (hasStep) setRightTab("tasks")
      else if (hasDoc) setRightTab("docs")
      else if (hasRisk) setRightTab("risks")
      setTimeout(() => {
        itemRefs.current.get(matched[0])?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 80)
    }
  }, [selectedSectionId, getMatchedItemIds, actionSteps, requiredDocuments, risks])

  /* ── Click: task → highlight section ────────────────────── */
  const handleItemClick = useCallback((id: string, sourceEvidence?: string) => {
    if (selectedItemId === id) {
      setSelectedItemId(null); setSelectedSectionId(null); setSelectedSectionIdx(-1); return
    }
    setSelectedItemId(id)
    setSelectedSectionId(null)
    setSelectedSectionIdx(-1)
    const matchedSections = getMatchedSectionIds(sourceEvidence)
    if (matchedSections.length > 0) {
      const secId  = matchedSections[0]
      const secIdx = sections.findIndex(s => s.id === secId)
      setSelectedSectionId(secId)
      setSelectedSectionIdx(secIdx)
      setTimeout(() => {
        sectionRefs.current.get(secId)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 80)
    }
  }, [selectedItemId, getMatchedSectionIds, sections])

  /* ── Derived sets ────────────────────────────────────────── */
  const matchedItemIds: string[] = selectedSectionId
    ? getMatchedItemIds(sections.find(s => s.id === selectedSectionId)!)
    : []

  const matchedSectionIds: string[] = selectedItemId
    ? getMatchedSectionIds(getSourceEvidence(selectedItemId))
    : []

  /* The accent color of the currently active section (for cross-panel coloring) */
  const activeColor = selectedSectionIdx >= 0 ? COLORS[selectedSectionIdx % COLORS.length] : null

  /* ── Progress ────────────────────────────────────────────── */
  const totalItems = actionSteps.length + requiredDocuments.length
  const doneItems  = actionSteps.filter(s => s.completed).length + requiredDocuments.filter(d => d.obtained).length
  const pct        = totalItems === 0 ? 100 : Math.round((doneItems / totalItems) * 100)

  const tabConfig: { id: RightTab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "tasks", label: "Tasks",  icon: ListTodo,      count: actionSteps.length },
    { id: "docs",  label: "Docs",   icon: ShieldCheck,   count: requiredDocuments.length },
    { id: "risks", label: "Risks",  icon: AlertTriangle, count: risks.length },
  ]

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">

      {/* ══ PAGE HEADER ════════════════════════════════════════ */}
      <div className="border-b border-border/40 bg-card/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            style={{ touchAction: "manipulation" }}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-secondary active:bg-secondary transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                Guided Review
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight">
              {analysis.title}
            </h1>
            <p className="text-xs text-muted-foreground/60 hidden sm:block mt-0.5">
              Click a section to see related tasks · Click a task to jump to its source
            </p>
          </div>

          {/* Progress circle */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-0.5">
              <span className="text-sm font-bold text-foreground">{pct}%</span>
              <span className="text-xs text-muted-foreground/60">{doneItems} / {totalItems} done</span>
            </div>
            <div className="relative w-11 h-11">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
                <circle
                  cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4"
                  className="text-primary"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                {pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SPLIT PANELS ═══════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        <div
          className="flex flex-col sm:flex-row gap-4"
          style={{ height: "calc(100vh - 180px)", minHeight: "500px" }}
        >

          {/* ── LEFT PANEL ── Document Sections ──────────────── */}
          <div className="sm:w-[44%] shrink-0 flex flex-col rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden
                          h-[42vh] sm:h-auto">
            {/* Panel header */}
            <div className="shrink-0 px-5 py-4 border-b border-border/30 flex items-center gap-2.5">
              <AlignLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-bold text-sm text-foreground">Document Sections</span>
              <span className="ml-auto text-xs font-semibold text-muted-foreground/60 bg-secondary/80 px-2.5 py-1 rounded-full">
                {sections.length}
              </span>
            </div>

            {/* Section hint when active */}
            <AnimatePresence>
              {selectedSectionId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 border-b border-border/20 ${
                    matchedItemIds.length > 0
                      ? "bg-primary/5 text-primary"
                      : "bg-secondary/30 text-muted-foreground/70"
                  }`}>
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    {matchedItemIds.length > 0
                      ? `${matchedItemIds.length} related item${matchedItemIds.length > 1 ? "s" : ""} highlighted on the right`
                      : "No linked tasks found for this section"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable section list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sections.length === 0 ? (
                <EmptyPane icon={FileText} title="No sections extracted" desc="This document was not split into sections" />
              ) : (
                sections.map((section, i) => {
                  const c          = COLORS[i % COLORS.length]
                  const isSelected = selectedSectionId === section.id
                  const isMatched  = matchedSectionIds.includes(section.id)

                  return (
                    <div
                      key={section.id}
                      ref={el => { if (el) sectionRefs.current.set(section.id, el) }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.985 }}
                        onClick={() => handleSectionClick(section, i)}
                        style={{ touchAction: "manipulation" }}
                        className={[
                          "w-full text-left rounded-xl border transition-all duration-200 overflow-hidden group",
                          isSelected
                            ? `${c.activeBorder} ${c.activeBg} ring-2 ${c.ring} shadow-sm`
                            : isMatched
                            ? `${c.matchBorder} ${c.matchBg} ring-1 ${c.ring}`
                            : "border-border/40 bg-background hover:border-border/70 hover:bg-secondary/20",
                        ].join(" ")}
                      >
                        <div className="flex">
                          {/* Left color bar — thicker and more visible */}
                          <div className={`w-1.5 shrink-0 ${c.bar} ${isSelected ? "opacity-100" : "opacity-30 group-hover:opacity-60"} transition-opacity`} />

                          <div className="flex-1 min-w-0 p-4">
                            {/* Number + title row */}
                            <div className="flex items-start gap-3 mb-2.5">
                              <span className={`shrink-0 w-7 h-7 rounded-full ${c.badge} text-white text-xs font-bold flex items-center justify-center mt-0.5 shadow-sm`}>
                                {i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                {section.title && (
                                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? c.label : "text-muted-foreground/70"}`}>
                                    {section.title}
                                  </p>
                                )}
                                {/* Larger, more readable preview */}
                                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">
                                  {section.content}
                                </p>
                              </div>
                            </div>

                            {/* Footer hint */}
                            <div className={`ml-10 flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                              isSelected ? c.label : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
                            }`}>
                              {isSelected ? (
                                <>
                                  <Link2 className="w-3.5 h-3.5" />
                                  {matchedItemIds.length > 0
                                    ? `${matchedItemIds.length} linked item${matchedItemIds.length > 1 ? "s" : ""}`
                                    : "Active section"}
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                  Tap to link tasks
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── Tasks / Docs / Risks ──────────── */}
          <div className="flex-1 flex flex-col rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">

            {/* Tab bar */}
            <div className="shrink-0 px-4 pt-4 pb-0 border-b border-border/30">
              <div className="flex gap-1">
                {tabConfig.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setRightTab(tab.id)}
                    style={{ touchAction: "manipulation" }}
                    className={[
                      "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all",
                      rightTab === tab.id
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                    ].join(" ")}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      rightTab === tab.id
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Cross-link feedback */}
              <AnimatePresence>
                {selectedItemId && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`text-xs font-medium flex items-center gap-2 pt-2 pb-1.5 overflow-hidden ${
                      matchedSectionIds.length > 0 ? "text-primary" : "text-muted-foreground/60"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    {matchedSectionIds.length > 0
                      ? `Source: Section ${sections.findIndex(s => s.id === matchedSectionIds[0]) + 1} highlighted ←`
                      : "No source section found for this item"}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable content */}
            <div ref={rightBodyRef} className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">

                {/* ── TASKS ──────────────────────────────────── */}
                {rightTab === "tasks" && (
                  <motion.div
                    key="tasks"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    {actionSteps.length === 0 ? (
                      <EmptyPane icon={ListTodo} title="No action steps" desc="No tasks were identified in this document" />
                    ) : (
                      (["high", "medium", "low"] as const).map(priority => {
                        const group = actionSteps.filter(s => s.priority === priority)
                        if (group.length === 0) return null
                        const grpStyle = {
                          high:   "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-800/40",
                          medium: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40",
                          low:    "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/40",
                        }[priority]
                        const grpIcon = { high: "🔴", medium: "🟡", low: "⚪" }[priority]
                        return (
                          <div key={priority}>
                            {/* Group header */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest mb-3 ${grpStyle}`}>
                              <span>{grpIcon}</span>
                              {priority} priority · {group.length} task{group.length > 1 ? "s" : ""}
                            </div>

                            <div className="space-y-2.5">
                              {group.map(step => {
                                const isSelected = selectedItemId === step.id
                                const isMatched  = matchedItemIds.includes(step.id)
                                const linkColor  = activeColor

                                return (
                                  <div
                                    key={step.id}
                                    ref={el => { if (el) itemRefs.current.set(step.id, el) }}
                                  >
                                    <motion.div
                                      whileTap={{ scale: 0.985 }}
                                      onClick={() => handleItemClick(step.id, step.sourceEvidence)}
                                      style={{ touchAction: "manipulation", cursor: "pointer" }}
                                      className={[
                                        "rounded-xl border transition-all duration-200 overflow-hidden group",
                                        isSelected
                                          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                                          : isMatched && linkColor
                                          ? `${linkColor.matchBorder} ${linkColor.matchBg} ring-1 ${linkColor.ring}`
                                          : "border-border/40 bg-background hover:border-border/70 hover:bg-secondary/20",
                                        step.completed ? "opacity-55" : "",
                                      ].join(" ")}
                                    >
                                      <div className="flex">
                                        {/* Accent bar — uses section color when linked */}
                                        <div className={`w-1.5 shrink-0 transition-colors ${
                                          isSelected
                                            ? "bg-primary"
                                            : isMatched && linkColor
                                            ? linkColor.matchAccent
                                            : "bg-transparent group-hover:bg-border/30"
                                        }`} />

                                        <div className="flex-1 min-w-0 p-4">
                                          <div className="flex items-start gap-3">
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
                                              <Checkbox checked={step.completed} className="w-5 h-5" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                              <p className={`text-sm font-semibold leading-snug ${step.completed ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                                                {step.title}
                                              </p>
                                              {step.description && (
                                                <p className="text-sm text-muted-foreground/75 mt-1.5 leading-relaxed">
                                                  {step.description}
                                                </p>
                                              )}

                                              {/* Source evidence — shown when linked */}
                                              {(isSelected || isMatched) && step.sourceEvidence && (
                                                <div className="mt-3 px-3 py-2.5 rounded-lg bg-secondary/40 border border-border/30">
                                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5">From document</p>
                                                  <p className="text-xs text-muted-foreground/80 leading-relaxed italic">
                                                    "{step.sourceEvidence.slice(0, 220)}{step.sourceEvidence.length > 220 ? "…" : ""}"
                                                  </p>
                                                </div>
                                              )}
                                            </div>

                                            {step.completed
                                              ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                              : isMatched && linkColor
                                              ? <Link2 className={`w-4 h-4 shrink-0 mt-0.5 ${linkColor.label}`} />
                                              : null
                                            }
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    )}

                    {/* Done tasks */}
                    {actionSteps.some(s => s.completed) && (
                      <div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed · {actionSteps.filter(s => s.completed).length} step{actionSteps.filter(s => s.completed).length > 1 ? "s" : ""}
                        </div>
                        <div className="space-y-2.5 opacity-60">
                          {actionSteps.filter(s => s.completed).map(step => (
                            <div
                              key={step.id}
                              ref={el => { if (el) itemRefs.current.set(step.id, el) }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/30 bg-background"
                            >
                              <Checkbox
                                checked
                                className="w-5 h-5 shrink-0"
                                onClick={e => {
                                  e.stopPropagation()
                                  updateActionStep(step.id, false)
                                  updateChecklist({ data: { itemId: step.id, itemType: "actionStep", completed: false } })
                                }}
                              />
                              <p className="text-sm text-muted-foreground line-through flex-1">{step.title}</p>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── DOCS ───────────────────────────────────── */}
                {rightTab === "docs" && (
                  <motion.div
                    key="docs"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2.5"
                  >
                    {requiredDocuments.length === 0 ? (
                      <EmptyPane icon={ShieldCheck} title="No required documents" desc="No documents were identified in this document" />
                    ) : (
                      <>
                        {/* Required pending */}
                        {requiredDocuments.filter(d => d.required && !d.obtained).length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200/60 dark:border-red-800/40 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-widest mb-3">
                              🔴 Still needed
                            </div>
                            <div className="space-y-2.5">
                              {requiredDocuments.filter(d => d.required && !d.obtained).map(doc => (
                                <DocCard
                                  key={doc.id}
                                  doc={doc}
                                  isSelected={selectedItemId === doc.id}
                                  isMatched={matchedItemIds.includes(doc.id)}
                                  activeColor={activeColor}
                                  itemRefs={itemRefs}
                                  onCardClick={() => handleItemClick(doc.id, doc.sourceEvidence)}
                                  onToggle={() => {
                                    const next = !doc.obtained
                                    updateRequiredDoc(doc.id, next)
                                    updateChecklist({ data: { itemId: doc.id, itemType: "requiredDocument", completed: next } })
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Optional */}
                        {requiredDocuments.filter(d => !d.required && !d.obtained).length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
                              ⚪ Optional
                            </div>
                            <div className="space-y-2.5">
                              {requiredDocuments.filter(d => !d.required && !d.obtained).map(doc => (
                                <DocCard
                                  key={doc.id}
                                  doc={doc}
                                  isSelected={selectedItemId === doc.id}
                                  isMatched={matchedItemIds.includes(doc.id)}
                                  activeColor={activeColor}
                                  itemRefs={itemRefs}
                                  onCardClick={() => handleItemClick(doc.id, doc.sourceEvidence)}
                                  onToggle={() => {
                                    const next = !doc.obtained
                                    updateRequiredDoc(doc.id, next)
                                    updateChecklist({ data: { itemId: doc.id, itemType: "requiredDocument", completed: next } })
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Obtained */}
                        {requiredDocuments.filter(d => d.obtained).length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Obtained
                            </div>
                            <div className="space-y-2.5 opacity-60">
                              {requiredDocuments.filter(d => d.obtained).map(doc => (
                                <DocCard
                                  key={doc.id}
                                  doc={doc}
                                  isSelected={selectedItemId === doc.id}
                                  isMatched={matchedItemIds.includes(doc.id)}
                                  activeColor={activeColor}
                                  itemRefs={itemRefs}
                                  onCardClick={() => handleItemClick(doc.id, doc.sourceEvidence)}
                                  onToggle={() => {
                                    const next = !doc.obtained
                                    updateRequiredDoc(doc.id, next)
                                    updateChecklist({ data: { itemId: doc.id, itemType: "requiredDocument", completed: next } })
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* ── RISKS ──────────────────────────────────── */}
                {rightTab === "risks" && (
                  <motion.div
                    key="risks"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    {risks.length === 0 ? (
                      <EmptyPane icon={AlertTriangle} title="No risks identified" desc="No significant risks were found in this document" />
                    ) : (
                      (["high", "medium", "low"] as const).map(severity => {
                        const group = risks.filter(r =>
                          severity === "low"
                            ? r.severity !== "high" && r.severity !== "medium"
                            : r.severity === severity
                        )
                        if (group.length === 0) return null
                        const grpStyle = {
                          high:   "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-800/40",
                          medium: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40",
                          low:    "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/40",
                        }[severity]
                        const sevIcon = { high: "🔴", medium: "🟡", low: "⚪" }[severity]
                        return (
                          <div key={severity}>
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest mb-3 ${grpStyle}`}>
                              <span>{sevIcon}</span> {severity} severity · {group.length} risk{group.length > 1 ? "s" : ""}
                            </div>
                            <div className="space-y-2.5">
                              {group.map(risk => {
                                const isSelected = selectedItemId === risk.id
                                const isMatched  = matchedItemIds.includes(risk.id)
                                const linkColor  = activeColor
                                const sevColor   = { high: "text-red-500", medium: "text-amber-500", low: "text-blue-500" }[
                                  (["high","medium","low"].includes(risk.severity as string) ? risk.severity : "low") as "high" | "medium" | "low"
                                ]
                                return (
                                  <div
                                    key={risk.id}
                                    ref={el => { if (el) itemRefs.current.set(risk.id, el) }}
                                  >
                                    <motion.div
                                      whileTap={{ scale: 0.985 }}
                                      onClick={() => handleItemClick(risk.id, risk.sourceEvidence)}
                                      style={{ touchAction: "manipulation", cursor: "pointer" }}
                                      className={[
                                        "rounded-xl border overflow-hidden transition-all duration-200 group",
                                        isSelected
                                          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                                          : isMatched && linkColor
                                          ? `${linkColor.matchBorder} ${linkColor.matchBg} ring-1 ${linkColor.ring}`
                                          : "border-border/40 bg-background hover:border-border/70 hover:bg-secondary/20",
                                      ].join(" ")}
                                    >
                                      <div className="flex">
                                        <div className={`w-1.5 shrink-0 ${
                                          isSelected ? "bg-primary" : isMatched && linkColor ? linkColor.matchAccent : "bg-transparent group-hover:bg-border/30"
                                        } transition-colors`} />
                                        <div className="flex-1 min-w-0 p-4">
                                          <div className="flex items-start gap-3">
                                            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${sevColor}`} />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold text-foreground leading-snug">{risk.title}</p>
                                              {risk.description && (
                                                <p className="text-sm text-muted-foreground/75 mt-1.5 leading-relaxed">{risk.description}</p>
                                              )}
                                              {(isSelected || isMatched) && risk.sourceEvidence && (
                                                <div className="mt-3 px-3 py-2.5 rounded-lg bg-secondary/40 border border-border/30">
                                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5">From document</p>
                                                  <p className="text-xs text-muted-foreground/80 leading-relaxed italic">
                                                    "{risk.sourceEvidence.slice(0, 220)}{risk.sourceEvidence.length > 220 ? "…" : ""}"
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                            {isMatched && linkColor && (
                                              <Link2 className={`w-4 h-4 shrink-0 mt-0.5 ${linkColor.label}`} />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  </div>
                                )
                              })}
                            </div>
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
    </div>
  )
}

/* ── DocCard sub-component ─────────────────────────────────── */
function DocCard({
  doc, isSelected, isMatched, activeColor, itemRefs, onCardClick, onToggle,
}: {
  doc: DocumentAnalysis["requiredDocuments"][0]
  isSelected: boolean
  isMatched: boolean
  activeColor: typeof COLORS[0] | null
  itemRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
  onCardClick: () => void
  onToggle: () => void
}) {
  return (
    <div ref={el => { if (el) itemRefs.current.set(doc.id, el) }}>
      <motion.div
        whileTap={{ scale: 0.985 }}
        onClick={onCardClick}
        style={{ touchAction: "manipulation", cursor: "pointer" }}
        className={[
          "rounded-xl border overflow-hidden transition-all duration-200 group",
          isSelected
            ? "border-primary/50 bg-primary/5 ring-2 ring-primary/25 shadow-sm"
            : isMatched && activeColor
            ? `${activeColor.matchBorder} ${activeColor.matchBg} ring-1 ${activeColor.ring}`
            : "border-border/40 bg-background hover:border-border/70 hover:bg-secondary/20",
          doc.obtained ? "opacity-55" : "",
        ].join(" ")}
      >
        <div className="flex">
          <div className={`w-1.5 shrink-0 transition-colors ${
            isSelected ? "bg-primary" : isMatched && activeColor ? activeColor.matchAccent : "bg-transparent group-hover:bg-border/30"
          }`} />
          <div className="flex-1 min-w-0 p-4">
            <div className="flex items-start gap-3">
              <div
                onClick={e => { e.stopPropagation(); onToggle() }}
                className="mt-0.5 shrink-0"
                style={{ touchAction: "manipulation" }}
              >
                <Checkbox checked={doc.obtained} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug ${doc.obtained ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                  {doc.name}
                </p>
                {doc.description && (
                  <p className="text-sm text-muted-foreground/75 mt-1.5 leading-relaxed">{doc.description}</p>
                )}
                {(isSelected || isMatched) && doc.sourceEvidence && (
                  <div className="mt-3 px-3 py-2.5 rounded-lg bg-secondary/40 border border-border/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5">From document</p>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed italic">
                      "{doc.sourceEvidence.slice(0, 220)}{doc.sourceEvidence.length > 220 ? "…" : ""}"
                    </p>
                  </div>
                )}
              </div>
              {doc.obtained
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                : isMatched && activeColor
                ? <Link2 className={`w-4 h-4 shrink-0 mt-0.5 ${activeColor.label}`} />
                : null
              }
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Empty state ───────────────────────────────────────────── */
function EmptyPane({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Icon className="w-9 h-9 text-muted-foreground/20 mb-3" />
      <p className="text-sm font-semibold text-muted-foreground/60">{title}</p>
      <p className="text-xs text-muted-foreground/40 mt-1">{desc}</p>
    </div>
  )
}
