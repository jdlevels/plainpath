import { ArrowLeft, FileText, ScanSearch, Sparkles, Download, ChevronRight,
  AlertCircle, CheckCircle2, Info, ZoomIn, ZoomOut, BarChart2, Plus,
  ChevronDown, ChevronUp, X } from "lucide-react"
import { useState } from "react"

const CHANGES = [
  { id: 1, sev: "high",   type: "Indemnification Removed",      page: 3,  short: "§12.4 deleted",                 ai: "Liability Shift",    orig: "§12.4 — Each party shall indemnify and hold harmless the other from claims arising from its own negligence.", revised: null },
  { id: 2, sev: "high",   type: "Payment Terms Extended",       page: 5,  short: "NET-30 → NET-60",               ai: "Payment Terms",      orig: "Payment due within NET-30 days.",        revised: "Payment due within NET-60 days." },
  { id: 3, sev: "high",   type: "Arbitration Clause Added",     page: 7,  short: "Jury trial waived",             ai: "Dispute Resolution", orig: null,                                      revised: "All disputes shall be resolved by binding arbitration. Each party waives its right to a jury trial." },
  { id: 4, sev: "medium", type: "Governing Law Changed",        page: 9,  short: "NY → Delaware",                ai: "Jurisdiction",       orig: "Governed by New York law.",              revised: "Governed by Delaware law." },
  { id: 5, sev: "medium", type: "IP Assignment Added",          page: 11, short: "§8.2 inserted",                ai: "IP Rights",          orig: null,                                      revised: "All work product created by Service Provider is assigned to Client upon delivery and full payment." },
  { id: 6, sev: "low",    type: "Company Address Updated",      page: 14, short: "New HQ address",               ai: "Administrative",     orig: "123 Main St, New York, NY 10001",        revised: "456 Corporate Blvd, Wilmington, DE 19801" },
]

const SEV = {
  high:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    dot: "bg-red-500",    pill: "bg-red-100 text-red-700 border border-red-200" },
  medium: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400",  pill: "bg-amber-100 text-amber-700 border border-amber-200" },
  low:    { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-500",  dot: "bg-slate-400",  pill: "bg-slate-100 text-slate-600 border border-slate-200" },
}

