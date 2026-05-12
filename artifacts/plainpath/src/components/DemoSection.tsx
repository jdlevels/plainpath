import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload, Loader2, CheckCircle2, Clock,
  FileText, Calendar, Flag,
  ArrowRight, BookOpen, TriangleAlert,
  CircleCheck, MessageSquare,
  Scale, Copy,
} from "lucide-react"
import { useLocation } from "wouter"

/* ─────────────────────────────────────────────────────────────
   TOOL DEFINITIONS
───────────────────────────────────────────────────────────── */
const TOOLS = [
  {
    id: "analyze",
    icon: BookOpen,
    label: "Analyze a Document",
    tagline: "Upload any document, get a full action plan",
    url: "plainpathapp.com/app/analyze",
    frames: 3,
    cta: { label: "Start a Document Plan", path: "/analyze" },
    description: "Upload any notice, contract, or government form. PlainPath reads every clause and returns prioritized action steps, deadlines, and risks — in plain English.",
  },
  {
    id: "review",
    icon: Scale,
    label: "Contract Review",
    tagline: "Review a contract before you sign",
    url: "plainpathapp.com/app/review",
    frames: 3,
    cta: { label: "Review a Contract", path: "/contract-review" },
    description: "Someone handed you a contract. Paste it in and get a clause-by-clause review: unfair terms flagged, missing protections identified, and negotiation language ready to send back.",
  },
]

const FRAME_DURATION = 3000

/* ─────────────────────────────────────────────────────────────
   ANALYZE FRAMES
───────────────────────────────────────────────────────────── */
function AnalyzeUploadFrame() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/60 px-6 py-8 flex flex-col items-center gap-3 text-center"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Drop your document here</p>
          <p className="text-slate-400 text-xs mt-0.5">PDF, Word, or paste text</p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center mt-1">
          {["Eviction Notice", "Lease", "Court Summons"].map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 text-[11px] font-medium">{t}</span>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">eviction_notice_apr2026.pdf</p>
          <p className="text-slate-400 text-[11px]">124 KB · ready</p>
        </div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: "spring" }}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        </motion.div>
      </motion.div>
    </div>
  )
}

function AnalyzeLoadingFrame() {
  const stages = ["Reading document structure…", "Extracting deadlines…", "Flagging risks…", "Building your action plan…"]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % stages.length), 650)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-slate-800/70 border border-slate-700/50 rounded-2xl px-6 py-7 flex flex-col items-center gap-4 text-center"
      >
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="relative w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        </div>
        <div>
          <p className="text-white font-bold text-sm mb-1">Analyzing your document</p>
          <AnimatePresence mode="wait">
            <motion.p key={idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-slate-400 text-xs">
              {stages[idx]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" initial={{ width: "8%" }} animate={{ width: `${Math.min(100, ((idx + 1) / stages.length) * 100 + 8)}%` }} transition={{ duration: 0.5 }} />
        </div>
      </motion.div>
    </div>
  )
}

const ANALYZE_ITEMS = [
  { priority: "high",   icon: Clock,      label: "Submit response within 14 days",        tag: "Deadline" },
  { priority: "high",   icon: FileText,   label: "Attach proof of insurance (Form A-12)", tag: "Required" },
  { priority: "medium", icon: Flag,       label: "Clause 7.3 transfers liability to you", tag: "Risk"     },
  { priority: "low",    icon: Calendar,   label: "Renewal window opens in 90 days",       tag: "Date"     },
]

