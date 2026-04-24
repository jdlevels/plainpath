import { useState } from "react"
import {
  ShieldCheck, ArrowLeft, AlertTriangle, XCircle, CheckCircle2,
  Phone, Mail, ExternalLink, Flag, Shield, Ban, Copy, ChevronDown, ChevronRight,
} from "lucide-react"

const VERDICT = {
  level: "suspicious",
  score: 72,
  headline: "This document shows multiple warning signs",
  summary: "We found urgency language, unverifiable contact details, and pressure tactics that are common in scam documents. Do not send money or personal information without verifying the sender through official channels.",
}

const RED_FLAGS = [
  {
    title: "Urgency / pressure language detected",
    detail: "Phrases like 'act within 48 hours' and 'failure to respond will result in legal action' are hallmarks of scam documents designed to prevent careful thinking.",
    severity: "high",
  },
  {
    title: "Phone number not traceable to claimed organization",
    detail: "The number 1-844-222-9988 does not match any official government or IRS registry. Scammers often use VoIP numbers that look legitimate.",
    severity: "high",
  },
  {
    title: "Demands unusual payment method",
    detail: "The document requests payment via wire transfer or gift cards. Official agencies never request these payment methods.",
    severity: "high",
  },
]

const WATCH_ITEMS = [
  { title: "Sender address is a PO Box", detail: "Legitimate government agencies use physical addresses. A PO Box alone isn't proof of fraud, but combined with other signals it's concerning." },
  { title: "Generic letterhead with no seal or watermark", detail: "Official documents from government bodies typically have official seals, watermarks, or other security features." },
]

const SAFE_ITEMS = [
  { title: "Correct IRS logo and formatting", detail: "The logo and layout match publicly available IRS forms. However, these are easy to copy." },
]

const DO_NOTS = [
  "Do not send money or make any payment",
  "Do not call the phone numbers listed",
  "Do not click any links in the document",
  "Do not provide personal or financial information",
]

export function TrustCheck() {
  const [expanded, setExpanded] = useState<string | null>("flags")

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-blue-900/50 border border-blue-700/40 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Trust Check</span>
          <h1 className="text-sm font-bold text-slate-100 truncate">IRS_Notice_CP2000_2025.pdf</h1>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700">
          <Copy className="w-3 h-3" /> Share Report
        </button>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-950">
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

          {/* Verdict card */}
          <div className="rounded-2xl border border-amber-800/60 bg-gradient-to-br from-amber-950/60 to-slate-900/80 p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-900/60 border border-amber-700/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Verdict</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300">Suspicious</span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 mb-2">{VERDICT.headline}</h2>
                <p className="text-sm text-slate-300 leading-relaxed">{VERDICT.summary}</p>
              </div>
            </div>

            {/* Risk bar */}
            <div className="mt-5 pt-4 border-t border-amber-800/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Risk Level</span>
                <span className="text-sm font-bold text-amber-300 tabular-nums">{VERDICT.score}/100</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${VERDICT.score}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-600">Safe</span>
                <span className="text-[9px] text-slate-600">Definite Scam</span>
              </div>
            </div>
          </div>

          {/* Do NOT section */}
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

          {/* Findings accordion */}
          {[
            { id: "flags", label: "Red Flags", count: RED_FLAGS.length, color: "text-red-400", icon: Flag, items: RED_FLAGS, sev: "high" },
            { id: "watch", label: "Watch Out", count: WATCH_ITEMS.length, color: "text-amber-400", icon: AlertTriangle, items: WATCH_ITEMS, sev: "medium" },
            { id: "safe",  label: "Looks OK",  count: SAFE_ITEMS.length,  color: "text-emerald-400", icon: CheckCircle2, items: SAFE_ITEMS, sev: "low" },
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
                      <p className="text-sm font-semibold text-slate-200 mb-1.5">{item.title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Verify section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
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

          <div className="flex items-center gap-1.5 text-[10px] text-slate-700 justify-center pb-2">
            <Shield className="w-3 h-3" /> Methodology reviewed by licensed attorneys
          </div>
        </div>
      </div>
    </div>
  )
}
