/**
 * WebAppDemo
 * ──────────
 * Looping demo showing all 4 PlainPath tools cycling through.
 * Pure React + Framer Motion — no video files.
 *
 * Loop (14 s total, 3.5 s per phase):
 *  Phase 0 — Analyze a Document   (scanning + results)
 *  Phase 1 — Document Trust Check (scam verdict)
 *  Phase 2 — Contract Review      (flagged clauses)
 *  Phase 3 — Build a Contract     (fields populating)
 *
 * Reduced-motion: renders Phase 0 results as a static snapshot.
 */

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Scale,
  FileSignature,
  Download,
  Sparkles,
} from "lucide-react"

const PHASE_MS = 3500
const PHASES = 4

const rise = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, transition: { duration: 0.28 } },
}

/* ─── Tool tab config ─────────────────────────────────────── */
const TABS = [
  { label: "Analyze",     icon: FileText,     phase: 0 },
  { label: "Trust Check", icon: ShieldAlert,  phase: 1 },
  { label: "Review",      icon: Scale,        phase: 2 },
  { label: "Build",       icon: FileSignature,phase: 3 },
]

/* ─── Mini nav bar ─────────────────────────────────────────── */
function MiniNav({ activePhase }: { activePhase: number }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
      <div className="flex items-center gap-1.5 mr-2 shrink-0">
        <div className="w-4 h-4 bg-primary rounded flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-100">PlainPath</span>
      </div>
      {TABS.map(({ label, phase }) => (
        <motion.span
          key={label}
          animate={{
            backgroundColor: activePhase === phase ? "rgb(var(--primary) / 0.1)" : "transparent",
            color: activePhase === phase ? "rgb(var(--primary))" : "",
          }}
          transition={{ duration: 0.3 }}
          className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap transition-colors ${
            activePhase === phase
              ? "bg-primary/10 text-primary"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {label}
        </motion.span>
      ))}
      <div className="ml-auto w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
    </div>
  )
}

/* ─── Document header ─────────────────────────────────────── */
const DOC_HEADERS = [
  { name: "Lease Agreement — Unit 4B.pdf",    meta: "847 words · 12 pages", icon: FileText,      iconBg: "bg-blue-50 dark:bg-blue-900/30",    iconColor: "text-blue-600 dark:text-blue-400",    badge: { label: "3 issues",     bg: "bg-amber-50 dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-800/40",  dot: "bg-amber-500",   text: "text-amber-700 dark:text-amber-400"  } },
  { name: "IRS Notice — CP2000.pdf",          meta: "312 words · 2 pages",  icon: ShieldAlert,   iconBg: "bg-red-50 dark:bg-red-900/30",      iconColor: "text-red-600 dark:text-red-400",      badge: { label: "High risk",    bg: "bg-red-50 dark:bg-red-900/20",      border: "border-red-200 dark:border-red-800/40",      dot: "bg-red-500",     text: "text-red-700 dark:text-red-400"      } },
  { name: "Employment Agreement.pdf",         meta: "1,240 words · 8 pages",icon: Scale,         iconBg: "bg-amber-50 dark:bg-amber-900/30",  iconColor: "text-amber-600 dark:text-amber-400",  badge: { label: "2 clauses",    bg: "bg-amber-50 dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-800/40",  dot: "bg-amber-500",   text: "text-amber-700 dark:text-amber-400"  } },
  { name: "Freelance Services Agreement",     meta: "New contract · 6 fields",icon: FileSignature,iconBg: "bg-emerald-50 dark:bg-emerald-900/30",iconColor: "text-emerald-600 dark:text-emerald-400",badge: { label: "Building…",  bg: "bg-primary/5 dark:bg-primary/10",   border: "border-primary/20",                          dot: "bg-primary",     text: "text-primary"                        } },
]

