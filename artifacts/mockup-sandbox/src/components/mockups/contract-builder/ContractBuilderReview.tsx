import { PenLine, Check, AlertCircle, Download, FileText, FileSignature, ChevronRight, Sparkles } from "lucide-react"

const SECTIONS = [
  { label: "Type & Template",      done: true,  note: "Freelance Service Agreement" },
  { label: "Parties",              done: true,  note: "Harlow Ventures LLC · Cole Creative Studio" },
  { label: "Scope of Work",        done: true,  note: "Brand identity + website, delivery Sep 1" },
  { label: "Payment",              done: true,  note: "$12,000 · 25% deposit · 30-day net" },
  { label: "IP & Confidentiality", done: true,  note: "IP transfers on full payment" },
  { label: "Governing Law",        done: true,  note: "California" },
]

export default function ContractBuilderReview() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <PenLine className="w-4 h-4" />
        </div>
        <span className="text-sm text-white/50">Build a Contract</span>
        <span className="text-white/20">/</span>
        <span className="text-sm font-medium text-white/80">Harlow-Cole-ServiceAgreement.draft</span>
        <div className="ml-2 flex items-center gap-1.5 text-xs text-green-400 bg-green-500/[0.08] border border-green-500/20 rounded-full px-2.5 py-0.5">
          <Check className="w-3 h-3" /> Ready to export
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/50">Save</button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white font-medium">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Final document */}
        <div className="w-[60%] border-r border-white/[0.05] bg-[#111115] flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-white/[0.05] flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/30">Final review</span>
            <span className="ml-auto text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">6 of 6 sections complete</span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
            <div className="w-full max-w-[560px] bg-[#FFFEF8] rounded-lg shadow-[0_4px_40px_rgba(0,0,0,0.3)] p-10 font-serif text-[#1a1a1a] text-sm leading-relaxed min-h-[700px]">
              <div className="text-center mb-8">
                <div className="font-bold text-base tracking-wide uppercase">Freelance Service Agreement</div>
                <div className="text-xs text-[#888] font-sans mt-1">Cole Creative Studio × Harlow Ventures LLC</div>
                <div className="text-xs text-[#888] font-sans">Effective June 1, 2025 · Governing Law: California</div>
              </div>

              <div className="mb-5">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§1 — PARTIES & SERVICES</div>
                <p className="text-[13px]">This Agreement is entered into between <strong>Harlow Ventures LLC</strong> ("Client"), 2840 Wilshire Blvd, Santa Monica, CA, and <strong>Cole Creative Studio</strong> ("Freelancer"), operated by Marcus A. Cole, effective June 1, 2025.</p>
              </div>

              <div className="mb-5">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§2 — SCOPE OF WORK</div>
                <p className="text-[13px]">Freelancer shall deliver a complete brand identity system (logo, palette, typography) and a 10-page marketing website. All source files included. Final delivery by September 1, 2025.</p>
              </div>

              <div className="mb-5">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§3 — PAYMENT</div>
                <p className="text-[13px]">Total: <strong>$12,000</strong>. Deposit of <strong>$3,000</strong> (25%) due upon execution. Balance of <strong>$9,000</strong> due within 30 days of delivery. Late payments accrue 1.5%/month interest.</p>
              </div>

              <div className="mb-5">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§4 — INTELLECTUAL PROPERTY</div>
                <p className="text-[13px]">All deliverables become exclusive property of Client upon receipt of full payment. Until then, IP remains with Freelancer. Freelancer retains portfolio display rights.</p>
              </div>

              <div className="mb-5">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§5 — CONFIDENTIALITY</div>
                <p className="text-[13px]">Both parties agree to keep confidential all proprietary information exchanged during this engagement. This obligation survives termination of the Agreement for 2 years.</p>
              </div>

              <div className="mb-8">
                <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§6 — GOVERNING LAW & DISPUTE</div>
                <p className="text-[13px]">This Agreement is governed by the laws of the State of California. Disputes shall be resolved first by negotiation, then by binding arbitration in Los Angeles County.</p>
              </div>

              <div className="border-t border-gray-200 pt-8 mt-8 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-[11px] font-sans text-gray-500 mb-6">CLIENT</div>
                  <div className="border-b border-gray-400 mb-1" />
                  <div className="text-[11px] font-sans text-gray-500">Harlow Ventures LLC<br />Emily R. Harlow, CEO</div>
                </div>
                <div>
                  <div className="text-[11px] font-sans text-gray-500 mb-6">FREELANCER</div>
                  <div className="border-b border-gray-400 mb-1" />
                  <div className="text-[11px] font-sans text-gray-500">Cole Creative Studio<br />Marcus A. Cole</div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-sans">Harlow-Cole-ServiceAgreement · PlainPath</span>
                <span className="text-[10px] text-gray-400 font-sans">Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Export Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold">Ready to Download</span>
            </div>
            <p className="text-xs text-white/35">All 6 sections complete. Review your document then export.</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {/* Completion checklist */}
            <div className="border border-white/[0.07] rounded-2xl overflow-hidden mb-5">
              <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.05]">
                <span className="text-xs text-white/30 uppercase tracking-widest">Document checklist</span>
              </div>
              {SECTIONS.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-green-500/20 border border-green-500/30" : "border border-white/[0.08]"}`}>
                    {s.done && <Check className="w-3 h-3 text-green-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white/75">{s.label}</div>
                    <div className="text-[11px] text-white/30 truncate">{s.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Optional: e-signature */}
            <div className="flex items-start gap-3 p-3.5 bg-amber-500/[0.05] border border-amber-500/15 rounded-xl mb-5">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-medium text-amber-300 mb-0.5">Signatures not yet added</div>
                <div className="text-[11px] text-amber-300/50">Add e-signatures before sending for a legally binding document.</div>
              </div>
              <button className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 shrink-0 mt-0.5">Add <ChevronRight className="w-3 h-3" /></button>
            </div>

            {/* Export options */}
            <div className="space-y-2 mb-5">
              <button className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors">
                <FileText className="w-4 h-4" /> Download PDF
              </button>
              <button className="w-full py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:border-white/15 flex items-center justify-center gap-2 transition-colors">
                <FileText className="w-4 h-4" /> Download DOCX
              </button>
              <button className="w-full py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:border-white/15 flex items-center justify-center gap-2 transition-colors">
                Copy plain text
              </button>
            </div>

            {/* Signature workflow CTA */}
            <button className="w-full flex items-center gap-3 p-4 rounded-2xl border border-white/[0.07] hover:border-white/15 hover:bg-white/[0.02] transition-all text-left">
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <FileSignature className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white/75">Add e-signature workflow</div>
                <div className="text-xs text-white/30">Send for signature via Dropbox Sign</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 ml-auto shrink-0" />
            </button>

            <div className="flex items-start gap-2 p-3 mt-4 bg-violet-600/[0.04] border border-violet-500/10 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-violet-400/60 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-300/50 leading-relaxed">Not legal advice. This document was built using guided templates. Review with a qualified attorney before execution.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
