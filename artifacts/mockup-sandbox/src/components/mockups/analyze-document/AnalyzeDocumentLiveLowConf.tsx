import {
  FileText, AlertTriangle, ChevronRight, MessageSquare,
  Zap, Upload, RotateCcw, FileWarning, Info, Bookmark
} from "lucide-react";

function SourceChip({ label, uncertain }: { label: string; uncertain?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap ${
      uncertain
        ? "bg-amber-500/12 border border-amber-400/22 text-amber-300/75"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75"
    }`}>
      {uncertain && <span className="opacity-60">~</span>}
      {label}
    </span>
  );
}

function SLabel({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-white/28 shrink-0">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/26 flex-1">{children}</p>
      {right}
    </div>
  );
}

const SECTIONS = [
  { id: "s1", content: "Lease Agreement for residential property at 42 Oak Street, Unit 4B. Monthly rent $2,400. Lease term 12 months commencing March 1, 2025." },
  { id: "s3", content: "[Text partially legible — scanned image] Security deposit... returned within... days of... normal wear... deductions..." },
  { id: "s8", content: "[Scanned image — text extraction limited on this page]", lowQuality: true },
];

function DocSection({ section }: { section: typeof SECTIONS[0] }) {
  return (
    <div className={`w-full rounded-xl border p-4 flex flex-col gap-2 ${
      section.lowQuality ? "border-amber-500/12 bg-amber-500/[0.015]" : "border-white/[0.05] bg-white/[0.015]"
    }`}>
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-[9px] font-mono text-white/18">Section {section.id.slice(1)}</span>
        {section.lowQuality && (
          <div className="h-4 px-1.5 rounded-full bg-amber-500/15 border border-amber-500/22 flex items-center">
            <span className="text-amber-300/70 text-[9px]">low quality</span>
          </div>
        )}
      </div>
      <p className={`text-[11px] leading-relaxed ${section.lowQuality ? "text-amber-200/28 italic" : "text-white/32"}`}>
        {section.content}
      </p>
    </div>
  );
}

export function AnalyzeDocumentLiveLowConf() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar — amber confidence badge */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight shrink-0">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Analyze a Document</span>
        <ChevronRight className="w-3 h-3 text-white/18" />
        <span className="text-white/30 text-xs truncate max-w-[180px]">Lease Agreement — scan.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-amber-600/12 border-amber-500/28 text-amber-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">38% confidence</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" /><span>Save</span>
          </button>
          <a className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Zap className="w-3 h-3" /><span>Re-analyse</span>
          </a>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Document viewer — amber icon for low conf */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            {/* LIVE CHANGE: amber icon for low conf */}
            <FileText className="w-3.5 h-3.5 text-amber-400/50 shrink-0" />
            <span className="text-white/45 text-xs flex-1 truncate">Lease Agreement — scan.pdf</span>
            <span className="text-white/18 text-xs shrink-0">3 pp.</span>
            <div className="w-px h-4 bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-0.5">
              {["Fit", "75%", "100%"].map((z, i) => (
                <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i === 1 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{z}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {SECTIONS.map(s => <DocSection key={s.id} section={s} />)}
          </div>
          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">3 sections</span>
            <div className="flex items-center gap-1">
              {[1,2,3].map(n => (
                <button key={n} className="w-6 h-6 rounded-md text-[9px] flex items-center justify-center text-white/22">{n}</button>
              ))}
            </div>
            <span className="text-white/14 text-[10px]">Jump to section</span>
          </div>
        </div>

        {/* RIGHT: LowConf panel — with LIVE doc identity header */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-5">

            {/* LIVE CHANGE: Doc identity header — amber FileWarning icon + Scanned PDF badge */}
            <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/22 flex items-center justify-center shrink-0 mt-0.5">
                <FileWarning className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-white/88 text-sm font-semibold">Lease Agreement — scan.pdf</h1>
                  <span className="h-4 px-1.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300/80 text-[9px] font-medium">Scanned PDF</span>
                  <span className="h-4 px-1.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/35 text-[9px]">Lease</span>
                </div>
                <p className="text-white/28 text-[10px]">Low scan quality · partial text extracted</p>
              </div>
            </div>

            {/* LIVE CHANGE: Enhanced warning with tilde notation explanation */}
            <div className="rounded-xl border border-amber-500/28 bg-amber-600/[0.07] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-300 text-sm font-semibold mb-1.5">Partial analysis — low scan quality</p>
                  <p className="text-white/45 text-xs leading-relaxed mb-2">
                    PlainPath could only read part of this document. Items marked with <span className="font-mono text-amber-300/70">~</span> are uncertain estimates — verify manually before acting.
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-amber-400/50 shrink-0" />
                    <p className="text-amber-300/50 text-[10px]">Upload a text-based PDF to get a full, high-confidence analysis.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What to do */}
            <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.07) 0%, rgba(12,12,15,0) 55%)" }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
                <p className="text-white/85 text-sm font-semibold">What would you like to do?</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {[
                  { icon: <Upload className="w-4 h-4" />, label: "Upload a clearer PDF", desc: "A text-based PDF gives significantly better results.", primary: true, color: "text-violet-400 bg-violet-600/10 border-violet-500/20" },
                  { icon: <FileText className="w-4 h-4" />, label: "Upload text-based version", desc: "Export from the original app instead of scanning.", primary: false, color: "text-violet-400 bg-violet-600/10 border-violet-500/20" },
                  { icon: <RotateCcw className="w-4 h-4" />, label: "Continue with partial analysis", desc: "See what PlainPath could extract from this document.", primary: false, color: "text-white/40 bg-white/[0.04] border-white/[0.08]" },
                  { icon: <MessageSquare className="w-4 h-4" />, label: "Ask This Document", desc: "Targeted questions sometimes work on poor scans.", primary: false, color: "text-blue-400 bg-blue-600/10 border-blue-500/20" },
                ].map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg px-3.5 py-3 border ${a.primary ? "border-white/[0.10] bg-white/[0.025]" : "border-white/[0.06]"}`}>
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${a.color}`}>{a.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-[13px] font-medium ${a.primary ? "text-white/88" : "text-white/50"}`}>{a.label}</p>
                        {a.primary && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                      </div>
                      <p className="text-white/28 text-[10px] leading-relaxed">{a.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/15 shrink-0 mt-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Partial risks — uncertain chips with ~ prefix */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <SLabel right={<span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/60 text-[9px]">verify manually</span>}>Partial Risks</SLabel>
              <div className="flex flex-col gap-2">
                {[
                  { title: "Possible early termination fee — amount unclear from scan", sev: "medium" },
                  { title: "Utilities responsibility may be tenant's — text partially legible", sev: "low" },
                ].map((r, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${r.sev === "medium" ? "border-amber-500/15 bg-amber-500/[0.03]" : "border-white/[0.05]"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${r.sev === "medium" ? "bg-amber-400" : "bg-white/22"}`} />
                    <p className="text-white/48 text-xs leading-relaxed flex-1">{r.title}</p>
                    <SourceChip label="~p.3" uncertain />
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
