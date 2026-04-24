import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Scale, UploadCloud, Loader2, AlertCircle, Copy, Check,
  ChevronDown, ChevronUp, ArrowLeft, RotateCcw, FileText,
  ShieldAlert, AlertTriangle, CheckCircle2, X as XIcon,
  Lock, ClipboardList, ChevronRight, Mail, Shield, ShieldCheck,
  Camera, ScanLine, Download, Bookmark, Clock, ArrowRight,
  CheckSquare, Link as LinkIcon, Plus, Type,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApiBaseUrl } from "@/lib/api"
import { useLocation, useSearch } from "wouter"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { beforeRunContractReview, UsageLimitError } from "@/lib/analysisGate"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeModal from "@/components/UpgradeModal"
import { ResultStickyHeader } from "@/components/result/ResultStickyHeader"
import { ResultSectionCard } from "@/components/result/ResultSectionCard"
import { ResultMetaStrip } from "@/components/result/ResultMetaStrip"
import { ScoreLegend, CONTRACT_REVIEW_LEGEND } from "@/components/ui/ScoreLegend"
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
}

// ─── Config ───────────────────────────────────────────────────────────────────

const RATING_CONFIG = {
  "fair": {
    label: "Fair",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    border: "border-emerald-200/50 dark:border-emerald-900/40",
  },
  "watch-out": {
    label: "Watch Out",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    border: "border-amber-200/50 dark:border-amber-900/40",
  },
  "red-flag": {
    label: "Red Flag",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    icon: ShieldAlert,
    iconColor: "text-red-500",
    border: "border-red-200/50 dark:border-red-900/40",
  },
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 60) return "text-blue-600 dark:text-blue-400"
  if (score >= 40) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40"
  if (score >= 60) return "bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40"
  if (score >= 40) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40"
  return "bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-900/40"
}

function scoreBarClass(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-blue-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-500"
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
  if (score >= 60) return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
  if (score >= 40) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
  return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
}

function interpretScore(score: number): string {
  if (score >= 80) return "This contract looks generally fair and balanced"
  if (score >= 60) return "Mostly reasonable — some clauses deserve attention before signing"
  if (score >= 40) return "Mixed — significant issues require negotiation before you sign"
  return "Heavily one-sided — do not sign without major revisions"
}

function formatReviewedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function primaryRecommendation(result: ReviewResult): string {
  const redFlags = result.clauses.filter(c => c.rating === "red-flag").length
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out").length
  const missing = result.missingProtections?.length ?? 0
  if (redFlags >= 3) return `This contract has ${redFlags} red flags — do not sign until these are negotiated or removed.`
  if (redFlags >= 1) return `${redFlags} clause${redFlags > 1 ? "s" : ""} should be revised before you sign. Use the suggested language below to push back.`
  if (watchOuts >= 3) return `${watchOuts} clauses deserve attention. Review each watch-out and confirm you understand what you're agreeing to.`
  if (missing >= 2) return `The contract is missing ${missing} standard protections. Request these additions before signing.`
  if (result.overallScore >= 80) return "This contract looks fair. Review the before-you-sign checklist and confirm the key terms match your expectations."
  return "Review the sections below carefully and address any concerns before signing."
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

// ─── Built-in demo data ────────────────────────────────────────────────────────

const REVIEW_DEMOS: Array<{
  id: string
  label: string
  meta: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  data: ReviewResult
}> = [
  {
    id: "freelance-design",
    label: "Freelance Design Agreement",
    meta: "3 red flags · Score 32",
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/40",
    data: {
      overallScore: 32,
      verdict: "Do not sign without significant revisions",
      summary: "This freelance design agreement is heavily weighted in the client's favour. Three clauses pose serious legal and financial risk: perpetual IP assignment before payment, uncapped revision rounds, and a kill-fee waiver. Push back on all three before signing.",
      reviewedAt: new Date().toISOString(),
      clauses: [
        {
          id: "ip-assign",
          rating: "red-flag",
          text: "All work product, deliverables, and creative materials produced under this Agreement shall be the sole and exclusive property of the Client immediately upon creation, regardless of payment status.",
          explanation: "IP transfers to the client the moment you create anything — even if they never pay you. You lose all leverage to withhold files until you're paid.",
          whyUnfair: "Industry standard is that IP transfers only upon receipt of full payment. Immediate transfer removes the freelancer's primary leverage.",
          negotiationLanguage: "\"All intellectual property rights in the deliverables shall transfer to Client only upon Client's receipt and clearance of payment in full. Until such time, Freelancer retains full ownership and grants Client a limited, non-exclusive licence to review materials.\"",
          exitGuidance: "This is a dealbreaker clause. Do not sign without changing the payment-trigger condition.",
        },
        {
          id: "revisions",
          rating: "red-flag",
          text: "Client may request unlimited revisions during the project lifecycle at no additional cost to Client.",
          explanation: "Unlimited, unpaid revision rounds can turn a fixed-fee project into an indefinite obligation. There is no cap, no definition of what constitutes a revision, and no time limit.",
          whyUnfair: "Without a defined revision scope, clients can keep requesting changes indefinitely. Standard contracts cap revisions at 2–3 rounds.",
          negotiationLanguage: "\"This Agreement includes up to two (2) rounds of minor revisions per deliverable. Additional revision rounds will be billed at Freelancer's standard hourly rate of $[RATE]/hr.\"",
          exitGuidance: "Negotiate a specific revision limit and define what counts as a revision vs. a new scope of work.",
        },
        {
          id: "kill-fee",
          rating: "red-flag",
          text: "In the event Client cancels this project for any reason, Freelancer shall not be entitled to any compensation for work completed to date.",
          explanation: "If the client cancels mid-project, you receive nothing — even for completed work. This is an extreme clause rarely seen in legitimate freelance agreements.",
          whyUnfair: "Standard practice is a kill fee of 25–50% of the remaining project value, plus payment for all work completed. This clause provides zero protection.",
          negotiationLanguage: "\"If Client cancels this Agreement after work has commenced, Client shall pay (a) 100% of fees for all deliverables completed, and (b) a kill fee equal to 25% of the remaining project value to compensate for lost opportunity.\"",
          exitGuidance: "Do not sign this clause. Walk away or require a kill-fee provision.",
        },
        {
          id: "payment-30",
          rating: "watch-out",
          text: "Client shall remit payment within thirty (30) days of receipt of Freelancer's invoice.",
          explanation: "Net-30 payment terms are common but mean you wait a month for payment. Negotiate net-14 or require a deposit upfront.",
          whyUnfair: "30-day terms are standard but unfavourable for small freelancers. Many clients push past 30 days without penalty.",
          negotiationLanguage: "\"Payment is due within fourteen (14) days of invoice receipt. Invoices unpaid after 14 days shall accrue interest at 1.5% per month.\"",
          exitGuidance: null,
        },
        {
          id: "governing-law",
          rating: "fair",
          text: "This Agreement shall be governed by the laws of the State of California.",
          explanation: "A standard governing law clause. California has well-developed freelance contract law.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
        },
        {
          id: "confidentiality",
          rating: "fair",
          text: "Each party agrees to keep the other's confidential information private and not disclose it to third parties without prior written consent.",
          explanation: "A mutual NDA clause that protects both sides equally. This is fair and standard.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
        },
      ],
      missingProtections: [
        "Late payment interest clause — no penalty for delayed payment",
        "Scope creep / change order process — what counts as 'new work'?",
        "Portfolio/credit clause — are you allowed to show this work?",
        "Termination for convenience procedure — unclear process if you need to exit",
      ],
      preSigningChecklist: [
        "Confirm IP transfers only on full payment — not on creation",
        "Negotiate a cap on revision rounds (2–3 rounds is standard)",
        "Add a kill fee equal to 25–50% of remaining project value",
        "Require a 30–50% deposit before starting any work",
        "Confirm you can list this project in your portfolio",
        "Add a 1.5%/month late payment interest clause",
      ],
    },
  },
  {
    id: "apartment-lease",
    label: "Apartment Lease Agreement",
    meta: "2 red flags · Score 51",
    icon: ShieldAlert,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    data: {
      overallScore: 51,
      verdict: "Review carefully — some clauses require negotiation",
      summary: "This residential lease has two clauses that are either uncommon or potentially unlawful in several states: a broad entry-without-notice provision and automatic lease renewal with no written notice. The remaining terms are reasonably standard for a residential tenancy.",
      reviewedAt: new Date().toISOString(),
      clauses: [
        {
          id: "entry-without-notice",
          rating: "red-flag",
          text: "Landlord reserves the right to enter the premises at any time for inspection, repairs, or other purposes without prior notice to Tenant.",
          explanation: "Most U.S. states require landlords to provide 24–48 hours' written notice before entering (except in true emergencies). A blanket no-notice entry clause may be unenforceable but can still be used to harass tenants.",
          whyUnfair: "This violates tenant privacy rights in most jurisdictions. Even if unenforceable, a landlord citing it could create a hostile environment.",
          negotiationLanguage: "\"Landlord shall provide Tenant with at least twenty-four (24) hours' written or electronic notice before entering the premises for non-emergency purposes. Emergency entry is permitted without notice only if there is an imminent threat to property or safety.\"",
          exitGuidance: "Check your state's landlord-entry laws. In CA, NY, WA, and most others, 24-hour notice is required by statute regardless of lease language.",
        },
        {
          id: "auto-renewal",
          rating: "red-flag",
          text: "This Lease shall automatically renew for successive one-year terms unless Tenant provides written notice of non-renewal at least ninety (90) days prior to the expiration date.",
          explanation: "A 90-day notice window is unusually long — 30–60 days is standard. Missing this window could lock you into another full year of rent even if your circumstances change.",
          whyUnfair: "90 days is almost a full season in advance. Most tenants don't track lease end dates that far ahead, making this clause an inadvertent trap.",
          negotiationLanguage: "\"This Lease shall automatically renew on a month-to-month basis unless either party provides written notice of non-renewal at least thirty (30) days before the expiration date.\"",
          exitGuidance: "Negotiate this down to 30 or 60 days, or switch to month-to-month auto-renewal.",
        },
        {
          id: "security-deposit",
          rating: "watch-out",
          text: "Tenant shall pay a security deposit equal to two (2) months' rent, to be returned within thirty (30) days of Lease termination minus any deductions for damages or unpaid rent.",
          explanation: "A two-month security deposit is on the high end in many markets, though legal in most states. Confirm your state's security deposit cap (e.g., California limits it to 2 months for unfurnished units).",
          whyUnfair: "Two months is at the legal maximum in several states. The 30-day return window is standard but confirm your state's specific requirement.",
          negotiationLanguage: null,
          exitGuidance: null,
        },
        {
          id: "pet-clause",
          rating: "watch-out",
          text: "No pets of any kind are permitted on the premises. Violation of this clause may result in immediate termination of the Lease.",
          explanation: "While enforceable in general, this clause cannot override your right to an approved emotional support animal (ESA) under the Fair Housing Act if you have a documented disability.",
          whyUnfair: "Landlords must make reasonable accommodations for ESAs regardless of a no-pet policy. If this applies to you, request a separate ESA addendum.",
          negotiationLanguage: null,
          exitGuidance: null,
        },
        {
          id: "rent-amount",
          rating: "fair",
          text: "Tenant shall pay monthly rent of $2,100, due on the first day of each month. A grace period of five (5) days is provided before a late fee of $50 is assessed.",
          explanation: "Clear rent amount, due date, grace period, and late fee. This clause is well-structured and fair.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
        },
        {
          id: "maintenance",
          rating: "fair",
          text: "Landlord is responsible for all structural repairs and maintaining the property in a habitable condition. Tenant is responsible for minor maintenance and keeping the unit clean.",
          explanation: "A balanced maintenance split that aligns with the implied warranty of habitability in most states.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
        },
      ],
      missingProtections: [
        "Move-in inspection checklist — no documented baseline for damage comparison",
        "Lease break clause — no defined penalty if you need to exit early",
        "Utility responsibility — unclear who pays which utilities",
      ],
      preSigningChecklist: [
        "Negotiate the entry-without-notice clause to require 24-hour written notice",
        "Change auto-renewal notice from 90 days to 30–60 days",
        "Verify your state's security deposit cap — confirm 2 months is legal",
        "Complete a written move-in inspection form and keep a copy",
        "Document all pre-existing damage with photos on move-in day",
        "Clarify which utilities are included in rent before signing",
        "If you have pets or an ESA, request the appropriate addendum now",
      ],
    },
  },
  {
    id: "contractor-nda",
    label: "Independent Contractor NDA",
    meta: "1 red flag · Score 67",
    icon: Lock,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    data: {
      overallScore: 67,
      verdict: "Mostly fair — one clause needs revision",
      summary: "This NDA is largely balanced and uses standard confidentiality language. One clause — an indefinite confidentiality term with no sunset date — is overly broad and may hinder your future work. The non-solicitation scope is narrow and reasonable. Overall this is a workable agreement with one targeted fix.",
      reviewedAt: new Date().toISOString(),
      clauses: [
        {
          id: "indefinite-conf",
          rating: "red-flag",
          text: "Receiving Party's obligations of confidentiality shall survive the termination of this Agreement and shall continue in perpetuity with respect to all Confidential Information.",
          explanation: "A perpetual confidentiality obligation with no sunset clause is overly broad and, in many jurisdictions, may be unenforceable. More importantly, it can prevent you from discussing industry knowledge you naturally develop over time.",
          whyUnfair: "Perpetual NDAs are increasingly disfavoured by courts, especially for general know-how. Courts may refuse to enforce them. Standard is 2–5 years for trade secrets; some courts impose a reasonableness cap.",
          negotiationLanguage: "\"Receiving Party's obligations of confidentiality shall continue for three (3) years following termination of this Agreement, except for information that constitutes a trade secret under applicable law, which shall be protected for as long as it qualifies as a trade secret.\"",
          exitGuidance: "Push for a 2–5 year term with a trade-secret carve-out. A perpetual obligation is a significant career risk.",
        },
        {
          id: "definition",
          rating: "watch-out",
          text: "Confidential Information means any information disclosed by Disclosing Party to Receiving Party, whether oral, written, or in any other form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.",
          explanation: "The phrase 'reasonably should be understood to be confidential' is broad. Without clearer boundaries, almost any information you receive could be treated as confidential.",
          whyUnfair: "Overly broad definitions create ambiguity. Ask for exclusions for information you already knew, independently developed, or that becomes publicly available.",
          negotiationLanguage: "\"Confidential Information does not include information that: (a) is or becomes publicly known through no fault of Receiving Party; (b) was already known to Receiving Party at the time of disclosure; or (c) is independently developed by Receiving Party without use of Confidential Information.\"",
          exitGuidance: null,
        },
        {
          id: "non-solicit",
          rating: "fair",
          text: "During the term of this Agreement and for twelve (12) months thereafter, Receiving Party shall not solicit the employees or clients of Disclosing Party with whom Receiving Party had direct contact.",
          explanation: "A non-solicitation clause limited to people you directly worked with, for 12 months, is narrowly scoped and reasonable.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
        },
        {
          id: "return-of-info",
          rating: "fair",
          text: "Upon termination of this Agreement, Receiving Party shall promptly return or destroy all Confidential Information and certify in writing that it has done so.",
          explanation: "A standard return/destroy clause. The written certification requirement is reasonable and protects both parties.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
        },
        {
          id: "governing-law",
          rating: "fair",
          text: "This Agreement shall be governed by the laws of the State of New York, and any disputes shall be resolved in the courts of New York County.",
          explanation: "Venue and governing law clauses are standard. New York has strong and well-developed NDA case law.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
        },
      ],
      missingProtections: [
        "Mutual disclosure protection — only the contractor is bound; company's obligations are unspecified",
        "Injunctive relief carve-out — no provision for emergency court relief if needed",
      ],
      preSigningChecklist: [
        "Change perpetual confidentiality to a 3–5 year term with a trade-secret carve-out",
        "Add standard exclusions to the Confidential Information definition",
        "Confirm whether this is mutual or one-way — both parties should have obligations",
        "Check the non-solicitation scope is limited to direct contacts only",
        "Keep a signed copy of the final agreement for your records",
      ],
    },
  },
]

// ─── ClauseCard ───────────────────────────────────────────────────────────────

function ClauseCard({ clause, defaultOpen = false }: { clause: ClauseResult; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const config = RATING_CONFIG[clause.rating]
  const Icon = config.icon
  const [negLoading, setNegLoading] = useState(false)
  const [negEmail, setNegEmail] = useState<string | null>(null)
  const [negError, setNegError] = useState<string | null>(null)
  const [negCopied, setNegCopied] = useState(false)

  async function handleDraftEmail() {
    setNegLoading(true)
    setNegError(null)
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/contracts/negotiate-clause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauseText: clause.text,
          explanation: clause.explanation,
          whyUnfair: clause.whyUnfair,
          negotiationLanguage: clause.negotiationLanguage,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Failed to generate email")
      setNegEmail(data.emailBody)
    } catch (e) {
      setNegError(e instanceof Error ? e.message : "Failed. Please try again.")
    } finally {
      setNegLoading(false)
    }
  }

  function copyNegEmail() {
    if (!negEmail) return
    navigator.clipboard.writeText(negEmail).catch(() => {})
    setNegCopied(true)
    setTimeout(() => setNegCopied(false), 2000)
  }

  return (
    <Card className={`border ${config.border} transition-all`}>
      <CardContent className="p-0">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${config.iconColor}`} />
          <span className="flex-1 text-sm font-medium leading-snug">{clause.text}</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
            {config.label}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">What it means</p>
                  <p className="text-sm text-foreground/85 leading-relaxed">{clause.explanation}</p>
                </div>

                {clause.whyUnfair && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-lg p-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Why this is a problem</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{clause.whyUnfair}</p>
                  </div>
                )}

                {clause.negotiationLanguage && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Suggested revision — copy and send</p>
                      <CopyButton text={clause.negotiationLanguage} />
                    </div>
                    <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed font-mono bg-blue-100/50 dark:bg-blue-900/30 rounded p-2 mt-1 whitespace-pre-wrap">{clause.negotiationLanguage}</p>
                  </div>
                )}

                {clause.exitGuidance && (
                  <div className="bg-muted/40 border border-border/30 rounded-lg p-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Already signed?</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{clause.exitGuidance}</p>
                  </div>
                )}

                {clause.rating !== "fair" && (
                  <div>
                    {!negEmail ? (
                      <button
                        onClick={handleDraftEmail}
                        disabled={negLoading}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors disabled:opacity-60"
                      >
                        {negLoading
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting email…</>
                          : <><Mail className="w-3.5 h-3.5" /> Draft negotiation email</>
                        }
                      </button>
                    ) : (
                      <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-900/40 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Negotiation email draft</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={copyNegEmail}
                              className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:opacity-80 transition-opacity"
                            >
                              {negCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {negCopied ? "Copied" : "Copy"}
                            </button>
                            <button onClick={() => setNegEmail(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">{negEmail}</p>
                      </div>
                    )}
                    {negError && <p className="text-xs text-destructive mt-1">{negError}</p>}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// ─── Section nav ─────────────────────────────────────────────────────────────

interface NavSection { id: string; label: string; count: number; color: string }

function SectionNav({ sections }: { sections: NavSection[] }) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {sections.filter(s => s.count > 0).map(s => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-sm ${s.color}`}
        >
          {s.label}
          <span className="opacity-75">({s.count})</span>
          <ChevronRight className="w-3 h-3 opacity-50" />
        </button>
      ))}
    </div>
  )
}

