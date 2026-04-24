import { FileText, ArrowLeftRight, CheckCircle2, Circle, Loader2 } from "lucide-react";

const STEPS = [
  { label: "Reading original document",          done: true },
  { label: "Reading revised document",           done: true },
  { label: "Aligning matching sections",         done: true },
  { label: "Detecting added and removed language", active: true },
  { label: "Identifying changed terms",          done: false },
  { label: "Checking changes that may need review", done: false },
  { label: "Generating comparison summary",      done: false },
];

function DocPreviewPane({ title, pages, activeIdx }: { title: string; pages: string[]; activeIdx: number }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
        <FileText className="w-3 h-3 text-white/25" />
        <span className="text-[11px] text-white/45 font-medium truncate">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {pages.map((label, i) => (
          <div key={i} className={`rounded-lg border p-3 transition-all ${i === activeIdx ? "border-violet-500/35 bg-violet-500/[0.06]" : "border-white/[0.05] bg-white/[0.01]"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-white/25 font-medium">{label}</span>
              {i === activeIdx && (
                <span className="text-[9px] text-violet-400/70 flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> aligning…
                </span>
              )}
              {i < activeIdx && <span className="text-[9px] text-white/20">read</span>}
            </div>
            <div className="space-y-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className={`h-1.5 rounded-full ${i === activeIdx ? "bg-violet-500/20" : "bg-white/[0.06]"}`}
                  style={{ width: `${55 + (j * 13 + i * 7) % 38}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="h-8 border-t border-white/[0.04] px-4 flex items-center">
        <span className="text-[10px] text-white/18">{activeIdx + 1} of {pages.length} pages processed</span>
      </div>
    </div>
  );
}

export function CompareVersionsProcessing() {
  const origPages = ["Page 1 — §1–2 · Parties & Scope", "Page 2 — §3 · Term & Renewal", "Page 3 — §4 · Fees & Payment", "Page 4 — §7–9 · Confidentiality & Liability"];
  const revPages  = ["Page 1 — §1–2 · Parties & Scope", "Page 2 — §3 · Term & Renewal (revised)", "Page 3 — §4 · Fees & Payment (revised)", "Page 4 — §7–9 · Confidentiality & Liability", "Page 5 — §10 · Dispute Resolution (new)"];

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
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-6 px-2.5 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center gap-1.5">
            <Loader2 className="w-2.5 h-2.5 text-violet-400 animate-spin" />
            <span className="text-[11px] text-violet-300/80 font-medium">Comparing documents…</span>
          </div>
        </div>
      </div>

      {/* Three-zone body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — Original */}
        <div className="w-[37%] border-r border-white/[0.05] flex flex-col">
          <DocPreviewPane title="Lease_Agreement_v1.pdf  ·  Original" pages={origPages} activeIdx={2} />
        </div>

        {/* Middle — Revised */}
        <div className="w-[37%] border-r border-white/[0.05] flex flex-col">
          <DocPreviewPane title="Lease_Agreement_v2_redline.pdf  ·  Revised" pages={revPages} activeIdx={2} />
        </div>

        {/* Right — Progress panel */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">

          {/* File pair */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-white/35" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-white/60 font-medium truncate">Lease_Agreement_v1.pdf</p>
                <p className="text-[10px] text-white/28">4 pages · 1.4 MB · Original</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-3 h-3 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-violet-300/70 font-medium truncate">Lease_Agreement_v2_redline.pdf</p>
                <p className="text-[10px] text-white/28">5 pages · 1.8 MB · Revised</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white/70">Comparison in progress</p>
              <span className="text-[11px] text-white/35">4 of 7 steps</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.07] mb-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-violet-600" style={{ width: "57%" }} />
            </div>
            <p className="text-[10px] text-white/28 mb-4">~18 seconds remaining</p>

            <div className="space-y-2.5">
              {STEPS.map((step, i) => {
                const active = step.active;
                const done = step.done && !active;
                return (
                  <div key={i} className={`flex items-center gap-2.5 ${active ? "opacity-100" : done ? "opacity-70" : "opacity-30"}`}>
                    {done
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      : active
                        ? <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" />
                        : <Circle className="w-3.5 h-3.5 text-white/20 shrink-0" />}
                    <p className={`text-[11px] leading-snug ${active ? "text-white/80 font-medium" : done ? "text-white/48" : "text-white/28"}`}>{step.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What's coming */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/18 mb-3">YOUR COMPARISON WILL INCLUDE</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                "Changes by type",        "Added language",
                "Removed language",       "Modified terms",
                "Possible risk changes",  "Plain-English summary",
                "Change confidence",      "Source-backed chips",
              ].map(f => (
                <div key={f} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-violet-500/40 shrink-0" />
                  <span className="text-[10px] text-white/28">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-white/18 text-center px-2">Change comparison support — source-backed changes, not legal advice.</p>
        </div>
      </div>
    </div>
  );
}
