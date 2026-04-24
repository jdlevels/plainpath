import { useState } from "react"
import {
  MessageSquare, ArrowLeft, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Maximize2, FileText, Send, CornerDownRight, Sparkles, BookOpen,
  AlertTriangle, Calendar, ClipboardList, RefreshCcw, Copy, Download,
} from "lucide-react"

const DOC_NAME = "Master_Services_Agreement_v3.pdf"
const QUESTION = "What are the termination conditions in this agreement?"

const ANSWER_SECTIONS = [
  {
    id: 1,
    title: "Termination for Convenience",
    citation: { num: 1, page: 4 },
    body: "Either party may terminate this agreement at any time with 30 days' written notice to the other party. No reason is required for termination under this clause, and no penalties apply if proper notice is given.",
    highlight: "amber",
  },
  {
    id: 2,
    title: "Termination for Cause",
    citation: { num: 2, page: 6 },
    body: "Immediate termination is permitted if the other party materially breaches this agreement and fails to cure the breach within 15 business days of receiving written notice of the breach.",
    highlight: "red",
  },
  {
    id: 3,
    title: "Survival of Obligations",
    citation: { num: 3, page: 4 },
    body: "Sections relating to confidentiality, intellectual property, indemnification, and limitations of liability survive termination of this agreement for a period of 3 years.",
    highlight: "blue",
  },
]

const FOLLOWUPS = [
  "What happens to active projects at termination?",
  "Is there a penalty for early termination?",
  "What notice format is required?",
  "How does IP ownership work after termination?",
]

const QUICK_ACTIONS = [
  { icon: BookOpen,      label: "Summarize" },
  { icon: Calendar,      label: "Key Dates" },
  { icon: AlertTriangle, label: "Risks" },
  { icon: ClipboardList, label: "Obligations" },
]

const HIGHLIGHT_COLORS: Record<string, string> = {
  amber: "bg-amber-400/20 border-l-2 border-amber-400 ring-1 ring-amber-400/30",
  red:   "bg-red-400/15 border-l-2 border-red-400 ring-1 ring-red-400/20",
  blue:  "bg-blue-400/15 border-l-2 border-blue-400 ring-1 ring-blue-400/20",
}

const CHIP_COLORS: Record<string, string> = {
  amber: "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40",
  red:   "bg-red-400/15 text-red-300 ring-1 ring-red-400/30",
  blue:  "bg-blue-400/15 text-blue-300 ring-1 ring-blue-400/30",
}

function FakeLine({ w = "100%", dim = false }: { w?: string; dim?: boolean }) {
  return (
    <div
      className={`h-[7px] rounded-full mb-2 ${dim ? "bg-slate-700/50" : "bg-slate-600/60"}`}
      style={{ width: w }}
    />
  )
}

function FakeBlock({ lines = 3, dimLast = true }: { lines?: number; dimLast?: boolean }) {
  const widths = ["100%", "92%", "87%", "95%", "79%", "100%", "88%"]
  return (
    <div className="py-1">
      {Array.from({ length: lines }).map((_, i) => (
        <FakeLine key={i} w={widths[i % widths.length]} dim={dimLast && i === lines - 1} />
      ))}
    </div>
  )
}

function DocPage({ pageNum, activeHighlight }: { pageNum: number; activeHighlight: number | null }) {
  const isPage4 = pageNum === 4
  const isPage6 = pageNum === 6
  return (
    <div className="bg-white rounded shadow-xl mx-auto" style={{ width: "88%", minHeight: 340 }}>
      <div className="px-8 pt-7 pb-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="h-2.5 w-32 bg-slate-300 rounded mb-1.5" />
            <div className="h-2 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-2 w-16 bg-slate-200 rounded" />
        </div>

        <div className="h-3 w-48 bg-slate-400 rounded mb-4" />

        <FakeBlock lines={3} />

        {isPage4 && (
          <div className={`rounded px-3 py-2.5 my-3 transition-all duration-300 ${
            activeHighlight === 1
              ? "bg-amber-100 border-l-4 border-amber-500 shadow-amber-200/50 shadow-md"
              : activeHighlight === 3
              ? "bg-blue-100 border-l-4 border-blue-500 shadow-blue-200/50 shadow-md"
              : "bg-amber-50 border-l-2 border-amber-300"
          }`}>
            <div className="h-2 w-full bg-amber-400/60 rounded mb-1.5" />
            <div className="h-2 w-11/12 bg-amber-400/50 rounded mb-1.5" />
            <div className="h-2 w-3/4 bg-amber-400/40 rounded" />
            {activeHighlight === 1 && (
              <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-full">
                ① Source
              </div>
            )}
          </div>
        )}

        <FakeBlock lines={4} />

        {isPage4 && (
          <div className={`rounded px-3 py-2.5 my-3 transition-all ${
            activeHighlight === 3 ? "bg-blue-100 border-l-4 border-blue-500 shadow-md" : "bg-slate-50"
          }`}>
            <div className="h-2 w-full bg-slate-300 rounded mb-1.5" />
            <div className="h-2 w-10/12 bg-slate-300 rounded mb-1.5" />
            <div className="h-2 w-4/5 bg-slate-300 rounded" />
            {activeHighlight === 3 && (
              <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-200 px-1.5 py-0.5 rounded-full">
                ③ Source
              </div>
            )}
          </div>
        )}

        {isPage6 && (
          <div className={`rounded px-3 py-2.5 my-3 transition-all ${
            activeHighlight === 2 ? "bg-red-100 border-l-4 border-red-500 shadow-md" : "bg-red-50"
          }`}>
            <div className="h-2 w-full bg-red-300/70 rounded mb-1.5" />
            <div className="h-2 w-10/12 bg-red-300/60 rounded mb-1.5" />
            <div className="h-2 w-4/5 bg-red-300/50 rounded" />
            {activeHighlight === 2 && (
              <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-200 px-1.5 py-0.5 rounded-full">
                ② Source
              </div>
            )}
          </div>
        )}

        <FakeBlock lines={2} />

        <div className="text-right mt-4">
          <span className="text-[9px] text-slate-400 font-medium">Page {pageNum}</span>
        </div>
      </div>
    </div>
  )
}

