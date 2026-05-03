/* ─────────────────────────────────────────────────────────────
   VideoWalkthrough.tsx
   
   Animated workflow demo cycling all 9 live PlainPath tools.
   Each tool shows: document loaded → processing → findings.
   Auto-advances every INTERVAL_MS. Clicking a chapter card
   jumps immediately to that tool.
   Respects prefers-reduced-motion.
   ───────────────────────────────────────────────────────────── */
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  FileText, Scale,
  AlertTriangle, CheckCircle2, Sparkles,
} from "lucide-react"

const INTERVAL_MS = 5200

/* ─── Tool configuration ──────────────────────────────────── */
const TOOLS = [
  {
    id: 0,
    name: "Analyze a Document",
    shortName: "Analyze",
    desc: "Deadlines, risks, and action steps — fast.",
    icon: FileText,
    hex: "#3b82f6",
    iconHex: "#93c5fd",
    docName: "Lease_Agreement_Unit4B.pdf",
    docMeta: "847 words · 12 pages",
    badgeLabel: "3 issues",
    badgeText: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.12)",
    badgeBorder: "rgba(245,158,11,0.3)",
  },
  {
    id: 1,
    name: "Contract Review",
    shortName: "Review",
    desc: "Clause-by-clause flags plus negotiation language.",
    icon: Scale,
    hex: "#f59e0b",
    iconHex: "#fcd34d",
    docName: "Employment_Offer_Letter.pdf",
    docMeta: "1,240 words · 8 pages",
    badgeLabel: "2 clauses",
    badgeText: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.12)",
    badgeBorder: "rgba(245,158,11,0.3)",
  },
] as const

type ToolId = 0 | 1

/* ─── Document line configs ───────────────────────────────── */
type LineConfig = { w: number; hl?: string; redacted?: boolean; delay: number }

const DOC_LINES: Record<number, LineConfig[]> = {
  0: [
    { w: 100, delay: 0 },
    { w: 85,  delay: 0.04 },
    { w: 100, delay: 0.08 },
    { w: 90,  delay: 0.10, hl: "rgba(245,158,11,0.52)" },
    { w: 72,  delay: 0.13, hl: "rgba(245,158,11,0.52)" },
    { w: 100, delay: 0.18 },
    { w: 80,  delay: 0.22 },
    { w: 100, delay: 0.26, hl: "rgba(239,68,68,0.42)" },
    { w: 65,  delay: 0.30 },
    { w: 100, delay: 0.34 },
    { w: 88,  delay: 0.38 },
  ],
  1: [
    { w: 100, delay: 0 },
    { w: 90,  delay: 0.04 },
    { w: 100, delay: 0.08 },
    { w: 88,  delay: 0.11, hl: "rgba(239,68,68,0.42)" },
    { w: 70,  delay: 0.14, hl: "rgba(239,68,68,0.42)" },
    { w: 100, delay: 0.20 },
    { w: 85,  delay: 0.24 },
    { w: 100, delay: 0.28, hl: "rgba(245,158,11,0.42)" },
    { w: 60,  delay: 0.32, hl: "rgba(245,158,11,0.42)" },
    { w: 100, delay: 0.37 },
  ],
}

/* ─── Left panel: document lines ─────────────────────────── */
function DocLines({ toolId, reduced }: { toolId: ToolId; reduced: boolean }) {
  const lines = DOC_LINES[toolId] ?? []

  return (
    <div className="space-y-1.5">
      <p className="text-[8px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#475569" }}>
        Document Preview
      </p>
      {lines.map((line, i) => {
        if (line.redacted) {
          return (
            <motion.div
              key={i}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduced ? 0 : line.delay, duration: 0.25 }}
              className="h-[5px] rounded-sm"
              style={{ width: `${line.w}%`, backgroundColor: "#cbd5e1" }}
            />
          )
        }
        if (line.hl) {
          return (
            <motion.div
              key={i}
              initial={reduced ? false : { backgroundColor: "rgba(71,85,105,0.5)" }}
              animate={{ backgroundColor: line.hl }}
              transition={{ delay: reduced ? 0 : 0.65 + line.delay, duration: 0.55, ease: "easeOut" }}
              className="h-[5px] rounded-full"
              style={{ width: `${line.w}%` }}
            />
          )
        }
        return (
          <motion.div
            key={i}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduced ? 0 : line.delay, duration: 0.18 }}
            className="h-[5px] rounded-full"
            style={{ width: `${line.w}%`, backgroundColor: "rgba(71,85,105,0.55)" }}
          />
        )
      })}
    </div>
  )
}

