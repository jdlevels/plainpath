import { FileText, ArrowLeftRight, Plus, Minus, Edit3, AlertTriangle, Info, Bookmark } from "lucide-react";

function CChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-[16px] px-1.5 rounded text-[9px] font-mono font-medium bg-violet-600/15 border border-violet-500/22 text-violet-300/70 whitespace-nowrap cursor-pointer">
      {label}
    </span>
  );
}

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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Change summary */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
          <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-white/24 mb-2">Change Summary</p>
          <p className="text-[11px] text-white/55 leading-relaxed">
            <strong className="text-white/70 font-semibold">Compared:</strong> Lease Agreement v1 (4 pages) vs v2 (5 pages). 14 changes found across 3 sections.
          </p>
          <p className="text-[11px] text-white/50 leading-relaxed mt-1.5">
            <strong className="text-white/65 font-semibold">Inspect first:</strong> <span className="text-amber-300/75">Arbitration clause (§10)</span> and <span className="text-amber-300/75">shortened notice period (§7)</span>.
          </p>
          <div className="mt-2 flex items-start gap-1.5">
            <Info className="w-2.5 h-2.5 text-white/20 shrink-0 mt-0.5" />
            <p className="text-[9px] text-white/25">Change comparison support — not legal advice.</p>
          </div>
        </div>

        {/* Change strip */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
          <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-white/22 mb-2">Change Strip</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label:"14 changes found",  cls:"bg-violet-500/15 border-violet-500/22 text-violet-300/80" },
              { label:"3 additions",       cls:"bg-emerald-500/15 border-emerald-500/22 text-emerald-300/80" },
              { label:"2 removals",        cls:"bg-red-400/12 border-red-400/18 text-red-300/70" },
              { label:"6 modified terms",  cls:"bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
              { label:"3 terms to verify", cls:"bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
              { label:"High confidence",   cls:"bg-emerald-500/12 border-emerald-500/18 text-emerald-300/65" },
            ].map(c => (
              <span key={c.label} className={`h-5 px-2 rounded-full border text-[9px] font-medium ${c.cls}`}>{c.label}</span>
            ))}
          </div>
        </div>

        {/* Key changes */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-white/22 mb-2 px-0.5">Key Changes</p>
          <div className="space-y-1.5">
            {[
              { dot:"bg-emerald-500", type:"Added",    chip:"§10·p.5", t:"Arbitration clause added",     p:"All disputes go to binding arbitration. Waives jury trial rights.", action:"Term to verify" },
              { dot:"bg-amber-500",   type:"Modified", chip:"§4·p.2",  t:"Monthly rent increased",       p:"$3,200 → $3,450/mo. Late fee raised from 5% to 8%.", action:null },
              { dot:"bg-amber-500",   type:"Modified", chip:"§7·p.3",  t:"Notice period shortened",      p:"60 days → 30 days for non-renewal notice.", action:"Set reminder" },
              { dot:"bg-red-400",     type:"Removed",  chip:"§5·p.2",  t:"Pet addendum removed",         p:"Pet deposit clause no longer present. Verify separately.", action:null },
            ].map((ch, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-start gap-2 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${ch.dot} shrink-0 mt-1.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[11px] font-semibold text-white/75">{ch.t}</p>
                      <CChip label={ch.chip} />
                    </div>
                    <span className="text-[9px] text-white/35 font-medium">{ch.type}</span>
                  </div>
                </div>
                <p className="text-[10px] text-white/42 pl-3.5 leading-snug">{ch.p}</p>
                {ch.action && <p className="text-[10px] text-violet-300/50 pl-3.5 mt-1">› {ch.action}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Added language */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-0.5">
            <Plus className="w-3 h-3 text-emerald-400/50" />
            <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-white/22">Added Language</p>
          </div>
          <div className="space-y-1.5">
            {[
              { chip:"§10·p.5", t:"Arbitration clause", w:"§10 — new section", p:"Binding arbitration. Waives jury trial rights.", action:"Term to verify before signing." },
              { chip:"§4·p.2",  t:"Late fee increase",  w:"§4 · Rent & Payment", p:"8% late fee — up from 5% in original version.", action:null },
            ].map((a, i) => (
              <div key={i} className="rounded-xl border border-emerald-500/18 bg-emerald-500/[0.03] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-[10px] font-semibold text-white/68 flex-1">{a.t}</p>
                  <CChip label={a.chip} />
                </div>
                <p className="text-[9px] text-white/28 pl-3.5">{a.w}</p>
                <p className="text-[10px] text-white/42 pl-3.5 leading-snug mt-0.5">{a.p}</p>
                {a.action && <p className="text-[10px] text-violet-300/50 pl-3.5 mt-1">› {a.action}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Removed language */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-0.5">
            <Minus className="w-3 h-3 text-red-400/50" />
            <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-white/22">Removed Language</p>
          </div>
          <div className="rounded-xl border border-red-400/15 bg-red-400/[0.03] p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <p className="text-[10px] font-semibold text-white/68 flex-1">Pet addendum</p>
              <CChip label="§5·p.2" />
            </div>
            <p className="text-[9px] text-white/28 pl-3.5">§5 · Security Deposit (original only)</p>
            <p className="text-[10px] text-white/42 pl-3.5 leading-snug mt-0.5">Pet deposit clause removed from revised version.</p>
            <p className="text-[10px] text-white/28 pl-3.5 mt-1 italic">Verify pet policy separately before signing.</p>
          </div>
        </div>

        {/* Modified terms */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-0.5">
            <Edit3 className="w-3 h-3 text-amber-400/50" />
            <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-white/22">Modified Terms</p>
          </div>
          <div className="space-y-1.5">
            {[
              { chip:"§7·p.3", t:"Notice period", before:"60 days written notice.", after:"30 days written notice.", changed:"Notice period cut in half.", action:"Set a calendar reminder." },
              { chip:"§4·p.2", t:"Monthly rent",  before:"$3,200.00/month.",        after:"$3,450.00/month.",        changed:"$250/month increase.",          action:"Verify before signing." },
            ].map((m, i) => (
              <div key={i} className="rounded-xl border border-amber-500/18 bg-amber-500/[0.03] p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <p className="text-[10px] font-semibold text-white/68 flex-1">{m.t}</p>
                  <CChip label={m.chip} />
                </div>
                <div className="pl-3.5 space-y-1">
                  <div className="flex gap-2">
                    <span className="text-[9px] text-red-300/45 font-medium w-8 shrink-0">Before</span>
                    <p className="text-[10px] text-white/38 line-through decoration-red-400/25">{m.before}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[9px] text-emerald-300/50 font-medium w-8 shrink-0">After</span>
                    <p className="text-[10px] text-emerald-300/62">{m.after}</p>
                  </div>
                  <p className="text-[10px] text-white/35">{m.changed}</p>
                  <p className="text-[10px] text-violet-300/48">› {m.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Possible risk changes */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
          <div className="flex items-center gap-1.5 mb-2.5">
            <AlertTriangle className="w-3 h-3 text-white/20" />
            <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-white/22">Possible Risk Changes</p>
          </div>
          <div className="space-y-2">
            {[
              { t:"Arbitration may reduce legal options", chip:"§10·p.5" },
              { t:"Shortened notice may affect auto-renewal", chip:"§7·p.3" },
              { t:"Rent increase adds $3,000/year obligation", chip:"§4·p.2" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/35 shrink-0" />
                <p className="text-[10px] text-white/45 flex-1 leading-snug">{r.t}</p>
                <CChip label={r.chip} />
              </div>
            ))}
          </div>
          <p className="text-[9px] text-white/20 mt-2.5 italic">Review with a qualified professional if high-risk.</p>
        </div>

      </div>
    </div>
  );
}
