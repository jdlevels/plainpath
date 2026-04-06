import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload, Loader2, CheckCircle2, AlertTriangle, Clock,
  FileText, ChevronRight, ShieldCheck, Calendar, Flag,
  ArrowRight, PenLine, BookOpen, XCircle, TriangleAlert,
  CircleCheck, Download, User, DollarSign, Gavel, MessageSquare,
  ScanLine, BadgeCheck,
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
    url: "plain-path.replit.app/import",
    frames: 3,
    cta: { label: "Try it free", path: "/import" },
    description: "Upload any notice, contract, or government form. PlainPath reads every clause and returns prioritized action steps, deadlines, and risks — in plain English.",
  },
  {
    id: "trust",
    icon: ShieldCheck,
    label: "Document Trust Check",
    tagline: "Know if a document is real before you act",
    url: "plain-path.replit.app/trust-check",
    frames: 3,
    cta: { label: "Run a Trust Check", path: "/trust-check" },
    description: "Paste any document that made you uneasy — a payment demand, prize notice, or official-looking letter. Get an authenticity score and red flags explained.",
  },
  {
    id: "contract",
    icon: PenLine,
    label: "Build a Contract",
    tagline: "Answer 5 questions, get a real contract",
    url: "plain-path.replit.app/contract-builder",
    frames: 3,
    cta: { label: "Build a Contract", path: "/contract-builder" },
    description: "Answer a few plain-English questions about your deal. PlainPath drafts a complete, clause-by-clause contract with gap analysis — ready to download.",
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
   TRUST CHECK FRAMES
───────────────────────────────────────────────────────────── */
function TrustInputFrame() {
  const lines = [
    "URGENT: Your account has been flagged for suspicious",
    "activity. You must pay $892 within 48 hours to avoid",
    "legal action. Send payment to the following address…",
    "",
    "Failure to comply will result in immediate prosecution.",
    "Reference: CASE-2026-00482 · IRS Compliance Division",
  ]
  return (
    <div className="flex flex-col h-full gap-3 select-none">
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl px-4 py-3 flex-1">
        <p className="text-slate-500 text-[11px] font-medium mb-2 uppercase tracking-wide">Paste suspicious document</p>
        {lines.map((line, i) => (
          <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}
            className="text-slate-300 text-xs leading-relaxed font-mono">{line || <span>&nbsp;</span>}</motion.p>
        ))}
      </div>
      <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-white text-xs font-semibold flex items-center justify-center gap-2">
        <ScanLine className="w-3.5 h-3.5" /> Run Trust Check
      </motion.button>
    </div>
  )
}

