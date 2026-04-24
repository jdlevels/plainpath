import { FileText, AlertTriangle, HelpCircle, ExternalLink, MessageSquare, Search, FileSearch, ChevronRight, ArrowRight } from "lucide-react";

function Chip({ page }: { page: number }) {
  return (
    <span className="inline-flex items-center h-4 px-1.5 rounded bg-amber-600/15 border border-amber-500/20 text-amber-300 text-[9px] font-medium">
      p.{page}
    </span>
  );
}

const EXTRACTED = [
  { text: "Some clause headers (pages 2–4)", page: 2 },
  { text: "Payment term references", page: 5 },
  { text: "Page 4 obligations (partial)", page: 4 },
  { text: "Signature block (incomplete)", page: 12 },
];

const MISSING = [
  "Party names — illegible scan",
  "Effective date — page damaged",
  "Termination clause — not readable",
  "Governing law — unclear",
];

const PRIMARY_ACTIONS = [
  {
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Ask This Document",
    desc: "Ask specific questions — PlainPath will answer from what it could read, and flag what it couldn't.",
    color: "violet",
    cta: "Open Ask →",
  },
  {
    icon: <Search className="w-5 h-5" />,
    label: "Trust Check",
    desc: "Verify authenticity and check for document manipulation even on low-quality scans.",
    color: "amber",
    cta: "Run Trust Check →",
  },
  {
    icon: <FileSearch className="w-5 h-5" />,
    label: "Clause Extractor",
    desc: "Try to extract individual clauses from the readable pages.",
    color: "blue",
    cta: "Extract Clauses →",
  },
];

const COLOR: Record<string, { card: string; icon: string; cta: string }> = {
  violet: {
    card: "border-violet-500/25 bg-violet-600/[0.06]",
    icon: "text-violet-400 bg-violet-600/10 border-violet-500/20",
    cta: "text-violet-300 border-violet-500/25 bg-violet-600/10 hover:bg-violet-600/20",
  },
  amber: {
    card: "border-amber-500/20 bg-amber-600/[0.04]",
    icon: "text-amber-400 bg-amber-600/10 border-amber-500/20",
    cta: "text-amber-300 border-amber-500/25 bg-amber-600/10 hover:bg-amber-600/20",
  },
  blue: {
    card: "border-blue-500/20 bg-blue-600/[0.04]",
    icon: "text-blue-400 bg-blue-600/10 border-blue-500/20",
    cta: "text-blue-300 border-blue-500/20 bg-blue-600/10 hover:bg-blue-600/20",
  },
};

function FakeScanPage({ pg }: { pg: number }) {
  return (
    <div className="w-full rounded-lg border border-amber-500/10 bg-white/[0.015] p-3.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/15 text-[9px]">Page {pg}</span>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-400/50" />
          <span className="text-amber-400/50 text-[9px]">Low quality</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 opacity-40">
        {[55, 80, 35, 70, 45, 65].map((w, i) => (
          <div key={i} className="h-[7px] rounded-sm bg-white/[0.20]" style={{ width: `${w}%`, opacity: 0.3 + Math.random() * 0.5 }} />
        ))}
      </div>
    </div>
  );
}

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
        {/* Left: low-quality doc viewer */}
        <div className="w-[40%] border-r border-white/[0.06] flex flex-col bg-[#0e0e12] shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-amber-400/60" />
            <span className="text-white/40 text-xs flex-1 truncate">Scanned_Contract_2024.pdf</span>
            <div className="h-5 px-1.5 rounded bg-amber-600/12 border border-amber-500/20 flex items-center">
              <span className="text-amber-300/70 text-[9px]">Scanned</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            <FakeScanPage pg={1} />
            <FakeScanPage pg={2} />
            <FakeScanPage pg={3} />
          </div>
          <div className="mx-3 mb-3 rounded-lg border border-amber-500/15 bg-amber-600/[0.05] px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-amber-400/70 shrink-0" />
            <p className="text-amber-300/60 text-[10px] leading-relaxed">Scanned image — text extraction limited</p>
          </div>
        </div>

        {/* Right: partial overview + actions */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 flex flex-col gap-4">

            {/* Warning banner */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-600/[0.06] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-200/90 text-sm font-semibold mb-1">Partial extraction only</p>
                  <p className="text-amber-300/55 text-xs leading-relaxed">
                    This looks like a scanned image. PlainPath extracted what it could, but key information including party names, the effective date, and several clauses weren't legible. What's shown below is based on readable sections only.
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <button className="h-7 px-3 rounded-lg bg-amber-600/15 border border-amber-500/25 text-amber-300 text-xs font-medium flex items-center gap-1.5 hover:bg-amber-600/25 transition-colors">
                      <ExternalLink className="w-3 h-3" />
                      Improve scan quality
                    </button>
                    <button className="h-7 px-3 rounded-lg border border-white/[0.07] text-white/35 text-xs hover:text-white/55 transition-colors">
                      Continue anyway
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Partial summary */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Partial Summary</p>
                <div className="h-4 px-1.5 rounded bg-amber-500/10 border border-amber-500/15 flex items-center">
                  <span className="text-amber-400/70 text-[9px]">~62% confidence</span>
                </div>
              </div>
              <p className="text-white/55 text-sm leading-relaxed">
                Appears to be a services agreement or consulting contract. References to payment terms and deliverables were partially readable on pages 4–5. Party names were not clearly legible.
              </p>
            </div>

            {/* Extracted vs missing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.025] p-3.5">
                <p className="text-emerald-400/70 text-[10px] uppercase tracking-widest font-semibold mb-2.5">Extracted</p>
                <div className="flex flex-col gap-2">
                  {EXTRACTED.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400/50 shrink-0" />
                      <span className="text-white/45 text-xs flex-1">{item.text}</span>
                      <Chip page={item.page} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.025] p-3.5">
                <p className="text-amber-400/70 text-[10px] uppercase tracking-widest font-semibold mb-2.5">Not readable</p>
                <div className="flex flex-col gap-2">
                  {MISSING.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <HelpCircle className="w-3 h-3 text-amber-400/35 shrink-0" />
                      <span className="text-white/35 text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Primary actions — hero section ── */}
            <div className="rounded-xl overflow-hidden border border-white/[0.10]" style={{
              background: "linear-gradient(135deg, rgba(30,30,40,0.6) 0%, rgba(15,15,17,0) 70%)"
            }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-violet-400" />
                  </div>
                  <p className="text-white/85 text-sm font-semibold">What you can still do</p>
                </div>
                <p className="text-white/28 text-xs mt-1 ml-7">These tools work even with partial extraction.</p>
              </div>

              <div className="p-3 flex flex-col gap-2.5">
                {PRIMARY_ACTIONS.map((a, i) => (
                  <div key={i} className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 ${COLOR[a.color].card}`}>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${COLOR[a.color].icon}`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-semibold mb-0.5">{a.label}</p>
                      <p className="text-white/35 text-xs leading-relaxed">{a.desc}</p>
                    </div>
                    <button className={`shrink-0 h-7 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${COLOR[a.color].cta}`}>
                      {a.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
