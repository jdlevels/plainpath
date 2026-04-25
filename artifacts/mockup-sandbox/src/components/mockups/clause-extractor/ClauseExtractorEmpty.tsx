import {
  Upload, Info, Scale, Briefcase, Home, FileText, FileCheck,
  ShieldCheck, Clock, ChevronRight, ArrowLeft, ListChecks,
  ScrollText, Layers
} from "lucide-react";

const CE_WORKS_WELL_WITH = [
  { icon: Scale,     color: "text-amber-400",   label: "Service agreements",    desc: "Obligations, payment terms, renewal, liability" },
  { icon: Home,      color: "text-sky-400",      label: "Leases",                desc: "Tenant rights, notice periods, deposits, exit" },
  { icon: Briefcase, color: "text-violet-400",   label: "Employment agreements", desc: "Compensation, non-compete, IP, termination" },
  { icon: FileText,  color: "text-emerald-400",  label: "Vendor contracts",      desc: "SLAs, liability caps, dispute resolution" },
  { icon: FileCheck, color: "text-blue-400",     label: "Insurance forms",       desc: "Coverage terms, exclusions, notice requirements" },
  { icon: Layers,    color: "text-orange-400",   label: "Policy documents",      desc: "Obligations, definitions, enforcement terms" },
  { icon: ScrollText,color: "text-rose-400",     label: "Notices",               desc: "Deadlines, required actions, response windows" },
  { icon: ShieldCheck,color:"text-purple-400",   label: "Contractor agreements", desc: "Scope, IP ownership, payment schedule, exit" },
];

const DEMOS = [
  { label: "Thornfield Residential Lease — 24-month", desc: "Residential lease · 12 clauses extracted" },
  { label: "Studio Vela Freelance Services Agreement", desc: "Service agreement · 9 clauses extracted" },
];

export function ClauseExtractorEmpty() {
  return (
    <div className="h-screen flex flex-col bg-[#0d0d10] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Tool header — back + icon + name */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <button className="p-1 rounded-md text-white/25 mr-0.5">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <ListChecks className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/30 text-xs font-medium">PlainPath</span>
        <span className="text-white/15 text-xs">·</span>
        <span className="text-white/70 text-xs font-semibold">Clause Extractor</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-5 py-14 flex flex-col items-center text-center">

          {/* Hero icon */}
          <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-5">
            <ListChecks className="w-7 h-7 text-violet-400/70" />
          </div>
          <h2 className="text-white/90 text-lg font-semibold mb-2">Extract key clauses from any contract.</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-7 max-w-sm">
            Upload a contract or agreement — key clauses, obligations, dates, and responsible parties are extracted and organized automatically.
          </p>

          {/* Drop zone */}
          <div className="w-full rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.025] hover:border-violet-500/25 transition-all cursor-pointer px-8 py-10 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/12 border border-violet-500/18 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5 text-violet-400/70" />
            </div>
            <p className="text-white/55 text-sm font-medium mb-1">Drop your contract here</p>
            <p className="text-white/28 text-xs mb-4">PlainPath reads the contract and extracts obligations, deadlines, and key terms</p>
            <button className="h-8 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors">
              Choose file
            </button>
            <p className="text-white/18 text-[10px] mt-2">PDF or DOCX · Up to 20 MB</p>
          </div>

          {/* Trust chips */}
          <div className="flex items-center justify-center gap-5 mb-7">
            <span className="flex items-center gap-1.5 text-white/28 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/60" />
              End-to-end encrypted
            </span>
            <span className="flex items-center gap-1.5 text-white/28 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400/60" />
              Extracts in ~20 sec
            </span>
          </div>

          {/* Disclaimer */}
          <div className="w-full flex items-start gap-2 rounded-xl border border-white/[0.05] bg-amber-500/[0.04] px-3 py-2.5 mb-8 text-left">
            <Info className="w-3.5 h-3.5 text-amber-400/50 shrink-0 mt-0.5" />
            <p className="text-white/30 text-[10px] leading-relaxed">
              PlainPath identifies and organizes contract terms for review.{" "}
              <span className="text-amber-300/65 font-medium">Results are not legal advice.</span>{" "}
              Always verify with a qualified professional before acting on any contract term.
            </p>
          </div>

          {/* Works well with */}
          <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold mb-3 self-start">Works well with</p>
          <div className="w-full grid grid-cols-2 gap-2 mb-8">
            {CE_WORKS_WELL_WITH.map(item => (
              <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] text-left">
                <item.icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${item.color}`} />
                <div>
                  <p className="text-white/52 text-[11px] font-medium leading-tight">{item.label}</p>
                  <p className="text-white/24 text-[10px] leading-tight mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Demo chips */}
          <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold mb-3 self-start">Or try a demo</p>
          <div className="w-full flex flex-col gap-2">
            {DEMOS.map(d => (
              <button key={d.label} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/20 hover:bg-violet-500/[0.03] transition-all text-left">
                <div className="w-7 h-7 rounded-lg bg-violet-600/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                  <ListChecks className="w-3.5 h-3.5 text-violet-400/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/55 text-xs font-medium leading-tight">{d.label}</p>
                  <p className="text-white/25 text-[10px]">{d.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
