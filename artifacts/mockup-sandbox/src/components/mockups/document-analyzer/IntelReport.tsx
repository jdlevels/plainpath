import { useState } from "react"
import {
  BookOpen, AlignLeft, FileText, XCircle, ListTodo, ShieldCheck,
  Calendar, AlertTriangle, Flag, Package, MessageSquare, Lock,
  TrendingUp, ArrowLeft, Bookmark, Download, Share2, ChevronRight,
  OctagonAlert, Check, Zap, AlertCircle, Clock, Shield, Star,
  BarChart3, CheckCircle2, Lightbulb,
} from "lucide-react"

const TABS = [
  { id: "plain-english",   label: "Plain English",   icon: BookOpen,       count: null,  free: true  },
  { id: "overview",        label: "Overview",         icon: FileText,       count: null,  free: true  },
  { id: "key-terms",       label: "Key Terms",        icon: Flag,           count: 8,     free: true  },
  { id: "deadlines",       label: "Deadlines",        icon: Calendar,       count: 3,     free: true  },
  { id: "action-pack",     label: "Action Pack",      icon: Package,        count: null,  free: true  },
  { id: "source-sections", label: "Source Sections",  icon: AlignLeft,      count: null,  free: false },
  { id: "missing",         label: "What's Missing",   icon: XCircle,        count: 4,     free: false },
  { id: "checklist",       label: "Checklist",        icon: ListTodo,       count: 6,     free: false },
  { id: "documents",       label: "Required Docs",    icon: ShieldCheck,    count: 3,     free: false },
  { id: "risks",           label: "Risks & Notes",    icon: AlertTriangle,  count: 2,     free: false },
  { id: "ask",             label: "Ask PlainPath",    icon: MessageSquare,  count: null,  free: true  },
]

const PLAIN_ENGLISH_SECTIONS = [
  {
    title: "What this document is",
    body: "This is a residential lease agreement for an apartment at 2847 Maple Street, Unit 4B. It binds you to a 12-month tenancy starting August 1, 2025, with a monthly rent of $2,150. The landlord is Westbrook Property Management LLC.",
    type: "info",
  },
  {
    title: "What you're agreeing to",
    body: "You agree to pay rent on the 1st of every month, maintain the unit in good condition, not sublet without written approval, and allow landlord access with 24-hour notice. A $4,300 security deposit (2 months) is required at signing.",
    type: "neutral",
  },
  {
    title: "What to watch out for",
    body: "The lease auto-renews for 12 months unless you give 60-day written notice — this is stricter than average. Late fees kick in after just 3 days (not the typical 5). The landlord can charge for any \"damage beyond normal wear\" which is undefined and could be disputed.",
    type: "warning",
  },
  {
    title: "Your key rights",
    body: "You have the right to quiet enjoyment, repairs within 14 days of written notice, and return of your full security deposit within 30 days of move-out with itemized deductions. The landlord cannot enter without 24-hour advance notice except in emergencies.",
    type: "success",
  },
  {
    title: "Bottom line",
    body: "This is a fairly standard lease with two above-average restrictions: the auto-renewal clause and the shorter late-fee grace period. Otherwise it's reasonable. Read Section 12 (Alterations) before hanging anything or doing any modifications.",
    type: "neutral",
  },
]

const RISK_ITEMS = [
  { label: "Auto-renews 12 months", sev: "high" },
  { label: "Late fee after 3 days", sev: "medium" },
  { label: "Undefined \"damage\" standard", sev: "medium" },
]

