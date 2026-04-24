import {
  ShieldCheck, AlertTriangle, ChevronRight, FileText,
  FileWarning, Zap, Bookmark, X, ClipboardCheck, BarChart2
} from "lucide-react";

function SourceChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_8px_rgba(139,92,246,0.22)]"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
      {label}
    </span>
  );
}

function SLabel({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-white/28 shrink-0">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/26 flex-1">{children}</p>
      {right}
    </div>
  );
}

const DOC_SECTIONS = [
  { id: "s1", title: "Invoice Header", body: "MICROSOFT CORP — INVOICE\nInvoice #: MS-2025-88241\nDate: March 15, 2025\nBill To: Acme Industries LLC, 14 Oak Ave, Portland, OR", active: false },
  { id: "s2", title: "Service Period & Items", body: "Enterprise Software Licensing — Q1 2025\nService period: Jan 1 – Feb 28, 2025\n12-month subscription renewal — $47,350.00", active: false },
  { id: "s3", title: "Payment Instructions — ACTIVE SOURCE", body: "Wire Transfer ONLY to:\nBank: Erste Bank AG, Vienna\nIBAN: AT12 3456 7890 1234 5678\nBIC: GIBAATWW\nRef: INV-2025-88241", active: true },
];

const SEV_STYLES: Record<string, string> = {
  critical: "border-red-500/28 bg-red-500/[0.05]",
  high: "border-amber-500/18 bg-amber-500/[0.03]",
};
const DOT_STYLES: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-amber-400",
};

export function TrustCheckSourceActive() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Document Trust Check</span>
        <ChevronRight className="w-3 h-3 text-white/18" />
        <span className="text-white/30 text-xs truncate max-w-[180px]">Microsoft — Invoice INV-2025-88241.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-red-600/12 border-red-500/28 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">High risk · 22/100</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" /><span>Save</span>
          </button>
          <a className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Zap className="w-3 h-3" /><span>Re-analyze</span>
          </a>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: document viewer — source chip #2 active, section 3 highlighted */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileWarning className="w-3.5 h-3.5 text-red-400/60 shrink-0" />
            <span className="text-white/45 text-xs flex-1 truncate">Microsoft — Invoice INV-2025-88241.pdf</span>
            <span className="text-white/18 text-xs shrink-0">3 pp.</span>
            <div className="w-px h-4 bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-0.5">
              {["Fit", "75%", "100%"].map((z, i) => (
                <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i === 1 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{z}</button>
              ))}
            </div>
          </div>

          {/* ACTIVE: evidence text citation banner */}
          <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-violet-200/85 text-[10px] font-medium truncate">
                Source: Wire Transfer ONLY to: Bank: Erste Bank AG, Vienna — IBAN: AT12 3456…
              </p>
              <p className="text-violet-300/40 text-[9px]">Jumped from trust concern — matching section highlighted below</p>
            </div>
            <button className="text-white/20 hover:text-white/45 shrink-0"><X className="w-3 h-3" /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2.5">
            {DOC_SECTIONS.map(s => (
              <div key={s.id} className={`w-full rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${
                s.active ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.08)]" : "border-white/[0.05] bg-white/[0.015]"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[9px] font-mono ${s.active ? "text-violet-300/60" : "text-white/18"}`}>{s.title}</p>
                  {s.active && (
                    <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
                      <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-200/75 text-[9px]">Source</span>
                    </div>
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed whitespace-pre-line ${s.active ? "text-white/65" : "text-white/30"}`}>{s.body}</p>
                {s.active && (
                  <div className="mt-1 rounded-lg border border-violet-500/18 bg-violet-500/[0.06] px-2.5 py-1.5">
                    <p className="text-violet-200/60 text-[9px] leading-relaxed italic">
                      "Wire Transfer ONLY to: Bank: Erste Bank AG, Vienna — IBAN: AT12 3456 7890 1234 5678"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">Section 3 of 3</span>
            <div className="flex items-center gap-1">
              {[1,2,3].map(n => (
                <button key={n} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${n === 3 ? "bg-violet-600 text-white" : "text-white/22"}`}>{n}</button>
              ))}
            </div>
            <span className="text-white/14 text-[10px]">Jump to section</span>
          </div>
        </div>

        {/* RIGHT: trust panel — concern #2 active */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-5">

            {/* Trust Summary */}
            <div className="rounded-xl border border-red-500/18 bg-red-600/[0.04] p-4">
              <SLabel icon={<ShieldCheck className="w-3.5 h-3.5 text-red-400/60" />}>Trust Summary</SLabel>
              <p className="text-white/65 text-sm leading-[1.7]">
                This document has <strong className="text-red-300">major trust concerns</strong>. The sender domain does not match Microsoft, the payment method is highly atypical, and dates are inconsistent. <strong className="text-white/80">Do not pay.</strong>
              </p>
            </div>

            {/* Score strip */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <SLabel icon={<BarChart2 className="w-3.5 h-3.5 text-white/28" />}>Trust Score</SLabel>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-red-600/12 border-red-500/28 text-red-300">
                  <span className="text-[11px] font-semibold">22 / 100</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-amber-600/10 border-amber-500/22 text-amber-300">
                  <span className="text-[11px] font-medium">Medium confidence</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/22 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  <span className="text-red-300 text-[9px] font-medium">2 critical</span>
                </div>
                <div className="h-5 px-2 rounded-full bg-amber-500/8 border border-amber-500/18 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-amber-300 text-[9px] font-medium">2 high</span>
                </div>
              </div>
            </div>

            {/* Trust Concerns — chip #2 active/glowing */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <SLabel icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400/55" />}>Major Trust Concerns</SLabel>
              <div className="flex flex-col gap-2">
                {[
                  { title: "Sender email domain doesn't match Microsoft", sev: "critical", chip: "p.1 · Header", chipActive: false },
                  { title: "Wire transfer to international account — unusual for Microsoft", sev: "critical", chip: "p.2 · §4", chipActive: true },
                  { title: "Date inconsistency — invoice post-dates service period", sev: "high", chip: "p.1 · §1", chipActive: false },
                ].map((c, i) => (
                  <div key={i} className={`rounded-xl border px-3.5 py-3 ${SEV_STYLES[c.sev]} ${c.chipActive ? "ring-1 ring-violet-500/25" : ""}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${DOT_STYLES[c.sev]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-medium leading-snug ${c.chipActive ? "text-white/90" : "text-white/70"}`}>{c.title}</p>
                          <SourceChip label={c.chip} active={c.chipActive} />
                        </div>
                        {c.chipActive && (
                          <p className="text-violet-300/50 text-[9px] mt-1.5 leading-relaxed">
                            ↳ Section 3 highlighted in document viewer — Erste Bank AG, Vienna
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <SLabel icon={<ClipboardCheck className="w-3.5 h-3.5 text-white/28" />}>Verification Checklist</SLabel>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Contact Microsoft directly to verify invoice #MS-2025-88241", urgent: true },
                  { label: "Do not send any payment until identity is confirmed", urgent: true },
                  { label: "Check Microsoft customer portal for this invoice", urgent: false },
                ].map((item, i) => (
                  <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${item.urgent ? "border-white/[0.10] bg-white/[0.018]" : "border-white/[0.06]"}`}>
                    <div className="w-3.5 h-3.5 rounded border border-white/[0.18] flex items-center justify-center mt-0.5 shrink-0" />
                    <p className={`text-xs ${item.urgent ? "text-white/78 font-medium" : "text-white/40"}`}>{item.label}</p>
                    {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />}
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
