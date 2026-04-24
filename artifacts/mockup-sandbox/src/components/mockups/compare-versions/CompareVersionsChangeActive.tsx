import { FileText, ArrowLeftRight, Plus, X, ArrowLeft } from "lucide-react";

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
            <span className="text-[11px] text-violet-200/80 font-medium">Change chip active — §10 · p.5</span>
          </div>
        </div>
      </div>

      {/* Evidence banner */}
      <div className="border-b border-violet-500/20 bg-violet-500/[0.07] px-5 py-2.5 flex items-start gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-violet-200/90 mb-1">
            Change chip active — §10 · Dispute Resolution (added in revised)
          </p>
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-[9px] text-white/28 uppercase tracking-[0.1em] mb-1">Original (§10 not present)</p>
              <p className="text-[10px] text-red-300/55 italic">— No dispute resolution clause in original document —</p>
            </div>
            <div>
              <p className="text-[9px] text-emerald-300/50 uppercase tracking-[0.1em] mb-1">Revised §10</p>
              <p className="text-[10px] text-emerald-300/70 leading-snug">"All disputes shall be resolved by binding arbitration per AAA rules. Tenant waives right to jury trial. Arbitration costs shared equally."</p>
            </div>
          </div>
        </div>
        <button className="text-white/25 hover:text-white/50 shrink-0 mt-0.5"><X className="w-3.5 h-3.5" /></button>
      </div>

      {/* Three-zone body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — Original (§10 not present) */}
        <div className="w-[30%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-white/25" />
            <span className="text-[11px] text-white/45 font-medium">Original</span>
            <span className="ml-1 text-[10px] text-white/20">v1</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {[
              { id:"o1", title:"§7 · Notice to Vacate", body:"Either party must provide 60-day written notice before lease end to avoid automatic month-to-month renewal.", dim: true },
              { id:"o2", title:"§8 · Landlord Entry", body:"Landlord must provide 24-hour advance notice before entering the premises for non-emergency purposes.", dim: true },
              { id:"o3", title:"§9 · Governing Law", body:"This lease is governed by the laws of the State of New York. Any disputes will be subject to the jurisdiction of New York courts.", dim: true },
            ].map(sec => (
              <div key={sec.id} className={`rounded-xl border p-3 ${sec.dim ? "border-white/[0.04] bg-white/[0.01]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                <p className="text-[10px] text-white/22 font-medium mb-1.5">{sec.title}</p>
                <p className="text-[10px] text-white/32 leading-relaxed">{sec.body}</p>
              </div>
            ))}
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400/50 shrink-0" />
                <p className="text-[10px] text-red-300/55 font-medium italic">§10 — Not present in original</p>
              </div>
              <p className="text-[10px] text-red-300/35 leading-relaxed italic">Dispute resolution clause does not exist in the original document. This is an addition in the revised version.</p>
            </div>
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center">
            <span className="text-[10px] text-white/18">Section 3 of 4</span>
          </div>
        </div>

        {/* Middle — Revised (§10 highlighted) */}
        <div className="w-[30%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-violet-400/50" />
            <span className="text-[11px] text-violet-300/60 font-medium">Revised</span>
            <span className="ml-1 text-[10px] text-white/20">v2</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {[
              { id:"r1", title:"§7 · Notice to Vacate (revised)", body:"Either party must provide 30-day written notice before lease end to avoid automatic month-to-month renewal.", dim: true, badge: "modified" },
              { id:"r2", title:"§8 · Landlord Entry", body:"Landlord must provide 24-hour advance notice before entering the premises for non-emergency purposes.", dim: true },
              { id:"r3", title:"§9 · Governing Law", body:"This lease is governed by the laws of the State of New York.", dim: true },
            ].map(sec => (
              <div key={sec.id} className={`rounded-xl border p-3 ${sec.dim ? "border-white/[0.04] bg-white/[0.01]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-white/22 font-medium">{sec.title}</p>
                  {sec.badge && <span className="text-[9px] text-amber-300/50 font-medium">{sec.badge}</span>}
                </div>
                <p className="text-[10px] text-white/32 leading-relaxed">{sec.body}</p>
              </div>
            ))}
            {/* Active highlighted section */}
            <div className="rounded-xl border-2 border-violet-500/50 bg-violet-500/[0.08] ring-2 ring-violet-500/20 p-3.5 relative">
              <div className="absolute -top-2 left-3">
                <span className="h-4 px-1.5 rounded bg-violet-600 border border-violet-400/50 text-[9px] text-white font-semibold flex items-center gap-1">
                  <Plus className="w-2.5 h-2.5" /> Source — §10·p.5
                </span>
              </div>
              <p className="text-[10px] text-violet-300/65 font-medium mb-1.5 mt-1">§10 · Dispute Resolution</p>
              <p className="text-[11px] text-emerald-300/75 leading-relaxed">
                All disputes shall be resolved by{" "}
                <span className="bg-emerald-500/20 text-emerald-300/90 px-0.5 rounded underline decoration-emerald-400/40">binding arbitration per AAA rules</span>.{" "}
                Tenant{" "}
                <span className="bg-emerald-500/20 text-emerald-300/90 px-0.5 rounded underline decoration-emerald-400/40">waives right to jury trial</span>.{" "}
                Arbitration costs shared equally.
              </p>
              <div className="mt-2 p-2 rounded-lg bg-emerald-500/[0.07] border border-emerald-500/15">
                <p className="text-[10px] text-emerald-300/60 italic">"All disputes shall be resolved by binding arbitration per AAA rules. Tenant waives right to jury trial."</p>
              </div>
            </div>
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center">
            <span className="text-[10px] text-white/18">Section 4 of 5</span>
          </div>
        </div>

        {/* Right — Change intelligence panel (change active state) */}
        <div className="flex-1 flex flex-col overflow-y-auto">

          {/* Back link */}
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-1.5 shrink-0">
            <ArrowLeft className="w-3 h-3 text-white/25" />
            <span className="text-[11px] text-white/30">Return to all changes</span>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Active change card */}
            <div className="rounded-xl border-2 border-violet-500/45 bg-violet-500/[0.07] ring-2 ring-violet-500/18 p-4">
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <p className="text-xs font-semibold text-white/85">Dispute resolution clause — added</p>
                    <CChip label="§10·p.5" active />
                  </div>
                  <span className="h-4 px-1.5 rounded border bg-emerald-500/12 border-emerald-500/20 text-[9px] font-medium text-emerald-300/75 inline-flex items-center gap-1">
                    <Plus className="w-2.5 h-2.5" /> Added
                  </span>
                </div>
              </div>
              <div className="pl-4 space-y-2">
                <p className="text-[11px] text-white/60 leading-snug">New arbitration clause added in revised document. Disputes resolved by binding arbitration, not courts. Tenant waives right to jury trial.</p>
                <div className="rounded-lg border border-amber-500/18 bg-amber-500/[0.05] p-2.5">
                  <p className="text-[10px] text-amber-300/65 font-semibold mb-1">Term to verify before signing:</p>
                  <p className="text-[10px] text-white/45 leading-snug">Binding arbitration waives jury trial rights. This may limit legal options. Review with a qualified professional if this is high-risk for your situation.</p>
                </div>
                <p className="text-[10px] text-violet-300/50">› Original highlighted: §10 not present · Revised highlighted: §10 · p.5</p>
              </div>
            </div>

            {/* Other changes (dim) */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/18 mb-2.5">OTHER CHANGES</p>
              <div className="space-y-2 opacity-45">
                {[
                  { t:"Monthly rent increased to $3,450",         chip:"§4·p.2",  type:"Modified" },
                  { t:"Notice period reduced to 30 days",          chip:"§7·p.3",  type:"Modified" },
                  { t:"Pet addendum removed",                      chip:"§5·p.2",  type:"Removed" },
                  { t:"Landlord entry clause moved to §11",        chip:"§11·p.4", type:"Moved" },
                ].map((c,i) => (
                  <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-2.5 flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.type==="Removed"?"bg-red-500":c.type==="Modified"?"bg-amber-500":"bg-blue-400"}`} />
                    <p className="text-[11px] text-white/40 flex-1 leading-snug">{c.t}</p>
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
