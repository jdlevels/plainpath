import { FileText, CheckCircle2 } from "lucide-react";

const stages = [
  { label: "Parsing document structure", done: true },
  { label: "Extracting key entities & dates", done: true },
  { label: "Identifying obligations & risks", active: true },
  { label: "Generating plain-English summary", pending: true },
  { label: "Scoring confidence & traceability", pending: true },
];

function Skeleton({ w, h, className = "" }: { w?: string; h?: string; className?: string }) {
  return (
    <div
      className={`rounded-md bg-white/[0.04] animate-pulse ${className}`}
      style={{ width: w, height: h }}
    />
  );
}

export function OverviewProcessing() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        </div>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <span className="text-white/35 text-xs">Document Overview</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-violet-600/15 border border-violet-500/25 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300 text-[10px] font-medium">Analyzing…</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: doc preview (blurred/loading) */}
        <div className="w-[45%] border-r border-white/[0.06] flex flex-col bg-[#0e0e12]">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/30" />
            <Skeleton w="180px" h="12px" />
            <div className="ml-auto">
              <Skeleton w="50px" h="12px" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3">
            {/* Fake PDF pages */}
            <div className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 flex flex-col gap-2.5">
              <Skeleton w="70%" h="14px" />
              <Skeleton w="55%" h="10px" />
              <div className="mt-2 flex flex-col gap-1.5">
                {[90, 80, 95, 75, 88].map((w, i) => (
                  <Skeleton key={i} w={`${w}%`} h="9px" />
                ))}
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {[85, 70, 60].map((w, i) => (
                  <Skeleton key={i} w={`${w}%`} h="9px" />
                ))}
              </div>
            </div>
            <div className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 flex flex-col gap-2">
              {[90, 75, 85, 65, 80, 70].map((w, i) => (
                <Skeleton key={i} w={`${w}%`} h="9px" />
              ))}
            </div>
          </div>
        </div>

        {/* Right: analysis progress */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col justify-center px-8 py-10">
            {/* File info */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">NDA — Stripe Inc.pdf</p>
                <p className="text-white/35 text-xs">12 pages · 847 KB</p>
              </div>
            </div>

            {/* Progress stages */}
            <div className="flex flex-col gap-3 mb-8">
              {stages.map((stage, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="shrink-0">
                    {stage.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : stage.active ? (
                      <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/15" />
                    )}
                  </div>
                  <span className={`text-sm ${stage.done ? "text-white/50" : stage.active ? "text-white/90 font-medium" : "text-white/25"}`}>
                    {stage.label}
                  </span>
                  {stage.done && <span className="ml-auto text-emerald-400/70 text-xs">done</span>}
                  {stage.active && <span className="ml-auto text-violet-400/70 text-xs animate-pulse">running…</span>}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2">
              <div className="h-full rounded-full bg-violet-500 transition-all duration-1000" style={{ width: "55%" }} />
            </div>
            <p className="text-white/25 text-xs">Analyzing 7 of 12 pages…</p>

            {/* Skeleton results preview */}
            <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-3">
              <p className="text-white/20 text-xs uppercase tracking-widest">Preview appearing shortly</p>
              <Skeleton w="90%" h="11px" />
              <Skeleton w="75%" h="11px" />
              <Skeleton w="85%" h="11px" />
              <div className="mt-1 flex gap-2">
                <Skeleton w="80px" h="22px" className="rounded-full" />
                <Skeleton w="70px" h="22px" className="rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
