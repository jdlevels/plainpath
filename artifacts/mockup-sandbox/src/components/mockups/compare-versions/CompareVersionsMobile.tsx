import { FileText, ArrowLeftRight, Plus, Minus, Edit3, AlertTriangle, Info, Bookmark } from "lucide-react";

function CChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-[16px] px-1.5 rounded text-[9px] font-mono font-medium bg-violet-600/15 border border-violet-500/22 text-violet-300/70 whitespace-nowrap">
      {label}
    </span>
  );
}

const MOBILE_CHANGES = [
  { type:"Added",    dot:"bg-emerald-500", badge:"bg-emerald-500/12 border-emerald-500/20 text-emerald-300/75", icon:<Plus className="w-2.5 h-2.5"/>,  title:"Dispute resolution clause added",       plain:"New arbitration clause. Waives jury trial rights.", chip:"§10·p.5", warn:true },
  { type:"Modified", dot:"bg-amber-500",   badge:"bg-amber-500/12 border-amber-500/20 text-amber-300/70",      icon:<Edit3 className="w-2.5 h-2.5"/>, title:"Rent increased to $3,450/mo",            plain:"Up from $3,200. Late fee raised from 5% to 8%.", chip:"§4·p.2",  warn:true },
  { type:"Modified", dot:"bg-amber-500",   badge:"bg-amber-500/12 border-amber-500/20 text-amber-300/70",      icon:<Edit3 className="w-2.5 h-2.5"/>, title:"Notice period cut to 30 days",           plain:"Was 60 days. Less time to avoid auto-renewal.", chip:"§7·p.3",  warn:true },
  { type:"Removed",  dot:"bg-red-500",     badge:"bg-red-500/12 border-red-500/18 text-red-300/70",            icon:<Minus className="w-2.5 h-2.5"/>, title:"Pet addendum removed",                   plain:"Pet deposit clause no longer present in v2.", chip:"§5·p.2",  warn:false },
  { type:"Moved",    dot:"bg-blue-400",    badge:"bg-blue-500/12 border-blue-500/18 text-blue-300/65",         icon:<ArrowLeftRight className="w-2.5 h-2.5"/>, title:"Entry notice moved to §11", plain:"Language unchanged. 24-hour notice maintained.", chip:"§11·p.4", warn:false },
];

export function CompareVersionsMobile() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Mobile top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="ml-2 text-sm font-semibold text-white/90">PlainPath</span>
        <div className="ml-auto">
          <Bookmark className="w-4 h-4 text-white/22" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-white/[0.06] flex shrink-0">
        {["Summary","Original","Revised"].map((tab, i) => (
          <button key={tab} className={`flex-1 py-3 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            i === 0
              ? "text-violet-400 border-b-2 border-violet-500"
              : "text-white/28 hover:text-white/45"
          }`}>
            {tab === "Summary"  && <ArrowLeftRight className="w-3.5 h-3.5" />}
            {tab === "Original" && <FileText className="w-3.5 h-3.5" />}
            {tab === "Revised"  && <FileText className="w-3.5 h-3.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Doc identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-600/15 border border-violet-500/22 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white/88">Lease — v1 vs v2</p>
            <p className="text-[11px] text-white/30 mt-0.5">Harborview Properties · Jordan Chen</p>
          </div>
        </div>

        {/* Confidence strip */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/20 mb-2">CHANGE STRIP</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label:"14 changes found",       cls:"bg-violet-500/15 border-violet-500/22 text-violet-300/80" },
              { label:"3 additions",            cls:"bg-emerald-500/15 border-emerald-500/22 text-emerald-300/80" },
              { label:"2 removals",             cls:"bg-red-500/12 border-red-500/18 text-red-300/75" },
              { label:"6 modified",             cls:"bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
              { label:"High confidence",        cls:"bg-emerald-500/12 border-emerald-500/18 text-emerald-300/70" },
              { label:"3 terms to verify",      cls:"bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
            ].map(c => (
              <span key={c.label} className={`h-6 px-2.5 rounded-full border text-[10px] font-medium ${c.cls}`}>{c.label}</span>
            ))}
          </div>
        </div>

        {/* Change summary */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/20 mb-2">CHANGE SUMMARY</p>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[11px] text-white/52 leading-relaxed space-y-1.5">
            <p><strong className="text-white/72 font-semibold">Overall:</strong> Moderate changes across 3 of 5 sections.</p>
            <p><strong className="text-white/72 font-semibold">Inspect first:</strong> The <span className="text-amber-300/80 font-semibold">new arbitration clause (§10)</span> waives jury trial rights, and the <span className="text-amber-300/80 font-semibold">rent increase to $3,450</span> adds $3,000/year.</p>
            <p>Notice period reduced from 60 to <strong className="text-white/68">30 days</strong> — shorter window before auto-renewal triggers.</p>
          </div>
          <div className="mt-2 flex items-start gap-1.5 px-1">
            <Info className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
            <p className="text-[10px] text-white/25 leading-snug">Change comparison support — source-backed changes, not legal advice.</p>
          </div>
        </div>

        {/* Key changes */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/20">KEY CHANGES</p>
            <span className="text-[10px] text-white/28">5 of 14</span>
          </div>
          <div className="space-y-2">
            {MOBILE_CHANGES.map((ch, i) => (
              <div key={i} className={`rounded-xl border p-3 ${ch.warn ? "border-amber-500/15 bg-amber-500/[0.03]" : ch.type==="Added" ? "border-emerald-500/15 bg-emerald-500/[0.02]" : ch.type==="Removed" ? "border-red-500/13 bg-red-500/[0.02]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${ch.dot} shrink-0`} />
                  <p className="text-xs font-semibold text-white/78 flex-1 leading-snug">{ch.title}</p>
                  <CChip label={ch.chip} />
                </div>
                <div className="pl-3.5 flex items-center gap-1.5 mb-1">
                  <span className={`h-4 px-1.5 rounded border text-[9px] font-medium inline-flex items-center gap-0.5 ${ch.badge}`}>
                    {ch.icon} {ch.type}
                  </span>
                </div>
                <p className="text-[11px] text-white/45 pl-3.5 leading-snug">{ch.plain}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Possible risk changes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <AlertTriangle className="w-3 h-3 text-white/25" />
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/20">POSSIBLE RISK CHANGES</p>
          </div>
          <div className="space-y-2">
            {[
              { t:"Arbitration may reduce legal options", n:"New §10 requires binding arbitration — waives jury trial.", chip:"§10·p.5" },
              { t:"Shorter notice increases renewal risk", n:"30-day notice (down from 60) — verify your timeline.",    chip:"§7·p.3" },
            ].map((r,i) => (
              <div key={i} className="rounded-xl border border-amber-500/16 bg-amber-500/[0.03] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
                  <p className="text-[11px] font-semibold text-white/62 flex-1 leading-snug">{r.t}</p>
                  <CChip label={r.chip} />
                </div>
                <p className="text-[10px] text-white/38 pl-3.5 leading-snug">{r.n}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
