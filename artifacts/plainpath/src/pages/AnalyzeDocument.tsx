import React, { useEffect, useRef, useState, useCallback } from "react"
import { useLocation } from "wouter"
import {
  FileText, AlertTriangle, Calendar, ChevronRight, MessageSquare,
  CheckCircle2, ArrowRight, X, Upload, Shield, Bookmark,
  BookmarkCheck, Loader2, RotateCcw, AlertCircle,
  Zap, ArrowLeft, BookOpen, FileWarning, GitCompare, ListChecks, Info
} from "lucide-react"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { useEntitlements } from "@/hooks/useEntitlements"
import { useUser } from "@clerk/react"
import { saveCloudAnalysis } from "@/lib/cloudHistory"
import { saveAnalysis } from "@/lib/savedAnalyses"
import type { DocumentAnalysis, DocumentSection, RiskItem, ActionStep, Deadline, KeyTerm } from "@workspace/api-client-react"

// ─── Source chip matching ────────────────────────────────────────────────────

function findBestSection(evidence: string, sections: DocumentSection[]): string | null {
  if (!evidence || !sections.length) return null
  const words = evidence.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  if (!words.length) return null
  let bestId: string | null = null
  let bestScore = 0
  for (const s of sections) {
    const text = `${s.title ?? ""} ${s.content}`.toLowerCase()
    const score = words.filter(w => text.includes(w)).length
    if (score > bestScore) { bestScore = score; bestId = s.id }
  }
  return bestScore >= 3 ? bestId : null
}

// ─── Source chip ─────────────────────────────────────────────────────────────

