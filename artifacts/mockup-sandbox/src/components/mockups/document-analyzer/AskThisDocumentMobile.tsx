import { useState } from "react"
import {
  MessageSquare, ArrowLeft, FileText, Send, Sparkles,
  CornerDownRight, BookOpen, Calendar, AlertTriangle, ClipboardList,
  ChevronUp, ChevronDown,
} from "lucide-react"

const DOC_NAME = "Vendor_Agreement_2025.pdf"
const QUESTION = "What are the termination conditions?"

const ANSWER_BLOCKS = [
  {
    title: "Termination for Convenience",
    body: "Either party may terminate with 30 days' written notice. No reason required.",
    citation: { num: 1, page: 4 },
    color: "amber",
  },
  {
    title: "Termination for Cause",
    body: "Immediate termination permitted on material breach if uncured within 15 business days.",
    citation: { num: 2, page: 6 },
    color: "red",
  },
]

const CHIP_COLORS: Record<string, string> = {
  amber: "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40",
  red:   "bg-red-400/15 text-red-300 ring-1 ring-red-400/30",
}

const SUGGESTED = [
  { icon: BookOpen, label: "Summarize" },
  { icon: Calendar, label: "Key Dates" },
  { icon: AlertTriangle, label: "Risks" },
  { icon: ClipboardList, label: "Obligations" },
]

function FakeLine({ w = "100%", dim = false }: { w?: string; dim?: boolean }) {
  return <div className={`h-[5px] rounded-full mb-1.5 ${dim ? "bg-slate-300/30" : "bg-slate-300/50"}`} style={{ width: w }} />
}

export default function AskThisDocumentMobile() {
  const [tab, setTab] = useState<"doc" | "ask">("ask")
  const [docExpanded, setDocExpanded] = useState(false)
  const [inputVal, setInputVal] = useState("")

  return (
    <div
      className="flex flex-col bg-slate-950 text-slate-100 overflow-hidden rounded-3xl border border-slate-800 mx-auto shadow-2xl"
      style={{ width: 375, height: 812, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1 flex-shrink-0">
        <span className="text-[11px] font-semibold text-slate-400">9:41</span>
        <div className="w-24 h-5 bg-slate-800 rounded-full" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 bg-slate-400 rounded-sm" />
          <div className="w-3 h-2 bg-slate-400 rounded-sm" />
          <div className="w-4 h-2 bg-slate-300 rounded-sm" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-800 flex-shrink-0">
        <button className="p-1.5 rounded-lg text-slate-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0 leading-none">
          <p className="text-[13px] font-bold text-slate-100">Ask This Document</p>
          <p className="text-[10px] text-slate-500 truncate">{DOC_NAME}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-800 flex-shrink-0">
        {[
          { key: "doc" as const, icon: FileText, label: "Document" },
          { key: "ask" as const, icon: MessageSquare, label: "Ask" },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
              tab === key
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── DOCUMENT TAB ── */}
      {tab === "doc" && (
        <div className="flex-1 overflow-y-auto bg-slate-950 py-4 px-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="h-2.5 w-24 bg-slate-400 rounded mb-1.5" />
                  <div className="h-2 w-16 bg-slate-300 rounded" />
                </div>
                <div className="h-2 w-10 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-36 bg-slate-500 rounded mb-3" />
              {[100, 95, 88, 100, 92, 78].map((w, i) => (
                <FakeLine key={i} w={`${w}%`} />
              ))}
              <div className="mt-2 bg-amber-50 border-l-2 border-amber-400 rounded px-2.5 py-2">
                <div className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-full mb-1.5">① Source</div>
                <FakeLine w="100%" />
                <FakeLine w="90%" dim />
              </div>
              {[100, 88, 76].map((w, i) => (
                <FakeLine key={i} w={`${w}%`} />
              ))}
              <div className="text-right mt-3">
                <span className="text-[8px] text-slate-400">Page 4 of 14</span>
              </div>
            </div>
          </div>
          {/* Quick ask bar at bottom */}
          <div className="mt-4">
            <button
              onClick={() => setTab("ask")}
              className="w-full flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-3 text-slate-500 text-sm"
            >
              <MessageSquare className="w-4 h-4 text-slate-600" />
              Ask a question about this document…
            </button>
          </div>
        </div>
      )}

      {/* ── ASK TAB ── */}
      {tab === "ask" && (
        <div className="flex flex-col flex-1 min-h-0">

          {/* Collapsible doc strip */}
          <button
            onClick={() => setDocExpanded((v) => !v)}
            className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800/50 text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-[200px] font-medium">{DOC_NAME}</span>
            </div>
            {docExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Quick actions */}
          <div className="flex gap-1.5 px-3 pt-2 pb-1.5 overflow-x-auto flex-shrink-0 scrollbar-none">
            {SUGGESTED.map(({ icon: Icon, label }) => (
              <button key={label} className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-700/30 whitespace-nowrap flex-shrink-0">
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {/* Question */}
            <div className="flex gap-2 justify-end">
              <div className="bg-violet-600/90 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] text-white max-w-[80%] leading-relaxed">
                {QUESTION}
              </div>
            </div>

            {/* Answer */}
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <div className="flex-1 space-y-2">
                {ANSWER_BLOCKS.map((block) => (
                  <div key={block.title} className="bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/30">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[11px] font-bold text-slate-200 leading-snug">{block.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${CHIP_COLORS[block.color]}`}>
                        [{block.citation.num}] p.{block.citation.page}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{block.body}</p>
                  </div>
                ))}
                {/* Follow-ups */}
                <div>
                  <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <CornerDownRight className="w-2.5 h-2.5" /> Follow-up
                  </p>
                  <div className="space-y-1">
                    {["What notice format is required?", "Is there a penalty for early termination?"].map((q) => (
                      <button key={q} className="w-full text-left text-[11px] text-slate-400 bg-slate-800/40 border border-slate-700/30 rounded-lg px-2.5 py-1.5 leading-snug">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="px-3 pb-5 pt-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl px-3.5 py-2.5">
              <input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask anything about this document…"
                className="flex-1 bg-transparent text-[13px] text-slate-200 placeholder:text-slate-500 outline-none"
              />
              <button className={`p-1.5 rounded-xl transition-colors ${inputVal.trim() ? "bg-violet-600 text-white" : "text-slate-600"}`}>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center pb-2 flex-shrink-0">
            <div className="w-24 h-1 bg-slate-700 rounded-full" />
          </div>
        </div>
      )}
    </div>
  )
}
