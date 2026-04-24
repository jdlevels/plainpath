import { useState } from "react"
import {
  Scale, ArrowLeft, Flag, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronRight, MessageSquare, Download, Bookmark,
  Shield, Zap, Lock, FileText, BarChart3, Eye, Copy,
} from "lucide-react"

const SECTIONS = [
  {
    id: "red-flags",
    label: "Red Flags",
    icon: XCircle,
    count: 3,
    color: "text-red-400",
    bg: "bg-red-950/40 border-red-800/50",
    activeBg: "bg-red-900/40",
  },
  {
    id: "watch-out",
    label: "Watch Out",
    icon: AlertTriangle,
    count: 5,
    color: "text-amber-400",
    bg: "bg-amber-950/40 border-amber-800/50",
    activeBg: "bg-amber-900/40",
  },
  {
    id: "fair",
    label: "Fair Clauses",
    icon: CheckCircle2,
    count: 8,
    color: "text-emerald-400",
    bg: "bg-emerald-950/40 border-emerald-800/50",
    activeBg: "bg-emerald-900/40",
  },
]

const CLAUSES = [
  {
    id: "1",
    title: "Intellectual Property Assignment",
    rating: "red-flag",
    excerpt: "All work product, inventions, and ideas created during employment — including personal projects unrelated to company work — become property of the company.",
    plain: "You'd be giving up rights to everything you create, even on your own time. This is extremely broad and worth pushing back on.",
    negotiation: "Limit to work created using company resources or during working hours, directly related to the company's business.",
  },
  {
    id: "2",
    title: "Non-Compete Clause",
    rating: "red-flag",
    excerpt: "Employee agrees not to work for any competitor or start a competing business within 50 miles for 2 years after termination.",
    plain: "A 2-year non-compete within 50 miles is aggressive. Enforceability varies by state, but it creates real friction if you leave.",
    negotiation: "Request reduction to 6 months and narrow the definition of 'competitor' to direct business rivals only.",
  },
  {
    id: "3",
    title: "At-Will Termination",
    rating: "watch-out",
    excerpt: "Either party may terminate this agreement at any time, with or without cause, with 2 weeks written notice.",
    plain: "Standard at-will clause. The 2-week notice is typical but means they can let you go quickly.",
    negotiation: "Consider asking for 4-week notice period or severance clause for terminations without cause.",
  },
  {
    id: "4",
    title: "Payment Terms",
    rating: "fair",
    excerpt: "Compensation of $125,000 per year, paid bi-weekly via direct deposit on the 1st and 15th of each month.",
    plain: "Clear, standard payment terms. Nothing unusual here.",
    negotiation: null,
  },
]

const RATING_STYLES: Record<string, { icon: React.ElementType; label: string; cardBorder: string; tagBg: string; tagText: string }> = {
  "red-flag": { icon: XCircle,       label: "Red Flag",  cardBorder: "border-red-800/50",    tagBg: "bg-red-900/60",    tagText: "text-red-300"    },
  "watch-out": { icon: AlertTriangle, label: "Watch Out", cardBorder: "border-amber-800/50",  tagBg: "bg-amber-900/60",  tagText: "text-amber-300"  },
  "fair":      { icon: CheckCircle2,  label: "Fair",      cardBorder: "border-emerald-800/50",tagBg: "bg-emerald-900/60",tagText: "text-emerald-300"},
}

