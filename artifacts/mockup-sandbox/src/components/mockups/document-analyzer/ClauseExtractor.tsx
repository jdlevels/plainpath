import { useState } from "react"
import {
  ListChecks, ArrowLeft, Copy, Check, Download, Shield,
  ChevronRight, Users, Calendar, DollarSign, AlertTriangle,
  FileText, Lock, Zap, Search, Filter,
} from "lucide-react"

const GROUPS = [
  { id: "parties",    label: "Parties",          icon: Users,         count: 3  },
  { id: "dates",      label: "Key Dates",        icon: Calendar,      count: 5  },
  { id: "financial",  label: "Financial Terms",  icon: DollarSign,    count: 4  },
  { id: "clauses",    label: "Key Clauses",      icon: FileText,      count: 8  },
  { id: "risk",       label: "Risk Clauses",     icon: AlertTriangle, count: 3, locked: true },
]

const ITEMS: Record<string, { label: string; value: string; context?: string; risk?: "high" | "medium" }[]> = {
  parties: [
    { label: "Party A (Employer)", value: "TechCorp Incorporated, a Delaware corporation", context: "Preamble, Line 1" },
    { label: "Party B (Employee)", value: "Jane M. Doe", context: "Preamble, Line 2" },
    { label: "Governing State",    value: "California", context: "Section 14.2" },
  ],
  dates: [
    { label: "Start Date",          value: "August 1, 2025",        context: "Section 1.1" },
    { label: "Probation Period End", value: "November 1, 2025 (90 days)", context: "Section 3.2" },
    { label: "First Review Date",   value: "February 1, 2026",      context: "Section 4.1" },
    { label: "Non-Compete Expires", value: "August 1, 2027",        context: "Section 9.1", risk: "high" },
    { label: "Agreement Renewal",   value: "Auto-renews annually",  context: "Section 12.3", risk: "medium" },
  ],
  financial: [
    { label: "Base Salary",      value: "$125,000 per year",                      context: "Section 4.1" },
    { label: "Pay Schedule",     value: "Bi-weekly, direct deposit",              context: "Section 4.2" },
    { label: "Bonus Target",     value: "15% of base salary (discretionary)",     context: "Section 4.3", risk: "medium" },
    { label: "Equity",           value: "0.05% options, 4-year vest, 1-year cliff", context: "Section 5.1" },
  ],
  clauses: [
    { label: "IP Assignment",    value: "All work product becomes company property", context: "Section 7.1", risk: "high" },
    { label: "Non-Compete",      value: "2 years, 50-mile radius post-termination",  context: "Section 9.1", risk: "high" },
    { label: "Non-Solicitation", value: "18 months for clients and employees",       context: "Section 9.2", risk: "medium" },
    { label: "Dispute Resolution","value": "Binding arbitration in California",     context: "Section 13.1" },
    { label: "Termination",      value: "At-will, 2-week written notice",           context: "Section 10.1" },
    { label: "Benefits",         value: "Health, dental, vision — first of month after 30 days", context: "Section 6.1" },
    { label: "Remote Work",      value: "Hybrid — 3 days in office required",       context: "Section 2.3" },
    { label: "Confidentiality",  value: "Indefinite, covers all proprietary info",  context: "Section 8.1" },
  ],
  risk: [],
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="p-1 rounded hover:bg-slate-700 text-slate-600 hover:text-slate-400 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

export function ClauseExtractor() {
  const [activeGroup, setActiveGroup] = useState("parties")
  const [search, setSearch] = useState("")

  const items = ITEMS[activeGroup] ?? []
  const filtered = search ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()) || i.value.toLowerCase().includes(search.toLowerCase())) : items

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-emerald-900/50 border border-emerald-700/40 flex items-center justify-center shrink-0">
          <ListChecks className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Clause Extractor</span>
          <h1 className="text-sm font-bold text-slate-100 truncate">Employment Agreement — TechCorp Inc.</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[196px] flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
          <div className="px-3 py-3 border-b border-slate-800/80">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Categories</p>
            <div className="space-y-0.5">
              {GROUPS.map(g => (
                <button
                  key={g.id}
                  onClick={() => !g.locked && setActiveGroup(g.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors relative ${
                    g.locked
                      ? "text-slate-600 cursor-not-allowed"
                      : activeGroup === g.id
                      ? "bg-emerald-900/40 text-emerald-300"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-300"
                  }`}
                >
                  {activeGroup === g.id && !g.locked && (
                    <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-emerald-500" />
                  )}
                  <g.icon className={`w-3.5 h-3.5 shrink-0 ${activeGroup === g.id && !g.locked ? "text-emerald-400" : g.locked ? "text-slate-700" : "text-slate-500"}`} />
                  <span className="text-xs font-medium flex-1">{g.label}</span>
                  {g.locked
                    ? <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                    : <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeGroup === g.id ? "bg-emerald-800 text-emerald-200" : "bg-slate-800 text-slate-500"}`}>{g.count}</span>
                  }
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 pt-3 pb-2 border-b border-slate-800/80">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Total extracted</div>
            <div className="text-2xl font-bold text-slate-200">23</div>
            <div className="text-[10px] text-slate-600">clauses & terms</div>
          </div>

          <div className="mx-3 mt-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-emerald-900/30 to-slate-800/80 border border-emerald-800/40">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-emerald-300 uppercase">Pro</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mb-2">Unlock Risk Clauses + compare across documents</p>
            <button className="w-full py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold">Upgrade</button>
          </div>

          <div className="px-3 pb-3 mt-auto">
            <a href="#" className="flex items-center gap-1.5 text-[9px] text-slate-700 hover:text-slate-600">
              <Shield className="w-3 h-3" /> Reviewed by attorneys
            </a>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="max-w-3xl mx-auto px-6 py-6">
            {/* Search */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus-within:border-slate-700">
                <Search className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search extracted items…"
                  className="flex-1 bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none"
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 text-xs hover:bg-slate-800">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {GROUPS.find(g => g.id === activeGroup)?.icon && (() => {
                const G = GROUPS.find(g => g.id === activeGroup)!
                return <G.icon className="w-4 h-4 text-emerald-400" />
              })()}
              <h2 className="text-base font-bold text-slate-200">
                {GROUPS.find(g => g.id === activeGroup)?.label}
              </h2>
              <span className="ml-auto text-xs text-slate-600">{filtered.length} items</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden divide-y divide-slate-800/60">
              {filtered.map((item, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</span>
                      {item.risk === "high" && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-400">High Risk</span>}
                      {item.risk === "medium" && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-900/50 text-amber-400">Review</span>}
                    </div>
                    <p className="text-sm text-slate-200 font-medium">{item.value}</p>
                    {item.context && (
                      <p className="text-[10px] text-slate-600 mt-0.5">{item.context}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyBtn text={item.value} />
                    <button className="p-1 rounded hover:bg-slate-700 text-slate-600 hover:text-slate-400">
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
