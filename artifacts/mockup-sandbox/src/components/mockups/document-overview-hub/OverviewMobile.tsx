import { FileText, AlertTriangle, Calendar, MessageSquare, ChevronRight, CheckCircle2, Shield, BookOpen, Clock, EyeOff, Search, FileSearch, GitCompare, Bookmark } from "lucide-react";

function Tab({ label, active }: { label: string; active?: boolean }) {
  return (
    <button className={`flex-1 h-9 flex items-center justify-center text-xs font-medium transition-colors rounded-lg ${
      active ? "bg-violet-600 text-white" : "text-white/35 hover:text-white/55"
    }`}>
      {label}
    </button>
  );
}

function CitationChip({ page }: { page: number }) {
  return (
    <span className="inline-flex items-center h-4 px-1.5 rounded bg-violet-600/20 border border-violet-500/25 text-violet-300 text-[9px] font-medium">
      p.{page}
    </span>
  );
}

const TOOLS = [
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document", color: "text-violet-400", bg: "bg-violet-600/10 border-violet-500/20" },
  { icon: <Search className="w-3.5 h-3.5" />, label: "Trust Check", color: "text-amber-400", bg: "bg-amber-600/10 border-amber-500/20" },
  { icon: <FileSearch className="w-3.5 h-3.5" />, label: "Contract Review", color: "text-blue-400", bg: "bg-blue-600/10 border-blue-500/20" },
  { icon: <Bookmark className="w-3.5 h-3.5" />, label: "Clause Extractor", color: "text-emerald-400", bg: "bg-emerald-600/10 border-emerald-500/20" },
  { icon: <GitCompare className="w-3.5 h-3.5" />, label: "Compare Versions", color: "text-sky-400", bg: "bg-sky-600/10 border-sky-500/20" },
  { icon: <EyeOff className="w-3.5 h-3.5" />, label: "Redact Sensitive Info", color: "text-red-400", bg: "bg-red-600/10 border-red-500/20" },
];

export function OverviewMobile() {
  return (
    <div className="w-[390px] min-h-screen bg-[#0c0c0f] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Status bar simulation */}
      <div className="h-10 flex items-center justify-between px-5 shrink-0">
        <span className="text-white/40 text-[11px] font-medium">9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-sm border border-white/30 relative overflow-hidden">
            <div className="absolute inset-0.5 left-0.5 right-1 bg-white/60 rounded-sm" />
          </div>
        </div>
      </div>

      {/* App header */}
      <div className="px-4 pb-3 flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white/85 text-sm font-semibold leading-none">NDA — Stripe Inc.</p>
          <p className="text-white/30 text-[10px] mt-0.5">12 pages · January 2025</p>
        </div>
        <div className="h-6 px-2 rounded-full bg-emerald-600/12 border border-emerald-500/20 flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-emerald-300 text-[10px] font-medium">94%</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-3 shrink-0">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <Tab label="Overview" active />
          <Tab label="Document" />
          <Tab label="Ask" />
          <Tab label="Tools" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-8">

        {/* Summary card */}
        <div className="rounded-2xl border border-violet-500/15 bg-violet-600/[0.05] p-4">
          <p className="text-violet-400/70 text-[10px] uppercase tracking-widest font-semibold mb-2">Plain-English Summary</p>
          <p className="text-white/70 text-sm leading-relaxed">
            A mutual NDA between Acme Consulting and Stripe. <strong className="text-white/90">Auto-renews annually</strong> — you must give <strong className="text-white/90">90 days written notice</strong> to cancel. Confidentiality lasts 3 years post-termination.
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <CitationChip page={1} />
            <CitationChip page={3} />
            <CitationChip page={8} />
          </div>
        </div>

        {/* Urgent risk */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300/90 text-xs font-semibold mb-1">Action required</p>
              <p className="text-white/60 text-xs leading-relaxed">Auto-renewal deadline is <strong className="text-amber-300">Oct 17, 2025</strong>. You need to send written notice 90 days before if you don't want to renew.</p>
              <div className="mt-2">
                <CitationChip page={8} />
              </div>
            </div>
          </div>
        </div>

        {/* Key dates */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Key Dates</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Effective Date", value: "Jan 15, 2025", page: 1 },
              { label: "Renewal Deadline", value: "Oct 17, 2025", page: 8, urgent: true },
              { label: "Payment Terms", value: "Net 30 days", page: 5 },
            ].map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-white/35 text-[10px]">{d.label}</p>
                  <p className={`text-xs font-medium ${d.urgent ? "text-amber-300" : "text-white/70"}`}>{d.value}</p>
                </div>
                <CitationChip page={d.page} />
              </div>
            ))}
          </div>
        </div>

        {/* Next steps */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Next Steps</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { text: "Set reminder for Oct 17 renewal deadline", urgent: true },
              { text: "Review unlimited liability clause with legal" },
              { text: "Verify insurance certificate (≥ $2M)" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${s.urgent ? "bg-red-500/15 border border-red-500/25" : "border border-white/10"}`}>
                  {s.urgent ? <AlertTriangle className="w-2.5 h-2.5 text-red-400" /> : <CheckCircle2 className="w-2.5 h-2.5 text-white/20" />}
                </div>
                <p className={`text-xs leading-relaxed ${s.urgent ? "text-white/75" : "text-white/45"}`}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested question */}
        <button className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border border-violet-500/20 bg-violet-600/[0.04] hover:bg-violet-600/[0.08] transition-colors text-left w-full">
          <MessageSquare className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="text-white/60 text-xs flex-1">"What happens if I miss the October deadline?"</span>
          <ChevronRight className="w-4 h-4 text-violet-400/50 shrink-0" />
        </button>

        {/* Tools */}
        <div>
          <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Dig Deeper</p>
          <div className="grid grid-cols-2 gap-2">
            {TOOLS.map((tool, i) => (
              <button key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left">
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${tool.bg} ${tool.color}`}>
                  {tool.icon}
                </div>
                <span className="text-white/60 text-[10px] font-medium leading-tight">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
