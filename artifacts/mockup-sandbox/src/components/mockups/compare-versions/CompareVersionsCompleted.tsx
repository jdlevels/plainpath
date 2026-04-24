import {
  FileText, ArrowLeftRight, BookOpen, Tag, Plus, Minus, Edit3,
  AlertTriangle, Info, ChevronDown, Layers, RefreshCcw, Download, Move
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

const TYPE_STYLE = {
  Added:    { dot:"bg-emerald-500", border:"border-emerald-500/18", bg:"bg-emerald-500/[0.04]", badge:"bg-emerald-500/12 border-emerald-500/20 text-emerald-300/80", icon:<Plus className="w-2.5 h-2.5"/> },
  Removed:  { dot:"bg-red-400",    border:"border-red-400/18",    bg:"bg-red-400/[0.03]",    badge:"bg-red-400/10 border-red-400/15 text-red-300/70",             icon:<Minus className="w-2.5 h-2.5"/> },
  Modified: { dot:"bg-amber-500",  border:"border-amber-500/18",  bg:"bg-amber-500/[0.04]",  badge:"bg-amber-500/12 border-amber-500/20 text-amber-300/75",        icon:<Edit3 className="w-2.5 h-2.5"/> },
  Moved:    { dot:"bg-blue-400",   border:"border-blue-500/15",   bg:"bg-blue-500/[0.03]",   badge:"bg-blue-500/10 border-blue-500/15 text-blue-300/65",           icon:<Move className="w-2.5 h-2.5"/> },
};

const KEY_CHANGES = [
  { id:"ch1", type:"Added",    chip:"§10·p.5", title:"Arbitration clause added",              plain:"All disputes go to binding arbitration. Waives jury trial rights.", action:"Term to verify before signing." },
  { id:"ch2", type:"Modified", chip:"§4·p.2",  title:"Monthly rent increased",               plain:"$3,200 → $3,450/mo. Late fee raised from 5% to 8%.", action:"Verify increase is acceptable." },
  { id:"ch3", type:"Modified", chip:"§7·p.3",  title:"Notice period shortened",              plain:"60 days → 30 days to give non-renewal notice before auto-renewal.", action:"Set a reminder: 30 days before expiry." },
  { id:"ch4", type:"Removed",  chip:"§5·p.2",  title:"Pet addendum removed",                 plain:"Pet deposit clause no longer present. Confirm pet policy separately.", action:null },
  { id:"ch5", type:"Moved",    chip:"§11·p.4", title:"Landlord entry clause relocated",      plain:"Language unchanged. Moved from §8 to §11. 24-hour notice maintained.", action:null },
];

const ADDED = [
  { chip:"§10·p.5", term:"Dispute resolution clause",      where:"§10 — new section, p.5", meaning:"Binding arbitration required. Waives right to jury trial for all disputes.", action:"Term to verify before signing." },
  { chip:"§4·p.2",  term:"Late fee increase",              where:"§4 · Rent & Payment",    meaning:"Late fee raised from 5% to 8%. This is new language in the revised version.", action:null },
];

const REMOVED = [
  { chip:"§5·p.2", term:"Pet addendum", where:"§5 · Security Deposit (original only)", meaning:"Pet deposit clause removed entirely from the revised version.", why:"Verify whether pets are now disallowed or if terms were moved elsewhere." },
];

const MODIFIED = [
  { chip:"§7·p.3", term:"Notice period", before:"60 days written notice required before lease end.", after:"30 days written notice required before lease end.", changed:"Notice period cut in half — less time to avoid auto-renewal.", action:"Term to verify — set a calendar reminder." },
  { chip:"§4·p.2", term:"Monthly rent",  before:"$3,200.00 per month, due on the 1st.", after:"$3,450.00 per month, due on the 1st.", changed:"$250/month increase, adding $3,000/year in obligation.", action:"Verify this is acceptable before signing." },
];

export function CompareVersionsCompleted() {
  const origSections = [
    { title:"§1–2 · Parties & Premises", body:"Lease between Avery Park (\"Tenant\") and Westfield Realty LLC (\"Landlord\") for Unit 3C, 44 Harbor Lane, commencing March 1, 2025.", diff:null },
    { title:"§4 · Rent & Payment",        body:"Monthly rent: $3,200.00 due on the 1st. Late fee: 5% after 5-day grace period. Payment by check or ACH.", diff:"modified" },
    { title:"§5 · Security Deposit",      body:"Security deposit: $6,400. Pet addendum: Additional $500 pet deposit. Refundable subject to move-out condition report.", diff:"removed" },
    { title:"§7 · Notice to Vacate",      body:"Either party must provide 60 days written notice before lease end to avoid automatic month-to-month renewal.", diff:"modified" },
  ];

  const revSections = [
    { title:"§1–2 · Parties & Premises", body:"Lease between Avery Park (\"Tenant\") and Westfield Realty LLC (\"Landlord\") for Unit 3C, 44 Harbor Lane, commencing March 1, 2025.", diff:null },
    { title:"§4 · Rent & Payment",        body:"Monthly rent: $3,450.00 due on the 1st. Late fee: 8% after 5-day grace period. Payment by check or ACH.", diff:"modified" },
    { title:"§5 · Security Deposit",      body:"Security deposit: $6,900.00, refundable subject to move-out condition report within 30 days.", diff:"removed-orig" },
    { title:"§7 · Notice to Vacate",      body:"Either party must provide 30 days written notice before lease end to avoid automatic month-to-month renewal.", diff:"modified" },
    { title:"§10 · Dispute Resolution",   body:"All disputes shall be resolved by binding arbitration per AAA rules. Tenant waives right to jury trial. Arbitration costs shared equally.", diff:"added" },
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
        <span className="text-white/50 text-xs truncate max-w-[180px]">Lease_v1 vs Lease_v2</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center gap-1.5">
            <ArrowLeftRight className="w-3 h-3 text-white/40" />
            <span className="text-[11px] text-white/50 font-medium">Compare Overview</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5 hover:bg-white/[0.04]">
            <Download className="w-3 h-3" /> Export
          </button>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5 hover:bg-white/[0.04]">
            <RefreshCcw className="w-3 h-3" /> Re-compare
          </button>
        </div>
      </div>

      {/* Three-zone body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — Original (35%) */}
        <div className="w-[33%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-white/25" />
            <span className="text-[11px] text-white/50 font-semibold">Original</span>
            <span className="text-[10px] text-white/22 ml-1">v1 · Lease_A.pdf</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {origSections.map((sec, i) => (
              <div key={i} className={`rounded-xl border p-3 ${
                sec.diff === "modified" ? "border-amber-500/22 bg-amber-500/[0.04]" :
                sec.diff === "removed"  ? "border-red-400/18 bg-red-400/[0.03]" :
                "border-white/[0.06] bg-white/[0.015]"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-white/28 font-medium">{sec.title}</p>
                  {sec.diff === "modified" && <Edit3 className="w-2.5 h-2.5 text-amber-400/50" />}
                  {sec.diff === "removed"  && <Minus className="w-2.5 h-2.5 text-red-400/50" />}
                </div>
                <p className={`text-[10px] leading-relaxed ${
                  sec.diff === "removed" ? "text-white/32 line-through decoration-red-400/25" :
                  sec.diff === "modified" ? "text-white/45" : "text-white/42"
                }`}>{sec.body}</p>
              </div>
            ))}
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center justify-between">
            <span className="text-[10px] text-white/18">4 sections</span>
            <div className="flex gap-1">{[1,2,3,4].map(n=><button key={n} className={`w-5 h-5 rounded text-[9px] ${n<=2?"bg-amber-500/18 text-amber-300/55":"text-white/20"}`}>{n}</button>)}</div>
          </div>
        </div>

        {/* Middle — Revised (35%) */}
        <div className="w-[33%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-violet-400/55" />
            <span className="text-[11px] text-violet-300/65 font-semibold">Revised</span>
            <span className="text-[10px] text-white/22 ml-1">v2 · Lease_B.pdf</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {revSections.map((sec, i) => (
              <div key={i} className={`rounded-xl border p-3 ${
                sec.diff === "added"        ? "border-emerald-500/22 bg-emerald-500/[0.04]" :
                sec.diff === "modified"     ? "border-amber-500/22 bg-amber-500/[0.04]" :
                sec.diff === "removed-orig" ? "border-white/[0.04] bg-white/[0.01] opacity-40" :
                "border-white/[0.06] bg-white/[0.015]"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-white/28 font-medium">{sec.title}</p>
                  {sec.diff === "added"    && <span className="text-[9px] text-emerald-300/60 flex items-center gap-0.5 font-medium"><Plus className="w-2.5 h-2.5"/>new</span>}
                  {sec.diff === "modified" && <Edit3 className="w-2.5 h-2.5 text-amber-400/50" />}
                </div>
                <p className={`text-[10px] leading-relaxed ${
                  sec.diff === "added" ? "text-emerald-300/60" :
                  sec.diff === "modified" ? "text-white/45" : "text-white/40"
                }`}>{sec.body}</p>
              </div>
            ))}
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center justify-between">
            <span className="text-[10px] text-white/18">5 sections</span>
            <div className="flex gap-1">{[1,2,3,4,5].map(n=><button key={n} className={`w-5 h-5 rounded text-[9px] ${n<=2?"bg-amber-500/18 text-amber-300/55":n===5?"bg-emerald-500/18 text-emerald-300/55":"text-white/20"}`}>{n}</button>)}</div>
          </div>
        </div>

        {/* Right — Change intelligence (34%) */}
        <div className="flex-1 flex flex-col overflow-y-auto">

          {/* Doc identity */}
          <div className="px-4 pt-3.5 pb-3 border-b border-white/[0.04] shrink-0">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-600/18 border border-violet-500/22 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white/88">Lease Agreement — v1 vs v2</p>
                <p className="text-[10px] text-white/28 mt-0.5">Residential Lease · Westfield Realty · Avery Park</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3.5 space-y-4">

            {/* A. Change Summary */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">A. CHANGE SUMMARY</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[11px] text-white/55 leading-relaxed space-y-1.5">
                <p><strong className="text-white/70 font-semibold">Compared:</strong> Lease Agreement v1 (4 pages) vs v2 (5 pages). 14 changes found across 3 of 5 sections.</p>
                <p><strong className="text-white/70 font-semibold">What changed:</strong> Rent increased, notice period shortened, a new arbitration clause added, and pet addendum removed.</p>
                <p><strong className="text-white/70 font-semibold">Inspect first:</strong> The <span className="text-amber-300/80 font-semibold">arbitration clause (§10)</span> is a new addition that waives jury trial rights, and the <span className="text-amber-300/80 font-semibold">notice period (§7)</span> was cut from 60 to 30 days.</p>
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
                  { label:"14 changes found",        cls:"bg-violet-500/15 border-violet-500/22 text-violet-300/80" },
                  { label:"3 additions",             cls:"bg-emerald-500/15 border-emerald-500/22 text-emerald-300/80" },
                  { label:"2 removals",              cls:"bg-red-400/12 border-red-400/18 text-red-300/70" },
                  { label:"6 modified terms",        cls:"bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
                  { label:"3 terms to verify",       cls:"bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
                  { label:"High compare confidence", cls:"bg-emerald-500/12 border-emerald-500/18 text-emerald-300/70" },
                ].map(c=>(
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
              <div className="space-y-1.5">
                {KEY_CHANGES.map(ch => {
                  const s = TYPE_STYLE[ch.type as keyof typeof TYPE_STYLE];
                  return (
                    <div key={ch.id} className={`rounded-xl border ${s.border} ${s.bg} p-3 cursor-pointer hover:brightness-110 transition-all`}>
                      <div className="flex items-start gap-2 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0 mt-1.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[11px] font-semibold text-white/80">{ch.title}</p>
                            <CChip label={ch.chip} />
                          </div>
                          <span className={`mt-0.5 h-4 px-1.5 rounded border text-[9px] font-medium inline-flex items-center gap-0.5 ${s.badge}`}>
                            {s.icon} {ch.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/45 pl-3.5 leading-snug">{ch.plain}</p>
                      {ch.action && <p className="text-[10px] text-violet-300/50 pl-3.5 mt-1">› {ch.action}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D. Added Language */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Plus className="w-3 h-3 text-emerald-400/50" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">D. ADDED LANGUAGE</p>
              </div>
              <div className="space-y-1.5">
                {ADDED.map((a, i) => (
                  <div key={i} className="rounded-xl border border-emerald-500/18 bg-emerald-500/[0.03] p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-[11px] font-semibold text-white/72 flex-1">{a.term}</p>
                      <CChip label={a.chip} />
                    </div>
                    <p className="text-[10px] text-white/32 pl-3.5 mb-0.5">{a.where}</p>
                    <p className="text-[10px] text-white/45 pl-3.5 leading-snug">{a.meaning}</p>
                    {a.action && <p className="text-[10px] text-violet-300/48 pl-3.5 mt-1">› {a.action}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* E. Removed Language */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Minus className="w-3 h-3 text-red-400/50" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">E. REMOVED LANGUAGE</p>
              </div>
              <div className="space-y-1.5">
                {REMOVED.map((r, i) => (
                  <div key={i} className="rounded-xl border border-red-400/15 bg-red-400/[0.03] p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <p className="text-[11px] font-semibold text-white/72 flex-1">{r.term}</p>
                      <CChip label={r.chip} />
                    </div>
                    <p className="text-[10px] text-white/30 pl-3.5 mb-0.5">{r.where}</p>
                    <p className="text-[10px] text-white/45 pl-3.5 leading-snug">{r.meaning}</p>
                    <p className="text-[10px] text-white/32 pl-3.5 mt-1 italic">{r.why}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* F. Modified Terms */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Edit3 className="w-3 h-3 text-amber-400/50" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">F. MODIFIED TERMS</p>
              </div>
              <div className="space-y-2">
                {MODIFIED.map((m, i) => (
                  <div key={i} className="rounded-xl border border-amber-500/18 bg-amber-500/[0.03] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <p className="text-[11px] font-semibold text-white/72 flex-1">{m.term}</p>
                      <CChip label={m.chip} />
                    </div>
                    <div className="pl-3.5 space-y-1.5">
                      <div className="flex gap-2">
                        <span className="text-[9px] text-red-300/50 font-medium w-10 shrink-0 mt-0.5">Before</span>
                        <p className="text-[10px] text-white/42 leading-snug line-through decoration-red-400/25">{m.before}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[9px] text-emerald-300/55 font-medium w-10 shrink-0 mt-0.5">After</span>
                        <p className="text-[10px] text-emerald-300/65 leading-snug">{m.after}</p>
                      </div>
                      <p className="text-[10px] text-white/38 leading-snug">{m.changed}</p>
                      {m.action && <p className="text-[10px] text-violet-300/48 mt-0.5">› {m.action}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* G. Possible Risk Changes (secondary) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3 h-3 text-white/22" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">G. POSSIBLE RISK CHANGES</p>
              </div>
              <div className="space-y-1.5">
                {[
                  { t:"Arbitration clause may reduce legal options", n:"New §10 requires binding arbitration — waives jury trial rights. Verify before signing.", chip:"§10·p.5" },
                  { t:"Notice period change may affect auto-renewal", n:"30-day notice (reduced from 60) — verify your timeline before lease end.", chip:"§7·p.3" },
                  { t:"Rent increase changes total payment obligation", n:"$250/month increase adds $3,000 over the 12-month term. Late fee also increased.", chip:"§4·p.2" },
                ].map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400/45 shrink-0" />
                      <p className="text-[10px] font-semibold text-white/58 flex-1 leading-snug">{r.t}</p>
                      <CChip label={r.chip} />
                    </div>
                    <p className="text-[10px] text-white/35 pl-3.5 leading-snug">{r.n}</p>
                    <p className="text-[10px] text-white/22 pl-3.5 mt-1 italic">Review with a qualified professional if high-risk.</p>
                  </div>
                ))}
              </div>
            </div>

            {/* H. Source Traceability */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] cursor-pointer hover:bg-white/[0.025]">
              <div className="flex items-center gap-2.5 px-4 py-3">
                <Layers className="w-3.5 h-3.5 text-white/20" />
                <p className="text-white/35 text-xs font-medium flex-1">H. Source / Change Traceability</p>
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
