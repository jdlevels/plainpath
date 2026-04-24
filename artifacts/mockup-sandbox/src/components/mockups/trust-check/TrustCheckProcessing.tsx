import { ShieldCheck, CheckCircle2, Loader2, FileText } from "lucide-react";

const STEPS = [
  { label: "Reading document structure", detail: "Parsing pages, layout, and section boundaries…", done: true },
  { label: "Checking claimed identity and document type", detail: "Reviewing stated sender, identifiers, and formatting…", done: true },
  { label: "Reviewing dates, names, and parties", detail: "Cross-referencing named entities for internal consistency…", active: true },
  { label: "Looking for conflicting or unusual signals", detail: "Scanning for mismatched data and structural anomalies…" },
  { label: "Checking formatting and source signals", detail: "Reviewing structure, metadata, and document origin clues…" },
  { label: "Generating trust summary", detail: "Finalising findings…" },
];

const DOC_PAGES = [
  { pg: 1, lines: [80, 55, 72, 60, 85], title: true },
  { pg: 2, lines: [75, 65, 82, 50, 68] },
  { pg: 3, lines: [88, 62, 71, 58, 78], scanning: true },
];

function DocPage({ pg, lines, title, scanning }: { pg: number; lines: number[]; title?: boolean; scanning?: boolean }) {
  return (
    <div className={`w-full rounded-lg border p-3.5 flex flex-col gap-1.5 ${scanning ? "border-violet-500/25 bg-violet-500/[0.03]" : "border-white/[0.05] bg-white/[0.012]"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/18 text-[9px] font-mono">Page {pg}</span>
        {scanning && (
          <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/18 border border-violet-500/25">
            <Loader2 className="w-2 h-2 text-violet-400 animate-spin" />
            <span className="text-violet-300/65 text-[9px]">reviewing…</span>
          </div>
        )}
      </div>
      {title && <div className="mb-1"><div className="h-3 rounded mb-1.5 bg-white/[0.12]" style={{ width: "55%" }} /><div className="h-2 rounded bg-white/[0.07]" style={{ width: "38%" }} /></div>}
      <div className="flex flex-col gap-1.5">
        {lines.map((w, i) => (
          <div key={i} className={`h-[7px] rounded-sm ${scanning && i < 2 ? "bg-violet-400/18" : "bg-white/[0.065]"}`} style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TrustCheckProcessing() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Document Trust Check</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full bg-violet-600/15 border border-violet-500/25 flex items-center gap-1.5">
            <Loader2 className="w-2.5 h-2.5 text-violet-400 animate-spin" />
            <span className="text-violet-300/80 text-[10px] font-medium">Reviewing…</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: muted document preview */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] overflow-hidden shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <span className="text-white/30 text-xs truncate flex-1">Northstar Cloud Services — Invoice NCS-2025-10847.pdf</span>
            <span className="text-white/12 text-xs shrink-0">3 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {DOC_PAGES.map(p => <DocPage key={p.pg} {...p} />)}
          </div>
          <div className="h-1.5 bg-white/[0.04] shrink-0">
            <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" style={{ width: "55%" }} />
          </div>
        </div>

        {/* RIGHT: progress panel */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-6 flex flex-col gap-5">

            {/* File card */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02]">
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/18 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-violet-400/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/75 text-sm font-medium truncate">Northstar Cloud Services — Invoice NCS-2025-10847.pdf</p>
                <p className="text-white/28 text-[10px]">3 pages · 1.4 MB · Uploaded just now</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/80 text-sm font-semibold">Trust review in progress</p>
                <span className="text-white/28 text-[10px]">3 of 6 steps</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full mb-1.5">
                <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" style={{ width: "45%" }} />
              </div>
              <p className="text-white/22 text-[10px]">~12 seconds remaining</p>
            </div>

            {/* Step checklist */}
            <div className="flex flex-col gap-2">
              {STEPS.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-xl px-3.5 py-3 border transition-all ${s.active ? "border-violet-500/25 bg-violet-500/[0.05]" : s.done ? "border-white/[0.05]" : "border-transparent"}`}>
                  <div className="mt-0.5 shrink-0">
                    {s.done
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : s.active
                      ? <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                      : <div className="w-4 h-4 rounded-full border-2 border-white/[0.12]" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${s.done ? "text-white/50" : s.active ? "text-white/90" : "text-white/20"}`}>{s.label}</p>
                    {(s.done || s.active) && <p className="text-white/25 text-[10px] mt-0.5">{s.detail}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* What you'll get */}
            <div>
              <p className="text-white/18 text-[9px] uppercase tracking-widest font-semibold mb-2.5">Your trust check will include</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "Trust summary", c: "text-violet-300 bg-violet-600/6 border-violet-500/12" },
                  { label: "Trust score & confidence", c: "text-amber-300 bg-amber-600/6 border-amber-500/12" },
                  { label: "Risk indicators", c: "text-red-300 bg-red-600/6 border-red-500/12" },
                  { label: "Verification checklist", c: "text-sky-300 bg-sky-600/6 border-sky-500/12" },
                  { label: "Document consistency", c: "text-emerald-300 bg-emerald-600/6 border-emerald-500/12" },
                  { label: "Source traceability", c: "text-violet-300 bg-violet-600/6 border-violet-500/12" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${item.c}`}>
                    <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                    <span className={`text-[10px] font-medium ${item.c.split(' ')[0]}`}>{item.label}</span>
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
