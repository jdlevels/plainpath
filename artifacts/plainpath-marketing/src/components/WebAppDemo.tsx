/**
 * WebAppDemo — 7-tool live workspace demo
 *
 * Controlled mode: pass activeTool (0–6) + onToolChange from Home.tsx's
 * shared demo rotation state so all surfaces stay in sync.
 * Uncontrolled mode: self-rotates through all 7 tools every 3 500 ms.
 *
 * Dark-themed — designed to sit inside the dark "One platform" section.
 */

import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  AlertTriangle, CheckCircle2, Shield, ShieldAlert, Scale,
  FileText, EyeOff, GitCompare, ListChecks,
  PenLine, Download, Sparkles,
} from "lucide-react"

const TOOL_MS = 3500

const slide = {
  hidden:  { opacity: 0, y: 8  },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.26 } },
}

/* ─── Tool config ────────────────────────────────────────────── */
const TOOLS = [
  { id: 0, shortName: "Analyze",  icon: FileText,      hex: "#3b82f6", iconHex: "#93c5fd", docName: "Lease Agreement — Unit 4B.pdf",  docMeta: "847 words · 12 pages",   badge: { label: "3 issues",      dot: "#f59e0b" } },
  { id: 1, shortName: "Trust",    icon: ShieldAlert,   hex: "#ef4444", iconHex: "#fca5a5", docName: "IRS Notice — CP2000.pdf",        docMeta: "312 words · 2 pages",    badge: { label: "High risk",     dot: "#ef4444" } },
  { id: 2, shortName: "Build",    icon: PenLine,       hex: "#10b981", iconHex: "#6ee7b7", docName: "Freelance Services Agreement",   docMeta: "New contract · 6 fields", badge: { label: "Building…",     dot: "#10b981" } },
  { id: 3, shortName: "Review",   icon: Scale,         hex: "#f59e0b", iconHex: "#fcd34d", docName: "Employment Agreement.pdf",       docMeta: "1,240 words · 8 pages",  badge: { label: "Score: 28/100", dot: "#f59e0b" } },
  { id: 4, shortName: "Redact",   icon: EyeOff,        hex: "#8b5cf6", iconHex: "#c4b5fd", docName: "Patient Intake Form.pdf",        docMeta: "423 words · 3 pages",    badge: { label: "3 items",       dot: "#8b5cf6" } },
  { id: 5, shortName: "Compare",  icon: GitCompare,    hex: "#14b8a6", iconHex: "#5eead4", docName: "NDA v1.pdf → NDA v2.pdf",       docMeta: "2 versions · 14 changes", badge: { label: "1 critical",    dot: "#ef4444" } },
  { id: 6, shortName: "Extract",  icon: ListChecks,    hex: "#c026d3", iconHex: "#f0abfc", docName: "Lease Agreement.pdf",           docMeta: "2,840 words · 12 pages", badge: { label: "6 obligations", dot: "#c026d3" } },
] as const

type ToolId = 0|1|2|3|4|5|6

/* ─── App nav bar ────────────────────────────────────────────── */
function MiniNav({
  active,
  onSelect,
}: {
  active: ToolId
  onSelect: (id: ToolId) => void
}) {
  const tool = TOOLS[active]
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800 shrink-0 bg-zinc-950">
      {/* Logo */}
      <div className="flex items-center gap-1.5 mr-1 shrink-0">
        <div className="w-5 h-5 bg-primary rounded flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-[10px] font-bold text-zinc-200">PlainPath</span>
      </div>

      {/* Tool tabs */}
      {TOOLS.map((t) => {
        const Icon = t.icon
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id as ToolId)}
            className="relative flex items-center justify-center rounded-md transition-all shrink-0"
            style={{
              width: 26,
              height: 22,
              background: isActive ? `${t.hex}22` : "transparent",
            }}
            title={t.shortName}
            type="button"
          >
            <Icon
              className="transition-colors"
              style={{
                width: 11,
                height: 11,
                color: isActive ? t.hex : "#52525b",
              }}
            />
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 rounded-full"
                style={{ width: 14, height: 2, background: t.hex }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        )
      })}

      {/* Active label */}
      <span
        className="text-[9px] font-semibold ml-1 hidden sm:block shrink-0"
        style={{ color: tool.hex }}
      >
        {tool.shortName}
      </span>

      {/* Spacer + avatar */}
      <div className="flex-1" />
      <div className="w-5 h-5 rounded-full bg-zinc-700 shrink-0" />
    </div>
  )
}

