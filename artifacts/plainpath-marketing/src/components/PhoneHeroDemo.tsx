/**
 * PhoneHeroDemo
 * ─────────────
 * Animated product demo that replaces the static phone screenshot in the hero.
 * Uses Framer Motion + pure React — no video files, no video controls.
 *
 * Loop (10 s total):
 *  Phase 0 — document loaded, base state          (2.5 s)
 *  Phase 1 — suspicious clause highlighted        (2.5 s)
 *  Phase 2 — risk warning card revealed           (2.5 s)
 *  Phase 3 — action steps checklist shown         (2.5 s)
 *
 * Reduced-motion: renders phase 3 (fully resolved state) as a static snapshot.
 */

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Shield,
  FileText,
  Wifi,
  BatteryFull,
} from "lucide-react"

const PHASE_MS = 2500
const PHASES = 4

/* ─── tiny fade variant ────────────────────────────────────── */
const fade = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.3 } },
}

/* ─── Status bar ──────────────────────────────────────────── */
function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-0.5 bg-[#F8F7F4] dark:bg-zinc-900">
      <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">9:41</span>
      <div className="flex items-center gap-1">
        <Wifi className="w-2.5 h-2.5 text-zinc-700 dark:text-zinc-300" />
        <BatteryFull className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
      </div>
    </div>
  )
}

/* ─── App header bar ─────────────────────────────────────── */
function AppHeader() {
  return (
    <div className="flex items-center gap-2 px-3 pt-1.5 pb-2 bg-[#F8F7F4] dark:bg-zinc-900 border-b border-zinc-200/70 dark:border-zinc-800">
      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <ChevronLeft className="w-3 h-3 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-100 truncate leading-tight">Lease Agreement</p>
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-tight">847 words · 3 issues found</p>
      </div>
      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full px-1.5 py-0.5">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">Review needed</span>
      </div>
    </div>
  )
}

