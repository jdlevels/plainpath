import { ScanSearch, ArrowLeft, ChevronDown, FileText, ZoomIn, ZoomOut,
  AlertCircle, BarChart2, Download, Sparkles, X, Check, Plus,
  AlignJustify, ChevronRight, ChevronUp } from "lucide-react"
import { useState } from "react"

const DIFFS = [
  { id: 1, sev: "high",   type: "Text Removed",   page: 3,  snippet: "Indemnification clause §12.4 removed in its entirety", ai: "Liability Shift" },
  { id: 2, sev: "high",   type: "Text Modified",  page: 5,  snippet: "Payment terms changed: NET-30 → NET-60", ai: "Payment Terms" },
  { id: 3, sev: "high",   type: "Text Added",     page: 7,  snippet: "Arbitration clause added, waiving jury trial rights", ai: "Dispute Resolution" },
  { id: 4, sev: "medium", type: "Text Modified",  page: 9,  snippet: "Governing law changed from New York to Delaware", ai: "Jurisdiction" },
  { id: 5, sev: "medium", type: "Text Added",     page: 11, snippet: "New IP assignment provision added in §8.2", ai: "IP Rights" },
  { id: 6, sev: "medium", type: "Layout Change",  page: 12, snippet: "Signature block layout restructured", ai: "Formatting" },
  { id: 7, sev: "low",    type: "Text Modified",  page: 14, snippet: "Company address updated to new headquarters", ai: "Administrative" },
  { id: 8, sev: "low",    type: "Text Modified",  page: 14, snippet: "Date updated from Jan 1 2024 → Mar 15 2024", ai: "Administrative" },
]

const SEV_CONFIG = {
  high:   { dot: "bg-red-500",    badge: "bg-red-950/60 text-red-300 border border-red-800/50",    label: "High Risk" },
  medium: { dot: "bg-amber-400",  badge: "bg-amber-950/60 text-amber-300 border border-amber-800/50", label: "Medium" },
  low:    { dot: "bg-slate-500",  badge: "bg-slate-800 text-slate-400 border border-slate-700",     label: "Low" },
}

