import {
  FileText, AlertTriangle, Calendar, ChevronRight, MessageSquare,
  ArrowRight, ArrowLeft, Shield, EyeOff, CheckCircle2, FileSearch, X
} from "lucide-react";

function Chip({ page, section, active }: { page: number; section?: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 h-4 px-1.5 rounded text-[9px] font-mono font-medium ${
      active
        ? "bg-violet-500/30 border border-violet-400/50 text-violet-200"
        : "bg-violet-600/12 border border-violet-500/18 text-violet-300/80"
    }`}>
      p.{page}{section ? ` · ${section}` : ""}
    </span>
  );
}

const RISKS = [
  { level: "critical", text: "Unlimited liability — no cap on damages.",            page: 11, section: "§ 12.1", active: true },
  { level: "high",     text: "Auto-renewal — 90-day written notice required.",       page: 8,  section: "§ 7.2" },
  { level: "medium",   text: "Broad IP assignment — all work belongs to client.",    page: 6,  section: "§ 6.0" },
];

const NEXT_STEPS = [
  { action: "Review liability clause",    icon: <FileSearch className="w-3.5 h-3.5" />,  color: "red",    urgent: true  },
  { action: "Set Oct 17 renewal alert",   icon: <Calendar className="w-3.5 h-3.5" />,    color: "amber",  urgent: true  },
  { action: "Ask about IP assignment",    icon: <MessageSquare className="w-3.5 h-3.5" />, color: "violet", urgent: false },
];

const TOOL_COLORS: Record<string, string> = {
  red:    "text-red-400    bg-red-600/10    border-red-500/20",
  amber:  "text-amber-400  bg-amber-600/10  border-amber-500/20",
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
};

// Active tab is "analysis" (default on mobile — answers first)
const activeTab = "analysis";

export function AnalyzeMobile() {
  return (
    <div className="w-[390px] h-[844px] bg-[#0c0c0f] flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Status bar */}
      <div className="h-10 flex items-center justify-between px-5 shrink-0">
        <span className="text-white/50 text-[11px] font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 rounded-sm border border-white/30 relative overflow-hidden">
            <div className="absolute inset-y-0.5 left-0.5 right-[30%] bg-white/50 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="h-11 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="text-white/88 text-sm font-semibold tracking-tight">PlainPath</span>
        </div>
        <span className="text-white/25 text-[10px] mx-1">·</span>
        <span className="text-white/32 text-xs">Analyze a Document</span>
        <div className="ml-auto">
          <div className="h-6 px-2 rounded-full bg-emerald-600/12 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-300 text-[10px] font-medium">91%</span>
          </div>
        </div>
      </div>

      {/* File strip */}
      <div className="h-9 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
        <FileText className="w-3 h-3 text-violet-400/55 shrink-0" />
        <span className="text-white/38 text-xs flex-1 truncate">Consulting Agreement — Acme Corp.pdf</span>
        <span className="text-white/18 text-[10px]">14 pp.</span>
      </div>

      {/* Tab bar — Analysis default on mobile */}
      <div className="h-10 border-b border-white/[0.06] flex shrink-0">
        {[
          { id: "analysis", label: "Analysis",  active: true },
          { id: "document", label: "Document",  active: false },
        ].map((tab) => (
          <button key={tab.id} className={`flex-1 text-sm font-medium relative transition-colors ${
            tab.active ? "text-white/90" : "text-white/28"
          }`}>
            {tab.label}
            {tab.active && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-violet-500" />
            )}
          </button>
        ))}
      </div>

      {/* Source jump banner */}
      <div className="mx-3 mt-2.5 mb-0.5 shrink-0 rounded-lg border border-violet-500/25 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-violet-200/80 text-[10px] font-medium truncate">Viewing source — p.11 · § 12.1</p>
        </div>
        <button className="flex items-center gap-1 text-violet-400/60 text-[9px] shrink-0 hover:text-violet-300 transition-colors">
          <ArrowLeft className="w-2.5 h-2.5" />
          Doc
        </button>
        <button className="text-white/20 hover:text-white/40 shrink-0 ml-1">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Analysis panel content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-3 flex flex-col gap-3">

          {/* Summary */}
          <div className="rounded-xl border border-violet-500/15 bg-violet-600/[0.05] p-3.5">
            <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold mb-2">Plain-English Summary</p>
            <p className="text-white/65 text-[11px] leading-[1.7]">
              Acme will consult for Stripe for <strong className="text-white/85 font-semibold">12 months</strong>, paid{" "}
              <strong className="text-white/85 font-semibold">Net 30</strong>. Contract{" "}
              <strong className="text-white/85 font-semibold">auto-renews</strong> unless cancelled by{" "}
              <strong className="text-amber-300 font-semibold">Oct 17</strong>. All work belongs to Stripe.{" "}
              The <strong className="text-red-300 font-semibold">liability clause has no cap</strong> — review before signing.
            </p>
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <Chip page={1} />
              <Chip page={8} section="§ 7.2" />
              <Chip page={11} section="§ 12.1" active />
            </div>
          </div>

          {/* Required next steps */}
          <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{
            background: "linear-gradient(140deg, rgba(109,40,217,0.09) 0%, rgba(12,12,15,0) 60%)"
          }}>
            <div className="px-3.5 pt-3.5 pb-2.5 border-b border-white/[0.07] flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <p className="text-white/85 text-sm font-semibold flex-1">Required Next Steps</p>
              <div className="h-4 px-1.5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center">
                <span className="text-red-300/90 text-[8px] font-medium">2 urgent</span>
              </div>
            </div>
            <div className="p-2.5 flex flex-col gap-1.5">
              {NEXT_STEPS.map((a, i) => (
                <div key={i} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 border cursor-pointer hover:bg-white/[0.03] ${
                  a.urgent ? "border-white/[0.10] bg-white/[0.022]" : "border-white/[0.06]"
                }`}>
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${TOOL_COLORS[a.color]}`}>
                    {a.icon}
                  </div>
                  <p className={`text-[11px] font-medium flex-1 ${a.urgent ? "text-white/80" : "text-white/42"}`}>{a.action}</p>
                  {a.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                  <ChevronRight className="w-3 h-3 text-white/15 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3 h-3 text-amber-400/60" />
              <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold">Risks & Watchouts</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {RISKS.map((r, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg px-2.5 py-2 border ${
                  r.level === "critical" ? "border-red-500/20 bg-red-500/[0.04]" :
                  r.level === "high"     ? "border-red-500/12 bg-red-500/[0.02]" :
                  "border-amber-500/10   bg-amber-500/[0.02]"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-[4px] shrink-0 ${
                    r.level === "critical" || r.level === "high" ? "bg-red-400" : "bg-amber-400"
                  }`} />
                  <p className="text-white/52 text-[10px] leading-relaxed flex-1">{r.text}</p>
                  <Chip page={r.page} section={r.section} active={r.active} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick follow-up tools */}
          <div>
            <p className="text-white/18 text-[9px] uppercase tracking-widest font-semibold mb-2">Follow-up Tools</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { icon: <MessageSquare className="w-4 h-4" />, label: "Ask",    color: "violet" },
                { icon: <Shield className="w-4 h-4" />,        label: "Trust",  color: "amber"  },
                { icon: <EyeOff className="w-4 h-4" />,        label: "Redact", color: "red"    },
              ].map((t, i) => (
                <button key={i} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${TOOL_COLORS[t.color]}`}>
                  {t.icon}
                  <span className="text-[9px] font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* View source doc hint */}
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] hover:bg-white/[0.03] transition-colors text-white/35 text-xs">
            <FileText className="w-3.5 h-3.5" />
            View document source
            <ArrowLeft className="w-3 h-3 rotate-180" />
          </button>

        </div>
      </div>

      {/* Bottom safe area */}
      <div className="h-6 shrink-0" />
    </div>
  );
}
