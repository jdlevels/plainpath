import React, { useEffect, useState, useCallback, useMemo, useRef } from "react"
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
  HelpCircle, ChevronDown, ChevronLeft, ChevronRight, Lightbulb, Eye, Shield, Zap,
  AlignLeft, MessageSquare, X, Flag, Package, Lock, EyeOff,
  FolderOpen, Mail, CheckSquare, Copy, Check,
  Bookmark, BookmarkCheck, Share2, Download, Upload, Bell, BellDot, Link2,
  Pencil, OctagonAlert
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
import { DocumentScanScreen } from "@/components/DocumentScanScreen"
import { isNative } from "@/lib/platform"
import { getApiBaseUrl } from "@/lib/api"
import { saveAnalysis, updateSaved } from "@/lib/savedAnalyses"
import { saveCloudAnalysis, renameCloudAnalysis } from "@/lib/cloudHistory"
import { createUserDocument, attachToolRun } from "@/lib/userDocsApi"
import { useUser, useAuth } from "@clerk/react"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeCard from "@/components/UpgradeCard"
import { findGlossaryEntry } from "@/lib/legalGlossary"
import { addReminder, requestNotificationPermission } from "@/lib/reminderStorage"
import { DocumentChat } from "@/components/DocumentChat"
import { computeRiskScore, getRiskScoreResult } from "@/lib/riskScore"

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
  { id: "ask",             label: "Ask PlainPath",    icon: MessageSquare                               },
]

