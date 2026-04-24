import { FileText, AlertTriangle, Calendar, MessageSquare, ChevronRight, CheckCircle2, Shield, Clock, EyeOff, Search, FileSearch, GitCompare, Bookmark, ArrowLeft, ArrowRight } from "lucide-react";

function Tab({ label, active, badge }: { label: string; active?: boolean; badge?: number }) {
  return (
    <button className={`flex-1 h-9 flex items-center justify-center gap-1 text-xs font-medium transition-colors rounded-lg relative ${
      active ? "bg-violet-600 text-white" : "text-white/35"
    }`}>
      {label}
      {badge && (
        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{badge}</span>
      )}
    </button>
  );
}

function Chip({ page, section, active }: { page: number; section?: string; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center h-4 px-1.5 rounded text-[9px] font-medium cursor-pointer transition-all ${
        active
          ? "bg-violet-500/30 border border-violet-400/50 text-violet-200"
          : "bg-violet-600/15 border border-violet-500/20 text-violet-300"
      }`}
    >
      p.{page}{section ? ` · ${section}` : ""}
    </span>
  );
}

const TOOLS = [
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document", color: "text-violet-400 bg-violet-600/10 border-violet-500/20" },
  { icon: <Search className="w-3.5 h-3.5" />,        label: "Trust Check",        color: "text-amber-400 bg-amber-600/10 border-amber-500/20" },
  { icon: <FileSearch className="w-3.5 h-3.5" />,    label: "Contract Review",    color: "text-blue-400 bg-blue-600/10 border-blue-500/20" },
  { icon: <Bookmark className="w-3.5 h-3.5" />,      label: "Clause Extractor",   color: "text-emerald-400 bg-emerald-600/10 border-emerald-500/20" },
  { icon: <GitCompare className="w-3.5 h-3.5" />,    label: "Compare Versions",   color: "text-sky-400 bg-sky-600/10 border-sky-500/20" },
  { icon: <EyeOff className="w-3.5 h-3.5" />,        label: "Redact",             color: "text-red-400 bg-red-600/10 border-red-500/20" },
];

// ── Source-jump "Document View" overlay state ──────────────────
function SourceView() {
  return (
    <div className="absolute inset-0 bg-[#0e0e12] flex flex-col z-10">
      {/* Return bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <button className="flex items-center gap-1.5 text-white/55 hover:text-white/80 text-xs transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </button>
        <div className="ml-auto h-5 px-2 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-violet-400" />
          <span className="text-violet-300/80 text-[9px]">Viewing source · p.8 · § 7.2</span>
        </div>
      </div>
      {/* Source page */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-xl border border-violet-500/35 bg-violet-500/[0.04] ring-1 ring-violet-500/15 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-violet-300/60 text-[9px] font-medium">PAGE 8 — § 7.2 AUTO-RENEWAL</span>
            <Chip page={8} section="§ 7.2" active />
          </div>
          {/* Highlighted clause line */}
          <div className="rounded-md bg-violet-500/[0.10] border border-violet-500/20 px-2.5 py-2">
            <p className="text-white/75 text-xs leading-relaxed">
              "This Agreement shall automatically renew for successive one-year terms unless either party provides written notice of non-renewal at least ninety (90) days prior to the end of the then-current term."
            </p>
          </div>
          <div className="flex flex-col gap-1.5 opacity-50">
            {[88, 72, 80, 65].map((w, i) => (
              <div key={i} className="h-[7px] rounded-sm bg-white/[0.08]" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        {/* Other pages, dimmed */}
        <div className="mt-3 rounded-lg border border-white/[0.04] p-3 opacity-30 flex flex-col gap-1.5">
          <span className="text-white/20 text-[9px]">Page 9</span>
          {[80, 65, 72, 55].map((w, i) => (
            <div key={i} className="h-[7px] rounded-sm bg-white/[0.08]" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      {/* Bottom return pill */}
      <div className="px-4 pb-5 pt-3 border-t border-white/[0.06]">
        <button className="w-full h-10 rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-violet-600/25 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Return to Overview
        </button>
      </div>
    </div>
  );
}

export function OverviewMobile() {
  return (
    <div className="w-[390px] min-h-screen bg-[#0c0c0f] flex flex-col relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Simulated source-jump overlay — shown for design preview */}
      {/* Remove the comment below to show the source-jump state */}
      {/* <SourceView /> */}

      {/* Status bar */}
      <div className="h-10 flex items-center justify-between px-5 shrink-0">
        <span className="text-white/40 text-[11px] font-medium">9:41</span>
        <div className="w-5 h-2.5 rounded-sm border border-white/25 relative overflow-hidden">
          <div className="absolute inset-0.5 left-0.5 right-1 bg-white/55 rounded-sm" />
        </div>
      </div>

      {/* App header */}
      <div className="px-4 pb-3 flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/85 text-sm font-semibold leading-none truncate">NDA — Stripe Inc.</p>
          <p className="text-white/28 text-[10px] mt-0.5">12 pages · January 2025</p>
        </div>
        <div className="h-6 px-2 rounded-full bg-emerald-600/12 border border-emerald-500/20 flex items-center gap-1 shrink-0">
          <Shield className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-emerald-300 text-[10px] font-medium">94%</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-3.5 shrink-0">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <Tab label="Overview" active />
          <Tab label="Document" />
          <Tab label="Ask" />
          <Tab label="Tools" />
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-10">

        {/* Summary card */}
        <div className="rounded-2xl border border-violet-500/15 bg-violet-600/[0.05] p-4">
          <p className="text-violet-400/60 text-[10px] uppercase tracking-widest font-semibold mb-2">Plain-English Summary</p>
          <p className="text-white/68 text-sm leading-relaxed">
            A mutual NDA between Acme Consulting and Stripe.{" "}
            <strong className="text-white/88">Auto-renews annually</strong> — send{" "}
            <strong className="text-white/88">90-day written notice</strong> to cancel. Confidentiality survives for 3 years.
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <Chip page={1} />
            <Chip page={3} section="§ 3.1" />
            <button className="inline-flex">
              <Chip page={8} section="§ 7.2" active />
            </button>
          </div>
          <p className="text-violet-400/40 text-[10px] mt-1.5">Tap a citation to jump to source →</p>
        </div>

        {/* Source-jump preview chip */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-600/[0.06] px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/65 text-xs font-medium">Viewing source: Auto-renewal · p.8</p>
            <p className="text-violet-300/50 text-[10px]">Tap to return to overview</p>
          </div>
          <button className="h-6 px-2 rounded-lg border border-violet-500/25 bg-violet-600/10 text-violet-300 text-[10px] flex items-center gap-1 shrink-0">
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>
        </div>

        {/* Urgent action */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300/90 text-xs font-semibold mb-1">Action required</p>
              <p className="text-white/55 text-xs leading-relaxed">
                Renewal deadline is <strong className="text-amber-300">Oct 17, 2025</strong>. Send written notice 90 days prior if you don't want to auto-renew.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Chip page={8} section="§ 7.2" active />
              </div>
            </div>
          </div>
        </div>

        {/* Recommended next action — hero */}
        <div className="rounded-2xl border border-white/[0.10] overflow-hidden" style={{
          background: "linear-gradient(135deg, rgba(109,40,217,0.08) 0%, rgba(15,15,17,0) 70%)"
        }}>
          <div className="px-4 pt-3.5 pb-2.5 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
              <p className="text-white/80 text-sm font-semibold">Recommended Next</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4.5 h-4.5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-sm font-medium">Ask about the renewal clause</p>
              <p className="text-white/30 text-[10px] leading-relaxed">Get exact details on deadline and notice requirements.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-violet-400/50 shrink-0" />
          </div>
        </div>

        {/* Key dates */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <p className="text-white/28 text-[10px] uppercase tracking-widest font-semibold">Key Dates</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Effective Date",   value: "Jan 15, 2025",   page: 1,  urgent: false },
              { label: "Renewal Deadline", value: "Oct 17, 2025",   page: 8, section: "§ 7.2",  urgent: true },
              { label: "Payment Terms",    value: "Net 30 days",    page: 5,  urgent: false },
            ].map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-white/28 text-[10px]">{d.label}</p>
                  <p className={`text-xs font-medium ${d.urgent ? "text-amber-300" : "text-white/65"}`}>{d.value}</p>
                </div>
                <Chip page={d.page} section={(d as any).section} />
              </div>
            ))}
          </div>
        </div>

        {/* Next steps */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-white/28 text-[10px] uppercase tracking-widest font-semibold">Next Steps</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { text: "Set reminder for Oct 17 renewal deadline", urgent: true },
              { text: "Review unlimited liability clause with legal" },
              { text: "Verify insurance certificate ≥ $2M" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${s.urgent ? "bg-red-500/12 border border-red-500/25" : "border border-white/10"}`}>
                  {s.urgent ? <AlertTriangle className="w-2.5 h-2.5 text-red-400" /> : <CheckCircle2 className="w-2.5 h-2.5 text-white/18" />}
                </div>
                <p className={`text-xs leading-relaxed ${s.urgent ? "text-white/72" : "text-white/40"}`}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested question */}
        <button className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border border-violet-500/18 bg-violet-600/[0.04] text-left w-full">
          <MessageSquare className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="text-white/55 text-xs flex-1">"What happens if I miss the October deadline?"</span>
          <ChevronRight className="w-4 h-4 text-violet-400/40 shrink-0" />
        </button>

        {/* Tools */}
        <div>
          <p className="text-white/22 text-[10px] uppercase tracking-widest font-semibold mb-2">Tools</p>
          <div className="grid grid-cols-2 gap-2">
            {TOOLS.map((tool, i) => (
              <button key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] text-left">
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${tool.color}`}>
                  {tool.icon}
                </div>
                <span className="text-white/55 text-[10px] font-medium leading-tight">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
