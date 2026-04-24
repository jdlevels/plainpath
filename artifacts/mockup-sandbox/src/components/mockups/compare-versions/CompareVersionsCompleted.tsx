import {
  FileText, ArrowLeftRight, BookOpen, Tag, Plus, Minus, Edit3,
  AlertTriangle, Info, ChevronDown, Layers, RefreshCcw, Download
} from "lucide-react";

function CChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer transition-all ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />}
      {label}
    </span>
  );
}

const CHANGE_TYPE_STYLE = {
  Added:    { dot: "bg-emerald-500", border: "border-emerald-500/18", bg: "bg-emerald-500/[0.04]", badge: "bg-emerald-500/12 border-emerald-500/20 text-emerald-300/75" },
  Removed:  { dot: "bg-red-500",    border: "border-red-500/18",    bg: "bg-red-500/[0.04]",    badge: "bg-red-500/12 border-red-500/18 text-red-300/70" },
  Modified: { dot: "bg-amber-500",  border: "border-amber-500/18",  bg: "bg-amber-500/[0.04]",  badge: "bg-amber-500/12 border-amber-500/20 text-amber-300/70" },
  Moved:    { dot: "bg-blue-400",   border: "border-blue-500/18",   bg: "bg-blue-500/[0.03]",   badge: "bg-blue-500/12 border-blue-500/18 text-blue-300/65" },
};

const KEY_CHANGES = [
  { id:"ch1", title:"Dispute resolution clause — added", type:"Added",    chip:"§10·p.5", plain:"New arbitration clause added. Disputes resolved by binding arbitration, not courts. Waives right to jury trial.", importance:"Review before signing." },
  { id:"ch2", title:"Monthly rent increased from $3,200 to $3,450", type:"Modified", chip:"§4·p.2", plain:"$250/month increase across 12 months ($3,000 added obligation). Late fee increased from 5% to 8%.", importance:"Verify rent increase is acceptable." },
  { id:"ch3", title:"Notice period reduced from 60 days to 30 days", type:"Modified", chip:"§7·p.3", plain:"Tenant now has only 30 days to give non-renewal notice. Shorter window to avoid auto-renewal.", importance:"Set a reminder: 30 days before expiry." },
  { id:"ch4", title:"Security deposit — pet addendum removed", type:"Removed", chip:"§5·p.2", plain:"Pet deposit clause removed entirely. Verify whether pets are now prohibited or if terms changed.", importance:"Confirm pet policy with landlord." },
  { id:"ch5", title:"Landlord entry notice maintained at 24 hours", type:"Moved", chip:"§8·p.4", plain:"Entry notice clause moved from §8 to §11. Language unchanged. Landlord must give 24-hour notice.", importance:null },
];