export function CleanReader() {
  const [selected, setSelected] = useState<number | null>(1)
  const [showSummary, setShowSummary] = useState(false)
  const sel = selected !== null ? CHANGES.find(c => c.id === selected) : null

  const high = CHANGES.filter(c => c.sev === "high").length
  const medium = CHANGES.filter(c => c.sev === "medium").length
  const low = CHANGES.filter(c => c.sev === "low").length

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top nav bar ── */}
      <div className="flex-none flex items-center gap-3 px-5 h-13 py-3 border-b border-slate-200 bg-white">
        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <span>Comparisons</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 font-semibold">MSA v3 vs v4</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowSummary(s => !s)}
          className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Summary
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* ── Change summary bar ── */}
      <div className="flex-none flex items-center gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <ScanSearch className="w-4 h-4" />
          <span><strong className="text-slate-800">{CHANGES.length}</strong> changes found</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${SEV.high.pill}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {high} High Risk
          </span>
          <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${SEV.medium.pill}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {medium} Medium
          </span>
          <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${SEV.low.pill}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {low} Low
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-sm bg-red-200 inline-block border border-red-300" /> Removed</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-sm bg-emerald-200 inline-block border border-emerald-300" /> Added</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-sm bg-amber-200 inline-block border border-amber-300" /> Modified</span>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left change list */}
        <div className="flex-none w-64 border-r border-slate-200 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto py-1">
            {CHANGES.map(c => {
              const cfg = SEV[c.sev as keyof typeof SEV]
              const isSelected = selected === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id === selected ? null : c.id)}
                  className={`w-full text-left px-4 py-3 border-l-[3px] transition-colors ${
                    isSelected
                      ? c.sev === "high" ? "border-red-500 bg-red-50"
                      : c.sev === "medium" ? "border-amber-400 bg-amber-50"
                      : "border-slate-400 bg-slate-50"
                      : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className="text-[11px] font-semibold text-slate-800 leading-tight">{c.type}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-slate-400 truncate">{c.short}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">p.{c.page}</span>
                  </div>
                  {c.ai && isSelected && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">
                      <Sparkles className="w-2 h-2" /> {c.ai}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Center: Split document view */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 grid grid-cols-2 divide-x divide-slate-200 overflow-hidden">
            {/* Original doc */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex-none flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50">
                <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center">
                  <FileText className="w-2.5 h-2.5 text-blue-600" />
                </div>
                <span className="text-[11px] font-semibold text-blue-700">Original — v3.0</span>
                <div className="flex-1" />
                <button className="p-1 text-slate-400 hover:text-slate-600"><ZoomOut className="w-3 h-3" /></button>
                <span className="text-[10px] text-slate-400">100%</span>
                <button className="p-1 text-slate-400 hover:text-slate-600"><ZoomIn className="w-3 h-3" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
                <DocPage side="original" selectedChange={sel} />
              </div>
            </div>

            {/* Revised doc */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex-none flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50">
                <div className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
                  <FileText className="w-2.5 h-2.5 text-emerald-600" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">Revised — v4.0</span>
                <div className="flex-1" />
                <button className="p-1 text-slate-400 hover:text-slate-600"><ZoomOut className="w-3 h-3" /></button>
                <span className="text-[10px] text-slate-400">100%</span>
                <button className="p-1 text-slate-400 hover:text-slate-600"><ZoomIn className="w-3 h-3" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
                <DocPage side="revised" selectedChange={sel} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Summary panel (toggleable) */}
        {showSummary && (
          <div className="flex-none w-64 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span className="text-xs font-bold text-slate-800">AI Summary</span>
              </div>
              <button onClick={() => setShowSummary(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-1.5 font-bold text-red-700 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Critical Findings
                </div>
                <p className="text-red-700 leading-relaxed">The indemnification clause was silently removed and payment terms doubled. These two changes together significantly shift risk to your organization.</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 mb-1.5">
                  <Info className="w-3.5 h-3.5" /> Moderate Changes
                </div>
                <p className="text-amber-700 leading-relaxed">Governing law shifted to Delaware and a new IP assignment clause was added. Review with counsel before signing.</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> No Issues
                </div>
                <p className="text-emerald-700 leading-relaxed">Address and date updates are administrative only — no legal impact.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DocPage({ side, selectedChange }: { side: "original" | "revised"; selectedChange: typeof CHANGES[0] | null | undefined }) {
  const isOrig = side === "original"
  return (
    <div className="bg-white shadow rounded-lg p-6 text-[10px] leading-relaxed text-slate-700 space-y-3 min-h-80">
      <div className="text-center font-bold text-[11px] text-slate-800 border-b border-slate-100 pb-2 mb-3">
        Master Services Agreement — {isOrig ? "v3.0" : "v4.0"}
      </div>

      <p>This Agreement is entered into as of the Effective Date between the parties identified below and sets forth the terms under which Services shall be performed.</p>

      {selectedChange && selectedChange.orig && (
        <div className={`px-3 py-2.5 rounded-r-lg border-l-4 ${
          !selectedChange.revised
            ? isOrig ? "border-red-400 bg-red-50 text-red-800" : "border-slate-200 bg-slate-50 text-slate-400 line-through"
            : isOrig ? "border-amber-300 bg-amber-50 text-amber-800" : "border-emerald-400 bg-emerald-50 text-emerald-800"
        }`}>
          {isOrig || !selectedChange.revised ? selectedChange.orig : selectedChange.revised}
        </div>
      )}

      {selectedChange && !selectedChange.orig && selectedChange.revised && !isOrig && (
        <div className="px-3 py-2.5 rounded-r-lg border-l-4 border-emerald-400 bg-emerald-50 text-emerald-800">
          {selectedChange.revised}
        </div>
      )}

      <p>Payment terms and conditions are as specified in the attached Schedule A, which is incorporated by reference into this Agreement and made a part hereof.</p>
      <p>This Agreement shall be governed by applicable law and any dispute shall be resolved pursuant to Section 14.</p>
      <p>All notices must be in writing and delivered to the addresses specified in Schedule B.</p>

      <div className="text-center text-[9px] text-slate-400 pt-3 border-t border-slate-100 mt-4">
        Page {selectedChange?.page ?? 1} of 18
      </div>
    </div>
  )
}
