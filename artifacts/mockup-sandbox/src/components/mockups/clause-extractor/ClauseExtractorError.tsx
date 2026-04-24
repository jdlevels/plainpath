import { FileText, AlertCircle, Upload, MessageCircle, FileSearch, RotateCcw } from "lucide-react";

export function ClauseExtractorError() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <span className="text-white/15 text-xs mx-0.5">›</span>
        <span className="text-white/40 text-xs">Clause Extractor</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full border border-white/[0.08] flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-white/28" />
            <span className="text-[11px] text-white/35">Extraction could not be completed</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm w-full">

          {/* Error card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-6 h-6 text-white/30" />
            </div>
            <h2 className="text-base font-bold text-white/78 mb-2">Clause extraction could not be completed.</h2>
            <p className="text-xs text-white/38 leading-relaxed mb-6">
              The file appears to be password-protected or encrypted. PlainPath needs readable document text to identify and extract clauses, obligations, and terms.
            </p>

            {/* File chip */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] px-4 py-3 flex items-center gap-3 text-left mb-6">
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-white/28" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/52">Partnership_Agreement_Protected.pdf</p>
                <p className="text-[10px] text-white/28 mt-0.5">Uploaded just now · Encrypted / protected</p>
              </div>
            </div>

            {/* Primary actions */}
            <div className="flex gap-2.5">
              <button className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Try again
              </button>
              <button className="flex-1 border border-white/[0.1] text-white/50 text-xs font-medium py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Different file
              </button>
            </div>
          </div>

          {/* Alternative actions */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/20 font-semibold mb-3 text-center">WHAT YOU CAN TRY INSTEAD</p>
            <div className="space-y-2">
              {[
                { icon: <Upload className="w-3.5 h-3.5 text-white/35" />,      title: "Upload an unprotected version", desc: "Remove the password or export an unlocked copy, then re-upload." },
                { icon: <MessageCircle className="w-3.5 h-3.5 text-white/35" />,title: "Ask This Document",            desc: "Ask targeted questions — works on some protected files." },
                { icon: <FileSearch className="w-3.5 h-3.5 text-white/35" />,  title: "Analyze a Document",           desc: "Plain-English analysis once the file is readable." },
              ].map(opt => (
                <button key={opt.title} className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-4 py-3 flex items-center gap-3 text-left">
                  <span className="shrink-0">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white/55">{opt.title}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-white/18 mt-6">Clause extraction support — source-backed extracted terms, not legal advice.</p>
        </div>
      </div>
    </div>
  );
}
