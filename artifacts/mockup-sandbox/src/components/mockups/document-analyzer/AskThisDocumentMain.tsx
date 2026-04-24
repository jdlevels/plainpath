import { useState } from "react"
import {
  MessageSquare, ArrowLeft, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Maximize2, FileText, Send, CornerDownRight, Sparkles, BookOpen,
  AlertTriangle, Calendar, ClipboardList, Copy, Download, RefreshCcw,
  Minimize2, LocateFixed,
} from "lucide-react"

const DOC_NAME = "Master_Services_Agreement_v3.pdf"
const QUESTION = "What are the termination conditions in this agreement?"

// Colour palette
const PALETTE = {
  amber: {
    chip:      "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40",
    block:     "border-amber-500/30 bg-amber-500/8",
    highlight: "bg-amber-400/18 border-l-2 border-amber-400",
    page:      "bg-amber-100 border-l-4 border-amber-500",
    badge:     "text-amber-700 bg-amber-200",
  },
  red: {
    chip:      "bg-red-400/20 text-red-300 ring-1 ring-red-400/30",
    block:     "border-red-500/25 bg-red-500/6",
    highlight: "bg-red-400/15 border-l-2 border-red-400",
    page:      "bg-red-100 border-l-4 border-red-500",
    badge:     "text-red-700 bg-red-200",
  },
  blue: {
    chip:      "bg-blue-400/20 text-blue-300 ring-1 ring-blue-400/30",
    block:     "border-blue-500/25 bg-blue-500/6",
    highlight: "bg-blue-400/15 border-l-2 border-blue-400",
    page:      "bg-blue-100 border-l-4 border-blue-500",
    badge:     "text-blue-700 bg-blue-200",
  },
}

const SUMMARY =
  "This agreement allows either party to terminate with 30 days' notice for any reason. Immediate termination is available for material breach (uncured in 15 days). Key obligations survive termination for 3 years."

const FINDINGS = [
  {
    id: 1,
    title: "Termination for Convenience",
    body: "Either party may terminate this agreement at any time with 30 days' written notice. No reason required — no penalties apply if proper notice is given.",
    citation: { num: 1, page: 4, label: "§ 11.1 Termination" },
    color: "amber" as const,
  },
  {
    id: 2,
    title: "Termination for Cause",
    body: "Immediate termination is permitted if the other party materially breaches this agreement and fails to cure within 15 business days of written notice.",
    citation: { num: 2, page: 6, label: "§ 11.2 Cause" },
    color: "red" as const,
  },
  {
    id: 3,
    title: "Survival of Obligations",
    body: "Confidentiality, IP, indemnification, and liability limitations survive termination for 3 years.",
    citation: { num: 3, page: 4, label: "§ 11.4 Survival" },
    color: "blue" as const,
  },
]

const FOLLOWUPS = [
  "What happens to active projects at termination?",
  "What notice format is required — email or letter?",
  "Is there a penalty for early termination?",
  "How does IP ownership work after termination?",
]

const QUICK_ACTIONS = [
  { icon: BookOpen,      label: "Summarize" },
  { icon: Calendar,      label: "Key Dates" },
  { icon: AlertTriangle, label: "Risks" },
  { icon: ClipboardList, label: "Obligations" },
]

function FakeLine({ w = "100%", dim = false }: { w?: string; dim?: boolean }) {
  return <div className={`h-[6px] rounded-full mb-1.5 ${dim ? "bg-slate-200/35" : "bg-slate-200/55"}`} style={{ width: w }} />
}

function FakeBlock({ lines = 3, dimLast = true }: { lines?: number; dimLast?: boolean }) {
  const widths = ["100%", "93%", "87%", "96%", "80%", "100%", "88%"]
  return (
    <div className="py-1">
      {Array.from({ length: lines }).map((_, i) => (
        <FakeLine key={i} w={widths[i % widths.length]} dim={dimLast && i === lines - 1} />
      ))}
    </div>
  )
}