export function CompareVersionsCompleted() {
  const origSections = [
    { id:"o1", title:"§1–2 · Parties & Premises", body:"Lease between Jordan Chen (\"Tenant\") and Harborview Properties LLC (\"Landlord\") for Apt 4B, 182 Mercer St, New York, NY 10012, from March 1, 2025.", diff:null },
    { id:"o2", title:"§4 · Rent & Payment", body:"Monthly rent: $3,200.00 due on the 1st. Late fee: 5% after 5-day grace period. Payment by check or ACH.", diff:"modified" },
    { id:"o3", title:"§5 · Security Deposit", body:"Security deposit: $6,400. Pet addendum: Additional $500 pet deposit. Refundable subject to condition report.", diff:"removed" },
    { id:"o4", title:"§7 · Notice to Vacate", body:"Either party must provide 60-day written notice before lease end to avoid automatic month-to-month renewal.", diff:"modified" },
  ];

  const revSections = [
    { id:"r1", title:"§1–2 · Parties & Premises", body:"Lease between Jordan Chen (\"Tenant\") and Harborview Properties LLC (\"Landlord\") for Apt 4B, 182 Mercer St, New York, NY 10012, from March 1, 2025.", diff:null },
    { id:"r2", title:"§4 · Rent & Payment", body:"Monthly rent: $3,450.00 due on the 1st. Late fee: 8% after 5-day grace period. Payment by check or ACH.", diff:"modified" },
    { id:"r3", title:"§5 · Security Deposit", body:"Security deposit: $6,900.00, refundable subject to condition report on move-out within 30 days.", diff:"removed-orig" },
    { id:"r4", title:"§7 · Notice to Vacate", body:"Either party must provide 30-day written notice before lease end to avoid automatic month-to-month renewal.", diff:"modified" },
    { id:"r5", title:"§10 · Dispute Resolution (new)", body:"All disputes shall be resolved by binding arbitration per AAA rules. Tenant waives right to jury trial. Arbitration costs shared equally.", diff:"added" },
  ];

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
        <span className="text-white/50 text-xs truncate max-w-[220px]">Lease_v1 vs Lease_v2</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center gap-1.5">
            <ArrowLeftRight className="w-3 h-3 text-white/40" />
            <span className="text-[11px] text-white/50 font-medium">Compare Overview</span>
          </div>
          <button className="h-7 px-3 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5 hover:bg-white/[0.04]">
            <Download className="w-3 h-3" /> Export
          </button>
          <button className="h-7 px-3 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5 hover:bg-white/[0.04]">
            <RefreshCcw className="w-3 h-3" /> Re-compare
          </button>
        </div>
      </div>

      {/* Three-zone body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — Original */}
        <div className="w-[30%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-white/25" />
            <span className="text-[11px] text-white/45 font-medium">Original</span>
            <span className="ml-1 text-[10px] text-white/20">Lease_v1.pdf</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {origSections.map(sec => (
              <div key={sec.id} className={`rounded-xl border p-3 ${
                sec.diff === "modified" ? "border-amber-500/22 bg-amber-500/[0.04]" :
                sec.diff === "removed"  ? "border-red-500/22 bg-red-500/[0.04]" :
                "border-white/[0.06] bg-white/[0.015]"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-white/28 font-medium">{sec.title}</p>
                  {sec.diff === "modified" && <span className="text-[9px] text-amber-300/60 font-medium">modified</span>}
                  {sec.diff === "removed"  && <span className="text-[9px] text-red-300/60 font-medium">removed in v2</span>}
                </div>
                <p className={`text-[10px] leading-relaxed ${sec.diff === "removed" ? "text-red-300/45 line-through decoration-red-500/30" : "text-white/42"}`}>{sec.body}</p>
              </div>
            ))}
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center justify-between">
            <span className="text-[10px] text-white/18">4 sections</span>
            <div className="flex gap-1">{[1,2,3,4].map(n => <button key={n} className={`w-5 h-5 rounded text-[9px] ${n<=2?"bg-amber-500/20 text-amber-300/60":"text-white/20"}`}>{n}</button>)}</div>
          </div>
        </div>

        {/* Middle — Revised */}
        <div className="w-[30%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-violet-400/50" />
            <span className="text-[11px] text-violet-300/60 font-medium">Revised</span>
            <span className="ml-1 text-[10px] text-white/20">Lease_v2.pdf</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {revSections.map(sec => (
              <div key={sec.id} className={`rounded-xl border p-3 ${
                sec.diff === "added"      ? "border-emerald-500/22 bg-emerald-500/[0.04]" :
                sec.diff === "modified"   ? "border-amber-500/22 bg-amber-500/[0.04]" :
                sec.diff === "removed-orig" ? "border-white/[0.06] bg-white/[0.015] opacity-50" :
                "border-white/[0.06] bg-white/[0.015]"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-white/28 font-medium">{sec.title}</p>
                  {sec.diff === "added"    && <span className="text-[9px] text-emerald-300/65 font-medium flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" />added</span>}
                  {sec.diff === "modified" && <span className="text-[9px] text-amber-300/60 font-medium flex items-center gap-0.5"><Edit3 className="w-2.5 h-2.5" />changed</span>}
                </div>
                <p className={`text-[10px] leading-relaxed ${
                  sec.diff === "added"    ? "text-emerald-300/55" :
                  sec.diff === "modified" ? "text-white/42" :
                  sec.diff === "removed-orig" ? "text-white/22" :
                  "text-white/42"
                }`}>{sec.body}</p>
              </div>
            ))}
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center justify-between">
            <span className="text-[10px] text-white/18">5 sections</span>
            <div className="flex gap-1">{[1,2,3,4,5].map(n => <button key={n} className={`w-5 h-5 rounded text-[9px] ${n<=2?"bg-amber-500/20 text-amber-300/60":n===5?"bg-emerald-500/20 text-emerald-300/60":"text-white/20"}`}>{n}</button>)}</div>
          </div>
        </div>

        {/* Right — Change intelligence */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-600/20 border border-violet-500/25 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white/90">Lease Agreement — v1 vs v2</p>
                <p className="text-[11px] text-white/30 mt-0.5">Residential Lease · Harborview Properties · Jordan Chen</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 space-y-4">

            {/* A. Change Summary */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">A. CHANGE SUMMARY</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[11px] text-white/55 leading-relaxed space-y-1.5">
                <p><strong className="text-white/72 font-semibold">Overall:</strong> Moderate changes across 3 of 5 sections. Changes include financial increases, a shorter notice window, and a new arbitration clause.</p>
                <p><strong className="text-white/72 font-semibold">Inspect first:</strong> The <span className="text-amber-300/80 font-semibold">new arbitration clause (§10)</span> waives jury trial rights, and the <span className="text-amber-300/80 font-semibold">rent increase to $3,450 (§4)</span> adds $3,000/year in obligation.</p>
                <p><strong className="text-white/72 font-semibold">Notice period</strong> reduced from 60 to 30 days — shorter window to act before auto-renewal.</p>
              </div>
              <div className="mt-2 flex items-start gap-1.5 px-1">
                <Info className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/28">Change comparison support — source-backed changes, not legal advice.</p>
              </div>
            </div>

            {/* B. Change Strip */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowLeftRight className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">B. CHANGE STRIP</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 flex flex-wrap gap-1.5">
                {[
                  { label: "14 changes found",         cls: "bg-violet-500/15 border-violet-500/22 text-violet-300/80" },
                  { label: "3 additions",              cls: "bg-emerald-500/15 border-emerald-500/22 text-emerald-300/80" },
                  { label: "2 removals",               cls: "bg-red-500/12 border-red-500/18 text-red-300/75" },
                  { label: "6 modified terms",         cls: "bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
                  { label: "High compare confidence",  cls: "bg-emerald-500/12 border-emerald-500/18 text-emerald-300/70" },
                  { label: "3 terms to verify",        cls: "bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
                ].map(c => (
                  <span key={c.label} className={`h-6 px-2.5 rounded-full border text-[10px] font-medium ${c.cls}`}>{c.label}</span>
                ))}
              </div>
            </div>

            {/* C. Key Changes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-white/25" />
                  <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">C. KEY CHANGES</p>
                </div>
                <span className="text-[10px] text-white/28">5 of 14</span>
              </div>
              <div className="space-y-2">
                {KEY_CHANGES.map(ch => {
                  const s = CHANGE_TYPE_STYLE[ch.type as keyof typeof CHANGE_TYPE_STYLE];
                  return (
                    <div key={ch.id} className={`rounded-xl border ${s.border} ${s.bg} p-3`}>
                      <div className="flex items-start gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${s.dot} shrink-0 mt-1`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-white/80">{ch.title}</p>
                            <CChip label={ch.chip} />
                          </div>
                          <span className={`mt-1 h-4 px-1.5 rounded border text-[9px] font-medium inline-flex items-center gap-1 ${s.badge}`}>
                            {ch.type === "Added" && <Plus className="w-2.5 h-2.5" />}
                            {ch.type === "Removed" && <Minus className="w-2.5 h-2.5" />}
                            {ch.type === "Modified" && <Edit3 className="w-2.5 h-2.5" />}
                            {ch.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/48 pl-4 leading-snug">{ch.plain}</p>
                      {ch.importance && <p className="text-[10px] text-violet-300/50 pl-4 mt-1.5">› {ch.importance}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* G. Possible Risk Changes */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">G. POSSIBLE RISK CHANGES</p>
              </div>
              <div className="space-y-2">
                {[
                  { t:"Arbitration clause may reduce legal options", n:"New §10 requires binding arbitration — waives right to jury trial. Verify before signing or acting.", chip:"§10·p.5" },
                  { t:"Shorter notice window increases auto-renewal risk", n:"30-day notice (down from 60) leaves less time to act before automatic renewal triggers.", chip:"§7·p.3" },
                  { t:"Rent increase changes total obligation", n:"$250/month increase adds $3,000 over the term. Late fee increased from 5% to 8%. Verify terms.", chip:"§4·p.2" },
                ].map((r,i) => (
                  <div key={i} className="rounded-xl border border-amber-500/16 bg-amber-500/[0.03] p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
                      <p className="text-[11px] font-semibold text-white/65 flex-1">{r.t}</p>
                      <CChip label={r.chip} />
                    </div>
                    <p className="text-[10px] text-white/38 pl-3.5 leading-snug">{r.n}</p>
                    <p className="text-[10px] text-amber-300/40 pl-3.5 mt-1.5">› Review with a qualified professional if high-risk.</p>
                  </div>
                ))}
              </div>
            </div>

            {/* H. Source Traceability */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] cursor-pointer hover:bg-white/[0.025]">
              <div className="flex items-center gap-2.5 px-4 py-3">
                <Layers className="w-3.5 h-3.5 text-white/20" />
                <p className="text-white/38 text-xs font-medium flex-1">H. Source / Change Traceability</p>
                <span className="h-4 px-1.5 rounded border bg-violet-500/10 border-violet-500/18 text-[9px] text-violet-300/55">14 change chips</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/18" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
