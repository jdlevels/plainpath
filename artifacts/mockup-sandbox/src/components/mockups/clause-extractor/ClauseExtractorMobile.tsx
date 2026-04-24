import { FileText, Bookmark, Scale, ChevronRight, Clock, Users, DollarSign, AlertTriangle, FileSearch, Layers } from "lucide-react";

function SChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-[18px] px-1.5 rounded text-[10px] font-mono bg-violet-600/15 border border-violet-500/22 text-violet-300/80 whitespace-nowrap">
      {label}
    </span>
  );
}

const FILTER_TABS = ["All","Payment","Termination","Obligations","Deadlines","Missing"];

const KEY_CLAUSES = [
  { title: "Auto-renewal — 60-day notice to cancel", cat: "Termination",  chip: "§3", imp: "attention", plain: "Missed window = automatic 12-month renewal." },
  { title: "Monthly fee $22,500 — net-30 terms",     cat: "Payment",      chip: "§4", imp: "standard",  plain: "Late fee accrues at 1.5%/month." },
  { title: "Liability capped at $67,500",             cat: "Liability",    chip: "§9", imp: "attention", plain: "Unusually low cap for a $270K/yr contract." },
  { title: "5-year confidentiality — both parties",   cat: "Confidentiality", chip: "§7", imp: "noted", plain: "Both parties bound 5 years post-term." },
  { title: "HIPAA compliance on Provider",            cat: "Obligations",  chip: "§7", imp: "noted",     plain: "Provider must comply with all HIPAA rules." },
];

const IMP = {
  attention: { dot: "bg-amber-500",   badge: "bg-amber-500/12 border-amber-500/20 text-amber-300/70",  label: "Needs attention" },
  standard:  { dot: "bg-blue-500",    badge: "bg-blue-500/12 border-blue-500/20 text-blue-300/65",     label: "Standard term" },
  noted:     { dot: "bg-white/28",    badge: "bg-white/[0.07] border-white/[0.09] text-white/38",      label: "Noted" },
};

