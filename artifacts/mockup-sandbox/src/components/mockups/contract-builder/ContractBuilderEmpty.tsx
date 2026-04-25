import { PenLine, Shield, Handshake, Building2, UserRound, FileText, Clock, ChevronRight } from "lucide-react"

const CONTRACT_TYPES = [
  { icon: PenLine,   label: "Freelance Service Agreement", desc: "For project-based creative, tech, or consulting work.", badge: "Most Popular", badgeCls: "bg-violet-600/20 text-violet-300 border-violet-500/30" },
  { icon: Shield,    label: "Non-Disclosure Agreement",    desc: "Protect confidential information with both parties bound.", badge: null },
  { icon: Handshake, label: "Service Agreement",           desc: "Ongoing or retainer-based service relationships.", badge: null },
  { icon: Building2, label: "Lease Agreement",             desc: "Residential or commercial property rentals.", badge: null },
  { icon: UserRound, label: "Employment Agreement",        desc: "Full-time or part-time employment terms.", badge: null },
  { icon: FileText,  label: "Custom Document",             desc: "Start with a blank template and build your own.", badge: null },
]

const RECENT_DRAFTS = [
  { name: "Cole Creative — Harlow NDA.draft", updated: "2 days ago", type: "NDA", pct: 70 },
  { name: "Website Design Agreement.draft",   updated: "4 days ago", type: "Freelance", pct: 40 },
]

export default function ContractBuilderEmpty() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <PenLine className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white/80">Build a Contract</span>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-12">
        <div className="max-w-3xl mx-auto pt-10">
          <h1 className="text-2xl font-semibold mb-1">What would you like to build?</h1>
          <p className="text-sm text-white/40 mb-8">PlainPath guides you through each section. Your document grows in real time as you answer.</p>

          <div className="grid grid-cols-3 gap-3 mb-10">
            {CONTRACT_TYPES.map((ct, i) => {
              const Icon = ct.icon
              return (
                <button key={i} className={`group relative flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all text-left ${i === 0 ? "border-violet-500/40 bg-violet-600/[0.06] hover:bg-violet-600/[0.10]" : "border-white/[0.07] bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]"}`}>
                  {ct.badge && (
                    <span className={`absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full border ${ct.badgeCls}`}>{ct.badge}</span>
                  )}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${i === 0 ? "bg-violet-600/20" : "bg-white/[0.05]"}`}>
                    <Icon className={`w-5 h-5 ${i === 0 ? "text-violet-400" : "text-white/50"}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/85 mb-0.5">{ct.label}</div>
                    <div className="text-xs text-white/35 leading-relaxed">{ct.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/30" />
              <span className="text-xs text-white/30 uppercase tracking-widest">Recent Drafts</span>
            </div>
            {RECENT_DRAFTS.map((d, i) => (
              <button key={i} className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] border-b border-white/[0.04] last:border-0 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/80 truncate">{d.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1 w-24 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs text-white/30">{d.pct}% complete · {d.updated}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
