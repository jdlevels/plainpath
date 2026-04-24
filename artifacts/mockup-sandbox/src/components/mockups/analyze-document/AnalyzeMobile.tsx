import {
  FileText, AlertTriangle, Calendar, ChevronRight, MessageSquare,
  ArrowRight, ArrowLeft, Shield, EyeOff, CheckCircle2, FileSearch
} from "lucide-react";

function Chip({ page, section, active }: { page: number; section?: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 h-4 px-1.5 rounded text-[9px] font-medium ${
      active
        ? "bg-violet-500/30 border border-violet-400/50 text-violet-200"
        : "bg-violet-600/15 border border-violet-500/20 text-violet-300"
    }`}>
      p.{page}{section ? ` · ${section}` : ""}
    </span>
  );
}

const RISKS = [
  { level: "high",   text: "Unlimited liability for confidentiality breaches.", page: 11, section: "§ 12.1", active: true },
  { level: "high",   text: "Auto-renewal — 90-day notice required.",            page: 8,  section: "§ 7.2" },
  { level: "medium", text: "Broad IP assignment — all work belongs to client.", page: 6,  section: "§ 6.0" },
];

const NEXT_STEPS = [
  { action: "Review liability exposure",  icon: <FileSearch className="w-3.5 h-3.5" />,  color: "red",    urgent: true  },
  { action: "Confirm renewal deadline",    icon: <Calendar className="w-3.5 h-3.5" />,    color: "amber",  urgent: true  },
  { action: "Negotiate IP assignment",     icon: <MessageSquare className="w-3.5 h-3.5" />, color: "blue", urgent: false },
];

const TOOL_COLORS: Record<string, string> = {
  red:    "text-red-400    bg-red-600/10    border-red-500/20",
  amber:  "text-amber-400  bg-amber-600/10  border-amber-500/20",
  blue:   "text-blue-400   bg-blue-600/10   border-blue-500/20",
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
};

function DocPage({ pg, active }: { pg: number; active?: boolean }) {
  return (
    <div className={`rounded border p-2.5 flex flex-col gap-1 transition-all ${
      active ? "border-violet-500/35 bg-violet-500/[0.04]" : "border-white/[0.06] bg-white/[0.01]"
    }`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-white/20 text-[8px]">Page {pg}</span>
        {active && <div className="w-1 h-1 rounded-full bg-violet-400" />}
      </div>
      {pg === 1 && <div className="h-2 rounded bg-white/[0.12] mb-1" style={{ width: "55%" }} />}
      {[82, 66, 74, 60, 70].map((w, i) => (
        <div key={i} className={`h-[5px] rounded-sm ${active && i < 2 ? "bg-violet-400/20" : "bg-white/[0.07]"}`} style={{ width: `${w}%` }} />
      ))}
      {active && (
        <div className="mt-1 rounded bg-violet-500/[0.08] border border-violet-500/12 px-1.5 py-0.5">
          <p className="text-violet-300/60 text-[8px]">Liability clause · § 12.1</p>
        </div>
      )}
    </div>
  );
}

export function AnalyzeMobile() {
  const activeTab = "analysis";

  return (
    <div className="w-[390px] h-[844px] bg-[#0c0c0f] flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Status bar */}
      <div className="h-10 flex items-center justify-between px-5 shrink-0">
        <span className="text-white/50 text-[11px] font-medium">9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2 rounded-sm border border-white/30 relative">
            <div className="absolute inset-0.5 left-0.5 right-[30%] bg-white/50 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="h-11 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="text-white/85 text-sm font-semibold tracking-tight">PlainPath</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2 rounded-full bg-emerald-600/12 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-300 text-[10px] font-medium">91%</span>
          </div>
        </div>
      </div>

      {/* File bar */}
      <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
        <FileText className="w-3 h-3 text-violet-400/60" />
        <span className="text-white/40 text-xs flex-1 truncate">Consulting Agreement — Acme Corp.pdf</span>
        <span className="text-white/20 text-[10px]">14 pp.</span>
      </div>

      {/* Tab bar */}
      <div className="h-10 border-b border-white/[0.06] flex shrink-0">
        {[
          { id: "analysis", label: "Analysis" },
          { id: "document", label: "Document" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-white/90"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-violet-500" />
            )}
          </button>
        ))}
      </div>

      {/* Analysis panel content */}
      {activeTab === "analysis" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col gap-3">

            {/* Summary */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-600/[0.05] p-3.5">
              <p className="text-white/25 text-[9px] uppercase tracking-widest font-semibold mb-1.5">Plain-English Explanation</p>
              <p className="text-white/65 text-[11px] leading-relaxed">
                Acme will consult for Stripe for <strong className="text-white/85 font-medium">12 months</strong>, paid on{" "}
                <strong className="text-white/85 font-medium">Net 30</strong>. The contract{" "}
                <strong className="text-white/85 font-medium">auto-renews</strong> unless cancelled by{" "}
                <strong className="text-amber-300 font-medium">Oct 17</strong>. All work belongs to Stripe. The <strong className="text-red-300 font-medium">unlimited liability clause</strong> needs urgent review.
              </p>
              <div className="mt-2 flex items-center gap-1 flex-wrap">
                <Chip page={1} />
                <Chip page={8} section="§ 7.2" />
                <Chip page={11} section="§ 12.1" active />
              </div>
            </div>

            {/* Source-jump banner */}
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              <p className="text-violet-300/75 text-[10px] flex-1">Viewing source — p.11 · § 12.1</p>
              <button className="flex items-center gap-1 text-violet-400/70 text-[9px]">
                <ArrowLeft className="w-2.5 h-2.5" />
                Doc
              </button>
            </div>

            {/* Required next steps */}
            <div className="rounded-xl border border-white/[0.10] overflow-hidden" style={{
              background: "linear-gradient(135deg, rgba(109,40,217,0.08) 0%, rgba(15,15,17,0) 60%)"
            }}>
              <div className="px-3.5 pt-3.5 pb-2.5 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-white/85 text-sm font-semibold">Required Next Steps</p>
                  <div className="ml-auto h-4 px-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                    <span className="text-red-300/90 text-[8px] font-medium">2 urgent</span>
                  </div>
                </div>
              </div>
              <div className="p-2.5 flex flex-col gap-1.5">
                {NEXT_STEPS.map((a, i) => (
                  <div key={i} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border cursor-pointer ${
                    a.urgent ? "border-white/[0.10] bg-white/[0.025]" : "border-white/[0.06]"
                  }`}>
                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${TOOL_COLORS[a.color]}`}>
                      {a.icon}
                    </div>
                    <p className={`text-[11px] font-medium flex-1 ${a.urgent ? "text-white/80" : "text-white/45"}`}>{a.action}</p>
                    {a.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                    <ChevronRight className="w-3 h-3 text-white/15 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3 h-3 text-amber-400/70" />
                <p className="text-white/25 text-[9px] uppercase tracking-widest font-semibold">Risks & Watchouts</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {RISKS.map((r, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-lg px-2.5 py-2 border ${
                    r.level === "high" ? "border-red-500/15 bg-red-500/[0.03]" :
                    "border-amber-500/12 bg-amber-500/[0.02]"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                      r.level === "high" ? "bg-red-400" : "bg-amber-400"
                    }`} />
                    <p className="text-white/55 text-[10px] leading-relaxed flex-1">{r.text}</p>
                    <Chip page={r.page} section={r.section} active={r.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick tools */}
            <div>
              <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold mb-2">Follow-up Tools</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { icon: <MessageSquare className="w-4 h-4" />, label: "Ask",     color: "violet" },
                  { icon: <Shield className="w-4 h-4" />,        label: "Trust",   color: "amber" },
                  { icon: <EyeOff className="w-4 h-4" />,        label: "Redact",  color: "red" },
                ].map((t, i) => (
                  <button key={i} className={`flex flex-col items-center gap-1 py-3 rounded-xl border ${TOOL_COLORS[t.color]} bg-opacity-5 hover:bg-opacity-10 transition-all`}>
                    {t.icon}
                    <span className="text-[9px] font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Document tab (preview — shown behind) */}
      {activeTab === "document" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 flex flex-col gap-2">
            <DocPage pg={1} />
            <DocPage pg={8} />
            <DocPage pg={11} active />
            <DocPage pg={12} />
            <div className="h-8 flex items-center justify-between mt-1">
              <span className="text-white/20 text-[10px]">Page 11 of 14</span>
              <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-violet-600/15 border border-violet-500/25 text-violet-300 text-[10px] font-medium">
                <ArrowRight className="w-3 h-3" />
                Back to Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom safe area */}
      <div className="h-7 shrink-0" />
    </div>
  );
}