function AnalyzeResultsFrame() {
  return (
    <div className="flex flex-col h-full gap-2.5 select-none overflow-hidden">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-white font-bold text-sm">Eviction Notice · Action Plan</p>
          <p className="text-slate-400 text-xs">4 items · 1 urgent deadline</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold">Act now</span>
      </motion.div>
      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        {ANALYZE_ITEMS.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.09 }}
            className={["flex items-center gap-2.5 rounded-xl px-3 py-2.5 border", item.priority === "high" ? "bg-red-500/8 border-red-500/20" : item.priority === "medium" ? "bg-amber-500/8 border-amber-500/20" : "bg-slate-800/60 border-slate-700/40"].join(" ")}>
            <div className={["w-6 h-6 rounded-lg flex items-center justify-center shrink-0", item.priority === "high" ? "bg-red-500/15" : item.priority === "medium" ? "bg-amber-500/15" : "bg-slate-700/60"].join(" ")}>
              <item.icon className={["w-3 h-3", item.priority === "high" ? "text-red-400" : item.priority === "medium" ? "text-amber-400" : "text-slate-400"].join(" ")} />
            </div>
            <p className="text-white text-xs font-medium leading-snug flex-1">{item.label}</p>
            <span className={["text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", item.priority === "high" ? "bg-red-500/15 text-red-400" : item.priority === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-slate-700 text-slate-400"].join(" ")}>{item.tag}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


/* ─────────────────────────────────────────────────────────────
   CONTRACT REVIEW FRAMES
───────────────────────────────────────────────────────────── */
const REVIEW_TEXT_LINES = [
  "The Company retains sole right to terminate this",
  "Agreement without notice or cause. Contractor waives",
  "all claims for compensation upon early termination.",
  "",
  "Non-compete applies for 5 years globally with no",
  "geographic limitation. All IP created belongs to",
  "Company in perpetuity regardless of payment status.",
]

function ContractReviewInputFrame() {
  return (
    <div className="flex flex-col h-full gap-3 select-none">
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl px-4 py-3 flex-1">
        <p className="text-slate-500 text-[11px] font-medium mb-2 uppercase tracking-wide">Paste the contract you received</p>
        {REVIEW_TEXT_LINES.map((line, i) => (
          <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
            className="text-slate-300 text-xs leading-relaxed font-mono">{line || <span>&nbsp;</span>}</motion.p>
        ))}
      </div>
      <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-white text-xs font-semibold flex items-center justify-center gap-2">
        <Scale className="w-3.5 h-3.5" /> Review This Contract
      </motion.button>
    </div>
  )
}

function ContractReviewScanFrame() {
  const checks = ["Reading every clause…", "Identifying concerns…", "Checking fairness balance…", "Finding missing protections…"]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % checks.length), 620)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-amber-500/15 animate-ping" />
        <div className="relative w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center">
          <Scale className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-sm mb-1">Reviewing your contract</p>
        <AnimatePresence mode="wait">
          <motion.p key={idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-slate-400 text-xs">{checks[idx]}</motion.p>
        </AnimatePresence>
      </div>
      <div className="w-full space-y-2">
        {checks.map((_, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: i <= idx ? 1 : 0.2 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-2">
            {i < idx ? <CircleCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : i === idx ? <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />}
            <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <motion.div className={i <= idx ? "h-full rounded-full bg-amber-500" : "h-full rounded-full bg-slate-700"} initial={{ width: 0 }} animate={{ width: i < idx ? "100%" : i === idx ? "60%" : "0%" }} transition={{ duration: 0.5 }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const REVIEW_FLAGS = [
  { icon: TriangleAlert, color: "red",   label: "Termination without notice — no severance protection" },
  { icon: TriangleAlert, color: "red",   label: "5-year global non-compete — likely unenforceable but still risky" },
  { icon: Copy,          color: "amber", label: "IP clause transfers rights regardless of payment status" },
]

function ContractReviewResultsFrame() {
  return (
    <div className="flex flex-col h-full gap-3 select-none overflow-hidden">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
          <span className="text-red-400 font-black text-lg">28</span>
        </div>
        <div>
          <p className="text-red-400 font-bold text-sm">Several Clauses Need Revision</p>
          <p className="text-slate-400 text-xs">Score 28/100 · Review carefully before signing</p>
        </div>
        <Scale className="w-5 h-5 text-red-400 ml-auto shrink-0" />
      </motion.div>
      <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide shrink-0">Concerns found</p>
      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        {REVIEW_FLAGS.map((flag, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className={["flex items-start gap-2.5 rounded-xl px-3 py-2.5 border", flag.color === "red" ? "bg-red-500/8 border-red-500/20" : "bg-amber-500/8 border-amber-500/20"].join(" ")}>
            <flag.icon className={["w-3.5 h-3.5 mt-0.5 shrink-0", flag.color === "red" ? "text-red-400" : "text-amber-400"].join(" ")} />
            <p className="text-white text-xs leading-snug">{flag.label}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="shrink-0 bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5">
        <p className="text-slate-300 text-[11px] leading-relaxed">
          <span className="text-amber-400 font-semibold flex items-center gap-1 mb-0.5"><MessageSquare className="w-3 h-3" /> Negotiation language ready to copy</span>
          "We request the termination clause include 30 days written notice and appropriate severance."
        </p>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   FRAME RENDERER
───────────────────────────────────────────────────────────── */
function FrameContent({ toolId, frame }: { toolId: string; frame: number }) {
  if (toolId === "analyze") {
    if (frame === 0) return <AnalyzeUploadFrame />
    if (frame === 1) return <AnalyzeLoadingFrame />
    return <AnalyzeResultsFrame />
  }
  if (frame === 0) return <ContractReviewInputFrame />
  if (frame === 1) return <ContractReviewScanFrame />
  return <ContractReviewResultsFrame />
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function DemoSection() {
  const [activeTool, setActiveTool] = useState(0)
  const [activeFrame, setActiveFrame] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, setLocation] = useLocation()
  const tool = TOOLS[activeTool]

  function scheduleNext() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setActiveFrame((f) => {
        const next = (f + 1) % tool.frames
        return next
      })
    }, FRAME_DURATION)
  }

  useEffect(() => {
    if (!paused) scheduleNext()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [activeFrame, activeTool, paused])

  function selectTool(idx: number) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setActiveTool(idx)
    setActiveFrame(0)
    setPaused(false)
  }

  function selectFrame(idx: number) {
    setActiveFrame(idx)
    setPaused(true)
  }

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="text-center mb-10">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          See it in action
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold mb-3">
          Watch each tool work
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.1 }} className="text-muted-foreground text-lg max-w-xl mx-auto">
          Select either tool to see how it processes a real document scenario — from input to result.
        </motion.p>
      </div>

      <div className="rounded-3xl bg-slate-950 dark:bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-primary/6 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* ── Left: tool selector + description ── */}
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest mb-4">Choose a tool</p>
              <div className="flex flex-col gap-2">
                {TOOLS.map((t, idx) => {
                  const Icon = t.icon
                  const isActive = activeTool === idx
                  const palette: Record<string, { border: string; bg: string; iconBg: string; iconColor: string; taglineColor: string }> = {
                    analyze: { border: "#3b82f6", bg: "rgba(59,130,246,0.13)",  iconBg: "rgba(59,130,246,0.18)",  iconColor: "#60a5fa", taglineColor: "#93c5fd" },
                    review:  { border: "#f59e0b", bg: "rgba(245,158,11,0.13)",  iconBg: "rgba(245,158,11,0.18)",  iconColor: "#fbbf24", taglineColor: "#fcd34d" },
                  }
                  const p = palette[t.id]
                  return (
                    <button
                      key={t.id}
                      onClick={() => selectTool(idx)}
                      style={{
                        borderColor: isActive ? p.border : `${p.border}55`,
                        backgroundColor: isActive ? p.bg : "rgba(255,255,255,0.03)",
                      }}
                      className="text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3"
                    >
                      <div style={{ backgroundColor: isActive ? p.iconBg : `${p.border}22` }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                        <Icon style={{ width: 16, height: 16, color: isActive ? p.iconColor : `${p.iconColor}99` }} />
                      </div>
                      <div>
                        <p style={{ color: isActive ? "#ffffff" : "#94a3b8" }} className="text-sm font-semibold">{t.label}</p>
                        {isActive && <p style={{ color: p.taglineColor }} className="text-[11px] mt-0.5">{t.tagline}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-white/6 pt-6">
              <p className="text-slate-300 text-sm leading-relaxed mb-5">{tool.description}</p>
              <button
                onClick={() => setLocation(tool.cta.path)}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {tool.cta.label} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Right: animated frame preview ── */}
          <div className="relative bg-slate-900/60 border-l border-white/6 px-8 py-12 sm:px-12 lg:py-16 flex flex-col">
            {/* Browser chrome */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-1 flex flex-col">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800/80 border-b border-white/8 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                <div className="ml-3 flex-1 bg-slate-700/60 rounded-md px-3 py-1">
                  <p className="text-slate-500 text-[10px] font-mono truncate">{tool.url}</p>
                </div>
              </div>

              <div className="flex-1 bg-[#0d1117] p-5 min-h-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeTool}-${activeFrame}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <FrameContent toolId={tool.id} frame={activeFrame} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Frame dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: tool.frames }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => selectFrame(i)}
                  className={[
                    "rounded-full transition-all",
                    activeFrame === i ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-slate-700 hover:bg-slate-500",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
