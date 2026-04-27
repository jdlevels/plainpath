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
  AlertTriangle, CheckCircle2, ChevronLeft, Shield,
  Wifi, BatteryFull, Signal, EyeOff,
  GitCompare, ListChecks, Clock,
} from "lucide-react"

const PHASE_MS = 5200

const fade = {
  hidden:  { opacity: 0, y: 6  },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -5, transition: { duration: 0.26 } },
}

/* ─── Per-tool header config ──────────────────────────────── */
const TOOL_HEADERS = [
  { docName: "Lease Agreement",         docMeta: "847 words · 12 pages",      badgeLabel: "Review needed",  badgeBg: "rgba(245,158,11,0.15)", badgeBorder: "rgba(245,158,11,0.40)", badgeColor: "#92400e", badgeDot: "#f59e0b" },
  { docName: "IRS Notice CP2000",       docMeta: "312 words · 2 pages",        badgeLabel: "High risk",      badgeBg: "rgba(239,68,68,0.15)",  badgeBorder: "rgba(239,68,68,0.40)",  badgeColor: "#991b1b", badgeDot: "#ef4444" },
  { docName: "Freelance Agreement",     docMeta: "New contract · Step 3/6",    badgeLabel: "Building…",      badgeBg: "rgba(16,185,129,0.15)", badgeBorder: "rgba(16,185,129,0.40)", badgeColor: "#065f46", badgeDot: "#10b981" },
  { docName: "Employment Offer Letter", docMeta: "1,240 words · 8 pages",      badgeLabel: "Score: 28/100",  badgeBg: "rgba(245,158,11,0.15)", badgeBorder: "rgba(245,158,11,0.40)", badgeColor: "#92400e", badgeDot: "#f59e0b" },
  { docName: "Patient Intake Form",     docMeta: "423 words · 3 pages",        badgeLabel: "3 items found",  badgeBg: "rgba(139,92,246,0.15)", badgeBorder: "rgba(139,92,246,0.40)", badgeColor: "#5b21b6", badgeDot: "#8b5cf6" },
  { docName: "Consulting Agreement",    docMeta: "1,820 words · 6 pages",      badgeLabel: "Awaiting",       badgeBg: "rgba(99,102,241,0.15)", badgeBorder: "rgba(99,102,241,0.40)", badgeColor: "#3730a3", badgeDot: "#6366f1" },
  { docName: "NDA v1 → NDA v2",         docMeta: "2 versions · 14 changes",    badgeLabel: "1 critical",     badgeBg: "rgba(239,68,68,0.15)",  badgeBorder: "rgba(239,68,68,0.40)",  badgeColor: "#991b1b", badgeDot: "#ef4444" },
  { docName: "Lease Agreement",         docMeta: "2,840 words · 12 pages",     badgeLabel: "6 obligations",  badgeBg: "rgba(192,38,211,0.15)", badgeBorder: "rgba(192,38,211,0.40)", badgeColor: "#701a75", badgeDot: "#c026d3" },
  { docName: "Onboarding Guide",        docMeta: "New doc · 7 sections",       badgeLabel: "Drafting…",      badgeBg: "rgba(13,148,136,0.15)", badgeBorder: "rgba(13,148,136,0.40)", badgeColor: "#134e4a", badgeDot: "#0d9488" },
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

/* ─── Tool 0: Analyze a Document ─────────────────────────── */
function AnalyzeScreen() {
  return (
    <div className="px-3 pt-3 space-y-2">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Document Summary</p>
      <div className="space-y-1.5">
        {[72, 88, 60, 82].map((w, i) => (
          <div key={i} className="h-[6px] rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-2.5">
        <div className="flex items-start gap-1.5 mb-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-400">Suspicious Clause Detected</p>
        </div>
        <div className="space-y-1 ml-[18px]">
          {[90, 70].map((w, i) => <div key={i} className="h-[5px] rounded-full bg-amber-200 dark:bg-amber-700/50" style={{ width: `${w}%` }} />)}
        </div>
      </div>
      <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
            <Shield className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-[10px] font-bold text-red-700 dark:text-red-400">3 Risks Found</p>
        </div>
        {["No-notice entry clause", "Auto-renew without opt-out"].map((label, i) => (
          <div key={i} className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <p className="text-[9px] text-red-700 dark:text-red-300 leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Tool 1: Trust Check ────────────────────────────────── */
function TrustCheckScreen() {
  return (
    <div className="px-3 pt-3 space-y-2">
      <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-3 text-center">
        <p className="text-[9px] font-semibold text-red-500 uppercase tracking-wider mb-0.5">Trust Score</p>
        <p className="text-[30px] font-black text-red-600 leading-none">18</p>
        <p className="text-[10px] text-red-400 mb-2">/100 — Likely Scam</p>
        <div className="h-1.5 rounded-full bg-red-100 dark:bg-red-900/40 overflow-hidden">
          <div className="h-full rounded-full bg-red-500" style={{ width: "18%" }} />
        </div>
      </div>
      <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">4 Red Flags</p>
      {["Fake IRS sender domain", "Urgency: 48-hour deadline", "Requests wire transfer", "No case reference #"].map((flag, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-px" />
          <p className="text-[9px] text-zinc-600 dark:text-zinc-400 leading-tight">{flag}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Tool 2: Build a Contract ───────────────────────────── */
function BuildContractScreen() {
  return (
    <div className="px-3 pt-3 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-semibold text-zinc-500 shrink-0">Step 3 of 6</p>
        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: "50%" }} />
        </div>
      </div>
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 p-2.5">
        <p className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Scope of Work</p>
        {[88, 72, 60].map((w, i) => (
          <div key={i} className="h-[5px] rounded-full bg-emerald-200 dark:bg-emerald-800/50 mb-1" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded-xl px-2.5 py-2">
        <motion.div
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
        />
        <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">AI is drafting your contract…</p>
      </div>
      {["Parties & roles", "Payment terms"].map((step, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 12 12" className="w-2 h-2" fill="none">
              <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[10px] text-zinc-400 line-through">{step}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Tool 3: Contract Review ────────────────────────────── */
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

/* ─── Tool 4: Redact ─────────────────────────────────────── */
function RedactScreen() {
  const rows = [
    { w: 72, r: false }, { w: 88, r: false }, { w: 55, r: true },
    { w: 100, r: false }, { w: 90, r: false }, { w: 42, r: true },
    { w: 100, r: false }, { w: 80, r: false }, { w: 60, r: true },
    { w: 100, r: false },
  ]
  return (
    <div className="px-3 pt-3 space-y-2">
      <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/40 rounded-xl px-2.5 py-2">
        <EyeOff className="w-3 h-3 text-violet-600 shrink-0" />
        <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-400">3 items auto-detected</p>
      </div>
      <div className="space-y-1.5">
        {rows.map(({ w, r }, i) => (
          <div key={i} className={`h-[6px] rounded-full ${r ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"}`} style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="rounded-xl border border-violet-200 dark:border-violet-700/40 p-2.5 space-y-1.5">
        {["SSN — ███-██-████", "Date of Birth — ██/██/████", "Insurance # — ███████████"].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-zinc-900 dark:bg-zinc-100 shrink-0" />
            <p className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Tool 5: Ask This Document ──────────────────────────── */
function AskDocumentScreen() {
  return (
    <div className="px-3 pt-3 space-y-2">
      <div className="rounded-xl border border-indigo-200 dark:border-indigo-700/40 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-2">
        <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium italic">"What does this lease require me to do before move-in?"</p>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/40 bg-white dark:bg-zinc-900/60 px-2.5 py-2 space-y-1.5">
        <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">Answer</p>
        {[
          "Pay first month's rent + security deposit before keys",
          "Submit proof of renters insurance by move-in date",
          "Sign and return lease addendum within 3 days",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-px">
              <span className="text-[7px] font-bold text-indigo-600">{i + 1}</span>
            </div>
            <p className="text-[9px] text-zinc-600 dark:text-zinc-300 leading-tight">{item}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/40 px-2.5 py-2">
        <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" />
        <p className="text-[9px] text-zinc-500">Sourced from Section 3 &amp; Addendum A</p>
      </div>
    </div>
  )
}

/* ─── Tool 6: Compare Versions ───────────────────────────── */
function CompareScreen() {
  const lines = [
    { type: "same",    text: "This agreement is binding upon…" },
    { type: "removed", text: "Period: 2 years from execution" },
    { type: "added",   text: "Period: Perpetual — no expiration" },
    { type: "same",    text: "Governed by laws of New York." },
    { type: "same",    text: "Both parties agree to…" },
  ]
  return (
    <div className="px-3 pt-3 space-y-2">
      <div className="rounded-xl border border-red-200 dark:border-red-700/40 bg-red-50 dark:bg-red-900/15 px-2.5 py-2 flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
        <p className="text-[10px] font-bold text-red-700 dark:text-red-400">1 Critical Change Found</p>
      </div>
      <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Section 4 — Duration</p>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/40 overflow-hidden">
        {lines.map((line, i) => (
          <div key={i} className={`px-2 py-1 flex items-start gap-1.5 ${
            line.type === "removed" ? "bg-red-50 dark:bg-red-900/20" :
            line.type === "added"   ? "bg-emerald-50 dark:bg-emerald-900/20" :
            i % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-zinc-50/50 dark:bg-zinc-800/30"
          }`}>
            <span className={`text-[10px] font-bold mt-px shrink-0 w-2.5 ${
              line.type === "removed" ? "text-red-500" :
              line.type === "added"   ? "text-emerald-500" : "text-transparent"
            }`}>{line.type === "removed" ? "−" : line.type === "added" ? "+" : "·"}</span>
            <p className={`text-[9px] leading-tight ${
              line.type === "removed" ? "text-red-700 dark:text-red-300 line-through" :
              line.type === "added"   ? "text-emerald-700 dark:text-emerald-300 font-semibold" :
              "text-zinc-500"
            }`}>{line.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Tool 7: Clause Extractor ───────────────────────────── */
function ClauseExtractorScreen() {
  const obligations = [
    { party: "Tenant",   text: "Pay $1,850/mo by 1st of month" },
    { party: "Tenant",   text: "Provide 60-day notice to vacate" },
    { party: "Landlord", text: "Enter only with 24-hr notice" },
  ]
  return (
    <div className="px-3 pt-3 space-y-2">
      <div className="flex items-center gap-1.5 bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-200 dark:border-fuchsia-700/40 rounded-xl px-2.5 py-2">
        <ListChecks className="w-3 h-3 text-fuchsia-600 shrink-0" />
        <p className="text-[10px] font-semibold text-fuchsia-700 dark:text-fuchsia-400">6 obligations extracted</p>
      </div>
      <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Obligations</p>
      {obligations.map(({ party, text }, i) => (
        <div key={i} className="flex gap-2">
          <div className="w-5 h-5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </div>
          <div>
            <p className="text-[9px] font-semibold text-fuchsia-600 dark:text-fuchsia-400 leading-tight">{party}</p>
            <p className="text-[9px] text-zinc-600 dark:text-zinc-400 leading-tight">{text}</p>
          </div>
        </div>
      ))}
      <div className="space-y-1 pt-1">
        {[65, 78, 55, 82].map((w, i) => (
          <div key={i} className="h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

function DocumentBuilderScreen() {
  const sections = [
    { label: "Introduction & Purpose", done: true },
    { label: "Tools & Equipment Access", done: true },
    { label: "Day 1 Schedule", done: true },
    { label: "Key Contacts & Teams", done: false },
  ]
  return (
    <div className="px-3 pt-3 space-y-2">
      <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/40 rounded-xl px-2.5 py-2">
        <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
        <p className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">7 sections drafted</p>
      </div>
      <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Sections</p>
      {sections.map(({ label, done }, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${done ? "bg-teal-500 border-teal-500" : "border-zinc-300 dark:border-zinc-600"}`}>
            {done && (
              <svg viewBox="0 0 12 12" className="w-2 h-2" fill="none">
                <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="text-[9px] text-zinc-600 dark:text-zinc-400 leading-tight">{label}</p>
        </div>
      ))}
      <div className="flex items-center gap-1.5 mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl px-2.5 py-2">
        <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">Export as PDF or Word</p>
      </div>
    </div>
  )
}

/* ─── Screen router ──────────────────────────────────────── */
function ToolScreen({ toolId }: { toolId: number }) {
  switch (toolId) {
    case 0:  return <AnalyzeScreen />
    case 1:  return <TrustCheckScreen />
    case 2:  return <BuildContractScreen />
    case 3:  return <ContractReviewScreen />
    case 4:  return <RedactScreen />
    case 5:  return <AskDocumentScreen />
    case 6:  return <CompareScreen />
    case 7:  return <ClauseExtractorScreen />
    case 8:  return <DocumentBuilderScreen />
    default: return <AnalyzeScreen />
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
