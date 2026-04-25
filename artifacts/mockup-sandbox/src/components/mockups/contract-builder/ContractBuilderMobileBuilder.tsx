import { PenLine, Save, ChevronRight, ChevronLeft, AlertCircle, Sparkles, Eye, Check, SkipForward } from "lucide-react"

const STEPS = ["Type", "People", "Scope", "Money", "Protection", "Review"]
const CURRENT_STEP = 1

export default function ContractBuilderMobileBuilder() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Mobile header */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <PenLine className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white/80 truncate flex-1">Acme-Riverton.draft</span>
        <div className="flex items-center gap-1 text-xs text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Unsaved</span>
        </div>
        <button className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center ml-1">
          <Save className="w-4 h-4 text-white/40" />
        </button>
      </header>

      {/* Tab bar — Builder first */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        <button className="flex-1 py-2.5 text-sm font-medium text-white border-b-2 border-violet-500 flex items-center justify-center gap-2">
          <PenLine className="w-3.5 h-3.5 text-violet-400" /> Builder
        </button>
        <button className="flex-1 py-2.5 text-sm text-white/40 flex items-center justify-center gap-2">
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
      </div>

      {/* Step progress */}
      <div className="px-4 py-3 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-0.5 mb-2 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-0.5 shrink-0">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium shrink-0 ${
                i < CURRENT_STEP ? "bg-violet-600 text-white" :
                i === CURRENT_STEP ? "bg-violet-600 text-white ring-2 ring-violet-400/30" :
                "bg-white/[0.05] text-white/25"
              }`}>
                {i < CURRENT_STEP ? <Check className="w-2.5 h-2.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-2.5 h-px ${i < CURRENT_STEP ? "bg-violet-500/50" : "bg-white/[0.08]"}`} />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-white/35 shrink-0">Step 2 — Parties</span>
        </div>
        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <div className="h-full bg-violet-600 rounded-full" style={{ width: "33%" }} />
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-5">
        <div>
          <h3 className="text-sm font-semibold mb-0.5">Step 2 — Parties</h3>
          <p className="text-xs text-white/35">Enter details for both parties.</p>
        </div>

        {/* Party A */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Party A — Client</span>
            <span className="text-[10px] text-red-400/70 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5">Required</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Full legal name</label>
              <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80">
                Acme Corp
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Business address</label>
              <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80">
                512 Commerce Ave, Suite 3, Newark, NJ 07102
              </div>
            </div>
          </div>
        </div>

        {/* Party B */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Party B — Freelancer</span>
            <span className="text-[10px] text-red-400/70 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5">Required</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Full legal name</label>
              <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80">
                Riverton Design Studio / Jordan R.
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Business address</label>
              <div className="w-full bg-white/[0.04] border border-violet-500/30 rounded-lg px-3 py-2.5 text-sm text-white/40 ring-2 ring-violet-500/10">
                Enter address...
              </div>
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] text-amber-400">Required — will appear in document</span>
              </div>
            </div>
          </div>
        </div>

        {/* Optional: governing state */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Governing State</span>
            <span className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.07] rounded px-1.5 py-0.5">Optional</span>
          </div>
          <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80">
            New Jersey
          </div>
        </div>

        {/* AI hint */}
        <div className="flex items-start gap-2 p-3 bg-violet-600/[0.06] border border-violet-500/15 rounded-xl">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
          <p className="text-xs text-violet-300/70 leading-relaxed">
            Match the legal name exactly to any business registration.
          </p>
        </div>
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0c0c0f] border-t border-white/[0.06] px-4 py-3 flex items-center gap-2">
        <button className="flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl border border-white/[0.07] text-white/40">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-xl bg-violet-600 text-white font-medium">
          Next: Scope <ChevronRight className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-1 text-xs px-3 py-2.5 rounded-xl border border-white/[0.07] text-white/30">
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
