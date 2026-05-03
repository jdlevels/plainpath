/**
 * WebAppDemo — 9-tool live workspace demo
 *
 * Controlled mode: pass activeTool (0–7) + onToolChange from Home.tsx's
 * shared demo rotation state so all surfaces stay in sync.
 * Uncontrolled mode: self-rotates through all 9 tools every 3 500 ms.
 *
 * Dark-themed — designed to sit inside the dark "One platform" section.
 */

import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  AlertTriangle, CheckCircle2, Shield, Scale,
  FileText, Sparkles,
} from "lucide-react"

const TOOL_MS = 3500

const slide = {
  hidden:  { opacity: 0, y: 8  },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.26 } },
}

/* ─── Tool config ────────────────────────────────────────────── */
const TOOLS = [
  { id: 0, shortName: "Analyze", icon: FileText, hex: "#3b82f6", iconHex: "#93c5fd", docName: "Lease Agreement — Unit 4B.pdf",  docMeta: "847 words · 12 pages",  badge: { label: "3 issues",      dot: "#f59e0b" } },
  { id: 1, shortName: "Review",  icon: Scale,    hex: "#f59e0b", iconHex: "#fcd34d", docName: "Employment Agreement.pdf",       docMeta: "1,240 words · 8 pages", badge: { label: "4 clauses flagged", dot: "#f59e0b" } },
] as const

type ToolId = 0|1

/* ─── App nav bar ────────────────────────────────────────────── */
function MiniNav({
  active,
  onSelect,
}: {
  active: ToolId
  onSelect: (id: ToolId) => void
}) {
  const safeActive: ToolId = (Math.min(active, TOOLS.length - 1) as ToolId)
  const tool = TOOLS[safeActive]
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
        const isActive = t.id === safeActive
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

function DocPane({ toolId }: { toolId: ToolId }) {
  return (
    <div className="relative h-full px-3 pt-3 overflow-hidden border-r border-zinc-800">
      <p className="text-[9px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: "#52525b" }}>
        Document Preview
      </p>
      <AnimatePresence mode="wait">
        <motion.div key={toolId} variants={slide} initial="hidden" animate="visible" exit="exit">
          <DocLines highlighted hlColor="rgba(245,158,11,0.25)" />
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
          <p className="text-[9px] text-zinc-500">Risk level</p>
          <p className="text-[14px] font-black leading-none" style={{ color: "#f59e0b" }}>High</p>
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

function ResultsPane({ toolId }: { toolId: ToolId }) {
  return (
    <div className="h-full px-3 pt-3 overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div key={toolId} variants={slide} initial="hidden" animate="visible" exit="exit">
          {toolId === 0 && <ResultsAnalyze />}
          {toolId === 1 && <ResultsReview />}
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
  const tool: ToolId = isControlled
    ? (Math.min(activeTool, TOOLS.length - 1) as ToolId)
    : internalTool

  useEffect(() => {
    if (isControlled) return
    if (shouldReduce) return
    const id = setInterval(() => setInternalTool(t => ((t + 1) % TOOLS.length) as ToolId), TOOL_MS)
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