function TrustScanFrame() {
  const checks = ["Checking sender legitimacy…", "Scanning for pressure language…", "Verifying agency identity…", "Cross-referencing known scam patterns…"]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % checks.length), 620)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-violet-500/15 animate-ping" />
        <div className="relative w-14 h-14 rounded-full bg-violet-500/15 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-violet-400 animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-sm mb-1">Running Trust Check</p>
        <AnimatePresence mode="wait">
          <motion.p key={idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-slate-400 text-xs">{checks[idx]}</motion.p>
        </AnimatePresence>
      </div>
      <div className="w-full space-y-2">
        {checks.map((_, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: i <= idx ? 1 : 0.2 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-2">
            {i < idx ? <CircleCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : i === idx ? <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />}
            <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <motion.div className={i <= idx ? "h-full rounded-full bg-violet-500" : "h-full rounded-full bg-slate-700"} initial={{ width: 0 }} animate={{ width: i < idx ? "100%" : i === idx ? "60%" : "0%" }} transition={{ duration: 0.5 }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const TRUST_FLAGS = [
  { icon: TriangleAlert, color: "red",    label: "Urgent payment demand with 48-hr deadline"     },
  { icon: XCircle,       color: "red",    label: "Sender identity unverifiable — no agency code"  },
  { icon: TriangleAlert, color: "amber",  label: "Threatening language inconsistent with IRS style" },
]

function TrustResultsFrame() {
  return (
    <div className="flex flex-col h-full gap-3 select-none overflow-hidden">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
          <span className="text-red-400 font-black text-lg">22</span>
        </div>
        <div>
          <p className="text-red-400 font-bold text-sm">Likely Scam</p>
          <p className="text-slate-400 text-xs">Trust score 22/100 · Do not pay</p>
        </div>
        <XCircle className="w-5 h-5 text-red-400 ml-auto shrink-0" />
      </motion.div>
      <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide shrink-0">Red flags found</p>
      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        {TRUST_FLAGS.map((flag, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className={["flex items-start gap-2.5 rounded-xl px-3 py-2.5 border", flag.color === "red" ? "bg-red-500/8 border-red-500/20" : "bg-amber-500/8 border-amber-500/20"].join(" ")}>
            <flag.icon className={["w-3.5 h-3.5 mt-0.5 shrink-0", flag.color === "red" ? "text-red-400" : "text-amber-400"].join(" ")} />
            <p className="text-white text-xs leading-snug">{flag.label}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="shrink-0 bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5">
        <p className="text-slate-300 text-[11px] leading-relaxed"><span className="text-emerald-400 font-semibold">Recommendation:</span> Do not pay. Contact the IRS directly at irs.gov to verify.</p>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CONTRACT BUILDER FRAMES
───────────────────────────────────────────────────────────── */
const CONTRACT_QS = [
  { icon: User,        label: "Who is providing services?", answer: "Alex Rivera — Freelance Designer" },
  { icon: FileText,    label: "What will you deliver?",     answer: "Brand identity package, 3 revisions" },
  { icon: DollarSign,  label: "What is the total fee?",     answer: "$4,500 — 50% upfront, 50% on delivery" },
  { icon: Calendar,    label: "When is the deadline?",      answer: "June 30, 2026" },
  { icon: Gavel,       label: "How are disputes handled?",  answer: "Mediation first, then arbitration (CA)" },
]

function ContractQuestionsFrame() {
  const [visible, setVisible] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setVisible((v) => Math.min(v + 1, CONTRACT_QS.length)), 450)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col h-full gap-2 select-none overflow-hidden">
      <p className="text-white font-bold text-sm shrink-0">Tell us about your deal</p>
      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        {CONTRACT_QS.map((q, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: i < visible ? 1 : 0, y: i < visible ? 0 : 8 }} transition={{ duration: 0.25 }}
            className="bg-slate-800/70 border border-slate-700/50 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
              <q.icon className="w-3 h-3 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-400 text-[11px]">{q.label}</p>
              <p className="text-white text-xs font-medium mt-0.5 truncate">{q.answer}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ContractGeneratingFrame() {
  const stages = ["Drafting parties & recitals…", "Writing scope of services…", "Adding payment terms…", "Building dispute resolution…", "Running gap analysis…"]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % stages.length), 560)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
        <div className="relative w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <PenLine className="w-6 h-6 text-emerald-400 animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-sm mb-1">Drafting your contract</p>
        <AnimatePresence mode="wait">
          <motion.p key={idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-slate-400 text-xs">{stages[idx]}</motion.p>
        </AnimatePresence>
      </div>
      <div className="w-full space-y-2">
        {["Parties & Recitals", "Scope of Work", "Payment Terms", "Dispute Resolution", "Gap Analysis"].map((clause, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2">
            {i < idx ? <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : i === idx ? <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />}
            <p className={["text-xs", i <= idx ? "text-white" : "text-slate-600"].join(" ")}>{clause}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const CONTRACT_CLAUSES = [
  '1. Services. Alex Rivera ("Contractor") shall provide brand identity design services including logo, color palette, and type system with up to 3 revision rounds.',
  "2. Compensation. Client shall pay $4,500 total: $2,250 due upon signing and $2,250 due upon final delivery.",
  "3. Deadline. Final deliverables due no later than June 30, 2026. Delays exceeding 14 days trigger a renegotiation clause.",
]

function ContractReadyFrame() {
  return (
    <div className="flex flex-col h-full gap-3 select-none overflow-hidden">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-white font-bold text-sm">Service Agreement</p>
          <p className="text-slate-400 text-xs">3 pages · gap analysis complete</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
          <BadgeCheck className="w-3 h-3" /> Ready
        </span>
      </motion.div>
      <div className="flex-1 overflow-hidden bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3">
        {CONTRACT_CLAUSES.map((clause, i) => (
          <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}
            className="text-slate-300 text-[11px] leading-relaxed mb-2 last:mb-0">{clause}</motion.p>
        ))}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-3 border-t border-slate-700/50 pt-2">
          <p className="text-amber-400 text-[11px] font-medium">⚠ Gap found: No intellectual property clause. Consider adding one before signing.</p>
        </motion.div>
      </div>
      <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="shrink-0 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-white text-xs font-semibold flex items-center justify-center gap-2">
        <Download className="w-3.5 h-3.5" /> Download PDF
      </motion.button>
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
  if (toolId === "trust") {
    if (frame === 0) return <TrustInputFrame />
    if (frame === 1) return <TrustScanFrame />
    return <TrustResultsFrame />
  }
  if (frame === 0) return <ContractQuestionsFrame />
  if (frame === 1) return <ContractGeneratingFrame />
  return <ContractReadyFrame />
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
      <div className="rounded-3xl bg-slate-950 dark:bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-primary/6 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* ── Left: tool selector + description ── */}
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-4">See it in action</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight mb-3">
              Three tools,<br />one platform
            </h2>

            <AnimatePresence mode="wait">
              <motion.p
                key={activeTool}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-slate-400 leading-relaxed text-sm mb-8 max-w-sm"
              >
                {tool.description}
              </motion.p>
            </AnimatePresence>

            {/* Tool tabs */}
            <div className="flex flex-col gap-2.5">
              {TOOLS.map((t, i) => {
                const isActive = i === activeTool
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTool(i)}
                    className={[
                      "flex items-center gap-4 rounded-2xl px-5 py-3.5 text-left transition-all border",
                      isActive ? "bg-white/8 border-white/12" : "bg-transparent border-transparent hover:bg-white/4",
                    ].join(" ")}
                  >
                    <div className={[
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      isActive ? "bg-primary" : "bg-slate-800",
                    ].join(" ")}>
                      <t.icon className={["w-4 h-4", isActive ? "text-white" : "text-slate-500"].join(" ")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={["text-sm font-bold transition-colors", isActive ? "text-white" : "text-slate-500"].join(" ")}>{t.label}</p>
                      <p className={["text-xs mt-0.5 transition-colors truncate", isActive ? "text-slate-400" : "text-slate-600"].join(" ")}>{t.tagline}</p>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={() => setLocation(tool.cta.path)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                {tool.cta.label} <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-slate-500 text-xs">No account required</p>
            </div>
          </div>

          {/* ── Right: animated preview ── */}
          <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:py-16 lg:pl-0">
            <div className="w-full max-w-sm">
              {/* Browser chrome */}
              <div className="rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-black/50">
                {/* Title bar */}
                <div className="bg-slate-800/90 px-4 py-3 flex items-center gap-2 border-b border-slate-700/50">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTool}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 mx-3 bg-slate-700/60 rounded-md px-3 py-1 text-[11px] text-slate-400 font-mono truncate"
                    >
                      {tool.url}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Content area */}
                <div className="bg-slate-900 px-5 py-5 min-h-[340px] flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeTool}-${activeFrame}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28 }}
                      className="flex-1 flex flex-col"
                    >
                      <FrameContent toolId={tool.id} frame={activeFrame} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Frame dots */}
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: tool.frames }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => selectFrame(i)}
                    className={[
                      "rounded-full transition-all",
                      i === activeFrame ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-slate-600 hover:bg-slate-500",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
