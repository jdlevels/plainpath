import {
  ShieldCheck, AlertCircle, Upload, MessageSquare, FileScan,
  RotateCcw, FileText, ChevronRight
} from "lucide-react";

export function TrustCheckError() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Document Trust Check</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-white/[0.05] border-white/[0.10] text-white/45">
            <AlertCircle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">Trust check could not be completed</span>
          </div>
        </div>
      </div>

      {/* Centred error body */}
      <div className="flex-1 flex items-start justify-center pt-16 px-6">
        <div className="w-full max-w-md flex flex-col items-center gap-6">

          {/* Error card */}
          <div className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.02] p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.10] flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white/40" />
            </div>
            <div className="text-center">
              <h2 className="text-white/85 text-lg font-semibold mb-2">Trust check could not be completed.</h2>
              <p className="text-white/35 text-sm leading-relaxed">The document appears to be password-protected or encrypted. PlainPath needs readable text to check for trust signals.</p>
            </div>

            {/* File that failed */}
            <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold mb-2">File</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-white/22" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/55 text-sm truncate">ClearPoint_Agreement_Protected.pdf</p>
                  <p className="text-white/22 text-[10px]">2.8 MB · Uploaded just now · Encrypted</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 w-full">
              <button className="flex-1 h-9 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
                Try again
              </button>
              <button className="flex-1 h-9 rounded-lg border border-white/[0.10] bg-white/[0.03] text-white/50 text-sm hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload different file
              </button>
            </div>
          </div>

          {/* Try instead */}
          <div className="w-full">
            <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold mb-3 text-center">What you can try instead</p>
            <div className="flex flex-col gap-2">
              {[
                { icon: <Upload className="w-4 h-4" />, label: "Upload an unprotected version", desc: "Remove the password, then re-upload. This gives PlainPath access to run a full trust check.", color: "text-violet-400 bg-violet-600/8 border-violet-500/18" },
                { icon: <MessageSquare className="w-4 h-4" />, label: "Ask This Document", desc: "Ask targeted questions. Works on some protected files for basic information.", color: "text-sky-400 bg-sky-600/8 border-sky-500/18" },
                { icon: <FileScan className="w-4 h-4" />, label: "Analyze a Document", desc: "Get a full plain-English analysis once the file is readable.", color: "text-emerald-400 bg-emerald-600/8 border-emerald-500/18" },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-white/[0.07] bg-white/[0.015] cursor-pointer hover:bg-white/[0.025] transition-colors">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${a.color}`}>{a.icon}</div>
                  <div className="flex-1">
                    <p className="text-white/62 text-[12px] font-medium">{a.label}</p>
                    <p className="text-white/25 text-[10px] leading-relaxed mt-0.5">{a.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
