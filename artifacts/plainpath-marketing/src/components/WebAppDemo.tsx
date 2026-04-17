/**
 * WebAppDemo
 * ──────────
 * Lightweight looping product demo for the "One platform, every device" section.
 * Lighter and more subtle than PhoneHeroDemo — pure React + Framer Motion, no video.
 *
 * Loop (10.5 s total, 3.5 s per phase):
 *  Phase 0 — document loaded, scan line playing       (3.5 s)
 *  Phase 1 — analysis results / summary revealed      (3.5 s)
 *  Phase 2 — action plan + export state               (3.5 s)
 *
 * Reduced-motion: renders Phase 2 (fully resolved) as a static snapshot.
 */

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Download,
  Sparkles,
} from "lucide-react"

const PHASE_MS = 3500
const PHASES = 3

const rise = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, transition: { duration: 0.3 } },
}

/* ─── Mini nav bar ─────────────────────────────────────────── */
function MiniNav() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
      <div className="flex items-center gap-1.5 mr-3">
        <div className="w-4 h-4 bg-primary rounded flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100">PlainPath</span>
      </div>
      {["Analyze", "Trust Check", "Contract"].map((tab, i) => (
        <span
          key={tab}
          className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
            i === 0
              ? "bg-primary/10 text-primary"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {tab}
        </span>
      ))}
      <div className="ml-auto w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
    </div>
  )
}

