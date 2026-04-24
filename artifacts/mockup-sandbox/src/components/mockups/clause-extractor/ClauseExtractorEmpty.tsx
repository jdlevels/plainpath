import { FileText, Upload, Camera, ClipboardPaste, Link2, Info, Scale, Briefcase, Home, FileCheck, FileSearch, ShieldCheck, Layers, ScrollText } from "lucide-react";

const WORKS_WITH = [
  { icon: <Scale className="w-3.5 h-3.5 text-violet-400" />,     label: "Service agreements",    desc: "Obligations, payment terms, renewal, liability" },
  { icon: <Home className="w-3.5 h-3.5 text-sky-400" />,         label: "Leases",                desc: "Tenant rights, notice periods, deposits, exit" },
  { icon: <Briefcase className="w-3.5 h-3.5 text-amber-400" />,  label: "Employment agreements", desc: "Compensation, non-compete, IP, termination" },
  { icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />, label: "Vendor contracts",      desc: "SLAs, liability caps, dispute resolution" },
  { icon: <FileCheck className="w-3.5 h-3.5 text-blue-400" />,   label: "Insurance forms",       desc: "Coverage terms, exclusions, notice requirements" },
  { icon: <Layers className="w-3.5 h-3.5 text-orange-400" />,    label: "Policy documents",      desc: "Obligations, definitions, enforcement terms" },
  { icon: <ScrollText className="w-3.5 h-3.5 text-rose-400" />,  label: "Notices",               desc: "Deadlines, required actions, response windows" },
  { icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />,label: "Contractor agreements",desc: "Scope, IP ownership, payment schedule, exit" },
];

export function ClauseExtractorEmpty() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Clause Extractor</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 pt-14 pb-16">

          {/* Hero */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/25 flex items-center justify-center mx-auto mb-5">
              <FileSearch className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-[22px] font-bold text-white tracking-tight mb-3">Extract the clauses that matter.</h1>
            <p className="text-sm text-white/42 leading-relaxed max-w-lg mx-auto">
              Upload, paste, or scan a document. PlainPath finds key clauses, organizes them by type, highlights obligations and deadlines, and links each clause back to its source.
            </p>
          </div>

          {/* Upload zone */}
          <div className="rounded-2xl border-2 border-dashed border-white/[0.1] bg-white/[0.015] hover:border-violet-500/40 hover:bg-violet-500/[0.04] transition-all cursor-pointer p-8 text-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <Upload className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-sm font-semibold text-white/70 mb-1">Drop your document here</p>
            <p className="text-xs text-white/30 mb-5">PlainPath provides clause extraction support — source-backed extracted terms. Not legal advice.</p>
            <button className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              Choose file
            </button>
            <p className="text-[10px] text-white/20 mt-3">PDF, DOCX, TXT · Up to 50 MB</p>
          </div>

          {/* Secondary input options */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: <Camera className="w-4 h-4 text-white/35" />, label: "Scan Photo", desc: "Point camera at document" },
              { icon: <ClipboardPaste className="w-4 h-4 text-white/35" />, label: "Paste Text", desc: "Paste from email or doc" },
              { icon: <Link2 className="w-4 h-4 text-white/35" />, label: "Import Link", desc: "From URL or cloud" },
            ].map(opt => (
              <button key={opt.label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.045] transition-colors py-3.5 px-3 flex flex-col items-center gap-2 cursor-pointer">
                {opt.icon}
                <span className="text-xs font-medium text-white/55">{opt.label}</span>
                <span className="text-[10px] text-white/25 text-center leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>

          {/* Legal disclaimer */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex gap-3 mb-8">
            <Info className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/35 leading-relaxed">
              PlainPath provides <strong className="text-white/50 font-semibold">clause extraction support</strong> — source-backed extracted terms, obligations, and deadlines. This is not legal advice. Review important language with a qualified professional if this document is high-risk for your situation.
            </p>
          </div>

          {/* Works well with */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/20 mb-4">WORKS WELL WITH</p>
            <div className="grid grid-cols-2 gap-2">
              {WORKS_WITH.map(w => (
                <div key={w.label} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-white/[0.05] bg-white/[0.015]">
                  <span className="shrink-0 mt-0.5">{w.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-white/60">{w.label}</p>
                    <p className="text-[10px] text-white/28 leading-snug mt-0.5">{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What you get */}
          <div className="mt-8">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/20 mb-4">YOUR EXTRACTION WILL INCLUDE</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Plain-English clause summary", "Extraction confidence score",
                "Key clauses by category",     "Obligations & owners table",
                "Dates & deadlines list",       "Missing / unclear clause flags",
                "Source-backed terms",          "Clickable source chips",
              ].map(f => (
                <div key={f} className="flex items-center gap-2 py-2 px-3 rounded-lg border border-white/[0.05] bg-white/[0.01]">
                  <div className="w-1 h-1 rounded-full bg-violet-500/60 shrink-0" />
                  <span className="text-[11px] text-white/38">{f}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