function CitationChip({
  num, page, color, active, onClick,
}: { num: number; page: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all ${
        active ? CHIP_COLORS[color] + " scale-105" : "bg-slate-700/60 text-slate-400 hover:bg-slate-700"
      }`}
    >
      <span className="font-mono">①②③"[{num}]"</span>
      <span className="opacity-70">p.{page}</span>
    </button>
  )
}

export default function AskThisDocumentMain() {
  const [activeHighlight, setActiveHighlight] = useState<number | null>(1)
  const [inputVal, setInputVal] = useState("")
  const [currentPage, setCurrentPage] = useState(4)

  function clickCitation(num: number, page: number) {
    setActiveHighlight(num)
    setCurrentPage(page)
  }

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
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{DOC_NAME}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
            <RefreshCcw className="w-3.5 h-3.5" /> New Session
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left: Document Viewer ── */}
        <div className="flex flex-col border-r border-slate-800" style={{ width: "55%" }}>

          {/* Doc toolbar */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-500 w-10 text-center font-mono">100%</span>
              <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-400 font-mono">Page {currentPage} / 12</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(12, p + 1))}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                disabled={currentPage >= 12}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{DOC_NAME}</span>
            </div>
          </div>

          {/* PDF pages */}
          <div className="flex-1 overflow-y-auto bg-slate-950 py-5 space-y-5">
            {activeHighlight === 2 || currentPage === 6
              ? <DocPage pageNum={6} activeHighlight={activeHighlight} />
              : null
            }
            <DocPage pageNum={4} activeHighlight={activeHighlight} />
            {currentPage !== 6 && activeHighlight !== 2 && (
              <DocPage pageNum={5} activeHighlight={null} />
            )}
          </div>
        </div>

        {/* ── Right: Q&A Panel ── */}
        <div className="flex flex-col" style={{ width: "45%" }}>

          {/* Quick actions */}
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 flex-shrink-0">
            {QUICK_ACTIONS.map(({ icon: Icon, label }) => (
              <button key={label} className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-700/40">
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>

          {/* Asked question */}
          <div className="mx-4 mb-3 flex-shrink-0">
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-white">Y</span>
              </div>
              <div className="bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 leading-relaxed border border-slate-700/40 flex-1">
                {QUESTION}
              </div>
            </div>
          </div>

          {/* AI answer */}
          <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <div className="flex-1 space-y-2.5">
                {ANSWER_SECTIONS.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => clickCitation(section.citation.num, section.citation.page)}
                    className={`rounded-xl px-3.5 py-3 border transition-all cursor-pointer ${
                      activeHighlight === section.citation.num
                        ? HIGHLIGHT_COLORS[section.highlight]
                        : "border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-bold text-slate-200 leading-snug">{section.title}</p>
                      <button
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 transition-all ${CHIP_COLORS[section.highlight]}`}
                        onClick={(e) => { e.stopPropagation(); clickCitation(section.citation.num, section.citation.page) }}
                      >
                        [{section.citation.num}] p.{section.citation.page}
                      </button>
                    </div>
                    <p className="text-[12px] text-slate-300 leading-relaxed">{section.body}</p>
                  </div>
                ))}

                {/* Follow-ups */}
                <div className="pt-1">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CornerDownRight className="w-3 h-3" /> Follow-up questions
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {FOLLOWUPS.map((q) => (
                      <button key={q} className="text-left text-[12px] text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-slate-600/50 rounded-lg px-3 py-2 transition-all leading-snug">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-4 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5 focus-within:border-violet-500/50 transition-colors">
              <input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask another question about this document…"
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
    </div>
  )
}