/* ─── Document header bar ──────────────────────────────────── */
function DocHeader({ phase }: { phase: number }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#F8F7F4] dark:bg-zinc-900 border-b border-zinc-200/70 dark:border-zinc-800 shrink-0">
      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
          Lease Agreement — Unit 4B.pdf
        </p>
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-tight">847 words · 12 pages</p>
      </div>
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div
            key="scanning"
            variants={rise}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center gap-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/20 rounded-full px-2.5 py-1 shrink-0"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
            <span className="text-[9px] font-semibold text-primary">Analyzing…</span>
          </motion.div>
        )}
        {phase === 1 && (
          <motion.div
            key="done"
            variants={rise}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-full px-2.5 py-1 shrink-0"
          >
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">Complete</span>
          </motion.div>
        )}
        {phase === 2 && (
          <motion.div
            key="export"
            variants={rise}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center gap-1.5 bg-primary text-white rounded-full px-2.5 py-1 shrink-0"
          >
            <Download className="w-2.5 h-2.5" />
            <span className="text-[9px] font-semibold">Export</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Document skeleton lines ─────────────────────────────── */
function DocLines({ scanning }: { scanning: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">
        Document Preview
      </p>
      {[80, 92, 68, 85].map((w, i) => (
        <div key={i} className="h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}%` }} />
      ))}
      {/* Highlighted clause */}
      <motion.div
        animate={{
          backgroundColor: scanning ? "rgb(254 243 199)" : "rgb(244 244 245)",
          borderColor: scanning ? "rgb(252 211 77)" : "rgb(228 228 231)",
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-lg border p-1.5 mt-1"
        style={{ backgroundColor: "rgb(244 244 245)", borderColor: "rgb(228 228 231)" }}
      >
        <div className="space-y-1">
          {[90, 72].map((w, i) => (
            <div
              key={i}
              className="h-[5px] rounded-full"
              style={{
                width: `${w}%`,
                backgroundColor: scanning ? "rgb(252 211 77 / 0.55)" : "rgb(212 212 216)",
              }}
            />
          ))}
        </div>
      </motion.div>
      <div className="space-y-1.5 pt-0.5">
        {[60, 75, 88].map((w, i) => (
          <div key={i} className="h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

/* ─── Phase 0: Scanning overlay ───────────────────────────── */
function ScanOverlay() {
  return (
    <motion.div
      initial={{ top: "10%" }}
      animate={{ top: "78%" }}
      transition={{ duration: 3, ease: "easeInOut" }}
      className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none"
      style={{ position: "absolute" }}
    />
  )
}

/* ─── Phase 1: Results summary card ───────────────────────── */
function ResultsCard() {
  const findings = [
    { icon: AlertTriangle, label: "3 risks flagged",       color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { icon: Shield,        label: "No-notice entry clause",color: "text-red-600 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-900/20"    },
    { icon: CheckCircle2,  label: "2 protections confirmed",color:"text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ]
  return (
    <motion.div variants={rise} initial="hidden" animate="visible" exit="exit" className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">
        Analysis Summary
      </p>
      {findings.map(({ icon: Icon, label, color, bg }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`flex items-center gap-2 p-2 rounded-lg border ${bg} ${
            i === 0 ? "border-amber-200 dark:border-amber-800/40"
            : i === 1 ? "border-red-200 dark:border-red-800/40"
            : "border-emerald-200 dark:border-emerald-800/40"
          }`}
        >
          <Icon className={`w-3 h-3 shrink-0 ${color}`} />
          <span className={`text-[10px] font-medium leading-tight ${color}`}>{label}</span>
        </motion.div>
      ))}
    </motion.div>
  )
}

/* ─── Phase 2: Action plan ─────────────────────────────────── */
function ActionPlan() {
  const steps = [
    { label: "Request 24-hour notice clause",  done: true  },
    { label: "Negotiate fee escalation cap",   done: true  },
    { label: "Sign and return by April 30",    done: false },
  ]
  return (
    <motion.div variants={rise} initial="hidden" animate="visible" exit="exit" className="space-y-1.5">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">
        Action Plan
      </p>
      {steps.map(({ label, done }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2"
        >
          <div
            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
              done ? "bg-emerald-500 border-emerald-500" : "border-zinc-300 dark:border-zinc-600"
            }`}
          >
            {done && (
              <svg viewBox="0 0 12 12" className="w-2 h-2" fill="none">
                <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className={`text-[10px] leading-tight ${
            done
              ? "line-through text-zinc-400 dark:text-zinc-600"
              : "text-zinc-700 dark:text-zinc-300 font-medium"
          }`}>
            {label}
          </p>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex items-center gap-1.5 mt-3 text-[10px] font-semibold text-primary"
      >
        <Sparkles className="w-3 h-3" />
        <span>Download full report as PDF</span>
      </motion.div>
    </motion.div>
  )
}

/* ─── Main component ───────────────────────────────────────── */
export function WebAppDemo() {
  const [phase, setPhase] = useState(0)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (shouldReduce) return
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES), PHASE_MS)
    return () => clearInterval(id)
  }, [shouldReduce])

  const activePhase = shouldReduce ? 2 : phase

  return (
    <div
      className="w-full rounded-2xl shadow-2xl border border-border/50 overflow-hidden bg-[#F8F7F4] dark:bg-zinc-900 select-none"
      style={{ aspectRatio: "16 / 10" }}
      aria-hidden="true"
    >
      <MiniNav />
      <DocHeader phase={activePhase} />

      {/* Content body — two columns */}
      <div className="flex h-[calc(100%-72px)]">

        {/* Left: doc lines */}
        <div className="relative flex-1 px-4 pt-3 overflow-hidden border-r border-zinc-200/70 dark:border-zinc-800">
          <DocLines scanning={activePhase === 0} />
          <AnimatePresence>
            {activePhase === 0 && <ScanOverlay key="scan" />}
          </AnimatePresence>
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#F8F7F4] dark:from-zinc-900 to-transparent pointer-events-none" />
        </div>

        {/* Right: phase-specific results */}
        <div className="flex-1 px-4 pt-3 overflow-hidden">
          <AnimatePresence mode="wait">
            {activePhase === 0 && (
              <motion.div key="idle" variants={rise} initial="hidden" animate="visible" exit="exit">
                <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-3">
                  Results
                </p>
                <div className="space-y-2">
                  {[70, 55, 80, 40].map((w, i) => (
                    <div key={i} className="h-[5px] rounded-full bg-zinc-200/60 dark:bg-zinc-700/60" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </motion.div>
            )}
            {activePhase === 1 && <ResultsCard key="results" />}
            {activePhase === 2 && <ActionPlan key="actions" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
