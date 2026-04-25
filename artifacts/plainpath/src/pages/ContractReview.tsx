import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Scale, UploadCloud, AlertCircle, Copy, Check,
  ChevronDown, ArrowLeft, FileText,
  ShieldAlert, AlertTriangle, CheckCircle2, X as XIcon,
  Lock, ClipboardList, Mail, ShieldCheck,
  Camera, Download, Clock, ArrowRight,
  Link as LinkIcon, Type, Zap, Loader2,
  Info, CheckCheck, ChevronRight, RotateCcw,
  DollarSign, CalendarClock, Users2, Search,
} from "lucide-react"
import { useLocation, useSearch } from "wouter"
import { getApiBaseUrl } from "@/lib/api"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { beforeRunContractReview, UsageLimitError } from "@/lib/analysisGate"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeModal from "@/components/UpgradeModal"
import { DocumentScanScreen } from "@/components/DocumentScanScreen"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClauseResult {
  id: string
  text: string
  rating: "fair" | "watch-out" | "red-flag"
  explanation: string
  whyUnfair: string | null
  negotiationLanguage: string | null
  exitGuidance: string | null
}

interface ReviewResult {
  overallScore: number
  verdict: string
  summary: string
  clauses: ClauseResult[]
  missingProtections: string[]
  preSigningChecklist: string[]
  reviewedAt: string
  docText?: string
  scanQuality?: "good" | "poor"
}

interface DocSection {
  id: string
  title: string
  content: string
}

type ReviewState = "empty" | "processing" | "completed" | "lowconf" | "error"
type MobileTab = "review" | "document"

// ─── Demo data ────────────────────────────────────────────────────────────────

const REVIEW_DEMOS: Array<{
  id: string; label: string; meta: string
  icon: React.ComponentType<{ className?: string }>
  color: string; bg: string; data: ReviewResult
}> = [
  {
    id: "freelance-design",
    label: "Freelance Design Agreement",
    meta: "3 red flags · Score 32",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    data: {
      overallScore: 32,
      verdict: "Do not sign without significant revisions",
      summary: "This freelance design agreement is heavily weighted in the client's favour. Three clauses pose serious legal and financial risk: perpetual IP assignment before payment, uncapped revision rounds, and a kill-fee waiver. Push back on all three before signing.",
      reviewedAt: new Date().toISOString(),
      clauses: [
        { id: "ip-assign", rating: "red-flag", text: "All work product, deliverables, and creative materials produced under this Agreement shall be the sole and exclusive property of the Client immediately upon creation, regardless of payment status.", explanation: "IP transfers to the client the moment you create anything — even if they never pay you. You lose all leverage to withhold files until you're paid.", whyUnfair: "Industry standard is that IP transfers only upon receipt of full payment. Immediate transfer removes the freelancer's primary leverage.", negotiationLanguage: "\"All intellectual property rights in the deliverables shall transfer to Client only upon Client's receipt and clearance of payment in full. Until such time, Freelancer retains full ownership and grants Client a limited, non-exclusive licence to review materials.\"", exitGuidance: "This is a dealbreaker clause. Do not sign without changing the payment-trigger condition." },
        { id: "revisions", rating: "red-flag", text: "Client may request unlimited revisions during the project lifecycle at no additional cost to Client.", explanation: "Unlimited, unpaid revision rounds can turn a fixed-fee project into an indefinite obligation. There is no cap, no definition of what constitutes a revision, and no time limit.", whyUnfair: "Without a defined revision scope, clients can keep requesting changes indefinitely. Standard contracts cap revisions at 2–3 rounds.", negotiationLanguage: "\"This Agreement includes up to two (2) rounds of minor revisions per deliverable. Additional revision rounds will be billed at Freelancer's standard hourly rate of $[RATE]/hr.\"", exitGuidance: "Negotiate a specific revision limit and define what counts as a revision vs. a new scope of work." },
        { id: "kill-fee", rating: "red-flag", text: "In the event Client cancels this project for any reason, Freelancer shall not be entitled to any compensation for work completed to date.", explanation: "If the client cancels mid-project, you receive nothing — even for completed work. This is an extreme clause rarely seen in legitimate freelance agreements.", whyUnfair: "Standard practice is a kill fee of 25–50% of the remaining project value, plus payment for all work completed. This clause provides zero protection.", negotiationLanguage: "\"If Client cancels this Agreement after work has commenced, Client shall pay (a) 100% of fees for all deliverables completed, and (b) a kill fee equal to 25% of the remaining project value to compensate for lost opportunity.\"", exitGuidance: "Do not sign this clause. Walk away or require a kill-fee provision." },
        { id: "payment-30", rating: "watch-out", text: "Client shall remit payment within thirty (30) days of receipt of Freelancer's invoice.", explanation: "Net-30 payment terms are common but mean you wait a month for payment. Negotiate net-14 or require a deposit upfront.", whyUnfair: "30-day terms are standard but unfavourable for small freelancers. Many clients push past 30 days without penalty.", negotiationLanguage: "\"Payment is due within fourteen (14) days of invoice receipt. Invoices unpaid after 14 days shall accrue interest at 1.5% per month.\"", exitGuidance: null },
        { id: "governing-law", rating: "fair", text: "This Agreement shall be governed by the laws of the State of California.", explanation: "A standard governing law clause. California has well-developed freelance contract law.", whyUnfair: null, negotiationLanguage: null, exitGuidance: null },
        { id: "confidentiality", rating: "fair", text: "Each party agrees to keep the other's confidential information private and not disclose it to third parties without prior written consent.", explanation: "A mutual NDA clause that protects both sides equally. This is fair and standard.", whyUnfair: null, negotiationLanguage: null, exitGuidance: null },
      ],
      missingProtections: ["Late payment interest clause — no penalty for delayed payment", "Scope creep / change order process — what counts as 'new work'?", "Portfolio/credit clause — are you allowed to show this work?", "Termination for convenience procedure — unclear process if you need to exit"],
      preSigningChecklist: ["Confirm IP transfers only on full payment — not on creation", "Negotiate a cap on revision rounds (2–3 rounds is standard)", "Add a kill fee equal to 25–50% of remaining project value", "Require a 30–50% deposit before starting any work", "Confirm you can list this project in your portfolio", "Add a 1.5%/month late payment interest clause"],
    },
  },
  {
    id: "apartment-lease",
    label: "Apartment Lease Agreement",
    meta: "2 red flags · Score 51",
    icon: ShieldAlert,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    data: {
      overallScore: 51,
      verdict: "Review carefully — some clauses require negotiation",
      summary: "This residential lease has two clauses that are either uncommon or potentially unlawful in several states: a broad entry-without-notice provision and automatic lease renewal with no written notice. The remaining terms are reasonably standard for a residential tenancy.",
      reviewedAt: new Date().toISOString(),
      clauses: [
        { id: "entry-without-notice", rating: "red-flag", text: "Landlord reserves the right to enter the premises at any time for inspection, repairs, or other purposes without prior notice to Tenant.", explanation: "Most U.S. states require landlords to provide 24–48 hours' written notice before entering (except in true emergencies). A blanket no-notice entry clause may be unenforceable but can still be used to harass tenants.", whyUnfair: "This violates tenant privacy rights in most jurisdictions. Even if unenforceable, a landlord citing it could create a hostile environment.", negotiationLanguage: "\"Landlord shall provide Tenant with at least twenty-four (24) hours' written or electronic notice before entering the premises for non-emergency purposes. Emergency entry is permitted without notice only if there is an imminent threat to property or safety.\"", exitGuidance: "Check your state's landlord-entry laws. In CA, NY, WA, and most others, 24-hour notice is required by statute regardless of lease language." },
        { id: "auto-renewal", rating: "red-flag", text: "This Lease shall automatically renew for successive one-year terms unless Tenant provides written notice of non-renewal at least ninety (90) days prior to the expiration date.", explanation: "A 90-day notice window is unusually long — 30–60 days is standard. Missing this window could lock you into another full year of rent even if your circumstances change.", whyUnfair: "90 days is almost a full season in advance. Most tenants don't track lease end dates that far ahead, making this clause an inadvertent trap.", negotiationLanguage: "\"This Lease shall automatically renew on a month-to-month basis unless either party provides written notice of non-renewal at least thirty (30) days before the expiration date.\"", exitGuidance: "Negotiate this down to 30 or 60 days, or switch to month-to-month auto-renewal." },
        { id: "security-deposit", rating: "watch-out", text: "Tenant shall pay a security deposit equal to two (2) months' rent, to be returned within thirty (30) days of Lease termination minus any deductions for damages or unpaid rent.", explanation: "A two-month security deposit is on the high end in many markets, though legal in most states. Confirm your state's security deposit cap (e.g., California limits it to 2 months for unfurnished units).", whyUnfair: "Two months is at the legal maximum in several states. The 30-day return window is standard but confirm your state's specific requirement.", negotiationLanguage: null, exitGuidance: null },
        { id: "pet-clause", rating: "watch-out", text: "No pets of any kind are permitted on the premises. Violation of this clause may result in immediate termination of the Lease.", explanation: "While enforceable in general, this clause cannot override your right to an approved emotional support animal (ESA) under the Fair Housing Act if you have a documented disability.", whyUnfair: "Landlords must make reasonable accommodations for ESAs regardless of a no-pet policy. If this applies to you, request a separate ESA addendum.", negotiationLanguage: null, exitGuidance: null },
        { id: "rent-amount", rating: "fair", text: "Tenant shall pay monthly rent of $2,100, due on the first day of each month. A grace period of five (5) days is provided before a late fee of $50 is assessed.", explanation: "Clear rent amount, due date, grace period, and late fee. This clause is well-structured and fair.", whyUnfair: null, negotiationLanguage: null, exitGuidance: null },
        { id: "maintenance", rating: "fair", text: "Landlord is responsible for all structural repairs and maintaining the property in a habitable condition. Tenant is responsible for minor maintenance and keeping the unit clean.", explanation: "A balanced maintenance split that aligns with the implied warranty of habitability in most states.", whyUnfair: null, negotiationLanguage: null, exitGuidance: null },
      ],
      missingProtections: ["Move-in inspection checklist — no documented baseline for damage comparison", "Lease break clause — no defined penalty if you need to exit early", "Utility responsibility — unclear who pays which utilities"],
      preSigningChecklist: ["Negotiate the entry-without-notice clause to require 24-hour written notice", "Change auto-renewal notice from 90 days to 30–60 days", "Verify your state's security deposit cap — confirm 2 months is legal", "Complete a written move-in inspection form and keep a copy", "Document all pre-existing damage with photos on move-in day", "Clarify which utilities are included in rent before signing"],
    },
  },
  {
    id: "contractor-nda",
    label: "Independent Contractor NDA",
    meta: "1 red flag · Score 67",
    icon: Lock,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    data: {
      overallScore: 67,
      verdict: "Mostly fair — one clause needs revision",
      summary: "This NDA is largely balanced and uses standard confidentiality language. One clause — an indefinite confidentiality term with no sunset date — is overly broad and may hinder your future work. The non-solicitation scope is narrow and reasonable.",
      reviewedAt: new Date().toISOString(),
      clauses: [
        { id: "indefinite-conf", rating: "red-flag", text: "Receiving Party's obligations of confidentiality shall survive the termination of this Agreement and shall continue in perpetuity with respect to all Confidential Information.", explanation: "A perpetual confidentiality obligation with no sunset clause is overly broad and, in many jurisdictions, may be unenforceable. It can prevent you from discussing industry knowledge you naturally develop over time.", whyUnfair: "Perpetual NDAs are increasingly disfavoured by courts, especially for general know-how. Standard is 2–5 years for trade secrets.", negotiationLanguage: "\"Receiving Party's obligations of confidentiality shall continue for three (3) years following termination of this Agreement, except for information that constitutes a trade secret under applicable law, which shall be protected for as long as it qualifies as a trade secret.\"", exitGuidance: "Push for a 2–5 year term with a trade-secret carve-out. A perpetual obligation is a significant career risk." },
        { id: "definition", rating: "watch-out", text: "Confidential Information means any information disclosed by Disclosing Party to Receiving Party, whether oral, written, or in any other form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.", explanation: "The phrase 'reasonably should be understood to be confidential' is broad. Without clearer boundaries, almost any information you receive could be treated as confidential.", whyUnfair: "Overly broad definitions create ambiguity. Ask for exclusions for information you already knew, independently developed, or that becomes publicly available.", negotiationLanguage: "\"Confidential Information does not include information that: (a) is or becomes publicly known through no fault of Receiving Party; (b) was already known to Receiving Party at the time of disclosure; or (c) is independently developed by Receiving Party without use of Confidential Information.\"", exitGuidance: null },
        { id: "non-solicit", rating: "fair", text: "During the term of this Agreement and for twelve (12) months thereafter, Receiving Party shall not solicit the employees or clients of Disclosing Party with whom Receiving Party had direct contact.", explanation: "A non-solicitation clause limited to people you directly worked with, for 12 months, is narrowly scoped and reasonable.", whyUnfair: null, negotiationLanguage: null, exitGuidance: null },
        { id: "return-of-info", rating: "fair", text: "Upon termination of this Agreement, Receiving Party shall promptly return or destroy all Confidential Information and certify in writing that it has done so.", explanation: "A standard return/destroy clause. The written certification requirement is reasonable and protects both parties.", whyUnfair: null, negotiationLanguage: null, exitGuidance: null },
      ],
      missingProtections: ["Mutual disclosure protection — only the contractor is bound; company's obligations are unspecified", "Injunctive relief carve-out — no provision for emergency court relief if needed"],
      preSigningChecklist: ["Change perpetual confidentiality to a 3–5 year term with a trade-secret carve-out", "Add standard exclusions to the Confidential Information definition", "Confirm whether this is mutual or one-way — both parties should have obligations", "Check the non-solicitation scope is limited to direct contacts only", "Keep a signed copy of the final agreement for your records"],
    },
  },
]

