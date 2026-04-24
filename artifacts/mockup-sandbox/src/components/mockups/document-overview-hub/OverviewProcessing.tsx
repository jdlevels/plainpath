import { FileText, CheckCircle2, Cpu } from "lucide-react";

const STAGES = [
  { label: "Parsing document structure", done: true, time: "0.4s" },
  { label: "Extracting key entities, parties & dates", done: true, time: "1.1s" },
  { label: "Identifying obligations & risks", active: true },
  { label: "Scoring urgency & recommended next actions", pending: true },
  { label: "Generating plain-English summary", pending: true },
];

function Bone({ w, h = "9px", className = "" }: { w: string; h?: string; className?: string }) {
  return <div className={`rounded-md bg-white/[0.05] animate-pulse ${className}`} style={{ width: w, height: h }} />;
}

function FakePage({ pg, dim }: { pg: number; dim?: boolean }) {
  return (
    <div className={`w-full rounded-lg border p-4 flex flex-col gap-1.5 ${dim ? "border-white/[0.04] bg-white/[0.01] opacity-50" : "border-white/[0.06] bg-white/[0.02]"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/15 text-[9px]">Page {pg}</span>
      </div>
      {pg === 1 && (
        <div className="mb-1.5">
          <Bone w="55%" h="13px" className="mb-1.5" />
          <Bone w="40%" h="10px" />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {[88, 72, 94, 68, 80].map((w, i) => (
          <Bone key={i} w={`${w}%`} />
        ))}
      </div>
    </div>
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
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full bg-violet-600/15 border border-violet-500/25 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300 text-[10px] font-medium">Analyzing…</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: doc viewer loading */}
        <div className="w-[42%] border-r border-white/[0.06] flex flex-col bg-[#0e0e12] shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-violet-400/50" />
            <span className="text-white/35 text-xs flex-1 truncate">NDA — Stripe Inc.pdf</span>
            <span className="text-white/20 text-xs">12 pp.</span>
          </div>
          <div className="flex-1 overflow-hidden p-3 flex flex-col gap-2.5">
            <FakePage pg={1} />
            <FakePage pg={2} dim />
            <FakePage pg={3} dim />
          </div>
          {/* scanning line */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent animate-pulse mx-3 mb-3 rounded-full" />
        </div>

        {/* Right: progress */}
        <div className="flex-1 flex flex-col justify-center px-7 py-8">

          {/* File + AI chip */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-white/75 text-sm font-medium">NDA — Stripe Inc.pdf</p>
              <p className="text-white/30 text-xs">12 pages · 847 KB</p>
            </div>
            <div className="h-6 px-2 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-violet-400/60" />
              <span className="text-white/35 text-[10px]">GPT-4o</span>
            </div>
          </div>

          {/* Stage list */}
          <div className="flex flex-col gap-3 mb-7">
            {STAGES.map((stage, i) => (
              <div key={i} className={`flex items-center gap-3 transition-all ${stage.pending ? "opacity-30" : ""}`}>
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {stage.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : stage.active ? (
                    <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/15" />
                  )}
                </div>
                <span className={`text-sm flex-1 ${stage.done ? "text-white/45" : stage.active ? "text-white/90 font-medium" : "text-white/25"}`}>
                  {stage.label}
                </span>
                {stage.done && <span className="text-emerald-400/60 text-[10px] tabular-nums">{stage.time}</span>}
                {stage.active && <span className="text-violet-400/70 text-[10px] animate-pulse">running…</span>}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mb-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/25 text-xs">Page 7 of 12</span>
              <span className="text-white/25 text-xs">58%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-violet-500" style={{ width: "58%" }} />
            </div>
          </div>

          {/* Skeleton preview of incoming data */}
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-pulse" />
              <span className="text-white/20 text-[10px] uppercase tracking-widest">Results appearing…</span>
            </div>
            <div className="flex flex-col gap-2">
              <Bone w="88%" />
              <Bone w="72%" />
              <Bone w="80%" />
            </div>
            <div className="mt-3 flex gap-2">
              <Bone w="72px" h="20px" className="rounded-full" />
              <Bone w="60px" h="20px" className="rounded-full" />
              <Bone w="55px" h="20px" className="rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
