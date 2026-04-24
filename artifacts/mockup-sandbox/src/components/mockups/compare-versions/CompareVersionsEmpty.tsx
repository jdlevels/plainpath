import { FileText, Upload, Camera, ClipboardPaste, Scale, Home, Briefcase, FileCheck, Layers, ScrollText, ShieldCheck, Info, ArrowLeftRight } from "lucide-react";

const WORKS_WITH = [
  { icon: <Scale className="w-3.5 h-3.5 text-violet-400" />,      label: "Service agreements",     desc: "Track obligation and term changes across drafts" },
  { icon: <Home className="w-3.5 h-3.5 text-sky-400" />,          label: "Leases",                 desc: "Spot rent, notice, deposit changes between versions" },
  { icon: <Briefcase className="w-3.5 h-3.5 text-amber-400" />,   label: "Employment agreements",  desc: "Compare compensation, IP, and non-compete language" },
  { icon: <FileCheck className="w-3.5 h-3.5 text-blue-400" />,    label: "Redlined documents",     desc: "Turn tracked changes into plain-English comparison" },
  { icon: <Layers className="w-3.5 h-3.5 text-orange-400" />,     label: "Policy documents",       desc: "Identify updated obligations, definitions, scope" },
  { icon: <ScrollText className="w-3.5 h-3.5 text-rose-400" />,   label: "Revised agreements",     desc: "Added, removed, and modified terms side-by-side" },
  { icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />,label: "Notices",                desc: "See what language was added or removed" },
  { icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />,  label: "Contract drafts",        desc: "Compare negotiation rounds and spot key changes" },
];

function UploadZone({ label, accent }: { label: string; accent: string }) {
  return (
    <div className={`flex-1 rounded-2xl border-2 border-dashed ${accent} bg-white/[0.015] hover:bg-white/[0.03] transition-all cursor-pointer p-6 flex flex-col items-center text-center gap-3`}>
      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
        <Upload className="w-4.5 h-4.5 text-white/35" />
      </div>
      <div>
        <p className="text-xs font-semibold text-white/60 mb-0.5">{label}</p>
        <p className="text-[10px] text-white/25">PDF or DOCX · Up to 50 MB</p>
      </div>
      <button className="h-7 px-3.5 rounded-lg bg-white/[0.07] border border-white/[0.1] text-[11px] text-white/50 font-medium hover:bg-white/[0.1] transition-colors flex items-center gap-1.5">
        <Upload className="w-3 h-3" /> Choose file
      </button>
      <div className="flex gap-2 mt-1">
        {[
          { icon: <Camera className="w-3 h-3 text-white/25" />, label: "Scan" },
          { icon: <ClipboardPaste className="w-3 h-3 text-white/25" />, label: "Paste" },
        ].map(opt => (
          <button key={opt.label} className="flex items-center gap-1 h-6 px-2 rounded-lg border border-white/[0.06] text-[10px] text-white/28 hover:bg-white/[0.03]">
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CompareVersionsEmpty() {
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
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 pt-12 pb-16">

          {/* Hero */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/25 flex items-center justify-center mx-auto mb-5">
              <ArrowLeftRight className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-[22px] font-bold text-white tracking-tight mb-3">Compare two document versions.</h1>
            <p className="text-sm text-white/42 leading-relaxed max-w-lg mx-auto">
              Upload an original and revised document. PlainPath shows what changed, what was added, what was removed, and what may need review before you act.
            </p>
          </div>

          {/* Upload zones */}
          <div className="flex gap-4 mb-3">
            <UploadZone label="Original document" accent="border-white/[0.09] hover:border-white/[0.15]" />

            <div className="flex flex-col items-center justify-center gap-2 shrink-0 px-1">
              <div className="w-8 h-8 rounded-full border border-white/[0.1] bg-white/[0.04] flex items-center justify-center">
                <ArrowLeftRight className="w-3.5 h-3.5 text-white/25" />
              </div>
              <span className="text-[10px] text-white/18 font-medium">vs</span>
            </div>

            <UploadZone label="Revised document" accent="border-violet-500/20 hover:border-violet-500/40" />
          </div>

          <div className="text-center mb-8">
            <p className="text-[10px] text-white/20">Accepts original + redlined PDFs, separate drafts, or any two document versions</p>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex gap-3 mb-8">
            <Info className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/35 leading-relaxed">
              PlainPath provides <strong className="text-white/50 font-semibold">change comparison support</strong> — source-backed changes, terms to verify, and possible risk changes. This is not legal advice. For high-risk documents, review with a qualified professional.
            </p>
          </div>

          {/* Works well with */}
          <div className="mb-8">
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
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/20 mb-4">WHAT GETS COMPARED</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Added language — what's new",        "Removed language — what's gone",
                "Modified terms — before vs. after",   "Possible risk changes",
                "Source-backed change chips",          "Plain-English change summary",
                "Change confidence score",             "Terms to verify before signing",
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