/* ─── Doc header bar ─────────────────────────────────────────── */
function DocHeader({ toolId }: { toolId: ToolId }) {
  const t = TOOLS[toolId]
  const Icon = t.icon
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={toolId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-800 bg-[#0d0d12] shrink-0"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${t.hex}1a` }}
        >
          <Icon style={{ width: 13, height: 13, color: t.hex }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-zinc-200 truncate leading-tight">{t.docName}</p>
          <p className="text-[9px] text-zinc-500 leading-tight">{t.docMeta}</p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 shrink-0"
          style={{
            background: `${t.badge.dot}1a`,
            border: `1px solid ${t.badge.dot}44`,
          }}
        >
          <motion.div
            animate={toolId === 2 ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: t.badge.dot }}
          />
          <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: t.badge.dot }}>
            {t.badge.label}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Doc panes ──────────────────────────────────────────────── */

function DocLines({ highlighted = false, hlColor = "rgba(245,158,11,0.35)" }: { highlighted?: boolean; hlColor?: string }) {
  return (
    <div className="space-y-1.5">
      {[80, 92, 68].map((w, i) => (
        <div key={i} className="h-[5px] rounded-full bg-zinc-800" style={{ width: `${w}%` }} />
      ))}
      <div
        className="rounded-md p-1.5 border transition-all"
        style={{ background: highlighted ? hlColor : "transparent", borderColor: highlighted ? hlColor : "#27272a" }}
      >
        <div className="space-y-1">
          {[88, 70].map((w, i) => (
            <div key={i} className="h-[5px] rounded-full" style={{ width: `${w}%`, background: highlighted ? "rgba(255,255,255,0.18)" : "#3f3f46" }} />
          ))}
        </div>
      </div>
      {[60, 75, 88, 50].map((w, i) => (
        <div key={i} className="h-[5px] rounded-full bg-zinc-800" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

function RedactedDocLines() {
  const rows = [
    { w: 72, r: false }, { w: 88, r: false }, { w: 55, r: true },
    { w: 100, r: false }, { w: 90, r: false }, { w: 42, r: true },
    { w: 82, r: false }, { w: 100, r: false }, { w: 60, r: true },
    { w: 70, r: false },
  ]
  return (
    <div className="space-y-1.5">
      {rows.map(({ w, r }, i) => (
        <div key={i} className={`h-[5px] rounded-full ${r ? "bg-zinc-200" : "bg-zinc-800"}`} style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

function DiffDocLines() {
  const lines = [
    { type: "same",    w: 82 }, { type: "same",    w: 66 },
    { type: "removed", w: 90 }, { type: "added",   w: 90 },
    { type: "same",    w: 75 }, { type: "same",    w: 60 },
    { type: "same",    w: 88 },
  ]
  return (
    <div className="space-y-1">
      {lines.map(({ type, w }, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono w-2.5 shrink-0" style={{ color: type === "removed" ? "#ef4444" : type === "added" ? "#10b981" : "transparent" }}>
            {type === "removed" ? "−" : type === "added" ? "+" : "·"}
          </span>
          <div
            className="h-[5px] rounded-full"
            style={{
              width: `${w}%`,
              background: type === "removed" ? "rgba(239,68,68,0.3)" : type === "added" ? "rgba(16,185,129,0.3)" : "#3f3f46",
            }}
          />
        </div>
      ))}
    </div>
  )
}

function WizardDocLines() {
  const fields = [
    { label: "Party A", done: true },
    { label: "Party B", done: true },
    { label: "Scope of work", done: true },
    { label: "Payment terms", done: false },
  ]
  return (
    <div className="space-y-2">
      {fields.map(({ label, done }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.12, duration: 0.3 }}
          className="flex items-center gap-1.5"
        >
          <div
            className="w-3 h-3 rounded border flex items-center justify-center shrink-0"
            style={{ background: done ? "#10b981" : "transparent", borderColor: done ? "#10b981" : "#3f3f46" }}
          >
            {done && (
              <svg viewBox="0 0 12 12" className="w-1.5 h-1.5" fill="none">
                <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="h-[5px] flex-1 rounded-full" style={{ background: done ? "rgba(16,185,129,0.25)" : "#3f3f46" }} />
          <span className="text-[8px] text-zinc-500 shrink-0">{label}</span>
        </motion.div>
      ))}
    </div>
  )
}

function DocPane({ toolId }: { toolId: ToolId }) {
  const t = TOOLS[toolId]
  return (
    <div className="relative h-full px-3 pt-3 overflow-hidden border-r border-zinc-800">
      <p className="text-[9px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: "#52525b" }}>
        {toolId === 2 ? "Contract Fields" : toolId === 5 ? "Version Diff" : "Document Preview"}
      </p>
      <AnimatePresence mode="wait">
        <motion.div key={toolId} variants={slide} initial="hidden" animate="visible" exit="exit">
          {toolId === 2 ? <WizardDocLines /> :
           toolId === 4 ? <RedactedDocLines /> :
           toolId === 5 ? <DiffDocLines /> :
           <DocLines
             highlighted={[0, 1, 3, 6].includes(toolId)}
             hlColor={
               toolId === 1 ? "rgba(239,68,68,0.25)" :
               toolId === 6 ? "rgba(192,38,211,0.25)" :
               "rgba(245,158,11,0.25)"
             }
           />}
        </motion.div>
      </AnimatePresence>
      {toolId === 0 && (
        <motion.div
          key="scan"
          initial={{ top: "10%" }}
          animate={{ top: "80%" }}
          transition={{ duration: 3.2, ease: "easeInOut" }}
          className="absolute left-0 right-0 pointer-events-none"
          style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.35),transparent)" }}
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none" style={{ background: "linear-gradient(to top, #0a0a0f, transparent)" }} />
    </div>
  )
}

/* ─── Results panes ──────────────────────────────────────────── */

function ResultRow({
  icon: Icon,
  label,
  hex,
  delay = 0,
}: {
  icon: React.ElementType
  label: string
  hex: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.32 }}
      className="flex items-center gap-2 p-1.5 rounded-lg"
      style={{ background: `${hex}18`, border: `1px solid ${hex}30` }}
    >
      <Icon style={{ width: 11, height: 11, color: hex }} className="shrink-0" />
      <span className="text-[10px] font-medium leading-tight" style={{ color: hex }}>{label}</span>
    </motion.div>
  )
}

function ResultsAnalyze() {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">Analysis Summary</p>
      <ResultRow icon={AlertTriangle} label="3 risks flagged"         hex="#f59e0b" delay={0}    />
      <ResultRow icon={Shield}        label="No-notice entry clause"   hex="#ef4444" delay={0.1}  />
      <ResultRow icon={CheckCircle2}  label="2 protections confirmed"  hex="#10b981" delay={0.2}  />
    </div>
  )
}

function ResultsTrustCheck() {
  const flags = ["Requests payment via gift card", "Urgent language + threats", "Unverified sender address"]
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">Trust Verdict</p>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.38 }}
        className="flex items-center gap-2 p-2 rounded-lg"
        style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <ShieldAlert style={{ width: 12, height: 12, color: "#ef4444" }} className="shrink-0" />
        <span className="text-[10px] font-bold" style={{ color: "#ef4444" }}>Scam Detected — Do not pay</span>
      </motion.div>
      <div className="space-y-1.5">
        {flags.map((f, i) => (
          <motion.div key={f} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }}
            className="flex items-start gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[3px]" style={{ background: "#ef4444" }} />
            <span className="text-[9px] text-zinc-400 leading-snug">{f}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ResultsBuild() {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">Contract Ready</p>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.38 }}
        className="p-2 rounded-lg"
        style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <CheckCircle2 style={{ width: 11, height: 11, color: "#10b981" }} />
          <span className="text-[10px] font-bold" style={{ color: "#10b981" }}>Freelance Agreement</span>
        </div>
        <div className="space-y-0.5 ml-4">
          {["6 clauses drafted", "Gap analysis complete", "IP & revisions included"].map((t, i) => (
            <p key={t} className="text-[9px] text-zinc-400">{t}</p>
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex items-center gap-1.5 p-2 rounded-lg"
        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
        <Download style={{ width: 11, height: 11, color: "#3b82f6" }} />
        <span className="text-[10px] font-semibold" style={{ color: "#3b82f6" }}>Download as PDF / Word</span>
      </motion.div>
    </div>
  )
}

function ResultsReview() {
  const clauses = [
    { label: "5-yr global non-compete",    severity: "Unfair",   hex: "#ef4444" },
    { label: "No severance on termination",severity: "Missing",  hex: "#f59e0b" },
  ]
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">Contract Review</p>
      <div className="flex items-center gap-3 p-2 rounded-lg mb-1" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
        <div>
          <p className="text-[9px] text-zinc-500">Fairness score</p>
          <p className="text-[22px] font-black leading-none" style={{ color: "#f59e0b" }}>28</p>
          <p className="text-[9px]" style={{ color: "#f59e0b" }}>/100</p>
        </div>
        <div className="flex-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(245,158,11,0.15)" }}>
            <div className="h-full rounded-full" style={{ width: "28%", background: "#f59e0b" }} />
          </div>
          <p className="text-[9px] text-zinc-500 mt-1">Heavily one-sided</p>
        </div>
      </div>
      {clauses.map(({ label, severity, hex }, i) => (
        <motion.div key={label} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
          className="p-1.5 rounded-lg" style={{ background: `${hex}15`, border: `1px solid ${hex}30` }}>
          <div className="flex items-center gap-1 mb-0.5">
            <AlertTriangle style={{ width: 9, height: 9, color: hex }} />
            <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: hex }}>{severity}</span>
          </div>
          <p className="text-[9px] text-zinc-400 ml-3.5 leading-snug">{label}</p>
        </motion.div>
      ))}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-[9px] font-medium flex items-center gap-1 mt-1" style={{ color: "#3b82f6" }}>
        <Sparkles style={{ width: 9, height: 9 }} /> Negotiation language included
      </motion.p>
    </div>
  )
}

function ResultsRedact() {
  const items = ["SSN — ███-██-████", "Date of Birth — ██/██/████", "Insurance # — ███████████"]
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">Detected Items</p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-1.5 rounded-lg" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
        <span className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>3 PII items auto-detected</span>
      </motion.div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <motion.div key={item} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
            className="flex items-center justify-between gap-2 p-1.5 rounded-lg" style={{ background: "#111118", border: "1px solid #27272a" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-zinc-200 shrink-0" />
              <span className="text-[8px] font-mono text-zinc-400">{item}</span>
            </div>
            <span className="text-[8px] font-semibold shrink-0" style={{ color: "#8b5cf6" }}>Approve</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ResultsCompare() {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">Change Summary</p>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <AlertTriangle style={{ width: 12, height: 12, color: "#ef4444" }} />
        <span className="text-[10px] font-bold" style={{ color: "#ef4444" }}>1 Critical Change Found</span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="p-2 rounded-lg" style={{ background: "#111118", border: "1px solid #27272a" }}>
        <p className="text-[9px] font-semibold text-zinc-400 mb-1">Section 4 — Duration</p>
        <div className="space-y-1">
          <div className="flex items-start gap-1.5 p-1 rounded" style={{ background: "rgba(239,68,68,0.12)" }}>
            <span className="text-[9px] font-bold" style={{ color: "#ef4444" }}>−</span>
            <p className="text-[9px] text-zinc-400 line-through leading-tight">Period: 2 years from execution</p>
          </div>
          <div className="flex items-start gap-1.5 p-1 rounded" style={{ background: "rgba(16,185,129,0.12)" }}>
            <span className="text-[9px] font-bold" style={{ color: "#10b981" }}>+</span>
            <p className="text-[9px] font-semibold leading-tight" style={{ color: "#10b981" }}>Period: Perpetual — no expiration</p>
          </div>
        </div>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="text-[9px] text-zinc-500 leading-snug">
        Confidentiality now has no end date — a significant departure from the original terms.
      </motion.p>
    </div>
  )
}

function ResultsClauseExtractor() {
  const items = [
    { n: 1, party: "Tenant",   text: "Pay $1,850/mo by 1st of month" },
    { n: 2, party: "Tenant",   text: "Provide 60-day notice to vacate" },
    { n: 3, party: "Landlord", text: "Enter only with 24-hr notice" },
  ]
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">Extracted Obligations</p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{ background: "rgba(192,38,211,0.15)", border: "1px solid rgba(192,38,211,0.3)" }}>
        <ListChecks style={{ width: 11, height: 11, color: "#c026d3" }} />
        <span className="text-[10px] font-bold" style={{ color: "#c026d3" }}>6 obligations extracted</span>
      </motion.div>
      <div className="space-y-1.5">
        {items.map(({ n, party, text }, i) => (
          <motion.div key={n} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
            className="flex gap-2">
            <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5"
              style={{ background: "rgba(192,38,211,0.2)", color: "#c026d3", minWidth: 18, height: 18 }}>
              {n}
            </div>
            <div>
              <p className="text-[9px] font-semibold leading-tight" style={{ color: "#c026d3" }}>{party}</p>
              <p className="text-[9px] text-zinc-400 leading-tight">{text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ResultsPane({ toolId }: { toolId: ToolId }) {
  return (
    <div className="h-full px-3 pt-3 overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div key={toolId} variants={slide} initial="hidden" animate="visible" exit="exit">
          {toolId === 0 && <ResultsAnalyze />}
          {toolId === 1 && <ResultsTrustCheck />}
          {toolId === 2 && <ResultsBuild />}
          {toolId === 3 && <ResultsReview />}
          {toolId === 4 && <ResultsRedact />}
          {toolId === 5 && <ResultsCompare />}
          {toolId === 6 && <ResultsClauseExtractor />}
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none" style={{ background: "linear-gradient(to top,#0a0a0f,transparent)" }} />
    </div>
  )
}

/* ─── Main export ────────────────────────────────────────────── */
type Props = {
  activeTool?: number
  onToolChange?: (id: number) => void
}

export function WebAppDemo({ activeTool, onToolChange }: Props = {}) {
  const isControlled = activeTool !== undefined
  const [internalTool, setInternalTool] = useState<ToolId>(0)
  const shouldReduce = useReducedMotion()
  const tool: ToolId = isControlled ? (activeTool as ToolId) : internalTool

  useEffect(() => {
    if (isControlled) return
    if (shouldReduce) return
    const id = setInterval(() => setInternalTool(t => ((t + 1) % 7) as ToolId), TOOL_MS)
    return () => clearInterval(id)
  }, [isControlled, shouldReduce])

  function handleSelect(id: ToolId) {
    if (onToolChange) onToolChange(id)
    else setInternalTool(id)
  }

  return (
    <div
      className="w-full h-full min-h-[360px] flex flex-col select-none overflow-hidden rounded-2xl"
      style={{ background: "#0a0a0f" }}
      aria-hidden="true"
    >
      <MiniNav active={tool} onSelect={handleSelect} />
      <DocHeader toolId={tool} />

      {/* Two-column content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="w-[42%]">
          <DocPane toolId={tool} />
        </div>
        <div className="flex-1">
          <ResultsPane toolId={tool} />
        </div>
      </div>
    </div>
  )
}