// ─── Helper functions ──────────────────────────────────────────────────────────

function parseDocSections(text: string): DocSection[] {
  if (!text || text.trim().length < 30) return []
  const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 15)
  return paras.slice(0, 40).map((p, i) => {
    const lines = p.split("\n")
    const first = lines[0].trim()
    const isHeader = first.length < 100 && (
      /^[A-Z][A-Z\s\d.,–\-:()]+$/.test(first) ||
      /^\d+[.)]\s/.test(first) ||
      /^(SECTION|ARTICLE|CLAUSE|SCHEDULE|EXHIBIT|§)\s/i.test(first) ||
      /^[A-Z][a-z]+(\s[A-Z][a-z]+)*:$/.test(first)
    )
    return {
      id: `sec-${i}`,
      title: isHeader ? first : `Section ${i + 1}`,
      content: isHeader ? (lines.slice(1).join("\n").trim() || first) : p,
    }
  }).filter(s => s.content.trim().length > 0)
}

function findBestSection(evidence: string, sections: DocSection[]): string | null {
  if (!evidence || !sections.length) return null
  const words = evidence.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  if (!words.length) return null
  let bestId: string | null = null
  let bestScore = 0
  for (const s of sections) {
    const text = `${s.title} ${s.content}`.toLowerCase()
    const score = words.filter(w => text.includes(w)).length
    if (score > bestScore) { bestScore = score; bestId = s.id }
  }
  return bestScore >= 2 ? bestId : null
}

function chipLabel(clause: ClauseResult): string {
  const t = clause.text.trim()
  return t.length > 22 ? t.slice(0, 20) + "…" : t
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400"
  if (score >= 60) return "text-blue-400"
  if (score >= 40) return "text-amber-400"
  return "text-red-400"
}

