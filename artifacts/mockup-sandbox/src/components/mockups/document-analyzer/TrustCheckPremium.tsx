import { useState } from "react"
import {
  ShieldCheck, ArrowLeft, AlertTriangle, XCircle, CheckCircle2,
  Phone, Mail, ExternalLink, Flag, Shield, Ban, Copy, ChevronDown, ChevronRight,
  Zap, Globe, Database, Users, FileSearch, AlertCircle, TrendingDown,
  Lock, BarChart3, Download, Fingerprint, RadioTower, RefreshCcw,
} from "lucide-react"

const VERDICT = {
  level: "suspicious",
  score: 72,
  headline: "This document shows multiple warning signs",
  summary: "Urgency language, unverifiable contacts, and payment-method demands match known IRS impersonation scam patterns.",
}

const SUB_SCORES = [
  { label: "Urgency Language",        score: 28, max: 100, bad: true  },
  { label: "Contact Authenticity",    score: 35, max: 100, bad: true  },
  { label: "Payment Method",          score: 10, max: 100, bad: true  },
  { label: "Document Formatting",     score: 68, max: 100, bad: false },
  { label: "Org. Legitimacy Claims",  score: 41, max: 100, bad: true  },
]

const RED_FLAGS = [
  {
    title: "Urgency / pressure language detected",
    detail: "Phrases like 'act within 48 hours' and 'failure to respond will result in legal action' are hallmarks of scam documents.",
    severity: "high",
    matchCount: 6,
  },
  {
    title: "Phone number not traceable to IRS",
    detail: "1-844-222-9988 is a VoIP number registered to a Nevada LLC — not the IRS. Official IRS number is 1-800-829-1040.",
    severity: "high",
    matchCount: 1,
  },
  {
    title: "Demands gift card / wire transfer",
    detail: "Government agencies never request gift cards or wire transfers. This is a definitive scam indicator.",
    severity: "high",
    matchCount: 2,
  },
]

const WATCH_ITEMS = [
  { title: "Sender address is a PO Box", detail: "Legitimate government agencies use physical addresses. A PO Box alone isn't proof of fraud, but combined with other signals it's concerning." },
  { title: "Generic letterhead, no watermark", detail: "Official IRS documents have security features — watermarks, seals, and serial numbers that are hard to replicate." },
]

const SAFE_ITEMS = [
  { title: "Correct IRS logo and formatting", detail: "The logo and layout match publicly available IRS forms. However, these are trivially copied from irs.gov." },
]

const SENDER_INTEL = {
  domain: "irs-notice-dept.com",
  domainAge: "14 days",
  registrar: "NameCheap (privacy proxy)",
  registeredCountry: "Panama",
  businessRegistry: "Not found in any state registry",
  sslCert: "Free Let's Encrypt (issued 12 days ago)",
  spfDkim: "Fails SPF / No DKIM",
  riskSignals: ["Domain mimics .gov domain", "Privacy-protected registrant", "Registered just before document date", "Foreign registrar"],
}

const FINGERPRINT = {
  createdApp: "LibreOffice 7.2 (Linux)",
  claimedAuthor: "IRS Department of Revenue",
  lastModified: "2 hours before mailing date",
  fontMismatch: true,
  metadataAuthor: "user_8821@gmail.com",
  embedUrl: "bit.ly/irs-pay-now",
  anomalies: [
    "Author metadata contradicts claimed organization",
    "Font substitution detected (Arial replaced with Helvetica clone)",
    "Hidden URL in payment section differs from displayed URL",
  ],
}

const PATTERN_MATCHES = [
  { template: "IRS CP2000 Impersonation (v4)", similarity: 94, reportedThisMonth: 312 },
  { template: "Tax Debt Collection Scam",      similarity: 78, reportedThisMonth: 89  },
]

const DO_NOTS = [
  "Do not send money or make any payment",
  "Do not call the phone numbers listed",
  "Do not click any links in the document",
  "Do not provide personal or financial information",
]

function ScoreBar({ score, bad }: { score: number; bad: boolean }) {
  const color = bad
    ? score < 40 ? "bg-red-500" : "bg-amber-500"
    : score > 60 ? "bg-emerald-500" : "bg-amber-500"
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex-1">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
    </div>
  )
}

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-900/60 border border-amber-700/50 text-amber-300">
      <Zap className="w-2.5 h-2.5" /> Pro
    </span>
  )
}

