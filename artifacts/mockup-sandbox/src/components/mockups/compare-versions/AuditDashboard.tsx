import { ScanSearch, Plus, Search, Filter, MoreHorizontal, Clock, Archive,
  ChevronRight, Sparkles, AlertCircle, CheckCircle2, FileText,
  ArrowUpRight, BarChart2, Zap, FolderOpen, Trash2 } from "lucide-react"
import { useState } from "react"

const SESSIONS = [
  {
    id: 1, title: "MSA v3 vs v4",
    orig: "MSA_Original_v3.pdf", rev: "MSA_Revised_v4.pdf",
    status: "complete", high: 3, medium: 2, low: 1, total: 6,
    pages: 18, date: "2h ago", ai: true,
    flag: "3 critical changes — review before signing",
  },
  {
    id: 2, title: "NDA February vs March Draft",
    orig: "NDA_Feb2024.pdf", rev: "NDA_Mar2024.pdf",
    status: "complete", high: 1, medium: 3, low: 4, total: 8,
    pages: 6, date: "Yesterday", ai: true,
    flag: null,
  },
  {
    id: 3, title: "Lease Agreement Amendment",
    orig: "Lease_Original.pdf", rev: "Lease_Amended.pdf",
    status: "complete", high: 0, medium: 1, low: 2, total: 3,
    pages: 24, date: "3 days ago", ai: false,
    flag: null,
  },
  {
    id: 4, title: "Employment Contract Revisions",
    orig: "EmpContract_v1.pdf", rev: "EmpContract_v2.pdf",
    status: "scanning", high: 0, medium: 0, low: 0, total: 0,
    pages: 12, date: "Just now", ai: false,
    flag: null,
  },
  {
    id: 5, title: "Software License Agreement",
    orig: "SLA_Draft1.pdf", rev: "SLA_Draft2.pdf",
    status: "complete", high: 2, medium: 4, low: 1, total: 7,
    pages: 31, date: "1 week ago", ai: true,
    flag: null,
  },
]

const STATUS_CONFIG = {
  complete: { label: "Complete", pill: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  scanning: { label: "Scanning…", pill: "bg-blue-100 text-blue-700 border border-blue-200 animate-pulse" },
  pending:  { label: "Pending",  pill: "bg-slate-100 text-slate-500 border border-slate-200" },
  error:    { label: "Error",    pill: "bg-red-100 text-red-700 border border-red-200" },
}

type Tab = "active" | "archived"

export function AuditDashboard() {
  const [tab, setTab] = useState<Tab>("active")
  const [search, setSearch] = useState("")
  const [showNew, setShowNew] = useState(false)

  const totalChanges = SESSIONS.filter(s => s.status === "complete").reduce((a, s) => a + s.total, 0)
  const totalHigh = SESSIONS.filter(s => s.status === "complete").reduce((a, s) => a + s.high, 0)

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="flex-none flex items-center gap-3 px-6 py-3.5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
            <ScanSearch className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">Compare Versions</p>
            <p className="text-[10px] text-slate-400">Document diff analysis</p>
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Comparison
        </button>
      </div>

      {/* ── Stats header ── */}
      <div className="flex-none grid grid-cols-4 divide-x divide-slate-200 bg-white border-b border-slate-200">
        {[
          { label: "Total Sessions", value: SESSIONS.length.toString(), icon: <FolderOpen className="w-4 h-4 text-teal-500" />, sub: "+2 this week" },
          { label: "Changes Found", value: totalChanges.toString(), icon: <BarChart2 className="w-4 h-4 text-violet-500" />, sub: "across all documents" },
          { label: "High Risk Flags", value: totalHigh.toString(), icon: <AlertCircle className="w-4 h-4 text-red-500" />, sub: "require review" },
          { label: "AI Enhanced", value: SESSIONS.filter(s => s.ai).length.toString(), icon: <Sparkles className="w-4 h-4 text-amber-500" />, sub: "sessions enriched" },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 px-5 py-4">
            <div className="flex-shrink-0">{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-800 leading-none">{stat.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs + Search ── */}
      <div className="flex-none flex items-center gap-3 px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex gap-0.5 bg-slate-100 rounded-xl p-0.5">
          {(["active", "archived"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors placeholder:text-slate-400"
          />
        </div>
        <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors">
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      {/* ── Session grid ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          {SESSIONS
            .filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()))
            .map(session => {
              const stCfg = STATUS_CONFIG[session.status as keyof typeof STATUS_CONFIG]
              const hasHighRisk = session.high > 0
              return (
                <div
                  key={session.id}
                  className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                    hasHighRisk ? "border-red-200 hover:border-red-300" : "border-slate-200 hover:border-teal-300"
                  }`}
                >
                  {hasHighRisk && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-400" />
                  )}
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stCfg.pill}`}>
                            {stCfg.label}
                          </span>
                          {session.ai && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 truncate">{session.title}</h3>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Doc names */}
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <div className="w-3 h-3 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-2 h-2 text-blue-600" />
                        </div>
                        <span className="truncate">{session.orig}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <div className="w-3 h-3 rounded bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-2 h-2 text-emerald-600" />
                        </div>
                        <span className="truncate">{session.rev}</span>
                      </div>
                    </div>

                    {/* AI flag */}
                    {session.flag && (
                      <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2 mb-3">
                        <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-red-700 leading-snug">{session.flag}</p>
                      </div>
                    )}

                    {/* Diff counts */}
                    {session.status === "complete" && (
                      <div className="flex items-center gap-3 mb-3">
                        {session.high > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="text-[11px] font-semibold text-red-600">{session.high} high</span>
                          </div>
                        )}
                        {session.medium > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                            <span className="text-[11px] font-semibold text-amber-600">{session.medium} med</span>
                          </div>
                        )}
                        {session.low > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                            <span className="text-[11px] text-slate-500">{session.low} low</span>
                          </div>
                        )}
                        {session.total === 0 && (
                          <span className="text-[11px] text-slate-400">No changes found</span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" /> {session.date} · {session.pages}pp
                      </span>
                      <button className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 opacity-0 group-hover:opacity-100 transition-all">
                        Open <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

          {/* New comparison CTA card */}
          <button
            onClick={() => setShowNew(true)}
            className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all p-8 text-slate-400 hover:text-teal-600 min-h-48"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold">New Comparison</span>
          </button>
        </div>
      </div>
    </div>
  )
}
