import React, { useEffect, useState, useCallback, useRef } from "react"
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
  ArrowRight, ShieldCheck, Clock, TrendingUp, BookOpen,
  HelpCircle, ChevronDown, Lightbulb, Eye, Shield, Zap,
  AlignLeft, MessageSquare, X, Flag, Package, Lock,
  FolderOpen, Mail, CheckSquare, Copy, Check,
  Bookmark, BookmarkCheck, Share2, Download, Upload, Layers
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { buildExportText, downloadTextFile, canNativeShare, nativeShare } from "@/lib/exportAnalysis"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge"
import { EvidenceTooltip } from "@/components/shared/EvidenceTooltip"
import type { DocumentAnalysis, PlainEnglishSections, KeyTerm, ActionPack } from "@workspace/api-client-react"
import { triggerPrint } from "@/lib/print"
import { isNative } from "@/lib/platform"
import { getApiBaseUrl } from "@/lib/api"
import { saveAnalysis, updateSaved } from "@/lib/savedAnalyses"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeCard from "@/components/UpgradeCard"

const TABS = [
  { id: "plain-english",   label: "Plain English",   icon: BookOpen                                    },
  { id: "source-sections", label: "Source Sections", icon: AlignLeft                                   },
  { id: "summary",         label: "Overview",         icon: FileText                                   },
  { id: "missing",         label: "What's Missing",   icon: XCircle                                   },
  { id: "checklist",       label: "Checklist",        icon: ListTodo,    countKey: "actionSteps"       },
  { id: "documents",       label: "Required Docs",    icon: ShieldCheck, countKey: "requiredDocuments" },
  { id: "deadlines",       label: "Deadlines",        icon: Calendar,    countKey: "deadlines"         },
  { id: "risks",           label: "Risks & Notes",    icon: AlertTriangle                              },
  { id: "key-terms",       label: "Key Terms",        icon: Flag,          countKey: "keyTerms"         },
  { id: "action-pack",    label: "Action Pack",      icon: Package                                      },
]

