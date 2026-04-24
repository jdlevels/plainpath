import { useState } from "react"
import {
  MessageSquare, ArrowLeft, Sparkles, Send, RefreshCcw,
  AlertCircle, CornerDownRight, FileQuestion, AlertTriangle,
  Loader2,
} from "lucide-react"

const QUESTION = "What is the liability cap in this agreement?"

type StateKey = "loading" | "error" | "no-answer"

const STATES: { key: StateKey; label: string }[] = [
  { key: "loading",   label: "Loading"    },
  { key: "error",     label: "Error"      },
  { key: "no-answer", label: "No Answer"  },
]

function SkeletonLine({ w = "100%", h = "h-3" }: { w?: string; h?: string }) {
  return (
    <div
      className={`${h} rounded-full bg-slate-700/50 animate-pulse`}
      style={{ width: w }}
    />
  )
}

function LoadingState() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Question bubble */}
      <div className="flex gap-2.5 mb-5">
        <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">Y</span>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 border border-slate-700/40">
          {QUESTION}
        </div>
      </div>

      {/* Skeleton answer */}
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
        </div>
        <div className="flex-1 space-y-3">
          {/* Section skeleton × 3 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl px-3.5 py-3 bg-slate-800/30 border border-slate-700/30 space-y-2">
              <div className="flex items-center justify-between">
                <SkeletonLine w={`${50 + i * 8}%`} h="h-3" />
                <div className="h-4 w-14 rounded-full bg-slate-700/50 animate-pulse" />
              </div>
              <SkeletonLine w="100%" h="h-2.5" />
              <SkeletonLine w="94%" h="h-2.5" />
              <SkeletonLine w={`${72 + i * 5}%`} h="h-2.5" />
            </div>
          ))}

          {/* "Generating" label */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Searching document and generating answer…
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Question bubble */}
      <div className="flex gap-2.5 mb-5">
        <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">Y</span>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 border border-slate-700/40">
          {QUESTION}
        </div>
      </div>

      {/* Error block */}
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertCircle className="w-3 h-3 text-red-400" />
        </div>
        <div className="flex-1">
          <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-200 mb-1">Something went wrong</p>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  The answer could not be generated. This may be a temporary issue.
                  Your document is still loaded — just try again.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-700/40 pt-3 flex items-center gap-3">
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCcw className="w-3 h-3" /> Try again
              </button>
              <span className="text-[11px] text-slate-500">or rephrase your question and try differently</span>
            </div>
          </div>

          {/* Rephrasing suggestions */}
          <div className="mt-3">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CornerDownRight className="w-3 h-3" /> Try asking instead
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

function NoAnswerState() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Question bubble */}
      <div className="flex gap-2.5 mb-5">
        <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">Y</span>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 border border-slate-700/40">
          {QUESTION}
        </div>
      </div>

      {/* Low-confidence response */}
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileQuestion className="w-3 h-3 text-amber-400" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-200 mb-1">Not clearly answered in this document</p>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  This document doesn't appear to contain a specific liability cap clause.
                  It may be referenced by title without dollar amounts, or handled in an exhibit not included here.
                </p>
              </div>
            </div>

            {/* Low-confidence partial info */}
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-1.5">Closest reference found</p>
              <p className="text-[12px] text-slate-300 leading-relaxed italic">
                "Liability shall be limited as set forth in Exhibit B, incorporated herein by reference."
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                ⚠ Low confidence · p.8
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/30 bg-slate-800/20 px-3.5 py-3">
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              To get a clear answer, try uploading Exhibit B, or check whether a separate schedule was attached to this document.
            </p>
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CornerDownRight className="w-3 h-3" /> Related questions you can ask
              </p>
              {[
                "What does Exhibit B cover?",
                "Summarize the indemnification section",
                "What liabilities are excluded?",
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
            <p className="text-[11px] text-slate-500 font-medium">Edge States — Loading · Error · No Answer</p>
          </div>
        </div>
        {/* State switcher */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {STATES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveState(key)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-md transition-all ${
                activeState === key ? "bg-slate-600 text-slate-100" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      {activeState === "loading"   && <LoadingState />}
      {activeState === "error"     && <ErrorState onRetry={() => setActiveState("loading")} />}
      {activeState === "no-answer" && <NoAnswerState />}

      {/* Input bar (always shown) */}
      <div className="px-4 pb-4 flex-shrink-0 bg-slate-950">
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5">
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask another question about this document…"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
            disabled={activeState === "loading"}
          />
          <button className={`p-1.5 rounded-lg transition-colors ${inputVal.trim() && activeState !== "loading" ? "text-violet-400 hover:bg-violet-500/20" : "text-slate-600"}`}>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-1.5">Answers are based only on this document · Always verify critical details</p>
      </div>
    </div>
  )
}
