import { FileText, AlertCircle, RotateCcw, Upload, MessageSquare, Shield, FileSearch, ChevronRight } from "lucide-react";

const ERROR_REASONS = [
  { code: "ENCRYPTED_PDF",      msg: "Encrypted or password-protected document",  hint: "Remove the password and re-upload, or use the 'Ask This Document' tool for basic queries." },
  { code: "CORRUPT_FILE",       msg: "File appears to be damaged or incomplete",   hint: "Try re-downloading the original and upload again." },
  { code: "UNSUPPORTED_FORMAT", msg: "File format not supported",                  hint: "PlainPath supports PDF, DOCX, and TXT files." },
];

const ACTIVE = ERROR_REASONS[0];

const SUGGESTIONS = [
  { icon: <Upload className="w-3.5 h-3.5" />,        label: "Upload a different version",      desc: "Try the original unencrypted file",        color: "violet" },
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document",               desc: "Works on some encrypted files",             color: "blue" },
  { icon: <Shield className="w-3.5 h-3.5" />,        label: "Trust Check",                     desc: "Verify authenticity without full analysis", color: "amber" },
];

const TOOL_COLORS: Record<string, string> = {
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  blue:   "text-blue-400   bg-blue-600/10   border-blue-500/20",
  amber:  "text-amber-400  bg-amber-600/10  border-amber-500/20",
};

export function AnalyzeError() {
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
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-red-600/12 border border-red-500/25 flex items-center gap-1.5">
            <AlertCircle className="w-2.5 h-2.5 text-red-400" />
            <span className="text-red-300 text-[10px] font-medium">Analysis failed</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">

          {/* Error card */}
          <div className="rounded-2xl border border-red-500/20 bg-red-600/[0.05] p-7 flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/25 flex items-center justify-center mb-5">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>

            <h2 className="text-white/90 text-base font-semibold mb-2">Analysis couldn't complete</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-5 max-w-sm">
              {ACTIVE.msg}. {ACTIVE.hint}
            </p>

            <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-5 text-left">
              <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">File that failed</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-sm font-medium truncate">Confidential Agreement — Encrypted.pdf</p>
                  <p className="text-white/25 text-[10px]">2.4 MB · Uploaded just now</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button className="flex-1 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
                Try again
              </button>
              <button className="flex-1 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-white/50 text-sm flex items-center justify-center gap-2 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload different file
              </button>
            </div>
          </div>

          {/* What to try instead */}
          <div>
            <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-3">What you can try instead</p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${TOOL_COLORS[s.color]}`}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm font-medium leading-none mb-0.5">{s.label}</p>
                    <p className="text-white/30 text-[11px]">{s.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/35 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Support note */}
          <p className="text-white/20 text-[11px] text-center mt-6 leading-relaxed">
            If this keeps happening, <span className="text-violet-400/60 cursor-pointer hover:text-violet-400/80">contact support</span> — we'll look into it.
          </p>
        </div>
      </div>
    </div>
  );
}