export function TrustCheckPremium() {
  const [expanded, setExpanded] = useState<string | null>("flags")
  const [activeSection, setActiveSection] = useState("overview")
  const [reported, setReported] = useState(false)

  const SIDEBAR_NAV = [
    { id: "overview",     label: "Verdict",           icon: ShieldCheck,  pro: false },
    { id: "sender",       label: "Sender Intel",      icon: Globe,        pro: true  },
    { id: "fingerprint",  label: "Doc Fingerprint",   icon: Fingerprint,  pro: true  },
    { id: "patterns",     label: "Pattern Matches",   icon: Database,     pro: true  },
    { id: "findings",     label: "All Findings",      icon: Flag,         pro: false },
    { id: "community",    label: "Community Signals", icon: Users,        pro: true  },
  ]

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">

      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 z-30">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-xl bg-blue-900/50 border border-blue-700/40 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Trust Check — Pro</span>
          <h1 className="text-sm font-bold text-slate-100 truncate leading-tight">IRS_Notice_CP2000_2025.pdf</h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-bold text-red-300 tabular-nums">{VERDICT.score}</span>
            <span className="text-[10px] text-slate-500 font-medium">risk / 100</span>
          </div>
          <button className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors" title="Copy report">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors" title="Download PDF report">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-[196px] flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto">

          {/* Overall risk score */}
          <div className="px-3 pt-4 pb-3 border-b border-slate-800/80">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Risk Score</p>
            <div className="flex items-end gap-1.5 mb-1.5">
              <span className="text-3xl font-bold tabular-nums leading-none text-amber-300">{VERDICT.score}</span>
              <span className="text-xs text-slate-600 mb-0.5">/ 100</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${VERDICT.score}%` }} />
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] text-slate-700">Safe</span>
              <span className="text-[9px] text-slate-700">Scam</span>
            </div>
          </div>

          {/* Sub-score breakdown — Pro */}
          <div className="px-3 py-3 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Score Breakdown</p>
              <ProBadge />
            </div>
            <div className="space-y-2">
              {SUB_SCORES.map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-slate-500 leading-tight truncate">{s.label}</span>
                    <span className={`text-[9px] font-bold tabular-nums ${s.bad && s.score < 50 ? "text-red-400" : "text-slate-400"}`}>{s.score}</span>
                  </div>
                  <ScoreBar score={s.score} bad={s.bad} />
                </div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1 mt-1">Sections</p>
            {SIDEBAR_NAV.map(sec => {
              const isActive = activeSection === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`relative w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors outline-none ${
                    isActive ? "bg-blue-900/30 text-blue-300" : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-300"
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-blue-500" />}
                  <sec.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                  <span className="text-xs font-medium flex-1 truncate">{sec.label}</span>
                  {sec.pro && <ProBadge />}
                </button>
              )
            })}
          </nav>

          {/* Report action */}
          <div className="mx-3 mb-3 space-y-2">
            <button
              onClick={() => setReported(true)}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all border ${
                reported
                  ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-400"
                  : "bg-red-900/30 border-red-700/40 text-red-300 hover:bg-red-900/50"
              }`}
            >
              {reported ? "✓ Reported to FTC" : "Report to FTC / IC3"}
            </button>
            <button className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors">
              Flag for Review
            </button>
          </div>

          <div className="px-3 pb-3">
            <a href="#" className="flex items-center gap-1.5 text-[9px] text-slate-700 hover:text-slate-600 transition-colors">
              <Shield className="w-3 h-3" /> Reviewed by licensed attorneys
            </a>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="max-w-2xl mx-auto px-5 py-5 space-y-4">

            {/* ── Verdict Overview ── */}
            {activeSection === "overview" && (
              <>
                {/* Verdict card */}
                <div className="rounded-2xl border border-amber-800/60 bg-gradient-to-br from-amber-950/60 to-slate-900/80 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-900/60 border border-amber-700/50 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Verdict</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300">Suspicious</span>
                      </div>
                      <h2 className="text-base font-bold text-slate-100 mb-1.5">{VERDICT.headline}</h2>
                      <p className="text-sm text-slate-300 leading-relaxed">{VERDICT.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Pattern match banner — Pro */}
                <div className="rounded-xl border border-violet-800/50 bg-violet-950/30 p-3.5 flex items-start gap-3">
                  <Database className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-bold text-violet-300">Matches known scam templates</p>
                      <ProBadge />
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      94% similar to <span className="text-violet-300 font-semibold">IRS CP2000 Impersonation v4</span> — reported 312 times this month
                    </p>
                  </div>
                  <button onClick={() => setActiveSection("patterns")} className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold shrink-0 whitespace-nowrap">
                    View →
                  </button>
                </div>

                {/* Do NOT */}
                <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                    <Ban className="w-3.5 h-3.5" /> Do NOT do any of the following
                  </p>
                  <div className="space-y-2">
                    {DO_NOTS.map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-sm text-red-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verify section */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <p className="text-sm font-semibold text-slate-200 mb-3">How to verify this document</p>
                  <div className="space-y-2.5">
                    {[
                      { icon: Phone, text: "Call the IRS directly at 1-800-829-1040 (official number only)" },
                      { icon: ExternalLink, text: "Look up your notice at irs.gov/notices using the notice number" },
                      { icon: Mail, text: "Compare with previous IRS letters you've received" },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          <step.icon className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-300 leading-snug">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Sender Intelligence — Pro ── */}
            {activeSection === "sender" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-violet-400" />
                  <h2 className="text-base font-bold text-slate-200">Sender Intelligence</h2>
                  <ProBadge />
                </div>
                <p className="text-xs text-slate-500 mb-1">Deep lookup on the sender's domain, registrar, and business registry.</p>

                <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-bold text-red-300">Domain flagged as deceptive</span>
                  </div>
                  {[
                    { label: "Domain",              value: SENDER_INTEL.domain,          bad: true  },
                    { label: "Domain age",           value: SENDER_INTEL.domainAge,       bad: true  },
                    { label: "Registrar",            value: SENDER_INTEL.registrar,       bad: true  },
                    { label: "Registered country",   value: SENDER_INTEL.registeredCountry, bad: true },
                    { label: "Business registry",    value: SENDER_INTEL.businessRegistry,bad: true  },
                    { label: "SSL cert",             value: SENDER_INTEL.sslCert,         bad: false },
                    { label: "Email authentication", value: SENDER_INTEL.spfDkim,         bad: true  },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-slate-500 shrink-0">{row.label}</span>
                      <span className={`font-medium text-right ${row.bad ? "text-red-300" : "text-slate-300"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Risk Signals</p>
                  <div className="space-y-2">
                    {SENDER_INTEL.riskSignals.map((s, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-sm text-slate-300">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Document Fingerprint — Pro ── */}
            {activeSection === "fingerprint" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Fingerprint className="w-4 h-4 text-blue-400" />
                  <h2 className="text-base font-bold text-slate-200">Document Fingerprint</h2>
                  <ProBadge />
                </div>
                <p className="text-xs text-slate-500 mb-1">Metadata and structural analysis of the file itself.</p>

                <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-5 space-y-3">
                  {[
                    { label: "Created with",       value: FINGERPRINT.createdApp,    bad: false },
                    { label: "Claimed author",      value: FINGERPRINT.claimedAuthor, bad: false },
                    { label: "Metadata author",     value: FINGERPRINT.metadataAuthor, bad: true },
                    { label: "Last modified",       value: FINGERPRINT.lastModified,  bad: true  },
                    { label: "Font consistency",    value: "Mismatch detected",       bad: true  },
                    { label: "Hidden URL found",    value: FINGERPRINT.embedUrl,      bad: true  },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-slate-500 shrink-0">{row.label}</span>
                      <span className={`font-medium text-right ${row.bad ? "text-amber-300" : "text-slate-300"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-red-900/50 bg-slate-900/60 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Structural Anomalies</p>
                  <div className="space-y-2.5">
                    {FINGERPRINT.anomalies.map((a, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-red-900/50 border border-red-800/50 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[9px] font-bold text-red-300">{i + 1}</span>
                        </div>
                        <span className="text-sm text-slate-300 leading-snug">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Pattern Matches — Pro ── */}
            {activeSection === "patterns" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-violet-400" />
                  <h2 className="text-base font-bold text-slate-200">Pattern Matches</h2>
                  <ProBadge />
                </div>
                <p className="text-xs text-slate-500 mb-1">Compared against PlainPath's database of 40,000+ confirmed scam documents.</p>

                <div className="space-y-3">
                  {PATTERN_MATCHES.map((m, i) => (
                    <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-bold text-slate-200">{m.template}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{m.reportedThisMonth} reports this month</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xl font-bold tabular-nums ${m.similarity > 85 ? "text-red-400" : "text-amber-400"}`}>{m.similarity}%</span>
                          <p className="text-[9px] text-slate-600">similarity</p>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${m.similarity > 85 ? "bg-red-500" : "bg-amber-500"}`}
                          style={{ width: `${m.similarity}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-start gap-3">
                  <RefreshCcw className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-0.5">Database last updated</p>
                    <p className="text-xs text-slate-500">Today at 09:14 AM · 40,812 templates indexed</p>
                  </div>
                </div>
              </>
            )}

            {/* ── All Findings ── */}
            {activeSection === "findings" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Flag className="w-4 h-4 text-red-400" />
                  <h2 className="text-base font-bold text-slate-200">All Findings</h2>
                </div>
                {[
                  { id: "flags", label: "Red Flags",  count: RED_FLAGS.length,  color: "text-red-400",     icon: Flag,          items: RED_FLAGS  },
                  { id: "watch", label: "Watch Out",   count: WATCH_ITEMS.length, color: "text-amber-400",  icon: AlertTriangle, items: WATCH_ITEMS },
                  { id: "safe",  label: "Looks OK",    count: SAFE_ITEMS.length,  color: "text-emerald-400", icon: CheckCircle2,  items: SAFE_ITEMS  },
                ].map(group => (
                  <div key={group.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === group.id ? null : group.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors"
                    >
                      <group.icon className={`w-4 h-4 shrink-0 ${group.color}`} />
                      <span className="text-sm font-semibold text-slate-200 flex-1 text-left">{group.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 ${group.color}`}>{group.count}</span>
                      {expanded === group.id ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                    </button>
                    {expanded === group.id && (
                      <div className="border-t border-slate-800 divide-y divide-slate-800/60">
                        {group.items.map((item, i) => (
                          <div key={i} className="px-5 py-4">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                              {"matchCount" in item && (item as typeof RED_FLAGS[0]).matchCount > 1 && (
                                <span className="text-[9px] font-bold text-red-400 bg-red-950/40 border border-red-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                                  {(item as typeof RED_FLAGS[0]).matchCount} instances
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* ── Community Signals — Pro ── */}
            {activeSection === "community" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <h2 className="text-base font-bold text-slate-200">Community Signals</h2>
                  <ProBadge />
                </div>
                <p className="text-xs text-slate-500 mb-1">Aggregated reports from PlainPath users about similar documents.</p>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Reports this month",  value: "312",   icon: RadioTower,   color: "text-red-400" },
                    { label: "Users flagged it",    value: "89%",   icon: Flag,         color: "text-amber-400" },
                    { label: "Avg risk score",      value: "74",    icon: BarChart3,    color: "text-slate-300" },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                      <stat.icon className={`w-4 h-4 mx-auto mb-1.5 ${stat.color}`} />
                      <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                      <p className="text-[9px] text-slate-600 leading-tight mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
                  {[
                    { time: "2h ago",  note: "Confirmed scam. Called IRS official line — no notice on file.", verified: true },
                    { time: "5h ago",  note: "Same document sent to 3 colleagues in our company on the same day.", verified: true },
                    { time: "1d ago",  note: "Reported to FTC. Got callback from actual IRS saying this was fake.", verified: true },
                    { time: "3d ago",  note: "Font and layout match a template circulating since March 2025.", verified: false },
                  ].map((r, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-slate-600">{r.time}</span>
                        {r.verified && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded-full">Verified</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">{r.note}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex items-center gap-3">
                  <FileSearch className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-300">Add your note to the community</p>
                    <p className="text-[10px] text-slate-600">Help others recognise this scam</p>
                  </div>
                  <button className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-800/50 border border-blue-700/50 text-xs font-bold text-blue-300 hover:bg-blue-800 transition-colors">
                    + Report
                  </button>
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
