import { useState } from "react"
import {
  MessageSquare, Upload, FileText, ArrowLeft, Send, Sparkles,
  Calendar, AlertTriangle, ClipboardList, BookOpen, ChevronRight,
  CornerDownRight, CheckCircle2,
} from "lucide-react"

const EXAMPLE_QUESTIONS = [
  "What are my obligations under this contract?",
  "When does this agreement expire?",
  "What are the payment terms?",
  "What happens if I miss a deadline?",
  "Who owns the intellectual property?",
  "What are the termination conditions?",
]

const SUGGESTED_PROMPTS = [
  { icon: BookOpen,      label: "Summarize this document",        sub: "Plain English overview"               },
  { icon: Calendar,      label: "What are the key dates?",        sub: "Deadlines, renewals, expirations"     },
  { icon: AlertTriangle, label: "What are the risks?",            sub: "Clauses that could hurt you"          },
  { icon: ClipboardList, label: "What do I need to do next?",     sub: "Your obligations and actions"         },
  { icon: CheckCircle2,  label: "What rights do I have?",         sub: "Entitlements under this agreement"    },
  { icon: Sparkles,      label: "Explain in plain English",       sub: "Remove the legal jargon"              },
]

const DOC_NAME = "Vendor_Agreement_2025.pdf"
const DOC_PAGES = 14
const DOC_SIZE = "1.2 MB"

function FakeLine({ w = "100%", dim = false }: { w?: string; dim?: boolean }) {
  return <div className={`h-[6px] rounded-full mb-1.5 ${dim ? "bg-slate-200/40" : "bg-slate-300/60"}`} style={{ width: w }} />
}

function MiniDocPreview() {
  return (
    <div className="bg-white rounded-lg shadow-lg mx-auto overflow-hidden" style={{ width: "90%" }}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="h-2.5 w-28 bg-slate-400 rounded mb-1.5" />
            <div className="h-1.5 w-20 bg-slate-300 rounded" />
          </div>
          <div className="h-2 w-12 bg-slate-200 rounded" />
        </div>
        <div className="h-2.5 w-40 bg-slate-500 rounded mb-3" />
        {[100, 95, 88, 100, 92, 78, 95, 82].map((w, i) => (
          <FakeLine key={i} w={`${w}%`} dim={i > 5} />
        ))}
        <div className="mt-3 bg-amber-50 border-l-2 border-amber-400 rounded px-2.5 py-2">
          <FakeLine w="100%" />
          <FakeLine w="92%" dim />
        </div>
        {[100, 88, 75].map((w, i) => (
          <FakeLine key={i} w={`${w}%`} />
        ))}
        <div className="text-right mt-3">
          <span className="text-[8px] text-slate-400">Page 1 of {DOC_PAGES}</span>
        </div>
      </div>
    </div>
  )
}

export default function AskThisDocumentEmpty() {
  const [mode, setMode] = useState<"empty" | "loaded">("empty")
  const [dragging, setDragging] = useState(false)
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
            <p className="text-[11px] text-slate-500 font-medium">Source-backed answers from any document</p>
          </div>
        </div>
        {/* State toggle for mockup */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {(["empty", "loaded"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-md transition-all capitalize ${
                mode === m ? "bg-slate-600 text-slate-100" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {mode === "empty" && (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-lg text-center space-y-6">

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mx-auto">
              <MessageSquare className="w-7 h-7 text-violet-400" />
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-2xl font-bold text-slate-100 mb-2">Ask This Document</h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                Upload any document and ask it questions in plain English.
                Every answer is traced back to the exact source — no guessing.
              </p>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); setMode("loaded") }}
              onClick={() => setMode("loaded")}
              className={`border-2 border-dashed rounded-2xl px-8 py-10 cursor-pointer transition-all ${
                dragging
                  ? "border-violet-400 bg-violet-500/10"
                  : "border-slate-700 hover:border-violet-500/50 hover:bg-violet-500/5"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors ${
                dragging ? "bg-violet-500/20" : "bg-slate-800"
              }`}>
                <Upload className={`w-6 h-6 transition-colors ${dragging ? "text-violet-400" : "text-slate-500"}`} />
              </div>
              <p className="text-sm font-semibold text-slate-300 mb-1">
                {dragging ? "Drop to upload" : "Drag and drop, or click to upload"}
              </p>
              <p className="text-xs text-slate-500">PDF, DOCX, or TXT · up to 50 MB</p>
            </div>

            {/* Example questions */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Example questions you can ask</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    className="text-[12px] text-slate-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-full px-3.5 py-1.5 transition-all"
                    onClick={() => setMode("loaded")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
              <CheckCircle2 className="w-3 h-3" />
              Answers stay within the document — no external data is used
            </div>
          </div>
        </div>
      )}

      {/* ── LOADED STATE (document uploaded, suggested questions) ── */}
      {mode === "loaded" && (
        <div className="flex flex-1 min-h-0">

          {/* Left: compact doc viewer */}
          <div className="flex flex-col border-r border-slate-800 overflow-hidden" style={{ width: "52%" }}>
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/60 border-b border-slate-800 flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[12px] text-slate-400 font-medium truncate flex-1">{DOC_NAME}</span>
              <span className="text-[10px] text-slate-600">{DOC_PAGES} pages · {DOC_SIZE}</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-950 py-4">
              <MiniDocPreview />
            </div>
          </div>

          {/* Right: guided Q&A panel */}
          <div className="flex flex-col" style={{ width: "48%" }}>

            {/* Welcome message */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-200 mb-0.5">Document loaded. What would you like to know?</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">I've read {DOC_NAME}. Try one of these questions or write your own.</p>
                </div>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CornerDownRight className="w-3 h-3" /> Suggested questions
              </p>
              {SUGGESTED_PROMPTS.map(({ icon: Icon, label, sub }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-3 text-left px-3.5 py-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 hover:border-violet-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-700/60 group-hover:bg-violet-500/15 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-300 group-hover:text-slate-100">{label}</p>
                    <p className="text-[10px] text-slate-500">{sub}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div className="px-4 pb-4 flex-shrink-0">
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5 focus-within:border-violet-500/50 transition-colors">
                <input
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask anything about this document…"
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
                />
                <button className={`p-1.5 rounded-lg transition-colors ${inputVal.trim() ? "text-violet-400 hover:bg-violet-500/20" : "text-slate-600"}`}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-1.5">Answers are based only on this document · Always verify critical details</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
