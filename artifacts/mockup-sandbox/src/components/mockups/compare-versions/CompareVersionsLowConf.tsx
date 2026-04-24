import { FileText, ArrowLeftRight, AlertTriangle, RefreshCcw, MessageSquare, BookOpen, Info, ChevronRight } from "lucide-react";

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
        <span className="text-white/15 text-xs mx-0.5">›</span>
        <span className="text-white/45 text-xs truncate">Service_v1 vs Service_v2</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full bg-amber-500/15 border border-amber-500/28 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-300/80" />
            <span className="text-[11px] text-amber-200/75 font-medium">Partial comparison — low scan quality</span>
          </div>
        </div>
      </div>

      {/* Confidence warning banner */}
      <div className="border-b border-amber-500/20 bg-amber-500/[0.06] px-5 py-3 flex items-start gap-3 shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-400/75 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-amber-200/85">PlainPath could compare part of these documents, but scan quality limits comparison confidence.</p>
          <p className="text-[11px] text-white/38 mt-1 leading-snug">The original document (v1) contains low-resolution scanned pages. Sections 3–5 could not be reliably aligned with the revised version.</p>
        </div>
      </div>

      {/* Three-zone body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — Original (partially readable) */}
        <div className="w-[33%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-white/25" />
            <span className="text-[11px] text-white/50 font-semibold">Original</span>
            <span className="ml-auto text-[9px] text-amber-300/55 font-medium">low scan quality</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Readable sections */}
            <div className="rounded-xl border border-emerald-500/18 bg-emerald-500/[0.03] p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-[10px] text-white/28 font-medium">§1 · Parties & Services</p>
                <span className="ml-auto text-[9px] text-emerald-300/55">readable</span>
              </div>
              <p className="text-[10px] text-white/42 leading-relaxed">Service agreement between Linmore Group LLC ("Client") and Brightfield Creative ("Provider") for design services, commencing June 2025.</p>
            </div>
            <div className="rounded-xl border border-emerald-500/18 bg-emerald-500/[0.03] p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-[10px] text-white/28 font-medium">§2 · Fees & Schedule</p>
                <span className="ml-auto text-[9px] text-emerald-300/55">readable</span>
              </div>
              <p className="text-[10px] text-white/42 leading-relaxed">Project fee: $12,000, due in three equal installments. Kickoff, mid-project, and delivery. Schedule per Exhibit A.</p>
            </div>
            {/* Unreadable sections */}
            {[3,4,5].map(n => (
              <div key={n} className="rounded-xl border border-amber-500/18 bg-amber-500/[0.03] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[10px] text-white/28 font-medium">§{n} · {["Intellectual Property","Confidentiality","Termination"][n-3]}</p>
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400/50 ml-auto" />
                </div>
                <div className="space-y-1">
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="h-2.5 rounded-full bg-white/[0.06]" style={{ width:`${65+Math.sin(n*i)*25}%`, opacity:0.4+i*0.1 }} />
                  ))}
                </div>
                <p className="text-[9px] text-amber-300/45 mt-2">Low scan quality — could not align for comparison</p>
              </div>
            ))}
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center">
            <span className="text-[10px] text-white/18">5 sections · 2 readable</span>
          </div>
        </div>

        {/* Middle — Revised (fully readable) */}
        <div className="w-[33%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3 h-3 text-violet-400/55" />
            <span className="text-[11px] text-violet-300/65 font-semibold">Revised</span>
            <span className="ml-auto text-[9px] text-emerald-300/55">fully readable</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {[
              { s:"§1 · Parties & Services",     t:"Service agreement between Linmore Group LLC (\"Client\") and Brightfield Creative (\"Provider\") for design and development services, commencing June 2025.", diff:null },
              { s:"§2 · Fees & Schedule",        t:"Project fee: $15,000, due in three equal installments. Kickoff, mid-project, and delivery. Schedule per Exhibit A.", diff:"modified" },
              { s:"§3 · Intellectual Property",  t:"All work product created under this agreement is owned by Client upon full payment. Provider retains rights to portfolio display.", diff:null },
              { s:"§4 · Confidentiality",        t:"Provider agrees not to disclose Client's proprietary information. Obligations survive agreement for two years.", diff:null },
              { s:"§5 · Termination",            t:"Either party may terminate with 30 days written notice. Client owes fees for work completed through termination date.", diff:null },
            ].map((sec, i) => (
              <div key={i} className={`rounded-xl border p-3 ${sec.diff ? "border-amber-500/22 bg-amber-500/[0.04]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                <p className="text-[10px] text-white/28 font-medium mb-1.5">{sec.s}</p>
                <p className="text-[10px] text-white/42 leading-relaxed">{sec.t}</p>
              </div>
            ))}
          </div>
          <div className="h-8 border-t border-white/[0.04] px-4 flex items-center">
            <span className="text-[10px] text-white/18">5 sections · all readable</span>
          </div>
        </div>

        {/* Right — Partial results + guidance */}
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-4 space-y-4">

          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-violet-400/45" />
              <p className="text-[13px] font-bold text-white/80">Partial Comparison Results</p>
            </div>
            <div className="flex gap-2 flex-wrap mb-1">
              <span className="h-6 px-2.5 rounded-full border bg-emerald-500/12 border-emerald-500/18 text-[10px] text-emerald-300/70">2 sections compared</span>
              <span className="h-6 px-2.5 rounded-full border bg-amber-500/12 border-amber-500/18 text-[10px] text-amber-300/65">3 sections unaligned</span>
              <span className="h-6 px-2.5 rounded-full border bg-violet-500/12 border-violet-500/18 text-[10px] text-violet-300/65">1 change confirmed</span>
            </div>
          </div>

          {/* What was comparable */}
          <div className="rounded-xl border border-emerald-500/18 bg-emerald-500/[0.03] p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <BookOpen className="w-3 h-3 text-emerald-400/55" />
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30">WHAT WAS COMPARABLE</p>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <p className="text-[10px] font-semibold text-white/65">Project fee increased</p>
                  <span className="ml-auto text-[9px] text-violet-300/55 font-mono">§2·p.1</span>
                </div>
                <p className="text-[10px] text-white/40 pl-3.5 leading-snug">$12,000 → $15,000. Before/after readable in both versions.</p>
              </div>
              <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <p className="text-[10px] font-semibold text-white/55">Service scope note added</p>
                  <span className="ml-auto text-[9px] text-violet-300/55 font-mono">§1·p.1</span>
                </div>
                <p className="text-[10px] text-white/40 pl-3.5 leading-snug">"and development services" added to scope in §1.</p>
              </div>
            </div>
          </div>

          {/* What could not be aligned */}
          <div className="rounded-xl border border-amber-500/18 bg-amber-500/[0.03] p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle className="w-3 h-3 text-amber-400/55" />
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30">WHAT COULD NOT BE ALIGNED</p>
            </div>
            <div className="space-y-1.5">
              {["§3 · Intellectual Property","§4 · Confidentiality","§5 · Termination"].map((s,i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/35 shrink-0" />
                  <p className="text-[10px] text-white/40 flex-1">{s}</p>
                  <span className="text-[9px] text-amber-300/38">low scan quality in original</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-white/25 mt-2 italic">Document causing the issue: original (v1) · Revised is fully readable.</p>
          </div>

          {/* Recommended next steps */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <Info className="w-3 h-3 text-white/30" />
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30">RECOMMENDED NEXT STEPS</p>
            </div>
            <div className="space-y-1">
              {[
                { icon:<RefreshCcw className="w-3 h-3" />,      t:"Upload a clearer version of the original",     d:"A text-based or higher-resolution scan will improve alignment." },
                { icon:<FileText className="w-3 h-3" />,         t:"Try a text-based version of the original",     d:"A digital original produces full comparison confidence." },
                { icon:<ArrowLeftRight className="w-3 h-3" />,   t:"Continue with partial results",                d:"Confirmed changes shown above. Unaligned sections remain unreviewed." },
                { icon:<MessageSquare className="w-3 h-3" />,    t:"Ask about unreviewed sections",                d:"Ask specific questions about §3, §4, §5 of the revised version." },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.025] cursor-pointer group">
                  <div className="text-white/25 group-hover:text-white/45 mt-0.5 shrink-0">{a.icon}</div>
                  <div className="flex-1">
                    <p className="text-[10px] text-white/55 font-medium group-hover:text-white/70">{a.t}</p>
                    <p className="text-[10px] text-white/28 mt-0.5 leading-snug">{a.d}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-white/15 ml-auto mt-0.5 shrink-0 group-hover:text-white/30" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
