import { FileText, AlertTriangle, ChevronRight, HelpCircle, ExternalLink, MessageSquare, Search, FileSearch, GitCompare, Shield } from "lucide-react";

const TOOLS = [
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document", color: "text-violet-400", bg: "bg-violet-600/10 border-violet-500/20", action: "Ask questions" },
  { icon: <Search className="w-3.5 h-3.5" />, label: "Trust Check", color: "text-amber-400", bg: "bg-amber-600/10 border-amber-500/20", action: "Verify signatures" },
  { icon: <FileSearch className="w-3.5 h-3.5" />, label: "Clause Extractor", color: "text-blue-400", bg: "bg-blue-600/10 border-blue-500/20", action: "Extract clauses" },
];

export function OverviewLowConfidence() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        </div>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <span className="text-white/35 text-xs">Document Overview</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full bg-amber-600/15 border border-amber-500/25 flex items-center gap-1.5">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-amber-300 text-[10px] font-medium">Partial extraction</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: doc viewer */}
        <div className="w-[42%] border-r border-white/[0.06] flex flex-col bg-[#0e0e12]">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/30" />
            <span className="text-white/45 text-xs truncate">Scanned_Contract_2024.pdf</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="h-5 px-1.5 rounded bg-amber-600/15 border border-amber-500/20 flex items-center">
                <span className="text-amber-300 text-[9px]">Scanned</span>
              </div>
            </div>
          </div>
          {/* Fake blurry/low-quality scanned page */}
          <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3">
            <div className="w-full rounded-lg border border-amber-500/10 bg-amber-500/[0.02] p-4 flex flex-col gap-2">
              {/* Simulated scan with uneven lines */}
              <div className="flex flex-col gap-2 opacity-50">
                {[60, 85, 40, 75, 90, 55, 70].map((w, i) => (
                  <div key={i} className="h-2 rounded-sm bg-white/[0.15]" style={{ width: `${w}%`, opacity: 0.4 + Math.random() * 0.4 }} />
                ))}
              </div>
              <div className="mt-1 h-px bg-white/[0.05]" />
              <div className="flex flex-col gap-2 opacity-40">
                {[80, 65, 50, 70].map((w, i) => (
                  <div key={i} className="h-2 rounded-sm bg-white/[0.15]" style={{ width: `${w}%` }} />
                ))}
              </div>
              {/* OCR quality indicator */}
              <div className="mt-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400/70" />
                <span className="text-amber-400/70 text-[10px]">Low OCR confidence on this page</span>
              </div>
            </div>
            <div className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 flex flex-col gap-2 opacity-60">
              {[90, 75, 85, 65].map((w, i) => (
                <div key={i} className="h-2 rounded-sm bg-white/[0.12]" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: partial overview */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-4">
            {/* Warning banner */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-600/[0.06] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200/90 text-sm font-medium mb-1">Partial extraction only</p>
                  <p className="text-amber-300/50 text-xs leading-relaxed">
                    This document appears to be a scanned image. Some sections couldn't be read clearly. The overview below is based on what PlainPath could extract — treat it as a starting point, not a complete analysis.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="h-7 px-3 rounded-lg bg-amber-600/15 border border-amber-500/25 text-amber-300 text-xs font-medium hover:bg-amber-600/25 transition-colors flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3" />
                      Improve scan quality
                    </button>
                    <button className="h-7 px-3 rounded-lg border border-white/[0.08] text-white/40 text-xs hover:text-white/60 transition-colors">
                      Continue anyway
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Doc header */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-white/40" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white/80 text-base font-semibold">Scanned Contract (2024)</h1>
                  <div className="h-5 px-2 rounded-full border border-amber-500/25 bg-amber-600/10">
                    <span className="text-amber-300 text-[10px]">Low confidence</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white/30 text-xs">Type unclear</span>
                  <span className="text-white/15">·</span>
                  <span className="text-white/30 text-xs">~8 pages readable of 12</span>
                </div>
              </div>
            </div>

            {/* Partial summary */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white/50 text-xs uppercase tracking-widest font-medium">Partial Summary</p>
                <div className="h-4 px-1.5 rounded bg-amber-500/10 border border-amber-500/15 flex items-center">
                  <span className="text-amber-400/70 text-[9px]">~62% confidence</span>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Appears to be a services agreement or consulting contract. References to payment terms and deliverables were partially readable. Party names were not clearly legible in the scan.
              </p>
            </div>

            {/* Extracted vs missing */}
            <div className="grid grid-cols-2 gap-3">
              {/* Extracted */}
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-3">
                <p className="text-emerald-400/70 text-xs uppercase tracking-widest font-medium mb-2">Extracted</p>
                <div className="flex flex-col gap-1.5">
                  {["Payment term references", "Some clause headers", "Page 4 obligations", "Signature block (partial)"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400/50 shrink-0" />
                      <span className="text-white/50 text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Missing */}
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-3">
                <p className="text-amber-400/70 text-xs uppercase tracking-widest font-medium mb-2">Unclear / missing</p>
                <div className="flex flex-col gap-1.5">
                  {["Party names", "Effective date", "Termination clauses", "Governing law"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <HelpCircle className="w-3 h-3 text-amber-400/40 shrink-0" />
                      <span className="text-white/40 text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest font-medium mb-2">Proceed with</p>
              <div className="flex flex-col gap-2">
                {TOOLS.map((tool, i) => (
                  <button key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${tool.bg} hover:bg-white/[0.03] transition-colors text-left`}>
                    <div className={`w-7 h-7 rounded-lg border ${tool.bg} flex items-center justify-center shrink-0 ${tool.color}`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-white/70 text-sm font-medium">{tool.label}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
