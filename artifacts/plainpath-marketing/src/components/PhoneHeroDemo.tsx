/**
 * PhoneHeroDemo — 9-tool animated phone preview
 *
 * Accepts optional `toolIndex` (0–8) from a parent that owns the
 * shared demo-rotation state.  When omitted it self-rotates.
 *
 * Phone shell: iPhone-16-Pro-Max inspired — Dynamic Island, titanium
 * frame ring, glass-sheen overlay, premium shadow stack.
 */

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  AlertTriangle, CheckCircle2, ChevronLeft, Clock,
  Wifi, BatteryFull, Signal,
} from "lucide-react"

const PHASE_MS = 5200

const fade = {
  hidden:  { opacity: 0, y: 6  },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -5, transition: { duration: 0.26 } },
}

/* ─── Per-tool header config ──────────────────────────────── */
const TOOL_HEADERS = [
  { docName: "School Enrollment Packet", docMeta: "7 actions · 4 documents · 2 signatures", badgeLabel: "In progress", badgeBg: "rgba(59,130,246,0.12)", badgeBorder: "rgba(59,130,246,0.40)", badgeColor: "#1d4ed8", badgeDot: "#3b82f6" },
  { docName: "Employment Offer Letter",  docMeta: "1,240 words · 8 pages",                  badgeLabel: "Risk level: High", badgeBg: "rgba(245,158,11,0.15)", badgeBorder: "rgba(245,158,11,0.40)", badgeColor: "#92400e", badgeDot: "#f59e0b" },
]

/* ─── Phone chrome ─────────────────────────────────────────── */
function TopBar() {
  return (
    <div
      className="relative flex items-center justify-between bg-[#F8F7F4] dark:bg-zinc-900 shrink-0"
      style={{ height: 44, paddingLeft: 20, paddingRight: 20, paddingTop: 8 }}
    >
      <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums relative z-10">9:41</span>
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-zinc-950 rounded-full z-20 flex items-center justify-center gap-[5px]"
        style={{ top: 7, width: "29%", height: 28 }}
      >
        <div className="rounded-full bg-zinc-800" style={{ width: 18, height: 4 }} />
        <div className="rounded-full bg-[#1a1a1e] ring-1 ring-zinc-700/60 flex items-center justify-center" style={{ width: 10, height: 10 }}>
          <div className="w-[4px] h-[4px] rounded-full bg-zinc-600/50" />
        </div>
      </div>
      <div className="flex items-center gap-[3px] relative z-10">
        <Signal    className="text-zinc-700 dark:text-zinc-300" style={{ width: 10, height: 10 }} />
        <Wifi      className="text-zinc-700 dark:text-zinc-300" style={{ width: 11, height: 11 }} />
        <BatteryFull className="text-zinc-700 dark:text-zinc-300" style={{ width: 13, height: 13 }} />
      </div>
    </div>
  )
}

function AppHeader({ toolId }: { toolId: number }) {
  const h = TOOL_HEADERS[toolId] ?? TOOL_HEADERS[0]
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`header-${toolId}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 px-3 pt-1.5 pb-2.5 bg-[#F8F7F4] dark:bg-zinc-900 border-b border-zinc-200/70 dark:border-zinc-800 shrink-0"
      >
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <ChevronLeft className="w-3 h-3 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100 truncate leading-tight">{h.docName}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">{h.docMeta}</p>
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-2 py-0.5 shrink-0"
          style={{ background: h.badgeBg, border: `1px solid ${h.badgeBorder}` }}
        >
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: h.badgeDot }} />
          <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: h.badgeColor }}>{h.badgeLabel}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Tool 0: Enrollment Packet Completion ───────────────── */
function EnrollmentPacketScreen() {
  const items = [
    { label: "Obtain immunization records",   done: true },
    { label: "Sign enrollment consent form",  done: true },
    { label: "Gather proof of residency",     done: false },
    { label: "Provide photo ID",              done: false },
  ]
  return (
    <div className="px-3 pt-3 space-y-2">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Document Plan</p>

      {/* Next step */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/20 p-2.5">
        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">Next step</p>
        <p className="text-[10px] font-semibold text-blue-900 dark:text-blue-200 leading-tight">Gather proof of residency</p>
        <p className="text-[9px] text-blue-600 dark:text-blue-400 mt-1 leading-tight">Utility bill, lease, mortgage statement, or school district portal</p>
      </div>

      {/* Progress */}
      <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">2 of 7 actions complete</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className={`w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center ${item.done ? "bg-emerald-500" : "border border-zinc-300 dark:border-zinc-600"}`}>
            {item.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
          </div>
          <p className={`text-[9px] leading-tight ${item.done ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-300"}`}>{item.label}</p>
        </div>
      ))}

      {/* Deadline */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-2 flex items-center gap-1.5">
        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
        <p className="text-[9px] text-amber-700 dark:text-amber-300 font-medium leading-tight">Submit before enrollment cutoff</p>
      </div>
    </div>
  )
}

