import {
  ShieldCheck, AlertTriangle, FileText, ChevronRight, X, ArrowRight
} from "lucide-react";

const SECTIONS = [
  {
    id: "s1", title: "Invoice Header",
    body: "MICROSOFT CORP — INVOICE\nInvoice #: MS-2025-88241\nDate: March 15, 2025\nBill To: Acme Industries LLC, 14 Oak Ave, Portland, OR",
    active: false,
  },
  {
    id: "s2", title: "Service Period & Items",
    body: "Enterprise Software Licensing — Q1 2025\nService period: Jan 1 – Feb 28, 2025\n12-month subscription renewal — $47,350.00",
    active: false,
  },
  {
    id: "s3", title: "Payment Instructions",
    body: "Wire Transfer ONLY to:\nBank: Erste Bank AG, Vienna\nIBAN: AT12 3456 7890 1234 5678\nBIC: GIBAATWW\nRef: INV-2025-88241",
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
        <span className="text-white/88 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/25 text-[10px] mx-1">·</span>
        <span className="text-white/32 text-xs flex-1">Document Trust Check</span>
        <div className="h-6 px-2 rounded-full bg-red-600/12 border border-red-500/22 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
          <span className="text-red-300 text-[10px] font-medium">22/100</span>
        </div>
      </div>

      {/* File strip */}
      <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
        <FileText className="w-3 h-3 text-red-400/45 shrink-0" />
        <span className="text-white/38 text-xs flex-1 truncate">Microsoft — Invoice INV-2025-88241.pdf</span>
        <span className="text-white/18 text-[10px]">3 pp.</span>
      </div>

      {/* Tab bar — Document tab active */}
      <div className="h-10 border-b border-white/[0.06] flex shrink-0">
        {[{ id: "trust", label: "Trust Check", active: false }, { id: "document", label: "Document", active: true }].map(tab => (
          <button key={tab.id} className={`flex-1 text-sm font-medium relative ${tab.active ? "text-white/90" : "text-white/28"}`}>
            {tab.label}
            {tab.active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-violet-500" />}
          </button>
        ))}
      </div>

      {/* Evidence banner on document tab */}
      <div className="mx-3 mt-2.5 mb-0.5 shrink-0 rounded-lg border border-violet-500/25 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-violet-200/80 text-[10px] font-medium truncate">
            Wire Transfer ONLY to: Bank: Erste Bank AG, Vienna…
          </p>
          <p className="text-violet-300/38 text-[9px]">Highlighted from trust concern panel</p>
        </div>
        <button className="flex items-center gap-1 text-violet-400/60 text-[9px] shrink-0">
          <ArrowRight className="w-2.5 h-2.5 rotate-180" />
          Back
        </button>
        <button className="text-white/20 shrink-0 ml-1"><X className="w-3 h-3" /></button>
      </div>

      {/* Document sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {SECTIONS.map(s => (
          <div key={s.id} className={`w-full rounded-xl border p-3.5 flex flex-col gap-2 ${
            s.active
              ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20"
              : "border-white/[0.05] bg-white/[0.012]"
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[9px] font-mono ${s.active ? "text-violet-300/60" : "text-white/18"}`}>{s.title}</span>
              {s.active && (
                <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
                  <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-violet-200/70 text-[9px]">Source</span>
                </div>
              )}
            </div>
            <p className={`text-[11px] leading-relaxed whitespace-pre-line ${s.active ? "text-white/65" : "text-white/30"}`}>
              {s.body}
            </p>
            {s.active && (
              <div className="mt-1 rounded-lg border border-violet-500/18 bg-violet-500/[0.07] px-2.5 py-1.5">
                <p className="text-violet-200/60 text-[9px] leading-relaxed italic">
                  "Wire Transfer ONLY to: Bank: Erste Bank AG, Vienna — IBAN: AT12 3456 7890 1234 5678"
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
      </div>

      <div className="h-6 shrink-0" />
    </div>
  );
}