function DocPage({
  pageNum,
  activeHighlight,
}: {
  pageNum: number
  activeHighlight: number | null
}) {
  const finding = FINDINGS.find((f) => f.citation.page === pageNum && f.id === activeHighlight)
  const otherFindings = FINDINGS.filter((f) => f.citation.page === pageNum && f.id !== activeHighlight)

  return (
    <div className="bg-white rounded shadow-xl mx-auto" style={{ width: "90%" }}>
      <div className="px-7 pt-6 pb-5">
        {/* Doc header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="h-2.5 w-32 bg-slate-400 rounded mb-1.5" />
            <div className="h-1.5 w-20 bg-slate-200 rounded" />
          </div>
          <div className="text-[9px] text-slate-400 font-medium">{DOC_NAME}</div>
        </div>
        <div className="h-3 w-48 bg-slate-500 rounded mb-3" />

        <FakeBlock lines={3} />

        {/* Active highlighted finding */}
        {finding && (
          <div className={`rounded-lg px-3 py-2.5 my-3 shadow-sm transition-all ${PALETTE[finding.color].page}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${PALETTE[finding.color].badge}`}>
                [{finding.id}] {finding.citation.label}
              </span>
              <LocateFixed className="w-3 h-3 text-slate-400" />
            </div>
            <div className="h-[5px] w-full rounded bg-current opacity-30 mb-1.5" />
            <div className="h-[5px] w-10/12 rounded bg-current opacity-25 mb-1.5" />
            <div className="h-[5px] w-3/4 rounded bg-current opacity-20" />
          </div>
        )}

        {/* Other findings on this page — dimmer */}
        {otherFindings.map((f) => (
          <div key={f.id} className={`rounded px-2.5 py-2 my-2 opacity-50 ${PALETTE[f.color].highlight}`}>
            <div className="h-[5px] w-full bg-slate-400 rounded mb-1" />
            <div className="h-[5px] w-4/5 bg-slate-400 rounded opacity-60" />
          </div>
        ))}

        <FakeBlock lines={4} dimLast />

        <div className="text-right mt-3">
          <span className="text-[9px] text-slate-400 font-medium">Page {pageNum}</span>
        </div>
      </div>
    </div>
  )
}

