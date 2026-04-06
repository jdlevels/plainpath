import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload, Loader2, CheckCircle2, AlertTriangle, Clock,
  FileText, ChevronRight, ShieldCheck, Calendar, Flag,
  ArrowRight
} from "lucide-react"
import { useLocation } from "wouter"

const STEPS = [
  { id: "upload",   label: "Upload",  icon: Upload },
  { id: "analyze",  label: "Analyze", icon: Loader2 },
  { id: "results",  label: "Results", icon: CheckCircle2 },
]

const STEP_DURATION = 3200 // ms per step before auto-advancing

/* ─── mock action-plan items shown in results step ─── */
const ACTION_ITEMS = [
  { priority: "high",   icon: Clock,         label: "Submit response within 14 days",          tag: "Deadline"  },
  { priority: "high",   icon: FileText,       label: "Attach proof of insurance (Form A-12)",    tag: "Required"  },
  { priority: "medium", icon: Flag,           label: "Review clause 7.3 — liability transfer",   tag: "Risk"      },
  { priority: "low",    icon: Calendar,       label: "Renewal window opens in 90 days",          tag: "Date"      },
  { priority: "low",    icon: ShieldCheck,    label: "Confirm signatory authority",               tag: "Action"    },
]

function UploadFrame() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-[340px] rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/60 px-8 py-10 flex flex-col items-center gap-4 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Drop your document here</p>
          <p className="text-slate-400 text-xs mt-1">PDF, Word, or paste text</p>
        </div>
        <div className="w-full flex flex-wrap gap-1.5 justify-center mt-1">
          {["Eviction Notice", "Lease Agreement", "Court Summons", "Benefit Letter"].map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 text-[11px] font-medium">{t}</span>
          ))}
        </div>
      </motion.div>

      {/* Simulated file appearing */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-[340px] flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3"
      >
        <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">eviction_notice_apr2026.pdf</p>
          <p className="text-slate-400 text-[11px]">124 KB — ready</p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        </motion.div>
      </motion.div>
    </div>
  )
}

