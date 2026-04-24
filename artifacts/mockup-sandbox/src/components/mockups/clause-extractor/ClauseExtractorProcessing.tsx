import { FileText, CheckCircle2, Loader2, Circle } from "lucide-react";

const STEPS = [
  { label: "Reading document structure",              desc: "Parsing pages, layout, and section boundaries…",          done: true,  active: false },
  { label: "Finding clause headings and sections",    desc: "Identifying article headings, numbered clauses…",         done: true,  active: false },
  { label: "Extracting obligations and deadlines",    desc: "Finding what each party must do and when…",              done: false, active: true  },
  { label: "Categorizing clause types",               desc: "Grouping by payment, termination, liability, etc…",      done: false, active: false },
  { label: "Linking clauses to source sections",      desc: "Matching extracted terms to their origin in the doc…",   done: false, active: false },
  { label: "Generating clause extraction summary",    desc: "Summarizing key clauses in plain English…",              done: false, active: false },
];

const DOC_PAGES = [
  { num: 1, label: "Readable",       lines: [80, 60, 75, 45, 70, 55] },
  { num: 2, label: "Readable",       lines: [60, 80, 50, 65, 40, 72] },
  { num: 3, label: "Extracting…",    lines: [70, 55, 68, 48, 75, 62], active: true },
];

export function ClauseExtractorProcessing() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Clause Extractor</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-3 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
            <span className="text-[11px] text-violet-300/80">Extracting clauses…</span>
          </div>
        </div>
      </div>

      {/* Split body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — doc skeleton */}
        <div className="w-[57%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-10 border-b border-white/[0.05] flex items-center px-5 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/25" />
            <span className="text-xs text-white/30 truncate">ClearMed_ServicesAgreement_v3.pdf</span>
            <span className="ml-auto text-[10px] text-white/20">6 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {DOC_PAGES.map(page => (
              <div key={page.num} className={`rounded-xl border p-4 ${page.active ? "border-violet-500/40 bg-violet-500/[0.04] ring-1 ring-violet-500/20" : "border-white/[0.06] bg-white/[0.015]"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-medium ${page.active ? "text-violet-400/70" : "text-white/25"}`}>Page {page.num}</span>
                  {page.active
                    ? <span className="text-[10px] text-violet-400/70 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse inline-block" /> extracting…</span>
                    : <span className="text-[10px] text-emerald-400/50">extracted</span>
                  }
                </div>
                <div className="space-y-2">
                  {page.lines.map((w, i) => (
                    <div key={i} className={`h-2 rounded-full ${page.active ? "bg-violet-500/20" : "bg-white/[0.06]"}`} style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="h-9 border-t border-white/[0.05] flex items-center px-5">
            <span className="text-[10px] text-white/20">3 of 6 pages processed</span>
          </div>
        </div>

        {/* Right — progress panel */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-5">

          {/* File card */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-600/20 border border-violet-500/25 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/80">ClearMed_ServicesAgreement_v3.pdf</p>
              <p className="text-[11px] text-white/30 mt-0.5">6 pages · 2.3 MB · Professional Services Agreement</p>
            </div>
          </div>

          {/* Progress header */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white/75">Clause extraction in progress</p>
              <span className="text-xs text-white/30">3 of 6 steps</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-2">
              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: "42%" }} />
            </div>
            <p className="text-[11px] text-white/28">~22 seconds remaining</p>
          </div>

          {/* Step list */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
            {STEPS.map((step, i) => (
              <div key={i} className={`flex items-start gap-3 px-4 py-3.5 ${step.active ? "bg-violet-500/[0.05]" : ""}`}>
                <div className="shrink-0 mt-0.5">
                  {step.done
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : step.active
                      ? <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                      : <Circle className="w-4 h-4 text-white/15" />
                  }
                </div>
                <div>
                  <p className={`text-xs font-medium ${step.done ? "text-white/55" : step.active ? "text-white/85" : "text-white/28"}`}>{step.label}</p>
                  {(step.done || step.active) && <p className={`text-[10px] mt-0.5 ${step.done ? "text-white/25" : "text-white/38"}`}>{step.desc}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Preview of what's coming */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/20 font-semibold mb-3">YOUR EXTRACTION WILL INCLUDE</p>
            <div className="grid grid-cols-2 gap-1.5">
              {["Plain-English summary","Key clauses by category","Obligations & owners","Dates & deadlines","Missing clause flags","Source-backed chips"].map(f => (
                <div key={f} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-violet-500/40" />
                  <span className="text-[10px] text-white/28">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-white/18">Clause extraction support — source-backed terms, not legal advice.</p>
        </div>
      </div>
    </div>
  );
}
