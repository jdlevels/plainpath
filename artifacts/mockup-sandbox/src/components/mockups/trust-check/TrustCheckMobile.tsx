import {
  ShieldCheck, AlertTriangle, FileText, ChevronRight,
  X, ArrowLeft, ClipboardCheck, Info, BarChart2
} from "lucide-react";

function Chip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 h-4 px-1.5 rounded text-[9px] font-mono font-medium transition-all ${
      active
        ? "bg-violet-500/30 border border-violet-400/50 text-violet-200"
        : "bg-violet-600/12 border border-violet-500/18 text-violet-300/80"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
      {label}
    </span>
  );
}

const CONCERNS = [
  { level: "caution", text: "Sender domain may not match the claimed sender.", chip: "p.1 · Header", active: false },
  { level: "caution", text: "Unusual payment destination — requires independent verification.", chip: "p.2 · §4", active: true },
  { level: "low", text: "Date inconsistency — service period vs. invoice date.", chip: "p.1 · §1", active: false },
];

const CHECKLIST = [
  { label: "Confirm sender through a known contact — not this document", urgent: true, done: false },
  { label: "Verify payment destination independently", urgent: true, done: false },
  { label: "Cross-check reference numbers with your records", urgent: false, done: false },
];

export function TrustCheckMobile() {
  return (
    <div className="w-[390px] h-[844px] bg-[#0c0c0f] flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Status bar */}
      <div className="h-10 flex items-center justify-between px-5 shrink-0">
        <span className="text-white/50 text-[11px] font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 rounded-sm border border-white/30 relative overflow-hidden">
            <div className="absolute inset-y-0.5 left-0.5 right-[30%] bg-white/50 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="h-11 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/88 text-sm font-semibold flex-1 tracking-tight">Document Trust Check</span>
        <div className="h-6 px-2 rounded-full bg-amber-600/12 border border-amber-500/22 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
          <span className="text-amber-300 text-[10px] font-medium">31/100</span>
        </div>
      </div>

      {/* File strip */}
      <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
        <FileText className="w-3 h-3 text-amber-400/40 shrink-0" />
        <span className="text-white/38 text-xs flex-1 truncate">Northstar Cloud Services — Invoice NCS-2025-10847.pdf</span>
        <span className="text-white/18 text-[10px]">3 pp.</span>
      </div>

      {/* Tab bar — Trust Check active */}
      <div className="h-10 border-b border-white/[0.06] flex shrink-0">
        {[{ label: "Trust Check", active: true }, { label: "Document", active: false }].map((tab, i) => (
          <button key={i} className={`flex-1 text-sm font-medium relative ${tab.active ? "text-white/90" : "text-white/28"}`}>
            {tab.label}
            {tab.active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-violet-500" />}
          </button>
        ))}
      </div>

      {/* Source banner */}
      <div className="mx-3 mt-2.5 mb-0.5 shrink-0 rounded-lg border border-violet-500/22 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-violet-200/78 text-[10px] font-medium truncate">Source — p.2 · §4 · Payment Instructions</p>
        </div>
        <button className="flex items-center gap-1 text-violet-400/55 text-[9px] shrink-0">
          <ArrowLeft className="w-2.5 h-2.5" />Doc
        </button>
        <button className="text-white/18 shrink-0 ml-1"><X className="w-3 h-3" /></button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">

        {/* Score chips */}
        <div className="flex items-center gap-1.5 flex-wrap px-0.5">
          <div className="h-5 px-2 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
            <span className="text-amber-300 text-[9px] font-medium">2 possible critical signals</span>
          </div>
          <div className="h-5 px-2 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1">
            <span className="text-white/32 text-[9px]">medium confidence</span>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-white/[0.09] bg-white/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart2 className="w-3 h-3 text-white/25" />
            <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold">Trust Summary</p>
          </div>
          <p className="text-white/62 text-[11px] leading-[1.7] mb-2">
            Several signals require verification. PlainPath found a possible domain mismatch, an unusual payment destination, and a date inconsistency. <strong className="text-white/82">Confirm with the original source</strong> before responding.
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            <Chip label="p.1 · Header" />
            <Chip label="p.2 · §4" active />
            <Chip label="p.1 · §1" />
          </div>
          <div className="mt-2 flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <Info className="w-2.5 h-2.5 text-white/18 mt-[1px] shrink-0" />
            <p className="text-white/20 text-[9px] leading-relaxed">Score reflects consistency, source clarity, and risk indicators — not a legal determination.</p>
          </div>
        </div>

        {/* Trust concerns */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3.5">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3 h-3 text-amber-400/65" />
            <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold flex-1">Risk Indicators</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {CONCERNS.map((c, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg px-2.5 py-2.5 border cursor-pointer ${
                c.active
                  ? "border-violet-500/28 bg-violet-500/[0.06] ring-1 ring-violet-500/18"
                  : c.level === "caution"
                  ? "border-amber-500/14 bg-amber-500/[0.02]"
                  : "border-white/[0.06]"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-[4px] shrink-0 ${c.level === "caution" ? "bg-amber-400" : "bg-white/20"}`} />
                <p className="text-white/52 text-[10px] leading-relaxed flex-1">{c.text}</p>
                <Chip label={c.chip} active={c.active} />
              </div>
            ))}
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="rounded-xl border border-white/[0.09] overflow-hidden" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.07) 0%, rgba(12,12,15,0) 55%)" }}>
          <div className="px-3.5 pt-3.5 pb-2.5 border-b border-white/[0.07] flex items-center gap-2">
            <ClipboardCheck className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <p className="text-white/82 text-[13px] font-semibold flex-1">Verification Checklist</p>
            <div className="h-4 px-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-300/80 text-[8px] font-medium">2 urgent</span>
            </div>
          </div>
          <div className="p-2.5 flex flex-col gap-1.5">
            {CHECKLIST.map((item, i) => (
              <div key={i} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 border cursor-pointer ${item.urgent ? "border-white/[0.10] bg-white/[0.022]" : "border-white/[0.06]"}`}>
                <div className="w-3.5 h-3.5 rounded border border-white/[0.18] flex items-center justify-center shrink-0" />
                <p className={`text-[10px] font-medium flex-1 leading-snug ${item.urgent ? "text-white/78" : "text-white/40"}`}>{item.label}</p>
                {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                <ChevronRight className="w-3 h-3 text-white/15 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* View document button */}
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] text-white/32 text-xs">
          <FileText className="w-3.5 h-3.5" />
          View document source
          <ChevronRight className="w-3 h-3" />
        </button>

      </div>
      <div className="h-6 shrink-0" />
    </div>
  );
}
