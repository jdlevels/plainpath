import { PenLine, Save, Download, ChevronRight, ChevronLeft, Sparkles, AlertCircle, Check } from "lucide-react"

const STEPS = ["Type", "People", "Scope", "Money", "Protection", "Review"]
const CURRENT_STEP = 1

const DOC_TEXT = `FREELANCE SERVICE AGREEMENT

This Agreement is entered into between Harlow Ventures LLC ("Client"), a California limited liability company, and Cole Creative Studio ("Freelancer"), effective as of June 1, 2025.

§1 — PARTIES & SERVICES

Client: Harlow Ventures LLC
         2840 Wilshire Blvd, Suite 400
         Santa Monica, CA 90403

Freelancer: Cole Creative Studio / Marcus A. Cole
            ███████████████████████████
            ███████ ██ ██████

§2 — SCOPE OF WORK

████████████████████████████████████████
████████████████████████████████████
██████████████████████████████████████
████████████████████████████

§3 — PAYMENT

████████████████████████████████████████
████████████████████████████`

export default function ContractBuilderWorkspace() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <PenLine className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white/50">Build a Contract</span>
        <span className="text-white/20">/</span>
        <span className="text-sm font-medium text-white/80">Harlow-Cole-ServiceAgreement.draft</span>
        <div className="ml-2 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/[0.08] border border-amber-500/20 rounded-full px-2.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Unsaved changes
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/50 hover:text-white/70 transition-colors">
            <Save className="w-3.5 h-3.5" /> Save draft
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Document Preview */}
        <div className="w-[60%] border-r border-white/[0.05] bg-[#111115] flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-white/[0.05] flex items-center gap-2 text-xs text-white/30 shrink-0">
            <span>Harlow-Cole-ServiceAgreement.draft</span>
            <span className="ml-auto text-violet-400/60">Step 2 of 6 — updating...</span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
            <div className="w-full max-w-[560px] bg-[#FFFEF8] rounded-lg shadow-[0_4px_40px_rgba(0,0,0,0.3)] p-10 font-serif text-[#1a1a1a] text-sm leading-relaxed min-h-[700px]">
              <div className="text-center mb-8">
                <div className="font-bold text-base tracking-wide uppercase text-[#1a1a1a] mb-1">Freelance Service Agreement</div>
                <div className="text-xs text-[#888] font-sans">Draft — Cole Creative Studio × Harlow Ventures LLC · June 2025</div>
              </div>

              <p className="mb-5 text-[13px]">
                This Agreement is entered into between <strong>Harlow Ventures LLC</strong> ("Client"), a California limited liability company located at 2840 Wilshire Blvd, Suite 400, Santa Monica, CA 90403, and <strong>Cole Creative Studio</strong> ("Freelancer"), a sole proprietorship operated by Marcus A. Cole, effective as of <strong>June 1, 2025</strong>.
              </p>

              <div className="mb-5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-[#1a1a1a] mb-2 font-sans">§1 — PARTIES & SERVICES</div>
                <p className="text-[13px]">
                  Client: <strong>Harlow Ventures LLC</strong>, 2840 Wilshire Blvd, Suite 400, Santa Monica, CA 90403.<br />
                  Freelancer: <strong>Cole Creative Studio / Marcus A. Cole</strong>, <span className="inline-block bg-amber-100 text-amber-800 px-1.5 rounded font-sans text-[11px]">address needed</span>.
                </p>
              </div>

              <div className="mb-5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-[#888] mb-2 font-sans">§2 — SCOPE OF WORK</div>
                <div className="space-y-1.5">
                  {[100, 88, 95, 70].map((w, i) => (
                    <div key={i} className="h-2.5 bg-gray-200 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-gray-400 font-sans italic">Complete Step 3 — Scope to fill this section</div>
              </div>

              <div className="mb-5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-[#888] mb-2 font-sans">§3 — PAYMENT</div>
                <div className="space-y-1.5">
                  {[85, 92].map((w, i) => (
                    <div key={i} className="h-2.5 bg-gray-200 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-sans">Harlow-Cole-ServiceAgreement.draft</span>
                <span className="text-[10px] text-gray-400 font-sans">Page 1 of 4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Builder Controls */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Step progress */}
          <div className="px-5 pt-5 pb-3 border-b border-white/[0.05] shrink-0">
            <div className="flex items-center gap-1 mb-3">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium shrink-0 ${i < CURRENT_STEP ? "bg-violet-600 text-white" : i === CURRENT_STEP ? "bg-violet-600 text-white ring-2 ring-violet-400/30" : "bg-white/[0.05] text-white/25"}`}>
                    {i < CURRENT_STEP ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`text-[10px] ${i === CURRENT_STEP ? "text-white/80 font-medium" : i < CURRENT_STEP ? "text-white/40" : "text-white/20"}`}>{s}</span>
                  {i < STEPS.length - 1 && <div className={`w-4 h-px mx-0.5 ${i < CURRENT_STEP ? "bg-violet-500/50" : "bg-white/[0.08]"}`} />}
                </div>
              ))}
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: "33%" }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <h3 className="text-sm font-semibold mb-0.5">Step 2 — Parties</h3>
            <p className="text-xs text-white/35 mb-4">Enter the names and details for both sides of this agreement.</p>

            {/* Party A */}
            <div className="mb-5">
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Party A — Client</div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Full legal name</label>
                  <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80">Harlow Ventures LLC</div>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Business address</label>
                  <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80">2840 Wilshire Blvd, Suite 400, Santa Monica, CA 90403</div>
                </div>
              </div>
            </div>

            {/* Party B */}
            <div className="mb-6">
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Party B — Freelancer</div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Full legal name</label>
                  <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80">Marcus A. Cole / Cole Creative Studio</div>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Business address</label>
                  <div className="w-full bg-white/[0.04] border border-violet-500/30 rounded-lg px-3 py-2 text-sm text-white/40 ring-2 ring-violet-500/10">
                    Enter address...
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span className="text-[11px] text-amber-400">Required — will appear in document</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI insight */}
            <div className="flex items-start gap-2 p-3 bg-violet-600/[0.06] border border-violet-500/15 rounded-xl mb-6">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-300/70 leading-relaxed">Make sure the legal name matches exactly what appears on any business registration. For LLCs, include the state of formation (e.g. "Harlow Ventures LLC, a California LLC").</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-5 py-4 border-t border-white/[0.05] flex items-center gap-3 shrink-0">
            <button className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl border border-white/[0.07] text-white/40 hover:text-white/60 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Type
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors">
              Next: Scope <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