export function IntelReport() {
  const [activeTab, setActiveTab] = useState("plain-english")

  const isPro = false

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">

      {/* ── Top Header Bar ── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800 z-20">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-900/40 px-1.5 py-0.5 rounded">
              Residential Lease
            </span>
            <span className="text-[10px] text-slate-600 font-medium">apartment lease agreement</span>
          </div>
          <h1 className="text-sm font-bold text-slate-100 truncate leading-tight">
            Lease Agreement — 2847 Maple Street, Unit 4B
          </h1>
        </div>

        {/* Risk Score Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/40 border border-amber-700/50">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 tabular-nums">62</span>
            <span className="text-[10px] text-amber-500 font-medium">Moderate Risk</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <TrendingUp className="w-3 h-3 text-slate-400" />
            <span className="text-xs font-bold text-slate-300 tabular-nums">73%</span>
            <span className="text-[10px] text-slate-500 font-medium">done</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-xs font-semibold">
            <Bookmark className="w-3.5 h-3.5" /> Save
          </button>
          <button className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Red Flags Banner ── */}
      <div className="flex-shrink-0 flex items-start gap-3 px-5 py-2.5 bg-red-950/50 border-b border-red-900/60">
        <OctagonAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 mr-2">Critical</span>
          <span className="text-xs text-red-200">Auto-renewal clause requires 60-day notice to opt out — mark your calendar before June 1, 2026.</span>
        </div>
      </div>

      {/* ── Body: Sidebar + Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar ── */}
        <aside className="w-[220px] flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto">

          {/* At-a-glance stats */}
          <div className="px-3 pt-4 pb-3 border-b border-slate-800/80 grid grid-cols-2 gap-2">
            {[
              { label: "Action Steps", value: 6, warn: false, tab: "checklist" },
              { label: "Deadlines", value: 3, warn: true, tab: "deadlines" },
              { label: "Required Docs", value: 3, warn: false, tab: "documents" },
              { label: "Risks", value: 2, warn: true, tab: "risks" },
            ].map(stat => (
              <button
                key={stat.label}
                onClick={() => setActiveTab(stat.tab)}
                className={`rounded-lg p-2 text-left transition-colors hover:bg-slate-800 border ${stat.warn ? "border-amber-800/40 bg-amber-950/20" : "border-slate-800 bg-slate-800/40"}`}
              >
                <div className={`text-lg font-bold tabular-nums leading-none mb-0.5 ${stat.warn ? "text-amber-300" : "text-slate-200"}`}>
                  {stat.value}
                </div>
                <div className="text-[9px] text-slate-500 font-medium leading-tight">{stat.label}</div>
              </button>
            ))}
          </div>

          {/* Quick risk summary */}
          <div className="px-3 py-3 border-b border-slate-800/80">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Top Risks</p>
            <div className="space-y-1.5">
              {RISK_ITEMS.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.sev === "high" ? "bg-red-500" : "bg-amber-500"}`} />
                  <span className="text-[11px] text-slate-400 leading-tight">{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="flex-1 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1.5 mt-1">Sections</p>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const isLocked = !tab.free && !isPro
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors relative ${
                    isActive
                      ? "bg-violet-900/40 text-violet-300"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-300"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-violet-500" />
                  )}
                  <tab.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-violet-400" : "text-slate-500"}`} />
                  <span className="text-xs font-medium flex-1 truncate">{tab.label}</span>
                  {isLocked && (
                    <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                  )}
                  {tab.count != null && !isLocked && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                      isActive ? "bg-violet-800 text-violet-200" : "bg-slate-800 text-slate-500"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Upgrade nudge */}
          <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-violet-900/40 to-slate-800/80 border border-violet-800/40">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wide">Pro</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mb-2">Unlock Risks, Checklist, Source Sections + more</p>
            <button className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors">
              Upgrade
            </button>
          </div>

          {/* Attorney badge */}
          <div className="px-3 pb-3">
            <a href="#" className="flex items-center gap-1.5 text-[9px] text-slate-700 hover:text-slate-600 transition-colors">
              <Shield className="w-3 h-3" />
              Methodology reviewed by licensed attorneys
            </a>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="max-w-3xl mx-auto px-6 py-6">

            {activeTab === "plain-english" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  <h2 className="text-base font-bold text-slate-200">Plain English Summary</h2>
                  <span className="ml-auto text-[10px] text-slate-600 font-medium flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Written at a 6th-grade reading level
                  </span>
                </div>

                {PLAIN_ENGLISH_SECTIONS.map((sec, i) => {
                  const borderColor = {
                    info: "border-blue-700/40",
                    neutral: "border-slate-700/60",
                    warning: "border-amber-700/50",
                    success: "border-emerald-700/50",
                  }[sec.type]
                  const iconEl = {
                    info: <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
                    neutral: <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />,
                    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
                    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
                  }[sec.type]
                  const titleColor = {
                    info: "text-blue-300",
                    neutral: "text-slate-300",
                    warning: "text-amber-300",
                    success: "text-emerald-300",
                  }[sec.type]
                  return (
                    <div key={i} className={`rounded-2xl border ${borderColor} bg-slate-900/60 p-5`}>
                      <div className="flex items-start gap-3">
                        {iconEl}
                        <div>
                          <h3 className={`text-sm font-bold mb-1.5 ${titleColor}`}>{sec.title}</h3>
                          <p className="text-sm text-slate-300 leading-relaxed">{sec.body}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Ask CTA */}
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-violet-900/50 border border-violet-800/60 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">Have a question about this document?</p>
                    <p className="text-xs text-slate-500 mt-0.5">Ask PlainPath anything — our AI reads the actual text to answer.</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors shrink-0">
                    Ask <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activeTab !== "plain-english" && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                {(() => {
                  const tab = TABS.find(t => t.id === activeTab)
                  if (!tab) return null
                  const isLocked = !tab.free && !isPro
                  return isLocked ? (
                    <div className="max-w-sm">
                      <div className="w-12 h-12 rounded-2xl bg-amber-900/30 border border-amber-800/40 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-5 h-5 text-amber-500" />
                      </div>
                      <h3 className="text-base font-bold text-slate-200 mb-2">{tab.label} — Pro</h3>
                      <p className="text-sm text-slate-500 mb-5">Upgrade to Pro to unlock this section and get the full picture.</p>
                      <button className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors">
                        Upgrade to Pro
                      </button>
                    </div>
                  ) : (
                    <div className="max-w-sm">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
                        <tab.icon className="w-5 h-5 text-slate-400" />
                      </div>
                      <h3 className="text-base font-bold text-slate-200 mb-2">{tab.label}</h3>
                      <p className="text-sm text-slate-500">Content for this tab would appear here.</p>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
