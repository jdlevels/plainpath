import { FileText, CheckCircle2, Loader2 } from "lucide-react";

const STEPS = [
  { label: "Reading contract structure",                  desc: "Parsing pages, layout, and clause boundaries…",                   done: true,   active: false },
  { label: "Identifying parties and contract type",       desc: "Reviewing stated parties, roles, and document classification…",   done: true,   active: false },
  { label: "Extracting obligations and deadlines",        desc: "Finding what each party must do and when…",                       done: false,  active: true  },
  { label: "Reviewing payment and termination terms",     desc: "Checking fees, penalties, cancellation, and renewal language…",   done: false,  active: false },
  { label: "Checking risks and missing protections",      desc: "Looking for risky clauses, gaps, and weak or absent protections…",done: false,  active: false },
  { label: "Generating contract review summary",          desc: "Compiling findings and source-backed next steps…",                done: false,  active: false },
];

const DOC_PAGES = [
  { label: "Page 1", lines: [70, 55, 80, 45, 65, 50], active: false },
  { label: "Page 2", lines: [60, 72, 48, 85, 40, 65], active: false },
  { label: "Page 3", lines: [75, 50, 60, 80, 45, 70], active: true  },
];

export function ContractReviewProcessing() {
  const done  = STEPS.filter(s => s.done).length;
  const total = STEPS.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Contract Review</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-violet-600/12 border-violet-500/20 text-violet-300">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            <span className="text-[10px] font-medium">Reviewing…</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: doc preview skeleton */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] overflow-hidden shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/22" />
            <span className="text-white/35 text-xs truncate">ClearPoint_MSA_v2.pdf</span>
            <span className="text-white/15 text-xs ml-auto shrink-0">8 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {DOC_PAGES.map((pg, pi) => (
              <div key={pi} className={`rounded-xl border p-4 transition-all ${pg.active ? "border-violet-500/25 bg-violet-500/[0.04] ring-1 ring-violet-500/10" : "border-white/[0.05] bg-white/[0.01]"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-mono text-white/18">{pg.label}</span>
                  {pg.active && (
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-300/50 text-[9px]">reviewing…</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {pg.lines.map((w, li) => (
                    <div key={li} className={`h-2 rounded-full ${pg.active ? "bg-violet-500/10" : "bg-white/[0.05]"}`} style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: progress panel */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f] p-5 flex flex-col gap-4">

          {/* File card */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02]">
            <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/15 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-violet-400/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-medium truncate">ClearPoint_MSA_v2.pdf</p>
              <p className="text-white/28 text-[10px]">8 pages · 1.1 MB · Uploaded just now</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/65 text-sm font-semibold">Contract review in progress</span>
              <span className="text-white/28 text-xs">{done} of {total} steps</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] mb-1.5 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-white/22 text-[10px]">~18 seconds remaining</p>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-2">
            {STEPS.map((step, i) => (
              <div key={i} className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border transition-all ${step.active ? "border-violet-500/22 bg-violet-500/[0.05]" : step.done ? "border-white/[0.05]" : "border-white/[0.04] opacity-45"}`}>
                <div className="shrink-0 mt-0.5">
                  {step.done
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : step.active
                    ? <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                    : <div className="w-4 h-4 rounded-full border border-white/20" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${step.done ? "text-white/60" : step.active ? "text-white/90" : "text-white/28"}`}>{step.label}</p>
                  {(step.done || step.active) && (
                    <p className={`text-[10px] mt-0.5 ${step.active ? "text-violet-300/45" : "text-white/22"}`}>{step.desc}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preview of output */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
            <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold mb-3">YOUR REVIEW WILL INCLUDE</p>
            <div className="grid grid-cols-2 gap-1.5">
              {["Plain-English summary","Risk / confidence strip","Key contract risks","Required next steps","Obligations & deadlines","Payment & fee terms","Termination & renewal","Missing protections"].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.05]">
                  <div className="w-1 h-1 rounded-full bg-violet-400/35 shrink-0" />
                  <p className="text-white/28 text-[10px]">{item}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
