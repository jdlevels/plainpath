import { FileText, AlertTriangle, Upload, FileSearch, MessageCircle, Layers, ChevronRight, Info } from "lucide-react";

function SChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium bg-violet-600/10 border border-violet-500/18 text-violet-300/60 whitespace-nowrap">
      {label}
    </span>
  );
}

export function ClauseExtractorLowConf() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <span className="text-white/15 text-xs mx-0.5">›</span>
        <span className="text-white/40 text-xs">Clause Extractor</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-amber-300/80 font-medium">31% extraction confidence — partial review</span>
          </div>
        </div>
      </div>

      {/* Split body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — doc viewer */}
        <div className="w-[44%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-10 border-b border-white/[0.05] flex items-center px-5 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/25" />
            <span className="text-xs text-white/30 truncate">Services_Agreement_Scan.pdf</span>
            <span className="ml-auto text-[10px] text-white/20">4 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[
              { num: 1, ok: true,  title: "§1–2 · Parties & Scope",   body: `PROFESSIONAL SERVICES AGREEMENT dated March 12, 2025 between Meridian Solutions Group Inc. and the contracted service provider. This Agreement sets forth the terms and conditions of service delivery.` },
              { num: 2, ok: false, title: "§4 · Fees (partial)",        body: "Service fees and payment schedule", snippet: "…monthly fee of $[illegible]…due net [illegible] days…", lines: [50,35,25] },
              { num: 3, ok: false, title: "§6 · Termination (partial)", body: "Termination and notice requirements", snippet: "…shall provide [illegible] days written notice…", lines: [40,30,45] },
              { num: 4, ok: false, title: "Signature block",            body: "Execution and signature block",    snippet: "…[Signature block — partially unreadable]…",             lines: [30,25,20] },
            ].map(page => (
              <div key={page.num} className={`rounded-xl border p-3.5 ${page.ok ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-amber-500/20 bg-amber-500/[0.03]"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-medium ${page.ok ? "text-emerald-400/60" : "text-amber-400/60"}`}>Page {page.num} — {page.title}</span>
                  <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${page.ok ? "bg-emerald-500/10 border-emerald-500/18 text-emerald-300/55" : "bg-amber-500/10 border-amber-500/18 text-amber-300/55"}`}>
                    {page.ok ? "extracted" : "partial"}
                  </span>
                </div>
                {!page.ok ? (
                  <div>
                    <p className="text-[10px] text-amber-300/45 italic mb-2">{page.snippet}</p>
                    <div className="space-y-1.5">
                      {page.lines!.map((w,i) => (
                        <div key={i} className="h-1.5 rounded-full bg-amber-500/15" style={{ width:`${w}%` }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/48 leading-relaxed">{page.body}</p>
                )}
              </div>
            ))}
          </div>
          <div className="h-9 border-t border-white/[0.05] flex items-center px-5">
            <span className="text-[10px] text-white/20">1 of 4 pages fully readable</span>
          </div>
        </div>

        {/* Right — low confidence panel */}
        <div className="flex-1 flex flex-col overflow-y-auto p-5 gap-4">

          {/* Main warning card */}
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm font-bold text-amber-200/85">Partial clause extraction — low scan quality</p>
            </div>

            <p className="text-xs text-amber-200/55 leading-relaxed mb-4">
              PlainPath could extract part of this document, but the scan quality limits extraction confidence. Key sections could not be fully extracted. The findings below are partial only.
            </p>

            {/* What was read */}
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-amber-200/35 font-semibold mb-2">WHAT PLAINPATH COULD READ</p>
              <div className="space-y-1.5">
                {[
                  { label: "Contract parties — identified",       chip: "§1 · p.1" },
                  { label: "Service scope — partially extracted", chip: "§2 · p.1" },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0" />
                    <p className="text-[11px] text-emerald-300/65">{c.label}</p>
                    <SChip label={c.chip} />
                  </div>
                ))}
              </div>
            </div>

            {/* What could not be verified */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-amber-200/35 font-semibold mb-2">WHAT COULD NOT BE VERIFIED</p>
              <div className="space-y-1.5">
                {[
                  "Payment amount, fee schedule, and net terms — pages 2–3",
                  "Notice period for termination — language unclear",
                  "Liability cap and indemnification provisions",
                  "Signature block and execution date",
                ].map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <span className="text-amber-400/40 text-xs shrink-0 mt-0.5">×</span>
                    <p className="text-[11px] text-amber-200/40">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Info hint */}
            <div className="mt-3 pt-3 border-t border-amber-500/15 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400/50 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-300/50 leading-snug">For a complete, high-confidence extraction, upload a text-based PDF or a higher-resolution scan.</p>
            </div>
          </div>

          {/* Next steps */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/20 font-semibold mb-3">RECOMMENDED NEXT STEPS</p>
            <div className="space-y-2">
              {[
                { icon: <Upload className="w-3.5 h-3.5 text-violet-400" />,         title: "Upload a clearer scan or higher-resolution PDF", desc: "Better image quality enables more complete clause extraction." },
                { icon: <FileText className="w-3.5 h-3.5 text-white/35" />,         title: "Upload a text-based version",                    desc: "Export from Word or the original application for best results." },
                { icon: <Layers className="w-3.5 h-3.5 text-white/35" />,           title: "Continue with partial extraction",               desc: "See PlainPath's findings from the readable sections only." },
                { icon: <MessageCircle className="w-3.5 h-3.5 text-white/35" />,    title: "Ask This Document",                              desc: "Ask targeted questions — sometimes works on poor-quality scans." },
                { icon: <FileSearch className="w-3.5 h-3.5 text-white/35" />,       title: "Analyze a Document",                            desc: "Plain-English analysis from whatever text was extracted." },
              ].map(opt => (
                <button key={opt.title} className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-4 py-3 flex items-center gap-3">
                  <span className="shrink-0">{opt.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-white/60">{opt.title}</p>
                    <p className="text-[10px] text-white/28 mt-0.5">{opt.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-white/18">Review incomplete or partial findings with a qualified professional. PlainPath provides extraction support, not legal advice.</p>
        </div>
      </div>
    </div>
  );
}
