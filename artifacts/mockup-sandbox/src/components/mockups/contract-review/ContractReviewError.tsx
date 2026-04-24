import {
  FileText, AlertCircle, RotateCcw, Upload, MessageSquare, Layers, ChevronRight
} from "lucide-react";

export function ContractReviewError() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/15 text-[10px] mx-0.5">·</span>
        <span className="text-white/28 text-xs">Contract Review</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-white/[0.03] border-white/[0.09] text-white/28">
            <AlertCircle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">Contract review could not be completed</span>
          </div>
        </div>
      </div>

      {/* Body — centered */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-6">
        <div className="w-full max-w-sm">

          {/* Error card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-5 text-center">
            <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-5 h-5 text-white/28" />
            </div>
            <h2 className="text-white/78 text-sm font-semibold mb-2">Contract review could not be completed.</h2>
            <p className="text-white/38 text-xs leading-relaxed mb-5">
              The file appears to be password-protected or encrypted. PlainPath needs readable contract text to identify obligations, risk indicators, and terms to verify.
            </p>

            {/* File card */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-5 text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-white/22" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/52 text-xs font-medium truncate">Service_Agreement_Protected.pdf</p>
                <p className="text-white/22 text-[10px]">Uploaded just now · Encrypted / protected</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Try again
              </button>
              <button className="flex-1 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] text-white/52 text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Different file
              </button>
            </div>
          </div>

          {/* Alternatives */}
          <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold text-center mb-2.5">What you can try instead</p>
          <div className="flex flex-col gap-1.5">
            {[
              { icon: Upload,        label: "Upload an unprotected version",        desc: "Remove the password or export an unlocked copy, then re-upload." },
              { icon: MessageSquare, label: "Ask This Document",                    desc: "Ask targeted questions — works on some protected files." },
              { icon: Layers,        label: "Analyze a Document",                   desc: "Full plain-English analysis once the file is readable." },
            ].map((item,i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-all">
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-white/28" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/52 text-xs font-medium">{item.label}</p>
                  <p className="text-white/24 text-[10px] leading-tight">{item.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/16 shrink-0" />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
