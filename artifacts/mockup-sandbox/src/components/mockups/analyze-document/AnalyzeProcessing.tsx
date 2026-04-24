import { FileText, Check, Loader2 } from "lucide-react";

const STAGES = [
  { id: 1, label: "Reading document structure",      detail: "Parsing 14 pages, identifying headings and sections…", done: true,  active: false },
  { id: 2, label: "Extracting important sections",   detail: "Found effective dates, obligations, and key clauses…",  done: true,  active: false },
  { id: 3, label: "Checking for risks",              detail: "Reviewing liability, renewal, and unusual terms…",       done: false, active: true  },
  { id: 4, label: "Generating plain-English summary", detail: "",                                                       done: false, active: false },
];

const DOC_PAGES = [
  { pg: 1,  lines: [88, 72, 80, 65, 78], title: true  },
  { pg: 5,  lines: [85, 70, 77, 65, 90]               },
  { pg: 9,  lines: [88, 68, 75, 82, 60], scanning: true },
  { pg: 14, lines: [78, 62, 88, 70, 75]               },
];

function FakeDocPage({ pg, lines, title, scanning }: {
  pg: number; lines: number[]; title?: boolean; scanning?: boolean;
}) {
  return (
    <div className={`w-full rounded-lg border p-3.5 flex flex-col gap-1.5 ${
      scanning
        ? "border-violet-500/25 bg-violet-500/[0.03]"
        : "border-white/[0.05] bg-white/[0.012]"
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/18 text-[9px] font-mono">Page {pg}</span>
        {scanning && (
          <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/18 border border-violet-500/25">
            <Loader2 className="w-2 h-2 text-violet-400 animate-spin" />
            <span className="text-violet-300/65 text-[9px]">reading…</span>
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
          <div
            key={i}
            className={`h-[7px] rounded-sm ${scanning && i < 2 ? "bg-violet-400/18" : "bg-white/[0.065]"}`}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function AnalyzeProcessing() {
  const doneCount = STAGES.filter(s => s.done).length;
  const pct = Math.round((doneCount / STAGES.length) * 100 + 10);

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
          <div className="h-6 px-2.5 rounded-full bg-violet-600/12 border border-violet-500/25 flex items-center gap-1.5">
            <Loader2 className="w-2.5 h-2.5 text-violet-400 animate-spin" />
            <span className="text-violet-300 text-[10px] font-medium">Analysing…</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: document viewer — muted while processing */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/25 shrink-0" />
            <span className="text-white/35 text-xs flex-1 truncate">Consulting Agreement — Acme Corp.pdf</span>
            <span className="text-white/15 text-xs">14 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 opacity-55">
            {DOC_PAGES.map((p) => (
              <FakeDocPage key={p.pg} {...p} />
            ))}
          </div>
          {/* Scan progress bar */}
          <div className="h-10 border-t border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
            <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500/60"
                style={{ width: `${pct}%`, transition: "width 1s ease" }}
              />
            </div>
            <span className="text-white/18 text-[10px] whitespace-nowrap">Pg {9} / 14</span>
          </div>
        </div>

        {/* RIGHT: progress panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">

            {/* File identity */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4.5 h-4.5 text-white/35" />
              </div>
              <div className="flex-1">
                <p className="text-white/75 text-sm font-semibold">Consulting Agreement — Acme Corp.pdf</p>
                <p className="text-white/28 text-[10px] mt-0.5">14 pages · 1.2 MB · Uploaded just now</p>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/65 text-sm font-medium">Analysis in progress</p>
                <span className="text-white/22 text-xs">{doneCount} of {STAGES.length} steps</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #6d28d9 0%, #8b5cf6 100%)",
                    transition: "width 700ms ease"
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-white/20 text-[10px]">~8 seconds remaining</p>
                <p className="text-violet-400/50 text-[10px] font-mono">{pct}%</p>
              </div>
            </div>

            {/* Stage checklist */}
            <div className="flex flex-col gap-4">
              {STAGES.map((stage) => (
                <div key={stage.id} className="flex items-start gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    stage.done
                      ? "bg-emerald-600/18 border border-emerald-500/30"
                      : stage.active
                      ? "bg-violet-600/22 border border-violet-500/40"
                      : "bg-white/[0.04] border border-white/[0.07]"
                  }`}>
                    {stage.done ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : stage.active ? (
                      <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/18" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium leading-none mb-1 ${
                      stage.done ? "text-white/40" : stage.active ? "text-white/88" : "text-white/22"
                    }`}>{stage.label}</p>
                    {(stage.done || stage.active) && stage.detail && (
                      <p className={`text-[10px] leading-relaxed ${stage.done ? "text-white/18" : "text-white/35"}`}>
                        {stage.detail}
                      </p>
                    )}
                    {stage.active && !stage.detail && (
                      <p className="text-white/30 text-[10px]">Working…</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* What you'll get */}
            <div className="border-t border-white/[0.05] pt-5">
              <p className="text-white/18 text-[10px] uppercase tracking-widest font-semibold mb-3">Your analysis will include</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Plain-English summary",      accent: "text-violet-300",  bg: "bg-violet-600/6  border-violet-500/12" },
                  { label: "Confidence & risk status",    accent: "text-red-300",     bg: "bg-red-600/6     border-red-500/12" },
                  { label: "Required next steps",         accent: "text-sky-300",     bg: "bg-sky-600/6     border-sky-500/12" },
                  { label: "Key deadlines",               accent: "text-amber-300",   bg: "bg-amber-600/6   border-amber-500/12" },
                  { label: "Key parties",                 accent: "text-emerald-300", bg: "bg-emerald-600/6 border-emerald-500/12" },
                  { label: "Source traceability",         accent: "text-violet-300",  bg: "bg-violet-600/6  border-violet-500/12" },
                ].map((item, i) => (
                  <div key={i} className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${item.bg}`}>
                    <div className={`w-1 h-1 rounded-full shrink-0 opacity-80 ${item.accent.replace("text-", "bg-")}`} />
                    <p className={`text-[11px] font-medium ${item.accent}`}>{item.label}</p>
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