export default function Analyze() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const demoId = new URLSearchParams(searchString).get("demo") as string | null
  const tabParam = new URLSearchParams(searchString).get("tab")

  const { analysis, documentTypeHint, setAnalysis, clearAnalysis, updateActionStep, updateRequiredDoc } = useAnalysisContext()
  const [activeTab, setActiveTab] = useState(tabParam ?? "plain-english")
  const [savedId, setSavedId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  const { entitlements, loading: entitlementsLoading } = useEntitlements()
  const isPro = entitlements?.plan === "pro" || entitlements?.plan === "team"
  const PRO_ONLY_TABS = new Set(["source-sections", "missing", "checklist", "documents", "deadlines", "risks"])
  // COMPETITION/TESTING MODE: gating bypassed — re-enable after competition by restoring the line below:
  // const isTabLocked = (tabId: string) => PRO_ONLY_TABS.has(tabId) && !isPro && !entitlementsLoading
  const isTabLocked = (_tabId: string) => false

  const prevDemoIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (demoId && prevDemoIdRef.current !== null && prevDemoIdRef.current !== demoId) {
      clearAnalysis()
    }
    prevDemoIdRef.current = demoId
  }, [demoId, clearAnalysis])

  const { data: demoData, isLoading, error: demoError } = useGetDemoDocument(
    demoId as any,
    { query: { enabled: !!demoId && !analysis } }
  )
  const { mutate: updateChecklist } = useUpdateChecklist()

  useEffect(() => { if (demoData?.analysis && !analysis) setAnalysis(demoData.analysis) }, [demoData, analysis, setAnalysis])
  useEffect(() => { if (!demoId && !analysis) setLocation("/import") }, [demoId, analysis, setLocation])
  useEffect(() => {
    if (analysis?.title) {
      document.title = `${analysis.title} — PlainPath`
      return () => { document.title = "PlainPath" }
    }
  }, [analysis?.title])

  if (isLoading || (!analysis && demoId)) return <LoadingScreen />
  if (demoError) return <ErrorScreen onBack={() => setLocation("/import")} />
  if (!analysis) return null

  const actionSteps = analysis.actionSteps ?? []
  const requiredDocuments = analysis.requiredDocuments ?? []
  const deadlines = analysis.deadlines ?? []
  const risks = analysis.risks ?? []
  const followUpQuestions = analysis.followUpQuestions ?? []

  const totalItems = actionSteps.length + requiredDocuments.length
  const doneItems = actionSteps.filter(s => s.completed).length + requiredDocuments.filter(d => d.obtained).length
  const progress = totalItems === 0 ? 100 : Math.round((doneItems / totalItems) * 100)

  const handleActionToggle = (id: string, completed: boolean) => {
    updateActionStep(id, completed)
    updateChecklist({ data: { itemId: id, itemType: "actionStep", completed } })
  }
  const handleDocToggle = (id: string, obtained: boolean) => {
    updateRequiredDoc(id, obtained)
    updateChecklist({ data: { itemId: id, itemType: "requiredDocument", completed: obtained } })
  }

  const hardDeadlines = deadlines.filter(d => d.isHard)
  const highRisks = risks.filter(r => r.severity === "high")
  const incompleteHigh = actionSteps.filter(s => s.priority === "high" && !s.completed)

  // Missing count badge for the tab
  const missingCount = incompleteHigh.length + requiredDocuments.filter(d => d.required && !d.obtained).length

  const handleSave = () => {
    if (!analysis) return
    const triggerFeedback = () => {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2200)
    }
    if (savedId) {
      updateSaved(savedId, { analysis })
      triggerFeedback()
    } else {
      const saved = saveAnalysis({
        title: analysis.title,
        sourceKind: demoId ? "demo" : "document",
        documentTypeHint,
        analysis,
      })
      setSavedId(saved.id)
      triggerFeedback()
    }
  }

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
                onClick={handleSave}
                style={{ touchAction: "manipulation" }}
                className={`gap-1.5 text-xs h-8 border-border/60 transition-all ${
                  justSaved
                    ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                    : "bg-card"
                }`}
              >
                {justSaved
                  ? <BookmarkCheck className="w-3.5 h-3.5" />
                  : <Bookmark className="w-3.5 h-3.5" />
                }
                <span className="hidden sm:inline">
                  {justSaved ? "Saved" : savedId ? "Update" : "Save"}
                </span>
              </Button>
              <ExportMenu analysis={analysis} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── At-a-glance strip ───────────────────────── */}
        <div className="no-print mt-4 sm:mt-6 mb-5 sm:mb-7">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5">
            <StatPill label="Steps" value={actionSteps.length} onClick={() => setActiveTab("checklist")} />
            <StatPill label="Docs" value={requiredDocuments.length} onClick={() => setActiveTab("documents")} />
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
              const isLocked = isTabLocked(tab.id)
              return (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  style={{ touchAction: "manipulation" }}
                  className={`relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap outline-none flex-shrink-0 min-h-[44px] ${
                    activeTab === tab.id
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {isLocked && (
                    <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                  )}
                  {count != null && count > 0 && !isLocked && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${activeTab === tab.id ? "bg-background/20 text-background" : "bg-border/50 text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                  {isMissing && missingCount > 0 && activeTab !== "missing" && !isLocked && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                      {missingCount > 9 ? "9+" : missingCount}
                    </span>
                  )}
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>

          {/* ── Content pane ────────────────────────────── */}
          <div className="no-print bg-card rounded-3xl border border-border/30 shadow-lg shadow-black/[0.04] dark:shadow-black/20 overflow-hidden min-h-[400px] sm:min-h-[540px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.14 }}
                className="p-4 sm:p-7 md:p-10"
              >

                {activeTab === "plain-english"   && <PlainEnglishTab analysis={analysis} onTabChange={setActiveTab} />}
                {activeTab === "source-sections" && (isTabLocked("source-sections")
                  ? <UpgradeCard title="Source Sections — Pro" description="See exactly which part of the original document backs every requirement, risk, and deadline." />
                  : <><GuidedReviewBanner href={demoId ? `/guided-review?demo=${demoId}&tab=tasks` : "/guided-review?tab=tasks"} label="Review each document section alongside its linked tasks" /><SourceSectionsTab analysis={analysis} documentTypeHint={documentTypeHint} /></>)}
                {activeTab === "summary"         && <SummaryTab   analysis={analysis} onTabChange={setActiveTab} />}
                {activeTab === "missing"         && (isTabLocked("missing")
                  ? <UpgradeCard title="What's Missing — Pro" description="Instantly spot what's incomplete, ambiguous, or absent so nothing slips through the cracks." />
                  : <><GuidedReviewBanner href={demoId ? `/guided-review?demo=${demoId}&tab=tasks` : "/guided-review?tab=tasks"} label="Step through each blocking item with its source section alongside" /><WhatsMissingTab analysis={analysis} onActionToggle={handleActionToggle} onDocToggle={handleDocToggle} onTabChange={setActiveTab} /></>)}
                {activeTab === "checklist"       && (isTabLocked("checklist")
                  ? <UpgradeCard title="Checklist — Pro" description="A prioritized to-do list of every action step, ranked high / medium / low." />
                  : <><GuidedReviewBanner href={demoId ? `/guided-review?demo=${demoId}&tab=tasks` : "/guided-review?tab=tasks"} label="Walk through each action step linked back to its source section" /><ChecklistTab  analysis={analysis} onToggle={handleActionToggle} documentTypeHint={documentTypeHint} /></>)}
                {activeTab === "documents"       && (isTabLocked("documents")
                  ? <UpgradeCard title="Required Documents — Pro" description="Track every document you need to gather, with built-in completion tracking." />
                  : <><GuidedReviewBanner href={demoId ? `/guided-review?demo=${demoId}&tab=docs` : "/guided-review?tab=docs"} label="Review required documents traced to their source sections" /><DocumentsTab  analysis={analysis} onToggle={handleDocToggle} /></>)}
                {activeTab === "deadlines"       && (isTabLocked("deadlines")
                  ? <UpgradeCard title="Deadlines — Pro" description="All hard deadlines in one place — formatted for easy calendar entry." />
                  : <DeadlinesTab  analysis={analysis} />)}
                {activeTab === "risks"           && (isTabLocked("risks")
                  ? <UpgradeCard title="Risks & Notes — Pro" description="Understand what you're agreeing to and what could go wrong before you sign or submit." />
                  : <><GuidedReviewBanner href={demoId ? `/guided-review?demo=${demoId}&tab=risks` : "/guided-review?tab=risks"} label="See each risk traced back to the section it came from" /><RisksTab      analysis={analysis} /></>)}
                {activeTab === "key-terms"       && <KeyTermsTab   analysis={analysis} />}
                {activeTab === "action-pack"     && <ActionPackTab analysis={analysis} />}

              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs.Root>

        {/* ── Print-only report (hidden in screen, shown in print) ── */}
        <PrintReport analysis={analysis} documentTypeHint={documentTypeHint} />

      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   GUIDED REVIEW BANNER
──────────────────────────────────────────────── */
function GuidedReviewBanner({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{ touchAction: "manipulation" }}
      className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/35 transition-all group"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors shrink-0">
        <Layers className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-primary">Guided Review Mode</p>
        <p className="text-xs text-muted-foreground/70 truncate">{label}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-primary/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
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
  const highPriority = (analysis.actionSteps ?? []).filter(s => s.priority === "high" && !s.completed)
  const hardDeadlines = (analysis.deadlines ?? []).filter(d => d.isHard)
  const highRisks = (analysis.risks ?? []).filter(r => r.severity === "high")
  const urgentCount = highPriority.length + hardDeadlines.length + highRisks.length

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-0.5">Document Overview</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{analysis.documentType}</p>
      </div>

      {/* Blue: What this document is */}
      <div className="rounded-2xl border p-5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-widest">What this document is</h3>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Action Steps",   value: (analysis.actionSteps ?? []).length,       tab: "checklist", warn: false },
          { label: "Required Docs",  value: (analysis.requiredDocuments ?? []).length,  tab: "documents", warn: false },
          { label: "Hard Deadlines", value: hardDeadlines.length,               tab: "deadlines", warn: true  },
        ].map(({ label, value, tab, warn }) => (
          <button key={tab} onClick={() => onTabChange(tab)} style={{ touchAction: "manipulation" }} className="text-left group">
            <div className={`p-2.5 sm:p-4 rounded-2xl border transition-all group-hover:shadow-md ${warn ? "bg-red-50/60 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/40 group-hover:border-red-300" : "bg-secondary/30 border-transparent group-hover:border-primary/20"}`}>
              <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1 sm:mb-2 ${warn ? "text-red-600/70 dark:text-red-400/80" : "text-muted-foreground"}`}>{label}</p>
              <p className={`text-2xl sm:text-3xl font-display font-bold ${warn ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Red: Immediate attention */}
      {urgentCount > 0 && (
        <div className="rounded-2xl border border-red-200/60 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-red-200/50 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/30 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-700 dark:text-red-400">Needs immediate attention</span>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">{urgentCount}</span>
          </div>
          <div className="p-4 space-y-2">
            {highPriority.slice(0, 3).map(step => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-red-950/30 border border-red-200/40 dark:border-red-900/30">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.category}</p>
                </div>
                <button onClick={() => onTabChange("checklist")} style={{ touchAction: "manipulation" }} className="text-xs text-primary font-semibold shrink-0 hover:underline">Go →</button>
              </div>
            ))}
            {hardDeadlines.slice(0, 2).map(dl => (
              <div key={dl.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-red-950/30 border border-red-200/40 dark:border-red-900/30">
                <Clock className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{dl.title}</p>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">{dl.date}</p>
                </div>
                <button onClick={() => onTabChange("deadlines")} style={{ touchAction: "manipulation" }} className="text-xs text-primary font-semibold shrink-0 hover:underline">Go →</button>
              </div>
            ))}
            {highRisks.slice(0, 2).map(risk => (
              <div key={risk.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-red-950/30 border border-red-200/40 dark:border-red-900/30">
                <XCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{risk.title}</p>
                  <p className="text-xs text-muted-foreground">High severity risk</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4 flex gap-3">
            <button onClick={() => onTabChange("missing")} style={{ touchAction: "manipulation" }} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View what's missing <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Amber: Needs your input */}
      {(analysis.followUpQuestions ?? []).length > 0 && (
        <div className="rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-200/50 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/30 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Needs your input</span>
          </div>
          <div className="p-4 space-y-2">
            {(analysis.followUpQuestions ?? []).map(q => (
              <div key={q.id} className="flex gap-3 p-3.5 rounded-xl bg-white/70 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-900/30">
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
   PLAIN ENGLISH TAB
──────────────────────────────────────────────── */
const PE_CARDS: {
  key: keyof PlainEnglishSections
  label: string
  desc: string
  icon: React.ElementType
  accent: string
}[] = [
  { key: "whatItIs",      label: "What this document is",         desc: "The type and purpose of this document",              icon: FileText,    accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40" },
  { key: "whatItSays",    label: "What it is saying",             desc: "The main points and message of the document",        icon: BookOpen,    accent: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-900/40" },
  { key: "whatItAsks",    label: "What it asks from you",         desc: "The actions, submissions, or payments required",     icon: ListTodo,    accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40" },
  { key: "obligations",   label: "What you may be agreeing to",   desc: "Responsibilities, liabilities, or commitments",      icon: Shield,      accent: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40" },
  { key: "payAttentionTo",label: "What to pay close attention to", desc: "Key clauses, dates, or conditions not to overlook", icon: Eye,         accent: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-900/40" },
  { key: "nextSteps",     label: "What to do next",               desc: "The first things you should do after reading this",  icon: ArrowRight,  accent: "text-primary bg-primary/5 border-primary/20" },
]

function PlainEnglishTab({ analysis, onTabChange }: { analysis: DocumentAnalysis; onTabChange: (t: string) => void }) {
  const pe = analysis.plainEnglish

  if (!pe) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold">Plain English Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">A plain-English breakdown of what this document is, says, and requires.</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-secondary/20 p-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Plain English breakdown not available for this document.<br />Re-analyze the document to generate it.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => onTabChange("summary")}>View Summary instead</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Plain English Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">Everything you need to know about this document — in plain, jargon-free language.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {PE_CARDS.map(({ key, label, icon: Icon, accent }) => {
          const text = pe[key]
          if (!text) return null
          return (
            <div key={key} className={`rounded-2xl border p-5 ${accent}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-widest">{label}</h3>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onTabChange("checklist")}>
          <ListTodo className="w-3.5 h-3.5" />
          View Action Steps
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onTabChange("missing")}>
          <XCircle className="w-3.5 h-3.5" />
          What's Missing
        </Button>
      </div>
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
        <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 overflow-hidden">
          <div className="px-5 py-3 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-200/50 dark:border-blue-900/30 flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">Next best action</span>
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
            <div className="px-5 pb-4">
              <button onClick={() => onTabChange("checklist")} className="text-xs text-blue-700 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">
                +{pendingHigh.length - 1} more blocking step{pendingHigh.length - 1 !== 1 ? "s" : ""} in Checklist <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Blocking steps (remaining) ────────────── */}
      {pendingHigh.length > 1 && (
        <MissingSection title="Blocking — must complete first" badge={pendingHigh.length} badgeColor="red" sectionColor="red" icon={<XCircle className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {pendingHigh.slice(1).map(step => (
              <ActionStepRow key={step.id} step={step} onToggle={onActionToggle} compact />
            ))}
          </div>
        </MissingSection>
      )}

      {/* ── Required docs not obtained ────────────── */}
      {pendingDocs.length > 0 && (
        <MissingSection title="Documents not yet gathered" badge={pendingDocs.length} badgeColor="amber" sectionColor="green" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pendingDocs.map(doc => <DocRow key={doc.id} doc={doc} onToggle={onDocToggle} compact />)}
          </div>
        </MissingSection>
      )}

      {/* ── Hard deadlines ────────────────────────── */}
      {hardDls.length > 0 && (
        <MissingSection title="Hard deadlines" sectionColor="red" icon={<Calendar className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {hardDls.map(dl => (
              <div key={dl.id} className="flex gap-3 p-3.5 rounded-xl bg-white/70 dark:bg-red-950/30 border border-red-200/40 dark:border-red-900/30">
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
        <MissingSection title="High-severity risks" sectionColor="red" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {highRisks.map(risk => (
              <div key={risk.id} className="p-3.5 rounded-xl bg-white/70 dark:bg-red-950/30 border border-red-200/40 dark:border-red-900/30">
                <p className="font-bold text-sm text-foreground mb-1">{risk.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{risk.description}</p>
              </div>
            ))}
          </div>
        </MissingSection>
      )}

      {/* ── Medium-priority pending ───────────────── */}
      {pendingMed.length > 0 && (
        <MissingSection title="Also pending (medium priority)" badge={pendingMed.length} sectionColor="amber" icon={<ListTodo className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {pendingMed.map(step => <ActionStepRow key={step.id} step={step} onToggle={onActionToggle} compact />)}
          </div>
        </MissingSection>
      )}

    </div>
  )
}

/* ────────────────────────────────────────────────
   EXPLAIN PANEL
──────────────────────────────────────────────── */
interface ExplainResult {
  meaning: string
  requires: string
  risks: string
  whyItMatters: string
}

function ExplainPanel({ result, loading, onClose }: { result: ExplainResult | null; loading: boolean; onClose: () => void }) {
  const cards: { label: string; icon: React.ElementType; text: string; color: string }[] = result ? [
    { label: "What this means",        icon: Eye,      text: result.meaning,      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40" },
    { label: "What you need to do",    icon: ListTodo, text: result.requires,     color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Why it matters",         icon: Zap,      text: result.whyItMatters, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40" },
    { label: "Risk if skipped",        icon: Shield,   text: result.risks,        color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40" },
  ] : []

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.16 }}
      className="mt-2 mb-1 rounded-2xl border border-primary/20 bg-primary/[0.03] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-primary/15 bg-primary/[0.06]">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Plain-English Explanation</span>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">Dismiss</button>
      </div>
      {loading ? (
        <div className="p-5 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Generating explanation…</span>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map(({ label, icon: Icon, text, color }) => (
            <div key={label} className="rounded-xl p-3 border border-border/40 bg-card">
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide mb-2 ${color}`}>
                <Icon className="w-3 h-3" />
                {label}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ────────────────────────────────────────────────
   CHECKLIST TAB
──────────────────────────────────────────────── */
function ChecklistTab({
  analysis, onToggle, documentTypeHint,
}: {
  analysis: DocumentAnalysis
  onToggle: (id: string, done: boolean) => void
  documentTypeHint?: string | null
}) {
  const remaining = analysis.actionSteps.filter(s => !s.completed).length
  const [explainId, setExplainId] = useState<string | null>(null)
  const [explainMap, setExplainMap] = useState<Record<string, ExplainResult | "loading">>({})

  const handleExplain = useCallback(async (step: DocumentAnalysis["actionSteps"][0]) => {
    if (explainId === step.id) { setExplainId(null); return }
    setExplainId(step.id)
    if (explainMap[step.id] && explainMap[step.id] !== "loading") return
    setExplainMap(prev => ({ ...prev, [step.id]: "loading" }))
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/documents/explain-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionTitle: step.title, sectionContent: step.description, documentTypeHint }),
      })
      const data = await res.json()
      if (data.explanation) {
        setExplainMap(prev => ({ ...prev, [step.id]: data.explanation as ExplainResult }))
      } else {
        setExplainMap(prev => ({ ...prev, [step.id]: { meaning: "Could not load explanation.", requires: "", risks: "", whyItMatters: "" } }))
      }
    } catch {
      setExplainMap(prev => ({ ...prev, [step.id]: { meaning: "Could not load explanation.", requires: "", risks: "", whyItMatters: "" } }))
    }
  }, [explainId, explainMap, documentTypeHint])

  const highSteps = analysis.actionSteps.filter(s => s.priority === "high"   && !s.completed)
  const medSteps  = analysis.actionSteps.filter(s => s.priority === "medium" && !s.completed)
  const lowSteps  = analysis.actionSteps.filter(s => s.priority === "low"    && !s.completed)
  const doneSteps = analysis.actionSteps.filter(s => s.completed)

  const renderStep = (step: DocumentAnalysis["actionSteps"][0], i: number) => (
    <div key={step.id}>
      <ActionStepRow step={step} index={i + 1} onToggle={onToggle} onExplain={() => handleExplain(step)} explainActive={explainId === step.id} />
      <AnimatePresence>
        {explainId === step.id && (
          <ExplainPanel
            result={explainMap[step.id] === "loading" ? null : explainMap[step.id] as ExplainResult | null}
            loading={explainMap[step.id] === "loading"}
            onClose={() => setExplainId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Action Steps</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {remaining === 0 ? "All steps complete." : `${remaining} of ${analysis.actionSteps.length} remaining — check off items as you complete them`}
        </p>
      </div>
      {analysis.actionSteps.length === 0
        ? <EmptyState icon={CheckCircle2} title="No action steps found" desc="This document doesn't appear to require specific actions." />
        : (
          <div className="space-y-4">
            {/* Blue intro helper */}
            <div className="rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 px-4 py-3 flex items-start gap-3">
              <ListTodo className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                All steps identified in this document — check them off as you complete them. Click <span className="font-bold">Explain this</span> on any step for a plain-English breakdown.
              </p>
            </div>

            {/* Red: High priority */}
            {highSteps.length > 0 && (
              <div className="rounded-2xl border border-red-200/50 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/15 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200/40 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/30">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">High Priority</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">{highSteps.length}</span>
                </div>
                <div className="p-3 space-y-1">
                  {highSteps.map((step, i) => renderStep(step, i + 1))}
                </div>
              </div>
            )}

            {/* Amber: Medium priority */}
            {medSteps.length > 0 && (
              <div className="rounded-2xl border border-amber-200/50 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/15 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200/40 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Medium Priority</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">{medSteps.length}</span>
                </div>
                <div className="p-3 space-y-1">
                  {medSteps.map((step, i) => renderStep(step, i + 1))}
                </div>
              </div>
            )}

            {/* Neutral: Low priority */}
            {lowSteps.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-secondary/20">
                  <ListTodo className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lower Priority</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground">{lowSteps.length}</span>
                </div>
                <div className="p-3 space-y-1">
                  {lowSteps.map((step, i) => renderStep(step, i + 1))}
                </div>
              </div>
            )}

            {/* Green: Completed */}
            {doneSteps.length > 0 && (
              <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/15 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-200/40 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-950/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Completed</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">{doneSteps.length}</span>
                </div>
                <div className="p-3 space-y-1">
                  {doneSteps.map((step, i) => renderStep(step, i + 1))}
                </div>
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}

/* ────────────────────────────────────────────────
   DOCUMENTS TAB
──────────────────────────────────────────────── */
function DocumentsTab({ analysis, onToggle }: { analysis: DocumentAnalysis; onToggle: (id: string, done: boolean) => void }) {
  const requiredPending  = analysis.requiredDocuments.filter(d => d.required && !d.obtained)
  const requiredObtained = analysis.requiredDocuments.filter(d => d.required && d.obtained)
  const optionalDocs     = analysis.requiredDocuments.filter(d => !d.required)
  const remaining = requiredPending.length
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Required Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {remaining === 0 ? "All required documents obtained." : `${remaining} of ${analysis.requiredDocuments.filter(d => d.required).length} still needed — gather these before submitting`}
        </p>
      </div>
      {analysis.requiredDocuments.length === 0
        ? <EmptyState icon={ShieldCheck} title="No documents required" desc="No additional files are needed for this document." />
        : (
          <div className="space-y-4">
            {/* Amber/Red: Required, not yet obtained */}
            {requiredPending.length > 0 && (
              <div className="rounded-2xl border border-amber-200/50 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/15 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200/40 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Still needed</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">{requiredPending.length}</span>
                </div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requiredPending.map(doc => <DocRow key={doc.id} doc={doc} onToggle={onToggle} />)}
                </div>
              </div>
            )}

            {/* Neutral: Optional documents */}
            {optionalDocs.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-secondary/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Optional / Supporting</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground">{optionalDocs.length}</span>
                </div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {optionalDocs.map(doc => <DocRow key={doc.id} doc={doc} onToggle={onToggle} />)}
                </div>
              </div>
            )}

            {/* Green: Required and obtained */}
            {requiredObtained.length > 0 && (
              <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/15 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-200/40 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-950/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Gathered & confirmed</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">{requiredObtained.length}</span>
                </div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requiredObtained.map(doc => <DocRow key={doc.id} doc={doc} onToggle={onToggle} />)}
                </div>
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}

/* ────────────────────────────────────────────────
   DEADLINES TAB
──────────────────────────────────────────────── */
function DeadlineCard({ dl, accentRed }: { dl: DocumentAnalysis["deadlines"][0]; accentRed: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border ${accentRed ? "bg-white/70 dark:bg-red-950/30 border-red-200/40 dark:border-red-900/30" : "bg-white/70 dark:bg-amber-950/30 border-amber-200/40 dark:border-amber-900/30"}`}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <p className={`text-sm font-bold ${accentRed ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>{dl.date}</p>
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
  )
}

function DeadlinesTab({ analysis }: { analysis: DocumentAnalysis }) {
  const hardDls = analysis.deadlines.filter(d => d.isHard)
  const softDls = analysis.deadlines.filter(d => !d.isHard)
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Timeline & Deadlines</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {hardDls.length > 0 ? `${hardDls.length} hard deadline${hardDls.length !== 1 ? "s" : ""} — missing these may disqualify your submission` : "No hard deadlines identified — treat all dates as approximate"}
        </p>
      </div>
      {analysis.deadlines.length === 0
        ? <EmptyState icon={Calendar} title="No deadlines found" desc="No specific dates were mentioned in this document." />
        : (
          <div className="space-y-4">
            {/* Red: Hard deadlines */}
            {hardDls.length > 0 && (
              <div className="rounded-2xl border border-red-200/50 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/15 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200/40 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/30">
                  <Clock className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">Hard Deadlines — do not miss</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">{hardDls.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {hardDls.map(dl => <DeadlineCard key={dl.id} dl={dl} accentRed />)}
                </div>
              </div>
            )}

            {/* Amber: Watch dates / soft deadlines */}
            {softDls.length > 0 && (
              <div className="rounded-2xl border border-amber-200/50 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/15 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200/40 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/30">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Watch Dates — review carefully</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">{softDls.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {softDls.map(dl => <DeadlineCard key={dl.id} dl={dl} accentRed={false} />)}
                </div>
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}

/* ────────────────────────────────────────────────
   RISKS TAB
──────────────────────────────────────────────── */
function RiskCard({ risk }: { risk: DocumentAnalysis["risks"][0] }) {
  const isHigh   = risk.severity === "high"
  const isMedium = risk.severity === "medium"
  const cardCls = isHigh
    ? "bg-white/70 dark:bg-red-950/30 border border-red-200/40 dark:border-red-900/30"
    : isMedium
      ? "bg-white/70 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-900/30"
      : "bg-card border border-border/50"
  const iconCls = isHigh ? "bg-red-100 dark:bg-red-950/60" : isMedium ? "bg-amber-50 dark:bg-amber-950/50" : "bg-secondary"
  const iconColor = isHigh ? "text-red-600 dark:text-red-400" : isMedium ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
  return (
    <div className={`rounded-2xl p-5 ${cardCls}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconCls}`}>
          <AlertTriangle className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground leading-snug">{risk.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{risk.description}</p>
          {risk.sourceEvidence && (
            <div className="mt-3">
              <EvidenceTooltip text={risk.sourceEvidence} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RisksTab({ analysis }: { analysis: DocumentAnalysis }) {
  const highRisks   = analysis.risks.filter(r => r.severity === "high")
  const medRisks    = analysis.risks.filter(r => r.severity === "medium")
  const lowRisks    = analysis.risks.filter(r => r.severity === "low" || (r.severity !== "high" && r.severity !== "medium"))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Risks & Warnings</h2>
        <p className="text-sm text-muted-foreground mt-1">Potential issues that could delay, block, or invalidate your submission</p>
      </div>

      {analysis.risks.length === 0
        ? <EmptyState icon={AlertTriangle} title="No major risks detected" desc="No significant risks were identified in this document." />
        : (
          <div className="space-y-4">
            {/* Red: High severity */}
            {highRisks.length > 0 && (
              <div className="rounded-2xl border border-red-200/50 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/15 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200/40 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">High Severity — act now</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">{highRisks.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {highRisks.map(r => <RiskCard key={r.id} risk={r} />)}
                </div>
              </div>
            )}

            {/* Amber: Medium severity */}
            {medRisks.length > 0 && (
              <div className="rounded-2xl border border-amber-200/50 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/15 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200/40 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Medium Severity — review carefully</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">{medRisks.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {medRisks.map(r => <RiskCard key={r.id} risk={r} />)}
                </div>
              </div>
            )}

            {/* Slate/neutral: Low severity */}
            {lowRisks.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-secondary/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lower Severity — for your awareness</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground">{lowRisks.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {lowRisks.map(r => <RiskCard key={r.id} risk={r} />)}
                </div>
              </div>
            )}
          </div>
        )
      }

      {/* Blue: Clarifications needed */}
      {analysis.followUpQuestions.length > 0 && (
        <div className="rounded-2xl border border-blue-200/50 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/15 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-200/40 dark:border-blue-900/30 bg-blue-50/60 dark:bg-blue-950/30">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">Clarifications needed</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">{analysis.followUpQuestions.length}</span>
          </div>
          <div className="p-4 space-y-2.5">
            <p className="text-xs text-blue-700/70 dark:text-blue-400/70">These ambiguous areas may affect which steps or requirements apply to your situation.</p>
            {analysis.followUpQuestions.map(q => (
              <div key={q.id} className="flex gap-3 p-3.5 rounded-xl bg-white/70 dark:bg-blue-950/30 border border-blue-200/40 dark:border-blue-900/30">
                <AlertCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
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
  title, badge, badgeColor = "default", sectionColor = "default", icon, children,
}: {
  title: string
  badge?: number
  badgeColor?: "red" | "amber" | "green" | "default"
  sectionColor?: "red" | "amber" | "green" | "blue" | "default"
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  const badgeColors = {
    red:     "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400",
    amber:   "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
    green:   "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
    default: "bg-secondary text-muted-foreground",
  }
  const sectionStyles = {
    red:     { wrap: "rounded-2xl border border-red-200/50 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/15 overflow-hidden", header: "flex items-center gap-2 px-4 py-3 border-b border-red-200/40 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/30",     iconCls: "text-red-500 dark:text-red-400",     titleCls: "text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400",     body: "p-4" },
    amber:   { wrap: "rounded-2xl border border-amber-200/50 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/15 overflow-hidden", header: "flex items-center gap-2 px-4 py-3 border-b border-amber-200/40 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/30", iconCls: "text-amber-500 dark:text-amber-400",   titleCls: "text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400",   body: "p-4" },
    green:   { wrap: "rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/15 overflow-hidden", header: "flex items-center gap-2 px-4 py-3 border-b border-emerald-200/40 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-950/30", iconCls: "text-emerald-500 dark:text-emerald-400", titleCls: "text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400", body: "p-4" },
    blue:    { wrap: "rounded-2xl border border-blue-200/50 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/15 overflow-hidden",   header: "flex items-center gap-2 px-4 py-3 border-b border-blue-200/40 dark:border-blue-900/30 bg-blue-50/60 dark:bg-blue-950/30",     iconCls: "text-blue-500 dark:text-blue-400",   titleCls: "text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400",   body: "p-4" },
    default: { wrap: "",  header: "flex items-center gap-2 mb-3", iconCls: "text-muted-foreground/50", titleCls: "text-xs font-bold uppercase tracking-widest text-muted-foreground", body: "" },
  }
  const sc = sectionStyles[sectionColor]
  return (
    <div className={sc.wrap}>
      <div className={sc.header}>
        <span className={sc.iconCls}>{icon}</span>
        <h3 className={sc.titleCls}>{title}</h3>
        {badge != null && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColors[badgeColor]}`}>{badge}</span>
        )}
      </div>
      <div className={sc.body}>
        {children}
      </div>
    </div>
  )
}

const PRIORITY_STYLES = {
  high:   { bar: "priority-bar-high", bg: "bg-red-50/30"   },
  medium: { bar: "priority-bar-med",  bg: "bg-amber-50/20" },
  low:    { bar: "priority-bar-low",  bg: ""               },
} as const

function ActionStepRow({
  step, index, onToggle, compact = false, onExplain, explainActive = false,
}: {
  step: DocumentAnalysis["actionSteps"][0]
  index?: number
  onToggle: (id: string, done: boolean) => void
  compact?: boolean
  onExplain?: () => void
  explainActive?: boolean
}) {
  const style = PRIORITY_STYLES[step.priority as keyof typeof PRIORITY_STYLES] ?? PRIORITY_STYLES.low

  return (
    <div className={`group flex items-start gap-3.5 rounded-xl border transition-all ${
      compact ? "p-3" : "p-4"
    } ${
      step.completed
        ? "bg-secondary/20 border-border/20 opacity-55 priority-bar-low"
        : `${style.bar} ${style.bg} bg-card border-border/40 hover:border-primary/20 hover:shadow-sm`
    } ${explainActive && !compact ? "border-primary/30 shadow-sm" : ""}`}>
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
          {!compact && onExplain && (
            <button
              onClick={onExplain}
              style={{ touchAction: "manipulation" }}
              className={`ml-auto flex items-center gap-1 text-[11px] font-semibold transition-colors min-h-[32px] px-2 rounded-lg ${
                explainActive
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
              }`}
            >
              <HelpCircle className="w-3 h-3" />
              <span>Explain this</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${explainActive ? "rotate-180" : ""}`} />
            </button>
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

interface SourceExplainResult {
  meaning: string
  requires: string
  whyItMatters: string
  risks: string
  questionsToAsk: string
}

const SECTION_CARD_COLORS = [
  { badge: "bg-blue-500",    label: "text-blue-600 dark:text-blue-400",    bar: "bg-blue-500",    hover: "hover:border-blue-200/60 dark:hover:border-blue-800/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/10",    active: "border-blue-300/60 dark:border-blue-700/50 bg-blue-50/40 dark:bg-blue-950/25 ring-1 ring-blue-200/40 dark:ring-blue-800/30"    },
  { badge: "bg-violet-500",  label: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500",  hover: "hover:border-violet-200/60 dark:hover:border-violet-800/40 hover:bg-violet-50/20 dark:hover:bg-violet-950/10", active: "border-violet-300/60 dark:border-violet-700/50 bg-violet-50/40 dark:bg-violet-950/25 ring-1 ring-violet-200/40 dark:ring-violet-800/30" },
  { badge: "bg-amber-500",   label: "text-amber-600 dark:text-amber-400",   bar: "bg-amber-500",   hover: "hover:border-amber-200/60 dark:hover:border-amber-800/40 hover:bg-amber-50/20 dark:hover:bg-amber-950/10",   active: "border-amber-300/60 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/25 ring-1 ring-amber-200/40 dark:ring-amber-800/30"   },
  { badge: "bg-emerald-500", label: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", hover: "hover:border-emerald-200/60 dark:hover:border-emerald-800/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10", active: "border-emerald-300/60 dark:border-emerald-700/50 bg-emerald-50/40 dark:bg-emerald-950/25 ring-1 ring-emerald-200/40 dark:ring-emerald-800/30" },
  { badge: "bg-red-500",     label: "text-red-600 dark:text-red-400",       bar: "bg-red-500",     hover: "hover:border-red-200/60 dark:hover:border-red-800/40 hover:bg-red-50/20 dark:hover:bg-red-950/10",         active: "border-red-300/60 dark:border-red-700/50 bg-red-50/40 dark:bg-red-950/25 ring-1 ring-red-200/40 dark:ring-red-800/30"         },
  { badge: "bg-teal-500",    label: "text-teal-600 dark:text-teal-400",     bar: "bg-teal-500",    hover: "hover:border-teal-200/60 dark:hover:border-teal-800/40 hover:bg-teal-50/20 dark:hover:bg-teal-950/10",     active: "border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/25 ring-1 ring-teal-200/40 dark:ring-teal-800/30"     },
  { badge: "bg-orange-500",  label: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500",  hover: "hover:border-orange-200/60 dark:hover:border-orange-800/40 hover:bg-orange-50/20 dark:hover:bg-orange-950/10", active: "border-orange-300/60 dark:border-orange-700/50 bg-orange-50/40 dark:bg-orange-950/25 ring-1 ring-orange-200/40 dark:ring-orange-800/30" },
]

interface SectionCardProps {
  id: string
  index: number
  title?: string
  content: string
  isSelected: boolean
  isLoadingExplain: boolean
  expandedBelow: boolean
  explainResult: SourceExplainResult | null
  onSelect: () => void
  onClose: () => void
  documentTypeHint: string | null
}

const SOURCE_PANEL_CARDS = [
  { key: "meaning",      label: "What it means",       icon: BookOpen,     accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40" },
  { key: "requires",     label: "What it requires",    icon: ListTodo,     accent: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-900/40" },
  { key: "whyItMatters", label: "Why it matters",      icon: Zap,          accent: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40" },
  { key: "risks",        label: "Risks & implications", icon: Shield,       accent: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-900/40" },
  { key: "questionsToAsk", label: "Questions to ask",  icon: MessageSquare, accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40" },
] as const

function SourceExplainPanel({
  title,
  result,
  isLoading,
  onClose,
  showClose,
}: {
  title?: string
  result: SourceExplainResult | null
  isLoading: boolean
  onClose?: () => void
  showClose?: boolean
}) {
  return (
    <div className="rounded-2xl border border-blue-200/50 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/15 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-blue-200/40 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/30">
        <div className="flex items-center gap-2 min-w-0">
          <Lightbulb className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 truncate">
            {title ? `"${title}"` : "Plain-English Breakdown"}
          </span>
        </div>
        {showClose && onClose && (
          <button onClick={onClose} className="text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4 space-y-2.5">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl border border-border/30 bg-secondary/20 p-4 space-y-2 animate-pulse">
                <div className="h-2.5 w-28 rounded-full bg-secondary" />
                <div className="h-3 w-full rounded-full bg-secondary/70" />
                <div className="h-3 w-4/5 rounded-full bg-secondary/50" />
              </div>
            ))}
          </div>
        ) : result ? (
          SOURCE_PANEL_CARDS.map(({ key, label, icon: Icon, accent }) => {
            const text = result[key as keyof SourceExplainResult]
            if (!text) return null
            return (
              <div key={key} className={`rounded-2xl border p-4 ${accent}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <h4 className="text-[11px] font-bold uppercase tracking-widest">{label}</h4>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
              </div>
            )
          })
        ) : null}
      </div>
    </div>
  )
}