// ─── Section Block ────────────────────────────────────────────────────────────

const SECTION_COLORS = {
  red:    { border: "border-red-200 dark:border-red-900/50",         bg: "bg-red-50/40 dark:bg-red-950/10",         icon: ShieldAlert  },
  amber:  { border: "border-amber-200 dark:border-amber-900/50",     bg: "bg-amber-50/40 dark:bg-amber-950/10",     icon: AlertTriangle },
  emerald:{ border: "border-emerald-200 dark:border-emerald-900/50", bg: "bg-emerald-50/30 dark:bg-emerald-950/10", icon: CheckCircle2 },
  violet: { border: "border-violet-200 dark:border-violet-900/50",   bg: "bg-violet-50/30 dark:bg-violet-950/10",   icon: Lock         },
  blue:   { border: "border-blue-200 dark:border-blue-900/50",       bg: "bg-blue-50/30 dark:bg-blue-950/10",       icon: ClipboardList },
}

function SectionBlock({ id, title, badge, children, collapsible = false, defaultCollapsed = false, color }: {
  id: string
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  color?: keyof typeof SECTION_COLORS
}) {
  const colors = color ? SECTION_COLORS[color] : null
  const accentClass = colors ? `${colors.border} ${colors.bg}` : ""
  const Icon = colors?.icon ?? FileText

  return (
    <div id={id} className="scroll-mt-24">
      <ResultSectionCard
        icon={Icon}
        title={title}
        badge={badge}
        collapsible={collapsible}
        defaultOpen={!defaultCollapsed}
        accentClass={accentClass}
      >
        {children}
      </ResultSectionCard>
    </div>
  )

}