/* ─── Document text lines (always visible) ─────────────────── */
function DocLines({ highlightClause }: { highlightClause: boolean }) {
  return (
    <div className="px-3 pt-2.5 space-y-1.5">
      {/* Section label */}
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-1">Document Summary</p>

      {/* Normal lines */}
      <div className="space-y-1">
        {[72, 88, 60, 80].map((w, i) => (
          <div key={i} className="h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}%` }} />
        ))}
      </div>

      {/* Suspicious clause block */}
      <motion.div
        animate={{
          backgroundColor: highlightClause ? "rgb(254 243 199)" : "rgb(244 244 245)",
          borderColor: highlightClause ? "rgb(252 211 77)" : "rgb(228 228 231)",
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-2 rounded-xl border p-2 dark:bg-zinc-800"
        style={{ backgroundColor: "rgb(244 244 245)", borderColor: "rgb(228 228 231)" }}
      >
        <div className="flex items-start gap-1.5 mb-1.5">
          <AlertTriangle
            className="w-3 h-3 shrink-0 mt-px"
            style={{ color: highlightClause ? "rgb(217 119 6)" : "rgb(161 161 170)" }}
          />
          <p
            className="text-[9px] font-semibold leading-tight"
            style={{ color: highlightClause ? "rgb(146 64 14)" : "rgb(113 113 122)" }}
          >
            {highlightClause ? "Suspicious Clause Detected" : "Clause — Section 4.2"}
          </p>
        </div>
        <div className="space-y-1 ml-4">
          {[90, 70].map((w, i) => (
            <div
              key={i}
              className="h-[5px] rounded-full"
              style={{
                width: `${w}%`,
                backgroundColor: highlightClause ? "rgb(252 211 77 / 0.6)" : "rgb(212 212 216)",
              }}
            />
          ))}
        </div>
        {highlightClause && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-[8px] text-amber-700 dark:text-amber-500 mt-1.5 ml-4 leading-snug"
          >
            "Landlord may enter at any time without prior notice."
          </motion.p>
        )}
      </motion.div>

      {/* More lines */}
      <div className="space-y-1 pt-0.5">
        {[55, 78].map((w, i) => (
          <div key={i} className="h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

/* ─── Risk summary card ──────────────────────────────────── */
function RiskCard() {
  const risks = [
    { label: "No-notice entry clause", color: "bg-red-500" },
    { label: "Auto-renew without opt-out", color: "bg-red-500" },
    { label: "Unusual fee escalation", color: "bg-amber-400" },
  ]
  return (
    <motion.div
      variants={fade}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mx-3 mt-2.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 p-2.5"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
          <Shield className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-[10px] font-bold text-red-700 dark:text-red-400">3 Risks Found</p>
      </div>
      <div className="space-y-1.5">
        {risks.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
            <p className="text-[9px] text-red-800 dark:text-red-300 leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Action steps checklist ─────────────────────────────── */
function ActionSteps() {
  const steps = [
    { label: "Request 24-hr notice clause", done: true },
    { label: "Negotiate fee cap at 3%", done: true },
    { label: "Sign and return by April 30", done: false },
  ]
  return (
    <motion.div
      variants={fade}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mx-3 mt-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 p-2.5"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Action Steps (3)</p>
      </div>
      <div className="space-y-1.5">
        {steps.map(({ label, done }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.3 }}
            className="flex items-center gap-1.5"
          >
            <div
              className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                done
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-emerald-300 dark:border-emerald-700"
              }`}
            >
              {done && (
                <svg viewBox="0 0 12 12" className="w-2 h-2" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p className={`text-[9px] leading-tight ${done ? "line-through text-emerald-500" : "text-emerald-800 dark:text-emerald-300"}`}>
              {label}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Scan-line overlay (phase 0 only) ──────────────────── */
function ScanLine() {
  return (
    <motion.div
      initial={{ top: "20%" }}
      animate={{ top: "75%" }}
      transition={{ duration: 2, ease: "easeInOut" }}
      className="absolute left-3 right-3 h-[1.5px] bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
      style={{ position: "absolute" }}
    />
  )
}

/* ─── Scanning label ─────────────────────────────────────── */
function AnalyzingBadge() {
  return (
    <motion.div
      variants={fade}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mx-3 mt-2.5 flex items-center gap-2 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl px-2.5 py-2"
    >
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
      />
      <p className="text-[9px] font-semibold text-primary">Analyzing document…</p>
    </motion.div>
  )
}

/* ─── Main component ─────────────────────────────────────── */
export function PhoneHeroDemo() {
  const [phase, setPhase] = useState(0)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (shouldReduce) return
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES), PHASE_MS)
    return () => clearInterval(id)
  }, [shouldReduce])

  const activePhase = shouldReduce ? 3 : phase

  return (
    <div
      className="w-full drop-shadow-2xl rounded-[2.5rem] border-[7px] border-white/95 dark:border-zinc-800/95 overflow-hidden bg-[#F8F7F4] dark:bg-zinc-900 select-none"
      style={{ aspectRatio: "9 / 19.5" }}
      aria-hidden="true"
    >
      <StatusBar />
      <AppHeader />

      {/* Scrollable screen body */}
      <div className="relative overflow-hidden" style={{ height: "calc(100% - 52px)" }}>
        <DocLines highlightClause={activePhase >= 1} />

        {/* Phase-specific overlay cards */}
        <AnimatePresence mode="wait">
          {activePhase === 0 && <AnalyzingBadge key="analyzing" />}
          {activePhase === 1 && (
            <motion.div key="clause-hint" variants={fade} initial="hidden" animate="visible" exit="exit"
              className="mx-3 mt-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-2 flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              <p className="text-[9px] font-semibold text-amber-700 dark:text-amber-400">1 unfair clause flagged — tap to review</p>
            </motion.div>
          )}
          {activePhase === 2 && <RiskCard key="risks" />}
          {activePhase === 3 && <ActionSteps key="actions" />}
        </AnimatePresence>

        {/* Scan-line animation during phase 0 */}
        <AnimatePresence>
          {activePhase === 0 && <ScanLine key="scan" />}
        </AnimatePresence>

        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#F8F7F4] dark:from-zinc-900 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