export default function Analyze() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const demoId = new URLSearchParams(searchString).get("demo") as string | null
  const tabParam = new URLSearchParams(searchString).get("tab")

  const { analysis, documentTypeHint, setAnalysis, clearAnalysis, updateActionStep, updateRequiredDoc } = useAnalysisContext()
  const [activeTab, setActiveTab] = useState(tabParam ?? "plain-english")
  const [savedId, setSavedId] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [guidedReviewCtx, setGuidedReviewCtx] = useState<string | null>(null)
  const tabListRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [textSize, setTextSize] = useState<"sm" | "md" | "lg">("sm")

  const checkScroll = useCallback(() => {
    const el = tabListRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  // Re-run whenever analysis arrives so the tab bar is present in the DOM
  useEffect(() => {
    checkScroll()
    window.addEventListener("resize", checkScroll, { passive: true })
    return () => window.removeEventListener("resize", checkScroll)
  }, [analysis, checkScroll])

  const scrollTabsLeft  = () => tabListRef.current?.scrollBy({ left: -200, behavior: "smooth" })
  const scrollTabsRight = () => tabListRef.current?.scrollBy({ left:  200, behavior: "smooth" })

  const { entitlements, loading: entitlementsLoading } = useEntitlements()
  const { isSignedIn } = useUser()
  const isPro = entitlements?.plan === "pro" || entitlements?.plan === "team"
  // Tabs locked to Pro plan. Starter plan includes: plain-english, summary, key-terms,
  // action-pack, documents (Required Docs), and deadlines.
  const PRO_ONLY_TABS = new Set(["source-sections", "missing", "checklist", "risks"])
  const isTabLocked = (tabId: string) => PRO_ONLY_TABS.has(tabId) && !isPro && !entitlementsLoading

  // Clear stale context whenever demoId changes (including on first mount when context
  // holds a previous demo's analysis — prevDemoIdRef approach misses the mount case).
  useEffect(() => {
    if (demoId && analysis && analysis.id !== `demo-${demoId}`) {
      clearAnalysis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoId])

  const { data: demoData, isLoading, error: demoError } = useGetDemoDocument(
    demoId as any,
    { query: { enabled: !!demoId && !analysis } }
  )
  const { mutate: updateChecklist } = useUpdateChecklist()

  useEffect(() => {
    if (demoData?.analysis && !analysis && demoData.analysis.id === `demo-${demoId}`) {
      setAnalysis(demoData.analysis)
    }
  }, [demoData, analysis, setAnalysis, demoId])
  useEffect(() => { if (!demoId && !analysis) setLocation("/analyze") }, [demoId, analysis, setLocation])
  useEffect(() => {
    if (analysis?.title) {
      document.title = `${analysis.title} — PlainPath`
      return () => { document.title = "PlainPath" }
    }
  }, [analysis?.title])

  if (isLoading || (!analysis && demoId)) return <DocumentScanScreen mode="analyze" />
  if (demoError) return <ErrorScreen onBack={() => setLocation("/analyze")} />
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

  const handleSave = async () => {
    if (!analysis) return
    const triggerFeedback = () => {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2200)
    }
    if (isSignedIn) {
      if (savedId) {
        renameCloudAnalysis(savedId, analysis.title).catch(() => {})
        triggerFeedback()
      } else {
        try {
          const saved = await saveCloudAnalysis({
            title: analysis.title,
            sourceKind: demoId ? "demo" : "document",
            documentTypeHint,
            analysis,
          })
          setSavedId(saved.id)
          triggerFeedback()
          // Fire-and-forget: create/link a document record in My Documents
          if (!documentId && !demoId) {
            createUserDocument({
              title: analysis.title,
              sourceKind: "analyze",
            }).then(doc => {
              setDocumentId(doc.id)
              return attachToolRun(doc.id, {
                tool: "analyze",
                outputRef: saved.id,
                outputKind: "analysis",
                resultSummary: analysis.title,
              })
            }).catch(() => {})
          }
        } catch {
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
    } else {
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
  }

  const riskScore = (() => {
    const aiScore = typeof analysis.overallRisk === "number" ? analysis.overallRisk : null
    return aiScore ?? computeRiskScore({ risks, deadlines, overallConfidence: analysis.overallConfidence })
  })()
  const riskScoreResult = getRiskScoreResult(riskScore)

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={setActiveTab}
      className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden"
    >
      {/* ── Header ───────────────────────────── */}
      <div className="no-print flex-shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3 bg-slate-900 border-b border-slate-800 z-30">
        <button
          onClick={() => setLocation("/analyze")}
          style={{ touchAction: "manipulation" }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {documentTypeHint && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-900/40 px-1.5 py-0.5 rounded">
                {documentTypeHint}
              </span>
            )}
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">{analysis.documentType}</span>
          </div>
          <h1 className="text-sm font-bold text-slate-100 truncate leading-tight">{analysis.title}</h1>
          {getAttorneyCostEstimate(analysis.documentType) && (
            <p className="text-[10px] text-emerald-400 font-semibold leading-tight hidden sm:block">
              Saved you {getAttorneyCostEstimate(analysis.documentType)} vs. an attorney
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("risks")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
            title="Document Risk Score"
          >
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-300 tabular-nums">{riskScore}</span>
            <span className={`text-[10px] font-medium hidden sm:inline ${riskScoreResult.color}`}>{riskScoreResult.label}</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <span className="text-xs font-bold text-slate-300 tabular-nums">{progress}%</span>
            <span className="text-[10px] text-slate-500 font-medium">done</span>
          </div>
          {/* Font size toggle */}
          <div className="hidden sm:flex items-center gap-px rounded-lg border border-slate-700 bg-slate-800 p-0.5" title="Text size">
            {(["sm", "md", "lg"] as const).map((size, i) => (
              <button
                key={size}
                onClick={() => setTextSize(size)}
                title={["Small text", "Medium text", "Large text"][i]}
                className={`h-6 px-2 rounded text-[10px] font-bold transition-colors ${
                  textSize === size
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {["A", "A+", "A⁺⁺"][i]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            style={{ touchAction: "manipulation" }}
            className={`gap-1.5 text-xs h-8 transition-all border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-600 hover:text-slate-100 ${
              justSaved ? "border-emerald-700 bg-emerald-900/40 text-emerald-300" : ""
            }`}
          >
            {justSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{justSaved ? "Saved" : savedId ? "Update" : "Save"}</span>
          </Button>
          <ExportMenu analysis={analysis} />
        </div>
      </div>

      {/* ── Red Flags slim bar ── */}
      {analysis.redFlags && analysis.redFlags.length > 0 && (
        <div className="no-print flex-shrink-0 flex items-start gap-2.5 px-4 sm:px-5 py-2 bg-red-950/50 border-b border-red-900/60">
          <OctagonAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 shrink-0">Critical</span>
            {analysis.redFlags.slice(0, 2).map((flag, i) => (
              <span key={i} className="text-xs text-red-200">{flag}{i < Math.min(analysis.redFlags!.length, 2) - 1 ? " •" : ""}</span>
            ))}
            {analysis.redFlags.length > 2 && (
              <button onClick={() => setActiveTab("risks")} className="text-[10px] font-semibold text-red-400 hover:text-red-300 shrink-0">
                +{analysis.redFlags.length - 2} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Body: Sidebar + Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar ── */}
        <aside className="no-print w-[200px] lg:w-[224px] flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto">

          {/* At-a-glance stat tiles */}
          <div className="px-3 pt-4 pb-3 border-b border-slate-800/80 grid grid-cols-2 gap-1.5">
            {[
              { label: "Steps",     value: actionSteps.length,        warn: false,                   tab: "checklist" },
              { label: "Deadlines", value: hardDeadlines.length,      warn: hardDeadlines.length > 0, tab: "deadlines" },
              { label: "Req. Docs", value: requiredDocuments.length,   warn: false,                   tab: "documents" },
              { label: "Risks",     value: highRisks.length,          warn: highRisks.length > 0,    tab: "risks"     },
            ].map(stat => (
              <button
                key={stat.label}
                onClick={() => setActiveTab(stat.tab)}
                className={`rounded-lg p-2 text-left transition-colors hover:bg-slate-800 border ${
                  stat.warn && stat.value > 0
                    ? "border-amber-800/50 bg-amber-950/20"
                    : "border-slate-800 bg-slate-800/40"
                }`}
              >
                <div className={`text-lg font-bold tabular-nums leading-none mb-0.5 ${stat.warn && stat.value > 0 ? "text-amber-300" : "text-slate-200"}`}>
                  {stat.value}
                </div>
                <div className="text-[9px] text-slate-500 font-medium leading-tight">{stat.label}</div>
              </button>
            ))}
          </div>

          {/* Confidence */}
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center gap-2">
            <ConfidenceBadge level={analysis.overallConfidence} />
            <span className="text-[10px] text-slate-600">confidence</span>
          </div>

          {/* Nav tabs */}
          <Tabs.List className="flex flex-col py-2 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1 mt-1">Sections</p>
            {TABS.map((tab) => {
              const count = (tab as any).countKey ? (analysis as any)[(tab as any).countKey]?.length : null
              const isMissing = tab.id === "missing"
              const isLocked = isTabLocked(tab.id)
              const isActive = activeTab === tab.id
              return (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  style={{ touchAction: "manipulation" }}
                  className={`relative w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors outline-none ${
                    isActive
                      ? "bg-violet-900/40 text-violet-300"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-300"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-violet-500" />
                  )}
                  <tab.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-violet-400" : "text-slate-500"}`} />
                  <span className="text-xs font-medium flex-1 truncate text-left">{tab.label}</span>
                  {isLocked && <Lock className="w-3 h-3 text-amber-600 shrink-0" />}
                  {count != null && count > 0 && !isLocked && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                      isActive ? "bg-violet-800 text-violet-200" : "bg-slate-800 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  )}
                  {isMissing && missingCount > 0 && !isActive && !isLocked && (
                    <span className="w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                      {missingCount > 9 ? "9+" : missingCount}
                    </span>
                  )}
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>

          {/* Upgrade nudge */}
          {!isPro && !entitlementsLoading && (
            <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-violet-900/40 to-slate-800/80 border border-violet-800/40">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wide">Pro</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mb-2">Unlock Risks, Checklist, Source Sections + more</p>
              <a href="/upgrade" className="block w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold text-center transition-colors">
                Upgrade
              </a>
            </div>
          )}

          {/* Attorney badge */}
          <div className="px-3 pb-3">
            <a href="/methodology" className="flex items-center gap-1.5 text-[9px] text-slate-700 hover:text-slate-600 transition-colors">
              <Shield className="w-3 h-3" />
              Reviewed by licensed attorneys
            </a>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto bg-slate-950 dark" data-text-scale={textSize !== "sm" ? textSize : undefined}>
          <div className="max-w-4xl mx-auto px-5 sm:px-8 py-6" style={{ paddingBottom: "max(3rem, env(safe-area-inset-bottom) + 3rem)" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.14 }}
              >
                {activeTab === "plain-english"   && <PlainEnglishTab analysis={analysis} onTabChange={setActiveTab} />}
                {activeTab === "source-sections" && (isTabLocked("source-sections")
                  ? <UpgradeCard title="Source Sections — Pro" description="See exactly which part of the original document backs every requirement, risk, and deadline." />
                  : <SourceSectionsTab analysis={analysis} documentTypeHint={documentTypeHint} onOpenGuidedReview={() => setGuidedReviewCtx("source-sections")} />)}
                {activeTab === "summary"         && <SummaryTab   analysis={analysis} onTabChange={setActiveTab} onOpenGuidedReview={() => setGuidedReviewCtx("summary")} />}
                {activeTab === "missing"         && (isTabLocked("missing")
                  ? <UpgradeCard title="What's Missing — Pro" description="Instantly spot what's incomplete, ambiguous, or absent so nothing slips through the cracks." />
                  : <WhatsMissingTab analysis={analysis} onActionToggle={handleActionToggle} onDocToggle={handleDocToggle} onTabChange={setActiveTab} onOpenGuidedReview={() => setGuidedReviewCtx("missing")} />)}
                {activeTab === "checklist"       && (isTabLocked("checklist")
                  ? <UpgradeCard title="Checklist — Pro" description="A prioritized to-do list of every action step, ranked high / medium / low." />
                  : <ChecklistTab  analysis={analysis} onToggle={handleActionToggle} documentTypeHint={documentTypeHint} onOpenGuidedReview={() => setGuidedReviewCtx("checklist")} />)}
                {activeTab === "documents"       && (isTabLocked("documents")
                  ? <UpgradeCard title="Required Documents — Pro" description="Track every document you need to gather, with built-in completion tracking." />
                  : <DocumentsTab  analysis={analysis} onToggle={handleDocToggle} onOpenGuidedReview={() => setGuidedReviewCtx("documents")} />)}
                {activeTab === "deadlines"       && (isTabLocked("deadlines")
                  ? <UpgradeCard title="Deadlines — Pro" description="All hard deadlines in one place — formatted for easy calendar entry." />
                  : <DeadlinesTab  analysis={analysis} />)}
                {activeTab === "risks"           && (isTabLocked("risks")
                  ? <UpgradeCard title="Risks & Notes — Pro" description="Understand what you're agreeing to and what could go wrong before you sign or submit." />
                  : <RisksTab      analysis={analysis} onOpenGuidedReview={() => setGuidedReviewCtx("risks")} documentType={analysis.documentType} />)}
                {activeTab === "key-terms"       && <KeyTermsTab   analysis={analysis} />}
                {activeTab === "action-pack"     && <ActionPackTab analysis={analysis} />}
                {activeTab === "ask"             && (
                  isSignedIn
                    ? <DocumentChat analysis={analysis} />
                    : <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-primary/60" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Sign in to ask questions</p>
                          <p className="text-xs text-muted-foreground max-w-xs">
                            Create a free account to ask PlainPath anything about your document.
                          </p>
                        </div>
                        <a href="/sign-up" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                          Create free account <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Print-only report ── */}
      <PrintReport analysis={analysis} documentTypeHint={documentTypeHint} />

      {/* ── Guided Review Overlay ── */}
      <AnimatePresence>
        {guidedReviewCtx && (
          <GuidedReviewOverlay
            context={guidedReviewCtx}
            analysis={analysis}
            onClose={() => setGuidedReviewCtx(null)}
            onActionToggle={handleActionToggle}
            onDocToggle={handleDocToggle}
          />
        )}
      </AnimatePresence>
    </Tabs.Root>
  )
}

/* ────────────────────────────────────────────────
   STAT PILL
──────────────────────────────────────────────── */
function getAttorneyCostEstimate(docType: string | null | undefined): string | null {
  if (!docType) return null
  const t = docType.toLowerCase()
  if (t.includes("lease") || t.includes("rental")) return "$400–800"
  if (t.includes("employment") || t.includes("offer letter") || t.includes("job offer")) return "$500–1,500"
  if (t.includes("nda") || t.includes("non-disclosure") || t.includes("confidentiality")) return "$300–600"
  if (t.includes("freelance") || t.includes("independent contractor")) return "$400–900"
  if (t.includes("service") || t.includes("consulting")) return "$300–800"
  if (t.includes("settlement") || t.includes("litigation")) return "$800–2,500"
  if (t.includes("irs") || t.includes("tax") || t.includes("treasury")) return "$200–600"
  if (t.includes("insurance") || t.includes("policy")) return "$150–400"
  if (t.includes("will") || t.includes("estate") || t.includes("trust")) return "$500–1,200"
  if (t.includes("immigration") || t.includes("visa")) return "$500–1,500"
  if (t.includes("contract") || t.includes("agreement")) return "$300–800"
  return "$200–600"
}

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
function SummaryTab({ analysis, onTabChange, onOpenGuidedReview }: { analysis: DocumentAnalysis; onTabChange: (t: string) => void; onOpenGuidedReview?: () => void }) {
  const highPriority = (analysis.actionSteps ?? []).filter(s => s.priority === "high" && !s.completed)
  const hardDeadlines = (analysis.deadlines ?? []).filter(d => d.isHard)
  const highRisks = (analysis.risks ?? []).filter(r => r.severity === "high")
  const urgentCount = highPriority.length + hardDeadlines.length + highRisks.length

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold mb-0.5">Document Overview</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{analysis.documentType}</p>
        </div>
        {onOpenGuidedReview && <GuidedReviewButton onClick={onOpenGuidedReview} />}
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
    <div className="space-y-6 max-w-4xl">
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
  analysis, onActionToggle, onDocToggle, onTabChange, onOpenGuidedReview,
}: {
  analysis: DocumentAnalysis
  onActionToggle: (id: string, done: boolean) => void
  onDocToggle: (id: string, done: boolean) => void
  onTabChange: (t: string) => void
  onOpenGuidedReview?: () => void
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
    <div className="space-y-8 max-w-4xl">

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold">What's Missing</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalBlocking} blocking item{totalBlocking !== 1 ? "s" : ""} must be resolved before you can proceed.
          </p>
        </div>
        {onOpenGuidedReview && <GuidedReviewButton onClick={onOpenGuidedReview} />}
      </div>

      {/* ── Next Best Action spotlight ─────────────── */}
      {nextAction && (
        <div data-review-id={nextAction.id} className="rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 overflow-hidden">
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
              <div key={step.id} data-review-id={step.id}>
                <ActionStepRow step={step} onToggle={onActionToggle} compact />
              </div>
            ))}
          </div>
        </MissingSection>
      )}

      {/* ── Required docs not obtained ────────────── */}
      {pendingDocs.length > 0 && (
        <MissingSection title="Documents not yet gathered" badge={pendingDocs.length} badgeColor="amber" sectionColor="green" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pendingDocs.map(doc => (
              <div key={doc.id} data-review-id={doc.id}>
                <DocRow doc={doc} onToggle={onDocToggle} compact />
              </div>
            ))}
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
              <div key={risk.id} data-review-id={risk.id} className="p-3.5 rounded-xl bg-white/70 dark:bg-red-950/30 border border-red-200/40 dark:border-red-900/30">
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
            {pendingMed.map(step => (
              <div key={step.id} data-review-id={step.id}>
                <ActionStepRow step={step} onToggle={onActionToggle} compact />
              </div>
            ))}
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
  analysis, onToggle, documentTypeHint, onOpenGuidedReview,
}: {
  analysis: DocumentAnalysis
  onToggle: (id: string, done: boolean) => void
  documentTypeHint?: string | null
  onOpenGuidedReview?: () => void
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
    <div key={step.id} data-review-id={step.id}>
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

  const checklistTotal = analysis.actionSteps.length
  const checklistDone = checklistTotal - remaining
  const checklistPct = checklistTotal === 0 ? 100 : Math.round((checklistDone / checklistTotal) * 100)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-display font-bold">Action Steps</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {remaining === 0 ? "All steps complete — great work!" : `${remaining} of ${checklistTotal} remaining — check off items as you complete them`}
          </p>
          {/* Progress bar — always visible, even when complete */}
          <div className="mt-3 space-y-1.5">
            <Progress
              value={checklistPct}
              className={`h-2 ${remaining === 0 ? "bg-emerald-950/40 [&>div]:bg-emerald-500" : "bg-slate-800 [&>div]:bg-violet-500"}`}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground tabular-nums">{checklistDone} of {checklistTotal} complete</span>
              <span className={`text-[10px] font-semibold tabular-nums ${remaining === 0 ? "text-emerald-500" : "text-slate-400"}`}>{checklistPct}%</span>
            </div>
          </div>
        </div>
        {onOpenGuidedReview && <GuidedReviewButton onClick={onOpenGuidedReview} />}
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
function DocumentsTab({ analysis, onToggle, onOpenGuidedReview }: { analysis: DocumentAnalysis; onToggle: (id: string, done: boolean) => void; onOpenGuidedReview?: () => void }) {
  const requiredPending  = analysis.requiredDocuments.filter(d => d.required && !d.obtained)
  const requiredObtained = analysis.requiredDocuments.filter(d => d.required && d.obtained)
  const optionalDocs     = analysis.requiredDocuments.filter(d => !d.required)
  const remaining = requiredPending.length
  const docsTotal = requiredPending.length + requiredObtained.length
  const docsPct = docsTotal === 0 ? 100 : Math.round((requiredObtained.length / docsTotal) * 100)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-display font-bold">Required Documents</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {remaining === 0 ? "All required documents obtained — great work!" : `${remaining} of ${docsTotal} still needed — gather these before submitting`}
          </p>
          {/* Progress bar — always visible, even when complete */}
          <div className="mt-3 space-y-1.5">
            <Progress
              value={docsPct}
              className={`h-2 ${remaining === 0 ? "bg-emerald-950/40 [&>div]:bg-emerald-500" : "bg-slate-800 [&>div]:bg-violet-500"}`}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground tabular-nums">{requiredObtained.length} of {docsTotal} obtained</span>
              <span className={`text-[10px] font-semibold tabular-nums ${remaining === 0 ? "text-emerald-500" : "text-slate-400"}`}>{docsPct}%</span>
            </div>
          </div>
        </div>
        {onOpenGuidedReview && <GuidedReviewButton onClick={onOpenGuidedReview} />}
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
                  {requiredPending.map(doc => (
                    <div key={doc.id} data-review-id={doc.id}>
                      <DocRow doc={doc} onToggle={onToggle} />
                    </div>
                  ))}
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
                  {optionalDocs.map(doc => (
                    <div key={doc.id} data-review-id={doc.id}>
                      <DocRow doc={doc} onToggle={onToggle} />
                    </div>
                  ))}
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
                  {requiredObtained.map(doc => (
                    <div key={doc.id} data-review-id={doc.id}>
                      <DocRow doc={doc} onToggle={onToggle} />
                    </div>
                  ))}
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
function addToCalendar(dl: DocumentAnalysis["deadlines"][0], docTitle: string) {
  const parsedDate = dl.date ? new Date(dl.date) : null
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000
  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  const start = isValidDate ? formatIcsDate(parsedDate!) : formatIcsDate(new Date())
  const end   = isValidDate
    ? formatIcsDate(new Date(parsedDate!.getTime() + 60 * 60 * 1000))
    : formatIcsDate(new Date(Date.now() + 60 * 60 * 1000))
  const summary = `[PlainPath] ${dl.title}`
  const description = `From: ${docTitle}\\n\\n${dl.description || ""}${dl.sourceEvidence ? "\\n\\nSource: " + dl.sourceEvidence : ""}`
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PlainPath//Deadline//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@plainpath`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  const blob = new Blob([ics], { type: "text/calendar" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${dl.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function DeadlineCard({ dl, accentRed, docTitle }: { dl: DocumentAnalysis["deadlines"][0]; accentRed: boolean; docTitle: string }) {
  const parsedDate = dl.date ? new Date(dl.date) : null
  const hasCalendarDate = parsedDate && !isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000
  const [reminded, setReminded] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  async function handleReminder() {
    const granted = await requestNotificationPermission()
    if (!granted) {
      alert("Enable browser notifications to set reminders for this deadline.")
      return
    }
    addReminder({ title: dl.title, date: dl.date ?? "", docTitle })
    setReminded(true)
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailInput.includes("@")) return
    setEmailSending(true)
    setEmailError(null)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/reminders/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          deadlineTitle: dl.title,
          deadlineDate: dl.date ?? "",
          deadlineDescription: dl.description ?? "",
          docTitle,
        }),
      })
      if (res.ok) {
        setEmailSent(true)
        setEmailOpen(false)
      } else {
        const data = await res.json().catch(() => ({}))
        setEmailError((data as any).error ?? "Failed to send. Please try again.")
      }
    } catch {
      setEmailError("Network error. Please try again.")
    } finally {
      setEmailSending(false)
    }
  }

  return (
    <div className={`p-4 rounded-2xl border ${accentRed ? "bg-white/70 dark:bg-red-950/30 border-red-200/40 dark:border-red-900/30" : "bg-white/70 dark:bg-amber-950/30 border-amber-200/40 dark:border-amber-900/30"}`}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <p className={`text-sm font-bold ${accentRed ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>{dl.date}</p>
          <h4 className="font-bold text-foreground">{dl.title}</h4>
        </div>
        <div className="flex gap-1.5 shrink-0 items-start">
          {dl.isHard && <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">Hard</Badge>}
          <ConfidenceBadge level={dl.confidence} />
          {hasCalendarDate && (
            <button
              onClick={() => addToCalendar(dl, docTitle)}
              title="Add to calendar (.ics)"
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => void handleReminder()}
            title={reminded ? "Reminder set" : "Set browser reminder"}
            className={`p-1 rounded-lg transition-colors ${reminded ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            {reminded ? <BellDot className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => { setEmailOpen(o => !o); setEmailError(null) }}
            title={emailSent ? "Email reminder sent" : "Email me a reminder"}
            className={`p-1 rounded-lg transition-colors ${emailSent ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            <Mail className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-2.5">{dl.description}</p>

      {emailOpen && !emailSent && (
        <form onSubmit={(e) => void handleEmailSubmit(e)} className="mt-3 flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 min-w-0 text-sm px-3 py-1.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={emailSending || !emailInput.includes("@")}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {emailSending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
      {emailSent && (
        <p className="mt-2 text-xs text-primary font-medium">✓ Reminder email sent!</p>
      )}
      {emailError && (
        <p className="mt-2 text-xs text-destructive">{emailError}</p>
      )}

      <EvidenceTooltip text={dl.sourceEvidence} />
    </div>
  )
}

function DeadlinesTab({ analysis }: { analysis: DocumentAnalysis }) {
  const hardDls = analysis.deadlines.filter(d => d.isHard)
  const softDls = analysis.deadlines.filter(d => !d.isHard)
  const docTitle = analysis.title || "Document"
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
                  {hardDls.map(dl => <DeadlineCard key={dl.id} dl={dl} accentRed docTitle={docTitle} />)}
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
                  {softDls.map(dl => <DeadlineCard key={dl.id} dl={dl} accentRed={false} docTitle={docTitle} />)}
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
type NegotiationResult = { strategy: string; counterLanguage: string; talkingPoints: string[] }

function RiskCard({ risk, documentType }: { risk: DocumentAnalysis["risks"][0]; documentType?: string }) {
  const isHigh   = risk.severity === "high"
  const isMedium = risk.severity === "medium"
  const cardCls = isHigh
    ? "bg-white/70 dark:bg-red-950/30 border border-red-200/40 dark:border-red-900/30"
    : isMedium
      ? "bg-white/70 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-900/30"
      : "bg-card border border-border/50"
  const iconCls = isHigh ? "bg-red-100 dark:bg-red-950/60" : isMedium ? "bg-amber-50 dark:bg-amber-950/50" : "bg-secondary"
  const iconColor = isHigh ? "text-red-600 dark:text-red-400" : isMedium ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"

  const { entitlements } = useEntitlements()
  const { getToken } = useAuth()
  const canNegotiate = entitlements?.plan === "pro" || entitlements?.plan === "team"
  const showNegotiate = isHigh || isMedium

  const [negotiating, setNegotiating] = useState(false)
  const [negotiation, setNegotiation] = useState<NegotiationResult | null>(null)
  const [negotiateError, setNegotiateError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleNegotiate = async () => {
    if (negotiation) { setOpen(o => !o); return }
    setNegotiating(true)
    setNegotiateError(null)
    try {
      const token = await getToken().catch(() => null)
      const res = await fetch(`${getApiBaseUrl()}/api/documents/negotiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          riskTitle: risk.title,
          riskDescription: risk.description,
          severity: risk.severity,
          documentType: documentType ?? "contract",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message ?? "Negotiation failed")
      setNegotiation(data as NegotiationResult)
      setOpen(true)
    } catch (err) {
      setNegotiateError(err instanceof Error ? err.message : "Failed to generate negotiation advice.")
    } finally {
      setNegotiating(false)
    }
  }

  return (
    <div className={`rounded-2xl overflow-hidden ${cardCls}`}>
      <div className="p-5">
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
            {showNegotiate && (
              <div className="mt-3 flex items-center gap-2">
                {canNegotiate ? (
                  <button
                    onClick={() => void handleNegotiate()}
                    disabled={negotiating}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isHigh
                        ? "border-red-300/50 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
                        : "border-amber-300/50 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50"
                    }`}
                  >
                    {negotiating ? (
                      <><Loader2 className="w-3 h-3 animate-spin" />Thinking…</>
                    ) : (
                      <><MessageSquare className="w-3 h-3" />Negotiate this</>
                    )}
                    {negotiation && <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />}
                  </button>
                ) : (
                  <a
                    href="subscribe"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all"
                  >
                    <Lock className="w-3 h-3" />
                    Negotiate this — Pro
                  </a>
                )}
                {negotiateError && <span className="text-xs text-destructive">{negotiateError}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Negotiation result panel */}
      <AnimatePresence>
        {open && negotiation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/30"
          >
            <div className="p-5 bg-background/60 dark:bg-background/20 space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Strategy</p>
                <p className="text-sm text-foreground leading-relaxed">{negotiation.strategy}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Suggested counter-language</p>
                <div className="relative rounded-xl border border-border/60 bg-muted/40 p-3.5">
                  <p className="text-sm font-mono text-foreground leading-relaxed whitespace-pre-wrap">{negotiation.counterLanguage}</p>
                  <button
                    onClick={() => void navigator.clipboard.writeText(negotiation.counterLanguage)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title="Copy to clipboard"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </button>
                </div>
              </div>
              {negotiation.talkingPoints.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Talking points</p>
                  <ul className="space-y-1.5">
                    {negotiation.talkingPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold text-primary">{i + 1}</span>
                        <span className="text-foreground/85 leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground/50 italic">PlainPath's negotiation advice is for informational purposes — not legal counsel. For major contracts, consult an attorney.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RisksTab({ analysis, onOpenGuidedReview, documentType }: { analysis: DocumentAnalysis; onOpenGuidedReview?: () => void; documentType?: string }) {
  const highRisks   = analysis.risks.filter(r => r.severity === "high")
  const medRisks    = analysis.risks.filter(r => r.severity === "medium")
  const lowRisks    = analysis.risks.filter(r => r.severity === "low" || (r.severity !== "high" && r.severity !== "medium"))

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold">Risks & Warnings</h2>
          <p className="text-sm text-muted-foreground mt-1">Potential issues that could delay, block, or invalidate your submission</p>
        </div>
        {onOpenGuidedReview && <GuidedReviewButton onClick={onOpenGuidedReview} />}
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
                  {highRisks.map(r => (
                    <div key={r.id} data-review-id={r.id}>
                      <RiskCard risk={r} documentType={documentType} />
                    </div>
                  ))}
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
                  {medRisks.map(r => (
                    <div key={r.id} data-review-id={r.id}>
                      <RiskCard risk={r} documentType={documentType} />
                    </div>
                  ))}
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
                  {lowRisks.map(r => (
                    <div key={r.id} data-review-id={r.id}>
                      <RiskCard risk={r} documentType={documentType} />
                    </div>
                  ))}
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
  const [seconds, setSeconds] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Skeleton header */}
      <div className="bg-background/95 border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
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

      {/* "Still working" message after 15s */}
      {seconds >= 15 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-xl px-4 py-2.5 border border-border/30">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
            {seconds >= 30
              ? "Almost there — complex documents take a little longer…"
              : "Still working… larger documents can take up to 30 seconds."}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-5 sm:space-y-6">
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

function SourceSectionsTab({ analysis, documentTypeHint, onOpenGuidedReview }: { analysis: DocumentAnalysis; documentTypeHint: string | null; onOpenGuidedReview?: () => void }) {
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
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Source Sections</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            The raw text of your document, broken into numbered sections. Click any section to unlock a plain-English breakdown — what it means, what it requires from you, why it matters, and what risks it carries.
          </p>
        </div>
        {onOpenGuidedReview && <GuidedReviewButton onClick={onOpenGuidedReview} />}
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
            <div key={s.id} data-review-id={s.id}>
              <SectionCard
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
            </div>
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
          <div key={s.id} data-review-id={s.id}>
            <SectionCard
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
          </div>
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
  const glossary = findGlossaryEntry(term.term, term.category)
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
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {typeof term.isNegotiable === "boolean" && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                term.isNegotiable
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  : "bg-muted/60 text-muted-foreground border-border/40"
              }`}>
                {term.isNegotiable ? "Negotiable" : "Standard"}
              </span>
            )}
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
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
          {term.marketContext && (
            <div className="bg-blue-50/60 dark:bg-blue-950/20 rounded-lg px-3 py-2.5 flex items-start gap-2 border border-blue-100 dark:border-blue-900/40">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-0.5">Market context</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{term.marketContext}</p>
              </div>
            </div>
          )}
          {term.proposedChange && term.isNegotiable && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg px-3 py-2.5 flex items-start gap-2 border border-emerald-100 dark:border-emerald-900/40">
              <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-0.5">Suggested ask</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{term.proposedChange}</p>
              </div>
            </div>
          )}
          {term.questionToAsk && (
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 flex items-start gap-2 mt-1">
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Question to ask</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{term.questionToAsk}</p>
              </div>
            </div>
          )}
          {glossary && (
            <div className="border-t border-border/20 pt-3 mt-1">
              <div className="flex items-start gap-2">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    Legal definition · {glossary.formalName}
                  </p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{glossary.definition}</p>
                  {glossary.learnMoreUrl && (
                    <a
                      href={glossary.learnMoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors mt-0.5"
                    >
                      Learn more ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KeyTermsTab({ analysis }: { analysis: DocumentAnalysis }) {
  const [termSearch, setTermSearch] = useState("")
  const keyTerms = analysis.keyTerms ?? []
  const sorted = [...keyTerms].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return (order[a.severity] ?? 1) - (order[b.severity] ?? 1)
  })
  const filtered = termSearch.trim()
    ? sorted.filter(k =>
        k.term.toLowerCase().includes(termSearch.toLowerCase()) ||
        k.explanation.toLowerCase().includes(termSearch.toLowerCase()) ||
        (k.category ?? "").toLowerCase().includes(termSearch.toLowerCase())
      )
    : sorted
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
    <div className="space-y-5 max-w-4xl">
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
      {sorted.length > 4 && (
        <div className="relative">
          <input
            type="text"
            value={termSearch}
            onChange={e => setTermSearch(e.target.value)}
            placeholder="Search key terms…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-border/50 bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
          />
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
          {termSearch && (
            <button
              onClick={() => setTermSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      {filtered.length === 0 && termSearch ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No key terms match "<span className="font-medium">{termSearch}</span>"</p>
          <button onClick={() => setTermSearch("")} className="text-xs text-primary mt-1 hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(kt => <KeyTermCard key={kt.id} term={kt} />)}
        </div>
      )}
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
   SHARE SANITIZATION
   Strip raw document material (sections and sourceEvidence fields) from the
   analysis object before publishing it via a share link.  The privacy policy
   guarantees that shared analyses contain only "structured analysis output"
   with "no document text attached."
──────────────────────────────────────────────── */
function sanitizeAnalysisForShare(analysis: DocumentAnalysis): Omit<DocumentAnalysis, "sections"> & { sections?: never } {
  const { sections: _sections, ...rest } = analysis
  return {
    ...rest,
    actionSteps: rest.actionSteps?.map(({ sourceEvidence: _se, ...s }) => s) ?? [],
    requiredDocuments: rest.requiredDocuments?.map(({ sourceEvidence: _se, ...d }) => d) ?? [],
    deadlines: rest.deadlines?.map(({ sourceEvidence: _se, ...d }) => d) ?? [],
    risks: rest.risks?.map(({ sourceEvidence: _se, ...r }) => r) ?? [],
  }
}

/* ────────────────────────────────────────────────
   EXPORT MENU
──────────────────────────────────────────────── */
function ExportMenu({ analysis }: { analysis: DocumentAnalysis }) {
  const [copiedText, setCopiedText] = useState(false)
  const [shareErr, setShareErr] = useState(false)
  const [, setLocation] = useLocation()

  function handleSendToRedact() {
    setLocation("/redact")
  }
  const [printUnavailable, setPrintUnavailable] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

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

  const handleShareLink = async (e: Event) => {
    e.preventDefault()
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
      return
    }
    setShareLoading(true)
    try {
      const base = getApiBaseUrl()
      const sanitized = sanitizeAnalysisForShare(analysis)
      const res = await fetch(`${base}/api/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: sanitized }),
      })
      const data = await res.json() as { token?: string }
      if (!data.token) throw new Error("No token")
      const fullUrl = `${window.location.origin}/shared/${data.token}`
      setShareLink(fullUrl)
      await navigator.clipboard.writeText(fullUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      setShareErr(true)
      setTimeout(() => setShareErr(false), 2500)
    } finally {
      setShareLoading(false)
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
        <DropdownMenuItem
          className="gap-2.5 cursor-pointer"
          onSelect={() => {
            const pack = analysis.actionPack as any
            const lines = [
              "PLAINPATH ANALYSIS AUDIT TRAIL",
              "=".repeat(38),
              `Document: ${analysis.title}`,
              `Type: ${analysis.documentType}`,
              `Analyzed: ${new Date(analysis.processedAt).toLocaleString()}`,
              `Audit generated: ${new Date().toLocaleString()}`,
              "",
              "FINDINGS SUMMARY",
              `Action steps: ${pack?.actionSteps?.length ?? 0}`,
              `Required documents: ${pack?.requiredDocuments?.length ?? 0}`,
              `Hard deadlines: ${pack?.hardDeadlines?.length ?? 0}`,
              `High risks: ${pack?.risks?.filter((r: any) => r.severity === "high").length ?? 0}`,
              `Overall confidence: ${analysis.overallConfidence}`,
              "",
              "Generated by PlainPath (https://plainpathapp.com/)",
              "Methodology reviewed by licensed attorneys. Not legal advice.",
            ]
            const blob = new Blob([lines.join("\n")], { type: "text/plain" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `plainpath-audit-${Date.now()}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Download audit trail</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2.5 cursor-pointer"
          onSelect={(e) => { void handleShareLink(e) }}
        >
          {copiedLink
            ? <Check className="w-3.5 h-3.5 text-green-600" />
            : shareLoading
            ? <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            : <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
          }
          <span>
            {copiedLink ? "Link copied!" : shareLoading ? "Creating link…" : shareLink ? "Copy link again" : "Copy share link"}
          </span>
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
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
          Send to tool
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2.5 cursor-pointer"
          onSelect={(e) => { e.preventDefault(); handleSendToRedact() }}
        >
          <EyeOff className="w-3.5 h-3.5 text-amber-500" />
          <span>Redact Sensitive Info</span>
        </DropdownMenuItem>
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
        <span>Generated by PlainPath · plainpathapp.com</span>
        <span>Not legal, financial, or professional advice.</span>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   GUIDED REVIEW
──────────────────────────────────────────────── */
function GuidedReviewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ touchAction: "manipulation" }}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/25 bg-primary/6 text-primary hover:bg-primary/12 active:bg-primary/18 transition-colors text-xs font-semibold shrink-0 whitespace-nowrap"
    >
      <Eye className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Guided Review</span>
      <span className="sm:hidden">Review</span>
    </button>
  )
}

type ReviewItem = {
  id: string
  category: string
  title: string
  body: string
  evidence?: string
  color: "red" | "amber" | "blue" | "violet" | "slate"
  completed?: boolean
  toggleType?: "action" | "doc"
}

const GUIDED_CONTEXT_LABELS: Record<string, string> = {
  missing: "What's Missing",
  checklist: "Action Checklist",
  documents: "Required Documents",
  risks: "Risks & Warnings",
  "source-sections": "Source Sections",
  summary: "Priority Overview",
}

const GUIDED_COLOR_STYLES: Record<string, { badge: string; card: string }> = {
  red:    { badge: "bg-red-100 dark:bg-red-950/60 border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-400",    card: "border-red-200/40 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/15" },
  amber:  { badge: "bg-amber-100 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-400", card: "border-amber-200/40 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/15" },
  blue:   { badge: "bg-blue-100 dark:bg-blue-950/60 border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-400",   card: "border-blue-200/40 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/15" },
  violet: { badge: "bg-violet-100 dark:bg-violet-950/60 border-violet-200/60 dark:border-violet-800/40 text-violet-700 dark:text-violet-400", card: "border-violet-200/40 dark:border-violet-900/30 bg-violet-50/30 dark:bg-violet-950/15" },
  slate:  { badge: "bg-secondary/60 border-border/40 text-muted-foreground", card: "border-border/30 bg-secondary/20" },
}

function GuidedReviewOverlay({
  context, analysis, onClose, onActionToggle, onDocToggle,
}: {
  context: string
  analysis: DocumentAnalysis
  onClose: () => void
  onActionToggle: (id: string, done: boolean) => void
  onDocToggle: (id: string, done: boolean) => void
}) {
  const [idx, setIdx] = useState(0)

  const items = useMemo((): ReviewItem[] => {
    switch (context) {
      case "missing":
        return [
          ...analysis.actionSteps.filter(s => s.priority === "high" && !s.completed).map(s => ({ id: s.id, category: "Blocking Step", title: s.title, body: s.description, evidence: s.sourceEvidence, color: "red" as const, completed: s.completed, toggleType: "action" as const })),
          ...analysis.requiredDocuments.filter(d => d.required && !d.obtained).map(d => ({ id: d.id, category: "Required Document", title: d.name, body: (d as any).description ?? "", color: "amber" as const, completed: d.obtained, toggleType: "doc" as const })),
          ...analysis.deadlines.filter(d => d.isHard).map(d => ({ id: d.id, category: "Hard Deadline", title: d.description, body: d.dueDate ?? "", color: "amber" as const })),
          ...analysis.risks.filter(r => r.severity === "high").map(r => ({ id: r.id, category: "High Risk", title: r.title, body: r.description, evidence: r.sourceEvidence, color: "red" as const })),
        ]
      case "checklist":
        return [
          ...analysis.actionSteps.filter(s => s.priority === "high").map(s => ({ id: s.id, category: "High Priority", title: s.title, body: s.description, evidence: s.sourceEvidence, color: "red" as const, completed: s.completed, toggleType: "action" as const })),
          ...analysis.actionSteps.filter(s => s.priority === "medium").map(s => ({ id: s.id, category: "Medium Priority", title: s.title, body: s.description, evidence: s.sourceEvidence, color: "amber" as const, completed: s.completed, toggleType: "action" as const })),
          ...analysis.actionSteps.filter(s => s.priority === "low").map(s => ({ id: s.id, category: "Low Priority", title: s.title, body: s.description, evidence: s.sourceEvidence, color: "slate" as const, completed: s.completed, toggleType: "action" as const })),
        ]
      case "documents":
        return [
          ...analysis.requiredDocuments.filter(d => d.required && !d.obtained).map(d => ({ id: d.id, category: "Still Needed", title: d.name, body: (d as any).description ?? "", color: "amber" as const, completed: d.obtained, toggleType: "doc" as const })),
          ...analysis.requiredDocuments.filter(d => d.required && d.obtained).map(d => ({ id: d.id, category: "Obtained", title: d.name, body: (d as any).description ?? "", color: "slate" as const, completed: d.obtained, toggleType: "doc" as const })),
          ...analysis.requiredDocuments.filter(d => !d.required).map(d => ({ id: d.id, category: "Optional", title: d.name, body: (d as any).description ?? "", color: "blue" as const })),
        ]
      case "risks":
        return [
          ...analysis.risks.filter(r => r.severity === "high").map(r => ({ id: r.id, category: "High Risk", title: r.title, body: r.description, evidence: r.sourceEvidence, color: "red" as const })),
          ...analysis.risks.filter(r => r.severity === "medium").map(r => ({ id: r.id, category: "Medium Risk", title: r.title, body: r.description, evidence: r.sourceEvidence, color: "amber" as const })),
          ...analysis.risks.filter(r => r.severity !== "high" && r.severity !== "medium").map(r => ({ id: r.id, category: "Low Risk", title: r.title, body: r.description, evidence: r.sourceEvidence, color: "slate" as const })),
        ]
      case "source-sections":
        return (analysis.sections ?? []).map((s, i) => ({ id: s.id, category: `Section ${i + 1}`, title: s.title ?? `Section ${i + 1}`, body: s.content, color: "blue" as const }))
      case "summary":
        return [
          ...analysis.actionSteps.filter(s => s.priority === "high" && !s.completed).map(s => ({ id: s.id, category: "Urgent Step", title: s.title, body: s.description, evidence: s.sourceEvidence, color: "red" as const, completed: s.completed, toggleType: "action" as const })),
          ...analysis.deadlines.filter(d => d.isHard).map(d => ({ id: d.id, category: "Hard Deadline", title: d.description, body: d.dueDate ?? "", color: "amber" as const })),
          ...analysis.risks.filter(r => r.severity === "high").map(r => ({ id: r.id, category: "High Risk", title: r.title, body: r.description, evidence: r.sourceEvidence, color: "red" as const })),
        ]
      default:
        return []
    }
  }, [context, analysis])

  useEffect(() => { setIdx(0) }, [context])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setIdx(i => Math.min(items.length - 1, i + 1))
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   setIdx(i => Math.max(0, i - 1))
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose, items.length])

  // Source linkage: highlight + scroll to the matching item in the main page
  const activeId = items[idx]?.id ?? null
  useEffect(() => {
    const clearAll = () => {
      document.querySelectorAll("[data-gr-hl]").forEach(el => {
        const h = el as HTMLElement
        h.style.outline = ""
        h.style.boxShadow = ""
        h.style.borderRadius = ""
        h.removeAttribute("data-gr-hl")
      })
    }
    clearAll()
    if (!activeId) return
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-review-id="${activeId}"]`) as HTMLElement | null
      if (!el) return
      el.setAttribute("data-gr-hl", "true")
      el.style.outline = "2px solid rgba(99,102,241,0.55)"
      el.style.boxShadow = "0 0 0 5px rgba(99,102,241,0.09), 0 4px 18px rgba(99,102,241,0.09)"
      el.style.borderRadius = "0.75rem"
      el.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 180)
    return () => {
      clearTimeout(timer)
      clearAll()
    }
  }, [activeId])

  // Clean up all highlights on unmount
  useEffect(() => () => {
    document.querySelectorAll("[data-gr-hl]").forEach(el => {
      const h = el as HTMLElement
      h.style.outline = ""
      h.style.boxShadow = ""
      h.style.borderRadius = ""
      h.removeAttribute("data-gr-hl")
    })
  }, [])

  const item = items[idx] ?? null
  const total = items.length
  const styles = item ? GUIDED_COLOR_STYLES[item.color] : GUIDED_COLOR_STYLES.slate

  const handleToggle = () => {
    if (!item?.toggleType) return
    const newDone = !item.completed
    if (item.toggleType === "action") onActionToggle(item.id, newDone)
    else onDocToggle(item.id, newDone)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-stretch justify-end"
    >
      {/* Backdrop — light dim so main content stays readable */}
      <div className="absolute inset-0 bg-black/[0.12] backdrop-blur-[2px]" onClick={onClose} />

      {/* Slide-in panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="relative z-10 w-full sm:w-[540px] bg-background border-l border-border/60 shadow-2xl flex flex-col"
        style={{ maxHeight: "100dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 shrink-0 bg-secondary/20">
          <button
            onClick={onClose}
            style={{ touchAction: "manipulation" }}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary active:bg-secondary transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/55 mb-0.5 flex items-center gap-1.5">
              <Eye className="w-3 h-3" />Guided Review
            </p>
            <h2 className="text-[15px] font-bold text-foreground truncate leading-tight">{GUIDED_CONTEXT_LABELS[context] ?? context}</h2>
          </div>
          {total > 0 && (
            <div className="shrink-0 text-right">
              <span className="text-xs font-mono font-semibold text-foreground/70 bg-secondary px-2.5 py-1 rounded-lg">
                {idx + 1} <span className="text-muted-foreground/50">/ {total}</span>
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-1" />
              <p className="font-bold text-foreground text-base">Nothing to review</p>
              <p className="text-sm text-muted-foreground">No items available for this view.</p>
            </div>
          ) : item ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${context}-${idx}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Category badge */}
                <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${styles.badge}`}>
                  {item.category}
                </span>

                {/* Main card */}
                <div className={`rounded-2xl border p-6 space-y-4 ${styles.card}`}>
                  <h3 className="text-[1.05rem] font-bold text-foreground leading-snug">{item.title}</h3>
                  {item.body && (
                    <p className="text-sm text-muted-foreground leading-loose">{item.body}</p>
                  )}
                </div>

                {/* Evidence — source linkage callout */}
                {item.evidence && (
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.035] p-4 flex gap-3">
                    <div className="w-0.5 shrink-0 rounded-full bg-primary/35 self-stretch" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/55 mb-2 flex items-center gap-1.5">
                        <AlignLeft className="w-3 h-3" />Source reference
                      </p>
                      <p className="text-xs text-foreground/80 leading-relaxed italic">"{item.evidence}"</p>
                    </div>
                  </div>
                )}

                {/* Complete toggle */}
                {item.toggleType && (
                  <button
                    onClick={handleToggle}
                    style={{ touchAction: "manipulation" }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-semibold ${
                      item.completed
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400"
                        : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {item.completed
                      ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                      : <div className="w-4 h-4 rounded border-2 border-current shrink-0" />
                    }
                    {item.completed ? "Marked complete — tap to undo" : "Mark as complete"}
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>

        {/* Navigation footer */}
        {total > 0 && (
          <div className="shrink-0 border-t border-border/40 px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={idx === 0}
                onClick={() => setIdx(i => Math.max(0, i - 1))}
                style={{ touchAction: "manipulation" }}
                className="flex-1 gap-1.5 h-11 text-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              {idx < total - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
                  style={{ touchAction: "manipulation" }}
                  className="flex-1 gap-1.5 h-11 text-sm"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={onClose}
                  style={{ touchAction: "manipulation" }}
                  className="flex-1 gap-1.5 h-11 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </Button>
              )}
            </div>
            {total <= 14 && (
              <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: total }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    style={{ touchAction: "manipulation" }}
                    className={`rounded-full transition-all duration-200 ${i === idx ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-border/60 hover:bg-border"}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
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
