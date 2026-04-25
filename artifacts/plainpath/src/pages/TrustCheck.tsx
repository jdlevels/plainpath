import React, { useEffect, useRef, useState } from "react"
import { useLocation, useSearch } from "wouter"
import {
  AlertTriangle, Bookmark, BookmarkCheck, FileText, Shield, ShieldCheck,
  ArrowLeft, X, CheckCircle2, Info, RotateCcw, Upload,
  Image, ClipboardPaste, Link2, RefreshCcw, MessageSquare,
  Layers, CheckSquare, CheckCheck, AlertCircle, ChevronRight,
  Database, GitMerge, Search,
} from "lucide-react"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { useUser } from "@clerk/react"
import { saveTrustCheck } from "@/lib/savedTrustChecks"
import { saveCloudTrustCheck } from "@/lib/cloudHistory"
import { getApiBaseUrl } from "@/lib/api"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeModal from "@/components/UpgradeModal"
import {
  type TrustCheckAnalysis,
  type TrustCheckSection,
  type TrustCheckScamIndicator,
  trustScoreLabel,
  trustScoreColor,
} from "@/lib/trustCheckTypes"

// ─── Fuzzy section match ─────────────────────────────────────────────────────

function findBestSection(evidence: string, sections: TrustCheckSection[]): string | null {
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
  return bestScore >= 2 ? bestId : null
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function SLabel({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-white/50 shrink-0">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/50 flex-1">{children}</p>
      {right}
    </div>
  )
}

function SourceChip({
  id, label, active, onClick, uncertain,
}: {
  id: string; label: string; active?: boolean; onClick?: () => void; uncertain?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium cursor-pointer transition-all whitespace-nowrap ${
        active
          ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_8px_rgba(139,92,246,0.22)]"
          : uncertain
          ? "bg-amber-500/12 border border-amber-400/22 text-amber-300/75 hover:bg-amber-500/20"
          : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20 hover:text-violet-200"
      }`}
    >
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
      {label}
    </button>
  )
}

// ─── Document Viewer ─────────────────────────────────────────────────────────

const TRUST_TEXT_SIZES = [
  { label: "A",   body: "text-[11px]", title: "text-xs"     },
  { label: "A+",  body: "text-xs",     title: "text-[13px]" },
  { label: "A++", body: "text-sm",     title: "text-[14px]" },
] as const

function DocViewer({
  analysis, sections, activeChipId, activeEvidence, highlightSectionId,
  onDismiss, sectionRefs,
}: {
  analysis: TrustCheckAnalysis
  sections: TrustCheckSection[]
  activeChipId: string | null
  activeEvidence: string | null
  highlightSectionId: string | null
  onDismiss: () => void
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}) {
  const isLowConf = analysis.scanQuality === "poor"
  const displayName = analysis.title ?? `Trust Check — ${analysis.verdict}`
  const pageCount = sections.length

  const trustScore = 100 - analysis.riskScore
  const tsl = trustScoreLabel(trustScore)

  const [sizeIdx, setSizeIdx] = useState<0 | 1 | 2>(0)
  const textSize = TRUST_TEXT_SIZES[sizeIdx]

  return (
    <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
      {/* Tool identity row */}
      <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 shrink-0 bg-white/[0.01]">
        <Shield className="w-3 h-3 text-blue-400/45 shrink-0" />
        <span className="text-[10px] text-white/50 font-medium flex-1">Document Trust Check</span>
        {isLowConf ? (
          <span className="h-4 px-1.5 rounded border border-amber-500/28 bg-amber-500/10 text-amber-300/75 text-[9px] font-medium">Low confidence</span>
        ) : (
          <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${
            trustScore >= 70 ? "border-emerald-500/28 bg-emerald-500/10 text-emerald-300/75"
            : trustScore >= 45 ? "border-amber-500/28 bg-amber-500/10 text-amber-300/75"
            : "border-red-500/28 bg-red-500/10 text-red-300/75"
          }`}>{tsl} · {trustScore}/100</span>
        )}
      </div>
      {/* File toolbar */}
      <div className="h-9 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
        <FileText className={`w-3.5 h-3.5 shrink-0 ${isLowConf ? "text-amber-400/50" : "text-violet-400/60"}`} />
        <span className="text-white/58 text-xs flex-1 truncate">{analysis.title ?? displayName}</span>
        {pageCount > 0 && (
          <span className="text-white/32 text-xs shrink-0">{pageCount} sections</span>
        )}
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <div className="flex items-center gap-0.5">
          {TRUST_TEXT_SIZES.map((s, i) => (
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
                ? `Source: ${activeEvidence.length > 60 ? activeEvidence.slice(0, 60) + "…" : activeEvidence}`
                : "Viewing source — relevant section highlighted below"}
            </p>
            <p className="text-violet-300/40 text-[9px]">Jumped from trust concerns panel — matching section highlighted below</p>
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
            <FileText className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-white/22 text-sm font-medium mb-1">Document sections not available</p>
            <p className="text-white/15 text-xs max-w-xs">Upload a text-based PDF or paste document text to see the content here alongside the trust analysis.</p>
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
                    : isLowConf
                    ? "border-amber-500/12 bg-amber-500/[0.015]"
                    : "border-white/[0.05] bg-white/[0.015]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-[9px] font-mono ${isHighlighted ? "text-violet-300/60" : "text-white/18"}`}>
                    {section.title ? section.title : `Section ${idx + 1}`}
                  </span>
                  {isHighlighted && (
                    <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
                      <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-200/75 text-[9px]">Source</span>
                    </div>
                  )}
                </div>
                <p className={`${textSize.body} leading-relaxed whitespace-pre-line ${isHighlighted ? "text-white/82" : "text-white/62"}`}>
                  {section.content}
                </p>
                {isHighlighted && activeEvidence && (
                  <div className="mt-1.5 rounded-lg border border-violet-500/18 bg-violet-500/[0.06] px-2.5 py-1.5">
                    <p className="text-violet-200/60 text-[9px] leading-relaxed line-clamp-3">"{activeEvidence}"</p>
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

// ─── Trust Intelligence Panel ─────────────────────────────────────────────────

const SEVERITY_STYLES = {
  high:   { border: "border-red-500/22 bg-red-500/[0.04]",    dot: "bg-red-400",    text: "text-red-300",   chip: "bg-red-500/15 border-red-500/25 text-red-300" },
  medium: { border: "border-amber-500/15 bg-amber-500/[0.03]", dot: "bg-amber-400",  text: "text-amber-300", chip: "bg-amber-500/15 border-amber-500/25 text-amber-300" },
  low:    { border: "border-white/[0.05] bg-transparent",      dot: "bg-white/22",   text: "text-white/35",  chip: "bg-white/[0.05] border-white/10 text-white/35" },
}

function TrustIntelPanel({
  analysis, onChipClick, activeChipId, sections,
}: {
  analysis: TrustCheckAnalysis
  onChipClick: (chipId: string, evidence: string, sectionId?: string) => void
  activeChipId: string | null
  sections: TrustCheckSection[]
}) {
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({})

  const trustScore = 100 - analysis.riskScore
  const tsc = trustScoreColor(trustScore)
  const tsl = trustScoreLabel(trustScore)

  const highCount = analysis.scamIndicators.filter(i => i.severity === "high").length
  const medCount  = analysis.scamIndicators.filter(i => i.severity === "medium").length
  const criticalCount = highCount
  const cautionCount  = medCount

  const confScore = analysis.scores?.verificationConfidence ?? 50
  const confLabel = confScore >= 65 ? "High confidence" : confScore >= 40 ? "Medium confidence" : "Low confidence"
  const confClass = confScore >= 65
    ? "bg-emerald-600/10 border-emerald-500/25 text-emerald-300"
    : confScore >= 40
    ? "bg-amber-600/10 border-amber-500/22 text-amber-300"
    : "bg-red-600/10 border-red-500/22 text-red-300"

  const verifyItems = analysis.whatToVerify ?? []
  const urgentIndices = new Set(
    verifyItems
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => /verify|confirm|contact|do not (pay|transfer|send)/i.test(t))
      .slice(0, 2)
      .map(({ i }) => i)
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
      <div className="p-5 flex flex-col gap-5">

        {/* Doc identity */}
        <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-white/90 text-sm font-semibold truncate">
                {analysis.title ?? `Document Trust Check`}
              </h1>
              {analysis.documentType && (
                <span className="h-4 px-1.5 rounded border border-amber-500/25 bg-amber-500/10 text-amber-300/70 text-[9px] shrink-0">
                  Needs Review
                </span>
              )}
            </div>
            <p className="text-white/52 text-[11px]">
              Claimed {analysis.documentType ?? "document"}
              {analysis.processedAt ? ` · ${new Date(analysis.processedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}
              {sections.length > 0 ? ` · ${sections.length} section${sections.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
        </div>

        {/* ── A. Trust Summary ── */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <SLabel icon={<Shield className="w-3.5 h-3.5" />}>A. Trust Summary</SLabel>
          <p className="text-white/78 text-sm leading-[1.72]">
            {analysis.verdictExplanation || analysis.whatItClaims}
          </p>
        </div>

        {/* ── B. Trust Score & Confidence ── */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <SLabel icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />}>B. Trust Score &amp; Confidence</SLabel>

          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <div className={`h-7 px-2.5 rounded-full border flex items-center gap-1.5 ${tsc.pill}`}>
              <AlertTriangle className={`w-3 h-3 ${tsc.icon}`} />
              <span className="text-[11px] font-medium">{tsl} · {trustScore}/100</span>
            </div>
            <span className={`h-6 px-2 rounded-full border text-[10px] flex items-center ${confClass}`}>
              {confLabel}
            </span>
            {analysis.documentType && (
              <span className="h-6 px-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/35 text-[10px] flex items-center">
                {analysis.documentType} · {Math.min(95, Math.round(confScore * 0.85 + 40))}% type match
              </span>
            )}
          </div>

          {/* Signal count chips */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {criticalCount > 0 && (
              <span className="h-5 px-2 rounded-full border border-red-500/20 bg-red-500/10 text-red-300 text-[9px] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                {criticalCount} possible critical signal{criticalCount !== 1 ? "s" : ""}
              </span>
            )}
            {cautionCount > 0 && (
              <span className="h-5 px-2 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300 text-[9px] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                {cautionCount} caution signal{cautionCount !== 1 ? "s" : ""}
              </span>
            )}
            {(analysis.legitimacyIndicators?.length ?? 0) > 0 && (
              <span className="h-5 px-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[9px] flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {analysis.legitimacyIndicators!.length} clean signal{analysis.legitimacyIndicators!.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Score explanation */}
          <div className="flex items-start gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <Info className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
            <p className="text-white/52 text-[10px] leading-relaxed">
              Trust score reflects document consistency, source clarity, metadata signals, and risk indicators. It is not a legal or forensic determination.
            </p>
          </div>
        </div>

        {/* ── C. Major Trust Concerns ── */}
        {analysis.scamIndicators.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <SLabel
              icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />}
              right={
                <span className="h-5 px-2 rounded-full text-[9px] font-medium border border-amber-500/25 bg-amber-500/10 text-amber-300">
                  {analysis.scamIndicators.length} concern{analysis.scamIndicators.length !== 1 ? "s" : ""}
                </span>
              }
            >
              C. Major Trust Concerns
            </SLabel>
            <div className="flex flex-col gap-2.5">
              {analysis.scamIndicators.map((ind, i) => {
                const sty = SEVERITY_STYLES[ind.severity]
                const chipId = `concern-${i}`
                const isActive = activeChipId === chipId
                const targetSectionId = ind.sourceSectionId ?? (ind.sourceEvidence ? findBestSection(ind.sourceEvidence, sections) ?? undefined : undefined)
                return (
                  <div key={i} className={`rounded-xl border p-3.5 transition-all duration-200 ${sty.border} ${isActive ? "ring-1 ring-violet-500/20" : ""}`}>
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${sty.dot}`} />
                      <p className={`text-xs font-medium flex-1 leading-snug ${sty.text}`}>{ind.indicator}</p>
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        {ind.sourceRef && (
                          <SourceChip
                            id={chipId}
                            label={ind.sourceRef}
                            active={isActive}
                            onClick={() => onChipClick(chipId, ind.sourceEvidence ?? ind.indicator, targetSectionId)}
                          />
                        )}
                      </div>
                    </div>
                    {ind.sourceEvidence && (
                      <p className="text-white/32 text-[11px] leading-relaxed ml-4 mb-1.5">{ind.sourceEvidence}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── D. Verification Checklist ── */}
        {verifyItems.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <SLabel
              icon={<CheckSquare className="w-3.5 h-3.5 text-violet-400/60" />}
              right={
                urgentIndices.size > 0 ? (
                  <span className="h-5 px-2 rounded-full text-[9px] font-medium border border-red-500/22 bg-red-500/10 text-red-300">
                    {urgentIndices.size} urgent
                  </span>
                ) : undefined
              }
            >
              D. Verification Checklist
            </SLabel>
            {/* ── Checklist progress bar — always visible ── */}
            {(() => {
              const total = verifyItems.length
              const doneCount = verifyItems.filter((_, i) => checklistDone[`check-${i}`]).length
              const pct = total === 0 ? 100 : Math.round((doneCount / total) * 100)
              const allDone = doneCount === total && total > 0
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/38 text-[9px]">{doneCount} of {total} verified</span>
                    <span className={`text-[9px] font-semibold tabular-nums ${allDone ? "text-emerald-400" : "text-violet-400/75"}`}>{pct}%</span>
                  </div>
                  <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-400" : "bg-violet-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {allDone && (
                    <p className="text-emerald-400/60 text-[9px] mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> All items verified
                    </p>
                  )}
                </div>
              )
            })()}
            <div className="flex flex-col gap-2">
              {verifyItems.map((item, i) => {
                const id = `check-${i}`
                const done = checklistDone[id] ?? false
                const isUrgent = urgentIndices.has(i)
                return (
                  <button
                    key={i}
                    onClick={() => setChecklistDone(prev => ({ ...prev, [id]: !prev[id] }))}
                    className="flex items-start gap-2.5 text-left group"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      done ? "bg-emerald-600/25 border-emerald-500/40" : "border-white/15 group-hover:border-white/25"
                    }`}>
                      {done && <CheckCheck className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                    <p className={`text-[11px] leading-relaxed flex-1 transition-colors ${done ? "line-through text-white/22" : "text-white/70"}`}>
                      {item}
                    </p>
                    {isUrgent && !done && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── E. Document Consistency ── */}
        {((analysis.legitimacyIndicators?.length ?? 0) > 0 || (analysis.structuralFindings?.length ?? 0) > 0) && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <SLabel icon={<GitMerge className="w-3.5 h-3.5 text-white/30" />}>E. Document Consistency</SLabel>
            <div className="flex flex-col gap-2">
              {(analysis.legitimacyIndicators ?? []).map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/70 shrink-0 mt-0.5" />
                  <p className="text-white/50 text-[11px] leading-relaxed">{item}</p>
                </div>
              ))}
              {(analysis.structuralFindings ?? []).map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-amber-400/60 shrink-0 mt-0.5" />
                  <p className="text-white/42 text-[11px] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── F. Metadata / Structure Signals ── */}
        {(analysis.metadataFindings?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <SLabel icon={<Database className="w-3.5 h-3.5 text-white/50" />}>F. Metadata / Structure Signals</SLabel>
            <div className="flex flex-col gap-2.5">
              {analysis.metadataFindings!.map((finding, i) => (
                <div key={i} className={`rounded-lg border p-2.5 ${
                  finding.suspicious
                    ? "border-amber-500/15 bg-amber-500/[0.03]"
                    : "border-white/[0.05] bg-transparent"
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-white/40 text-[10px] font-mono">{finding.field}</span>
                    {finding.suspicious && (
                      <span className="h-4 px-1.5 rounded text-[9px] border border-amber-500/25 text-amber-300/70">possible signal</span>
                    )}
                  </div>
                  <p className="text-white/55 text-[11px] font-medium mb-1">{finding.value}</p>
                  <p className="text-white/55 text-[10px] leading-relaxed">{finding.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── G. Source Traceability ── */}
        {analysis.scamIndicators.some(i => i.sourceEvidence) && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <SLabel icon={<Search className="w-3.5 h-3.5 text-white/50" />}>G. Source Traceability</SLabel>
            <div className="flex flex-col gap-2">
              {analysis.scamIndicators
                .filter(i => i.sourceEvidence)
                .map((ind, i) => {
                  const chipId = `trace-${i}`
                  const targetSectionId = ind.sourceSectionId ?? (ind.sourceEvidence ? findBestSection(ind.sourceEvidence, sections) ?? undefined : undefined)
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1 h-1 rounded-full bg-violet-400/50 shrink-0 mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/55 text-[10px] leading-relaxed italic">"{ind.sourceEvidence}"</p>
                        {(ind.sourceRef || targetSectionId) && (
                          <div className="mt-1">
                            <SourceChip
                              id={chipId}
                              label={ind.sourceRef ?? (targetSectionId ? sections.find(s => s.id === targetSectionId)?.title ?? targetSectionId : "source")}
                              active={activeChipId === chipId}
                              onClick={() => targetSectionId
                                ? onChipClick(chipId, ind.sourceEvidence!, targetSectionId)
                                : undefined
                              }
                            />
                          </div>
                        )}
                      </div>
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

// ─── Low Confidence Panel ────────────────────────────────────────────────────

function LowConfPanel({ analysis, onReanalyze, onNewCheck }: {
  analysis: TrustCheckAnalysis
  onReanalyze: () => void
  onNewCheck: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
      <div className="p-5 flex flex-col gap-5">

        {/* Summary banner */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-amber-300 text-sm font-semibold">Partial trust check — low scan quality</p>
          </div>
          <p className="text-white/60 text-[12px] leading-relaxed mb-3">
            PlainPath could review part of this document, but the scan quality limits trust confidence. A full check is not possible from this version.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* What could be read */}
            <div>
              <p className="text-white/52 text-[9px] uppercase tracking-widest font-semibold mb-1.5">What PlainPath could read</p>
              {(analysis.sections ?? []).slice(0, 1).map(s => (
                <div key={s.id} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400/60 shrink-0 mt-0.5" />
                  <p className="text-white/42 text-[11px]">{s.title ?? "Page 1"} — {s.content.split("\n")[0]}</p>
                </div>
              ))}
              {(analysis.sections?.length ?? 0) === 0 && (
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400/60 shrink-0 mt-0.5" />
                  <p className="text-white/42 text-[11px]">Page 1 — payment request, amount, and due date</p>
                </div>
              )}
            </div>

            {/* What could not be verified */}
            <div>
              <p className="text-white/52 text-[9px] uppercase tracking-widest font-semibold mb-1.5">What could not be verified</p>
              {[
                "Pages 2–3 — authority references, terms, and conditions",
                "Signature block and official identifiers",
                "Sender contact details and issuing authority",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1">
                  <X className="w-3 h-3 text-white/25 shrink-0 mt-0.5" />
                  <p className="text-white/55 text-[11px]">{item}</p>
                </div>
              ))}
              <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-500/15 bg-amber-500/[0.03] px-2 py-1.5">
                <Info className="w-3 h-3 text-amber-400/50 shrink-0 mt-0.5" />
                <p className="text-amber-300/55 text-[10px]">Upload a text-based PDF for a full, high-confidence trust check.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended next steps */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-white/55 text-xs font-semibold mb-3">Recommended next steps</p>
          <div className="flex flex-col gap-2">
            {[
              { icon: Upload, label: "Upload a clearer scan or PDF", desc: "Higher resolution gives much better trust signal coverage.", primary: true },
              { icon: FileText, label: "Upload a text-based version", desc: "Export from the original application instead of scanning.", primary: false },
              { icon: RefreshCcw, label: "Continue with partial review", desc: "See what PlainPath could assess from the readable sections.", primary: false },
              { icon: MessageSquare, label: "Ask This Document", desc: "Ask targeted questions — sometimes extracts more from poor scans.", primary: false },
            ].map((step, i) => (
              <button
                key={i}
                onClick={i === 0 || i === 1 ? onNewCheck : undefined}
                className={`flex items-center gap-3 p-3 rounded-xl text-left border transition-colors ${
                  step.primary
                    ? "border-violet-500/25 bg-violet-500/[0.05] hover:bg-violet-500/[0.09]"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${step.primary ? "bg-violet-600/20" : "bg-white/[0.04]"}`}>
                  <step.icon className={`w-3.5 h-3.5 ${step.primary ? "text-violet-400" : "text-white/35"}`} />
                  {step.primary && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-0.5 shrink-0" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${step.primary ? "text-violet-200/85" : "text-white/55"}`}>{step.label}</p>
                  <p className="text-white/52 text-[10px] leading-tight">{step.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Partial signals found */}
        {analysis.scamIndicators.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/52 text-[9px] uppercase tracking-widest font-semibold">Partial signals found</p>
              <span className="h-5 px-2 rounded-full text-[9px] border border-white/10 text-white/30">verify manually</span>
            </div>
            <div className="flex flex-col gap-2">
              {analysis.scamIndicators.map((ind, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${ind.severity === "high" ? "bg-red-400" : ind.severity === "medium" ? "bg-amber-400" : "bg-white/20"}`} />
                  <p className="text-white/42 text-[11px] leading-relaxed">{ind.indicator}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onCheckDocument, showUpgrade, setShowUpgrade }: {
  onCheckDocument: () => void
  showUpgrade: boolean
  setShowUpgrade: (v: boolean) => void
}) {
  const [, setLocation] = useLocation()

  const WORKS_WELL_WITH = [
    { icon: FileText,  label: "Invoices & payment requests",    desc: "Look for suspicious senders, unusual payment methods, date gaps.", color: "text-amber-400" },
    { icon: Shield,    label: "Contracts & agreements",         desc: "Check party consistency, dates, and document structure.",         color: "text-violet-400" },
    { icon: FileText,  label: "Official notices & letters",     desc: "Spot impersonation signals and formatting inconsistencies.",       color: "text-blue-400" },
    { icon: Layers,    label: "Court & government documents",    desc: "Review structure, identifiers, and source signals.",              color: "text-amber-400" },
    { icon: Database,  label: "Records & certificates",         desc: "Look for missing fields, altered data, scan anomalies.",           color: "text-red-400" },
    { icon: CheckSquare, label: "Forms & applications",         desc: "Review completeness, formatting, and consistency.",               color: "text-emerald-400" },
  ]

  const DEMO_CHIPS = [
    { id: "northstar-invoice",  label: "Vendor Invoice — Northstar Cloud Services",  verdict: "Possible risk indicators" },
    { id: "fake-utility-shutoff", label: "Fake Utility Shutoff Notice",              verdict: "High scam risk" },
    { id: "legitimate-utility-notice", label: "Legitimate Utility Notice",           verdict: "Signals align" },
    { id: "atlas-lowconf",      label: "Partial scan — Atlas Vendor Services",       verdict: "Low scan quality" },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0d10]">
      <div className="max-w-xl mx-auto px-5 py-14 flex flex-col items-center text-center">

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-5">
          <Shield className="w-7 h-7 text-violet-400/70" />
        </div>
        <h2 className="text-white/90 text-lg font-semibold mb-2">Check whether a document can be trusted.</h2>
        <p className="text-white/40 text-sm leading-relaxed mb-7 max-w-sm">
          Upload a document. PlainPath checks for credibility signals, missing details, suspicious structure, conflicting information, and source-backed risk indicators.
        </p>

        {/* Upload zone */}
        <div
          onClick={onCheckDocument}
          className="w-full rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.025] hover:border-violet-500/25 transition-all cursor-pointer px-8 py-10 mb-4"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-600/12 border border-violet-500/18 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-5 h-5 text-violet-400/70" />
          </div>
          <p className="text-white/55 text-sm font-medium mb-1">Drop your document here</p>
          <p className="text-white/28 text-xs mb-4">PlainPath checks for trust signals — not the meaning of the content</p>
          <button
            onClick={(e) => { e.stopPropagation(); onCheckDocument() }}
            className="h-8 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
          >
            Choose file
          </button>
          <p className="text-white/18 text-[10px] mt-2">PDF, DOCX, TXT · Up to 50 MB</p>
        </div>

        {/* Alt input methods */}
        <div className="w-full grid grid-cols-3 gap-2 mb-7">
          {[
            { icon: Image,         label: "Scan Photo",   desc: "Point camera at document" },
            { icon: ClipboardPaste, label: "Paste Text",  desc: "Paste from email or web" },
            { icon: Link2,         label: "Import Link",  desc: "From URL or cloud" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={onCheckDocument}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
            >
              <item.icon className="w-4 h-4 text-white/30" />
              <span className="text-white/55 text-[11px] font-medium">{item.label}</span>
              <span className="text-white/22 text-[9px]">{item.desc}</span>
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="w-full flex items-start gap-2 rounded-xl border border-white/[0.05] bg-amber-500/[0.04] px-3 py-2.5 mb-8 text-left">
          <Info className="w-3.5 h-3.5 text-amber-400/50 shrink-0 mt-0.5" />
          <p className="text-white/30 text-[10px] leading-relaxed">
            PlainPath identifies <span className="text-amber-300/65 font-medium">possible risk indicators and trust signals</span> only. Results are not a legal or forensic determination. Human verification is always required before acting on any finding.
          </p>
        </div>

        {/* Works well with */}
        <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold mb-3">Works well with</p>
        <div className="w-full grid grid-cols-2 gap-2 mb-8">
          {WORKS_WELL_WITH.map((item) => (
            <button
              key={item.label}
              onClick={onCheckDocument}
              className="flex items-start gap-2.5 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03] text-left transition-all"
            >
              <item.icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${item.color}`} />
              <div>
                <p className="text-white/52 text-[11px] font-medium leading-tight">{item.label}</p>
                <p className="text-white/24 text-[10px] leading-tight mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Demo chips */}
        <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold mb-3">Or try a demo</p>
        <div className="w-full flex flex-col gap-2">
          {DEMO_CHIPS.map((d) => (
            <button
              key={d.id}
              onClick={() => setLocation(`/trust-check?demo=${d.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/20 hover:bg-violet-500/[0.03] transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-600/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 text-violet-400/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/55 text-xs font-medium leading-tight">{d.label}</p>
                <p className="text-white/25 text-[10px]">{d.verdict}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
            </button>
          ))}
        </div>

        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="trustCheck" />
      </div>
    </div>
  )
}

// ─── Error State ─────────────────────────────────────────────────────────────

function ErrorState({ filename, onRetry, onNewFile, onSetLocation }: {
  filename: string | null
  onRetry: () => void
  onNewFile: () => void
  onSetLocation: (path: string) => void
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0d10] flex items-center justify-center px-5">
      <div className="max-w-sm w-full">
        {/* Main card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-4 text-center">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-5 h-5 text-white/30" />
          </div>
          <h2 className="text-white/80 text-sm font-semibold mb-2">Trust check could not be completed.</h2>
          <p className="text-white/40 text-xs leading-relaxed mb-4">
            The document appears to be password-protected or encrypted. PlainPath needs readable text to check for trust signals.
          </p>

          {filename && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-5 text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-white/25" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/55 text-xs font-medium truncate">{filename}</p>
                <p className="text-white/22 text-[10px]">Uploaded just now · Encrypted</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
            <button
              onClick={onNewFile}
              className="flex-1 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] text-white/55 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Upload different file
            </button>
          </div>
        </div>

        {/* Alternatives */}
        <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold text-center mb-2">What you can try instead</p>
        <div className="flex flex-col gap-1.5">
          {[
            { icon: Upload, label: "Upload an unprotected version", desc: "Remove the password, then re-upload. This gives PlainPath access to run a full trust check.", onClick: onNewFile },
            { icon: MessageSquare, label: "Ask This Document", desc: "Ask targeted questions. Works on some protected files for basic information.", onClick: () => onSetLocation("/ask-document") },
            { icon: Layers, label: "Analyze a Document", desc: "Get a full plain-English analysis once the file is readable.", onClick: () => onSetLocation("/analyze-document") },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-left transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-white/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/55 text-xs font-medium">{item.label}</p>
                <p className="text-white/25 text-[10px] leading-tight">{item.desc}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile: Trust View ───────────────────────────────────────────────────────

function MobileTrustView({
  analysis, onChipClick, activeChipId, sections, onViewDoc,
}: {
  analysis: TrustCheckAnalysis
  onChipClick: (chipId: string, evidence: string, sectionId?: string) => void
  activeChipId: string | null
  sections: TrustCheckSection[]
  onViewDoc: () => void
}) {
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({})
  const trustScore = 100 - analysis.riskScore
  const tsc = trustScoreColor(trustScore)
  const confScore = analysis.scores?.verificationConfidence ?? 50
  const confLabel = confScore >= 65 ? "high confidence" : confScore >= 40 ? "medium confidence" : "low confidence"

  const verifyItems = analysis.whatToVerify ?? []
  const urgentIndices = new Set(
    verifyItems
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => /verify|confirm|contact|do not (pay|transfer|send)/i.test(t))
      .slice(0, 2)
      .map(({ i }) => i)
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
      <div className="px-4 py-4 flex flex-col gap-4">

        {/* Active source chip strip */}
        {activeChipId && (
          <div className="flex items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/[0.06] px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
            <p className="text-violet-200/75 text-[11px] flex-1 truncate">
              Source — {analysis.scamIndicators.find((_, i) => activeChipId.includes(String(i)))?.sourceRef ?? "highlighted below"}
            </p>
            <button
              onClick={() => onViewDoc()}
              className="text-violet-300/60 text-[10px] font-medium flex items-center gap-0.5"
            >
              + Doc <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Score summary */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`h-6 px-2.5 rounded-full border flex items-center gap-1.5 ${tsc.pill}`}>
            <AlertTriangle className={`w-2.5 h-2.5 ${tsc.icon}`} />
            <span className="text-[10px] font-medium">{trustScoreLabel(trustScore)} · {trustScore}/100</span>
          </div>
          <span className="text-white/30 text-[10px]">{confLabel}</span>
        </div>

        {/* Trust Summary */}
        <div className="rounded-xl border border-amber-500/18 bg-amber-500/[0.04] p-3.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold text-white/25 mb-1.5">Trust Summary</p>
          <p className="text-white/65 text-xs leading-relaxed">{analysis.verdictExplanation}</p>
          {/* Source chips for active concerns */}
          <div className="flex gap-1.5 flex-wrap mt-2.5">
            {analysis.scamIndicators.slice(0, 3).map((ind, i) => (
              ind.sourceRef ? (
                <SourceChip
                  key={i}
                  id={`m-concern-${i}`}
                  label={ind.sourceRef}
                  active={activeChipId === `m-concern-${i}`}
                  onClick={() => {
                    const sId = ind.sourceSectionId ?? (ind.sourceEvidence ? findBestSection(ind.sourceEvidence, sections) ?? undefined : undefined)
                    onChipClick(`m-concern-${i}`, ind.sourceEvidence ?? ind.indicator, sId)
                  }}
                />
              ) : null
            ))}
          </div>
          {/* Score note */}
          <p className="text-white/22 text-[9px] leading-relaxed mt-2">
            Score reflects consistency, source clarity, and risk indicators — not a legal determination.
          </p>
        </div>

        {/* Risk Indicators */}
        {analysis.scamIndicators.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
            <p className="text-[9px] uppercase tracking-widest font-semibold text-white/25 mb-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400/50" /> Risk Indicators
            </p>
            <div className="flex flex-col gap-2.5">
              {analysis.scamIndicators.map((ind, i) => {
                const sty = SEVERITY_STYLES[ind.severity]
                const chipId = `m-concern-${i}`
                const isActive = activeChipId === chipId
                const targetSectionId = ind.sourceSectionId ?? (ind.sourceEvidence ? findBestSection(ind.sourceEvidence, sections) ?? undefined : undefined)
                return (
                  <div key={i} className={`rounded-xl border p-3 transition-all ${sty.border} ${isActive ? "ring-1 ring-violet-500/20" : ""}`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${sty.dot}`} />
                      <p className={`text-[11px] font-medium flex-1 leading-snug ${sty.text}`}>{ind.indicator}</p>
                      {ind.sourceRef && (
                        <SourceChip
                          id={chipId}
                          label={ind.sourceRef}
                          active={isActive}
                          onClick={() => onChipClick(chipId, ind.sourceEvidence ?? ind.indicator, targetSectionId)}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Verification Checklist */}
        {verifyItems.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[9px] uppercase tracking-widest font-semibold text-white/25 flex items-center gap-1.5">
                <CheckSquare className="w-3 h-3 text-violet-400/50" /> Verification Checklist
              </p>
              {urgentIndices.size > 0 && (
                <span className="h-4 px-1.5 rounded-full text-[9px] border border-red-500/22 bg-red-500/10 text-red-300">
                  {urgentIndices.size} urgent
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {verifyItems.map((item, i) => {
                const id = `m-check-${i}`
                const done = checklistDone[id] ?? false
                return (
                  <button
                    key={i}
                    onClick={() => setChecklistDone(prev => ({ ...prev, [id]: !prev[id] }))}
                    className="flex items-start gap-2.5 text-left"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${done ? "bg-emerald-600/25 border-emerald-500/40" : "border-white/15"}`}>
                      {done && <CheckCheck className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                    <p className={`text-[11px] leading-relaxed flex-1 ${done ? "line-through text-white/20" : "text-white/55"}`}>{item}</p>
                    {urgentIndices.has(i) && !done && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* View document source button */}
        {sections.length > 0 && (
          <button
            onClick={onViewDoc}
            className="w-full h-11 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] text-white/40 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            View document source
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Mobile: Document View ────────────────────────────────────────────────────

function MobileDocView({
  analysis, sections, activeChipId, activeEvidence, highlightSectionId,
  onDismiss, sectionRefs, onBack,
}: {
  analysis: TrustCheckAnalysis
  sections: TrustCheckSection[]
  activeChipId: string | null
  activeEvidence: string | null
  highlightSectionId: string | null
  onDismiss: () => void
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  onBack: () => void
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d10]">
      {/* Active citation banner */}
      {activeChipId && (
        <div className="mx-3 mt-2 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
          <p className="text-violet-200/75 text-[10px] flex-1 truncate">
            Highlighted from trust concern — tap to return
          </p>
          <button onClick={onDismiss} className="text-white/20 hover:text-white/45 shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {sections.map((section, idx) => {
          const isHighlighted = highlightSectionId === section.id
          return (
            <div
              key={section.id}
              ref={(el) => { sectionRefs.current[section.id] = el }}
              className={`w-full rounded-xl border p-3.5 flex flex-col gap-2 transition-all duration-300 ${
                isHighlighted
                  ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20"
                  : "border-white/[0.05] bg-white/[0.015]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-mono ${isHighlighted ? "text-violet-300/60" : "text-white/18"}`}>
                  {section.title ?? `Section ${idx + 1}`}
                </span>
                {isHighlighted && (
                  <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
                    <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-violet-200/75 text-[9px]">+ Source</span>
                  </div>
                )}
              </div>
              <p className={`text-[11px] leading-relaxed whitespace-pre-line ${isHighlighted ? "text-white/65" : "text-white/32"}`}>
                {section.content}
              </p>
              {isHighlighted && activeEvidence && (
                <div className="rounded-lg border border-violet-500/18 bg-violet-500/[0.06] px-2.5 py-1.5">
                  <p className="text-violet-200/60 text-[9px] leading-relaxed">"{activeEvidence}"</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Page nav + Back */}
      <div className="border-t border-white/[0.06] px-4 py-2 shrink-0 flex items-center justify-between">
        <span className="text-white/22 text-xs">Section {highlightSectionId ? sections.findIndex(s => s.id === highlightSectionId) + 1 : 1} of {sections.length}</span>
        <div className="flex items-center gap-1">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => sectionRefs.current[s.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${highlightSectionId === s.id ? "bg-violet-600 text-white" : "text-white/22"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Back to Trust Check */}
      <button
        onClick={onBack}
        className="mx-3 mb-3 h-10 rounded-xl bg-violet-600/15 border border-violet-500/20 hover:bg-violet-600/25 text-violet-300 text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Trust Check
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function TrustCheck() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const params = new URLSearchParams(searchString)
  const demoId    = params.get("demo")
  const errorType = params.get("error")
  const errorFilename = params.get("filename")

  const { trustCheckAnalysis } = useAnalysisContext()
  const { isSignedIn } = useUser()
  const { entitlements } = useEntitlements()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [demoAnalysis, setDemoAnalysis] = useState<TrustCheckAnalysis | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)

  const [activeChipId, setActiveChipId] = useState<string | null>(null)
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null)
  const [highlightSectionId, setHighlightSectionId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [mobileTab, setMobileTab] = useState<"trust" | "doc">("trust")
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    document.title = "Document Trust Check — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => {
    if (!demoId) return
    setDemoLoading(true)
    const apiBase = getApiBaseUrl()
    fetch(`${apiBase}/api/documents/trust-check-demo/${encodeURIComponent(demoId)}`)
      .then(r => r.json())
      .then(data => { if (data?.analysis) setDemoAnalysis(data.analysis) })
      .catch(() => {})
      .finally(() => setDemoLoading(false))
  }, [demoId])

  const analysis: TrustCheckAnalysis | null = demoId ? demoAnalysis : trustCheckAnalysis
  const sections: TrustCheckSection[] = analysis?.sections ?? []
  const isLowConf = Boolean(analysis && (analysis.scanQuality === "poor" || (analysis.scores?.verificationConfidence ?? 50) < 30))

  function handleChipClick(chipId: string, evidence: string, sectionId?: string) {
    if (activeChipId === chipId) {
      setActiveChipId(null)
      setActiveEvidence(null)
      setHighlightSectionId(null)
      return
    }
    setActiveChipId(chipId)
    setActiveEvidence(evidence)
    const target = sectionId ?? findBestSection(evidence, sections) ?? null
    setHighlightSectionId(target)
    if (target && sectionRefs.current[target]) {
      sectionRefs.current[target]?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    // On mobile, switch to doc tab when a source chip is clicked
    setMobileTab("doc")
  }

  function dismissChip() {
    setActiveChipId(null)
    setActiveEvidence(null)
    setHighlightSectionId(null)
  }

  function handleCheckDocument() {
    const hasTrustCheck = entitlements?.toolAccess?.includes("trust-check") ?? false
    if (!hasTrustCheck) { setShowUpgrade(true); return }
    setLocation("/import?mode=trust-check")
  }

  async function handleSave() {
    if (!analysis || demoId) return
    const title = analysis.title ?? `Trust Check — ${analysis.verdict}`
    try {
      if (isSignedIn) {
        const saved = await saveCloudTrustCheck({ title, analysis })
        setSavedId(saved.id)
      } else {
        const saved = saveTrustCheck({ title, analysis })
        setSavedId(saved.id)
      }
    } catch {
      const saved = saveTrustCheck({ title, analysis })
      setSavedId(saved.id)
    }
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }

  // ── Loading demo ──────────────────────────────────────────────────────────
  if (demoLoading) {
    return (
      <div className="h-screen bg-[#0d0d10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400/60 animate-pulse" />
          </div>
          <p className="text-white/25 text-xs">Running trust check…</p>
        </div>
      </div>
    )
  }

  // ── Trusted score for header pill ─────────────────────────────────────────
  const trustScore  = analysis ? 100 - analysis.riskScore : null
  const tsc = trustScore !== null ? trustScoreColor(trustScore) : null

  // ── Shared header ─────────────────────────────────────────────────────────
  const Header = (
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-[#0f0f12] border-b border-white/[0.06] z-20">
      <button
        onClick={() => analysis ? setLocation("/import?mode=trust-check") : setLocation("/import?mode=trust-check")}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/55 hover:bg-white/[0.05] transition-colors shrink-0"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>

      {/* Logo + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-6 h-6 rounded-lg bg-violet-600/12 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Shield className="w-3 h-3 text-violet-400/70" />
        </div>
        <span className="text-white/30 text-xs font-medium shrink-0">Document Trust Check</span>
        {analysis?.title && (
          <>
            <ChevronRight className="w-3 h-3 text-white/15 shrink-0" />
            <span className="text-white/45 text-xs truncate min-w-0">{analysis.title}</span>
          </>
        )}
      </div>

      {/* Score pill */}
      {tsc && trustScore !== null && (
        <div className={`h-7 px-2.5 rounded-full border flex items-center gap-1.5 shrink-0 ${tsc.pill}`}>
          <AlertTriangle className={`w-2.5 h-2.5 ${tsc.icon}`} />
          <span className="text-[10px] font-medium">{trustScoreLabel(trustScore)} · {trustScore}/100</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {analysis && !demoId && (
          <button
            onClick={handleSave}
            className={`p-1.5 rounded-lg border transition-colors ${
              justSaved
                ? "border-emerald-700/50 bg-emerald-900/30 text-emerald-400"
                : "border-white/[0.08] bg-white/[0.03] text-white/30 hover:text-white/55 hover:bg-white/[0.06]"
            }`}
            title={savedId ? "Saved" : "Save result"}
          >
            {savedId ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          onClick={handleCheckDocument}
          className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 text-xs font-medium hover:text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          <RefreshCcw className="w-3 h-3" /> Re-analyze
        </button>
      </div>
    </div>
  )

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!analysis && !errorType) {
    return (
      <div className="h-screen flex flex-col bg-[#0d0d10] text-white overflow-hidden">
        {Header}
        <EmptyState
          onCheckDocument={handleCheckDocument}
          showUpgrade={showUpgrade}
          setShowUpgrade={setShowUpgrade}
        />
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (errorType === "encrypted" || errorType === "unreadable") {
    return (
      <div className="h-screen flex flex-col bg-[#0d0d10] text-white overflow-hidden">
        {Header}
        <ErrorState
          filename={errorFilename}
          onRetry={() => setLocation("/import?mode=trust-check")}
          onNewFile={() => setLocation("/import?mode=trust-check")}
          onSetLocation={setLocation}
        />
      </div>
    )
  }

  // ── Low confidence state ──────────────────────────────────────────────────
  if (analysis && isLowConf) {
    return (
      <div className="h-screen flex flex-col bg-[#0d0d10] text-white overflow-hidden">
        {Header}
        {/* Desktop: split layout */}
        <div className="flex-1 flex overflow-hidden">
          <DocViewer
            analysis={analysis}
            sections={sections}
            activeChipId={activeChipId}
            activeEvidence={activeEvidence}
            highlightSectionId={highlightSectionId}
            onDismiss={dismissChip}
            sectionRefs={sectionRefs}
          />
          <LowConfPanel
            analysis={analysis}
            onReanalyze={handleCheckDocument}
            onNewCheck={handleCheckDocument}
          />
        </div>
      </div>
    )
  }

  if (!analysis) return null

  // ── Full workspace ────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#0d0d10] text-white overflow-hidden">
      {Header}

      {/* Desktop workspace */}
      <div className="flex-1 hidden sm:flex overflow-hidden">
        <DocViewer
          analysis={analysis}
          sections={sections}
          activeChipId={activeChipId}
          activeEvidence={activeEvidence}
          highlightSectionId={highlightSectionId}
          onDismiss={dismissChip}
          sectionRefs={sectionRefs}
        />
        <TrustIntelPanel
          analysis={analysis}
          onChipClick={handleChipClick}
          activeChipId={activeChipId}
          sections={sections}
        />
      </div>

      {/* Mobile layout */}
      <div className="flex-1 sm:hidden flex flex-col overflow-hidden">
        {/* File strip */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-[#0d0d10] shrink-0">
          <FileText className="w-3.5 h-3.5 text-white/22 shrink-0" />
          <span className="text-white/40 text-xs truncate flex-1">{analysis.title ?? "Document"}</span>
          {sections.length > 0 && <span className="text-white/18 text-[10px] shrink-0">{sections.length} pp.</span>}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06] bg-[#0d0d10] shrink-0">
          {(["trust", "doc"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                mobileTab === tab ? "text-white/80" : "text-white/28 hover:text-white/50"
              }`}
            >
              {tab === "trust" ? "Trust Check" : "Document"}
              {mobileTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {mobileTab === "trust" ? (
          <MobileTrustView
            analysis={analysis}
            onChipClick={handleChipClick}
            activeChipId={activeChipId}
            sections={sections}
            onViewDoc={() => setMobileTab("doc")}
          />
        ) : (
          sections.length > 0 ? (
            <MobileDocView
              analysis={analysis}
              sections={sections}
              activeChipId={activeChipId}
              activeEvidence={activeEvidence}
              highlightSectionId={highlightSectionId}
              onDismiss={dismissChip}
              sectionRefs={sectionRefs}
              onBack={() => setMobileTab("trust")}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
              <FileText className="w-8 h-8 text-white/10 mb-3" />
              <p className="text-white/22 text-sm font-medium mb-1">Document not available</p>
              <p className="text-white/15 text-xs max-w-xs">Upload a text-based file to see the document content here.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
