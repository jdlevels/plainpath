import { PenLine, Eye, ArrowLeft, Info } from "lucide-react"

export default function ContractBuilderMobilePreview() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Mobile header */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <PenLine className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white/80 truncate flex-1">Acme-Riverton.draft</span>
        <span className="text-xs text-white/30">Step 2 of 6</span>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        <button className="flex-1 py-2.5 text-sm text-white/40 flex items-center justify-center gap-2">
          <PenLine className="w-3.5 h-3.5" /> Builder
        </button>
        <button className="flex-1 py-2.5 text-sm font-medium text-white border-b-2 border-violet-500 flex items-center justify-center gap-2">
          <Eye className="w-3.5 h-3.5 text-violet-400" /> Preview
        </button>
      </div>

      {/* Return to builder banner */}
      <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600/[0.06] border-b border-violet-500/10 shrink-0 hover:bg-violet-600/[0.10] transition-colors">
        <ArrowLeft className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs text-violet-300">Return to Builder to edit</span>
      </button>

      {/* Live paper preview — read-only */}
      <div className="flex-1 overflow-y-auto px-3 py-4 bg-[#111115]">
        <div className="text-[10px] text-white/25 text-center mb-3 font-sans">
          Live preview — changes update as you fill the Builder
        </div>

        <div className="bg-[#FFFEF8] rounded-lg shadow-[0_4px_30px_rgba(0,0,0,0.3)] p-6 font-serif text-[#1a1a1a] text-[12px] leading-relaxed min-h-[600px]">
          <div className="text-center mb-6">
            <div className="font-bold text-[13px] tracking-wide uppercase">Freelance Service Agreement</div>
            <div className="text-[10px] text-[#888] font-sans mt-1">
              Riverton Design Studio × Acme Corp · July 2025
            </div>
          </div>

          <p className="mb-4">
            This Agreement is entered into between{" "}
            <strong>Acme Corp</strong> ("Client"), a Delaware corporation located at 512 Commerce Ave, Suite 3, Newark, NJ 07102, and{" "}
            <strong>Riverton Design Studio</strong> ("Freelancer") operated by Jordan R., effective{" "}
            <strong>July 1, 2025</strong>.
          </p>

          <div className="mb-4">
            <div className="font-bold text-[10px] uppercase tracking-wider font-sans mb-1.5">§1 — PARTIES & SERVICES</div>
            <p>
              Client: <strong>Acme Corp</strong>, Newark, NJ.<br />
              Freelancer: <strong>Riverton Design Studio / Jordan R.</strong>,{" "}
              <span className="bg-amber-100 text-amber-800 px-1 rounded font-sans text-[10px]">address needed</span>
            </p>
          </div>

          <div className="mb-4">
            <div className="font-bold text-[10px] uppercase tracking-wider text-[#999] font-sans mb-1.5">
              §2 — SCOPE OF WORK
            </div>
            <div className="space-y-1.5">
              {[100, 88, 75, 60].map((w, i) => (
                <div key={i} className="h-2 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="mt-1.5 text-[10px] text-gray-400 font-sans italic">
              Complete Step 3 to fill this section
            </div>
          </div>

          <div className="mb-4">
            <div className="font-bold text-[10px] uppercase tracking-wider text-[#999] font-sans mb-1.5">
              §3 — PAYMENT
            </div>
            <div className="space-y-1.5">
              {[92, 80].map((w, i) => (
                <div key={i} className="h-2 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-[9px] text-gray-400 font-sans">Acme-Riverton-ServiceAgreement.draft</span>
            <span className="text-[9px] text-gray-400 font-sans">Page 1 of 4</span>
          </div>
        </div>

        {/* Disclaimer below paper */}
        <div className="flex items-start gap-1.5 mt-3 px-1">
          <Info className="w-3 h-3 text-white/20 mt-0.5 shrink-0" />
          <p className="text-[10px] text-white/20 leading-relaxed">
            Drafting support only. Review before use. Not legal advice.
          </p>
        </div>
      </div>
    </div>
  )
}
