import { FileText, AlertCircle, RefreshCcw, Upload, MessageSquare, LayoutDashboard, Lock } from "lucide-react";

export function CompareVersionsError() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <span className="text-white/15 text-xs mx-0.5">›</span>
        <span className="text-white/40 text-xs">Compare Versions</span>
      </div>

      {/* Centered error state */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">

          {/* Error icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/18 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400/75" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-[18px] font-bold text-white/88 mb-2">Version comparison could not be completed.</h2>
          <p className="text-center text-[12px] text-white/38 leading-relaxed mb-6">One or both files could not be processed. This may be due to encryption, an unsupported format, or an upload issue.</p>

          {/* File pair (one failed) */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 mb-5">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/22 mb-3">Files uploaded</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-500/12 border border-red-500/18 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5 text-red-400/65" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white/62 truncate">Contract_v1_PROTECTED.pdf</p>
                  <p className="text-[10px] text-red-300/55">Encrypted or password-protected — could not read</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/18 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-emerald-400/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white/62 truncate">Contract_v2.pdf</p>
                  <p className="text-[10px] text-emerald-300/50">Readable — no issues found</p>
                </div>
              </div>
            </div>
          </div>

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <button className="h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors">
              <RefreshCcw className="w-3.5 h-3.5" /> Try again
            </button>
            <button className="h-10 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-white/65 text-[12px] font-medium flex items-center justify-center gap-2 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Upload different files
            </button>
          </div>

          {/* What you can try instead */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/22 mb-3">What you can try instead</p>
            <div className="space-y-1">
              {[
                { icon:<Lock className="w-3.5 h-3.5" />,           t:"Remove password protection from the original",  d:"Open in your PDF viewer, remove the password, re-export, and re-upload." },
                { icon:<FileText className="w-3.5 h-3.5" />,       t:"Use a text-based version",                      d:"A digital PDF (not a scan) will work more reliably." },
                { icon:<MessageSquare className="w-3.5 h-3.5" />,  t:"Ask This Document about the revised version",   d:"Ask specific questions about the version you can open." },
                { icon:<LayoutDashboard className="w-3.5 h-3.5" />,t:"Analyze a Document",                            d:"Extract key terms and clauses from a single document instead." },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.03] cursor-pointer group">
                  <div className="text-white/20 group-hover:text-white/40 mt-0.5 shrink-0">{a.icon}</div>
                  <div>
                    <p className="text-[11px] text-white/52 font-medium group-hover:text-white/70">{a.t}</p>
                    <p className="text-[10px] text-white/28 mt-0.5 leading-snug">{a.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
