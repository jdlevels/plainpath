import { FileText, Upload, ShieldCheck, Zap, ChevronRight } from "lucide-react";

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
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-violet-600/15 border border-violet-500/25 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-violet-300 text-[10px] font-medium">Pro</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        {/* Upload zone */}
        <div className="w-full max-w-xl">
          <div
            className="relative rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.02] hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all duration-200 cursor-pointer group p-12 flex flex-col items-center text-center"
          >
            {/* Glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />

            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-5">
              <Upload className="w-7 h-7 text-violet-400" />
            </div>

            <h2 className="text-white text-lg font-semibold mb-2">Drop your document here</h2>
            <p className="text-white/40 text-sm mb-6 leading-relaxed max-w-xs">
              PlainPath will read it, extract key information, and build you a complete overview in seconds.
            </p>

            <div className="h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Choose file
            </div>

            <p className="text-white/25 text-xs mt-4">PDF, DOCX, TXT · Up to 50 MB</p>
          </div>

          {/* Trust signals */}
          <div className="mt-4 flex items-center justify-center gap-6">
            {[
              { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, label: "End-to-end encrypted" },
              { icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, label: "Results in ~10 sec" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {item.icon}
                <span className="text-white/35 text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent docs */}
        <div className="w-full max-w-xl mt-12">
          <p className="text-white/30 text-xs uppercase tracking-widest font-medium mb-3">Recent documents</p>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
            {[
              { name: "Consulting Agreement — Acme Corp.pdf", date: "Today", type: "Contract" },
              { name: "Vendor NDA — Stripe Inc.pdf", date: "Yesterday", type: "NDA" },
              { name: "Employment Agreement — Jane Doe.pdf", date: "Apr 20", type: "HR" },
            ].map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-sm truncate group-hover:text-white/90 transition-colors">{doc.name}</p>
                  <p className="text-white/25 text-xs">{doc.date}</p>
                </div>
                <div className="h-5 px-2 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center">
                  <span className="text-white/35 text-[10px]">{doc.type}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
