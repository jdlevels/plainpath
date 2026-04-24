import { useState } from "react"
import {
  MessageSquare, Upload, FileText, ArrowLeft, Send, Sparkles,
  Calendar, AlertTriangle, ClipboardList, BookOpen, ChevronRight,
  CornerDownRight, CheckCircle2, DollarSign, Clock,
} from "lucide-react"

const EXAMPLE_QUESTIONS = [
  "What are my obligations?",
  "When does this expire?",
  "What are the payment terms?",
  "What happens if I miss a deadline?",
  "Who owns the IP?",
  "What are the termination conditions?",
  "What fees apply?",
  "What is the renewal process?",
]

const SUGGESTED_PROMPTS = [
  { icon: BookOpen,      label: "Summarize this document",        sub: "Plain English overview"               },
  { icon: Calendar,      label: "What are the key dates?",        sub: "Deadlines, renewals, expirations"     },
  { icon: AlertTriangle, label: "What are the risks?",            sub: "Clauses that could hurt you"          },
  { icon: ClipboardList, label: "What do I need to do next?",     sub: "Your obligations and actions"         },
  { icon: DollarSign,    label: "What are the fees and costs?",   sub: "Payments, penalties, and charges"     },
  { icon: Clock,         label: "What are the notice periods?",   sub: "Timing requirements and windows"      },
]

const DOC_NAME = "Vendor_Agreement_2025.pdf"
const DOC_PAGES = 14
const DOC_SIZE = "1.2 MB"

function FakeLine({ w = "100%", dim = false }: { w?: string; dim?: boolean }) {
  return <div className={`h-[5px] rounded-full mb-1.5 ${dim ? "bg-slate-300/35" : "bg-slate-300/55"}`} style={{ width: w }} />
}

function MiniDocPreview() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="h-2.5 w-28 bg-slate-400 rounded mb-1.5" />
            <div className="h-1.5 w-20 bg-slate-300 rounded" />
          </div>
          <div className="h-2 w-12 bg-slate-200 rounded" />
        </div>
        <div className="h-2.5 w-40 bg-slate-500 rounded mb-3" />
        {[100, 95, 88, 100, 92, 78, 95, 82, 100, 88].map((w, i) => (
          <FakeLine key={i} w={`${w}%`} dim={i > 7} />
        ))}
        <div className="mt-2.5 bg-amber-50 border-l-2 border-amber-400 rounded px-2.5 py-2">
          <FakeLine w="100%" />
          <FakeLine w="90%" dim />
        </div>
        {[100, 85, 72].map((w, i) => (
          <FakeLine key={i} w={`${w}%`} />
        ))}
        <div className="text-right mt-3">
          <span className="text-[8px] text-slate-400 font-medium">Page 1 of {DOC_PAGES}</span>
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
            <p className="text-[11px] text-slate-500 font-medium">Source-backed answers · one document at a time</p>
          </div>
        </div>
        {/* State toggle */}
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
        <div className="flex-1 overflow-y-auto flex flex-col px-8 py-6 max-w-xl mx-auto w-full">

          {/* Title — compact, above the fold */}
          <div className="mb-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-violet-400" />
              </div>
              <h1 className="text-lg font-bold text-slate-100">Ask This Document</h1>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              Ask about dates, obligations, risks, fees, renewal terms, deadlines, or next steps.
            </p>
          </div>

          {/* Upload zone — high on the page */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); setMode("loaded") }}
            onClick={() => setMode("loaded")}
            className={`border-2 border-dashed rounded-2xl px-6 py-8 cursor-pointer transition-all mb-5 ${
              dragging
                ? "border-violet-400 bg-violet-500/10"
                : "border-slate-700 hover:border-violet-500/40 hover:bg-violet-500/5"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                dragging ? "bg-violet-500/25" : "bg-slate-800"
              }`}>
                <Upload className={`w-5 h-5 transition-colors ${dragging ? "text-violet-400" : "text-slate-500"}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200 mb-0.5">
                  {dragging ? "Drop to upload" : "Drop a document here, or click to browse"}
                </p>
                <p className="text-[12px] text-slate-500">PDF, DOCX, or TXT · up to 50 MB</p>
              </div>
            </div>
          </div>

          {/* Example questions — tight chip grid */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">Try asking</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setMode("loaded")}
                  className="text-[11px] text-slate-400 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/60 hover:border-slate-600 rounded-full px-2.5 py-1 transition-all leading-none"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Trust strip */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-800">
            {[
              { icon: CheckCircle2, text: "Answers sourced from your document only" },
              { icon: CheckCircle2, text: "No external data used" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Icon className="w-3 h-3 flex-shrink-0" />{text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LOADED STATE ── */}
      {mode === "loaded" && (
        <div className="flex flex-1 min-h-0">

          {/* Left: compact doc viewer */}
          <div className="flex flex-col border-r border-slate-800 overflow-hidden" style={{ width: "50%" }}>
            {/* Viewer bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border-b border-slate-800 flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="text-[12px] text-slate-400 font-medium truncate flex-1">{DOC_NAME}</span>
              <span className="text-[10px] text-slate-600 flex-shrink-0">{DOC_PAGES}pp · {DOC_SIZE}</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-950 py-4 px-3">
              <MiniDocPreview />
            </div>
          </div>

          {/* Right: guided panel */}
          <div className="flex flex-col" style={{ width: "50%" }}>

            {/* AI welcome */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-200 mb-0.5">Document ready. What would you like to know?</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    I've read <span className="text-slate-400 font-medium">{DOC_NAME}</span> ({DOC_PAGES} pages). Try a prompt or write your own.
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CornerDownRight className="w-3 h-3" /> Suggested questions
              </p>
              {SUGGESTED_PROMPTS.map(({ icon: Icon, label, sub }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 hover:border-violet-500/30 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-700/60 group-hover:bg-violet-500/15 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-300 group-hover:text-slate-100 leading-tight">{label}</p>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{sub}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div className="px-4 pb-4 pt-2 flex-shrink-0">
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
              <p className="text-[10px] text-slate-600 text-center mt-1.5">Answers cite exact pages from this document</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
