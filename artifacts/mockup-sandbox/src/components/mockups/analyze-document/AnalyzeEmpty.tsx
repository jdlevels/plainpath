import { FileText, Upload, ShieldCheck, Zap, ChevronRight, Clock, CheckCircle2, AlertCircle, RotateCcw, Sparkles, Scale, Briefcase, Home } from "lucide-react";

const RECENT = [
  { name: "Service Agreement — Notion Inc.pdf", type: "Contract", lastAction: "Analysis complete", status: "complete", statusLabel: "Reviewed", date: "Today" },
  { name: "Employment Offer — Jane Doe.pdf",     type: "HR",       lastAction: "Missing items flagged", status: "needs-action", statusLabel: "Action needed", date: "Yesterday" },
  { name: "Vendor NDA — Stripe Inc.pdf",         type: "NDA",      lastAction: "Risks identified",     status: "in-progress",   statusLabel: "In progress",   date: "Apr 21" },
  { name: "Lease Agreement — 42 Oak St.pdf",     type: "Lease",    lastAction: "Not yet analyzed",      status: "new",           statusLabel: "New",           date: "Apr 19" },
];

const USE_CASES = [
  { icon: <Scale className="w-4 h-4 text-violet-400" />,  label: "Contracts & NDAs",        desc: "Spot auto-renewal traps, liability gaps, unusual terms" },
  { icon: <Briefcase className="w-4 h-4 text-sky-400" />, label: "Employment Offers",       desc: "Understand equity, non-competes, and vesting schedules" },
  { icon: <Home className="w-4 h-4 text-emerald-400" />,  label: "Leases & Agreements",     desc: "Find hidden fees, maintenance obligations, exit clauses" },
  { icon: <FileText className="w-4 h-4 text-amber-400" />,label: "Legal Notices & Filings", desc: "Decode what's required of you and by when" },
];

function StatusBadge({ status, label }: { status: string; label: string }) {
  const variants: Record<string, string> = {
    "needs-action": "bg-red-500/10 border-red-500/25 text-red-300",
    "in-progress":  "bg-amber-500/10 border-amber-500/25 text-amber-300",
    "complete":     "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
    "new":          "bg-white/[0.05] border-white/10 text-white/35",
  };
  const icons: Record<string, React.ReactNode> = {
    "needs-action": <AlertCircle className="w-2.5 h-2.5" />,
    "in-progress":  <Clock className="w-2.5 h-2.5" />,
    "complete":     <CheckCircle2 className="w-2.5 h-2.5" />,
    "new":          null,
  };
  return (
    <div className={`h-5 px-2 rounded-full border flex items-center gap-1 shrink-0 ${variants[status]}`}>
      {icons[status]}
      <span className="text-[9px] font-medium whitespace-nowrap">{label}</span>
    </div>
  );
}

export function AnalyzeEmpty() {
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
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-10 flex flex-col items-center">
        {/* Header */}
        <div className="w-full max-w-lg text-center mb-8">
          <div className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full border border-violet-500/25 bg-violet-600/10 mb-4">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-violet-300 text-[10px] font-medium">AI-powered analysis</span>
          </div>
          <h1 className="text-white text-xl font-semibold tracking-tight mb-2">Understand any document in seconds</h1>
          <p className="text-white/35 text-sm leading-relaxed max-w-sm mx-auto">
            Drop a PDF or DOCX and PlainPath will extract risks, deadlines, obligations, and missing items — with sources.
          </p>
        </div>

        {/* Upload zone */}
        <div className="w-full max-w-lg mb-8">
          <div className="relative rounded-2xl border-2 border-dashed border-white/[0.10] bg-white/[0.015] hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all duration-200 cursor-pointer group p-10 flex flex-col items-center text-center">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(139,92,246,0.07) 0%, transparent 70%)" }} />
            <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-white text-base font-semibold mb-1.5">Drop your document here</h2>
            <p className="text-white/35 text-sm mb-5 max-w-xs leading-relaxed">
              PlainPath will explain what it means, flag what's risky, and tell you exactly what to do next.
            </p>
            <div className="h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Choose file
            </div>
            <p className="text-white/20 text-xs mt-3">PDF, DOCX, TXT · Up to 50 MB</p>
          </div>
          <div className="mt-3.5 flex items-center justify-center gap-6">
            {[
              { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, label: "End-to-end encrypted" },
              { icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, label: "Full analysis in ~15 sec" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {item.icon}
                <span className="text-white/30 text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What it works with */}
        <div className="w-full max-w-lg mb-10">
          <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-3">Works well with</p>
          <div className="grid grid-cols-2 gap-2">
            {USE_CASES.map((uc, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                <div className="mt-0.5 shrink-0">{uc.icon}</div>
                <div>
                  <p className="text-white/70 text-xs font-medium leading-none mb-1">{uc.label}</p>
                  <p className="text-white/28 text-[10px] leading-relaxed">{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent analyses */}
        <div className="w-full max-w-lg">
          <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-3">Recent analyses</p>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {RECENT.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.025] transition-colors group cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-white/35" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white/70 text-sm truncate group-hover:text-white/85 transition-colors font-medium">{doc.name}</p>
                    <div className="h-4 px-1.5 rounded bg-white/[0.05] border border-white/[0.07] shrink-0">
                      <span className="text-white/30 text-[9px]">{doc.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/25 text-[10px]">{doc.lastAction}</span>
                    <span className="text-white/15 text-[10px]">·</span>
                    <span className="text-white/20 text-[10px]">{doc.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={doc.status} label={doc.statusLabel} />
                  <button className="h-7 w-7 rounded-lg border border-white/[0.07] flex items-center justify-center text-white/25 hover:text-white/55 hover:border-white/20 transition-colors opacity-0 group-hover:opacity-100">
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/35 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