function scorePillStyle(score: number) {
  if (score >= 80) return "bg-emerald-600/12 border-emerald-500/22 text-emerald-300"
  if (score >= 60) return "bg-blue-600/12 border-blue-500/22 text-blue-300"
  if (score >= 40) return "bg-amber-600/12 border-amber-500/22 text-amber-300"
  return "bg-red-600/12 border-red-500/22 text-red-300"
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-blue-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-500"
}

function riskHeaderLabel(score: number): string {
  if (score >= 80) return "Low risk"
  if (score >= 60) return "Some concerns"
  if (score >= 40) return "Review required"
  return "High risk"
}

function formatAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
  } catch { return iso }
}

function buildReviewText(result: ReviewResult): string {
  const lines: string[] = [
    `CONTRACT REVIEW — PLAINPATH`,
    `Verdict: ${result.verdict}`,
    `Fairness Score: ${result.overallScore}/100`,
    ``,
    `SUMMARY`,
    result.summary,
    ``,
  ]
  const redFlags = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")
  if (redFlags.length) {
    lines.push(`RED FLAGS (${redFlags.length})`)
    redFlags.forEach(c => { lines.push(`• ${c.text}`); lines.push(`  → ${c.explanation}`); if (c.negotiationLanguage) lines.push(`  Suggested: ${c.negotiationLanguage}`) })
    lines.push(``)
  }
  if (watchOuts.length) {
    lines.push(`WATCH OUTS (${watchOuts.length})`)
    watchOuts.forEach(c => { lines.push(`• ${c.text}`) })
    lines.push(``)
  }
  if (result.missingProtections?.length) {
    lines.push(`MISSING PROTECTIONS`)
    result.missingProtections.forEach(m => lines.push(`• ${m}`))
    lines.push(``)
  }
  if (result.preSigningChecklist?.length) {
    lines.push(`BEFORE YOU SIGN`)
    result.preSigningChecklist.forEach((item, i) => lines.push(`${i + 1}. ${item}`))
    lines.push(``)
  }
  lines.push(`Not legal advice. Review with a qualified attorney before signing.`)
  return lines.join("\n")
}

