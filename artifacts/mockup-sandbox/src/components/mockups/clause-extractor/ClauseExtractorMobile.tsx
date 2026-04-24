import { FileText, AlertTriangle, Bookmark, Scale, ChevronRight, Clock, Users, DollarSign, ShieldCheck, FileSearch } from "lucide-react";

function SChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-[18px] px-1.5 rounded text-[10px] font-mono bg-violet-600/15 border border-violet-500/22 text-violet-300/80 whitespace-nowrap">
      {label}
    </span>
  );
}

const KEY_CLAUSES = [
  { title: "Auto-renewal — 60-day notice to cancel",    cat: "Termination",    chip: "§3",  risk: "high",  plain: "Missed window = another 12-month term." },
  { title: "Monthly fee $22,500 — net-30 terms",        cat: "Payment",        chip: "§4",  risk: "watch", plain: "Late fee accrues at 1.5%/month." },
  { title: "Liability cap — $67,500 (3 months)",        cat: "Liability",      chip: "§9",  risk: "high",  plain: "Unusually low for a $270K/yr contract." },
  { title: "5-year confidentiality post-termination",   cat: "Confidentiality",chip: "§7",  risk: "ok",    plain: "Both parties bound 5 years after end." },
  { title: "HIPAA compliance obligation on Provider",   cat: "Regulatory",     chip: "§7",  risk: "ok",    plain: "Provider must comply with all HIPAA rules." },
];

const RISK_COLORS = {
  high:  { dot: "bg-red-500",     badge: "bg-red-500/10 border-red-500/18 text-red-300/65",     label: "High" },
  watch: { dot: "bg-amber-500",   badge: "bg-amber-500/10 border-amber-500/18 text-amber-300/65", label: "Review" },
  ok:    { dot: "bg-emerald-500", badge: "bg-emerald-500/10 border-emerald-500/18 text-emerald-300/65", label: "Extracted" },
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
          <div className="h-5 px-2 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[10px] text-amber-300/80">2 high-priority</span>
          </div>
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

      {/* Clauses tab body */}
      <div className="flex-1 overflow-y-auto">

        {/* Document identity */}
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/25 flex items-center justify-center shrink-0">
              <Scale className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-white/88 truncate">ClearMed Services Agreement</p>
                <span className="h-4 px-1.5 rounded border bg-amber-500/10 border-amber-500/20 text-amber-300/70 text-[9px] font-medium">Review Req.</span>
              </div>
              <p className="text-[10px] text-white/30 mt-0.5">Professional Services · 6 pages · $22,500/mo</p>
            </div>
          </div>
        </div>

        {/* Risk summary chips */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {[
              { label: "2 high-priority",    cls: "bg-red-500/12 border-red-500/20 text-red-300/75" },
              { label: "1 review",           cls: "bg-amber-500/12 border-amber-500/20 text-amber-300/75" },
              { label: "4 deadlines",        cls: "bg-blue-500/12 border-blue-500/20 text-blue-300/75" },
              { label: "8 obligations",      cls: "bg-white/[0.07] border-white/[0.09] text-white/45" },
              { label: "3 unclear terms",    cls: "bg-amber-500/10 border-amber-500/18 text-amber-300/65" },
            ].map(c => (
              <span key={c.label} className={`h-5 px-2 rounded-full border text-[10px] font-medium ${c.cls}`}>{c.label}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="h-6 px-2.5 rounded-full border bg-red-500/10 border-red-500/20 text-red-300/80 text-[10px] font-semibold flex items-center">High risk</span>
            <span className="h-6 px-2.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-300/80 text-[10px] font-semibold flex items-center">High confidence</span>
          </div>
        </div>

        {/* Plain-English summary */}
        <div className="px-4 pb-3">
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/20 font-semibold mb-2">EXTRACTION SUMMARY</p>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-xs text-white/55 leading-relaxed">
            18-month agreement between ClearMed and Northbridge at $22,500/month. Watch the <span className="text-amber-300/80 font-semibold">60-day renewal window in §3</span> and the <span className="text-amber-300/80 font-semibold">$67,500 liability cap in §9</span>. 23 clauses extracted across 7 categories. <span className="text-white/35">Review with a qualified professional before signing.</span>
          </div>
        </div>

        {/* Key clauses */}
        <div className="px-4 pb-3">
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/20 font-semibold mb-2.5">KEY CLAUSES <span className="text-white/18 normal-case tracking-normal">· {KEY_CLAUSES.length} found</span></p>
          <div className="space-y-2">
            {KEY_CLAUSES.map(cl => {
              const r = RISK_COLORS[cl.risk as keyof typeof RISK_COLORS];
              return (
                <div key={cl.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className={`w-2 h-2 rounded-full ${r.dot} shrink-0 mt-1`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 leading-snug">{cl.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <SChip label={cl.chip} />
                        <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${r.badge}`}>{r.label}</span>
                        <span className="text-[9px] text-white/25">{cl.cat}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40 pl-4 leading-snug">{cl.plain}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsed sections */}
        <div className="px-4 pb-4 space-y-2">
          {[
            { icon: <DollarSign className="w-3.5 h-3.5" />, label: "Payment & Fee Terms",      badge: "4 clauses" },
            { icon: <Users className="w-3.5 h-3.5" />,      label: "Obligations & Owners",     badge: "8 obligations" },
            { icon: <Clock className="w-3.5 h-3.5" />,      label: "Dates & Deadlines",        badge: "4 deadlines" },
            { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Missing / Unclear",    badge: "3 flagged" },
            { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Clause Categories",      badge: "7 types" },
          ].map(s => (
            <button key={s.label} className="w-full rounded-xl border border-white/[0.06] bg-white/[0.015] flex items-center gap-2.5 px-3.5 py-3 hover:bg-white/[0.025] transition-colors">
              <span className="text-white/20 shrink-0">{s.icon}</span>
              <p className="text-xs text-white/45 font-medium flex-1 text-left">{s.label}</p>
              <span className="text-[10px] text-white/28 border border-white/[0.08] rounded px-1.5 py-0.5">{s.badge}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