function DocHeader({ phase }: { phase: number }) {
  const h = DOC_HEADERS[phase]
  const Icon = h.icon
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        variants={rise}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex items-center gap-2.5 px-4 py-2.5 bg-[#F8F7F4] dark:bg-zinc-900 border-b border-zinc-200/70 dark:border-zinc-800 shrink-0"
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${h.iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${h.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-tight">{h.name}</p>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-tight">{h.meta}</p>
        </div>
        <div className={`flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 shrink-0 ${h.badge.bg} ${h.badge.border}`}>
          <motion.div
            animate={phase === 3 ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            className={`w-1.5 h-1.5 rounded-full ${h.badge.dot}`}
          />
          <span className={`text-[9px] font-semibold whitespace-nowrap ${h.badge.text}`}>{h.badge.label}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Left pane: doc text lines ────────────────────────────── */
function DocLines({ phase }: { phase: number }) {
  const highlighted = phase === 0 || phase === 2
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">
        {phase === 3 ? "Contract Fields" : "Document Preview"}
      </p>
      {phase === 3 ? (
        /* Contract builder — field rows */
        <div className="space-y-2">
          {[
            { label: "Party A", done: true },
            { label: "Party B", done: true },
            { label: "Scope of work", done: true },
            { label: "Payment terms", done: false },
          ].map(({ label, done }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.15, duration: 0.35 }}
              className="flex items-center gap-1.5"
            >
              <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${done ? "bg-emerald-500 border-emerald-500" : "border-zinc-300 dark:border-zinc-600"}`}>
                {done && (
                  <svg viewBox="0 0 12 12" className="w-1.5 h-1.5" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className={`h-[5px] flex-1 rounded-full ${done ? "bg-emerald-200 dark:bg-emerald-800/50" : "bg-zinc-200 dark:bg-zinc-700"}`} />
              <span className="text-[8px] text-zinc-400 shrink-0">{label}</span>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Document text lines */
        <>
          {[80, 92, 68, 85].map((w, i) => (
            <div key={i} className="h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}%` }} />
          ))}
          <motion.div
            animate={{
              backgroundColor: highlighted ? "rgb(254 243 199)" : "rgb(244 244 245)",
              borderColor: highlighted ? "rgb(252 211 77)" : "rgb(228 228 231)",
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-lg border p-1.5 mt-1"
            style={{ backgroundColor: "rgb(244 244 245)", borderColor: "rgb(228 228 231)" }}
          >
            <div className="space-y-1">
              {[90, 72].map((w, i) => (
                <div key={i} className="h-[5px] rounded-full" style={{ width: `${w}%`, backgroundColor: highlighted ? "rgb(252 211 77 / 0.55)" : "rgb(212 212 216)" }} />
              ))}
            </div>
          </motion.div>
          <div className="space-y-1.5 pt-0.5">
            {[60, 75, 88].map((w, i) => (
              <div key={i} className="h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}%` }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Scan line (phase 0 only) ──────────────────────────────── */
function ScanLine() {
  return (
    <motion.div
      initial={{ top: "10%" }}
      animate={{ top: "75%" }}
      transition={{ duration: 3, ease: "easeInOut" }}
      className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none"
      style={{ position: "absolute" }}
    />
  )
}

/* ─── Phase 0 right: Analyze results ───────────────────────── */
function AnalyzeResults() {
  const items = [
    { icon: AlertTriangle, label: "3 risks flagged",        color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20",    border: "border-amber-200 dark:border-amber-800/40"    },
    { icon: Shield,        label: "No-notice entry clause", color: "text-red-600 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-900/20",        border: "border-red-200 dark:border-red-800/40"        },
    { icon: CheckCircle2,  label: "2 protections confirmed",color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/40" },
  ]
  return (
    <motion.div key="analyze" variants={rise} initial="hidden" animate="visible" exit="exit" className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Analysis Summary</p>
      {items.map(({ icon: Icon, label, color, bg, border }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12, duration: 0.35 }}
          className={`flex items-center gap-2 p-2 rounded-lg border ${bg} ${border}`}
        >
          <Icon className={`w-3 h-3 shrink-0 ${color}`} />
          <span className={`text-[10px] font-medium leading-tight ${color}`}>{label}</span>
        </motion.div>
      ))}
    </motion.div>
  )
}

/* ─── Phase 1 right: Trust Check verdict ───────────────────── */
function TrustCheckResults() {
  const flags = ["Requests payment via gift card", "Urgent language + threats", "Unverified sender address"]
  return (
    <motion.div key="trust" variants={rise} initial="hidden" animate="visible" exit="exit" className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Trust Verdict</p>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 mb-2"
      >
        <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
        <span className="text-[10px] font-bold text-red-700 dark:text-red-400">Scam Detected — Do not pay</span>
      </motion.div>
      <div className="space-y-1.5">
        {flags.map((f, i) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.3 }}
            className="flex items-start gap-1.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />
            <span className="text-[9px] text-zinc-600 dark:text-zinc-400 leading-snug">{f}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Phase 2 right: Contract Review ───────────────────────── */
function ContractReviewResults() {
  const clauses = [
    { label: "5-yr global non-compete",   severity: "Unfair",   color: "text-red-600 dark:text-red-400",   bg: "bg-red-50 dark:bg-red-900/20",    border: "border-red-200 dark:border-red-800/40"    },
    { label: "No severance on termination",severity: "Missing", color: "text-amber-600 dark:text-amber-400",bg: "bg-amber-50 dark:bg-amber-900/20",border: "border-amber-200 dark:border-amber-800/40" },
  ]
  return (
    <motion.div key="review" variants={rise} initial="hidden" animate="visible" exit="exit" className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Contract Review</p>
      {clauses.map(({ label, severity, color, bg, border }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15, duration: 0.35 }}
          className={`p-2 rounded-lg border ${bg} ${border}`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className={`w-2.5 h-2.5 shrink-0 ${color}`} />
            <span className={`text-[9px] font-bold uppercase tracking-wide ${color}`}>{severity}</span>
          </div>
          <p className="text-[9px] text-zinc-600 dark:text-zinc-400 leading-snug ml-4">{label}</p>
        </motion.div>
      ))}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="text-[9px] text-primary font-medium flex items-center gap-1 mt-1"
      >
        <Sparkles className="w-2.5 h-2.5" /> Negotiation language included
      </motion.p>
    </motion.div>
  )
}

/* ─── Phase 3 right: Contract Builder ──────────────────────── */
function ContractBuilderResults() {
  return (
    <motion.div key="build" variants={rise} initial="hidden" animate="visible" exit="exit" className="space-y-2">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Contract Ready</p>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Freelance Agreement</span>
        </div>
        <div className="space-y-1 ml-4">
          {["6 clauses drafted", "Gap analysis complete"].map((t, i) => (
            <p key={t} className="text-[9px] text-emerald-700 dark:text-emerald-400">{t}</p>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="flex items-center gap-1.5 p-2 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20"
      >
        <Download className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-semibold text-primary">Download as PDF / Word</span>
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

  const activePhase = shouldReduce ? 0 : phase

  return (
    <div
      className="w-full rounded-2xl shadow-2xl border border-border/50 overflow-hidden bg-[#F8F7F4] dark:bg-zinc-900 select-none"
      style={{ aspectRatio: "16 / 10" }}
      aria-hidden="true"
    >
      <MiniNav activePhase={activePhase} />
      <DocHeader phase={activePhase} />

      {/* Content body */}
      <div className="flex" style={{ height: "calc(100% - 74px)" }}>

        {/* Left: doc preview */}
        <div className="relative flex-1 px-4 pt-3 overflow-hidden border-r border-zinc-200/70 dark:border-zinc-800">
          <AnimatePresence mode="wait">
            <motion.div key={activePhase} variants={rise} initial="hidden" animate="visible" exit="exit">
              <DocLines phase={activePhase} />
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {activePhase === 0 && <ScanLine key="scan" />}
          </AnimatePresence>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#F8F7F4] dark:from-zinc-900 to-transparent pointer-events-none" />
        </div>

        {/* Right: tool output */}
        <div className="flex-1 px-4 pt-3 overflow-hidden">
          <AnimatePresence mode="wait">
            {activePhase === 0 && <AnalyzeResults key="analyze" />}
            {activePhase === 1 && <TrustCheckResults key="trust" />}
            {activePhase === 2 && <ContractReviewResults key="review" />}
            {activePhase === 3 && <ContractBuilderResults key="build" />}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
