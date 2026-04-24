import { FileText, ArrowLeftRight, AlertTriangle, Upload, MessageSquare, ArrowRight, Info } from "lucide-react";

export function CompareVersionsLowConf() {
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
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center gap-1.5">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[11px] text-amber-300/75 font-medium">28% compare confidence — partial review</span>
          </div>
        </div>
      </div>

      {/* Three-zone body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — Original (low quality) */}
        <div className="w-[30%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-white/25" />
            <span className="text-[11px] text-white/45 font-medium">Original</span>
            <span className="ml-auto text-[9px] text-white/20">readable</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
              <p className="text-[9px] text-white/35 font-medium mb-2">Page 1 — §1–2 · Parties & Scope</p>
              <p className="text-[10px] text-white/42 leading-relaxed">Service agreement between Meridian Solutions Inc. ("Client") and Apex Consulting Group LLC ("Provider") for professional consulting services.</p>
              <span className="mt-1.5 text-[9px] text-emerald-300/45 font-medium">extracted</span>
            </div>
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-3">
              <p className="text-[9px] text-white/30 font-medium mb-2">Page 2 — §4 · Fees (partial)</p>
              <p className="text-[10px] text-amber-300/40 leading-relaxed">…monthly fee of $[illegible]…payment due net [illegible] days…late fee of [illegible]%…</p>
              <div className="mt-2 space-y-1">
                {[...Array(3)].map((_,i) => <div key={i} className="h-1.5 bg-amber-500/10 rounded" style={{width:`${50+(i*17)%30}%`}} />)}
              </div>
              <span className="mt-1.5 text-[9px] text-amber-300/45 font-medium">partial</span>
            </div>
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-3">
              <p className="text-[9px] text-white/30 font-medium mb-2">Page 3 — §7 · Termination (partial)</p>
              <p className="text-[10px] text-amber-300/40 leading-relaxed">…shall provide [illegible] days written notice…either party may terminate…</p>
              <div className="mt-2 space-y-1">
                {[...Array(3)].map((_,i) => <div key={i} className="h-1.5 bg-amber-500/10 rounded" style={{width:`${45+(i*19)%35}%`}} />)}
              </div>
              <span className="mt-1.5 text-[9px] text-amber-300/45 font-medium">partial</span>
            </div>
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center">
            <span className="text-[10px] text-amber-300/40">1 of 3 pages fully readable</span>
          </div>
        </div>

        {/* Middle — Revised (readable) */}
        <div className="w-[30%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-violet-400/50" />
            <span className="text-[11px] text-violet-300/60 font-medium">Revised</span>
            <span className="ml-auto text-[9px] text-white/20">readable</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {[
              { title:"Page 1 — §1–2 · Parties & Scope",  body:"Service agreement between Meridian Solutions Inc. and Apex Consulting Group LLC for professional consulting services." },
              { title:"Page 2 — §4 · Fees & Payment",     body:"Monthly fee of $18,500. Payment due net-30. Late fee of 2% per month after 10-day grace period." },
              { title:"Page 3 — §7 · Termination",        body:"Either party may terminate with 60 days written notice. Immediate termination for material breach with 10-day cure period." },
              { title:"Page 4 — §10 · Dispute Resolution", body:"Disputes resolved by mediation then binding arbitration. Arbitration per AAA rules. Costs split equally." },
            ].map((sec, i) => (
              <div key={i} className="rounded-xl border border-violet-500/12 bg-violet-500/[0.02] p-3">
                <p className="text-[9px] text-white/28 font-medium mb-1.5">{sec.title}</p>
                <p className="text-[10px] text-white/40 leading-relaxed">{sec.body}</p>
                <span className="mt-1.5 text-[9px] text-violet-300/40 font-medium">readable</span>
              </div>
            ))}
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center">
            <span className="text-[10px] text-white/18">4 of 4 pages fully readable</span>
          </div>
        </div>

        {/* Right — Low confidence panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Main warning */}
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-300/90">Partial comparison — low scan quality</p>
                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">PlainPath could compare part of these documents, but scan quality limits comparison confidence. Key sections in the original could not be aligned.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-white/30 mb-2">WHAT WAS COMPARABLE</p>
                <div className="space-y-1.5">
                  {[
                    { label:"§1–2 Parties & Scope", chip:"§1·p.1", ok:true },
                    { label:"§7 Termination — partial alignment", chip:"§7·p.3", ok:false },
                  ].map((r,i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.ok?"bg-emerald-400/60":"bg-amber-400/50"}`} />
                      <span className="text-[10px] text-white/45">{r.label}</span>
                      <span className="h-[16px] px-1.5 rounded text-[9px] font-mono font-medium bg-violet-600/10 border border-violet-500/18 text-violet-300/60">{r.chip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-white/30 mb-2">WHAT COULD NOT BE ALIGNED</p>
                <div className="space-y-1.5">
                  {[
                    "§4 Fees & Payment — original text illegible (pages 2–3)",
                    "Notice period comparison — original §7 partially unreadable",
                    "Liability cap language — could not extract from original",
                  ].map((r,i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-white/20 shrink-0 mt-0.5">×</span>
                      <span className="text-[10px] text-white/38 leading-snug">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-1.5">
                <Info className="w-3 h-3 text-amber-400/50 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300/55 leading-relaxed">The revised document is fully readable. The issue is with the original document's scan quality.</p>
              </div>
            </div>
          </div>

          {/* Recommended next steps */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/20 mb-2.5">RECOMMENDED NEXT STEPS</p>
            <div className="space-y-2">
              {[
                { icon: <Upload className="w-3.5 h-3.5 text-white/35" />,          label: "Upload a clearer original",     desc: "Higher resolution scan enables better alignment and comparison." },
                { icon: <ArrowLeftRight className="w-3.5 h-3.5 text-white/35" />,  label: "Upload a text-based original",  desc: "Export from Word or the source application for best results." },
                { icon: <ArrowRight className="w-3.5 h-3.5 text-white/35" />,      label: "Continue with partial comparison", desc: "See what PlainPath was able to compare — findings are partial only." },
                { icon: <MessageSquare className="w-3.5 h-3.5 text-white/35" />,   label: "Ask This Document",              desc: "Ask targeted questions — sometimes works on poor-quality scans." },
              ].map((step, i) => (
                <button key={i} className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-3 flex items-center gap-3 text-left">
                  {step.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white/55">{step.label}</p>
                    <p className="text-[10px] text-white/28 leading-snug mt-0.5">{step.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/20 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
