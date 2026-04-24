import {
  FileText, AlertTriangle, ChevronRight, Upload, RefreshCcw,
  MessageSquare, Layers, Info, CheckCircle2, X
} from "lucide-react";

export function ContractReviewLowConf() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/15 text-[10px] mx-0.5">·</span>
        <span className="text-white/28 text-xs">Contract Review</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-amber-600/12 border-amber-500/25 text-amber-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">29% scan confidence</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: partial doc viewer */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-amber-400/50 shrink-0" />
            <span className="text-white/40 text-xs flex-1 truncate">Employment_Agreement_Scan.pdf</span>
            <span className="text-white/18 text-xs shrink-0">6 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {/* Readable page */}
            <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-mono text-white/18">Page 1 — Readable</p>
                <span className="h-4 px-1.5 rounded bg-emerald-500/12 border border-emerald-500/18 text-emerald-300/60 text-[9px]">extracted</span>
              </div>
              <p className="text-[11px] text-white/35 leading-relaxed">EMPLOYMENT AGREEMENT dated May 15, 2025 between Meridian Software Inc. ("Employer") and the undersigned employee. This Agreement sets forth the terms and conditions of employment…</p>
              <div className="flex flex-col gap-1 mt-1">
                {[65, 80, 50, 72, 40].map((w, i) => <div key={i} className="h-1.5 rounded-full bg-white/[0.06]" style={{ width: `${w}%` }} />)}
              </div>
            </div>

            {/* Low quality pages */}
            {[2, 3, 4].map(pg => (
              <div key={pg} className="w-full rounded-xl border border-amber-500/12 bg-amber-500/[0.015] p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-mono text-amber-300/35">Page {pg} — Low scan quality</p>
                  <span className="h-4 px-1.5 rounded bg-amber-500/12 border border-amber-500/18 text-amber-300/50 text-[9px]">partial</span>
                </div>
                <p className="text-amber-200/22 text-[10px] italic leading-relaxed">
                  {pg===2 ? "[Low scan quality — salary and bonus terms partially illegible]\n…base salary of $[illegible]…annual bonus of…[illegible]…" : pg===3 ? "[Scanned image — non-compete clause text unclear]\n…shall not engage in…[illegible]…for a period of…[illegible]…months…" : "[Scanned image — text extraction very limited]\n[Signature and date block — partially unreadable]"}
                </p>
                <div className="flex flex-col gap-1 mt-1 opacity-30">
                  {[55, 40, 70, 35].map((w, i) => <div key={i} className="h-1.5 rounded-full bg-amber-400/30" style={{ width: `${w}%` }} />)}
                </div>
              </div>
            ))}
          </div>
          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">1 of 4 pages readable</span>
          </div>
        </div>

        {/* RIGHT: low-conf panel */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-4">

            {/* Main banner */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-amber-300 text-sm font-semibold">Partial contract review — low scan quality</p>
              </div>
              <p className="text-white/60 text-[12px] leading-relaxed mb-3.5">
                PlainPath could review part of this contract, but scan quality limits review confidence. Key sections — including salary/compensation, non-compete scope, and the signature block — could not be fully extracted.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-semibold mb-1.5">What PlainPath could read</p>
                  {[
                    "Page 1 — parties, employment terms, start date",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400/60 shrink-0 mt-0.5" />
                      <p className="text-white/42 text-[11px]">{item}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-semibold mb-1.5">What could not be verified</p>
                  {[
                    "Pages 2–3 — salary, bonus, and benefit terms",
                    "Non-compete clause — scope, duration, geography",
                    "Termination provisions and severance",
                    "Signature block and execution date",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                      <X className="w-3 h-3 text-white/22 shrink-0 mt-0.5" />
                      <p className="text-white/32 text-[11px]">{item}</p>
                    </div>
                  ))}
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-500/15 bg-amber-500/[0.03] px-2 py-1.5">
                    <Info className="w-3 h-3 text-amber-400/50 shrink-0 mt-0.5" />
                    <p className="text-amber-300/55 text-[10px]">Upload a text-based PDF for a full, high-confidence contract review.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended next steps */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="text-white/55 text-xs font-semibold mb-3">Recommended next steps</p>
              <div className="flex flex-col gap-2">
                {[
                  { icon: Upload,        label: "Upload a clearer scan or PDF",        desc: "Higher resolution gives much better clause extraction.",           primary: true  },
                  { icon: FileText,      label: "Upload a text-based version",          desc: "Export from Word or the original application.",                   primary: false },
                  { icon: RefreshCcw,    label: "Continue with partial review",         desc: "See what PlainPath could assess from the readable section.",       primary: false },
                  { icon: MessageSquare, label: "Ask This Document",                    desc: "Ask targeted questions — sometimes extracts more from poor scans.", primary: false },
                  { icon: Layers,        label: "Analyze a Document",                   desc: "Full plain-English document summary from the readable portion.",   primary: false },
                ].map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${step.primary ? "border-violet-500/22 bg-violet-500/[0.05] hover:bg-violet-500/[0.08]" : "border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03]"}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${step.primary ? "bg-violet-600/20" : "bg-white/[0.04]"}`}>
                      <step.icon className={`w-3.5 h-3.5 ${step.primary ? "text-violet-400" : "text-white/35"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${step.primary ? "text-violet-200/85" : "text-white/55"}`}>{step.label}</p>
                      <p className="text-white/28 text-[10px] leading-tight">{step.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Partial signals */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/30 text-[9px] uppercase tracking-widest font-semibold">Partial signals found</p>
                <span className="h-4 px-1.5 rounded border border-white/10 text-white/30 text-[9px]">verify manually</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { text: "Employer: Meridian Software Inc. — identified on page 1",          sev: "ok" },
                  { text: "Employment start date visible — May 15, 2025",                    sev: "ok" },
                  { text: "Salary / compensation terms — unreadable on pages 2–3",           sev: "warn" },
                  { text: "Non-compete clause detected — scope and duration unclear",        sev: "warn" },
                  { text: "Severance / termination terms — not accessible",                  sev: "warn" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${s.sev === "ok" ? "bg-emerald-400/55" : "bg-amber-400/50"}`} />
                    <p className="text-white/42 text-[11px] leading-relaxed">{s.text}</p>
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