function SectionCard({
  id, index, title, content, isSelected, isLoadingExplain, expandedBelow,
  explainResult, onSelect, onClose, documentTypeHint,
}: SectionCardProps) {
  const c = SECTION_CARD_COLORS[index % SECTION_CARD_COLORS.length]
  return (
    <div className="flex flex-col">
      <button
        onClick={isSelected ? onClose : onSelect}
        className={[
          "w-full text-left rounded-xl border transition-all duration-150 overflow-hidden group",
          isSelected ? c.active : `border-border/30 bg-card ${c.hover}`,
        ].join(" ")}
      >
        <div className="flex items-stretch">
          {/* Left color bar */}
          <div className={`w-1 shrink-0 ${c.bar}`} />

          <div className="flex-1 min-w-0 p-4">
            <div className="flex items-start gap-3 mb-2">
              {/* Number badge */}
              <span className={`shrink-0 w-6 h-6 rounded-full ${c.badge} text-white text-[11px] font-bold flex items-center justify-center mt-0.5`}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                {title && (
                  <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isSelected ? c.label : "text-muted-foreground"}`}>
                    {title}
                  </div>
                )}
                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{content}</p>
              </div>
            </div>
            <div
              className={[
                "ml-9 flex items-center gap-1 text-xs font-semibold transition-colors",
                isSelected ? c.label : "text-muted-foreground/60 group-hover:text-foreground/80",
              ].join(" ")}
            >
              {isLoadingExplain ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Explaining…</>
              ) : isSelected ? (
                <><ChevronDown className="w-3.5 h-3.5 rotate-180 transition-transform duration-150" />Hide explanation</>
              ) : (
                <><Lightbulb className="w-3.5 h-3.5" />Explain this section</>
              )}
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expandedBelow && (
          <motion.div
            key={`explain-${id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mt-2"
          >
            <SourceExplainPanel
              title={title}
              result={explainResult}
              isLoading={isLoadingExplain}
              onClose={onClose}
              showClose={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SourceSectionsTab({ analysis, documentTypeHint }: { analysis: DocumentAnalysis; documentTypeHint: string | null }) {
  const sections = analysis.sections ?? []
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [explainCache, setExplainCache] = React.useState<Record<string, SourceExplainResult>>({})

  const fetchExplain = React.useCallback(async (sectionId: string, content: string, title?: string) => {
    if (explainCache[sectionId]) {
      setSelectedId(sectionId)
      return
    }
    setSelectedId(sectionId)
    setLoadingId(sectionId)
    try {
      const body: Record<string, string> = { sectionContent: content }
      if (title) body.sectionTitle = title
      if (documentTypeHint) body.documentTypeHint = documentTypeHint
      const res = await fetch(`${getApiBaseUrl()}/api/documents/explain-source-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setExplainCache((prev) => ({ ...prev, [sectionId]: data.explanation }))
      }
    } catch {
    } finally {
      setLoadingId(null)
    }
  }, [explainCache, documentTypeHint])

  const handleClose = React.useCallback(() => {
    setSelectedId(null)
  }, [])

  const desktopResult = selectedId ? (explainCache[selectedId] ?? null) : null
  const desktopLoading = loadingId !== null && loadingId === selectedId
  const desktopTitle = selectedId ? sections.find((s) => s.id === selectedId)?.title : undefined

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <AlignLeft className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-base font-medium text-muted-foreground">No source sections found</p>
        <p className="text-sm text-muted-foreground/70 max-w-xs">
          Source sections appear when the document contains readable text that can be broken into sections.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <div className="mb-1">
        <h2 className="text-2xl font-bold text-foreground mb-1">Source Sections</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          The raw text of your document, broken into numbered sections. Click any section to unlock a plain-English breakdown — what it means, what it requires from you, why it matters, and what risks it carries.
        </p>
      </div>

      {/* Count + hint bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-blue-200/50 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 px-5 py-3.5">
        <AlignLeft className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {sections.length} section{sections.length !== 1 ? "s" : ""} extracted — click a numbered section on the left, then read the breakdown on the right
        </span>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_360px] lg:gap-5">
        <div className="max-h-[62vh] overflow-y-auto pr-1 space-y-2">
          {sections.map((s, i) => (
            <SectionCard
              key={s.id}
              id={s.id}
              index={i}
              title={s.title}
              content={s.content}
              isSelected={selectedId === s.id}
              isLoadingExplain={loadingId === s.id}
              expandedBelow={false}
              explainResult={null}
              onSelect={() => fetchExplain(s.id, s.content, s.title)}
              onClose={handleClose}
              documentTypeHint={documentTypeHint}
            />
          ))}
        </div>
        <div className="max-h-[62vh] overflow-y-auto">
          {selectedId ? (
            <SourceExplainPanel
              key={selectedId}
              title={desktopTitle}
              result={desktopResult}
              isLoading={desktopLoading}
              onClose={handleClose}
              showClose={true}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-blue-200/50 dark:border-blue-800/30 bg-blue-50/20 dark:bg-blue-950/15 p-8 flex flex-col items-center justify-center text-center gap-3 h-48">
              <Lightbulb className="w-8 h-8 text-blue-300 dark:text-blue-700" />
              <p className="text-sm font-medium text-blue-600/70 dark:text-blue-400/70">Select a section on the left to get a plain-English breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: single column with inline expansion */}
      <div className="lg:hidden space-y-2">
        {sections.map((s, i) => (
          <SectionCard
            key={s.id}
            id={s.id}
            index={i}
            title={s.title}
            content={s.content}
            isSelected={selectedId === s.id}
            isLoadingExplain={loadingId === s.id}
            expandedBelow={selectedId === s.id}
            explainResult={explainCache[s.id] ?? null}
            onSelect={() => fetchExplain(s.id, s.content, s.title)}
            onClose={handleClose}
            documentTypeHint={documentTypeHint}
          />
        ))}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   KEY TERMS TAB
──────────────────────────────────────────────── */
const SEVERITY_CONFIG = {
  high: {
    accentBg: "bg-red-500",
    textColor: "text-red-500",
    badge: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
    label: "High",
  },
  medium: {
    accentBg: "bg-amber-500",
    textColor: "text-amber-500",
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    label: "Medium",
  },
  low: {
    accentBg: "bg-blue-500",
    textColor: "text-blue-500",
    badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
    label: "Low",
  },
} as const

function KeyTermCard({ term }: { term: KeyTerm }) {
  const cfg = SEVERITY_CONFIG[term.severity] ?? SEVERITY_CONFIG.medium
  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden flex">
      <div className={`w-1 shrink-0 ${cfg.accentBg}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 px-4 py-3 bg-muted/20 border-b border-border/20">
          <div className="flex items-start gap-2.5 min-w-0">
            <Flag className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.textColor}`} />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground leading-snug">{term.term}</p>
              <span className="text-[11px] text-muted-foreground">{term.category}</span>
            </div>
          </div>
          <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">What this means</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{term.explanation}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Why it matters</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{term.whyItMatters}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">Watch out for</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{term.watchOut}</p>
          </div>
          {term.questionToAsk && (
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 flex items-start gap-2 mt-1">
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Question to ask</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{term.questionToAsk}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KeyTermsTab({ analysis }: { analysis: DocumentAnalysis }) {
  const keyTerms = analysis.keyTerms ?? []
  const sorted = [...keyTerms].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return (order[a.severity] ?? 1) - (order[b.severity] ?? 1)
  })
  const highCount = sorted.filter(k => k.severity === "high").length
  const medCount = sorted.filter(k => k.severity === "medium").length
  const lowCount = sorted.filter(k => k.severity === "low").length

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Flag className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-base font-medium text-muted-foreground">No key terms found</p>
        <p className="text-sm text-muted-foreground/70 max-w-xs">
          Key terms and clauses appear after a document is analyzed. Try uploading a contract, permit, or legal document.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold">Key Terms & Clauses</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Important provisions and obligations — in plain English</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {highCount > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              {highCount} High
            </span>
          )}
          {medCount > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {medCount} Medium
            </span>
          )}
          {lowCount > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {lowCount} Low
            </span>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {sorted.map(kt => <KeyTermCard key={kt.id} term={kt} />)}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   ACTION PACK TAB
──────────────────────────────────────────────── */
function ActionPackTab({ analysis }: { analysis: DocumentAnalysis }) {
  const pack = analysis.actionPack
  if (!pack) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Action pack not available for this document.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <Package className="w-5 h-5 text-foreground" />
          <h2 className="text-xl font-bold text-foreground">Action Pack</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Everything you need to take smart, informed next steps — questions to ask, what to have ready, how to communicate, and what to confirm before you act.
        </p>
      </div>

      {/* Questions to Ask */}
      {pack.questionsToAsk && pack.questionsToAsk.length > 0 && (
        <ActionPackSection
          icon={<HelpCircle className="w-4 h-4" />}
          title="Questions to Ask"
          subtitle={`${pack.questionsToAsk.length} targeted questions for your situation`}
          color="violet"
        >
          <div className="space-y-3">
            {pack.questionsToAsk.map((q, i) => (
              <div key={q.id} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug mb-1">"{q.question}"</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{q.context}</p>
                </div>
              </div>
            ))}
          </div>
        </ActionPackSection>
      )}

      {/* What to Gather */}
      {pack.whatToGather && pack.whatToGather.length > 0 && (
        <ActionPackSection
          icon={<FolderOpen className="w-4 h-4" />}
          title="What to Gather"
          subtitle={`${pack.whatToGather.length} records and documents to have ready`}
          color="amber"
        >
          <div className="space-y-2.5">
            {pack.whatToGather.map((g) => (
              <div key={g.id} className="flex gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground leading-snug">{g.item}</p>
                    {g.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0">
                        {g.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{g.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ActionPackSection>
      )}

      {/* What to Say */}
      {pack.whatToSay && pack.whatToSay.length > 0 && (
        <ActionPackSection
          icon={<Mail className="w-4 h-4" />}
          title="What to Say"
          subtitle="Draft messages you can adapt — not legal advice, just practical starting points"
          color="blue"
        >
          <div className="space-y-4">
            {pack.whatToSay.map((s) => (
              <DraftMessageCard key={s.id} label={s.label} draft={s.draft} />
            ))}
          </div>
        </ActionPackSection>
      )}

      {/* Before You Act Checklist */}
      {pack.beforeYouActChecklist && pack.beforeYouActChecklist.length > 0 && (
        <ActionPackSection
          icon={<CheckSquare className="w-4 h-4" />}
          title="Before You Act"
          subtitle="Confirm each of these before signing or submitting"
          color="green"
        >
          <div className="space-y-2">
            {pack.beforeYouActChecklist.map((item, i) => (
              <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40">
                <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-green-400 dark:border-green-600 mt-0.5 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-green-500 dark:text-green-400">{i + 1}</span>
                </div>
                <p className="text-sm text-foreground leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </ActionPackSection>
      )}
    </div>
  )
}

function ActionPackSection({
  icon, title, subtitle, color, children
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  color: "violet" | "amber" | "blue" | "green"
  children: React.ReactNode
}) {
  const colorMap = {
    violet: "text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800/60",
    amber:  "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60",
    blue:   "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
    green:  "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/50 border-green-200 dark:border-green-800/60",
  }
  const iconClass = colorMap[color]
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${iconClass}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground leading-tight">{title}</h3>
          <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function DraftMessageCard({ label, draft }: { label: string; draft: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    const doSet = () => { setCopied(true); setTimeout(() => setCopied(false), 2000) }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(draft).then(doSet).catch(() => {
        const el = document.createElement("textarea")
        el.value = draft
        document.body.appendChild(el); el.select()
        document.execCommand("copy"); document.body.removeChild(el)
        doSet()
      })
    } else {
      const el = document.createElement("textarea")
      el.value = draft
      document.body.appendChild(el); el.select()
      document.execCommand("copy"); document.body.removeChild(el)
      doSet()
    }
  }
  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/60">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">{label}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="p-3.5 bg-white dark:bg-card">
        <pre className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">{draft}</pre>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   EXPORT MENU
──────────────────────────────────────────────── */
function ExportMenu({ analysis }: { analysis: DocumentAnalysis }) {
  const [copiedText, setCopiedText] = useState(false)
  const [shareErr, setShareErr] = useState(false)
  const [printUnavailable, setPrintUnavailable] = useState(false)

  const handlePrint = () => {
    const result = triggerPrint()
    if (!result.success) {
      setPrintUnavailable(true)
      setTimeout(() => setPrintUnavailable(false), 3000)
    }
  }

  const handleCopy = async () => {
    const text = buildExportText(analysis)
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        const el = document.createElement("textarea")
        el.value = text
        document.body.appendChild(el); el.select()
        document.execCommand("copy"); document.body.removeChild(el)
      }
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    } catch {
      setCopiedText(false)
    }
  }

  const handleShare = async () => {
    try {
      await nativeShare(analysis)
    } catch {
      setShareErr(true)
      setTimeout(() => setShareErr(false), 2500)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 bg-card text-xs h-8 border-border/60"
          style={{ touchAction: "manipulation" }}
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
          Export / Share
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2.5 cursor-pointer"
          onSelect={(e) => { e.preventDefault(); handlePrint() }}
        >
          <Printer className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{printUnavailable ? "Not available on this device" : "Print / Save as PDF"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2.5 cursor-pointer"
          onSelect={(e) => { e.preventDefault(); handleCopy() }}
        >
          {copiedText
            ? <Check className="w-3.5 h-3.5 text-green-600" />
            : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          }
          <span>{copiedText ? "Copied!" : "Copy as text"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2.5 cursor-pointer"
          onSelect={() => downloadTextFile(analysis)}
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Download .txt</span>
        </DropdownMenuItem>
        {canNativeShare() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2.5 cursor-pointer"
              onSelect={(e) => { e.preventDefault(); handleShare() }}
            >
              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{shareErr ? "Share not available" : "Share…"}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ────────────────────────────────────────────────
   PRINT REPORT (hidden on screen, shown in print)
──────────────────────────────────────────────── */
function PrintReport({ analysis, documentTypeHint }: { analysis: DocumentAnalysis; documentTypeHint: string | null }) {
  const pe = analysis.plainEnglish
  const pack = analysis.actionPack
  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) }
    catch { return iso }
  }

  return (
    <div className="print-only">
      {/* Cover */}
      <div className="print-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontWeight: 700, fontSize: "11pt", letterSpacing: "0.08em", textTransform: "uppercase", color: "#4F7CAC" }}>PlainPath</span>
          <span style={{ color: "#aaa", fontSize: "10pt" }}>·</span>
          <span style={{ fontSize: "9pt", color: "#888" }}>Analysis Report</span>
        </div>
        <h1 style={{ fontSize: "18pt", fontWeight: 800, margin: "0 0 6px 0", lineHeight: 1.2 }}>{analysis.title}</h1>
        <div style={{ display: "flex", gap: "18px", fontSize: "9pt", color: "#555", marginBottom: "4px" }}>
          <span><strong>Type:</strong> {analysis.documentType}</span>
          {documentTypeHint && <span><strong>Category:</strong> {documentTypeHint}</span>}
          <span><strong>Date:</strong> {formatDate(analysis.processedAt)}</span>
          <span><strong>Confidence:</strong> {analysis.overallConfidence}</span>
        </div>
        <div style={{ borderTop: "2px solid #4F7CAC", marginTop: "12px" }} />
      </div>

      {/* Plain English */}
      {pe && (
        <div className="print-section">
          <h2 className="print-section-title">Plain English Summary</h2>
          {pe.whatItIs && <><h3 className="print-subsection-title">What this is</h3><p className="print-body">{pe.whatItIs}</p></>}
          {pe.whatItSays && <><h3 className="print-subsection-title">What it says</h3><p className="print-body">{pe.whatItSays}</p></>}
          {pe.whatItAsks && <><h3 className="print-subsection-title">What it asks from you</h3><p className="print-body">{pe.whatItAsks}</p></>}
          {pe.obligations && <><h3 className="print-subsection-title">What you may be agreeing to</h3><p className="print-body">{pe.obligations}</p></>}
          {pe.payAttentionTo && <><h3 className="print-subsection-title">What to pay attention to</h3><p className="print-body">{pe.payAttentionTo}</p></>}
        </div>
      )}

      {/* Checklist */}
      {analysis.actionSteps.length > 0 && (
        <div className="print-section print-break">
          <h2 className="print-section-title">Action Steps ({analysis.actionSteps.length})</h2>
          {analysis.actionSteps.map((step, i) => (
            <div key={step.id} className="print-check-item">
              <div className="print-checkbox" />
              <div>
                <div className="print-item-title">{i + 1}. {step.title}
                  <span className="print-badge">{step.priority.toUpperCase()}</span>
                </div>
                {step.description && <p className="print-item-desc">{step.description}</p>}
                {step.deadline && <p className="print-item-meta">Deadline: {step.deadline}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Required Docs */}
      {analysis.requiredDocuments.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Required Documents ({analysis.requiredDocuments.length})</h2>
          {analysis.requiredDocuments.map(doc => (
            <div key={doc.id} className="print-check-item">
              <div className="print-checkbox" />
              <div>
                <div className="print-item-title">{doc.name}
                  {doc.required && <span className="print-badge">REQUIRED</span>}
                </div>
                {doc.description && <p className="print-item-desc">{doc.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deadlines */}
      {analysis.deadlines.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Deadlines ({analysis.deadlines.length})</h2>
          {analysis.deadlines.map(d => (
            <div key={d.id} className="print-check-item">
              <div>
                <div className="print-item-title">{d.title}
                  <span className="print-badge" style={{ background: d.isHard ? "#fef2f2" : "#f0fdf4", color: d.isHard ? "#dc2626" : "#16a34a", borderColor: d.isHard ? "#fecaca" : "#bbf7d0" }}>
                    {d.isHard ? "HARD DEADLINE" : "FLEXIBLE"}
                  </span>
                </div>
                {(d.date || d.description) && <p className="print-item-meta">{d.date ?? d.description}</p>}
                {d.consequence && <p className="print-item-desc">Consequence: {d.consequence}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risks */}
      {analysis.risks.length > 0 && (
        <div className="print-section print-break">
          <h2 className="print-section-title">Risks & Notes ({analysis.risks.length})</h2>
          {analysis.risks.map(r => (
            <div key={r.id} className="print-check-item">
              <div>
                <div className="print-item-title">{r.title}
                  <span className="print-badge" style={{ background: r.severity === "high" ? "#fef2f2" : r.severity === "medium" ? "#fffbeb" : "#eff6ff", color: r.severity === "high" ? "#dc2626" : r.severity === "medium" ? "#d97706" : "#2563eb", borderColor: r.severity === "high" ? "#fecaca" : r.severity === "medium" ? "#fde68a" : "#bfdbfe" }}>
                    {r.severity.toUpperCase()}
                  </span>
                </div>
                {r.description && <p className="print-item-desc">{r.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Terms */}
      {analysis.keyTerms && analysis.keyTerms.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Key Terms ({analysis.keyTerms.length})</h2>
          {analysis.keyTerms.map(kt => (
            <div key={kt.id} className="print-check-item">
              <div>
                <div className="print-item-title">{kt.term}
                  <span className="print-badge">{kt.severity.toUpperCase()}</span>
                  {kt.category && <span className="print-badge" style={{ background: "#f0f9ff", color: "#0369a1", borderColor: "#bae6fd" }}>{kt.category}</span>}
                </div>
                {kt.explanation && <p className="print-item-desc">{kt.explanation}</p>}
                {kt.watchOut && <p className="print-item-meta">Watch out: {kt.watchOut}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Pack */}
      {pack && (
        <div className="print-section print-break">
          <h2 className="print-section-title">Action Pack</h2>
          {pack.questionsToAsk && pack.questionsToAsk.length > 0 && (
            <>
              <h3 className="print-subsection-title">Questions to Ask</h3>
              {pack.questionsToAsk.map((q, i) => (
                <div key={q.id} className="print-check-item">
                  <div>
                    <div className="print-item-title">"{q.question}"</div>
                    {q.context && <p className="print-item-desc">→ {q.context}</p>}
                  </div>
                </div>
              ))}
            </>
          )}
          {pack.whatToGather && pack.whatToGather.length > 0 && (
            <>
              <h3 className="print-subsection-title">What to Gather</h3>
              {pack.whatToGather.map(g => (
                <div key={g.id} className="print-check-item">
                  <div className="print-checkbox" />
                  <div>
                    <div className="print-item-title">{g.item}
                      {g.category && <span className="print-badge">{g.category}</span>}
                    </div>
                    {g.description && <p className="print-item-desc">{g.description}</p>}
                  </div>
                </div>
              ))}
            </>
          )}
          {pack.whatToSay && pack.whatToSay.length > 0 && (
            <>
              <h3 className="print-subsection-title">Draft Messages</h3>
              {pack.whatToSay.map(s => (
                <div key={s.id} style={{ marginBottom: "10px" }}>
                  <div className="print-item-title">{s.label}</div>
                  <pre style={{ fontSize: "8pt", lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "inherit", background: "#f8f9fa", padding: "8px", borderRadius: "4px", border: "1px solid #e5e7eb", margin: "4px 0 0 0" }}>{s.draft}</pre>
                </div>
              ))}
            </>
          )}
          {pack.beforeYouActChecklist && pack.beforeYouActChecklist.length > 0 && (
            <>
              <h3 className="print-subsection-title">Before You Act</h3>
              {pack.beforeYouActChecklist.map((c, i) => (
                <div key={c.id} className="print-check-item">
                  <div className="print-checkbox" />
                  <div className="print-item-title">{i + 1}. {c.text}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "20px", paddingTop: "10px", fontSize: "8pt", color: "#888", display: "flex", justifyContent: "space-between" }}>
        <span>Generated by PlainPath · plainpath.replit.app</span>
        <span>Not legal, financial, or professional advice.</span>
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
