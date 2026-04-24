import { useState } from "react"
import {
  MessageSquare, ArrowLeft, FileText, Send, Sparkles,
  CornerDownRight, BookOpen, Calendar, AlertTriangle, ClipboardList,
  LocateFixed, ChevronUp,
} from "lucide-react"

const DOC_NAME = "Vendor_Agreement_2025.pdf"
const QUESTION = "What are the termination conditions?"

const PALETTE = {
  amber: { chip: "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40", page: "bg-amber-100 border-l-4 border-amber-500", badge: "text-amber-700 bg-amber-200" },
  red:   { chip: "bg-red-400/18 text-red-300 ring-1 ring-red-400/30",   page: "bg-red-100 border-l-4 border-red-500",   badge: "text-red-700 bg-red-200"   },
}

const ANSWER_BLOCKS = [
  { id: 1, title: "Termination for Convenience", body: "Either party may terminate with 30 days' written notice. No reason required.", citation: { num: 1, page: 4, label: "§ 11.1" }, color: "amber" as const },
  { id: 2, title: "Termination for Cause",        body: "Immediate termination on material breach uncured in 15 business days.",        citation: { num: 2, page: 6, label: "§ 11.2" }, color: "red" as const   },
]

const SUMMARY = "30 days' notice for convenience; immediate for cause. Obligations survive 3 years."

const SUGGESTED = [
  { icon: BookOpen,      label: "Summarize" },
  { icon: Calendar,      label: "Key Dates" },
  { icon: AlertTriangle, label: "Risks" },
  { icon: ClipboardList, label: "Obligations" },
]

function FakeLine({ w = "100%", dim = false }: { w?: string; dim?: boolean }) {
  return <div className={`h-[5px] rounded-full mb-1.5 ${dim ? "bg-slate-300/30" : "bg-slate-300/50"}`} style={{ width: w }} />
}

