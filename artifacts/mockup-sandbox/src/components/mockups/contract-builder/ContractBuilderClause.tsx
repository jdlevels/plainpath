import { PenLine, Save, Download, ChevronRight, ChevronLeft, DollarSign, Check, Zap, SkipForward } from "lucide-react"

export default function ContractBuilderClause() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <PenLine className="w-4 h-4" />
        </div>
        <span className="text-sm text-white/50">Build a Contract</span>
        <span className="text-white/20">/</span>
        <span className="text-sm font-medium text-white/80">Acme-Riverton-ServiceAgreement.draft</span>
        <div className="ml-2 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/[0.08] border border-amber-500/20 rounded-full px-2.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Unsaved changes
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/60">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Document with highlighted clause */}
        <div className="w-[58%] border-r border-white/[0.05] bg-[#111115] flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-white/[0.05] flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/30">Acme-Riverton-ServiceAgreement.draft</span>
            <span className="ml-auto text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">
              §3 · Payment — active
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
            <div className="w-full max-w-[540px] bg-[#FFFEF8] rounded-lg shadow-[0_4px_40px_rgba(0,0,0,0.3)] p-10 font-serif text-[#1a1a1a] text-sm leading-relaxed min-h-[700px]">
              <div className="text-center mb-6">
                <div className="font-bold text-base tracking-wide uppercase">Freelance Service Agreement</div>
                <div className="text-xs text-[#888] font-sans">Riverton Design Studio × Acme Corp · July 2025</div>
              </div>

              <div className="mb-5 opacity-60">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§1 — PARTIES & SERVICES</div>
                <p className="text-[13px]">
                  This Agreement is entered into between <strong>Acme Corp</strong> ("Client") and <strong>Riverton Design Studio</strong> ("Freelancer"), effective July 1, 2025, for brand identity and website design services as described herein.
                </p>
              </div>

              <div className="mb-5 opacity-60">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§2 — SCOPE OF WORK</div>
                <p className="text-[13px]">
                  Freelancer agrees to design and deliver: (a) a brand identity system including logo, color palette, and typography guide; (b) a 10-page marketing website; and (c) all source files. Delivery by October 1, 2025.
                </p>
              </div>

              {/* Active clause with ring */}
              <div className="mb-5 rounded-lg border-2 border-violet-500/60 bg-violet-500/[0.04] p-3 -mx-1 relative">
                <div className="absolute -top-2.5 left-3 flex items-center gap-1.5 bg-[#FFFEF8] px-2">
                  <span className="text-[10px] text-violet-500 font-bold font-sans uppercase tracking-wider">● Editing this clause</span>
                </div>
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§3 — PAYMENT & COMPENSATION</div>
                <p className="text-[13px]">
                  Total fee: <strong>$9,500 (nine thousand five hundred dollars)</strong>, payable as follows:<br />
                  — <strong>$2,375</strong> (25%) due upon execution of this Agreement.<br />
                  — <strong>$7,125</strong> (75%) due within{" "}
                  <span className="bg-amber-100 text-amber-800 px-1 rounded font-sans text-[11px]">30 days</span>{" "}
                  of final delivery. Late payments accrue{" "}
                  <span className="bg-amber-100 text-amber-800 px-1 rounded font-sans text-[11px]">1.5% per month</span>.
                </p>
              </div>

              <div className="mb-5 opacity-30">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§4 — INTELLECTUAL PROPERTY</div>
                <div className="space-y-1.5">
                  {[95, 82, 78].map((w, i) => (
                    <div key={i} className="h-2 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-sans">Acme-Riverton-ServiceAgreement.draft</span>
                <span className="text-[10px] text-gray-400 font-sans">Page 1 of 4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Clause Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <DollarSign className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold">Step 4 — Payment & Compensation</span>
              <span className="ml-auto text-[10px] text-red-400/70 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5">Required</span>
            </div>
            <p className="text-xs text-white/35">How will the freelancer be paid?</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {/* Payment structure */}
            <div>
              <label className="text-xs text-white/50 mb-2 block">Payment structure</label>
              <div className="grid grid-cols-3 gap-2">
                {["Flat fee", "Hourly", "Milestone"].map((t, i) => (
                  <button key={i} className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                    i === 0
                      ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                      : "border-white/[0.07] text-white/40 hover:border-white/15"
                  }`}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Total project fee</label>
              <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 gap-2">
                <span className="text-white/40 text-sm">$</span>
                <span className="text-sm text-white/85">9,500</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Deposit (upfront)</label>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85">
                  25% — $2,375
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Balance due</label>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85">
                  30 days after delivery
                </div>
              </div>
            </div>

            {/* Late fee — Optional */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-white/50">Late payment fee</label>
                  <span className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.07] rounded px-1.5 py-0.5">Optional</span>
                </div>
                <div className="w-8 h-4 bg-violet-600 rounded-full flex items-center justify-end pr-0.5 cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85">
                1.5% per month
              </div>
            </div>

            {/* Drafting hint */}
            <div className="flex items-start gap-2 p-3 bg-violet-600/[0.06] border border-violet-500/15 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-300/70 leading-relaxed">
                Suggested language only — review before use. A 25–50% deposit is common for creative work. Late fees of 1.5%/month are enforceable in most U.S. states.
              </p>
            </div>

            <button className="w-full py-2.5 rounded-xl bg-violet-600/15 border border-violet-500/30 text-sm text-violet-300 font-medium flex items-center justify-center gap-2 hover:bg-violet-600/20 transition-colors">
              <Check className="w-4 h-4" /> Update document
            </button>
          </div>

          <div className="px-5 py-4 border-t border-white/[0.05] flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-white/[0.07] text-white/40">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium">
              Next: Protection <ChevronRight className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-white/[0.07] text-white/30 hover:text-white/50 transition-colors">
              <SkipForward className="w-3.5 h-3.5" /> Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
