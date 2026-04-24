import { FileText, Upload, ShieldCheck, Zap, ChevronRight, Clock, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

const RECENT = [
  {
    name: "NDA — Stripe Inc.pdf",
    type: "NDA",
    lastAction: "Reviewed summary",
    status: "needs-action",
    statusLabel: "Renewal due Oct 17",
    date: "2h ago",
  },
  {
    name: "Consulting Agreement — Acme Corp.pdf",
    type: "Contract",
    lastAction: "Asked 4 questions",
    status: "in-progress",
    statusLabel: "In progress",
    date: "Yesterday",
  },
  {
    name: "Employment Offer — Jane Doe.pdf",
    type: "HR",
    lastAction: "Overview generated",
    status: "complete",
    statusLabel: "Complete",
    date: "Apr 20",
  },
  {
    name: "Vendor Agreement — Notion Inc.pdf",
    type: "Contract",
    lastAction: "Not yet opened",
    status: "new",
    statusLabel: "New",
    date: "Apr 18",
  },
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

export function OverviewEmpty() {
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
        <span className="text-white/35 text-xs">Document Overview</span>
      </div>

      <div className="flex-1 flex flex-col items-center px-8 py-10">
        {/* Upload zone */}
        <div className="w-full max-w-lg">
          <div className="relative rounded-2xl border-2 border-dashed border-white/[0.10] bg-white/[0.015] hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all duration-200 cursor-pointer group p-10 flex flex-col items-center text-center">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(139,92,246,0.07) 0%, transparent 70%)" }} />
            <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-white text-base font-semibold mb-1.5">Drop your document here</h2>
            <p className="text-white/35 text-sm mb-5 max-w-xs leading-relaxed">
              PlainPath will read it, surface risks, dates, and obligations, and guide you to the right next action.
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
              { icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, label: "Overview in ~10 sec" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {item.icon}
                <span className="text-white/30 text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent documents */}
        <div className="w-full max-w-lg mt-10">
          <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-3">Recent documents</p>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {RECENT.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.025] transition-colors group">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-white/35" />
                </div>

                {/* Info */}
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

                {/* Status + reopen */}
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
