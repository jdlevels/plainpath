import { FileText, AlertCircle, RefreshCw, Upload, MessageSquare, LayoutDashboard } from "lucide-react";

export function CompareVersionsError() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Compare Versions</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-white/30" />
            <span className="text-[11px] text-white/40 font-medium">Comparison could not be completed</span>
          </div>
        </div>
      </div>

      {/* Centered error content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Error card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center mb-4">
            <div className="w-14 h-14 rounded-full border border-white/[0.08] bg-white/[0.04] flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-6 h-6 text-white/30" />
            </div>
            <h2 className="text-lg font-bold text-white/82 tracking-tight mb-2">Version comparison could not be completed.</h2>
            <p className="text-sm text-white/38 leading-relaxed mb-6">
              One or both files appear to be password-protected or encrypted. PlainPath needs readable document text to align sections and identify changes.
            </p>

            {/* Affected files */}
            <div className="space-y-2 mb-6">
              <div className="rounded-xl border border-red-500/18 bg-red-500/[0.04] p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-white/30" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] text-white/52 font-medium truncate">Contract_v1_final.pdf</p>
                  <p className="text-[10px] text-red-300/50 mt-0.5">Uploaded just now · Encrypted / protected</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-white/25" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] text-white/45 font-medium truncate">Contract_v2_revised.pdf</p>
                  <p className="text-[10px] text-white/25 mt-0.5">Uploaded just now · Readable</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button className="h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Try again
              </button>
              <button className="h-9 px-4 rounded-lg border border-white/[0.1] text-white/50 text-sm font-medium flex items-center gap-2 hover:bg-white/[0.04] transition-colors">
                <Upload className="w-3.5 h-3.5" /> Different files
              </button>
            </div>
          </div>

          {/* What to try instead */}
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/20 text-center mb-3">WHAT YOU CAN TRY INSTEAD</p>
          <div className="space-y-2">
            {[
              { icon: <Upload className="w-3.5 h-3.5 text-white/32" />,           label: "Upload unprotected versions",  desc: "Remove passwords or export unlocked copies, then re-upload." },
              { icon: <MessageSquare className="w-3.5 h-3.5 text-white/32" />,    label: "Ask This Document",            desc: "Ask targeted questions — works on some protected files." },
              { icon: <LayoutDashboard className="w-3.5 h-3.5 text-white/32" />,  label: "Analyze a Document",           desc: "Plain-English analysis once the file is readable." },
            ].map((item, i) => (
              <button key={i} className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-3 flex items-center gap-3 text-left">
                {item.icon}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/50">{item.label}</p>
                  <p className="text-[10px] text-white/28 leading-snug mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