export default function AskThisDocumentMobile() {
  const [tab, setTab] = useState<"doc" | "ask">("ask")
  const [activeCitation, setActiveCitation] = useState<number | null>(null)
  const [inputVal, setInputVal] = useState("")
  const [jumpBanner, setJumpBanner] = useState<string | null>(null)

  function tapCitation(block: typeof ANSWER_BLOCKS[0]) {
    // Simulate jump-to-source: switch to doc tab, highlight section, show banner
    setActiveCitation(block.id)
    setTab("doc")
    setJumpBanner(`Jumped to ${block.citation.label} · Page ${block.citation.page}`)
    setTimeout(() => setJumpBanner(null), 2500)
  }

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

      {/* Jump-to-source banner — appears after citation tap */}
      {jumpBanner && (
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-600/90 text-white text-[11px] font-semibold flex-shrink-0 border-b border-violet-500/50">
          <LocateFixed className="w-3.5 h-3.5 flex-shrink-0" />
          {jumpBanner}
        </div>
      )}

      {/* Tab bar — clearer visual separation */}
      <div className="flex border-b border-slate-800 flex-shrink-0 bg-slate-900/40">
        {[
          { key: "doc" as const, icon: FileText,      label: "Document" },
          { key: "ask" as const, icon: MessageSquare, label: "Ask" },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold transition-all border-b-2 ${
              tab === key
                ? "border-violet-500 text-white bg-violet-500/8"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {/* Badge on Doc tab when a citation is active */}
            {key === "doc" && activeCitation !== null && tab !== "doc" && (
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full ml-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* ── DOCUMENT TAB ── */}
      {tab === "doc" && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Active source indicator */}
          {activeCitation !== null && (
            <div className={`flex items-center justify-between px-3 py-1.5 flex-shrink-0 border-b border-slate-800 ${
              ANSWER_BLOCKS.find((b) => b.id === activeCitation)?.color === "amber"
                ? "bg-amber-500/10"
                : "bg-red-500/10"
            }`}>
              <div className="flex items-center gap-1.5">
                <LocateFixed className={`w-3 h-3 ${activeCitation === 1 ? "text-amber-400" : "text-red-400"}`} />
                <span className="text-[11px] font-semibold text-slate-300">
                  {ANSWER_BLOCKS.find((b) => b.id === activeCitation)?.citation.label} · Page {ANSWER_BLOCKS.find((b) => b.id === activeCitation)?.citation.page}
                </span>
              </div>
              <button onClick={() => { setActiveCitation(null); setTab("ask") }} className="text-[10px] text-slate-500">
                Back to Ask
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-slate-950 py-4 px-4">
            {/* Doc page */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="h-2.5 w-24 bg-slate-400 rounded mb-1.5" />
                    <div className="h-1.5 w-16 bg-slate-300 rounded" />
                  </div>
                  <div className="h-2 w-10 bg-slate-200 rounded" />
                </div>
                <div className="h-2.5 w-36 bg-slate-500 rounded mb-3" />
                {[100, 95, 88, 100, 92].map((w, i) => (
                  <FakeLine key={i} w={`${w}%`} />
                ))}

                {/* Citation 1 highlight — amber */}
                <div className={`rounded-lg px-3 py-2.5 mt-2.5 mb-2 transition-all duration-500 ${
                  activeCitation === 1 ? "bg-amber-100 border-l-4 border-amber-500 shadow-amber-100/50 shadow-md" : "bg-amber-50 border-l-2 border-amber-300"
                }`}>
                  {activeCitation === 1 && (
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-full mb-1.5">
                      <LocateFixed className="w-2 h-2" /> [1] § 11.1 — Source
                    </div>
                  )}
                  <FakeLine w="100%" />
                  <FakeLine w="90%" dim />
                </div>

                {[100, 88, 76, 95].map((w, i) => <FakeLine key={i} w={`${w}%`} />)}

                {/* Citation 2 highlight — red */}
                <div className={`rounded-lg px-3 py-2.5 mt-2 mb-2 transition-all duration-500 ${
                  activeCitation === 2 ? "bg-red-100 border-l-4 border-red-500 shadow-md" : "bg-red-50 border-l-2 border-red-300"
                }`}>
                  {activeCitation === 2 && (
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-200 px-1.5 py-0.5 rounded-full mb-1.5">
                      <LocateFixed className="w-2 h-2" /> [2] § 11.2 — Source
                    </div>
                  )}
                  <FakeLine w="100%" />
                  <FakeLine w="85%" dim />
                </div>

                {[80, 70].map((w, i) => <FakeLine key={i} w={`${w}%`} dim />)}
                <div className="text-right mt-3">
                  <span className="text-[8px] text-slate-400">Page 4 of 14</span>
                </div>
              </div>
            </div>

            {/* Back to ask button */}
            <button
              onClick={() => setTab("ask")}
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/40 border border-slate-700/30 rounded-xl py-2.5 transition-all"
            >
              <ChevronUp className="w-3.5 h-3.5" /> Back to answers
            </button>
          </div>
        </div>
      )}

      {/* ── ASK TAB ── */}
      {tab === "ask" && (
        <div className="flex flex-col flex-1 min-h-0">

          {/* Quick actions */}
          <div className="flex gap-1.5 px-3 pt-2 pb-1.5 overflow-x-auto flex-shrink-0">
            {SUGGESTED.map(({ icon: Icon, label }) => (
              <button key={label} className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-700/30 whitespace-nowrap flex-shrink-0">
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {/* User question */}
            <div className="flex justify-end">
              <div className="bg-violet-600/90 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] text-white max-w-[80%] leading-relaxed">
                {QUESTION}
              </div>
            </div>

            {/* AI answer */}
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <div className="flex-1 space-y-2">

                {/* Summary */}
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-1">Summary</p>
                  <p className="text-[12px] text-slate-200 leading-relaxed font-medium">{SUMMARY}</p>
                </div>

                {/* Findings with citation chips — tap to jump */}
                {ANSWER_BLOCKS.map((block) => (
                  <div key={block.id} className="bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/30">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[11px] font-bold text-slate-200 leading-snug">{block.title}</p>
                      <button
                        onClick={() => tapCitation(block)}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 transition-all active:scale-95 ${PALETTE[block.color].chip}`}
                      >
                        [{block.citation.num}] {block.citation.label} · p.{block.citation.page}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{block.body}</p>
                    {/* Tap hint */}
                    <p className="text-[9px] text-slate-600 mt-1.5 flex items-center gap-1">
                      <LocateFixed className="w-2.5 h-2.5" /> Tap citation to jump to source
                    </p>
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
          <div className="px-3 pb-5 pt-2 flex-shrink-0 border-t border-slate-800/50">
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