function ClauseCard({ clause }: { clause: typeof CLAUSES[0] }) {
  const [open, setOpen] = useState(clause.rating === "red-flag")
  const style = RATING_STYLES[clause.rating]
  return (
    <div className={`rounded-2xl border ${style.cardBorder} bg-slate-900/60 overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
      >
        <style.icon className={`w-4 h-4 mt-0.5 shrink-0 ${clause.rating === "red-flag" ? "text-red-400" : clause.rating === "watch-out" ? "text-amber-400" : "text-emerald-400"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-slate-200">{clause.title}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.tagBg} ${style.tagText}`}>
              {style.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1">{clause.excerpt}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-slate-800/60">
          <div className="pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">Original language</p>
            <p className="text-xs text-slate-400 italic leading-relaxed bg-slate-800/50 rounded-lg px-3 py-2.5">"{clause.excerpt}"</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">Plain English</p>
            <p className="text-sm text-slate-300 leading-relaxed">{clause.plain}</p>
          </div>
          {clause.negotiation && (
            <div className="rounded-xl border border-violet-800/40 bg-violet-950/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Negotiation tip
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">{clause.negotiation}</p>
              <button className="mt-2 flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 font-semibold">
                <Copy className="w-3 h-3" /> Copy negotiation email
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ContractReview() {
  const [activeSection, setActiveSection] = useState("red-flags")

  const filteredClauses = activeSection === "red-flags"
    ? CLAUSES.filter(c => c.rating === "red-flag")
    : activeSection === "watch-out"
    ? CLAUSES.filter(c => c.rating === "watch-out")
    : CLAUSES.filter(c => c.rating === "fair")

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-amber-900/50 border border-amber-700/40 flex items-center justify-center shrink-0">
          <Scale className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Contract Review</span>
          <h1 className="text-sm font-bold text-slate-100 truncate">Employment Agreement — TechCorp Inc.</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-900/40 border border-red-700/50">
            <BarChart3 className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-bold text-red-300">High Risk</span>
          </div>
          <button className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700">
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[200px] flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto">
          <div className="px-3 pt-4 pb-3 border-b border-slate-800/80">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Review Summary</p>
            <div className="space-y-1.5">
              {SECTIONS.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-colors ${
                    activeSection === sec.id ? sec.activeBg + " " + sec.bg : "border-slate-800 bg-slate-800/30 hover:bg-slate-800/60"
                  }`}
                >
                  <sec.icon className={`w-3.5 h-3.5 shrink-0 ${sec.color}`} />
                  <span className="text-xs font-medium text-slate-300 flex-1">{sec.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeSection === sec.id ? "bg-slate-900/60 " + sec.color : "bg-slate-800 text-slate-500"}`}>
                    {sec.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 pt-3 pb-2 border-b border-slate-800/80 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Score</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Fairness</span>
              <span className="text-xs font-bold text-amber-300">42/100</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[42%] bg-amber-500 rounded-full" />
            </div>
          </div>

          <nav className="py-2 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1.5 mt-1">Tools</p>
            {[
              { label: "Ask About This Contract", icon: MessageSquare },
              { label: "View Source Document",    icon: Eye },
              { label: "Export Review",           icon: Download },
            ].map(item => (
              <button key={item.label} className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:bg-slate-800/70 hover:text-slate-300 transition-colors text-left">
                <item.icon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-amber-900/30 to-slate-800/80 border border-amber-800/40">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">Pro</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mb-2">Get AI-drafted negotiation emails for every clause</p>
            <button className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors">Upgrade</button>
          </div>

          <div className="px-3 pb-3">
            <a href="#" className="flex items-center gap-1.5 text-[9px] text-slate-700 hover:text-slate-600">
              <Shield className="w-3 h-3" /> Reviewed by attorneys
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
            <div className="flex items-center gap-2 mb-5">
              {activeSection === "red-flags" && <XCircle className="w-4 h-4 text-red-400" />}
              {activeSection === "watch-out" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {activeSection === "fair" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              <h2 className="text-base font-bold text-slate-200">
                {activeSection === "red-flags" ? "Red Flags" : activeSection === "watch-out" ? "Watch Out" : "Fair Clauses"}
              </h2>
              <span className="ml-auto text-xs text-slate-600">{filteredClauses.length} clauses</span>
            </div>
            {filteredClauses.map(clause => (
              <ClauseCard key={clause.id} clause={clause} />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
