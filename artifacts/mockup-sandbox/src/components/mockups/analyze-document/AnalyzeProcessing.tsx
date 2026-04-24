import { FileText, Check, Loader2 } from "lucide-react";

const STAGES = [
  { id: 1, label: "Reading document structure", detail: "Parsing 14 pages, identifying sections…", done: true,    active: false },
  { id: 2, label: "Extracting dates & obligations", detail: "Found 6 dates, 8 party obligations…",   done: true,    active: false },
  { id: 3, label: "Checking for risks & missing items", detail: "Reviewing liability clauses, references…", done: false, active: true },
  { id: 4, label: "Building plain-English explanation", detail: "Summarising findings into plain language…", done: false, active: false },
];

const DOC_PAGES = [
  { pg: 1, lines: [88, 72, 80, 65, 78], title: true },
  { pg: 3, lines: [90, 68, 75, 82, 60] },
  { pg: 7, lines: [85, 70, 77, 65, 90], highlighted: true },
  { pg: 11, lines: [78, 62, 88, 70, 75] },
];

function FakeDocPage({ pg, lines, title, highlighted }: { pg: number; lines: number[]; title?: boolean; highlighted?: boolean }) {
  return (
    <div className={`w-full rounded-lg border p-3.5 flex flex-col gap-1.5 transition-all ${
      highlighted
        ? "border-violet-500/30 bg-violet-500/[0.04]"
        : "border-white/[0.05] bg-white/[0.015]"
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/20 text-[9px]">Page {pg}</span>
        {highlighted && (
          <div className="flex items-center gap-1 h-4 px-1.5 rounded bg-violet-500/20 border border-violet-500/30">
            <Loader2 className="w-2 h-2 text-violet-400 animate-spin" />
            <span className="text-violet-300/70 text-[9px]">scanning…</span>
          </div>
        )}
      </div>
      {title && (
        <div className="mb-1">
          <div className="h-3 rounded mb-1.5 bg-white/[0.12]" style={{ width: "55%" }} />
          <div className="h-2 rounded bg-white/[0.07]" style={{ width: "38%" }} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {lines.map((w, i) => (
          <div key={i} className={`h-[7px] rounded-sm ${highlighted && i < 2 ? "bg-violet-400/20" : "bg-white/[0.07]"}`} style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

export function AnalyzeProcessing() {
  const doneCount = STAGES.filter(s => s.done).length;
  const progress = (doneCount / STAGES.length) * 100 + 12;

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
        <span className="text-white/35 text-xs">Analyze a Document</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-violet-600/12 border border-violet-500/20 flex items-center gap-1.5">
            <Loader2 className="w-2.5 h-2.5 text-violet-400 animate-spin" />
            <span className="text-violet-300 text-[10px] font-medium">Analysing…</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: document viewer (greyed while processing) */}
        <div className="w-[40%] border-r border-white/[0.06] flex flex-col bg-[#0e0e12] shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/25" />
            <span className="text-white/35 text-xs flex-1 truncate">Consulting Agreement — Acme Corp.pdf</span>
            <span className="text-white/15 text-xs">14 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 opacity-60">
            {DOC_PAGES.map((p) => (
              <FakeDocPage key={p.pg} {...p} />
            ))}
          </div>
          {/* scanning progress bar at bottom of viewer */}
          <div className="h-9 border-t border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
            <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500/70 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white/20 text-[10px] whitespace-nowrap">Page {7} / 14</span>
          </div>
        </div>

        {/* RIGHT: analysis progress panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">
            {/* File summary */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4.5 h-4.5 text-white/40" />
              </div>
              <div className="flex-1">
                <h1 className="text-white/80 text-sm font-semibold">Consulting Agreement — Acme Corp.pdf</h1>
                <p className="text-white/30 text-xs mt-0.5">14 pages · 1.2 MB · Uploaded just now</p>
              </div>
            </div>

            {/* Progress stages */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/70 text-sm font-medium">Analysis in progress</p>
                  <span className="text-white/25 text-xs">{doneCount} of {STAGES.length} steps done</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%)"
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-white/20 text-[10px]">~10 seconds remaining</p>
                  <p className="text-violet-400/60 text-[10px]">{Math.round(progress)}%</p>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-3">
                {STAGES.map((stage, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    {/* State icon */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      stage.done
                        ? "bg-emerald-600/15 border border-emerald-500/30"
                        : stage.active
                        ? "bg-violet-600/20 border border-violet-500/40"
                        : "bg-white/[0.04] border border-white/[0.08]"
                    }`}>
                      {stage.done ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : stage.active ? (
                        <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-none mb-1 ${
                        stage.done ? "text-white/50" : stage.active ? "text-white/90" : "text-white/25"
                      }`}>{stage.label}</p>
                      {(stage.done || stage.active) && (
                        <p className={`text-[10px] leading-relaxed ${stage.done ? "text-white/20" : "text-white/35"}`}>
                          {stage.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What you'll get */}
            <div>
              <p className="text-white/20 text-[10px] uppercase tracking-widest font-semibold mb-3">Your analysis will include</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Plain-English explanation",   color: "text-violet-300",  bg: "bg-violet-600/8  border-violet-500/15" },
                  { label: "Required next steps",          color: "text-sky-300",     bg: "bg-sky-600/8     border-sky-500/15" },
                  { label: "Key dates & deadlines",        color: "text-amber-300",   bg: "bg-amber-600/8   border-amber-500/15" },
                  { label: "Risks & watchouts",            color: "text-red-300",     bg: "bg-red-600/8     border-red-500/15" },
                  { label: "Missing documents",            color: "text-orange-300",  bg: "bg-orange-600/8  border-orange-500/15" },
                  { label: "Recommended follow-up tools",  color: "text-emerald-300", bg: "bg-emerald-600/8 border-emerald-500/15" },
                ].map((item, i) => (
                  <div key={i} className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${item.bg}`}>
                    <div className="w-1 h-1 rounded-full bg-current shrink-0 opacity-70" />
                    <p className={`text-[11px] font-medium ${item.color}`}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