/* ─── Scan line (Analyze only) ──────────────────────────── */
function ScanLine({ reduced }: { reduced: boolean }) {
  if (reduced) return null
  return (
    <motion.div
      initial={{ top: "10%", opacity: 0 }}
      animate={{ top: "88%", opacity: [0, 0.75, 0.75, 0] }}
      transition={{ delay: 0.45, duration: 1.7, ease: "easeInOut" }}
      className="absolute left-0 right-0 pointer-events-none"
      style={{ position: "absolute" }}
    >
      <div className="h-px" style={{ background: "linear-gradient(to right, transparent, rgba(239,68,68,0.7), transparent)" }} />
      <div className="h-4" style={{ background: "linear-gradient(to bottom, rgba(239,68,68,0.12), transparent)" }} />
    </motion.div>
  )
}

/* ─── Right panel outputs ────────────────────────────────── */
function AnalyzeOutput({ reduced }: { reduced: boolean }) {
  const items = [
    { icon: AlertTriangle, label: "Response deadline", value: "14 days — by April 22nd",     hex: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
    { icon: AlertTriangle, label: "Risk if ignored",   value: "Automatic renewal — silent",   hex: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)" },
    { icon: CheckCircle2,  label: "Required step",     value: "Sign and return addendum",      hex: "#10b981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)" },
  ]
  return (
    <div className="space-y-1.5">
      <p className="text-[8px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#475569" }}>Analysis</p>
      {items.map(({ icon: Icon, label, value, hex, bg, border }, i) => (
        <motion.div
          key={label}
          initial={reduced ? false : { opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: reduced ? 0 : 1.05 + i * 0.2, duration: 0.35 }}
          className="rounded-lg border p-2"
          style={{ backgroundColor: bg, borderColor: border }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon style={{ width: 9, height: 9, color: hex }} className="shrink-0" />
            <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: hex }}>{label}</span>
          </div>
          <p className="text-[8px] leading-snug ml-[17px]" style={{ color: "#94a3b8" }}>{value}</p>
        </motion.div>
      ))}
    </div>
  )
}

function ReviewOutput({ reduced }: { reduced: boolean }) {
  const clauses = [
    { label: "5-yr global non-compete", severity: "Unfair",  hex: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.26)" },
    { label: "No severance on termination", severity: "Missing", hex: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.26)" },
  ]
  return (
    <div className="space-y-1.5">
      <p className="text-[8px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#475569" }}>Clause Review</p>
      {clauses.map(({ label, severity, hex, bg, border }, i) => (
        <motion.div
          key={label}
          initial={reduced ? false : { opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: reduced ? 0 : 0.95 + i * 0.28, duration: 0.35 }}
          className="rounded-lg border p-2"
          style={{ backgroundColor: bg, borderColor: border }}
        >
          <div className="flex items-center gap-1 mb-0.5">
            <AlertTriangle style={{ width: 9, height: 9, color: hex }} className="shrink-0" />
            <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: hex }}>{severity}</span>
          </div>
          <p className="text-[8px] leading-snug ml-[17px]" style={{ color: "#94a3b8" }}>{label}</p>
        </motion.div>
      ))}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 1.55, duration: 0.35 }}
        className="flex items-center gap-1.5 pt-0.5"
      >
        <Sparkles style={{ width: 9, height: 9, color: "#fbbf24" }} />
        <span className="text-[8px] font-medium" style={{ color: "#fbbf24" }}>Negotiation language included</span>
      </motion.div>
    </div>
  )
}

function ToolOutput({ toolId, reduced }: { toolId: ToolId; reduced: boolean }) {
  if (toolId === 0) return <AnalyzeOutput reduced={reduced} />
  return <ReviewOutput reduced={reduced} />
}

/* ─── Processing view (brief scan state on tool switch) ───── */
const PROCESSING_LABELS: Record<number, string> = {
  0: "Extracting action items…",
  1: "Flagging risk clauses…",
}

function ProcessingView({ tool }: { tool: typeof TOOLS[number] }) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <p className="text-[8px] font-semibold tracking-widest uppercase mb-1" style={{ color: "#475569" }}>
        Processing
      </p>
      {[65, 80, 50, 72, 42].map((w, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.25, 0.65, 0.25] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
          className="h-[5px] rounded-full"
          style={{ width: `${w}%`, backgroundColor: `${tool.hex}55` }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="flex items-center gap-1.5 mt-1"
      >
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: tool.hex }}
        />
        <span className="text-[8px] font-medium" style={{ color: tool.iconHex }}>
          {PROCESSING_LABELS[tool.id] ?? "Processing…"}
        </span>
      </motion.div>
    </div>
  )
}