export function ClauseExtractorMobile() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", maxWidth: 390 }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="text-white/30"><Bookmark className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        <button className="flex-1 h-10 text-xs font-semibold text-white/85 border-b-2 border-violet-500 flex items-center justify-center gap-1.5">
          <FileSearch className="w-3.5 h-3.5 text-violet-400" /> Clauses
        </button>
        <button className="flex-1 h-10 text-xs font-medium text-white/28 flex items-center justify-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Document
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* Doc identity */}
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/25 flex items-center justify-center shrink-0">
              <Scale className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white/88">ClearMed Services Agreement</p>
              <p className="text-[10px] text-white/30 mt-0.5">Professional Services · 6 pages · $22,500/mo</p>
            </div>
          </div>
        </div>

        {/* B. Confidence Strip */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-[9px] uppercase tracking-[0.1em] text-white/20 font-semibold mb-2">CONFIDENCE STRIP</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "23 clauses found",          cls: "bg-emerald-500/12 border-emerald-500/20 text-emerald-300/75" },
              { label: "High confidence",            cls: "bg-emerald-500/12 border-emerald-500/20 text-emerald-300/75" },
              { label: "7 categories",               cls: "bg-violet-500/12 border-violet-500/20 text-violet-300/75" },
              { label: "6 obligations",              cls: "bg-blue-500/12 border-blue-500/20 text-blue-300/75" },
              { label: "4 deadlines",                cls: "bg-blue-500/12 border-blue-500/20 text-blue-300/70" },
              { label: "3 unclear terms",            cls: "bg-amber-500/10 border-amber-500/18 text-amber-300/65" },
            ].map(c => (
              <span key={c.label} className={`h-5 px-2 rounded-full border text-[10px] font-medium ${c.cls}`}>{c.label}</span>
            ))}
          </div>
        </div>

        {/* A. Extraction Summary */}
        <div className="px-4 pb-3">
          <p className="text-[9px] uppercase tracking-[0.1em] text-white/20 font-semibold mb-2">EXTRACTION SUMMARY</p>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-xs text-white/52 leading-relaxed">
            Professional Services Agreement — 18 months at $22,500/month, 23 clauses across 7 categories. Inspect the <span className="text-amber-300/80 font-semibold">60-day renewal window (§3)</span> and the <span className="text-amber-300/80 font-semibold">$67,500 liability cap (§9)</span>. <span className="text-white/30">Review with a qualified professional before signing.</span>
          </div>
        </div>

        {/* D. Category Filters */}
        <div className="px-4 pb-3">
          <p className="text-[9px] uppercase tracking-[0.1em] text-white/20 font-semibold mb-2">FILTER BY CATEGORY</p>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((t,i) => (
              <button key={t} className={`h-6 px-2.5 rounded-full border text-[10px] font-medium ${i===0 ? "bg-white/[0.1] border-white/[0.15] text-white/72" : "border-white/[0.07] text-white/32"}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* C. Key Extracted Clauses */}
        <div className="px-4 pb-3">
          <p className="text-[9px] uppercase tracking-[0.1em] text-white/20 font-semibold mb-2.5">KEY EXTRACTED CLAUSES <span className="text-white/18 normal-case tracking-normal">· {KEY_CLAUSES.length}</span></p>
          <div className="space-y-2">
            {KEY_CLAUSES.map(cl => {
              const i = IMP[cl.imp as keyof typeof IMP];
              return (
                <div key={cl.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="flex items-start gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${i.dot} shrink-0 mt-1`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 leading-snug">{cl.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <SChip label={cl.chip} />
                        <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${i.badge}`}>{i.label}</span>
                        <span className="text-[9px] text-white/22">{cl.cat}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/38 pl-4 leading-snug">{cl.plain}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* E. Obligations & Owners */}
        <div className="px-4 pb-3">
          <p className="text-[9px] uppercase tracking-[0.1em] text-white/20 font-semibold mb-2.5">OBLIGATIONS & OWNERS</p>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
            {[
              { ob: "Give 60-day non-renewal notice", party: "Either party", chip: "§3" },
              { ob: "Pay $22,500/month — net 30",     party: "ClearMed",     chip: "§4" },
              { ob: "Comply with HIPAA",              party: "Northbridge",  chip: "§7" },
            ].map((r,i) => (
              <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5">
                <p className="text-[11px] text-white/50 flex-1 leading-snug">{r.ob}</p>
                <p className="text-[10px] text-white/28 whitespace-nowrap">{r.party}</p>
                <SChip label={r.chip} />
              </div>
            ))}
          </div>
        </div>

        {/* F. Dates & Deadlines */}
        <div className="px-4 pb-3">
          <p className="text-[9px] uppercase tracking-[0.1em] text-white/20 font-semibold mb-2.5">DATES & DEADLINES</p>
          <div className="space-y-1.5">
            {[
              { date: "Oct 1, 2026",  event: "60-day non-renewal notice deadline", amber: true, chip: "§3" },
              { date: "Dec 1, 2026",  event: "Initial 18-month term expiry",       amber: false, chip: "§3" },
              { date: "1st / month",  event: "Monthly invoice — net-30 due",       amber: false, chip: "§4" },
            ].map((d,i) => (
              <div key={i} className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-2.5 ${d.amber ? "border-amber-500/18 bg-amber-500/[0.04]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                <p className="text-[10px] font-semibold text-white/60 w-20 shrink-0">{d.date}</p>
                <p className="text-[10px] text-white/45 flex-1 leading-snug">{d.event}</p>
                <SChip label={d.chip} />
              </div>
            ))}
          </div>
        </div>

        {/* Collapsed sections */}
        <div className="px-4 pb-5 space-y-2">
          {[
            { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Missing / Unclear Clauses", badge: "3 flagged", amber: true },
            { icon: <Layers className="w-3.5 h-3.5" />,        label: "Source Traceability",       badge: "23 chips",  amber: false },
          ].map(s => (
            <button key={s.label} className="w-full rounded-xl border border-white/[0.06] bg-white/[0.015] flex items-center gap-2.5 px-3.5 py-3">
              <span className="text-white/20 shrink-0">{s.icon}</span>
              <p className="text-xs text-white/45 font-medium flex-1 text-left">{s.label}</p>
              <span className={`text-[10px] border rounded px-1.5 py-0.5 ${s.amber ? "border-amber-500/18 text-amber-300/55 bg-amber-500/10" : "border-white/[0.08] text-white/28"}`}>{s.badge}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
