import {
  ShieldCheck, AlertTriangle, ChevronRight, FileText,
  FileWarning, Zap, Bookmark, X, ClipboardCheck, BarChart2, Info
} from "lucide-react";

function SourceChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer transition-all ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_8px_rgba(139,92,246,0.2)]"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
      {label}
    </span>
  );
}

function PanelLabel({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="shrink-0 text-white/25">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24 flex-1">{children}</p>
      {right}
    </div>
  );
}

const DOC_SECTIONS = [
  { id: "s1", title: "Invoice Header", body: "NORTHSTAR CLOUD SERVICES\nINVOICE NCS-2025-10847\nDate: April 10, 2025\nBill To: Meridian Group LLC, 88 Commerce Drive, Austin, TX", active: false },
  { id: "s2", title: "Service Items", body: "IT Infrastructure — Q1 2025\nManaged services: Jan 1 – Mar 31, 2025\nEnterprise tier renewal — $31,200.00", active: false },
  { id: "s3", title: "Payment Instructions — Active Source", body: "Wire Transfer to:\nCoastal Pacific Bank, Singapore\nAccount: 4817-2930-1055\nRef: NCS-2025-10847", active: true },
];

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
        <span className="text-white/30 text-xs truncate max-w-[180px]">NCS Invoice NCS-2025-10847.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-amber-600/12 border-amber-500/28 text-amber-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">Needs review · 31/100</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" /><span>Save</span>
          </button>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Zap className="w-3 h-3" /><span>Re-analyze</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: document viewer — section 3 highlighted */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileWarning className="w-3.5 h-3.5 text-amber-400/55 shrink-0" />
            <span className="text-white/45 text-xs flex-1 truncate">Northstar Cloud Services — Invoice NCS-2025-10847.pdf</span>
            <div className="flex items-center gap-0.5 ml-auto shrink-0">
              {["Fit", "75%", "100%"].map((z, i) => (
                <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i === 1 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{z}</button>
              ))}
            </div>
          </div>

          {/* Evidence citation banner */}
          <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-violet-200/85 text-[10px] font-medium truncate">
                Source: "Wire Transfer to: Coastal Pacific Bank, Singapore — Account: 4817-2930-1055"
              </p>
              <p className="text-violet-300/40 text-[9px]">Jumped from trust concern · matching section highlighted below</p>
            </div>
            <button className="text-white/20 hover:text-white/45 shrink-0 ml-1"><X className="w-3 h-3" /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2.5">
            {DOC_SECTIONS.map(s => (
              <div key={s.id} className={`w-full rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${
                s.active
                  ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.07)]"
                  : "border-white/[0.05] bg-white/[0.015]"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[9px] font-mono ${s.active ? "text-violet-300/55" : "text-white/18"}`}>{s.title}</p>
                  {s.active && (
                    <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
                      <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-200/70 text-[9px]">Source</span>
                    </div>
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed whitespace-pre-line ${s.active ? "text-white/62" : "text-white/30"}`}>{s.body}</p>
                {s.active && (
                  <div className="mt-1 rounded-lg border border-violet-500/18 bg-violet-500/[0.06] px-2.5 py-1.5">
                    <p className="text-violet-200/55 text-[9px] leading-relaxed italic">
                      "Wire Transfer to: Coastal Pacific Bank, Singapore — Account: 4817-2930-1055"
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

        {/* RIGHT: panel — concern #2 active/glowing */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-4">

            {/* A. Trust Summary */}
            <div className="rounded-xl border border-white/[0.09] bg-white/[0.02] p-4">
              <PanelLabel icon={<ShieldCheck className="w-3.5 h-3.5" />}>A. Trust Summary</PanelLabel>
              <p className="text-white/65 text-sm leading-[1.75]">
                Several signals require verification before acting. PlainPath found a possible domain mismatch, an unusual payment destination, and a date inconsistency. These are <strong className="text-white/78">risk indicators — confirm with the original source</strong> before responding or paying.
              </p>
            </div>

            {/* B. Trust Score */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <PanelLabel icon={<BarChart2 className="w-3.5 h-3.5" />}>B. Trust Score</PanelLabel>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-amber-600/12 border-amber-500/25 text-amber-300">
                  <span className="text-[11px] font-semibold">31 / 100</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-sky-600/10 border-sky-500/20 text-sky-300">
                  <span className="text-[11px] font-medium">Medium confidence</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <Info className="w-2.5 h-2.5 text-white/18 mt-[2px] shrink-0" />
                <p className="text-white/20 text-[9px] leading-relaxed">Trust score reflects document consistency, source clarity, metadata signals, and risk indicators. Not a legal or forensic determination.</p>
              </div>
            </div>

            {/* C. Trust Concerns — concern #2 glowing active */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PanelLabel icon={<AlertTriangle className="w-3.5 h-3.5" />}>C. Major Trust Concerns</PanelLabel>
              <div className="flex flex-col gap-2">
                {[
                  { title: "Sender domain may not match the claimed sender", sev: "caution", chip: "p.1 · Header", chipActive: false },
                  { title: "Unusual payment destination — requires independent verification", sev: "critical", chip: "p.2 · §4", chipActive: true },
                  { title: "Date inconsistency — service period vs. invoice date", sev: "caution", chip: "p.1 · §1", chipActive: false },
                ].map((c, i) => (
                  <div key={i} className={`rounded-xl border px-3.5 py-3 ${c.chipActive ? "border-violet-500/28 bg-violet-500/[0.05] ring-1 ring-violet-500/20" : c.sev === "critical" ? "border-amber-500/22 bg-amber-500/[0.04]" : "border-white/[0.08] bg-white/[0.015]"}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${c.sev === "critical" ? "bg-amber-400" : "bg-white/25"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-white/75 text-xs font-medium leading-snug flex-1">{c.title}</p>
                          <SourceChip label={c.chip} active={c.chipActive} />
                        </div>
                        {c.chipActive && (
                          <p className="text-violet-300/50 text-[9px] leading-relaxed mt-0.5">
                            ↳ Section 3 highlighted in document viewer · Coastal Pacific Bank, Singapore
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. Verification Checklist */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PanelLabel icon={<ClipboardCheck className="w-3.5 h-3.5" />}
                right={<span className="h-4 px-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300/70 text-[9px]">2 urgent</span>}>
                D. Verification Checklist
              </PanelLabel>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Confirm sender through a known contact — not the contact in this document", urgent: true },
                  { label: "Verify payment destination independently before any transfer", urgent: true },
                  { label: "Cross-check invoice number with your own records", urgent: false },
                ].map((item, i) => (
                  <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${item.urgent ? "border-white/[0.10] bg-white/[0.018]" : "border-white/[0.06]"}`}>
                    <div className="w-3.5 h-3.5 rounded border border-white/[0.18] flex-shrink-0 mt-0.5" />
                    <p className={`text-[10px] leading-relaxed flex-1 ${item.urgent ? "text-white/75 font-medium" : "text-white/38"}`}>{item.label}</p>
                    {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1" />}
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
