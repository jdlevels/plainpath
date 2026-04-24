import {
  FileText, AlertTriangle, Calendar, Users, ChevronRight, MessageSquare,
  Shield, EyeOff, FileSearch, Bookmark, CheckCircle2, ArrowRight, Info
} from "lucide-react";

function Chip({ page, section, uncertain }: { page: number; section?: string; uncertain?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 h-4 px-1.5 rounded text-[9px] font-medium cursor-pointer transition-all ${
      uncertain
        ? "bg-amber-500/20 border border-amber-400/30 text-amber-300/80"
        : "bg-violet-600/15 border border-violet-500/20 text-violet-300 hover:bg-violet-500/25"
    }`}>
      {uncertain && "~"}p.{page}{section ? ` · ${section}` : ""}
    </span>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      {icon && <span className="text-white/35">{icon}</span>}
      <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">{children}</p>
    </div>
  );
}

function DocPage({ pg, unclear }: { pg: number; unclear?: boolean }) {
  return (
    <div className={`w-full rounded-lg border p-3.5 flex flex-col gap-1.5 ${
      unclear ? "border-amber-500/20 bg-amber-500/[0.02]" : "border-white/[0.05] bg-white/[0.015]"
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/20 text-[9px]">Page {pg}</span>
        {unclear && (
          <div className="flex items-center gap-1 h-4 px-1.5 rounded bg-amber-500/15 border border-amber-500/25">
            <span className="text-amber-300/70 text-[9px]">low quality</span>
          </div>
        )}
      </div>
      {pg === 1 && (
        <div className="mb-1">
          <div className="h-3 rounded mb-1.5 bg-white/[0.12]" style={{ width: "55%" }} />
          <div className="h-2 rounded bg-white/[0.07]" style={{ width: "38%" }} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {[85, 70, 60, 78, 52].map((w, i) => (
          <div key={i} className={`h-[7px] rounded-sm ${unclear ? "bg-amber-500/15" : "bg-white/[0.07]"}`} style={{ width: `${w}%` }} />
        ))}
      </div>
      {unclear && (
        <div className="mt-1 rounded bg-amber-500/[0.06] border border-amber-500/12 px-2 py-1">
          <p className="text-amber-300/50 text-[9px]">Scanned — text extraction limited</p>
        </div>
      )}
    </div>
  );
}

const NEXT_STEPS = [
  { action: "Upload a clearer or text-based PDF",   icon: <FileText className="w-4 h-4" />,   color: "violet", urgent: true,  detail: "A searchable PDF will give you a significantly better analysis." },
  { action: "Review renewal clause manually",         icon: <Calendar className="w-4 h-4" />,   color: "amber",  urgent: true,  detail: "An auto-renewal was partially detected on p.8 — confirm with the original." },
  { action: "Ask specific questions about the doc",  icon: <MessageSquare className="w-4 h-4" />, color: "blue", urgent: false, tool: "Ask This Document", detail: "Targeted questions often work better than full analysis on poor scans." },
];

const PARTIAL_RISKS = [
  { level: "high",   text: "Auto-renewal clause detected — exact notice period unclear.",   page: 8, uncertain: true },
  { level: "medium", text: "Liability clause found — scope partially unreadable.",            page: 11, uncertain: true },
  { level: "low",    text: "Governing law appears to be Delaware.",                           page: 12 },
];

const PARTIAL_DATES = [
  { label: "Effective Date",     value: "~January 2025",   page: 1, uncertain: true },
  { label: "Renewal Deadline",   value: "Unknown — p.8 unreadable", page: 8, uncertain: true },
];

const TOOLS = [
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document",    desc: "Ask targeted questions for better results", color: "violet" },
  { icon: <Shield className="w-3.5 h-3.5" />,        label: "Trust Check",          desc: "Verify document authenticity",              color: "amber" },
  { icon: <EyeOff className="w-3.5 h-3.5" />,        label: "Redact Sensitive Info", desc: "Remove PII before sharing",               color: "red" },
];

const TOOL_COLORS: Record<string, string> = {
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  amber:  "text-amber-400  bg-amber-600/10  border-amber-500/20",
  blue:   "text-blue-400   bg-blue-600/10   border-blue-500/20",
  red:    "text-red-400    bg-red-600/10    border-red-500/20",
};

export function AnalyzeLowConf() {
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
          <div className="h-6 px-2.5 rounded-full bg-amber-600/12 border border-amber-500/25 flex items-center gap-1.5">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-amber-300 text-[10px] font-medium">38% confidence</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT */}
        <div className="w-[40%] border-r border-white/[0.06] flex flex-col bg-[#0e0e12] shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-amber-400/60" />
            <span className="text-white/45 text-xs flex-1 truncate">Lease Agreement — 42 Oak St [scan].pdf</span>
            <span className="text-white/20 text-xs">8 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            <DocPage pg={1} />
            <DocPage pg={3} />
            <DocPage pg={8} unclear />
          </div>
          <div className="h-9 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">Page 1 of 8</span>
            <div className="flex items-center gap-1">
              {[1, 3, 8].map((p) => (
                <button key={p} className="w-5 h-5 rounded text-[9px] flex items-center justify-center text-white/25 hover:text-white/50">{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 flex flex-col gap-4">

            {/* Doc header */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-white/90 text-sm font-semibold">Lease Agreement — 42 Oak St</h1>
                  <div className="h-5 px-2 rounded-full border border-amber-500/20 bg-amber-600/10">
                    <span className="text-amber-300/70 text-[10px]">Scanned PDF</span>
                  </div>
                </div>
                <p className="text-white/30 text-xs mt-0.5">8 pages · text extraction limited</p>
              </div>
            </div>

            {/* Confidence warning */}
            <div className="rounded-xl border border-amber-500/25 bg-amber-600/[0.06] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-300 text-sm font-semibold mb-1.5">Partial analysis — low text quality</p>
                  <p className="text-white/45 text-xs leading-relaxed">
                    This document appears to be a scanned image. PlainPath could only read <strong className="text-white/65">~38%</strong> of the text clearly.
                    Some findings below may be inaccurate — items marked with <span className="text-amber-300 font-mono">~</span> are estimates.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="h-7 px-3 rounded-lg bg-amber-600/15 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-600/25 transition-colors flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      Upload text-based version
                    </button>
                    <button className="h-7 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/45 text-xs hover:bg-white/[0.07] transition-colors flex items-center gap-1.5">
                      <Info className="w-3 h-3" />
                      Use partial results anyway
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Partial plain-English explanation */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <SectionTitle>Partial Explanation</SectionTitle>
              <p className="text-white/55 text-sm leading-relaxed">
                This appears to be a residential lease agreement for a property at 42 Oak Street. The term and rent amount were not clearly readable. An auto-renewal clause was detected on page 8 — <span className="text-amber-300/80">notice period could not be confirmed</span>.
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <Chip page={1} />
                <Chip page={8} section="§ 7" uncertain />
              </div>
            </div>

            {/* Required next steps */}
            <div className="rounded-xl overflow-hidden border border-white/[0.10]" style={{
              background: "linear-gradient(135deg, rgba(109,40,217,0.07) 0%, rgba(15,15,17,0) 60%)"
            }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-violet-400" />
                  </div>
                  <p className="text-white/85 text-sm font-semibold">Recommended Next Steps</p>
                  <div className="ml-auto h-5 px-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-300/90 text-[9px] font-medium">1 urgent</span>
                  </div>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {NEXT_STEPS.map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg px-3.5 py-2.5 border cursor-pointer hover:bg-white/[0.04] transition-all ${
                    a.urgent ? "border-white/[0.10] bg-white/[0.03]" : "border-white/[0.06]"
                  }`}>
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${TOOL_COLORS[a.color]}`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-medium ${a.urgent ? "text-white/85" : "text-white/55"}`}>{a.action}</p>
                        {a.urgent && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                      </div>
                      <p className="text-white/30 text-xs leading-relaxed">{a.detail}</p>
                    </div>
                    {(a as any).tool && (
                      <div className={`h-5 px-2 rounded text-[10px] border flex items-center shrink-0 mt-0.5 ${TOOL_COLORS[a.color]}`}>
                        {(a as any).tool}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Partial risks (uncertain) */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Partial Risks</p>
                <div className="ml-auto h-4 px-1.5 rounded bg-amber-500/10 border border-amber-500/20 flex items-center">
                  <span className="text-amber-300/70 text-[9px]">estimates — verify manually</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {PARTIAL_RISKS.map((r, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 border ${
                    r.level === "high" ? "border-red-500/15 bg-red-500/[0.03]" :
                    r.level === "medium" ? "border-amber-500/12 bg-amber-500/[0.02]" :
                    "border-white/[0.05]"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      r.level === "high" ? "bg-red-400/70" : r.level === "medium" ? "bg-amber-400/70" : "bg-white/20"
                    }`} />
                    <p className="text-white/50 text-xs leading-relaxed flex-1">{r.text}</p>
                    <Chip page={r.page} uncertain={r.uncertain} />
                  </div>
                ))}
              </div>
            </div>

            {/* Partial dates */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <SectionTitle icon={<Calendar className="w-3.5 h-3.5 text-sky-400/60" />}>Key Dates (partial)</SectionTitle>
              <div className="flex flex-col gap-2">
                {PARTIAL_DATES.map((d, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/30 text-[10px]">{d.label}</p>
                      <p className={`text-xs font-medium leading-tight ${d.uncertain ? "text-amber-300/70" : "text-white/65"}`}>{d.value}</p>
                    </div>
                    <Chip page={d.page} uncertain={d.uncertain} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended tools */}
            <div>
              <SectionTitle>Recommended Tools for Low-Quality Scans</SectionTitle>
              <div className="grid grid-cols-1 gap-2">
                {TOOLS.map((tool, i) => (
                  <button key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${TOOL_COLORS[tool.color]}`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-xs font-medium leading-none mb-0.5">{tool.label}</p>
                      <p className="text-white/28 text-[10px] leading-none">{tool.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