/* ─── Tool 1: Contract Review ────────────────────────────── */
function ContractReviewScreen() {
  return (
    <div className="px-3 pt-3 space-y-2">
      <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 p-2.5 flex items-center gap-3">
        <div>
          <p className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Score</p>
          <p className="text-[26px] font-black text-amber-600 leading-none">28</p>
          <p className="text-[9px] text-amber-500">/100</p>
        </div>
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: "28%" }} />
          </div>
          <p className="text-[9px] text-amber-700 dark:text-amber-400 mt-1 leading-tight">Heavily one-sided</p>
        </div>
      </div>
      <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">4 Flagged Clauses</p>
      {["5-year global non-compete", "No severance clause", "IP rights stripped", "Unilateral termination"].map((clause, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-px" />
          <p className="text-[9px] text-zinc-600 dark:text-zinc-400 leading-tight">{clause}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Screen router ──────────────────────────────────────── */
function ToolScreen({ toolId }: { toolId: number }) {
  switch (toolId) {
    case 0:  return <EnrollmentPacketScreen />
    case 1:  return <ContractReviewScreen />
    default: return <EnrollmentPacketScreen />
  }
}

/* ─── Main component ──────────────────────────────────────── */
export function PhoneHeroDemo({ toolIndex }: { toolIndex?: number } = {}) {
  const [internalIdx, setInternalIdx] = useState(0)
  const shouldReduce = useReducedMotion()

  const activeIdx = toolIndex !== undefined ? toolIndex : internalIdx

  useEffect(() => {
    if (toolIndex !== undefined) return
    if (shouldReduce) return
    const id = setInterval(() => setInternalIdx(i => (i + 1) % TOOL_HEADERS.length), PHASE_MS)
    return () => clearInterval(id)
  }, [toolIndex, shouldReduce])

  return (
    <div
      className="w-full select-none"
      style={{ aspectRatio: "9 / 19.5" }}
      aria-hidden="true"
    >
      <div
        className="relative h-full flex flex-col bg-[#F8F7F4] dark:bg-zinc-900"
        style={{
          borderRadius: "3.25rem",
          overflow: "hidden",
          boxShadow: [
            "0 0 0 2px rgba(105,105,115,0.60)",
            "0 0 0 3.5px rgba(255,255,255,0.18)",
            "0 40px 80px -10px rgba(0,0,0,0.28)",
            "0 12px 24px -6px rgba(0,0,0,0.16)",
            "0 2px 4px 0 rgba(0,0,0,0.10)",
          ].join(", "),
        }}
      >
        {/* Glass sheen */}
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            borderRadius: "inherit",
            background: "linear-gradient(148deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 22%, transparent 48%)",
          }}
        />

        <TopBar />
        <AppHeader toolId={activeIdx} />

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              variants={fade}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <ToolScreen toolId={activeIdx} />
            </motion.div>
          </AnimatePresence>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#F8F7F4] dark:from-zinc-900 to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  )
}
