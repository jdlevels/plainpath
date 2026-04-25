import { PenLine, AlertCircle, RefreshCcw, Save, FileText, Sparkles, LayoutTemplate } from "lucide-react"

export default function ContractBuilderError() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <PenLine className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white/80">Build a Contract</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/50">
            <Save className="w-3.5 h-3.5" /> Save draft
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto w-full">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>

        <h2 className="text-xl font-semibold mb-2">Document could not be generated.</h2>
        <p className="text-sm text-white/40 mb-2 leading-relaxed">
          PlainPath ran into a problem completing this section. Your form data is saved and no progress was lost.
        </p>
        <p className="text-xs text-white/25 mb-8">Error in §6 — Governing Law & Dispute Resolution</p>

        {/* Saved draft info */}
        <div className="w-full border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] text-left">
            <span className="text-xs text-white/30 uppercase tracking-widest">Draft saved</span>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs font-medium text-white/80">Acme-Riverton-ServiceAgreement.draft</div>
              <div className="text-xs text-white/35 mt-0.5">Auto-saved · 5 of 6 steps complete · §6 failed</div>
            </div>
          </div>
        </div>

        {/* Primary actions */}
        <div className="flex gap-3 w-full mb-6">
          <button className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <RefreshCcw className="w-4 h-4" /> Try again
          </button>
          <button className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:border-white/15 transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Save draft
          </button>
        </div>

        {/* Secondary options */}
        <div className="w-full border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] text-left">
            <span className="text-xs text-white/30 uppercase tracking-widest">Other options</span>
          </div>
          {[
            {
              icon: LayoutTemplate,
              label: "Use another template for this section",
              sub: "Pre-built clause options for governing law and dispute resolution.",
            },
            {
              icon: Sparkles,
              label: "Ask PlainPath",
              sub: "Describe what you need and PlainPath will draft the language.",
            },
            {
              icon: FileText,
              label: "Skip and export what's complete",
              sub: "Download the document with §1–5 filled. Add §6 manually.",
            },
          ].map((a, i) => {
            const Icon = a.icon
            return (
              <button
                key={i}
                className="w-full flex items-start gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] border-b border-white/[0.04] last:border-0 transition-colors"
              >
                <Icon className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-white/70">{a.label}</div>
                  <div className="text-xs text-white/30 mt-0.5 leading-relaxed">{a.sub}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
