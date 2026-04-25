import {
  FileText, Upload, Camera, ClipboardPaste, Link2, Info,
  Scale, Briefcase, Home, Users, FileCheck, DollarSign,
  AlertCircle, ArrowLeft
} from "lucide-react";

const WORKS_WITH = [
  { icon: <Scale className="w-3.5 h-3.5 text-violet-400" />,    label: "Service agreements",    desc: "Obligations, payment terms, renewal, liability" },
  { icon: <Home className="w-3.5 h-3.5 text-sky-400" />,        label: "Leases",                desc: "Tenant rights, notice periods, deposits, exit" },
  { icon: <Briefcase className="w-3.5 h-3.5 text-amber-400" />, label: "Employment agreements", desc: "Compensation, non-compete, IP, termination" },
  { icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />,label: "Vendor contracts",      desc: "SLAs, liability caps, dispute resolution" },
  { icon: <Users className="w-3.5 h-3.5 text-orange-400" />,    label: "Contractor agreements", desc: "Scope, IP ownership, payment, exit terms" },
  { icon: <DollarSign className="w-3.5 h-3.5 text-rose-400" />, label: "Purchase agreements",   desc: "Payment, delivery, warranties, cancellation" },
  { icon: <FileCheck className="w-3.5 h-3.5 text-blue-400" />,  label: "Settlement agreements", desc: "Release of claims, payment, confidentiality" },
  { icon: <AlertCircle className="w-3.5 h-3.5 text-purple-400" />, label: "Business contracts", desc: "Partnerships, licensing, exclusivity, NDA" },
];

export function ContractReviewEmpty() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Tool header — back + icon + name */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <button className="p-1 rounded-md text-white/25 mr-0.5">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="w-5 h-5 rounded bg-amber-600 flex items-center justify-center shrink-0">
          <Scale className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/30 text-xs font-medium">PlainPath</span>
        <span className="text-white/15 text-xs">·</span>
        <span className="text-white/70 text-xs font-semibold">Contract Review</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center">

        {/* Header */}
        <div className="w-full max-w-lg text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/12 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
            <FileText className="w-6 h-6 text-violet-400" />
          </div>
          <h1 className="text-white text-xl font-semibold tracking-tight mb-2.5">
            Review a contract before you sign or act.
          </h1>
          <p className="text-white/35 text-sm leading-[1.7]">
            Upload a contract. PlainPath identifies key obligations, risk indicators, auto-renewal clauses, payment terms, termination language, possible missing protections, and source-backed next steps.
          </p>
        </div>

        {/* Upload zone */}
        <div className="w-full max-w-lg mb-5">
          <div className="rounded-2xl border-2 border-dashed border-white/[0.10] bg-white/[0.02] hover:bg-white/[0.035] hover:border-violet-500/25 transition-all duration-200 cursor-pointer p-8 flex flex-col items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-violet-600/14 border border-violet-500/22 flex items-center justify-center">
              <Upload className="w-5 h-5 text-violet-400/80" />
            </div>
            <div className="text-center">
              <p className="text-white/70 text-sm font-medium mb-1">Drop your contract here</p>
              <p className="text-white/26 text-xs">PlainPath provides contract review support — risk indicators and terms to verify. Not legal advice.</p>
            </div>
            <button className="h-8 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
              <Upload className="w-3 h-3" />
              Choose file
            </button>
            <p className="text-white/18 text-[10px]">PDF, DOCX, TXT · Up to 50 MB</p>
          </div>

          {/* Alt methods */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Camera className="w-3.5 h-3.5" />,       label: "Scan Photo",   desc: "Point camera at contract" },
              { icon: <ClipboardPaste className="w-3.5 h-3.5" />, label: "Paste Text",  desc: "Paste from email or doc" },
              { icon: <Link2 className="w-3.5 h-3.5" />,        label: "Import Link",  desc: "From URL or cloud" },
            ].map((opt,i) => (
              <button key={i} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-white/[0.07] bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
                <span className="text-white/30">{opt.icon}</span>
                <span className="text-[10px] font-medium text-white/48">{opt.label}</span>
                <span className="text-[9px] text-white/22 text-center leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Review support disclaimer */}
        <div className="w-full max-w-lg mb-7 flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.015]">
          <Info className="w-3 h-3 text-white/22 mt-[2px] shrink-0" />
          <p className="text-white/30 text-[10px] leading-relaxed">
            PlainPath provides <strong className="text-white/50">contract review support</strong> — risk indicators, terms to verify, and possible missing protections. This is not legal advice. Review with a qualified professional if this contract is high-risk for your situation.
          </p>
        </div>

        {/* Your review will include */}
        <div className="w-full max-w-lg mb-7">
          <p className="text-white/20 text-[9px] uppercase tracking-[0.12em] font-semibold mb-3">Your review will include</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              "Plain-English summary",
              "Risk & confidence strip",
              "Key contract risks",
              "Required next steps",
              "Obligations & deadlines",
              "Payment & fee terms",
              "Termination & renewal",
              "Possible missing protections",
              "Source traceability",
              "Verification checklist",
            ].map((item,i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.05]">
                <div className="w-1 h-1 rounded-full bg-violet-400/32 shrink-0" />
                <p className="text-white/28 text-[10px]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Works well with */}
        <div className="w-full max-w-lg">
          <p className="text-white/20 text-[9px] uppercase tracking-[0.12em] font-semibold mb-3">Works well with</p>
          <div className="grid grid-cols-2 gap-2">
            {WORKS_WITH.map((u,i) => (
              <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.012]">
                <div className="mt-0.5 shrink-0">{u.icon}</div>
                <div>
                  <p className="text-white/52 text-xs font-medium leading-tight mb-0.5">{u.label}</p>
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
