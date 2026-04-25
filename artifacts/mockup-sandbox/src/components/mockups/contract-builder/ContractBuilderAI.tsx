import { PenLine, Save, Download, Sparkles, Check, Pencil, RefreshCcw, SkipForward, Info } from "lucide-react"

const AI_SUGGESTION = `All deliverables created by Freelancer under this Agreement — including brand identity assets, design files, and website source files — shall become the exclusive property of Client upon receipt of full payment. Until full payment is received, Freelancer retains all intellectual property rights. Client's license is limited to review and feedback purposes only. Freelancer retains the right to display completed work in a professional portfolio.`

export default function ContractBuilderAI() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <PenLine className="w-4 h-4" />
        </div>
        <span className="text-sm text-white/50">Build a Contract</span>
        <span className="text-white/20">/</span>
        <span className="text-sm font-medium text-white/80">Acme-Riverton-ServiceAgreement.draft</span>
        <div className="ml-2 flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/[0.08] border border-violet-500/20 rounded-full px-2.5 py-0.5">
          <Sparkles className="w-3 h-3" /> Drafting §4...
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/50">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Document with AI cursor */}
        <div className="w-[58%] border-r border-white/[0.05] bg-[#111115] flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-white/[0.05] flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/30">Acme-Riverton-ServiceAgreement.draft</span>
            <span className="ml-auto text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5">
              §4 · IP — suggested (pending review)
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
            <div className="w-full max-w-[540px] bg-[#FFFEF8] rounded-lg shadow-[0_4px_40px_rgba(0,0,0,0.3)] p-10 font-serif text-[#1a1a1a] text-sm leading-relaxed min-h-[700px]">
              <div className="text-center mb-6">
                <div className="font-bold text-base tracking-wide uppercase">Freelance Service Agreement</div>
                <div className="text-xs text-[#888] font-sans">Riverton Design Studio × Acme Corp · July 2025</div>
              </div>

              <div className="mb-5 opacity-60">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§3 — PAYMENT & COMPENSATION</div>
                <p className="text-[13px]">
                  Total fee: <strong>$9,500</strong> payable as $2,375 upfront and $7,125 within 30 days of final delivery. Late payments accrue 1.5%/month interest.
                </p>
              </div>

              {/* Suggested clause highlighted in document — pending acceptance */}
              <div className="mb-5 rounded-lg border-2 border-dashed border-violet-500/50 bg-violet-500/[0.03] p-3 -mx-1 relative">
                <div className="absolute -top-2.5 left-3 bg-[#FFFEF8] px-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  <span className="text-[10px] text-violet-500 font-bold font-sans uppercase tracking-wider">
                    Suggestion — pending your review
                  </span>
                </div>
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2 text-[#888]">§4 — INTELLECTUAL PROPERTY</div>
                <p className="text-[13px] text-[#555] italic">
                  All deliverables created by Freelancer under this Agreement — including brand identity assets, design files, and website source files — shall become the exclusive property of Client upon receipt of full payment.
                  <span className="inline-block w-0.5 h-4 bg-violet-600 animate-pulse ml-0.5 align-middle" />
                </p>
              </div>

              <div className="opacity-25">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§5 — CONFIDENTIALITY</div>
                <div className="space-y-1.5">
                  {[90, 75, 85].map((w, i) => (
                    <div key={i} className="h-2 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-sans">Acme-Riverton-ServiceAgreement.draft</span>
                <span className="text-[10px] text-gray-400 font-sans">Page 2 of 4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — AI Suggestion Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold">PlainPath suggests language for review</span>
            </div>
            <p className="text-xs text-white/35">Review, edit, or regenerate before adding to your document.</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {/* Context tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {["Freelance agreement", "Digital deliverables", "IP assignment on payment"].map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 bg-white/[0.04] border border-white/[0.07] rounded-full text-white/40">
                  {t}
                </span>
              ))}
            </div>

            {/* Suggestion card */}
            <div className="bg-white/[0.02] border border-violet-500/15 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-medium text-violet-300">Suggested clause language</span>
                <span className="ml-auto text-[10px] text-white/20">§4 — IP</span>
              </div>
              <p className="text-[13px] text-white/75 leading-relaxed font-serif">{AI_SUGGESTION}</p>
            </div>

            {/* Why this wording */}
            <div className="flex items-start gap-2 p-3 bg-violet-600/[0.05] border border-violet-500/10 rounded-xl mb-4">
              <Sparkles className="w-3.5 h-3.5 text-violet-400/60 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-violet-300/70 mb-0.5">Why this language?</div>
                <p className="text-xs text-violet-300/50 leading-relaxed">
                  Payment-contingent IP transfer is common in freelance agreements. Portfolio rights are standard and reasonable. Review with counsel for high-value projects.
                </p>
              </div>
            </div>

            {/* Legal note */}
            <div className="flex items-start gap-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl mb-5">
              <Info className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
              <p className="text-xs text-white/30 leading-relaxed">
                This is drafting support, not legal advice. Review before use. Consider professional review for high-stakes IP arrangements.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <button className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors">
                <Check className="w-4 h-4" /> Accept suggestion
              </button>
              <div className="grid grid-cols-3 gap-2">
                <button className="py-2 rounded-xl border border-white/[0.08] text-xs text-white/50 hover:text-white/70 hover:border-white/15 transition-colors flex items-center justify-center gap-1">
                  <Pencil className="w-3 h-3" /> Edit first
                </button>
                <button className="py-2 rounded-xl border border-white/[0.08] text-xs text-white/50 hover:text-white/70 hover:border-white/15 transition-colors flex items-center justify-center gap-1">
                  <RefreshCcw className="w-3 h-3" /> Redo
                </button>
                <button className="py-2 rounded-xl border border-white/[0.08] text-xs text-white/50 hover:text-white/70 hover:border-white/15 transition-colors flex items-center justify-center gap-1">
                  <SkipForward className="w-3 h-3" /> Skip
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-white/25">
              <span>4 of 6 steps complete</span>
              <span>·</span>
              <span>Confidentiality next</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