function groupClausesByType(clauses: ClauseResult[]) {
  const payKw = /payment|pay|fee|price|cost|rate|invoice|salary|compensation|\$/i
  const termKw = /terminat|cancel|renew|notice|expir|end of term/i
  const payment: ClauseResult[] = []
  const termination: ClauseResult[] = []
  const obligations: ClauseResult[] = []
  const usedIds = new Set<string>()
  clauses.forEach(c => {
    const hay = `${c.text} ${c.explanation}`.toLowerCase()
    if (payKw.test(hay)) { payment.push(c); usedIds.add(c.id) }
  })
  clauses.forEach(c => {
    if (!usedIds.has(c.id) && termKw.test(`${c.text} ${c.explanation}`.toLowerCase())) { termination.push(c); usedIds.add(c.id) }
  })
  clauses.forEach(c => { if (!usedIds.has(c.id)) obligations.push(c) })
  return { payment, termination, obligations }
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

function SLabel({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-white/28 shrink-0">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/26 flex-1">{children}</p>
      {right}
    </div>
  )
}

function SourceChip({ id, label, active, onClick }: { id: string; label: string; active?: boolean; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium cursor-pointer transition-all whitespace-nowrap ${
        active
          ? "bg-amber-500/30 border border-amber-400/55 text-amber-100 ring-1 ring-amber-500/35 shadow-[0_0_8px_rgba(245,158,11,0.22)]"
          : "bg-amber-600/10 border border-amber-500/18 text-amber-300/75 hover:bg-amber-500/20 hover:text-amber-200"
      }`}
    >
      {active && <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse shrink-0" />}
      {label}
    </button>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000) }) }}
      className="inline-flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.05]"
    >
      {done ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {done ? "Copied" : "Copy"}
    </button>
  )
}

// ─── CollapsedSection (interactive accordion) ─────────────────────────────────

const CLAUSE_RATING_STYLES = {
  "red-flag":  { dot: "bg-red-400", text: "text-red-300/85", badge: "bg-red-500/10 border-red-500/20 text-red-300/70" },
  "watch-out": { dot: "bg-amber-400", text: "text-amber-300/80", badge: "bg-amber-500/10 border-amber-500/20 text-amber-300/70" },
  "fair":      { dot: "bg-emerald-400", text: "text-white/50", badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300/70" },
}

function ClauseMini({ clause, onChipClick, activeChipId, sections }: {
  clause: ClauseResult
  onChipClick: (id: string, evidence: string) => void
  activeChipId: string | null
  sections: DocSection[]
}) {
  const [open, setOpen] = useState(false)
  const [negLoading, setNegLoading] = useState(false)
  const [negEmail, setNegEmail] = useState<string | null>(null)
  const [negError, setNegError] = useState<string | null>(null)
  const [negCopied, setNegCopied] = useState(false)
  const sty = CLAUSE_RATING_STYLES[clause.rating]
  const chipId = `mini-${clause.id}`
  const isActive = activeChipId === chipId

  async function handleDraftEmail() {
    setNegLoading(true); setNegError(null)
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/contracts/negotiate-clause`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clauseText: clause.text, explanation: clause.explanation, whyUnfair: clause.whyUnfair, negotiationLanguage: clause.negotiationLanguage }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Failed")
      setNegEmail(data.emailBody)
    } catch (e) { setNegError(e instanceof Error ? e.message : "Failed") } finally { setNegLoading(false) }
  }

  function copyNeg() { if (negEmail) { navigator.clipboard.writeText(negEmail).catch(() => {}); setNegCopied(true); setTimeout(() => setNegCopied(false), 2000) } }

  return (
    <div className={`rounded-xl border transition-all ${isActive ? "border-amber-500/30 bg-amber-500/[0.04]" : "border-white/[0.06] bg-white/[0.01]"}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-start gap-2.5 px-3.5 py-3 text-left">
        <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${sty.dot}`} />
        <p className={`text-xs flex-1 leading-snug ${sty.text}`}>{clause.text}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <div onClick={e => { e.stopPropagation(); onChipClick(chipId, clause.text) }}>
            <SourceChip id={chipId} label={clause.id} active={isActive} />
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-white/[0.04] pt-2.5">
              <p className="text-[11px] text-white/48 leading-relaxed">{clause.explanation}</p>
              {clause.whyUnfair && (
                <div className="rounded-lg border border-amber-500/12 bg-amber-500/[0.03] px-2.5 py-2">
                  <p className="text-[9px] text-amber-300/45 uppercase tracking-widest font-semibold mb-1">Why it's a concern</p>
                  <p className="text-[11px] text-amber-200/55 leading-relaxed">{clause.whyUnfair}</p>
                </div>
              )}
              {clause.negotiationLanguage && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-semibold">Suggested revision</p>
                    <CopyBtn text={clause.negotiationLanguage} />
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed font-mono whitespace-pre-wrap">{clause.negotiationLanguage}</p>
                </div>
              )}
              {clause.exitGuidance && (
                <div className="rounded-lg border border-white/[0.05] px-2.5 py-2">
                  <p className="text-[9px] text-white/22 uppercase tracking-widest font-semibold mb-1">Already signed?</p>
                  <p className="text-[11px] text-white/38 leading-relaxed">{clause.exitGuidance}</p>
                </div>
              )}
              {clause.rating !== "fair" && (
                <div>
                  {!negEmail ? (
                    <button onClick={handleDraftEmail} disabled={negLoading} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300/60 border border-amber-500/15 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50">
                      {negLoading ? <><Loader2 className="w-3 h-3 animate-spin" />Drafting…</> : <><Mail className="w-3 h-3" />Draft negotiation email</>}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-white/28 uppercase tracking-widest font-semibold">Negotiation email draft</p>
                        <div className="flex items-center gap-1.5">
                          <button onClick={copyNeg} className="inline-flex items-center gap-1 text-[10px] text-white/30 hover:text-white/55 transition-colors">
                            {negCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {negCopied ? "Copied" : "Copy"}
                          </button>
                          <button onClick={() => setNegEmail(null)} className="text-white/20 hover:text-white/40 transition-colors"><XIcon className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/45 leading-relaxed whitespace-pre-wrap">{negEmail}</p>
                    </div>
                  )}
                  {negError && <p className="text-[10px] text-red-400 mt-1">{negError}</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CollapsedSection({ icon, title, badge, badgeColor = "default", children }: {
  icon: React.ReactNode; title: string; badge: string; badgeColor?: "default" | "amber" | "red"; children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const badgeCls = badgeColor === "red" ? "bg-red-500/10 border-red-500/18 text-red-300/60" : badgeColor === "amber" ? "bg-amber-500/10 border-amber-500/18 text-amber-300/60" : "bg-white/[0.05] border-white/[0.08] text-white/28"
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.025] transition-colors text-left">
        <span className="text-white/20 shrink-0">{icon}</span>
        <p className="text-white/38 text-xs font-medium flex-1">{title}</p>
        <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${badgeCls}`}>{badge}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/18 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="border-t border-white/[0.04] px-3.5 py-3.5 flex flex-col gap-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Contract Doc Viewer (left panel) ─────────────────────────────────────────

function ContractDocViewer({
  sections, activeChipId, activeEvidence, highlightSectionId, onDismiss, sectionRefs, isLowConf, docName, riskyCount,
}: {
  sections: DocSection[]; activeChipId: string | null; activeEvidence: string | null
  highlightSectionId: string | null; onDismiss: () => void; sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  isLowConf?: boolean; docName?: string; riskyCount?: number
}) {
  return (
    <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
      {/* Tool identity row */}
      <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 shrink-0 bg-white/[0.01]">
        <Scale className="w-3 h-3 text-amber-400/40 shrink-0" />
        <span className="text-[10px] text-white/28 font-medium flex-1">Contract Review</span>
        {isLowConf ? (
          <span className="h-4 px-1.5 rounded border border-amber-500/28 bg-amber-500/10 text-amber-300/75 text-[9px] font-medium">Partial scan</span>
        ) : riskyCount != null && riskyCount > 0 ? (
          <span className="h-4 px-1.5 rounded border border-red-500/28 bg-red-500/10 text-red-300/75 text-[9px] font-medium">
            {riskyCount} risk{riskyCount !== 1 ? "s" : ""} found
          </span>
        ) : riskyCount === 0 ? (
          <span className="h-4 px-1.5 rounded border border-emerald-500/28 bg-emerald-500/10 text-emerald-300/75 text-[9px] font-medium">Looks fair</span>
        ) : null}
      </div>
      {/* File toolbar */}
      <div className="h-9 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
        <FileText className={`w-3.5 h-3.5 shrink-0 ${isLowConf ? "text-amber-400/50" : "text-amber-400/55"}`} />
        <span className="text-white/40 text-xs flex-1 truncate">{docName ?? "Contract document"}</span>
        {sections.length > 0 && <span className="text-white/18 text-xs shrink-0">{sections.length} sections</span>}
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <div className="flex items-center gap-0.5">
          {["Fit", "75%", "100%"].map((z, i) => (
            <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium transition-colors ${i === 1 ? "bg-white/[0.07] text-white/55" : "text-white/22 hover:text-white/45"}`}>{z}</button>
          ))}
        </div>
      </div>

      {activeChipId && (
        <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-amber-500/28 bg-amber-500/[0.07] px-3 py-2 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-200/85 text-[10px] font-medium truncate">
              {activeEvidence ? `Clause: ${activeEvidence.length > 60 ? activeEvidence.slice(0, 60) + "…" : activeEvidence}` : "Relevant section highlighted below"}
            </p>
            <p className="text-amber-300/35 text-[9px]">Jumped from contract review panel — matching section highlighted below</p>
          </div>
          <button onClick={onDismiss} className="text-white/20 hover:text-white/45 shrink-0 transition-colors"><XIcon className="w-3 h-3" /></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {sections.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <FileText className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-white/22 text-sm font-medium mb-1">Document content not available</p>
            <p className="text-white/15 text-xs max-w-xs">Paste contract text or upload a text-based PDF to see it here alongside the review.</p>
          </div>
        ) : (
          sections.map((section, idx) => {
            const isHighlighted = highlightSectionId === section.id
            return (
              <div
                key={section.id}
                ref={el => { sectionRefs.current[section.id] = el }}
                className={`w-full rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${
                  isHighlighted
                    ? "border-amber-500/45 bg-amber-500/[0.06] ring-1 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                    : isLowConf ? "border-amber-500/12 bg-amber-500/[0.015]"
                    : "border-white/[0.05] bg-white/[0.015]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-[9px] font-mono ${isHighlighted ? "text-amber-300/60" : "text-white/18"}`}>
                    {section.title !== `Section ${idx + 1}` ? section.title : `Section ${idx + 1}`}
                  </span>
                  {isHighlighted && (
                    <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-amber-500/25 border border-amber-500/35">
                      <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-amber-200/75 text-[9px]">Source</span>
                    </div>
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed whitespace-pre-line ${isHighlighted ? "text-white/65" : "text-white/32"}`}>
                  {section.content}
                </p>
                {isHighlighted && activeEvidence && (
                  <div className="mt-1.5 rounded-lg border border-amber-500/18 bg-amber-500/[0.06] px-2.5 py-1.5">
                    <p className="text-amber-200/60 text-[9px] leading-relaxed line-clamp-3">"{activeEvidence}"</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {sections.length > 0 && (
        <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
          <span className="text-white/20 text-xs">
            {highlightSectionId
              ? `Section ${sections.findIndex(s => s.id === highlightSectionId) + 1} of ${sections.length}`
              : `${sections.length} section${sections.length !== 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-1">
            {sections.slice(0, 8).map((s, i) => (
              <button
                key={s.id}
                onClick={() => { const r = sectionRefs.current[s.id]; if (r) r.scrollIntoView({ behavior: "smooth", block: "center" }) }}
                className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center transition-colors ${highlightSectionId === s.id ? "bg-amber-600 text-white" : "text-white/22 hover:text-white/45 hover:bg-white/[0.05]"}`}
              >{i + 1}</button>
            ))}
          </div>
          <span className="text-white/14 text-[10px]">Jump to section</span>
        </div>
      )}
    </div>
  )
}

// ─── Contract Intel Panel (right panel, completed) ────────────────────────────

function ContractIntelPanel({
  result, onChipClick, activeChipId, sections, isLowConf, onReset,
}: {
  result: ReviewResult
  onChipClick: (chipId: string, evidence: string) => void
  activeChipId: string | null
  sections: DocSection[]
  isLowConf?: boolean
  onReset: () => void
}) {
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({})
  const redFlags = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")
  const fairClauses = result.clauses.filter(c => c.rating === "fair")
  const riskyCount = redFlags.length + watchOuts.length
  const topRisks = [...redFlags, ...watchOuts].slice(0, 6)
  const { payment, termination, obligations } = groupClausesByType(result.clauses)

  const riskPillStyle = redFlags.length > 0
    ? "bg-red-600/12 border-red-500/22 text-red-300"
    : watchOuts.length > 0 ? "bg-amber-600/12 border-amber-500/22 text-amber-300"
    : "bg-emerald-600/12 border-emerald-500/22 text-emerald-300"

  const urgentIndices = new Set(
    result.preSigningChecklist
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => /confirm|negotiate|verify|check|add|change/i.test(t))
      .slice(0, 2)
      .map(({ i }) => i)
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
      <div className="p-5 flex flex-col gap-4">

        {/* Doc identity */}
        <div className="flex items-start gap-3 pb-3.5 border-b border-white/[0.05]">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${redFlags.length > 0 ? "bg-red-600/10 border-red-500/18" : watchOuts.length > 0 ? "bg-amber-600/10 border-amber-500/18" : "bg-emerald-600/10 border-emerald-500/18"}`}>
            <Scale className={`w-4 h-4 ${redFlags.length > 0 ? "text-red-400/80" : watchOuts.length > 0 ? "text-amber-400/80" : "text-emerald-400/80"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-white/88 text-sm font-semibold">Contract Review</h1>
              {isLowConf && <span className="h-4 px-1.5 rounded border border-amber-500/25 bg-amber-500/10 text-amber-300/80 text-[9px] font-medium">Partial scan</span>}
              {!isLowConf && riskyCount > 0 && <span className="h-4 px-1.5 rounded border border-red-500/25 bg-red-500/10 text-red-300/80 text-[9px] font-medium">Review required</span>}
            </div>
            <p className="text-white/28 text-[10px]">
              {result.verdict}
              {result.reviewedAt ? ` · ${formatAt(result.reviewedAt)}` : ""}
            </p>
          </div>
        </div>

        {/* Low confidence notice */}
        {isLowConf && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <p className="text-amber-300 text-sm font-semibold">Partial contract review — low scan quality</p>
            </div>
            <p className="text-white/58 text-[12px] leading-relaxed">
              PlainPath could review part of this contract, but the scan quality limits review confidence. Results may be incomplete — upload a text-based PDF for a full review.
            </p>
          </div>
        )}

        {/* ── A. Plain-English Summary ── */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <SLabel icon={<FileText className="w-3.5 h-3.5" />}>A. Plain-English Summary</SLabel>
          <p className="text-white/70 text-[12.5px] leading-[1.75]">{result.summary}</p>
          <p className="text-white/22 text-[10px] mt-3 leading-relaxed">Contract review support provided by AI. Not legal advice — verify terms with a qualified attorney before signing.</p>
        </div>

        {/* ── B. Risk & Confidence ── */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <SLabel icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />}>B. Risk &amp; Confidence</SLabel>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <div className={`h-7 px-2.5 rounded-full border flex items-center gap-1.5 ${riskPillStyle}`}>
              <AlertTriangle className="w-3 h-3" />
              <span className="text-[11px] font-semibold">{riskHeaderLabel(result.overallScore)}</span>
            </div>
            <div className={`h-7 px-2.5 rounded-full border flex items-center gap-1.5 ${scorePillStyle(result.overallScore)}`}>
              <span className={`text-[11px] font-bold ${scoreColor(result.overallScore)}`}>{result.overallScore}</span>
              <span className="text-[10px] text-white/35">/ 100 fairness</span>
            </div>
            {redFlags.length > 0 && (
              <span className="h-6 px-2 rounded-full border border-red-500/20 bg-red-500/10 text-red-300 text-[9px] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />{redFlags.length} red flag{redFlags.length !== 1 ? "s" : ""}
              </span>
            )}
            {watchOuts.length > 0 && (
              <span className="h-6 px-2 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300 text-[9px] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />{watchOuts.length} watch-out{watchOuts.length !== 1 ? "s" : ""}
              </span>
            )}
            {result.missingProtections?.length > 0 && (
              <span className="h-6 px-2 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300 text-[9px] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />{result.missingProtections.length} missing protection{result.missingProtections.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.overallScore}%` }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${scoreBarColor(result.overallScore)}`}
            />
          </div>
          <div className="flex items-start gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 mt-3">
            <Info className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
            <p className="text-white/28 text-[10px] leading-relaxed">
              Fairness score reflects clause balance and completeness of reader protections. These are risk indicators to verify — not legal determinations.
            </p>
          </div>
        </div>

        {/* ── C. Key Contract Risks ── */}
        {topRisks.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <SLabel
              icon={<ShieldAlert className="w-3.5 h-3.5 text-red-400/60" />}
              right={
                <span className="h-5 px-2 rounded-full text-[9px] font-medium border border-amber-500/25 bg-amber-500/10 text-amber-300">
                  {topRisks.length} term{topRisks.length !== 1 ? "s" : ""} to verify
                </span>
              }
            >
              C. Key Contract Risks
            </SLabel>
            <div className="flex flex-col gap-2.5">
              {topRisks.map((clause) => {
                const chipId = `risk-${clause.id}`
                const isActive = activeChipId === chipId
                const isFlagStyle = clause.rating === "red-flag"
                return (
                  <div
                    key={clause.id}
                    className={`rounded-xl border p-3.5 transition-all duration-200 ${
                      isFlagStyle ? "border-red-500/22 bg-red-500/[0.04]" : "border-amber-500/15 bg-amber-500/[0.03]"
                    } ${isActive ? "ring-1 ring-amber-500/20" : ""}`}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${isFlagStyle ? "bg-red-400" : "bg-amber-400"}`} />
                      <p className={`text-xs font-medium flex-1 leading-snug ${isFlagStyle ? "text-red-300" : "text-amber-300"}`}>{clause.text}</p>
                      <SourceChip id={chipId} label={clause.id} active={isActive} onClick={() => onChipClick(chipId, clause.text)} />
                    </div>
                    <p className="text-white/38 text-[11px] leading-relaxed ml-4 mb-2">{clause.explanation}</p>
                    {clause.whyUnfair && (
                      <p className="text-white/28 text-[10px] leading-relaxed ml-4 italic">Risk indicator: {clause.whyUnfair}</p>
                    )}
                    {clause.negotiationLanguage && (
                      <div className="ml-4 mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] text-white/25 uppercase tracking-widest font-semibold">Suggested revision</p>
                          <CopyBtn text={clause.negotiationLanguage} />
                        </div>
                        <p className="text-[10px] text-white/38 leading-relaxed font-mono line-clamp-3">{clause.negotiationLanguage}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── D. Required Next Steps ── */}
        {result.preSigningChecklist.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <SLabel
              icon={<ClipboardList className="w-3.5 h-3.5 text-white/30" />}
              right={
                urgentIndices.size > 0 ? (
                  <span className="h-5 px-2 rounded-full text-[9px] font-medium border border-amber-500/22 bg-amber-500/10 text-amber-300">
                    {urgentIndices.size} priority
                  </span>
                ) : undefined
              }
            >
              D. Required Next Steps
            </SLabel>
            <p className="text-white/25 text-[10px] mb-3">Work through these before signing — terms to verify specific to this contract.</p>
            <div className="flex flex-col gap-2">
              {result.preSigningChecklist.map((item, i) => {
                const id = `chk-${i}`
                const done = checklistDone[id] ?? false
                const isUrgent = urgentIndices.has(i)
                return (
                  <button
                    key={i}
                    onClick={() => setChecklistDone(prev => ({ ...prev, [id]: !prev[id] }))}
                    className="flex items-start gap-2.5 text-left group"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${done ? "bg-emerald-600/25 border-emerald-500/40" : "border-white/15 group-hover:border-white/25"}`}>
                      {done && <CheckCheck className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                    <p className={`text-[11px] leading-relaxed flex-1 transition-colors ${done ? "line-through text-white/20" : "text-white/58"}`}>{item}</p>
                    {isUrgent && !done && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── E. Source Traceability ── */}
        {result.clauses.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <SLabel icon={<Search className="w-3.5 h-3.5 text-white/28" />}>E. Source Traceability</SLabel>
            <p className="text-white/22 text-[10px] mb-3">Click a clause source chip to jump to the matching section in the document viewer.</p>
            <div className="flex flex-col gap-2">
              {result.clauses.filter(c => c.rating !== "fair").map((clause) => {
                const chipId = `trace-${clause.id}`
                const isActive = activeChipId === chipId
                return (
                  <div key={clause.id} className="flex items-start gap-2.5">
                    <div className={`w-1 h-1 rounded-full shrink-0 mt-2 ${clause.rating === "red-flag" ? "bg-red-400/50" : "bg-amber-400/50"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/28 text-[10px] leading-relaxed italic mb-1">"{clause.text.length > 80 ? clause.text.slice(0, 80) + "…" : clause.text}"</p>
                      <SourceChip id={chipId} label={clause.id} active={isActive} onClick={() => onChipClick(chipId, clause.text)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Collapsed: Obligations & Responsibilities ── */}
        {obligations.length > 0 && (
          <CollapsedSection icon={<Users2 className="w-3.5 h-3.5" />} title="Obligations &amp; Responsibilities" badge={`${obligations.length} clause${obligations.length !== 1 ? "s" : ""}`} badgeColor={obligations.some(c => c.rating !== "fair") ? "amber" : "default"}>
            {obligations.map(c => <ClauseMini key={c.id} clause={c} onChipClick={onChipClick} activeChipId={activeChipId} sections={sections} />)}
          </CollapsedSection>
        )}

        {/* ── Collapsed: Payment / Fees / Penalties ── */}
        {payment.length > 0 && (
          <CollapsedSection icon={<DollarSign className="w-3.5 h-3.5" />} title="Payment / Fees / Penalties" badge={`${payment.length} clause${payment.length !== 1 ? "s" : ""}`} badgeColor={payment.some(c => c.rating === "red-flag") ? "red" : payment.some(c => c.rating === "watch-out") ? "amber" : "default"}>
            {payment.map(c => <ClauseMini key={c.id} clause={c} onChipClick={onChipClick} activeChipId={activeChipId} sections={sections} />)}
          </CollapsedSection>
        )}

        {/* ── Collapsed: Termination & Renewal ── */}
        {termination.length > 0 && (
          <CollapsedSection icon={<CalendarClock className="w-3.5 h-3.5" />} title="Termination &amp; Renewal" badge={`${termination.length} clause${termination.length !== 1 ? "s" : ""}`} badgeColor={termination.some(c => c.rating === "red-flag") ? "red" : termination.some(c => c.rating === "watch-out") ? "amber" : "default"}>
            {termination.map(c => <ClauseMini key={c.id} clause={c} onChipClick={onChipClick} activeChipId={activeChipId} sections={sections} />)}
          </CollapsedSection>
        )}

        {/* ── Collapsed: Missing Protections ── */}
        {result.missingProtections.length > 0 && (
          <CollapsedSection icon={<Lock className="w-3.5 h-3.5" />} title="Missing or Weak Protections" badge={`${result.missingProtections.length} possible missing`} badgeColor="amber">
            {result.missingProtections.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Lock className="w-3 h-3 text-violet-400/60 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/45 leading-relaxed">{item}</p>
              </div>
            ))}
          </CollapsedSection>
        )}

        {/* ── Collapsed: Fair Clauses ── */}
        {fairClauses.length > 0 && (
          <CollapsedSection icon={<CheckCircle2 className="w-3.5 h-3.5" />} title="Fair Clauses" badge={`${fairClauses.length} balanced`}>
            {fairClauses.map(c => <ClauseMini key={c.id} clause={c} onChipClick={onChipClick} activeChipId={activeChipId} sections={sections} />)}
          </CollapsedSection>
        )}

        {/* Footer */}
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-3">
          <div className="flex items-start gap-1.5">
            <Info className="w-3 h-3 text-white/18 shrink-0 mt-0.5" />
            <p className="text-white/22 text-[10px] leading-relaxed">
              Contract review support provided by AI. Results highlight possible risk indicators and terms to verify — they are not legal advice and do not replace review by a qualified attorney.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Processing View ──────────────────────────────────────────────────────────

function ProcessingView({ fileName }: { fileName?: string }) {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden">
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-amber-600 flex items-center justify-center shrink-0">
          <Scale className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold">PlainPath</span>
        <span className="text-white/15 text-[10px] mx-0.5">·</span>
        <span className="text-white/28 text-xs">Contract Review</span>
        {fileName && (
          <>
            <ChevronRight className="w-3 h-3 text-white/15" />
            <span className="text-white/28 text-xs truncate max-w-[160px]">{fileName}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-white/35 text-xs">Reviewing contract…</span>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[57%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 p-3 gap-2.5">
          {[120, 80, 100, 65, 90, 75].map((w, i) => (
            <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 animate-pulse">
              <div className="h-2 rounded-full bg-white/[0.06] mb-3" style={{ width: `${Math.min(w, 60)}%` }} />
              <div className="space-y-1.5">
                <div className="h-1.5 rounded-full bg-white/[0.04]" style={{ width: `${w}%` }} />
                <div className="h-1.5 rounded-full bg-white/[0.04]" style={{ width: `${w * 0.8}%` }} />
                <div className="h-1.5 rounded-full bg-white/[0.04]" style={{ width: `${w * 0.6}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 bg-[#0c0c0f] p-5 flex flex-col gap-4">
          <div className="rounded-xl border border-white/[0.06] p-4 animate-pulse">
            <div className="h-2 rounded-full bg-white/[0.06] mb-3 w-32" />
            <div className="space-y-2">
              <div className="h-1.5 rounded-full bg-white/[0.04] w-full" />
              <div className="h-1.5 rounded-full bg-white/[0.04] w-[85%]" />
              <div className="h-1.5 rounded-full bg-white/[0.04] w-[70%]" />
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] p-4 animate-pulse">
            <div className="h-2 rounded-full bg-white/[0.06] mb-3 w-40" />
            <div className="flex gap-2 mb-3">
              <div className="h-7 w-28 rounded-full bg-white/[0.05]" />
              <div className="h-7 w-20 rounded-full bg-white/[0.05]" />
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.05]" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] p-3.5 animate-pulse">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-white/[0.08] shrink-0 mt-1.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-1.5 rounded-full bg-white/[0.06] w-[80%]" />
                  <div className="h-1.5 rounded-full bg-white/[0.04] w-[60%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Error View ───────────────────────────────────────────────────────────────

function ErrorView({ message, onReset, onPasteInstead }: { message: string; onReset: () => void; onPasteInstead?: () => void }) {
  return (
    <div className="h-screen bg-[#0c0c0f] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-white/85 text-lg font-semibold mb-2">Contract review could not be completed.</h2>
        <p className="text-white/40 text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex flex-col gap-2">
          <button onClick={onReset} className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          {onPasteInstead && (
            <button onClick={onPasteInstead} className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white/75 text-sm transition-colors flex items-center justify-center gap-2">
              Paste contract text instead
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile Tab View ──────────────────────────────────────────────────────────

function MobileWorkspace({
  result, sections, isLowConf, onReset,
}: {
  result: ReviewResult; sections: DocSection[]; isLowConf: boolean; onReset: () => void
}) {
  const [tab, setTab] = useState<MobileTab>("review")
  const [activeChipId, setActiveChipId] = useState<string | null>(null)
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null)
  const [highlightSectionId, setHighlightSectionId] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const handleChipClick = useCallback((chipId: string, evidence: string) => {
    setActiveChipId(chipId); setActiveEvidence(evidence)
    const targetId = findBestSection(evidence, sections)
    setHighlightSectionId(targetId)
    setTab("document")
    setTimeout(() => {
      if (targetId && sectionRefs.current[targetId]) {
        sectionRefs.current[targetId]!.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 80)
  }, [sections])

  const handleDismiss = useCallback(() => {
    setActiveChipId(null); setActiveEvidence(null); setHighlightSectionId(null)
  }, [])
  const redFlags = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")

  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden">
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <button onClick={onReset} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/35 hover:bg-white/[0.06] hover:text-white/65 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Scale className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white/85 text-sm font-semibold leading-tight truncate">Contract Review</p>
        </div>
        <div className={`h-6 px-2 rounded-full border flex items-center gap-1 ${redFlags.length > 0 ? "bg-red-500/10 border-red-500/20 text-red-300" : watchOuts.length > 0 ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"}`}>
          <span className={`text-[10px] font-bold ${scoreColor(result.overallScore)}`}>{result.overallScore}</span>
          <span className="text-[9px] text-white/25">/100</span>
        </div>
      </div>

      <div className="flex border-b border-white/[0.06] shrink-0">
        {(["review", "document"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors capitalize relative ${tab === t ? "text-amber-300" : "text-white/35 hover:text-white/55"}`}
          >
            {t === "review" ? "Review" : "Document"}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-px bg-amber-400" />}
          </button>
        ))}
      </div>

      {tab === "review" ? (
        <div className="flex-1 overflow-y-auto">
          <ContractIntelPanel result={result} onChipClick={handleChipClick} activeChipId={activeChipId} sections={sections} isLowConf={isLowConf} onReset={onReset} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <ContractDocViewer sections={sections} activeChipId={activeChipId} activeEvidence={activeEvidence} highlightSectionId={highlightSectionId} onDismiss={handleDismiss} sectionRefs={sectionRefs} isLowConf={isLowConf} />
        </div>
      )}
    </div>
  )
}

// ─── Empty State Input Form ─────────────────────────────────────────────────────

function EmptyInputForm({
  onResult, onProcessing, onError,
}: {
  onResult: (r: ReviewResult, text: string) => void
  onProcessing: (fileName?: string) => void
  onError: (msg: string, canPaste?: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<"paste" | "upload" | "camera" | "url">("paste")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [redactedNotice, setRedactedNotice] = useState(false)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const { entitlements } = useEntitlements()

  useEffect(() => {
    try {
      const redacted = sessionStorage.getItem("pii_contract_review_text")
      if (redacted) {
        sessionStorage.removeItem("pii_contract_review_text")
        setText(redacted); setRedactedNotice(true); setActiveTab("paste")
      }
    } catch { /* noop */ }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setActiveTab("upload")
  }

  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    if (!f.type.startsWith("image/")) { setCameraError("Only image files are supported."); return }
    if (f.size > 10 * 1024 * 1024) { setCameraError("Photo too large. Try a lower-resolution photo."); return }
    const reader = new FileReader()
    reader.onload = () => { setCapturedImages(prev => [...prev, reader.result as string]); setCameraError(null) }
    reader.onerror = () => setCameraError("Could not read the photo. Please try again.")
    reader.readAsDataURL(f)
    e.target.value = ""
  }

  async function handleUrlImport() {
    const url = urlInput.trim(); if (!url) return
    setUrlLoading(true); setUrlError(null)
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/documents/import-url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) })
      const data = await res.json()
      if (!res.ok) { setUrlError(data?.message ?? "Failed to import. Check the link and try again."); return }
      const extracted: string = data.text ?? ""
      if (!extracted || extracted.length < 30) { setUrlError("Could not extract readable text from this link. Try downloading and uploading the file directly."); return }
      setText(extracted); setActiveTab("paste")
    } catch { setUrlError("Network error — check your connection and try again.") } finally { setUrlLoading(false) }
  }

  async function handleScanReview() {
    if (!capturedImages.length) return
    try { beforeRunContractReview(entitlements?.plan ?? null) } catch (err) {
      if (err instanceof UsageLimitError) { setUpgradeModal(true); return }
    }
    onProcessing()
    try {
      const base = getApiBaseUrl()
      const response = await fetch(`${base}/api/contracts/scan-images`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images: capturedImages }) })
      const data = await response.json() as ReviewResult & { message?: string }
      if (!response.ok) { onError(data.message ?? "Scan failed. Please try again."); return }
      onResult(data, data.docText ?? "")
    } catch { onError("Network error. Please check your connection and try again.") }
  }

  async function handleReview() {
    try { beforeRunContractReview(entitlements?.plan ?? null) } catch (err) {
      if (err instanceof UsageLimitError) { setUpgradeModal(true); return }
    }
    onProcessing(activeTab === "upload" ? file?.name : undefined)
    try {
      const base = getApiBaseUrl()
      let response: Response
      if (activeTab === "upload" && file) {
        const fd = new FormData(); fd.append("file", file)
        response = await fetch(`${base}/api/contracts/review`, { method: "POST", body: fd })
      } else {
        if (!text.trim() || text.trim().length < 50) { onError("Please paste at least 50 characters of contract text."); return }
        response = await fetch(`${base}/api/contracts/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim() }) })
      }
      const data = await response.json() as ReviewResult & { message?: string }
      if (!response.ok) {
        const msg = data.message ?? "Review failed. Please try again."
        onError(msg.toLowerCase().includes("50 characters")
          ? "This PDF appears to be a scanned image. PlainPath can only read text-based PDFs — try copying and pasting the contract text instead."
          : msg,
          activeTab === "upload"
        )
        return
      }
      onResult(data, data.docText ?? (activeTab === "paste" ? text.trim() : ""))
    } catch { onError("Network error. Please check your connection and try again.") }
  }

  const canReview = activeTab === "paste" ? text.trim().length >= 50
    : activeTab === "upload" ? !!file
    : activeTab === "camera" ? capturedImages.length > 0
    : urlInput.trim().length > 0

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">

          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 mb-1">
              <Scale className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white/90">Contract Review</h1>
            <p className="text-white/45 text-base max-w-lg mx-auto leading-relaxed">
              Review a contract you didn't write. Spot risk indicators, missing protections, and possible negotiation points before you sign.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-white/30 pt-1 flex-wrap">
              <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-red-400" />Red flags surfaced</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" />Watch-outs explained</span>
              <span className="flex items-center gap-1.5"><Copy className="w-3.5 h-3.5 text-blue-400" />Negotiation language ready</span>
            </div>
          </div>

          {/* Demo chips */}
          <div>
            <p className="text-white/22 text-[10px] uppercase tracking-widest font-semibold text-center mb-3">Try a demo</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {REVIEW_DEMOS.map(d => (
                <button
                  key={d.id}
                  onClick={() => onResult(d.data, "")}
                  className="flex items-center gap-2 h-8 px-3 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-white/45 hover:text-white/70 text-xs transition-colors"
                >
                  <d.icon className={`w-3 h-3 ${d.color} shrink-0`} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleFileChange} />

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-1 bg-white/[0.03] p-1 rounded-xl">
                {([
                  { id: "paste", icon: Type, label: "Paste Text", sub: "Copy & paste" },
                  { id: "upload", icon: UploadCloud, label: "Upload File", sub: "PDF, DOCX, TXT" },
                  { id: "camera", icon: Camera, label: "Scan Photo", sub: "Camera or image" },
                  { id: "url", icon: LinkIcon, label: "Import Link", sub: "Drive or Dropbox" },
                ] as const).map(({ id: t, icon: Icon, label, sub }) => (
                  <button
                    key={t}
                    onClick={() => { setActiveTab(t); setCameraError(null); setUrlError(null) }}
                    style={{ touchAction: "manipulation" }}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg transition-all min-h-[52px] ${activeTab === t ? "bg-white/[0.08] text-white/85" : "text-white/35 hover:text-white/60"}`}
                  >
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                    <span className="text-[10px] opacity-40 hidden sm:block">{sub}</span>
                    <span className="sm:hidden text-xs font-medium">{label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "paste" && (
                  <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    {redactedNotice && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-300/80 font-medium">Working on redacted contract — personal info has been removed.</p>
                      </div>
                    )}
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Paste your full contract text here — employment agreement, lease, NDA, service agreement, etc."
                      className="w-full h-52 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/75 placeholder:text-white/22 text-sm px-4 py-3 resize-none focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.04] transition-colors"
                    />
                    <div className="flex items-center justify-between text-[10px] text-white/22">
                      <span>{text.length.toLocaleString()} characters</span>
                      {text.length > 0 && text.length < 50 && <span className="text-amber-400/60">Minimum 50 characters</span>}
                    </div>
                  </motion.div>
                )}

                {activeTab === "upload" && (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/[0.08] hover:border-amber-500/30 rounded-xl p-8 text-center cursor-pointer transition-colors group"
                    >
                      <UploadCloud className="w-8 h-8 text-white/20 group-hover:text-amber-400/50 mx-auto mb-3 transition-colors" />
                      {file ? (
                        <div>
                          <p className="text-white/70 text-sm font-medium">{file.name}</p>
                          <p className="text-white/30 text-xs mt-1">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white/45 text-sm">Click to select PDF, DOCX, or TXT</p>
                          <p className="text-white/22 text-xs mt-1">Max 20MB · Text-based PDFs work best</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "camera" && (
                  <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="border border-white/[0.08] rounded-xl p-5 space-y-3">
                      <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] text-white/60 hover:text-white/85 text-sm font-medium transition-colors">
                        <Camera className="w-4 h-4" /> {capturedImages.length > 0 ? `Add another page (${capturedImages.length} captured)` : "Capture contract page"}
                      </button>
                      {capturedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {capturedImages.map((img, i) => (
                            <div key={i} className="relative">
                              <img src={img} alt={`Page ${i + 1}`} className="w-16 h-20 object-cover rounded-lg border border-white/[0.08]" />
                              <button onClick={() => setCapturedImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                                <XIcon className="w-3 h-3" />
                              </button>
                              <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] text-white/60">p.{i + 1}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {cameraError && <p className="text-xs text-red-400">{cameraError}</p>}
                    </div>
                  </motion.div>
                )}

                {activeTab === "url" && (
                  <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleUrlImport()}
                        placeholder="https://drive.google.com/… or Dropbox link"
                        className="flex-1 h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/75 placeholder:text-white/22 text-sm px-4 focus:outline-none focus:border-amber-500/40 transition-colors"
                      />
                      <button onClick={handleUrlImport} disabled={urlLoading || !urlInput.trim()} className="h-11 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/60 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0">
                        {urlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                    {urlError && <p className="text-xs text-red-400">{urlError}</p>}
                    <p className="text-[10px] text-white/20">Supports Google Drive, Dropbox, and direct file links. The document must be publicly accessible.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={activeTab === "camera" ? handleScanReview : handleReview}
                disabled={!canReview}
                className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Scale className="w-4 h-4" />
                {activeTab === "camera" && capturedImages.length > 0 ? `Review ${capturedImages.length} page${capturedImages.length !== 1 ? "s" : ""}` : "Review Contract"}
              </button>

              <p className="text-center text-[10px] text-white/20">
                Contract review support — not legal advice. Verify with a qualified attorney before signing.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <UpgradeModal open={upgradeModal} onClose={() => setUpgradeModal(false)} reason="contractReview" />
    </div>
  )
}

// ─── Desktop Workspace Layout ─────────────────────────────────────────────────

function DesktopWorkspace({
  result, sections, isLowConf, fileName, onReset,
}: {
  result: ReviewResult; sections: DocSection[]; isLowConf: boolean
  fileName?: string; onReset: () => void
}) {
  const [activeChipId, setActiveChipId] = useState<string | null>(null)
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null)
  const [highlightSectionId, setHighlightSectionId] = useState<string | null>(null)
  const [copyDone, setCopyDone] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const handleChipClick = useCallback((chipId: string, evidence: string) => {
    setActiveChipId(chipId)
    setActiveEvidence(evidence)
    const targetId = findBestSection(evidence, sections)
    setHighlightSectionId(targetId)
    if (targetId && sectionRefs.current[targetId]) {
      sectionRefs.current[targetId]!.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [sections])

  const handleDismiss = useCallback(() => {
    setActiveChipId(null); setActiveEvidence(null); setHighlightSectionId(null)
  }, [])

  const redFlags = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")
  const riskyCount = redFlags.length + watchOuts.length

  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden">
      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <button onClick={onReset} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/35 hover:bg-white/[0.06] hover:text-white/65 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-5 h-5 rounded bg-amber-600 flex items-center justify-center shrink-0 ml-1">
          <Scale className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/15 text-[10px] mx-0.5">·</span>
        <span className="text-white/28 text-xs">Contract Review</span>
        {fileName && (
          <>
            <ChevronRight className="w-3 h-3 text-white/15" />
            <span className="text-white/28 text-xs truncate max-w-[160px]">{fileName}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {isLowConf ? (
            <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-amber-600/12 border-amber-500/25 text-amber-300">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span className="text-[10px] font-medium">Partial scan</span>
            </div>
          ) : riskyCount > 0 ? (
            <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-red-600/12 border-red-500/25 text-red-300">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span className="text-[10px] font-medium">Review required · {riskyCount} risk{riskyCount !== 1 ? "s" : ""}</span>
            </div>
          ) : (
            <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-emerald-600/12 border-emerald-500/25 text-emerald-300">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span className="text-[10px] font-medium">Looks fair</span>
            </div>
          )}
          <button
            onClick={() => { navigator.clipboard.writeText(buildReviewText(result)).then(() => { setCopyDone(true); setTimeout(() => setCopyDone(false), 2000) }) }}
            className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 hover:text-white/55 text-xs flex items-center gap-1.5 transition-colors"
          >
            {copyDone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>Copy</span>
          </button>
          <button
            onClick={() => window.print()}
            className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 hover:text-white/55 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3 h-3" /><span>Export</span>
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 flex overflow-hidden">
        <ContractDocViewer
          sections={sections}
          activeChipId={activeChipId}
          activeEvidence={activeEvidence}
          highlightSectionId={highlightSectionId}
          onDismiss={handleDismiss}
          sectionRefs={sectionRefs}
          isLowConf={isLowConf}
          docName={fileName ?? "Contract document"}
          riskyCount={riskyCount}
        />
        <ContractIntelPanel
          result={result}
          onChipClick={handleChipClick}
          activeChipId={activeChipId}
          sections={sections}
          isLowConf={isLowConf}
          onReset={onReset}
        />
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ContractReview() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()

  const [reviewState, setReviewState] = useState<ReviewState>("empty")
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [docSections, setDocSections] = useState<DocSection[]>([])
  const [isLowConf, setIsLowConf] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [errorCanPaste, setErrorCanPaste] = useState(false)
  const [processingFileName, setProcessingFileName] = useState<string | undefined>()
  const [savedFileName, setSavedFileName] = useState<string | undefined>()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    document.title = "Contract Review — PlainPath"
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => { document.title = "PlainPath"; window.removeEventListener("resize", check) }
  }, [])

  useEffect(() => {
    const demoId = new URLSearchParams(searchString).get("demo")
    if (demoId) {
      const demo = REVIEW_DEMOS.find(d => d.id === demoId)
      if (demo) {
        setResult(demo.data)
        setDocSections([])
        setIsLowConf(false)
        setReviewState("completed")
      }
    }
  }, [])

  function handleResult(r: ReviewResult, inputText: string) {
    const rawText = r.docText ?? inputText ?? ""
    const sections = parseDocSections(rawText)
    const lowConf = r.scanQuality === "poor"
    setResult(r)
    setDocSections(sections)
    setIsLowConf(lowConf)
    setReviewState(lowConf ? "lowconf" : "completed")
  }

  function handleProcessing(fileName?: string) {
    setProcessingFileName(fileName)
    if (fileName) setSavedFileName(fileName)
    setReviewState("processing")
  }

  function handleError(msg: string, canPaste?: boolean) {
    setErrorMsg(msg)
    setErrorCanPaste(!!canPaste)
    setReviewState("error")
  }

  function handleReset() {
    setReviewState("empty")
    setResult(null)
    setDocSections([])
    setIsLowConf(false)
    setErrorMsg(null)
    setProcessingFileName(undefined)
    setSavedFileName(undefined)
  }

  if (reviewState === "processing") return <ProcessingView fileName={processingFileName} />

  if (reviewState === "error") {
    return (
      <ErrorView
        message={errorMsg ?? "Contract review could not be completed."}
        onReset={handleReset}
        onPasteInstead={errorCanPaste ? () => { setReviewState("empty"); setErrorMsg(null) } : undefined}
      />
    )
  }

  if ((reviewState === "completed" || reviewState === "lowconf") && result) {
    if (isMobile) {
      return (
        <MobileWorkspace
          result={result}
          sections={docSections}
          isLowConf={isLowConf}
          onReset={handleReset}
        />
      )
    }
    return (
      <DesktopWorkspace
        result={result}
        sections={docSections}
        isLowConf={isLowConf}
        fileName={savedFileName}
        onReset={handleReset}
      />
    )
  }

  return (
    <EmptyInputForm
      onResult={handleResult}
      onProcessing={handleProcessing}
      onError={handleError}
    />
  )
}