export function CommandCenter() {
  const [selected, setSelected] = useState(1)
  const [collapsed, setCollapsed] = useState(false)
  const sel = DIFFS.find(d => d.id === selected)!

  const high   = DIFFS.filter(d => d.sev === "high").length
  const medium = DIFFS.filter(d => d.sev === "medium").length
  const low    = DIFFS.filter(d => d.sev === "low").length

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top Command Bar ── */}
      <div className="flex-none flex items-center gap-3 px-4 h-12 bg-slate-900 border-b border-slate-800 shadow-md z-10">
        <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>My Comparisons</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-300 font-medium">MSA v3 vs v4</span>
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">AI Enhanced</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-100 px-2.5 py-1.5 rounded-md hover:bg-slate-800 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="flex items-center gap-1.5 text-[11px] font-medium bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-md transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> AI Summary
          </button>
        </div>
      </div>

      {/* ── Sub-header: Doc Names + Stats ── */}
      <div className="flex-none flex items-center gap-4 px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/60 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 rounded bg-blue-900/60 flex items-center justify-center flex-shrink-0">
            <FileText className="w-3 h-3 text-blue-400" />
          </div>
          <span className="text-slate-400 truncate">MSA_Original_v3.pdf</span>
          <span className="text-slate-600">·</span>
          <div className="w-5 h-5 rounded bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
            <FileText className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="text-slate-400 truncate">MSA_Revised_v4.pdf</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /><span className="text-slate-300">{high} high</span></span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /><span className="text-slate-300">{medium} medium</span></span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /><span className="text-slate-300">{low} low</span></span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">{DIFFS.length} total</span>
        </div>
      </div>

      {/* ── Main workspace ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar: Diff Navigator ── */}
        <div className={`flex-none flex flex-col border-r border-slate-800 bg-slate-900/60 transition-all ${collapsed ? "w-10" : "w-72"}`}>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} className="flex flex-col items-center gap-4 py-4 text-slate-500 hover:text-slate-200 transition-colors">
              <AlignJustify className="w-4 h-4" />
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Changes</span>
                <button onClick={() => setCollapsed(true)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>

              {/* Severity groups */}
              <div className="flex-1 overflow-y-auto py-1 space-y-0.5 text-xs scrollbar-thin">
                {(["high", "medium", "low"] as const).map(sev => {
                  const items = DIFFS.filter(d => d.sev === sev)
                  if (!items.length) return null
                  const cfg = SEV_CONFIG[sev]
                  return (
                    <div key={sev}>
                      <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500 uppercase tracking-widest text-[9px] font-bold mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        {cfg.label} · {items.length}
                      </div>
                      {items.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setSelected(d.id)}
                          className={`w-full text-left px-3 py-2.5 transition-colors border-l-2 ${
                            selected === d.id
                              ? sev === "high" ? "border-red-500 bg-red-950/20 text-slate-100"
                              : sev === "medium" ? "border-amber-400 bg-amber-950/10 text-slate-100"
                              : "border-slate-500 bg-slate-800/40 text-slate-100"
                              : "border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-0.5">
                            <span className="font-medium text-[11px] leading-tight flex-1">{d.type}</span>
                            <span className="text-[10px] text-slate-500 flex-shrink-0">p.{d.page}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug truncate">{d.snippet}</p>
                          {d.ai && (
                            <span className={`inline-flex items-center gap-0.5 mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                              <Sparkles className="w-2 h-2" /> {d.ai}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Notes input */}
              <div className="border-t border-slate-800 p-3">
                <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <BarChart2 className="w-3 h-3" /> Audit Notes
                </div>
                <textarea
                  className="w-full h-16 text-xs bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-2 text-slate-300 placeholder:text-slate-600 resize-none outline-none focus:border-violet-500/50 transition-colors"
                  placeholder="Add internal notes…"
                  defaultValue=""
                />
              </div>
            </>
          )}
        </div>

        {/* ── Split PDF View ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* PDF pane header */}
          <div className="flex-none grid grid-cols-2 divide-x divide-slate-800 border-b border-slate-800">
            {[
              { label: "Original — v3", color: "text-blue-400", accent: "border-blue-600/60" },
              { label: "Revised — v4",  color: "text-emerald-400", accent: "border-emerald-600/60" },
            ].map((pane, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-2 border-t-2 ${pane.accent}`}>
                <span className={`text-[11px] font-bold ${pane.color}`}>{pane.label}</span>
                <div className="flex items-center gap-1 text-slate-500">
                  <button className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"><ZoomOut className="w-3 h-3" /></button>
                  <span className="text-[10px] w-8 text-center">100%</span>
                  <button className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"><ZoomIn className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* PDF mock pages */}
          <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800 overflow-hidden">
            {/* Left — Original */}
            <div className="overflow-y-auto p-6 bg-slate-950">
              <div className="max-w-sm mx-auto space-y-3">
                <MockPage side="original" selectedDiff={sel} />
              </div>
            </div>
            {/* Right — Revised */}
            <div className="overflow-y-auto p-6 bg-slate-950">
              <div className="max-w-sm mx-auto space-y-3">
                <MockPage side="revised" selectedDiff={sel} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: Selected diff detail ── */}
        <div className="flex-none w-64 border-l border-slate-800 bg-slate-900/60 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Detail</span>
            <span className="text-[10px] text-slate-500">p.{sel.page}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Change Type</div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${SEV_CONFIG[sel.sev as keyof typeof SEV_CONFIG].badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${SEV_CONFIG[sel.sev as keyof typeof SEV_CONFIG].dot}`} />
                {sel.sev.toUpperCase()} · {sel.type}
              </span>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">AI Category</div>
              <span className="flex items-center gap-1 text-[11px] text-violet-300">
                <Sparkles className="w-3 h-3" /> {sel.ai}
              </span>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Summary</div>
              <p className="text-slate-300 leading-relaxed text-[11px]">{sel.snippet}</p>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Watchlist</div>
              <button className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-colors">
                <Plus className="w-3 h-3" /> Add to watchlist
              </button>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Severity Override</div>
              <div className="flex gap-1.5">
                {(["high", "medium", "low"] as const).map(s => (
                  <button key={s} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                    sel.sev === s ? SEV_CONFIG[s].badge : "border-slate-700 text-slate-600 hover:border-slate-600"
                  }`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockPage({ side, selectedDiff }: { side: "original" | "revised"; selectedDiff: typeof DIFFS[0] }) {
  const isOrig = side === "original"
  return (
    <div className="bg-white rounded shadow-xl text-slate-900 p-6 text-[10px] leading-relaxed space-y-3 min-h-96">
      <div className="text-center text-[11px] font-bold text-slate-700 border-b border-slate-200 pb-3 mb-3">
        {isOrig ? "Master Services Agreement — v3.0" : "Master Services Agreement — v4.0"}
      </div>
      <div className="space-y-2">
        <p className="text-slate-600">This Master Services Agreement ("Agreement") is entered into as of the Effective Date between the parties identified below.</p>
        {selectedDiff.sev === "high" && (
          <div className={`border-l-4 px-3 py-2 rounded-r ${
            isOrig ? "border-red-500 bg-red-50 line-through text-red-700" : "border-emerald-500 bg-emerald-50 text-emerald-800"
          }`}>
            {isOrig
              ? "§12.4 — Each party shall indemnify and hold harmless the other party from any claims arising from its own negligence."
              : "§12.4 — [REMOVED — Indemnification clause omitted in revised draft]"}
          </div>
        )}
        <p className="text-slate-600">Payment terms and conditions apply as set forth in Schedule A, which is incorporated herein by reference.</p>
        {selectedDiff.sev === "high" && selectedDiff.id === 2 && (
          <div className={`border-l-4 px-3 py-2 rounded-r ${
            isOrig ? "border-blue-400 bg-blue-50 text-blue-800" : "border-amber-400 bg-amber-50 text-amber-800"
          }`}>
            {isOrig ? "Payment due within NET-30 days of invoice." : "Payment due within NET-60 days of invoice."}
          </div>
        )}
        <p className="text-slate-600">This Agreement shall be governed by the laws of the State of New York without regard to its conflict of law provisions.</p>
        <p className="text-slate-600">All disputes shall be resolved through good-faith negotiation between senior representatives of each party.</p>
        <p className="text-slate-500 text-[9px] mt-6 pt-3 border-t border-slate-100 text-center">Page 3 of 18</p>
      </div>
    </div>
  )
}
