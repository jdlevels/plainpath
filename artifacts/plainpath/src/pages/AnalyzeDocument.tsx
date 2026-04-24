import React, { useEffect, useRef, useState, useCallback } from "react"
import { useLocation } from "wouter"
import {
  FileText, AlertTriangle, Calendar, ChevronRight, MessageSquare,
  CheckCircle2, ArrowRight, X, Upload, Shield, Bookmark,
  BookmarkCheck, Loader2, RotateCcw, AlertCircle, ZapIcon,
  EyeOff, Zap, ArrowLeft, BookOpen
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

function DocViewer({
  analysis, activeChipId, highlightSectionId, onDismiss, sectionRefs
}: {
  analysis: DocumentAnalysis
  activeChipId: string | null
  highlightSectionId: string | null
  onDismiss: () => void
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}) {
  const sections: DocumentSection[] = analysis.sections ?? []

  return (
    <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
      {/* Viewer toolbar */}
      <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
        <FileText className="w-3.5 h-3.5 text-violet-400/50 shrink-0" />
        <span className="text-white/42 text-xs flex-1 truncate">{analysis.title}</span>
        <span className="text-white/18 text-xs shrink-0">{sections.length} sections</span>
      </div>

      {/* Active citation banner */}
      {activeChipId && (
        <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-violet-200/80 text-[10px] font-medium truncate">Viewing source — relevant text highlighted below</p>
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
          sections.map((section) => {
            const isHighlighted = highlightSectionId === section.id
            return (
              <div
                key={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el }}
                className={`w-full rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${
                  isHighlighted
                    ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/18 shadow-[0_0_20px_rgba(139,92,246,0.07)]"
                    : "border-white/[0.05] bg-white/[0.015]"
                }`}
              >
                {section.title && (
                  <p className={`text-xs font-semibold leading-tight ${isHighlighted ? "text-violet-300/80" : "text-white/45"}`}>
                    {section.title}
                  </p>
                )}
                <p className={`text-[11px] leading-relaxed ${isHighlighted ? "text-white/65" : "text-white/35"}`}>
                  {section.content}
                </p>
                {isHighlighted && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-violet-300/55 text-[9px]">Source referenced by this finding</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Intelligence panel ───────────────────────────────────────────────────────

const RISK_SEVERITY_STYLES = {
  high:   { border: "border-red-500/22 bg-red-500/[0.04]",   dot: "bg-red-400",    text: "text-red-300"   },
  medium: { border: "border-amber-500/15 bg-amber-500/[0.03]",dot: "bg-amber-400",  text: "text-amber-300" },
  low:    { border: "border-white/[0.05] bg-transparent",     dot: "bg-white/22",   text: "text-white/35"  },
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

  const confidence = analysis.overallConfidence
  const riskScore = analysis.overallRisk ?? null
  const risks = analysis.risks ?? []
  const actionSteps = analysis.actionSteps ?? []
  const deadlines = analysis.deadlines ?? []
  const keyTerms = analysis.keyTerms ?? []
  const redFlags = analysis.redFlags ?? []

  const criticalRisks = risks.filter(r => r.severity === "high")
  const urgentSteps = actionSteps.filter(s => s.priority === "high" && !s.completed)
  const hardDeadlines = deadlines.filter(d => d.isHard)

  const confBadge = confidence === "high"
    ? "bg-emerald-600/12 border-emerald-500/25 text-emerald-300"
    : confidence === "medium"
    ? "bg-amber-600/12 border-amber-500/25 text-amber-300"
    : "bg-red-600/12 border-red-500/25 text-red-300"

  const confIcon = confidence === "high" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />
  const confLabel = confidence === "high" ? "High confidence" : confidence === "medium" ? "Medium confidence" : "Low confidence"

  function makeChipId(prefix: string, id: string) { return `${prefix}-${id}` }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
      <div className="p-5 flex flex-col gap-5">

        {/* Doc identity */}
        <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-white/90 text-sm font-semibold">{analysis.title}</h1>
              {analysis.documentType && (
                <span className="h-4 px-1.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/35 text-[9px]">
                  {analysis.documentType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Red flags banner */}
        {redFlags.length > 0 && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 text-xs font-semibold mb-1">Critical issues found</p>
              <ul className="flex flex-col gap-1">
                {redFlags.map((f, i) => (
                  <li key={i} className="text-white/52 text-[11px] leading-relaxed">{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── 1. Plain-English Summary ── */}
        <div className="rounded-xl border border-violet-500/14 bg-violet-600/[0.04] p-4">
          <SLabel icon={<BookOpen className="w-3.5 h-3.5" />}>Plain-English Summary</SLabel>
          <p className="text-white/68 text-sm leading-[1.75]">{analysis.summary}</p>
          {analysis.plainEnglish?.whatItAsks && analysis.plainEnglish.whatItAsks !== analysis.summary && (
            <p className="text-white/40 text-xs leading-relaxed mt-2">{analysis.plainEnglish.whatItAsks}</p>
          )}
        </div>

        {/* ── 2. Confidence & Risk Status ── */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <SLabel icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />}
            right={<span className="text-[9px] text-white/20">{risks.length} risk{risks.length !== 1 ? "s" : ""} found</span>}>
            Risk & Confidence
          </SLabel>
          <div className="flex items-center gap-2.5 flex-wrap mb-3">
            <div className={`h-7 px-3 rounded-lg border flex items-center gap-1.5 ${confBadge}`}>
              {confIcon}
              <span className="text-xs font-medium">{confLabel}</span>
            </div>
            {riskScore !== null && (
              <div className={`h-7 px-3 rounded-lg border flex items-center gap-1.5 ${
                riskScore >= 70 ? "border-red-500/25 bg-red-500/[0.07] text-red-300" :
                riskScore >= 40 ? "border-amber-500/20 bg-amber-500/[0.05] text-amber-300" :
                "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300"
              }`}>
                <span className="text-xs font-medium">Risk score: {riskScore}/100</span>
              </div>
            )}
            {criticalRisks.length > 0 && (
              <div className="h-7 px-3 rounded-lg border border-red-500/25 bg-red-500/[0.07] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-red-300 text-xs font-medium">{criticalRisks.length} critical</span>
              </div>
            )}
          </div>
          {risks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {risks.slice(0, 3).map((r) => {
                const chipId = makeChipId("risk", r.id)
                const st = RISK_SEVERITY_STYLES[r.severity] ?? RISK_SEVERITY_STYLES.low
                return (
                  <div key={r.id} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${st.border}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${st.dot}`} />
                    <p className="text-white/58 text-xs leading-relaxed flex-1">{r.title}</p>
                    {r.sourceEvidence && (
                      <SourceChip
                        id={chipId} evidence={r.sourceEvidence} label="source"
                        active={activeChipId === chipId}
                        onClick={() => onChipClick(chipId, r.sourceEvidence!)}
                      />
                    )}
                  </div>
                )
              })}
              {risks.length > 3 && (
                <p className="text-white/20 text-[10px] pl-3">+{risks.length - 3} more risks below</p>
              )}
            </div>
          )}
        </div>

        {/* ── 3. Required Next Steps ── */}
        {actionSteps.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{
            background: "linear-gradient(140deg, rgba(109,40,217,0.08) 0%, rgba(12,12,15,0) 55%)"
          }}>
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-600/18 border border-violet-500/28 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-white/85 text-sm font-semibold flex-1">Required Next Steps</p>
                {urgentSteps.length > 0 && (
                  <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/20 flex items-center">
                    <span className="text-red-300/90 text-[9px] font-medium">{urgentSteps.length} urgent</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {actionSteps.slice(0, 5).map((step) => {
                const chipId = makeChipId("step", step.id)
                const isUrgent = step.priority === "high"
                return (
                  <div key={step.id} className={`flex items-start gap-3 rounded-lg px-3.5 py-3 border cursor-default transition-all ${
                    isUrgent ? "border-white/[0.10] bg-white/[0.025]" : "border-white/[0.06]"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${
                      isUrgent ? "bg-red-400" : step.priority === "medium" ? "bg-amber-400/60" : "bg-white/20"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium mb-0.5 ${isUrgent ? "text-white/85" : "text-white/48"}`}>
                        {step.title}
                      </p>
                      {step.description && (
                        <p className="text-white/25 text-[10px] leading-relaxed">{step.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {step.sourceEvidence && (
                        <SourceChip
                          id={chipId} evidence={step.sourceEvidence} label="source"
                          active={activeChipId === chipId}
                          onClick={() => onChipClick(chipId, step.sourceEvidence!)}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
              {actionSteps.length > 5 && (
                <p className="text-white/18 text-[10px] pl-3">+{actionSteps.length - 5} more steps</p>
              )}
            </div>
          </div>
        )}

        {/* ── 4. Risks & Watchouts (full list) ── */}
        {risks.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <SLabel icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />}>Risks & Watchouts</SLabel>
            <div className="flex flex-col gap-2">
              {risks.map((r) => {
                const chipId = makeChipId("risk-full", r.id)
                const st = RISK_SEVERITY_STYLES[r.severity] ?? RISK_SEVERITY_STYLES.low
                return (
                  <div key={r.id} className={`flex items-start gap-2.5 rounded-lg px-3 py-3 border ${st.border}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/68 text-xs font-medium mb-0.5">{r.title}</p>
                      {r.description && (
                        <p className="text-white/35 text-[10px] leading-relaxed">{r.description}</p>
                      )}
                    </div>
                    {r.sourceEvidence && (
                      <SourceChip
                        id={chipId} evidence={r.sourceEvidence} label="source"
                        active={activeChipId === chipId}
                        onClick={() => onChipClick(chipId, r.sourceEvidence!)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 5. Key Dates ── */}
        {deadlines.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <SLabel icon={<Calendar className="w-3.5 h-3.5 text-sky-400/60" />}
              right={hardDeadlines.length > 0 ? (
                <span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/60 text-[9px]">
                  {hardDeadlines.length} hard deadline{hardDeadlines.length !== 1 ? "s" : ""}
                </span>
              ) : null}>
              Key Dates
            </SLabel>
            <div className="flex flex-col gap-2.5">
              {deadlines.map((d) => {
                const chipId = makeChipId("dl", d.id)
                return (
                  <div key={d.id} className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 ${
                    d.isHard ? "border border-amber-500/14 bg-amber-500/[0.03]" : ""
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/28 text-[10px] mb-0.5">{d.title}</p>
                      <p className={`text-xs font-medium ${d.isHard ? "text-amber-300" : "text-white/65"}`}>
                        {d.date}
                        {d.isHard && <span className="ml-1.5 text-amber-400/60 font-normal text-[9px]">⚠ Hard deadline</span>}
                      </p>
                      {d.description && (
                        <p className="text-white/22 text-[10px] leading-relaxed mt-0.5">{d.description}</p>
                      )}
                    </div>
                    {d.sourceEvidence && (
                      <SourceChip
                        id={chipId} evidence={d.sourceEvidence} label="source"
                        active={activeChipId === chipId}
                        onClick={() => onChipClick(chipId, d.sourceEvidence!)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 6. Key Terms ── */}
        {keyTerms.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <SLabel>Key Terms</SLabel>
            <div className="flex flex-col gap-2.5">
              {keyTerms.slice(0, isPro ? keyTerms.length : 3).map((term) => (
                <div key={term.id} className={`rounded-lg px-3 py-3 border ${
                  term.severity === "high" ? "border-red-500/15 bg-red-500/[0.03]" :
                  term.severity === "medium" ? "border-amber-500/12 bg-amber-500/[0.02]" :
                  "border-white/[0.05]"
                }`}>
                  <div className="flex items-start gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full mt-[4px] shrink-0 ${
                      term.severity === "high" ? "bg-red-400" : term.severity === "medium" ? "bg-amber-400" : "bg-white/22"
                    }`} />
                    <p className="text-white/72 text-xs font-medium">{term.term}</p>
                    {term.isNegotiable && (
                      <span className="h-4 px-1.5 rounded bg-sky-500/8 border border-sky-500/18 text-sky-300/70 text-[9px] shrink-0">
                        Negotiable
                      </span>
                    )}
                  </div>
                  <p className="text-white/35 text-[10px] leading-relaxed pl-3.5">{term.explanation}</p>
                  {term.watchOut && (
                    <p className="text-amber-300/50 text-[10px] leading-relaxed pl-3.5 mt-1">⚠ {term.watchOut}</p>
                  )}
                </div>
              ))}
              {!isPro && keyTerms.length > 3 && (
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.01] px-3 py-2.5 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <p className="text-white/30 text-[10px]">{keyTerms.length - 3} more terms — upgrade to Pro to unlock</p>
                  <a href="/upgrade" className="text-violet-400/70 text-[10px] font-medium hover:text-violet-300 ml-auto shrink-0">Upgrade</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 7. Source Traceability ── */}
        {(risks.some(r => r.sourceEvidence) || actionSteps.some(s => s.sourceEvidence) || deadlines.some(d => d.sourceEvidence)) && (
          <div className="rounded-xl border border-violet-500/10 bg-violet-600/[0.03] p-4">
            <SLabel icon={<FileText className="w-3.5 h-3.5 text-violet-400/50" />}>Source Traceability</SLabel>
            <p className="text-white/28 text-[11px] leading-relaxed mb-3">
              Every finding links to the exact document section it came from. Click a chip to jump the document viewer.
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                ...risks.filter(r => r.sourceEvidence).map(r => ({ label: r.title, evidence: r.sourceEvidence!, id: `trace-risk-${r.id}` })),
                ...actionSteps.filter(s => s.sourceEvidence).slice(0, 3).map(s => ({ label: s.title, evidence: s.sourceEvidence!, id: `trace-step-${s.id}` })),
                ...deadlines.filter(d => d.sourceEvidence).map(d => ({ label: d.title, evidence: d.sourceEvidence!, id: `trace-dl-${d.id}` })),
              ].slice(0, 8).map((item) => (
                <div key={item.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer hover:bg-violet-500/[0.04] transition-all ${
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

        {/* ── Follow-up tools ── */}
        <div>
          <SLabel>Recommended Follow-up Tools</SLabel>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document", desc: "Ask anything, get cited answers", href: "/ask-document", color: "text-violet-400 border-violet-500/20 bg-violet-600/8" },
              { icon: <Shield className="w-3.5 h-3.5" />, label: "Trust Check", desc: "Verify authenticity", href: "/trust-check", color: "text-amber-400 border-amber-500/20 bg-amber-600/8" },
              { icon: <EyeOff className="w-3.5 h-3.5" />, label: "Redact Document", desc: "Remove sensitive information", href: "/redact", color: "text-red-400 border-red-500/20 bg-red-600/8" },
              { icon: <ZapIcon className="w-3.5 h-3.5" />, label: "Contract Review", desc: "Deep clause-by-clause review", href: "/contract-review", color: "text-sky-400 border-sky-500/20 bg-sky-600/8" },
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
        {/* Warning header */}
        <div className="rounded-xl border border-amber-500/28 bg-amber-600/[0.07] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-300 text-sm font-semibold mb-1.5">Partial analysis — low scan quality</p>
              <p className="text-white/45 text-xs leading-relaxed">
                PlainPath could read part of this document, but the scan quality limits confidence. Items below may be estimates — verify manually before acting.
              </p>
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

        {/* Partial analysis data */}
        {analysis.summary && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <SLabel>Partial Explanation</SLabel>
            <p className="text-white/50 text-sm leading-relaxed">{analysis.summary}</p>
          </div>
        )}
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
      </div>
    </div>
  )
}

// ─── Mobile tab layout ───────────────────────────────────────────────────────

function MobileView({
  analysis, sections, onChipClick, activeChipId, highlightSectionId, sectionRefs, onDismissChip
}: {
  analysis: DocumentAnalysis
  sections: DocumentSection[]
  onChipClick: (chipId: string, evidence: string) => void
  activeChipId: string | null
  highlightSectionId: string | null
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  onDismissChip: () => void
}) {
  const [tab, setTab] = useState<"analysis" | "document">("analysis")
  const isLowConf = analysis.overallConfidence === "low"

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="h-11 border-b border-white/[0.06] flex shrink-0">
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
          <p className="text-violet-200/75 text-[10px] flex-1">Source highlighted below</p>
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
            <DocViewer analysis={analysis} activeChipId={activeChipId} highlightSectionId={highlightSectionId} onDismiss={onDismissChip} sectionRefs={sectionRefs} />
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
        <a href="/analyze" className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/28 text-xs hover:bg-white/[0.06] transition-colors flex items-center gap-1.5">
          <Upload className="w-3 h-3" />
          <span className="hidden sm:inline">New</span>
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
          highlightSectionId={highlightSectionId}
          sectionRefs={sectionRefs}
          onDismissChip={handleDismissChip}
        />
      </div>
    </div>
  )
}
