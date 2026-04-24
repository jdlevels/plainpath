import { FileText, ArrowLeftRight, Plus, Minus, Edit3, X, ArrowLeft, ChevronRight } from "lucide-react";

function CChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />}
      {label}
    </span>
  );
}

export function CompareVersionsChangeActive() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <span className="text-white/15 text-xs mx-0.5">›</span>
        <span className="text-white/40 text-xs">Compare Versions</span>
        <span className="text-white/15 text-xs mx-0.5">›</span>
        <span className="text-white/45 text-xs truncate">Lease_v1 vs Lease_v2</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full bg-violet-500/20 border border-violet-500/35 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-[11px] text-violet-200/80 font-medium">Change chip active — §7 · Notice Period</span>
          </div>
        </div>
      </div>

      {/* Before / After evidence banner */}
      <div className="border-b border-violet-500/20 bg-violet-500/[0.07] px-5 py-2.5 flex items-start gap-3 shrink-0">
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] text-red-300/50 uppercase tracking-[0.1em] font-semibold mb-1">Before (Original §7)</p>
            <p className="text-[10px] text-red-300/65 italic leading-snug">"…either party must provide <span className="bg-red-500/20 px-0.5 rounded text-red-300/85 not-italic font-semibold">60 days</span> written notice before lease end…"</p>
          </div>
          <div>
            <p className="text-[9px] text-emerald-300/55 uppercase tracking-[0.1em] font-semibold mb-1">After (Revised §7)</p>
            <p className="text-[10px] text-emerald-300/70 italic leading-snug">"…either party must provide <span className="bg-emerald-500/20 px-0.5 rounded text-emerald-300/90 not-italic font-semibold">30 days</span> written notice before lease end…"</p>
          </div>
        </div>
        <button className="text-white/22 hover:text-white/45 shrink-0 mt-0.5"><X className="w-3.5 h-3.5" /></button>
      </div>

      {/* Three-zone body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — Original (§7 highlighted) */}
        <div className="w-[33%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-white/25" />
            <span className="text-[11px] text-white/50 font-semibold">Original</span>
            <span className="text-[10px] text-white/22 ml-1">v1</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 opacity-45">
              <p className="text-[10px] text-white/28 font-medium mb-1.5">§4 · Rent & Payment</p>
              <p className="text-[10px] text-white/40 leading-relaxed">Monthly rent: $3,200.00 due on the 1st. Late fee: 5% after 5-day grace period.</p>
            </div>

            {/* Active section — old language highlighted */}
            <div className="rounded-xl border-2 border-violet-500/50 bg-violet-500/[0.07] ring-2 ring-violet-500/20 p-3.5 relative">
              <div className="absolute -top-2 left-3">
                <span className="h-4 px-1.5 rounded bg-violet-600 border border-violet-400/50 text-[9px] text-white font-semibold flex items-center gap-1">
                  ● Source — §7·p.3 (original)
                </span>
              </div>
              <p className="text-[10px] text-white/30 font-medium mb-2 mt-1">§7 · Notice to Vacate</p>
              <p className="text-[11px] text-white/65 leading-relaxed">
                Either party must provide{" "}
                <span className="bg-red-500/25 text-red-300/90 px-1 rounded border border-red-400/25 line-through decoration-red-400/40">60 days</span>{" "}
                written notice before lease end to avoid automatic month-to-month renewal.
              </p>
              <div className="mt-2.5 p-2 rounded-lg bg-red-500/[0.06] border border-red-400/15">
                <p className="text-[10px] text-red-300/55 italic">"…provide 60 days written notice before lease end…"</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 opacity-45">
              <p className="text-[10px] text-white/28 font-medium mb-1.5">§9 · Governing Law</p>
              <p className="text-[10px] text-white/38 leading-relaxed">This lease is governed by the laws of the State of Redwood. Disputes subject to Redwood County jurisdiction.</p>
            </div>
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center">
            <span className="text-[10px] text-white/18">Section 3 of 4</span>
          </div>
        </div>

        {/* Middle — Revised (§7 highlighted) */}
        <div className="w-[33%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-violet-400/55" />
            <span className="text-[11px] text-violet-300/65 font-semibold">Revised</span>
            <span className="text-[10px] text-white/22 ml-1">v2</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 opacity-45">
              <p className="text-[10px] text-white/28 font-medium mb-1.5">§4 · Rent & Payment (revised)</p>
              <p className="text-[10px] text-white/38 leading-relaxed">Monthly rent: $3,450.00 due on the 1st. Late fee: 8% after 5-day grace period.</p>
            </div>

            {/* Active section — new language highlighted */}
            <div className="rounded-xl border-2 border-violet-500/50 bg-violet-500/[0.07] ring-2 ring-violet-500/20 p-3.5 relative">
              <div className="absolute -top-2 left-3">
                <span className="h-4 px-1.5 rounded bg-violet-600 border border-violet-400/50 text-[9px] text-white font-semibold flex items-center gap-1">
                  ● Source — §7·p.3 (revised)
                </span>
              </div>
              <p className="text-[10px] text-white/30 font-medium mb-2 mt-1">§7 · Notice to Vacate</p>
              <p className="text-[11px] text-white/65 leading-relaxed">
                Either party must provide{" "}
                <span className="bg-emerald-500/25 text-emerald-300/95 px-1 rounded border border-emerald-400/30 font-semibold underline decoration-emerald-400/40">30 days</span>{" "}
                written notice before lease end to avoid automatic month-to-month renewal.
              </p>
              <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-400/15">
                <p className="text-[10px] text-emerald-300/60 italic">"…provide 30 days written notice before lease end…"</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 opacity-45">
              <p className="text-[10px] text-white/28 font-medium mb-1.5">§9 · Governing Law</p>
              <p className="text-[10px] text-white/38 leading-relaxed">This lease is governed by the laws of the State of Redwood.</p>
            </div>
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center">
            <span className="text-[10px] text-white/18">Section 3 of 5</span>
          </div>
        </div>

        {/* Right — Active change detail */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-1.5 shrink-0">
            <ArrowLeft className="w-3 h-3 text-white/25" />
            <span className="text-[11px] text-white/30">All changes</span>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Active change card */}
            <div className="rounded-xl border-2 border-violet-500/40 bg-violet-500/[0.07] ring-2 ring-violet-500/15 p-4">
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <p className="text-xs font-bold text-white/88">Notice period shortened</p>
                    <CChip label="§7·p.3" active />
                  </div>
                  <span className="h-4 px-1.5 rounded border bg-amber-500/12 border-amber-500/20 text-[9px] font-medium text-amber-300/75 inline-flex items-center gap-1">
                    <Edit3 className="w-2.5 h-2.5" /> Modified
                  </span>
                </div>
              </div>
              <div className="pl-4 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <span className="text-[9px] text-red-300/50 font-semibold w-10 shrink-0 mt-0.5">Before</span>
                    <p className="text-[10px] text-white/45 leading-snug line-through decoration-red-400/30">60 days written notice required before lease end.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[9px] text-emerald-300/55 font-semibold w-10 shrink-0 mt-0.5">After</span>
                    <p className="text-[10px] text-emerald-300/70 leading-snug">30 days written notice required before lease end.</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/55 leading-snug">Notice period cut in half — less time to give non-renewal notice before auto-renewal triggers.</p>
                <div className="rounded-lg border border-amber-500/16 bg-amber-500/[0.04] p-2.5">
                  <p className="text-[10px] text-amber-300/65 font-semibold mb-1">Term to verify:</p>
                  <p className="text-[10px] text-white/42 leading-snug">A missed 30-day window triggers automatic month-to-month renewal. Verify your timeline and set a reminder.</p>
                </div>
                <p className="text-[10px] text-violet-300/45">› Original §7·p.3 highlighted left · Revised §7·p.3 highlighted middle</p>
              </div>
            </div>

            {/* Other changes (dimmed) */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/18 mb-2.5">OTHER CHANGES</p>
              <div className="space-y-1.5 opacity-45">
                {[
                  { t:"Arbitration clause added",       chip:"§10·p.5", type:"Added",    dot:"bg-emerald-500", icon:<Plus className="w-2.5 h-2.5"/> },
                  { t:"Monthly rent increased",          chip:"§4·p.2",  type:"Modified", dot:"bg-amber-500",   icon:<Edit3 className="w-2.5 h-2.5"/> },
                  { t:"Pet addendum removed",            chip:"§5·p.2",  type:"Removed",  dot:"bg-red-400",     icon:<Minus className="w-2.5 h-2.5"/> },
                  { t:"Landlord entry moved to §11",     chip:"§11·p.4", type:"Moved",    dot:"bg-blue-400",    icon:<ChevronRight className="w-2.5 h-2.5"/> },
                ].map((c, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-white/[0.03]">
                    <div className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
                    <p className="text-[10px] text-white/40 flex-1 leading-snug">{c.t}</p>
                    <CChip label={c.chip} />
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