function SourceChip({
  evidence, label, id, active, onClick, uncertain
}: {
  evidence?: string; label?: string; id: string; active?: boolean; onClick?: () => void; uncertain?: boolean
}) {
  if (!evidence && !label) return null
  const display = label ?? (evidence ? evidence.slice(0, 22) + (evidence.length > 22 ? "…" : "") : "source")
  return (
    <button
      onClick={onClick}
      title={evidence}
      className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium cursor-pointer transition-all whitespace-nowrap ${
        active
          ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_8px_rgba(139,92,246,0.22)]"
          : uncertain
          ? "bg-amber-500/12 border border-amber-400/22 text-amber-300/75 hover:bg-amber-500/20"
          : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20 hover:text-violet-200"
      }`}
    >
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
      {uncertain && <span className="opacity-60">~</span>}
      {display}
    </button>
  )
}

// ─── Section label ───────────────────────────────────────────────────────────

function SLabel({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-white/28 shrink-0">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/26 flex-1">{children}</p>
      {right}
    </div>
  )
}

// ─── Document viewer ─────────────────────────────────────────────────────────

const DOC_TEXT_SIZES = [
  { label: "A",  body: "text-[11px]", title: "text-xs"  },
  { label: "A+", body: "text-xs",     title: "text-[13px]" },
  { label: "A++",body: "text-sm",     title: "text-[14px]" },
] as const

function DocViewer({
  analysis, activeChipId, activeEvidence, highlightSectionId, onDismiss, sectionRefs
}: {
  analysis: DocumentAnalysis
  activeChipId: string | null
  activeEvidence: string | null
  highlightSectionId: string | null
  onDismiss: () => void
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}) {
  const sections: DocumentSection[] = analysis.sections ?? []
  const isLowConf = analysis.overallConfidence === "low"
  const [sizeIdx, setSizeIdx] = useState<0 | 1 | 2>(0)
  const textSize = DOC_TEXT_SIZES[sizeIdx]

  return (
    <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
      {/* Viewer toolbar */}
      <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
        <FileText className={`w-3.5 h-3.5 shrink-0 ${isLowConf ? "text-amber-400/50" : "text-violet-400/60"}`} />
        <span className="text-white/55 text-xs flex-1 truncate">{analysis.title}</span>
        {sections.length > 0 && (
          <span className="text-white/28 text-xs shrink-0">{sections.length} sections</span>
        )}
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <div className="flex items-center gap-0.5">
          {DOC_TEXT_SIZES.map((s, i) => (
            <button
              key={i}
              onClick={() => setSizeIdx(i as 0 | 1 | 2)}
              title={`Text size: ${s.label}`}
              className={`h-5 px-1.5 rounded text-[9px] font-medium transition-colors ${
                i === sizeIdx
                  ? "bg-white/[0.09] text-white/70"
                  : "text-white/28 hover:text-white/55 hover:bg-white/[0.05]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active citation banner */}
      {activeChipId && (
        <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-violet-200/85 text-[10px] font-medium truncate">
              {activeEvidence
                ? `Source: ${activeEvidence.length > 50 ? activeEvidence.slice(0, 50) + "…" : activeEvidence}`
                : "Viewing source — relevant text highlighted below"}
            </p>
            <p className="text-violet-300/40 text-[9px]">Jumped from findings panel — matching text highlighted below</p>
          </div>
          <button onClick={onDismiss} className="text-white/20 hover:text-white/45 shrink-0 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {sections.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <BookOpen className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-white/22 text-sm font-medium mb-1">Document sections not available</p>
            <p className="text-white/15 text-xs max-w-xs">Upload a text-based PDF or DOCX to see the document content here alongside your analysis.</p>
          </div>
        ) : (
          sections.map((section, idx) => {
            const isHighlighted = highlightSectionId === section.id
            return (
              <div
                key={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el }}
                className={`w-full rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${
                  isHighlighted
                    ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                    : isLowConf ? "border-amber-500/12 bg-amber-500/[0.015]" : "border-white/[0.05] bg-white/[0.015]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-[9px] font-mono ${isHighlighted ? "text-violet-300/60" : "text-white/18"}`}>
                    Section {idx + 1}
                  </span>
                  {isHighlighted && (
                    <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
                      <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-200/75 text-[9px]">Source</span>
                    </div>
                  )}
                </div>
                {section.title && (
                  <p className={`font-semibold leading-tight ${textSize.title} ${isHighlighted ? "text-violet-300/90" : "text-white/72"}`}>
                    {section.title}
                  </p>
                )}
                <p className={`leading-relaxed ${textSize.body} ${isHighlighted ? "text-white/82" : "text-white/62"}`}>
                  {section.content}
                </p>
                {isHighlighted && activeEvidence && (
                  <div className="mt-1.5 rounded-lg border border-violet-500/18 bg-violet-500/[0.06] px-2.5 py-1.5">
                    <p className="text-violet-200/60 text-[9px] leading-relaxed line-clamp-2">{activeEvidence}</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Page nav footer */}
      {sections.length > 0 && (
        <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
          <span className="text-white/20 text-xs">
            {highlightSectionId
              ? `Section ${(sections.findIndex(s => s.id === highlightSectionId) + 1)} of ${sections.length}`
              : `${sections.length} section${sections.length !== 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-1">
            {sections.slice(0, 7).map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  const ref = sectionRefs.current[s.id]
                  if (ref) ref.scrollIntoView({ behavior: "smooth", block: "center" })
                }}
                className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center transition-colors ${
                  highlightSectionId === s.id
                    ? "bg-violet-600 text-white"
                    : "text-white/22 hover:text-white/45 hover:bg-white/[0.05]"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <span className="text-white/14 text-[10px]">Jump to section</span>
        </div>
      )}
    </div>
  )
}

// ─── Intelligence panel ───────────────────────────────────────────────────────

const RISK_SEVERITY_STYLES = {
  high:   { border: "border-red-500/22 bg-red-500/[0.04]",    dot: "bg-red-400",   text: "text-red-300"   },
  medium: { border: "border-amber-500/15 bg-amber-500/[0.03]", dot: "bg-amber-400", text: "text-amber-300" },
  low:    { border: "border-white/[0.05] bg-transparent",      dot: "bg-white/22",  text: "text-white/35"  },
}

type StepStatus = "not-started" | "in-progress" | "complete"

const STEP_STATUS_CYCLE: Record<StepStatus, StepStatus> = {
  "not-started": "in-progress",
  "in-progress": "complete",
  "complete": "not-started",
}

const STEP_STATUS_UI: Record<StepStatus, { dot: string; label: string; ring: string }> = {
  "not-started": { dot: "bg-white/18 border border-white/20",            label: "Not started", ring: "" },
  "in-progress":  { dot: "bg-amber-400/70 border border-amber-400/50",   label: "In progress", ring: "ring-1 ring-amber-400/20" },
  "complete":     { dot: "bg-emerald-400 border border-emerald-400/60",  label: "Complete",    ring: "ring-1 ring-emerald-400/20" },
}

function IntelPanel({
  analysis, onChipClick, activeChipId, sections
}: {
  analysis: DocumentAnalysis
  onChipClick: (chipId: string, evidence: string) => void
  activeChipId: string | null
  sections: DocumentSection[]
}) {
  const { entitlements } = useEntitlements()
  const isPro = entitlements?.plan === "pro" || entitlements?.plan === "team"

  const actionSteps = analysis.actionSteps ?? []
  const deadlines = analysis.deadlines ?? []
  const risks = analysis.risks ?? []
  const keyTerms = analysis.keyTerms ?? []
  const redFlags = analysis.redFlags ?? []
  const missingDocs = (analysis.requiredDocuments ?? []).filter(d => !d.obtained)

  const urgentSteps = actionSteps.filter(s => s.priority === "high")
  const hardDeadlines = deadlines.filter(d => d.isHard)
  const sourceBackedCount = [
    ...actionSteps.filter(s => s.sourceEvidence),
    ...deadlines.filter(d => d.sourceEvidence),
    ...risks.filter(r => r.sourceEvidence),
  ].length

  const overallStatus: "ready" | "needs-completion" | "needs-review" =
    missingDocs.length > 0 ? "needs-completion"
    : urgentSteps.length > 0 ? "needs-review"
    : "ready"

  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(() => {
    const init: Record<string, StepStatus> = {}
    for (const s of actionSteps) {
      init[s.id] = s.completed ? "complete" : "not-started"
    }
    return init
  })

  function cycleStatus(stepId: string) {
    setStepStatuses(prev => ({
      ...prev,
      [stepId]: STEP_STATUS_CYCLE[prev[stepId] ?? "not-started"],
    }))
  }

  function makeChipId(prefix: string, id: string) { return `${prefix}-${id}` }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
      <div className="p-5 flex flex-col gap-5">

        {/* Doc identity */}
        <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-white/90 text-sm font-semibold">{analysis.title}</h1>
              {analysis.documentType && (
                <span className="h-4 px-1.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/35 text-[9px]">
                  {analysis.documentType}
                </span>
              )}
            </div>
            <p className="text-white/22 text-[10px]">Based on the document — verify before acting</p>
          </div>
        </div>

        {/* Red flags banner */}
        {redFlags.length > 0 && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 text-xs font-semibold mb-1">Issues found — review carefully</p>
              <ul className="flex flex-col gap-1">
                {redFlags.map((f, i) => (
                  <li key={i} className="text-white/52 text-[11px] leading-relaxed">{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── A. Plain-English Summary ── */}
        <div className="rounded-xl border border-violet-500/15 bg-violet-600/[0.05] p-4">
          <SLabel icon={<FileText className="w-3.5 h-3.5" />}>Plain-English Summary</SLabel>
          <p className="text-white/72 text-sm leading-[1.7]">{analysis.summary}</p>
          {analysis.plainEnglish?.whatItAsks && analysis.plainEnglish.whatItAsks !== analysis.summary && (
            <p className="text-white/40 text-xs leading-relaxed mt-2">{analysis.plainEnglish.whatItAsks}</p>
          )}
        </div>

        {/* ── B. Action Plan Snapshot ── */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-4">
          <SLabel icon={<ArrowRight className="w-3.5 h-3.5 text-violet-400/60" />}>Action Plan Snapshot</SLabel>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <div className="h-6 px-2.5 rounded-lg border border-violet-500/22 bg-violet-500/[0.07] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              <span className="text-violet-200/80 text-[10px] font-medium">{actionSteps.length} action{actionSteps.length !== 1 ? "s" : ""}</span>
            </div>
            {urgentSteps.length > 0 && (
              <div className="h-6 px-2.5 rounded-lg border border-red-500/25 bg-red-500/[0.07] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-red-200/80 text-[10px] font-medium">{urgentSteps.length} urgent</span>
              </div>
            )}
            {missingDocs.length > 0 && (
              <div className="h-6 px-2.5 rounded-lg border border-amber-500/22 bg-amber-500/[0.06] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-amber-200/80 text-[10px] font-medium">{missingDocs.length} missing</span>
              </div>
            )}
            {deadlines.length > 0 && (
              <div className="h-6 px-2.5 rounded-lg border border-sky-500/20 bg-sky-500/[0.05] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span className="text-sky-200/80 text-[10px] font-medium">{deadlines.length} deadline{deadlines.length !== 1 ? "s" : ""}</span>
              </div>
            )}
            {sourceBackedCount > 0 && (
              <div className="h-6 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
                <span className="text-white/45 text-[10px] font-medium">{sourceBackedCount} source-backed</span>
              </div>
            )}
          </div>
          <div className={`h-7 px-3 rounded-lg border flex items-center gap-2 w-fit ${
            overallStatus === "ready"
              ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300"
              : overallStatus === "needs-completion"
              ? "border-amber-500/25 bg-amber-500/[0.06] text-amber-300"
              : "border-sky-500/20 bg-sky-500/[0.05] text-sky-300"
          }`}>
            {overallStatus === "ready"
              ? <CheckCircle2 className="w-3 h-3 shrink-0" />
              : <AlertTriangle className="w-3 h-3 shrink-0" />}
            <span className="text-[10px] font-medium">
              {overallStatus === "ready" ? "Ready to proceed" : overallStatus === "needs-completion" ? "Needs completion" : "Needs review"}
            </span>
          </div>
        </div>

        {/* ── C. Step-by-Step Required Actions ── */}
        {actionSteps.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{
            background: "linear-gradient(140deg, rgba(109,40,217,0.08) 0%, rgba(12,12,15,0) 55%)"
          }}>
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-600/18 border border-violet-500/28 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-white/85 text-sm font-semibold flex-1">Step-by-Step Required Actions</p>
                {urgentSteps.length > 0 && (
                  <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/20 flex items-center">
                    <span className="text-red-300/90 text-[9px] font-medium">{urgentSteps.length} urgent</span>
                  </div>
                )}
              </div>
              <p className="text-white/35 text-[10px] mt-1.5 ml-8.5">Source-backed next steps · appears to require action · verify before acting</p>
              {/* ── Action steps progress bar ── */}
              {(() => {
                const completedCount = actionSteps.filter(s => (stepStatuses[s.id] ?? "not-started") === "complete").length
                const pct = actionSteps.length === 0 ? 100 : Math.round((completedCount / actionSteps.length) * 100)
                const allDone = completedCount === actionSteps.length && actionSteps.length > 0
                return (
                  <div className="mt-3 ml-8.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white/38 text-[9px]">{completedCount} of {actionSteps.length} complete</span>
                      <span className={`text-[9px] font-semibold tabular-nums ${allDone ? "text-emerald-400" : "text-violet-400/75"}`}>{pct}%</span>
                    </div>
                    <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-400" : "bg-violet-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {allDone && (
                      <p className="text-emerald-400/55 text-[9px] mt-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> All steps marked complete
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
            <div className="p-3 flex flex-col gap-2">
              {actionSteps.map((step, idx) => {
                const chipId = makeChipId("step", step.id)
                const isUrgent = step.priority === "high"
                const isImportant = step.priority === "medium"
                const status = stepStatuses[step.id] ?? "not-started"
                const statusUI = STEP_STATUS_UI[status]
                const isComplete = status === "complete"
                return (
                  <div key={step.id} className={`rounded-xl border px-4 py-3.5 transition-all ${
                    isComplete
                      ? "border-white/[0.05] bg-transparent opacity-55"
                      : isUrgent
                      ? "border-white/[0.12] bg-white/[0.03]"
                      : "border-white/[0.07]"
                  } ${activeChipId === chipId ? "ring-1 ring-violet-500/25 border-violet-500/22" : ""}`}>

                    {/* Step header row */}
                    <div className="flex items-start gap-3 mb-2.5">
                      {/* Step number */}
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isComplete ? "border-white/[0.08] text-white/22" : isUrgent ? "border-violet-500/30 bg-violet-600/12 text-violet-300" : "border-white/[0.10] text-white/35"
                      }`}>
                        {idx + 1}
                      </div>

                      {/* Title + badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <p className={`text-[12px] font-semibold leading-tight ${isComplete ? "line-through text-white/28" : isUrgent ? "text-white/90" : "text-white/65"}`}>
                            {step.title}
                          </p>
                          {/* Priority badge */}
                          {!isComplete && (
                            <span className={`h-4 px-1.5 rounded text-[9px] font-medium shrink-0 ${
                              isUrgent ? "bg-red-500/12 border border-red-500/25 text-red-300"
                              : isImportant ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                              : "bg-white/[0.04] border border-white/[0.08] text-white/30"
                            }`}>
                              {isUrgent ? "Urgent" : isImportant ? "Important" : "Optional"}
                            </span>
                          )}
                        </div>
                        {/* Category / responsible party */}
                        {step.category && (
                          <p className="text-white/22 text-[9px] uppercase tracking-wide">{step.category}</p>
                        )}
                      </div>

                      {/* Status dot — click to cycle */}
                      <button
                        onClick={() => cycleStatus(step.id)}
                        title={`Status: ${statusUI.label} — click to change`}
                        className={`w-5 h-5 rounded-full border shrink-0 mt-0.5 transition-all cursor-pointer hover:scale-110 ${statusUI.dot} ${statusUI.ring}`}
                      />
                    </div>

                    {/* Instruction */}
                    {step.description && (
                      <p className={`text-[11px] leading-relaxed mb-2.5 pl-9 ${isComplete ? "text-white/20" : "text-white/50"}`}>
                        {step.description}
                      </p>
                    )}

                    {/* Footer row: source chip + status label */}
                    <div className="flex items-center gap-2 pl-9">
                      {step.sourceEvidence && (
                        <SourceChip
                          id={chipId} evidence={step.sourceEvidence} label="source"
                          active={activeChipId === chipId}
                          onClick={() => onChipClick(chipId, step.sourceEvidence!)}
                        />
                      )}
                      <span className={`text-[9px] ml-auto ${
                        status === "complete" ? "text-emerald-400/60" : status === "in-progress" ? "text-amber-400/60" : "text-white/18"
                      }`}>{statusUI.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── D. Missing Items / Information Needed ── */}
        {missingDocs.length > 0 && (
          <div className="rounded-xl border border-amber-500/15 bg-amber-600/[0.03] p-4">
            <SLabel icon={<AlertCircle className="w-3.5 h-3.5 text-amber-400/60" />}
              right={<span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/60 text-[9px]">verify before acting</span>}>
              Missing Items / Information Needed
            </SLabel>
            <div className="flex flex-col gap-2.5">
              {missingDocs.map((doc) => {
                const chipId = makeChipId("missing", doc.id)
                return (
                  <div key={doc.id} className="rounded-lg border border-amber-500/12 bg-amber-500/[0.025] px-3.5 py-3">
                    <div className="flex items-start gap-2.5 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70 mt-[5px] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/72 text-xs font-medium mb-0.5">{doc.name}</p>
                        {doc.description && (
                          <p className="text-white/35 text-[10px] leading-relaxed">{doc.description}</p>
                        )}
                      </div>
                      {doc.sourceEvidence && (
                        <SourceChip id={chipId} evidence={doc.sourceEvidence} label="source"
                          active={activeChipId === chipId}
                          onClick={() => onChipClick(chipId, doc.sourceEvidence!)} />
                      )}
                    </div>
                    <p className="text-amber-300/40 text-[9px] pl-4">appears missing · not found in the provided document</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── E. Deadlines & Time-Sensitive Items ── */}
        {deadlines.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <SLabel icon={<Calendar className="w-3.5 h-3.5 text-sky-400/60" />}
              right={hardDeadlines.length > 0 ? (
                <span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/60 text-[9px]">
                  {hardDeadlines.length} hard deadline{hardDeadlines.length !== 1 ? "s" : ""}
                </span>
              ) : null}>
              Deadlines & Time-Sensitive Items
            </SLabel>
            <div className="flex flex-col gap-2">
              {deadlines.map((d) => {
                const chipId = makeChipId("dl", d.id)
                return (
                  <div key={d.id} className={`rounded-lg px-3.5 py-3 border ${
                    d.isHard ? "border-amber-500/18 bg-amber-500/[0.04]" : "border-white/[0.07]"
                  }`}>
                    <div className="flex items-start gap-2.5 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${d.isHard ? "bg-amber-400" : "bg-sky-400/50"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className={`text-[12px] font-semibold ${d.isHard ? "text-amber-300" : "text-white/75"}`}>
                            {d.date}
                            {d.isHard && <span className="ml-1.5 font-normal text-[9px] text-amber-400/70">Hard deadline</span>}
                          </p>
                        </div>
                        <p className="text-white/45 text-[10px] font-medium mb-0.5">{d.title}</p>
                        {d.description && (
                          <p className="text-white/25 text-[10px] leading-relaxed">{d.description}</p>
                        )}
                      </div>
                      {d.sourceEvidence && (
                        <SourceChip id={chipId} evidence={d.sourceEvidence} label="source"
                          active={activeChipId === chipId}
                          onClick={() => onChipClick(chipId, d.sourceEvidence!)} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── F. Key Risks / Watchouts ── */}
        {risks.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
            <SLabel icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400/55" />}>Key Risks / Watchouts</SLabel>
            <div className="flex flex-col gap-1.5">
              {risks.map((r) => {
                const chipId = makeChipId("risk", r.id)
                const st = RISK_SEVERITY_STYLES[r.severity] ?? RISK_SEVERITY_STYLES.low
                return (
                  <div key={r.id} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${st.border}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-xs font-medium mb-0.5">{r.title}</p>
                      {r.description && (
                        <p className="text-white/30 text-[10px] leading-relaxed">{r.description}</p>
                      )}
                    </div>
                    {r.sourceEvidence && (
                      <SourceChip id={chipId} evidence={r.sourceEvidence} label="source"
                        active={activeChipId === chipId}
                        onClick={() => onChipClick(chipId, r.sourceEvidence!)} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── G. Source Traceability ── */}
        {(risks.some(r => r.sourceEvidence) || actionSteps.some(s => s.sourceEvidence) || deadlines.some(d => d.sourceEvidence)) && (
          <div className="rounded-xl border border-violet-500/10 bg-violet-600/[0.03] p-4">
            <SLabel icon={<FileWarning className="w-3.5 h-3.5 text-violet-400/55" />}>Source Traceability</SLabel>
            <p className="text-white/28 text-[11px] leading-relaxed mb-3">
              Every finding links to the exact document section it came from. Click a source chip to jump the document viewer.
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                ...actionSteps.filter(s => s.sourceEvidence).map(s => ({ label: s.title, evidence: s.sourceEvidence!, id: `trace-step-${s.id}` })),
                ...deadlines.filter(d => d.sourceEvidence).map(d => ({ label: d.title, evidence: d.sourceEvidence!, id: `trace-dl-${d.id}` })),
                ...risks.filter(r => r.sourceEvidence).map(r => ({ label: r.title, evidence: r.sourceEvidence!, id: `trace-risk-${r.id}` })),
              ].slice(0, 10).map((item) => (
                <div key={item.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer hover:bg-violet-500/[0.04] transition-all ${
                    activeChipId === item.id ? "border-violet-500/28 bg-violet-500/[0.06]" : "border-white/[0.05] bg-white/[0.01]"
                  }`}
                  onClick={() => onChipClick(item.id, item.evidence)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeChipId === item.id ? "bg-violet-400" : "bg-white/18"}`} />
                  <p className={`text-[11px] flex-1 truncate ${activeChipId === item.id ? "text-white/75" : "text-white/38"}`}>{item.label}</p>
                  <SourceChip id={item.id} evidence={item.evidence} label="jump" active={activeChipId === item.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Terms (secondary — after traceability) */}
        {keyTerms.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4">
            <SLabel>Key Terms</SLabel>
            <div className="flex flex-col gap-2">
              {keyTerms.slice(0, isPro ? keyTerms.length : 3).map((term) => (
                <div key={term.id} className={`rounded-lg px-3 py-2.5 border ${
                  term.severity === "high" ? "border-red-500/15 bg-red-500/[0.03]" :
                  term.severity === "medium" ? "border-amber-500/12 bg-amber-500/[0.02]" :
                  "border-white/[0.05]"
                }`}>
                  <div className="flex items-start gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full mt-[4px] shrink-0 ${
                      term.severity === "high" ? "bg-red-400" : term.severity === "medium" ? "bg-amber-400" : "bg-white/22"
                    }`} />
                    <p className="text-white/65 text-xs font-medium flex-1">{term.term}</p>
                    {term.isNegotiable && (
                      <span className="h-4 px-1.5 rounded bg-sky-500/8 border border-sky-500/18 text-sky-300/70 text-[9px] shrink-0">Negotiable</span>
                    )}
                  </div>
                  <p className="text-white/32 text-[10px] leading-relaxed pl-3.5">{term.explanation}</p>
                  {term.watchOut && (
                    <p className="text-amber-300/45 text-[10px] leading-relaxed pl-3.5 mt-1">⚠ {term.watchOut}</p>
                  )}
                </div>
              ))}
              {!isPro && keyTerms.length > 3 && (
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.01] px-3 py-2.5 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <p className="text-white/28 text-[10px]">{keyTerms.length - 3} more terms — upgrade to Pro to unlock</p>
                  <a href="/upgrade" className="text-violet-400/70 text-[10px] font-medium hover:text-violet-300 ml-auto shrink-0">Upgrade</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Follow-up tools */}
        <div>
          <SLabel>Recommended Follow-up Tools</SLabel>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document", desc: "Ask anything, get cited answers", href: "/ask-document", color: "text-violet-400 border-violet-500/20 bg-violet-600/[0.08]" },
              { icon: <Shield className="w-3.5 h-3.5" />, label: "Trust Check", desc: "Verify authenticity", href: "/trust-check", color: "text-amber-400 border-amber-500/20 bg-amber-600/[0.08]" },
              { icon: <ListChecks className="w-3.5 h-3.5" />, label: "Clause Extractor", desc: "Pull key clauses by type", href: "/clause-extractor", color: "text-sky-400 border-sky-500/20 bg-sky-600/[0.08]" },
              { icon: <GitCompare className="w-3.5 h-3.5" />, label: "Compare Versions", desc: "Diff two document versions", href: "/compare", color: "text-emerald-400 border-emerald-500/20 bg-emerald-600/[0.08]" },
            ].map((tool, i) => (
              <a key={i} href={tool.href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] hover:bg-white/[0.035] hover:border-white/[0.12] transition-all group">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${tool.color}`}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/65 text-[11px] font-medium leading-none mb-0.5">{tool.label}</p>
                  <p className="text-white/22 text-[10px] leading-none truncate">{tool.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/12 group-hover:text-white/30 shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Low confidence panel ─────────────────────────────────────────────────────

function LowConfPanel({ analysis, onChipClick, activeChipId, sections }: {
  analysis: DocumentAnalysis
  onChipClick: (chipId: string, evidence: string) => void
  activeChipId: string | null
  sections: DocumentSection[]
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
      <div className="p-5 flex flex-col gap-5">

        {/* Doc identity — amber tint for low conf */}
        <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
          <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/22 flex items-center justify-center shrink-0 mt-0.5">
            <FileWarning className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-white/88 text-sm font-semibold">{analysis.title}</h1>
              <span className="h-4 px-1.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300/80 text-[9px] font-medium">Scanned PDF</span>
              {analysis.documentType && (
                <span className="h-4 px-1.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/35 text-[9px]">{analysis.documentType}</span>
              )}
            </div>
            <p className="text-white/28 text-[10px]">Low scan quality · partial text extracted</p>
          </div>
        </div>

        {/* Warning header */}
        <div className="rounded-xl border border-amber-500/28 bg-amber-600/[0.07] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-300 text-sm font-semibold mb-1.5">Partial analysis — low scan quality</p>
              <p className="text-white/45 text-xs leading-relaxed mb-2">
                PlainPath could only read part of this document. Items marked with <span className="font-mono text-amber-300/70">~</span> are uncertain estimates — verify manually before acting.
              </p>
              <div className="flex items-center gap-1.5">
                <Info className="w-3 h-3 text-amber-400/50 shrink-0" />
                <p className="text-amber-300/50 text-[10px]">Upload a text-based PDF to get a full, high-confidence analysis.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.07) 0%, rgba(12,12,15,0) 55%)" }}>
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
            <p className="text-white/85 text-sm font-semibold">What would you like to do?</p>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {[
              { icon: <Upload className="w-4 h-4" />, label: "Upload a clearer PDF", desc: "A text-based PDF gives significantly better results.", primary: true, href: "/analyze", color: "text-violet-400 bg-violet-600/10 border-violet-500/20" },
              { icon: <FileText className="w-4 h-4" />, label: "Upload text-based version", desc: "Export from the original app instead of scanning.", primary: false, href: "/analyze", color: "text-violet-400 bg-violet-600/10 border-violet-500/20" },
              { icon: <RotateCcw className="w-4 h-4" />, label: "Continue with partial analysis", desc: "See what PlainPath could extract from this document.", primary: false, href: "#partial", color: "text-white/40 bg-white/[0.04] border-white/[0.08]" },
              { icon: <MessageSquare className="w-4 h-4" />, label: "Ask This Document", desc: "Targeted questions sometimes work on poor scans.", primary: false, href: "/ask-document", color: "text-blue-400 bg-blue-600/10 border-blue-500/20" },
            ].map((a, i) => (
              <a key={i} href={a.href} className={`flex items-start gap-3 rounded-lg px-3.5 py-3 border transition-all hover:bg-white/[0.03] ${a.primary ? "border-white/[0.10] bg-white/[0.025]" : "border-white/[0.06]"}`}>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${a.color}`}>{a.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-[13px] font-medium ${a.primary ? "text-white/88" : "text-white/50"}`}>{a.label}</p>
                    {a.primary && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                  </div>
                  <p className="text-white/28 text-[10px] leading-relaxed">{a.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/15 shrink-0 mt-2" />
              </a>
            ))}
          </div>
        </div>

        {/* Partial summary */}
        {analysis.summary && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <SLabel>Partial Plain-English Summary</SLabel>
            <p className="text-white/50 text-sm leading-relaxed">{analysis.summary}</p>
            <p className="text-amber-300/40 text-[10px] mt-2">~ Based on partial text extraction — may not reflect the full document</p>
          </div>
        )}

        {/* Partial action steps */}
        {analysis.actionSteps.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-white/[0.08]">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-600/12 border border-amber-500/22 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-white/75 text-sm font-semibold flex-1">Partial Required Actions</p>
                <span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/60 text-[9px]">verify manually</span>
              </div>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {analysis.actionSteps.map((step, idx) => {
                const chipId = `lowconf-step-${step.id}`
                return (
                  <div key={step.id} className="flex items-start gap-3 rounded-lg px-3.5 py-3 border border-white/[0.06]">
                    <div className="w-5 h-5 rounded border border-white/[0.08] flex items-center justify-center text-[9px] font-bold text-white/25 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/55 text-[11px] font-medium mb-0.5">
                        <span className="text-amber-300/60 font-mono mr-1">~</span>{step.title}
                      </p>
                      {step.description && (
                        <p className="text-white/28 text-[10px] leading-relaxed">{step.description}</p>
                      )}
                    </div>
                    {step.sourceEvidence && (
                      <SourceChip id={chipId} evidence={step.sourceEvidence} label="source" uncertain
                        active={activeChipId === chipId}
                        onClick={() => onChipClick(chipId, step.sourceEvidence!)} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Partial risks */}
        {analysis.risks.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <SLabel right={<span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/60 text-[9px]">verify manually</span>}>Partial Risks</SLabel>
            <div className="flex flex-col gap-2">
              {analysis.risks.map((r) => {
                const chipId = `lowconf-risk-${r.id}`
                return (
                  <div key={r.id} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${RISK_SEVERITY_STYLES[r.severity]?.border ?? ""}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${RISK_SEVERITY_STYLES[r.severity]?.dot ?? "bg-white/22"}`} />
                    <p className="text-white/48 text-xs leading-relaxed flex-1">{r.title}</p>
                    {r.sourceEvidence && (
                      <SourceChip id={chipId} evidence={r.sourceEvidence} label="source" uncertain active={activeChipId === chipId} onClick={() => onChipClick(chipId, r.sourceEvidence!)} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recommended next steps */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
          <SLabel>Recommended Next Steps</SLabel>
          <div className="flex flex-col gap-1.5">
            {[
              "Upload a text-based PDF for a full, high-confidence analysis",
              "Use Ask This Document to get targeted answers on specific sections",
              "Consider professional review if this is a high-value or legal document",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5">
                <div className="w-1 h-1 rounded-full bg-white/20 mt-[6px] shrink-0" />
                <p className="text-white/38 text-[11px] leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile tab layout ───────────────────────────────────────────────────────

function MobileView({
  analysis, sections, onChipClick, activeChipId, activeEvidence, highlightSectionId, sectionRefs, onDismissChip
}: {
  analysis: DocumentAnalysis
  sections: DocumentSection[]
  onChipClick: (chipId: string, evidence: string) => void
  activeChipId: string | null
  activeEvidence: string | null
  highlightSectionId: string | null
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  onDismissChip: () => void
}) {
  const [tab, setTab] = useState<"analysis" | "document">("analysis")
  const isLowConf = analysis.overallConfidence === "low"

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* File strip */}
      <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
        <FileText className={`w-3 h-3 shrink-0 ${isLowConf ? "text-amber-400/55" : "text-violet-400/55"}`} />
        <span className="text-white/38 text-xs flex-1 truncate">{analysis.title}</span>
        {sections.length > 0 && <span className="text-white/18 text-[10px] shrink-0">{sections.length} pp.</span>}
      </div>

      {/* Tab bar */}
      <div className="h-10 border-b border-white/[0.06] flex shrink-0">
        {(["analysis", "document"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 text-sm font-medium relative transition-colors capitalize ${t === tab ? "text-white/90" : "text-white/28"}`}>
            {t}
            {t === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-violet-500" />}
          </button>
        ))}
      </div>

      {/* Jump banner */}
      {activeChipId && tab === "document" && (
        <div className="mx-3 mt-2 shrink-0 rounded-lg border border-violet-500/25 bg-violet-500/[0.07] px-3 py-1.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
          <p className="text-violet-200/75 text-[10px] flex-1 truncate">
            {activeEvidence ? activeEvidence.slice(0, 38) + (activeEvidence.length > 38 ? "…" : "") : "Source highlighted below"}
          </p>
          <button onClick={() => setTab("analysis")} className="flex items-center gap-1 text-violet-400/60 text-[9px] hover:text-violet-300 transition-colors shrink-0">
            <ArrowLeft className="w-2.5 h-2.5" />
            Analysis
          </button>
          <button onClick={onDismissChip} className="text-white/20 hover:text-white/40 shrink-0 ml-1 transition-colors"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "analysis" ? (
          <div className="h-full overflow-y-auto">
            {isLowConf
              ? <LowConfPanel analysis={analysis} onChipClick={(id, ev) => { onChipClick(id, ev); setTab("document") }} activeChipId={activeChipId} sections={sections} />
              : <IntelPanel analysis={analysis} onChipClick={(id, ev) => { onChipClick(id, ev); setTab("document") }} activeChipId={activeChipId} sections={sections} />}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <DocViewer analysis={analysis} activeChipId={activeChipId} activeEvidence={activeEvidence} highlightSectionId={highlightSectionId} onDismiss={onDismissChip} sectionRefs={sectionRefs} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar({ analysis, onSave, justSaved, savedId }: {
  analysis: DocumentAnalysis
  onSave: () => void
  justSaved: boolean
  savedId: string | null
}) {
  const confidence = analysis.overallConfidence
  const confBadge = confidence === "high"
    ? "bg-emerald-600/12 border-emerald-500/25 text-emerald-300"
    : confidence === "medium"
    ? "bg-amber-600/12 border-amber-500/25 text-amber-300"
    : "bg-red-600/12 border-red-500/25 text-red-300"
  const confLabel = confidence === "high" ? "91%" : confidence === "medium" ? "72%" : "Low confidence"
  const confIcon = confidence === "high" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />

  return (
    <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0 bg-[#0c0c0f]">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/88 text-sm font-semibold tracking-tight">PlainPath</span>
      </div>
      <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />
      <span className="text-white/30 text-xs hidden sm:block">Analyze a Document</span>
      <ChevronRight className="w-3 h-3 text-white/18 hidden sm:block" />
      <span className="text-white/30 text-xs truncate max-w-[200px] hidden sm:block">{analysis.title}</span>
      <div className="ml-auto flex items-center gap-2">
        <div className={`h-6 px-2.5 rounded-full border flex items-center gap-1.5 ${confBadge}`}>
          {confIcon}
          <span className="text-[10px] font-medium">{confLabel} confidence</span>
        </div>
        <button
          onClick={onSave}
          className={`h-7 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-all ${
            justSaved
              ? "border-emerald-700 bg-emerald-900/30 text-emerald-300"
              : "border-white/[0.08] bg-white/[0.03] text-white/30 hover:bg-white/[0.07] hover:text-white/55"
          }`}
        >
          {justSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
          <span className="hidden sm:inline">{justSaved ? "Saved" : savedId ? "Update" : "Save"}</span>
        </button>
        <a href="/analyze" className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs hover:bg-white/[0.06] hover:text-white/50 transition-colors flex items-center gap-1.5">
          <Zap className="w-3 h-3" />
          <span className="hidden sm:inline">Re-analyze</span>
        </a>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnalyzeDocument() {
  const [, setLocation] = useLocation()
  const { analysis, documentTypeHint } = useAnalysisContext()
  const { isSignedIn } = useUser()

  const [activeChipId, setActiveChipId] = useState<string | null>(null)
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null)
  const [highlightSectionId, setHighlightSectionId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const viewerScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!analysis) setLocation("/analyze")
  }, [analysis, setLocation])

  useEffect(() => {
    if (analysis?.title) {
      document.title = `${analysis.title} — PlainPath`
      return () => { document.title = "PlainPath" }
    }
  }, [analysis?.title])

  const handleChipClick = useCallback((chipId: string, evidence: string) => {
    const sections = analysis?.sections ?? []
    setActiveChipId(chipId)
    setActiveEvidence(evidence || null)

    const matchId = findBestSection(evidence, sections)
    if (matchId) {
      setHighlightSectionId(matchId)
      const ref = sectionRefs.current[matchId]
      if (ref) {
        setTimeout(() => {
          ref.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 80)
      }
    }
  }, [analysis])

  const handleDismissChip = useCallback(() => {
    setActiveChipId(null)
    setActiveEvidence(null)
    setHighlightSectionId(null)
  }, [])

  const handleSave = async () => {
    if (!analysis) return
    const triggerFeedback = () => {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2200)
    }
    try {
      if (isSignedIn) {
        const saved = await saveCloudAnalysis({
          title: analysis.title,
          sourceKind: "document",
          documentTypeHint,
          analysis,
        })
        setSavedId(saved.id)
      } else {
        const saved = saveAnalysis({
          title: analysis.title,
          sourceKind: "document",
          documentTypeHint,
          analysis,
        })
        setSavedId(saved.id)
      }
      triggerFeedback()
    } catch {
      triggerFeedback()
    }
  }

  if (!analysis) return null

  const sections = analysis.sections ?? []
  const isLowConf = analysis.overallConfidence === "low"
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TopBar analysis={analysis} onSave={handleSave} justSaved={justSaved} savedId={savedId} />

      {/* Desktop: split-screen */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        <DocViewer
          analysis={analysis}
          activeChipId={activeChipId}
          activeEvidence={activeEvidence}
          highlightSectionId={highlightSectionId}
          onDismiss={handleDismissChip}
          sectionRefs={sectionRefs}
        />
        {isLowConf ? (
          <LowConfPanel analysis={analysis} onChipClick={handleChipClick} activeChipId={activeChipId} sections={sections} />
        ) : (
          <IntelPanel analysis={analysis} onChipClick={handleChipClick} activeChipId={activeChipId} sections={sections} />
        )}
      </div>

      {/* Mobile: tab layout */}
      <div className="flex-1 flex flex-col md:hidden overflow-hidden">
        <MobileView
          analysis={analysis}
          sections={sections}
          onChipClick={handleChipClick}
          activeChipId={activeChipId}
          activeEvidence={activeEvidence}
          highlightSectionId={highlightSectionId}
          sectionRefs={sectionRefs}
          onDismissChip={handleDismissChip}
        />
      </div>
    </div>
  )
}
