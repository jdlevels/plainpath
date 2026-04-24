import {
  ShieldCheck, Upload, FileText, Mail, Camera, Link,
  Scale, Home, FileWarning, Info
} from "lucide-react";

const USE_CASES = [
  { icon: <FileText className="w-3.5 h-3.5 text-violet-400" />, label: "Invoices & payment requests", desc: "Look for suspicious senders, unusual payment methods, date gaps" },
  { icon: <Scale className="w-3.5 h-3.5 text-sky-400" />, label: "Contracts & agreements", desc: "Check party consistency, dates, and document structure" },
  { icon: <Mail className="w-3.5 h-3.5 text-amber-400" />, label: "Official notices & letters", desc: "Spot impersonation signals and formatting inconsistencies" },
  { icon: <Home className="w-3.5 h-3.5 text-emerald-400" />, label: "Court & government documents", desc: "Review structure, identifiers, and source signals" },
  { icon: <FileWarning className="w-3.5 h-3.5 text-orange-400" />, label: "Records & certificates", desc: "Look for missing fields, altered data, scan anomalies" },
  { icon: <Scale className="w-3.5 h-3.5 text-rose-400" />, label: "Forms & applications", desc: "Review completeness, formatting, and consistency" },
];

export function TrustCheckEmpty() {
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
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center">

        {/* Header */}
        <div className="w-full max-w-lg text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/12 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-6 h-6 text-violet-400" />
          </div>
          <h1 className="text-white text-xl font-semibold tracking-tight mb-2.5">
            Check whether a document can be trusted.
          </h1>
          <p className="text-white/35 text-sm leading-[1.7]">
            Upload a document. PlainPath checks for credibility signals, missing details, suspicious structure, conflicting information, and source-backed risk indicators.
          </p>
        </div>

        {/* Upload zone */}
        <div className="w-full max-w-lg mb-5">
          <div className="rounded-2xl border-2 border-dashed border-white/[0.10] bg-white/[0.02] hover:bg-white/[0.035] hover:border-white/[0.17] transition-all duration-200 cursor-pointer p-8 flex flex-col items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-violet-600/14 border border-violet-500/22 flex items-center justify-center">
              <Upload className="w-5 h-5 text-violet-400/80" />
            </div>
            <div className="text-center">
              <p className="text-white/70 text-sm font-medium mb-1">Drop your document here</p>
              <p className="text-white/28 text-xs">PlainPath checks for trust signals — not the meaning of the content</p>
            </div>
            <button className="h-8 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
              <Upload className="w-3 h-3" />
              Choose file
            </button>
            <p className="text-white/18 text-[10px]">PDF, DOCX, TXT · Up to 50 MB</p>
          </div>

          {/* Input options */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Camera className="w-3.5 h-3.5" />, label: "Scan Photo", desc: "Point camera at document" },
              { icon: <Mail className="w-3.5 h-3.5" />, label: "Paste Text", desc: "Paste from email or web" },
              { icon: <Link className="w-3.5 h-3.5" />, label: "Import Link", desc: "From URL or cloud" },
            ].map((opt, i) => (
              <button key={i} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-white/[0.07] bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
                <span className="text-white/30">{opt.icon}</span>
                <span className="text-[10px] font-medium text-white/48">{opt.label}</span>
                <span className="text-[9px] text-white/22 text-center leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="w-full max-w-lg mb-7 flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-amber-500/12 bg-amber-500/[0.04]">
          <Info className="w-3 h-3 text-amber-400/55 mt-[2px] shrink-0" />
          <p className="text-amber-200/42 text-[10px] leading-relaxed">
            PlainPath identifies <strong className="text-amber-200/60">possible risk indicators and trust signals</strong> only. Results are not a legal or forensic determination. Human verification is always required before acting on any finding.
          </p>
        </div>

        {/* Works well with */}
        <div className="w-full max-w-lg">
          <p className="text-white/22 text-[9px] uppercase tracking-[0.12em] font-semibold mb-3">Works well with</p>
          <div className="grid grid-cols-2 gap-2">
            {USE_CASES.map((u, i) => (
              <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.012]">
                <div className="mt-0.5 shrink-0">{u.icon}</div>
                <div>
                  <p className="text-white/55 text-xs font-medium leading-tight mb-0.5">{u.label}</p>
                  <p className="text-white/22 text-[10px] leading-tight">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