function AnalyzeFrame() {
  const stages = [
    "Reading document structure…",
    "Extracting deadlines and dates…",
    "Identifying required documents…",
    "Flagging risks and obligations…",
    "Building your action plan…",
  ]
  const [stageIdx, setStageIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIdx((i) => (i + 1) % stages.length)
    }, 580)
    return () => clearInterval(interval)
  }, [])

  const progress = Math.min(100, ((stageIdx + 1) / stages.length) * 100 + 8)

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[340px] bg-slate-800/70 border border-slate-700/50 rounded-2xl px-7 py-8 flex flex-col items-center gap-5 text-center"
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        </div>
        <div>
          <p className="text-white font-bold text-sm mb-1">Analyzing your document</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={stageIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-slate-400 text-xs"
            >
              {stages[stageIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "8%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Scanning lines animation */}
      <div className="w-full max-w-[340px] space-y-2 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: [0, 0.4, 0.4, 0], x: 0 }}
            transition={{ delay: i * 0.15, duration: 1.8, repeat: Infinity, repeatDelay: 0.4 }}
            className="h-2 rounded-full bg-slate-700"
            style={{ width: `${75 - i * 10}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function ResultsFrame() {
  return (
    <div className="flex flex-col h-full gap-3 select-none overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between shrink-0"
      >
        <div>
          <p className="text-white font-bold text-sm">Eviction Notice · Action Plan</p>
          <p className="text-slate-400 text-xs mt-0.5">5 items · 1 high-priority deadline</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold">Act now</span>
      </motion.div>

      {/* Action items */}
      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        {ACTION_ITEMS.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={[
              "flex items-start gap-3 rounded-xl px-3.5 py-3 border",
              item.priority === "high"
                ? "bg-red-500/8 border-red-500/20"
                : item.priority === "medium"
                  ? "bg-amber-500/8 border-amber-500/20"
                  : "bg-slate-800/60 border-slate-700/40",
            ].join(" ")}
          >
            <div className={[
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              item.priority === "high" ? "bg-red-500/15" : item.priority === "medium" ? "bg-amber-500/15" : "bg-slate-700/60",
            ].join(" ")}>
              <item.icon className={[
                "w-3.5 h-3.5",
                item.priority === "high" ? "text-red-400" : item.priority === "medium" ? "text-amber-400" : "text-slate-400",
              ].join(" ")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium leading-snug">{item.label}</p>
            </div>
            <span className={[
              "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5",
              item.priority === "high" ? "bg-red-500/15 text-red-400" : item.priority === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-slate-700 text-slate-400",
            ].join(" ")}>
              {item.tag}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="shrink-0 flex items-center gap-3 bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-2.5"
      >
        <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "20%" }}
            transition={{ delay: 0.8, duration: 0.8 }}
          />
        </div>
        <p className="text-slate-400 text-[11px] font-medium shrink-0">1 / 5 complete</p>
      </motion.div>
    </div>
  )
}

export default function DemoSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, setLocation] = useLocation()

  function scheduleNext() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setActiveStep((s) => (s + 1) % STEPS.length)
    }, STEP_DURATION)
  }

  useEffect(() => {
    if (!paused) scheduleNext()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [activeStep, paused])

  function goTo(idx: number) {
    setActiveStep(idx)
    setPaused(true)
  }

  return (
    <section className="w-full max-w-none -mx-4 px-4 mb-28">
      <div className="rounded-3xl bg-slate-950 dark:bg-slate-900 max-w-6xl mx-auto overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left — text + step controls */}
          <div className="flex flex-col justify-center px-8 py-14 sm:px-12 lg:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-4">
              See it in action
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight mb-5">
              From confusing<br />to clear in seconds
            </h2>
            <p className="text-slate-400 leading-relaxed text-base mb-10 max-w-sm">
              Upload any document — a notice, contract, or government form — and get a complete action plan in under 30 seconds.
            </p>

            {/* Step tabs */}
            <div className="flex flex-col gap-3">
              {STEPS.map((step, i) => {
                const isActive = i === activeStep
                return (
                  <button
                    key={step.id}
                    onClick={() => goTo(i)}
                    className={[
                      "flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all border",
                      isActive
                        ? "bg-white/8 border-white/15"
                        : "bg-transparent border-transparent hover:bg-white/4",
                    ].join(" ")}
                  >
                    <div className={[
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      isActive ? "bg-primary text-white" : "bg-slate-800 text-slate-500",
                    ].join(" ")}>
                      <span className="text-xs font-bold">0{i + 1}</span>
                    </div>
                    <div>
                      <p className={["text-sm font-bold transition-colors", isActive ? "text-white" : "text-slate-500"].join(" ")}>
                        {step.id === "upload" ? "Upload your document" : step.id === "analyze" ? "We read every word" : "Get your action plan"}
                      </p>
                      <p className={["text-xs mt-0.5 transition-colors", isActive ? "text-slate-400" : "text-slate-600"].join(" ")}>
                        {step.id === "upload"
                          ? "PDF, Word, or paste text — no account needed"
                          : step.id === "analyze"
                            ? "Every deadline, requirement, and risk extracted"
                            : "Prioritized steps, deadlines, and flags"}
                      </p>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-primary ml-auto shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={() => setLocation("/import")}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Try it free <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-slate-500 text-xs">No account required</p>
            </div>
          </div>

          {/* Right — animated preview */}
          <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:py-16 lg:pl-0">
            <div className="w-full max-w-sm">
              {/* Browser chrome */}
              <div className="rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-black/40">
                {/* Title bar */}
                <div className="bg-slate-800/90 px-4 py-3 flex items-center gap-2 border-b border-slate-700/50">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="flex-1 mx-3 bg-slate-700/60 rounded-md px-3 py-1 text-[11px] text-slate-400 font-mono">
                    plain-path.replit.app/import
                  </div>
                </div>

                {/* Content area */}
                <div className="bg-slate-900 px-5 py-5 min-h-[320px] flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col"
                    >
                      {activeStep === 0 && <UploadFrame />}
                      {activeStep === 1 && <AnalyzeFrame />}
                      {activeStep === 2 && <ResultsFrame />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-4">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={[
                      "rounded-full transition-all",
                      i === activeStep ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-slate-600 hover:bg-slate-500",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
