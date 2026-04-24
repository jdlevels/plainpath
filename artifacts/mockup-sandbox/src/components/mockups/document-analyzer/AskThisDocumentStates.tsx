import { useState } from "react"
import {
  MessageSquare, ArrowLeft, Sparkles, Send, RefreshCcw,
  AlertCircle, CornerDownRight, FileQuestion, AlertTriangle,
  BookOpen, Eye, FileText,
} from "lucide-react"

const QUESTION = "What is the liability cap in this agreement?"
type StateKey = "loading" | "low-confidence" | "error"

const STATES: { key: StateKey; label: string; color: string }[] = [
  { key: "loading",         label: "Loading",        color: "text-violet-400" },
  { key: "low-confidence",  label: "Low Confidence", color: "text-amber-400" },
  { key: "error",           label: "Error",          color: "text-red-400" },
]

/* ── Loading: "reading in progress" feel, not generic spinner ── */
function LoadingState() {
  const stages = [
    { icon: FileText, label: "Reading document structure…",    done: true  },
    { icon: Eye,      label: "Locating relevant clauses…",     done: true  },
    { icon: BookOpen, label: "Generating source-backed answer…", done: false },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

      {/* Question */}
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">Y</span>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-200 border border-slate-700/40">
          {QUESTION}
        </div>
      </div>

      {/* Reading progress */}
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
        </div>
        <div className="flex-1 space-y-3">

          {/* Stage tracker */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3.5 space-y-3">
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Reading in progress</p>
            {stages.map(({ icon: Icon, label, done }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? "bg-violet-500/25" : "bg-slate-700 animate-pulse"
                }`}>
                  <Icon className={`w-2.5 h-2.5 ${done ? "text-violet-400" : "text-slate-500"}`} />
                </div>
                <span className={`text-[12px] ${done ? "text-slate-400" : "text-slate-300 font-medium"}`}>{label}</span>
                {done && <span className="text-[10px] text-violet-500 font-semibold ml-auto">✓</span>}
              </div>
            ))}
          </div>

          {/* Answer skeleton — preserves layout */}
          <div className="space-y-2.5">
            {/* Summary skeleton */}
            <div className="rounded-xl border border-slate-700/30 bg-slate-800/30 px-4 py-3 space-y-2">
              <div className="h-2.5 w-16 rounded-full bg-slate-700/50 animate-pulse mb-2" />
              <div className="h-3 w-full rounded-full bg-slate-700/40 animate-pulse" />
              <div className="h-3 w-10/12 rounded-full bg-slate-700/35 animate-pulse" />
              <div className="h-3 w-3/4 rounded-full bg-slate-700/30 animate-pulse" />
            </div>
            {/* Finding skeletons */}
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-slate-700/30 bg-slate-800/20 px-3.5 py-3 space-y-2">
                <div className="flex justify-between">
                  <div className="h-2.5 rounded-full bg-slate-700/40 animate-pulse" style={{ width: `${44 + i * 12}%` }} />
                  <div className="h-4 w-20 rounded-full bg-slate-700/30 animate-pulse" />
                </div>
                <div className="h-2 w-full bg-slate-700/30 rounded-full animate-pulse" />
                <div className="h-2 rounded-full bg-slate-700/25 animate-pulse" style={{ width: `${80 + i * 6}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Low Confidence: not a system failure — a content finding ── */
function LowConfidenceState() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

      {/* Question */}
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">Y</span>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-200 border border-slate-700/40">
          {QUESTION}
        </div>
      </div>

      {/* Low-confidence response — amber, distinct from error */}
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileQuestion className="w-3 h-3 text-amber-400" />
        </div>
        <div className="flex-1 space-y-3">

          {/* Not-found banner */}
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/6 px-4 py-3.5">
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-slate-200 mb-1">Not clearly answered in this document</p>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  This document references a liability cap but doesn't state a dollar amount directly.
                  The cap may be defined in Exhibit B, which isn't included here.
                </p>
              </div>
            </div>

            {/* Closest match */}
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-2.5">
              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                Closest reference found · Page 8
              </p>
              <p className="text-[12px] text-slate-300 italic leading-relaxed">
                "Liability shall be limited as set forth in Exhibit B, incorporated herein by reference."
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-400/10 ring-1 ring-amber-400/25 px-2 py-0.5 rounded-full">
                ⚠ Low confidence · p.8 · § 14.3
              </div>
            </div>
          </div>

          {/* Action path */}
          <div className="rounded-xl border border-slate-700/30 bg-slate-800/20 px-3.5 py-3">
            <p className="text-[12px] text-slate-400 leading-relaxed mb-3">
              To get the exact cap, upload Exhibit B — or try a different phrasing.
            </p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CornerDownRight className="w-3 h-3" /> Related questions
            </p>
            <div className="space-y-1.5">
              {[
                "What does Exhibit B contain?",
                "Summarize the indemnification section",
                "What liabilities are excluded from this agreement?",
              ].map((q) => (
                <button key={q} className="w-full text-left text-[12px] text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 rounded-lg px-3 py-2 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Error: system failure — red, unambiguous ── */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

      {/* Question */}
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">Y</span>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-200 border border-slate-700/40">
          {QUESTION}
        </div>
      </div>

      {/* Error — red, system-level, unambiguous */}
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertCircle className="w-3 h-3 text-red-400" />
        </div>
        <div className="flex-1 space-y-3">

          <div className="rounded-xl border border-red-500/30 bg-red-500/6 px-4 py-4">
            {/* Error header — distinct visual weight */}
            <div className="flex items-start gap-3 pb-3 mb-3 border-b border-red-500/15">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4.5 h-4.5 text-red-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-200 mb-0.5">Something went wrong</p>
                <p className="text-[12px] text-red-400/80 font-medium">System error — answer could not be generated</p>
              </div>
            </div>

            <p className="text-[12px] text-slate-400 leading-relaxed mb-4">
              This is a temporary issue on our end. Your document is still loaded — try again and it should work.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 text-[12px] font-semibold bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Retry
              </button>
              <span className="text-[11px] text-slate-500">or rephrase and try a different question</span>
            </div>
          </div>

          {/* Rephrase suggestions */}
          <div className="rounded-xl border border-slate-700/30 bg-slate-800/20 px-3.5 py-3">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CornerDownRight className="w-3 h-3" /> Try rephrasing
            </p>
            <div className="space-y-1.5">
              {[
                "What limits exist on damages in this contract?",
                "Is there a maximum payout clause?",
                "Summarize the liability section",
              ].map((q) => (
                <button key={q} className="w-full text-left text-[12px] text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 rounded-lg px-3 py-2 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function AskThisDocumentStates() {
  const [activeState, setActiveState] = useState<StateKey>("loading")
  const [inputVal, setInputVal] = useState("")

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold text-slate-100">Ask This Document</p>
            <p className="text-[11px] text-slate-500 font-medium">Edge States</p>
          </div>
        </div>

        {/* State switcher — color-coded */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {STATES.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setActiveState(key)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-md transition-all ${
                activeState === key
                  ? `bg-slate-700 ${color}`
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* State panel */}
      {activeState === "loading"        && <LoadingState />}
      {activeState === "low-confidence" && <LowConfidenceState />}
      {activeState === "error"          && <ErrorState onRetry={() => setActiveState("loading")} />}

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0 bg-slate-950 border-t border-slate-800/50">
        <div className={`flex items-center gap-2 bg-slate-800/60 border rounded-xl px-3.5 py-2.5 transition-colors ${
          activeState === "loading" ? "border-slate-700/30 opacity-50" : "border-slate-700/60"
        }`}>
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={activeState === "loading" ? "Generating answer…" : "Ask another question about this document…"}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
            disabled={activeState === "loading"}
          />
          <button className={`p-1.5 rounded-lg transition-colors ${inputVal.trim() && activeState !== "loading" ? "text-violet-400 hover:bg-violet-500/20" : "text-slate-600"}`}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