export default function AskThisDocumentMain() {
  const [activeHighlight, setActiveHighlight] = useState<number | null>(1)
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null)
  const [inputVal, setInputVal] = useState("")
  const [currentPage, setCurrentPage] = useState(4)
  const [zoom, setZoom] = useState(100)

  function clickCitation(id: number, page: number) {
    setActiveHighlight(id)
    setCurrentPage(page)
  }

  const activeFinding = FINDINGS.find((f) => f.id === activeHighlight)

  return (
    <div
      className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* ── Header ── */}
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
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[220px]">{DOC_NAME}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <button className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="flex items-center gap-1.5 text-[12px] bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
            <RefreshCcw className="w-3.5 h-3.5" /> New Session
          </button>
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left: Document Viewer ── */}
        <div className="flex flex-col border-r border-slate-800" style={{ width: "54%" }}>

          {/* Strengthened viewer toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex-shrink-0">
            {/* Zoom */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-500 w-9 text-center font-mono">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-4 bg-slate-700/70" />

            {/* Page controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-400 font-mono w-14 text-center">
                {currentPage} / 12
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(12, p + 1))}
                disabled={currentPage >= 12}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-4 bg-slate-700/70" />

            {/* Fit controls */}
            <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400" title="Fit width">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400" title="Fit page">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1" />

            {/* Active source indicator */}
            {activeFinding && (
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${PALETTE[activeFinding.color].chip}`}>
                <LocateFixed className="w-3 h-3" />
                [{activeFinding.id}] p.{activeFinding.citation.page}
              </div>
            )}

            <FileText className="w-3.5 h-3.5 text-slate-600 ml-1" />
          </div>

          {/* PDF canvas */}
          <div className="flex-1 overflow-y-auto bg-slate-950 py-5 space-y-5">
            {/* Show page 6 when citation 2 is active */}
            {(activeHighlight === 2 || currentPage === 6) && (
              <DocPage pageNum={6} activeHighlight={activeHighlight} />
            )}
            <DocPage pageNum={4} activeHighlight={activeHighlight} />
            {activeHighlight !== 2 && currentPage !== 6 && (
              <DocPage pageNum={5} activeHighlight={null} />
            )}
          </div>
        </div>

        {/* ── Right: Q&A Panel ── */}
        <div className="flex flex-col" style={{ width: "46%" }}>

          {/* Quick actions row */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-2 flex-shrink-0 border-b border-slate-800/50">
            {QUICK_ACTIONS.map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-700/30"
              >
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>

          {/* Question bubble */}
          <div className="mx-4 mt-3 mb-2.5 flex-shrink-0">
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white">Y</div>
              <div className="bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-200 border border-slate-700/40 leading-relaxed">
                {QUESTION}
              </div>
            </div>
          </div>

          {/* ── Answer: three-tier hierarchy ── */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <div className="flex-1 space-y-3">

                {/* ① SUMMARY — most prominent, sits at top */}
                <div className="rounded-xl border border-violet-500/25 bg-violet-500/8 px-4 py-3.5">
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">Summary</p>
                  <p className="text-[13px] text-slate-200 leading-relaxed font-medium">{SUMMARY}</p>
                </div>

                {/* ② SOURCE-BACKED FINDINGS */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest flex items-center gap-1.5 px-0.5">
                    Source findings
                  </p>
                  {FINDINGS.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => clickCitation(f.id, f.citation.page)}
                      className={`rounded-xl px-3.5 py-3 border cursor-pointer transition-all ${
                        activeHighlight === f.id
                          ? PALETTE[f.color].block + " border-opacity-100 shadow-sm"
                          : "border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-[12px] font-bold text-slate-200 leading-snug">{f.title}</p>
                        {/* Citation chip with hover source preview */}
                        <div className="relative flex-shrink-0">
                          <button
                            onMouseEnter={() => setHoveredCitation(f.id)}
                            onMouseLeave={() => setHoveredCitation(null)}
                            onClick={(e) => { e.stopPropagation(); clickCitation(f.id, f.citation.page) }}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${PALETTE[f.color].chip}`}
                          >
                            [{f.id}] {f.citation.label} · p.{f.citation.page}
                          </button>

                          {/* Source preview popover on hover */}
                          {hoveredCitation === f.id && (
                            <div className="absolute right-0 top-7 z-50 w-52 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-3">
                              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${PALETTE[f.color].chip.split(" ")[1]}`}>
                                {f.citation.label} · Page {f.citation.page}
                              </p>
                              <div className={`rounded px-2 py-1.5 mb-1.5 ${PALETTE[f.color].highlight}`}>
                                <div className="h-[5px] w-full bg-slate-400 rounded mb-1 opacity-60" />
                                <div className="h-[5px] w-4/5 bg-slate-400 rounded opacity-40" />
                              </div>
                              <p className="text-[10px] text-slate-500">Click to jump to source in document →</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-300 leading-relaxed">{f.body}</p>
                    </div>
                  ))}
                </div>

                {/* ③ FOLLOW-UPS — bottom */}
                <div className="pt-1">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CornerDownRight className="w-3 h-3" /> Follow-up questions
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {FOLLOWUPS.map((q) => (
                      <button
                        key={q}
                        className="text-left text-[12px] text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-slate-600/50 rounded-lg px-3 py-2 transition-all leading-snug"
                      >
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
              <button
                className={`p-1.5 rounded-lg transition-colors ${inputVal.trim() ? "text-violet-400 hover:bg-violet-500/20" : "text-slate-600"}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-1.5">
              Answers cite exact pages · Always verify critical details
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