/* ─── Mini nav bar ───────────────────────────────────────── */
function MiniNav({ active }: { active: ToolId }) {
  const activeTool = TOOLS[active]
  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1.5 border-b shrink-0"
      style={{ backgroundColor: "#0b1121", borderColor: "#1e2d45" }}
    >
      <div className="flex items-center gap-1 mr-1.5 shrink-0">
        <div
          className="w-4 h-4 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${activeTool.hex}22` }}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" className="w-2.5 h-2.5" stroke={activeTool.hex}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-[9px] font-bold whitespace-nowrap" style={{ color: "#e2e8f0" }}>PlainPath</span>
      </div>
      <div className="flex items-center gap-0.5 overflow-hidden flex-1">
        {TOOLS.map((t) => (
          <span
            key={t.id}
            className="text-[8px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap transition-colors duration-300"
            style={{
              backgroundColor: active === t.id ? `${t.hex}22` : "transparent",
              color: active === t.id ? t.iconHex : "#475569",
            }}
          >
            {t.shortName}
          </span>
        ))}
      </div>
      <div className="w-4 h-4 rounded-full shrink-0 ml-1" style={{ backgroundColor: "#1e293b" }} />
    </div>
  )
}

/* ─── Document header ────────────────────────────────────── */
function DocHeader({ toolId }: { toolId: ToolId }) {
  const tool = TOOLS[toolId]
  const Icon = tool.icon
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
      style={{ backgroundColor: "#0d1526", borderColor: "#1e2d45" }}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${tool.hex}20` }}
      >
        <Icon style={{ width: 12, height: 12, color: tool.iconHex }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold truncate leading-tight" style={{ color: "#e2e8f0" }}>{tool.docName}</p>
        <p className="text-[8px] leading-tight" style={{ color: "#475569" }}>{tool.docMeta}</p>
      </div>
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-full border shrink-0"
        style={{ backgroundColor: tool.badgeBg, borderColor: tool.badgeBorder }}
      >
        <motion.div
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="w-1 h-1 rounded-full shrink-0"
          style={{ backgroundColor: tool.badgeText }}
        />
        <span className="text-[8px] font-semibold whitespace-nowrap" style={{ color: tool.badgeText }}>
          {tool.badgeLabel}
        </span>
      </div>
    </div>
  )
}

/* ─── Full demo panel ────────────────────────────────────── */
function DemoPanel({ toolId, isProcessing, reduced }: { toolId: ToolId; isProcessing: boolean; reduced: boolean }) {
  const tool = TOOLS[toolId]
  return (
    <div
      className="rounded-2xl overflow-hidden ring-1 ring-white/8 flex flex-col"
      style={{
        aspectRatio: "16 / 10",
        backgroundColor: "#0b1120",
        boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
      aria-hidden="true"
    >
      {/* Nav bar */}
      <MiniNav active={toolId} />

      {/* Doc header */}
      <DocHeader toolId={toolId} />

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: document preview */}
        <div
          className="relative flex-1 px-3 pt-3 overflow-hidden border-r"
          style={{ borderColor: "#1e2d45", backgroundColor: "#060d1a" }}
        >
          <DocLines toolId={toolId} reduced={reduced} />
          {toolId === 0 && <ScanLine reduced={reduced} />}
          {/* Scan overlay when processing */}
          {isProcessing && !reduced && (
            <motion.div
              initial={{ top: "8%", opacity: 0 }}
              animate={{ top: "90%", opacity: [0, 0.6, 0.6, 0] }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute left-0 right-0 pointer-events-none"
              style={{ position: "absolute" }}
            >
              <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${tool.hex}99, transparent)` }} />
              <div className="h-3" style={{ background: `linear-gradient(to bottom, ${tool.hex}18, transparent)` }} />
            </motion.div>
          )}
          <div
            className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
            style={{ background: "linear-gradient(to top, #060d1a, transparent)" }}
          />
        </div>

        {/* Right: tool output — shows processing state briefly on switch */}
        <div
          className="relative flex-1 px-3 pt-3 overflow-hidden"
          style={{ backgroundColor: "#0b1120" }}
        >
          <AnimatePresence mode="wait">
            {isProcessing && !reduced ? (
              <motion.div
                key={`proc-${toolId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <ProcessingView tool={tool} />
              </motion.div>
            ) : (
              <motion.div
                key={`out-${toolId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ToolOutput toolId={toolId} reduced={reduced} />
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
            style={{ background: "linear-gradient(to top, #0b1120, transparent)" }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Progress bar (resets on toolId change via key) ─────── */
function ProgressBar({ toolId, reduced }: { toolId: ToolId; reduced: boolean }) {
  if (reduced) return null
  const tool = TOOLS[toolId]
  return (
    <div className="h-0.5 rounded-full mt-3 overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
      <motion.div
        key={toolId}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: INTERVAL_MS / 1000, ease: "linear" }}
        className="h-full rounded-full"
        style={{ backgroundColor: tool.hex }}
      />
    </div>
  )
}

/* ─── Chapter cards (tool selectors) ─────────────────────── */
function ChapterCards({
  active,
  onSelect,
  reduced,
}: {
  active: ToolId
  onSelect: (id: ToolId) => void
  reduced: boolean
}) {
  return (
    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
      {TOOLS.map((t) => {
        const Icon = t.icon
        const isActive = active === t.id
        return (
          <motion.button
            key={t.id}
            onClick={() => onSelect(t.id as ToolId)}
            whileHover={reduced ? {} : { y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="relative text-left px-3 py-3 rounded-xl border transition-all duration-200 focus-visible:outline-none overflow-hidden"
            style={{
              borderColor: isActive ? t.hex : `${t.hex}28`,
              backgroundColor: isActive ? `${t.hex}14` : `${t.hex}07`,
              boxShadow: isActive
                ? `0 0 0 1px ${t.hex}38, 0 6px 28px ${t.hex}18`
                : "none",
            }}
          >
            {/* Tool icon + name row */}
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: isActive ? `${t.hex}28` : `${t.hex}14` }}
              >
                <Icon style={{ width: 12, height: 12, color: isActive ? t.iconHex : `${t.iconHex}55` }} />
              </div>
              <p
                className="text-xs font-bold leading-tight flex-1 min-w-0"
                style={{ color: isActive ? "#f1f5f9" : "#64748b" }}
              >
                {t.shortName}
              </p>
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: t.hex }}
                />
              )}
            </div>

            {/* Description */}
            <p
              className="text-[10px] leading-snug line-clamp-2"
              style={{ color: isActive ? "#94a3b8" : "#64748b" }}
            >
              {t.desc}
            </p>

            {/* Active tool bottom accent bar */}
            {isActive && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: t.hex, opacity: 0.7 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

/* ─── Main export ────────────────────────────────────────── */
type VideoWalkthroughProps = {
  activeTool?: number
  onToolChange?: (id: number) => void
}

export default function VideoWalkthrough({ activeTool, onToolChange }: VideoWalkthroughProps = {}) {
  const isControlled = activeTool !== undefined
  const [internalActive, setInternalActive] = useState<ToolId>(0)
  const active: ToolId = isControlled
    ? (Math.min(activeTool, TOOLS.length - 1) as ToolId)
    : internalActive
  const [isProcessing, setIsProcessing] = useState(false)
  const reduced = useReducedMotion() ?? false
  const isFirstRender = useRef(true)
  const prevActive = useRef<ToolId>(active)

  /* Auto-advance — only when uncontrolled */
  useEffect(() => {
    if (isControlled) return
    if (reduced) return
    const id = setInterval(() => {
      setInternalActive((prev) => ((prev + 1) % TOOLS.length) as ToolId)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [reduced, isControlled])

  /* Processing flash on every tool change */
  useEffect(() => {
    if (prevActive.current === active) return
    prevActive.current = active
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (reduced) return
    setIsProcessing(true)
    const t = setTimeout(() => setIsProcessing(false), 760)
    return () => clearTimeout(t)
  }, [active, reduced])

  function handleSelect(id: ToolId) {
    if (onToolChange) onToolChange(id)
    else setInternalActive(id)
  }

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 mb-5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">2 tools · live demo</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold mb-4 text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          See PlainPath in action
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed"
        >
          Each tool cycles through a real workflow. Click any card below to explore that tool.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="max-w-5xl mx-auto"
      >
        {/* Animated demo panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={reduced ? false : { opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? {} : { opacity: 0, x: 10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <DemoPanel toolId={active} isProcessing={isProcessing} reduced={reduced} />
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <ProgressBar toolId={active} reduced={reduced} />

        {/* Chapter / tool selector cards */}
        <ChapterCards active={active} onSelect={handleSelect} reduced={reduced} />
      </motion.div>
    </div>
  )
}