// ─── Results View ─────────────────────────────────────────────────────────────

function buildReviewText(result: ReviewResult): string {
  const lines: string[] = [
    "PLAINPATH — CONTRACT REVIEW",
    `Contract Fairness Score: ${result.overallScore}/100 — ${result.verdict}`,
    "",
    result.summary,
    "",
  ]
  const redFlags = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")
  if (redFlags.length) {
    lines.push("─── RED FLAGS ───")
    redFlags.forEach(c => lines.push(`• ${c.text}`, `  ${c.explanation}`, ""))
  }
  if (watchOuts.length) {
    lines.push("─── WATCH OUTS ───")
    watchOuts.forEach(c => lines.push(`• ${c.text}`, `  ${c.explanation}`, ""))
  }
  if (result.missingProtections.length) {
    lines.push("─── MISSING PROTECTIONS ───")
    result.missingProtections.forEach(p => lines.push(`• ${p}`))
    lines.push("")
  }
  if (result.preSigningChecklist.length) {
    lines.push("─── BEFORE YOU SIGN ───")
    result.preSigningChecklist.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
  }
  return lines.join("\n")
}

function ResultsView({ result, onReset }: { result: ReviewResult; onReset: () => void }) {
  const redFlags = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")
  const fair = result.clauses.filter(c => c.rating === "fair")
  const missingCount = result.missingProtections?.length ?? 0
  const checklistCount = result.preSigningChecklist?.length ?? 0
  const recommendation = primaryRecommendation(result)

  const navSections: NavSection[] = [
    { id: "red-flags",          label: "Red Flags",           count: redFlags.length,  color: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300" },
    { id: "watch-outs",         label: "Watch Outs",          count: watchOuts.length, color: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300" },
    { id: "fair-clauses",       label: "Fair Clauses",        count: fair.length,      color: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" },
    { id: "missing-protections",label: "Missing Protections", count: missingCount,     color: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300" },
    { id: "before-you-sign",    label: "Before You Sign",     count: checklistCount,   color: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* ── Score banner — matches Trust Check verdict panel rhythm ── */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${scoreBg(result.overallScore)}`}>
        <div className="flex items-start gap-6 flex-wrap mb-3">
          <div className="text-center min-w-[80px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Contract Fairness Score</p>
            <p className={`text-6xl font-bold leading-none tabular-nums ${scoreColor(result.overallScore)}`}>{result.overallScore}</p>
            <p className="text-xs text-muted-foreground mt-1">/ 100</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xl font-bold mb-1 ${scoreColor(result.overallScore)}`}>{result.verdict}</p>
            <p className={`text-xs font-semibold mb-2 ${scoreColor(result.overallScore)} opacity-70`}>
              {interpretScore(result.overallScore)}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
          </div>
        </div>

        {/* Count pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {redFlags.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20">
              <ShieldAlert className="w-3 h-3" /> {redFlags.length} red flag{redFlags.length !== 1 ? "s" : ""}
            </span>
          )}
          {watchOuts.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" /> {watchOuts.length} watch-out{watchOuts.length !== 1 ? "s" : ""}
            </span>
          )}
          {fair.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> {fair.length} fair clause{fair.length !== 1 ? "s" : ""}
            </span>
          )}
          {missingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/20">
              <Lock className="w-3 h-3" /> {missingCount} missing protection{missingCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Progress bar + legend */}
        <div className="space-y-1.5">
          <div className="h-2 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.overallScore}%` }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${scoreBarClass(result.overallScore)}`}
            />
          </div>
        </div>
        <ScoreLegend score={result.overallScore} config={CONTRACT_REVIEW_LEGEND} />
      </div>

      {/* ── Primary recommendation — matches Trust Check Recommended Actions card ── */}
      <div className={`p-5 rounded-2xl border ${
        redFlags.length >= 3
          ? "border-red-200/70 dark:border-red-700/40 bg-red-50/40 dark:bg-red-950/20"
          : redFlags.length >= 1
          ? "border-amber-200/70 dark:border-amber-700/40 bg-amber-50/40 dark:bg-amber-950/20"
          : watchOuts.length >= 3
          ? "border-amber-200/70 dark:border-amber-700/40 bg-amber-50/40 dark:bg-amber-950/20"
          : "border-blue-200/70 dark:border-blue-700/40 bg-blue-50/40 dark:bg-blue-950/20"
      }`}>
        <div className="flex items-center gap-2 mb-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
            redFlags.length >= 1
              ? "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700"
              : "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700"
          }`}>
            <CheckSquare className={`w-3.5 h-3.5 ${
              redFlags.length >= 1
                ? "text-amber-600 dark:text-amber-400"
                : "text-blue-600 dark:text-blue-400"
            }`} />
          </div>
          <h3 className={`text-sm font-bold ${
            redFlags.length >= 1
              ? "text-amber-800 dark:text-amber-300"
              : "text-blue-800 dark:text-blue-300"
          }`}>Recommended Action</h3>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">{recommendation}</p>
      </div>

      {/* ── Metadata strip ── */}
      {result.reviewedAt && (
        <ResultMetaStrip items={[
          { icon: Clock, text: `Reviewed ${formatReviewedAt(result.reviewedAt)}` },
          { icon: FileText, text: "Contract review" },
        ]} />
      )}

      {/* ── Section nav ── */}
      <SectionNav sections={navSections} />

      {/* ── Legal disclaimer ── */}
      <div className="bg-muted/30 border border-border/30 rounded-xl px-4 py-3 text-xs text-muted-foreground">
        AI-assisted contract review. Not legal advice — always consult a qualified attorney before signing any legal agreement.
      </div>

      {/* ── Red Flags ── */}
      {redFlags.length > 0 && (
        <SectionBlock
          id="red-flags"
          title="Red Flags"
          color="red"
          badge={<Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0 text-[10px]">{redFlags.length}</Badge>}
        >
          <p className="text-xs text-muted-foreground mb-3">These clauses are harmful, exploitative, or potentially unenforceable. Each should be negotiated or removed before you sign.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {redFlags.map((c, i) => (
              <div key={c.id} className={redFlags.length % 2 !== 0 && i === redFlags.length - 1 ? "md:col-span-2" : ""}>
                <ClauseCard clause={c} defaultOpen={true} />
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ── Watch Outs ── */}
      {watchOuts.length > 0 && (
        <SectionBlock
          id="watch-outs"
          title="Watch Outs"
          color="amber"
          badge={<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0 text-[10px]">{watchOuts.length}</Badge>}
        >
          <p className="text-xs text-muted-foreground mb-3">These clauses are vague, one-sided, or unusual. You can still sign — but you should understand what you're agreeing to and consider pushing back.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {watchOuts.map((c, i) => (
              <div key={c.id} className={watchOuts.length % 2 !== 0 && i === watchOuts.length - 1 ? "md:col-span-2" : ""}>
                <ClauseCard clause={c} defaultOpen={true} />
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ── Fair Clauses (collapsible) ── */}
      {fair.length > 0 && (
        <SectionBlock
          id="fair-clauses"
          title="Fair Clauses"
          color="emerald"
          badge={<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-[10px]">{fair.length}</Badge>}
          collapsible={true}
          defaultCollapsed={true}
        >
          <p className="text-xs text-muted-foreground mb-3">These clauses appear balanced and reasonable. Expand each to see what it means in plain English.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {fair.map((c, i) => (
              <div key={c.id} className={fair.length % 2 !== 0 && i === fair.length - 1 ? "md:col-span-2" : ""}>
                <ClauseCard clause={c} defaultOpen={false} />
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ── Missing Protections ── */}
      {result.missingProtections && result.missingProtections.length > 0 && (
        <SectionBlock
          id="missing-protections"
          title="Missing Protections"
          color="violet"
          badge={<Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0 text-[10px]">{result.missingProtections.length}</Badge>}
        >
          <Card className="border-violet-200/60 dark:border-violet-900/40">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Standard protections a balanced contract of this type should include — but this one doesn't. Consider requesting these additions before signing.
              </p>
              <ul className="space-y-3">
                {result.missingProtections.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/85 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </SectionBlock>
      )}

      {/* ── Before You Sign ── */}
      {result.preSigningChecklist && result.preSigningChecklist.length > 0 && (
        <SectionBlock
          id="before-you-sign"
          title="Before You Sign"
          color="blue"
          badge={<Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-[10px]">{result.preSigningChecklist.length}</Badge>}
        >
          <Card className="border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Work through each of these before signing. These are specific to the contract you uploaded.
              </p>
              <ul className="space-y-3">
                {result.preSigningChecklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <ClipboardList className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/85 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </SectionBlock>
      )}
      {/* ── Footer ── */}
      <div className="text-center py-4">
        <p className="text-[11px] text-muted-foreground/60 max-w-sm mx-auto leading-relaxed">
          PlainPath Contract Review uses AI to surface clause-level risks. Results are not legal or financial advice. When in doubt, consult a qualified attorney.
        </p>
        <div className="flex items-center justify-center gap-3 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5 print:hidden"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs gap-1.5"
          >
            Review another contract <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractReview() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()

  const [activeTab, setActiveTab] = useState<"paste" | "upload" | "camera" | "url">("paste")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanFailed, setScanFailed] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [redactedNotice, setRedactedNotice] = useState(false)

  useEffect(() => {
    document.title = "Contract Review — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  // URL-based demo loading: /contract-review?demo=freelance-design
  useEffect(() => {
    const demoId = new URLSearchParams(searchString).get("demo")
    if (demoId) {
      const demo = REVIEW_DEMOS.find(d => d.id === demoId)
      if (demo) setResult(demo.data)
    }
  }, [])

  // Returning from redaction flow with pre-redacted contract text
  useEffect(() => {
    try {
      const redactedText = sessionStorage.getItem("pii_contract_review_text")
      if (redactedText) {
        sessionStorage.removeItem("pii_contract_review_text")
        setText(redactedText)
        setRedactedNotice(true)
        setActiveTab("paste")
      }
    } catch { /* sessionStorage unavailable */ }
  }, [])
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

  const { entitlements } = useEntitlements()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith("image/")) { setCameraError("Only image files are supported."); return }
    if (f.size > 10 * 1024 * 1024) { setCameraError("Photo is too large. Please try a lower-resolution photo."); return }
    const reader = new FileReader()
    reader.onload = () => { setCapturedImages(prev => [...prev, reader.result as string]); setCameraError(null) }
    reader.onerror = () => setCameraError("Could not read the photo. Please try again.")
    reader.readAsDataURL(f)
    e.target.value = ""
  }

  async function handleScanReview() {
    if (capturedImages.length === 0) return
    try {
      beforeRunContractReview(entitlements?.plan ?? null)
    } catch (err) {
      if (err instanceof UsageLimitError) { setUpgradeModal(true); return }
    }
    setLoading(true)
    setCameraError(null)
    setError(null)
    try {
      const base = getApiBaseUrl()
      const response = await fetch(`${base}/api/contracts/scan-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: capturedImages }),
      })
      const data = await response.json() as ReviewResult & { message?: string }
      if (!response.ok) {
        setCameraError(data.message ?? "Scan failed. Please try again.")
        setLoading(false)
        return
      }
      setResult(data)
    } catch {
      setCameraError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleUrlImport() {
    const url = urlInput.trim()
    if (!url) return
    setUrlLoading(true)
    setUrlError(null)
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/documents/import-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUrlError(data?.message ?? "Failed to import document. Check the link and try again.")
        return
      }
      const extracted: string = data.text ?? ""
      if (!extracted || extracted.length < 30) {
        setUrlError("Could not extract readable text from this link. Try downloading the file and uploading it directly.")
        return
      }
      setText(extracted)
      setActiveTab("paste")
    } catch {
      setUrlError("Network error — please check your connection and try again.")
    } finally {
      setUrlLoading(false)
    }
  }

  async function handleReview() {
    try {
      beforeRunContractReview(entitlements?.plan ?? null)
    } catch (err) {
      if (err instanceof UsageLimitError) { setUpgradeModal(true); return }
    }
    setError(null)
    setScanFailed(false)
    setLoading(true)
    try {
      const base = getApiBaseUrl()
      let response: Response

      if (activeTab === "upload" && file) {
        const fd = new FormData()
        fd.append("file", file)
        response = await fetch(`${base}/api/contracts/review`, { method: "POST", body: fd })
      } else {
        if (!text.trim() || text.trim().length < 50) {
          setError("Please paste at least 50 characters of contract text.")
          setScanFailed(true)
          setLoading(false)
          return
        }
        response = await fetch(`${base}/api/contracts/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        })
      }

      const data = await response.json() as ReviewResult & { message?: string }
      if (!response.ok) {
        const msg = data.message ?? "Review failed. Please try again."
        const isScanOnly = msg.toLowerCase().includes("50 characters")
        setError(isScanOnly
          ? "This PDF appears to be a scanned image. PlainPath can only read text-based PDFs — try copying and pasting the contract text instead."
          : msg
        )
        setScanFailed(true)
        setLoading(false)
        return
      }

      setResult(data)
    } catch {
      setError("Network error. Please check your connection and try again.")
      setScanFailed(true)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setText("")
    setFile(null)
    setError(null)
    setScanFailed(false)
    setActiveTab("paste")
  }

  // Full-page loading skeleton
  if (loading) return <DocumentScanScreen mode="contract-review" fileName={file?.name} />

  // Scan failed — show a clear error instead of silently reverting to the form
  if (scanFailed && error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Review couldn't complete</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleReset}
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </Button>
            {activeTab === "upload" && (
              <Button
                variant="outline"
                onClick={() => { setScanFailed(false); setError(null); setActiveTab("paste") }}
                className="w-full gap-2"
              >
                Paste contract text instead
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Results view
  if (result) {
    function copyResult() {
      navigator.clipboard.writeText(buildReviewText(result!)).then(() => {
        setCopyDone(true)
        setTimeout(() => setCopyDone(false), 2000)
      })
    }

    return (
      <div
        className="min-h-screen bg-background"
        style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom) + 6rem)" }}
      >
        <ResultStickyHeader
          toolIcon={Scale}
          toolLabel="Contract Review"
          toolIconClass="text-amber-500/80"
          subtitleText={`Score: ${result.overallScore}/100`}
          verdictLabel={result.verdict}
          verdictBadgeClass={scoreBadgeClass(result.overallScore)}
          onBack={handleReset}
          actions={
            <>
              <button
                onClick={copyResult}
                title="Copy results as text"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                aria-label="Copy summary"
              >
                {copyDone
                  ? <Check className="w-4 h-4 text-emerald-500" />
                  : <Copy className="w-4 h-4" />
                }
              </button>
              <button
                onClick={() => window.print()}
                title="Export as PDF"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0 print:hidden"
                aria-label="Export PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="text-xs h-8 hidden sm:flex gap-1.5 shrink-0"
              >
                Review Another <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          }
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 space-y-4">
          <ResultsView result={result} onReset={handleReset} />
        </div>
      </div>
    )
  }

  // Input form
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-7"
        >
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 mb-1">
              <Scale className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-3xl font-display font-bold">Contract Review</h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
              Review a contract you didn't write. Spot unfair clauses, missing protections, negotiation points, and high-risk terms before you sign.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
              <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Red flags surfaced</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Watch-outs explained</span>
              <span className="flex items-center gap-1.5"><Copy className="w-3.5 h-3.5 text-blue-500" /> Negotiation language ready to copy</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-violet-500" /> Missing protections identified</span>
            </div>
          </div>

          {/* Hidden camera input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraCapture}
          />

          <WorkspaceShell>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-1 bg-muted/50 p-1 rounded-xl">
                {([
                  { id: "paste", icon: Type, label: "Paste Text", sub: "Copy & paste" },
                  { id: "upload", icon: UploadCloud, label: "Upload File", sub: "PDF, DOCX, TXT" },
                  { id: "camera", icon: Camera, label: "Scan Photo", sub: "Camera or image" },
                  { id: "url", icon: LinkIcon, label: "Import Link", sub: "Drive or Dropbox" },
                ] as const).map(({ id: t, icon: Icon, label, sub }) => (
                  <button
                    key={t}
                    onClick={() => { setActiveTab(t); setError(null); setCameraError(null); setUrlError(null) }}
                    style={{ touchAction: "manipulation" }}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg transition-all min-h-[52px] ${
                      activeTab === t
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                    <span className="text-[10px] opacity-55 hidden sm:block">{sub}</span>
                    <span className="sm:hidden text-xs font-medium">{label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "paste" ? (
                  <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    {redactedNotice && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Working on redacted contract</p>
                          <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">Only the redacted version is submitted for review — original values are not sent</p>
                        </div>
                        <button
                          onClick={() => { setRedactedNotice(false); setText("") }}
                          className="text-emerald-600/60 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors shrink-0"
                          aria-label="Clear"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <Textarea
                      placeholder="Paste the full contract text here…"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      rows={12}
                      className="resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5 text-right">{text.length.toLocaleString()} characters</p>
                  </motion.div>
                ) : activeTab === "upload" ? (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0] ?? null
                        setFile(f)
                        setError(null)
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border/50 rounded-xl p-10 text-center hover:border-amber-400/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-all group"
                    >
                      {file ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <FileText className="w-5 h-5 text-amber-600" />
                            <span className="text-sm font-medium text-foreground">{file.name}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={e => { e.stopPropagation(); setFile(null) }}
                              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setFile(null) } }}
                              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB — click to change</p>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-amber-500 mx-auto mb-2 transition-colors" />
                          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Drop a file or click to browse</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, Word (.docx), or plain text · Max 20 MB</p>
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : activeTab === "camera" ? (
                  <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-lg px-3 py-2.5">
                      <ScanLine className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Take a photo of each page of the contract. AI will extract the text and review it for you. Up to 10 pages.</span>
                    </div>

                    {capturedImages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">{capturedImages.length} page{capturedImages.length !== 1 ? "s" : ""} captured</p>
                        <div className="flex flex-wrap gap-2">
                          {capturedImages.map((src, idx) => (
                            <div key={idx} className="relative group">
                              <img src={src} alt={`Page ${idx + 1}`} className="w-16 h-20 object-cover rounded-lg border border-border/50" />
                              <button
                                onClick={() => setCapturedImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                              <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-white font-bold drop-shadow">{idx + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-amber-300/50 dark:border-amber-700/40 rounded-xl p-8 text-center hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all group"
                    >
                      <Camera className="w-7 h-7 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {capturedImages.length === 0 ? "Tap to take a photo or choose from gallery" : "Add another page"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Works with printed or digital contracts</p>
                    </button>

                    {capturedImages.length > 0 && (
                      <button
                        onClick={() => { setCapturedImages([]); setCameraError(null) }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Clear all pages
                      </button>
                    )}

                    {cameraError && (
                      <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-lg px-3 py-2.5 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {cameraError}
                      </div>
                    )}

                    {capturedImages.length > 0 && (
                      <Button
                        onClick={handleScanReview}
                        disabled={loading}
                        className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                        size="lg"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                        {loading ? "Scanning & reviewing…" : `Review ${capturedImages.length} Page${capturedImages.length !== 1 ? "s" : ""}`}
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-1">Paste a Google Drive or Dropbox link</p>
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                        Share a file from Google Drive or Dropbox — PlainPath will fetch and extract the text automatically.
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                          <input
                            type="url"
                            placeholder="https://drive.google.com/... or https://dropbox.com/..."
                            value={urlInput}
                            onChange={e => { setUrlInput(e.target.value); setUrlError(null) }}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                            onKeyDown={e => { if (e.key === "Enter" && urlInput.trim()) void handleUrlImport() }}
                          />
                        </div>
                        <Button
                          onClick={() => void handleUrlImport()}
                          disabled={urlLoading || !urlInput.trim()}
                          style={{ touchAction: "manipulation" }}
                          className="shrink-0 rounded-xl"
                        >
                          {urlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                        </Button>
                      </div>
                      {urlError && (
                        <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-lg px-3 py-2.5 text-sm mt-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          {urlError}
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-3 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground/70">How to share from Google Drive:</p>
                      <ol className="space-y-1.5 list-decimal list-inside leading-relaxed">
                        <li>Right-click the file → <span className="font-medium">Share</span></li>
                        <li>Set access to <span className="font-medium">"Anyone with the link"</span></li>
                        <li>Copy the link and paste it above</li>
                      </ol>
                      <p className="font-semibold text-foreground/70 pt-1">How to share from Dropbox:</p>
                      <ol className="space-y-1.5 list-decimal list-inside leading-relaxed">
                        <li>Click <span className="font-medium">Share</span> on the file in Dropbox</li>
                        <li>Copy the shared link and paste it above</li>
                      </ol>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Try a sample contract ── inside shell ── */}
              <div className="pt-4 mt-2 border-t border-border/[0.15] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/40" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Try a sample contract</p>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {REVIEW_DEMOS.map((demo) => {
                    const Icon = demo.icon
                    return (
                      <button
                        key={demo.id}
                        onClick={() => setResult(demo.data)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 hover:border-amber-400/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition-all text-left group"
                      >
                        <div className={`w-8 h-8 rounded-lg ${demo.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${demo.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors truncate">{demo.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{demo.meta}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {activeTab !== "camera" && (
              <div className="px-5 py-4 border-t border-border/[0.15] bg-muted/20 space-y-3">
                {error && (
                  <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-lg px-3 py-2.5 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}
                <Button
                  onClick={handleReview}
                  disabled={loading || (activeTab === "paste" ? text.trim().length < 50 : !file)}
                  className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  size="lg"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                  {loading ? "Reviewing…" : "Review This Contract"}
                </Button>
                {activeTab === "paste" && text.trim().length >= 50 && !redactedNotice && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        sessionStorage.setItem(
                          "pii_redact_input",
                          JSON.stringify({ text, source: "contract-review" })
                        )
                      } catch { /* sessionStorage unavailable */ }
                      setLocation("/redact")
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-300/50 dark:border-amber-700/40 hover:border-amber-400/70 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm font-medium transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Redact sensitive info before reviewing
                  </button>
                )}
              </div>
            )}
          </WorkspaceShell>

        </motion.div>
      </div>
    <UpgradeModal
      open={upgradeModal}
      reason="contractReview"
      onClose={() => setUpgradeModal(false)}
    />
    </div>
  )
}
