import {
  ShieldCheck, AlertTriangle, FileText, ChevronRight, X, ArrowLeft
} from "lucide-react";

const SECTIONS = [
  {
    id: "s1", title: "Invoice Header",
    body: "NORTHSTAR CLOUD SERVICES\nINVOICE NCS-2025-10847\nDate: April 10, 2025\nBill To: Meridian Group LLC, 88 Commerce Drive, Austin, TX",
    active: false,
  },
  {
    id: "s2", title: "Service Items",
    body: "IT Infrastructure — Q1 2025\nManaged services: Jan 1 – Mar 31, 2025\nEnterprise tier renewal — $31,200.00",
    active: false,
  },
  {
    id: "s3", title: "Payment Instructions",
    body: "Wire Transfer to:\nCoastal Pacific Bank, Singapore\nAccount: 4817-2930-1055\nRef: NCS-2025-10847",
    active: true,
  },
];

export function TrustCheckMobileDoc() {
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

      {/* Tab bar — Document tab active */}
      <div className="h-10 border-b border-white/[0.06] flex shrink-0">
        {[{ label: "Trust Check", active: false }, { label: "Document", active: true }].map((tab, i) => (
          <button key={i} className={`flex-1 text-sm font-medium relative ${tab.active ? "text-white/90" : "text-white/28"}`}>
            {tab.label}
            {tab.active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-violet-500" />}
          </button>
        ))}
      </div>

      {/* Evidence banner */}
      <div className="mx-3 mt-2.5 mb-0.5 shrink-0 rounded-lg border border-violet-500/22 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-violet-200/78 text-[10px] font-medium truncate">
            Wire Transfer to: Coastal Pacific Bank, Singapore…
          </p>
          <p className="text-violet-300/35 text-[9px]">Highlighted from trust concern — tap to return</p>
        </div>
        <button className="flex items-center gap-1 text-violet-400/55 text-[9px] shrink-0">
          <ArrowLeft className="w-2.5 h-2.5 rotate-180" />
          Back
        </button>
        <button className="text-white/18 shrink-0 ml-1"><X className="w-3 h-3" /></button>
      </div>

      {/* Document sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {SECTIONS.map(s => (
          <div key={s.id} className={`w-full rounded-xl border p-3.5 flex flex-col gap-2 ${
            s.active
              ? "border-violet-500/40 bg-violet-500/[0.06] ring-1 ring-violet-500/18"
              : "border-white/[0.05] bg-white/[0.012]"
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[9px] font-mono ${s.active ? "text-violet-300/55" : "text-white/18"}`}>{s.title}</span>
              {s.active && (
                <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/22 border border-violet-500/32">
                  <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-violet-200/65 text-[9px]">Source</span>
                </div>
              )}
            </div>
            <p className={`text-[11px] leading-relaxed whitespace-pre-line ${s.active ? "text-white/62" : "text-white/28"}`}>
              {s.body}
            </p>
            {s.active && (
              <div className="mt-1 rounded-lg border border-violet-500/16 bg-violet-500/[0.06] px-2.5 py-1.5">
                <p className="text-violet-200/55 text-[9px] leading-relaxed italic">
                  "Wire Transfer to: Coastal Pacific Bank, Singapore — Account: 4817-2930-1055"
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Section nav */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-white/20 text-xs">Section 3 of 3</span>
          <div className="flex items-center gap-1">
            {[1,2,3].map(n => (
              <button key={n} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${n === 3 ? "bg-violet-600 text-white" : "text-white/22"}`}>{n}</button>
            ))}
          </div>
        </div>

        {/* Back to trust check */}
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] text-white/32 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Trust Check
        </button>
      </div>

      <div className="h-6 shrink-0" />
    </div>
  );
}
