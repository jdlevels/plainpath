import React, { useState, useRef, useEffect } from "react"
import { useAuth } from "@clerk/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Scale, UploadCloud, Loader2, AlertCircle, Copy, Check,
  ChevronDown, ChevronUp, ArrowLeft, RotateCcw, FileText,
  ShieldAlert, AlertTriangle, CheckCircle2, X as XIcon,
  Lock, ClipboardList, ChevronRight, Mail, Shield, ShieldCheck,
  Camera, ScanLine, Download, Bookmark, Clock, ArrowRight,
  CheckSquare, Type,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApiBaseUrl } from "@/lib/api"
import { useLocation, useSearch } from "wouter"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { ToolPageHeader } from "@/components/ToolPageHeader"
import { beforeRunContractReview, UsageLimitError } from "@/lib/analysisGate"
import { makeGetTokenWithTimeout, useEntitlements } from "@/hooks/useEntitlements"
import { waitForToken } from "@/lib/auth"
import UpgradeModal from "@/components/UpgradeModal"
import { ResultStickyHeader } from "@/components/result/ResultStickyHeader"
import { ResultSectionCard } from "@/components/result/ResultSectionCard"
import { ResultMetaStrip } from "@/components/result/ResultMetaStrip"
import { ScoreLegend, CONTRACT_REVIEW_LEGEND } from "@/components/ui/ScoreLegend"
import { DocumentScanScreen } from "@/components/DocumentScanScreen"
import { DocumentStageViewer } from "@/components/DocumentStageViewer"
import { triggerPrint } from "@/lib/print"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClauseResult {
  id: string
  text: string
  rating: "fair" | "watch-out" | "red-flag"
  explanation: string
  whyUnfair: string | null
  negotiationLanguage: string | null
  exitGuidance: string | null
  questionsToAsk?: string[]
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
    label: "Review Carefully",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    border: "border-amber-200/50 dark:border-amber-900/40",
  },
  "red-flag": {
    label: "Needs Attention",
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
  if (score >= 40) return "Mixed — some clauses may need clarification before signing"
  return "Several clauses may need significant revision or clarification before signing"
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
  if (redFlags >= 3) return `This contract has ${redFlags} clauses that may need revision. Review each carefully and consider clarifying with the other party before signing.`
  if (redFlags >= 1) return `${redFlags} clause${redFlags > 1 ? "s" : ""} may need clarification or revision. Review the questions and suggested language below, then discuss with the other party before signing.`
  if (watchOuts >= 3) return `${watchOuts} clauses deserve attention. Review each and confirm you understand what you are agreeing to before signing.`
  if (missing >= 2) return `This contract is missing ${missing} standard items. Consider requesting these additions or clarifications before signing.`
  if (result.overallScore >= 80) return "This contract looks generally balanced. Review the before-you-sign checklist and confirm key terms match your expectations."
  return "Review the sections below carefully. Clarify any concerns with the other party before signing."
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
    meta: "3 need attention · Score 32",
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/40",
    data: {
      overallScore: 32,
      verdict: "Several clauses need revision — review carefully before signing",
      summary: "This freelance design agreement is heavily weighted in the client's favour. Three clauses create significant risk: IP assignment before payment is received, uncapped revision rounds, and no compensation if the client cancels. Consider clarifying or revising all three with the other party before signing.",
      reviewedAt: new Date().toISOString(),
      clauses: [
        {
          id: "ip-assign",
          rating: "red-flag",
          text: "All work product, deliverables, and creative materials produced under this Agreement shall be the sole and exclusive property of the Client immediately upon creation, regardless of payment status.",
          explanation: "IP transfers to the client the moment you create anything — even if they never pay you. You lose all leverage to withhold files until you're paid.",
          whyUnfair: "Industry standard is that IP transfers only upon receipt of full payment. Immediate transfer removes the freelancer's primary leverage.",
          negotiationLanguage: "\"All intellectual property rights in the deliverables shall transfer to Client only upon Client's receipt and clearance of payment in full. Until such time, Freelancer retains full ownership and grants Client a limited, non-exclusive licence to review materials.\"",
          exitGuidance: "Consider requesting a revision so that IP transfers only upon full payment. A qualified professional can help you negotiate this clause.",
          questionsToAsk: [
            "Can we change this so IP transfers only when payment is received in full?",
            "Who owns work in progress if the project is paused or cancelled before payment?",
            "Will you agree to a clause that lets me withhold deliverable files until payment clears?",
          ],
        },
        {
          id: "revisions",
          rating: "red-flag",
          text: "Client may request unlimited revisions during the project lifecycle at no additional cost to Client.",
          explanation: "Unlimited, unpaid revision rounds can turn a fixed-fee project into an indefinite obligation. There is no cap, no definition of what constitutes a revision, and no time limit.",
          whyUnfair: "Without a defined revision scope, clients can keep requesting changes indefinitely. Standard contracts cap revisions at 2–3 rounds.",
          negotiationLanguage: "\"This Agreement includes up to two (2) rounds of minor revisions per deliverable. Additional revision rounds will be billed at Freelancer's standard hourly rate of $[RATE]/hr.\"",
          exitGuidance: "Consider requesting a specific revision limit and a clear definition of what counts as a revision versus new scope.",
          questionsToAsk: [
            "How many rounds of revisions are included in the fixed fee?",
            "How do we define a revision versus new scope of work?",
            "What is the rate for additional revision rounds beyond the included amount?",
          ],
        },
        {
          id: "kill-fee",
          rating: "red-flag",
          text: "In the event Client cancels this project for any reason, Freelancer shall not be entitled to any compensation for work completed to date.",
          explanation: "If the client cancels mid-project, you receive nothing — even for completed work. This is an extreme clause rarely seen in legitimate freelance agreements.",
          whyUnfair: "Standard practice is a kill fee of 25–50% of the remaining project value, plus payment for all work completed. This clause provides zero protection.",
          negotiationLanguage: "\"If Client cancels this Agreement after work has commenced, Client shall pay (a) 100% of fees for all deliverables completed, and (b) a kill fee equal to 25% of the remaining project value to compensate for lost opportunity.\"",
          exitGuidance: "Consider asking the other party to add a kill-fee provision and payment for completed work before you sign. Consult a professional if needed.",
          questionsToAsk: [
            "Can we add a kill fee equal to 25–50% of the remaining project value if you cancel?",
            "Are completed deliverables paid for at full rate regardless of cancellation?",
            "What happens to work in progress that is partially complete at the time of cancellation?",
          ],
        },
        {
          id: "payment-30",
          rating: "watch-out",
          text: "Client shall remit payment within thirty (30) days of receipt of Freelancer's invoice.",
          explanation: "Net-30 payment terms are common but mean you wait a month for payment. Negotiate net-14 or require a deposit upfront.",
          whyUnfair: "30-day terms are standard but unfavourable for small freelancers. Many clients push past 30 days without penalty.",
          negotiationLanguage: "\"Payment is due within fourteen (14) days of invoice receipt. Invoices unpaid after 14 days shall accrue interest at 1.5% per month.\"",
          exitGuidance: null,
          questionsToAsk: [
            "Can we shorten payment terms to 14 days from invoice receipt?",
            "Is there a late-payment interest clause if payment is delayed?",
            "Will you agree to a 30–50% deposit before work begins?",
          ],
        },
        {
          id: "governing-law",
          rating: "fair",
          text: "This Agreement shall be governed by the laws of the State of California.",
          explanation: "A standard governing law clause. California has well-developed freelance contract law.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
          questionsToAsk: [
            "Is California the most convenient jurisdiction for both parties?",
          ],
        },
        {
          id: "confidentiality",
          rating: "fair",
          text: "Each party agrees to keep the other's confidential information private and not disclose it to third parties without prior written consent.",
          explanation: "A mutual NDA clause that protects both sides equally. This is fair and standard.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
          questionsToAsk: [
            "Does this apply equally to both parties?",
            "Are there exceptions for information that becomes publicly available?",
          ],
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
    meta: "2 need attention · Score 51",
    icon: ShieldAlert,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    data: {
      overallScore: 51,
      verdict: "Review carefully — two clauses may need clarification before signing",
      summary: "This residential lease has two clauses that are either uncommon or potentially unlawful in several states: a broad entry-without-notice provision and automatic lease renewal with a 90-day notice window. The remaining terms are reasonably standard for a residential tenancy.",
      reviewedAt: new Date().toISOString(),
      clauses: [
        {
          id: "entry-without-notice",
          rating: "red-flag",
          text: "Landlord reserves the right to enter the premises at any time for inspection, repairs, or other purposes without prior notice to Tenant.",
          explanation: "Most U.S. states require landlords to provide 24–48 hours' written notice before entering (except in true emergencies). A blanket no-notice entry clause may be unenforceable but can still be used to pressure tenants.",
          whyUnfair: "This conflicts with tenant privacy rights in most jurisdictions. Even if technically unenforceable, a landlord citing it could create a difficult living situation.",
          negotiationLanguage: "\"Landlord shall provide Tenant with at least twenty-four (24) hours' written or electronic notice before entering the premises for non-emergency purposes. Emergency entry is permitted without notice only if there is an imminent threat to property or safety.\"",
          exitGuidance: "Check your state's landlord-entry laws. In CA, NY, WA, and most others, 24-hour notice is required by statute regardless of lease language.",
          questionsToAsk: [
            "Can we add a requirement for at least 24 hours' written notice before entry?",
            "What situations would qualify as a genuine emergency allowing entry without notice?",
            "What recourse is available if entry occurs without adequate notice?",
          ],
        },
        {
          id: "auto-renewal",
          rating: "red-flag",
          text: "This Lease shall automatically renew for successive one-year terms unless Tenant provides written notice of non-renewal at least ninety (90) days prior to the expiration date.",
          explanation: "A 90-day notice window is unusually long — 30–60 days is standard. Missing this window could lock you into another full year of rent even if your circumstances change.",
          whyUnfair: "90 days is almost a full season in advance. Most tenants don't track lease end dates that far ahead, making this an easy obligation to miss.",
          negotiationLanguage: "\"This Lease shall automatically renew on a month-to-month basis unless either party provides written notice of non-renewal at least thirty (30) days before the expiration date.\"",
          exitGuidance: "Consider asking to reduce the notice period to 30–60 days, or switching to month-to-month auto-renewal.",
          questionsToAsk: [
            "Can the notice period be reduced to 30 or 60 days?",
            "Can the lease switch to month-to-month rather than renew for another full year?",
            "How should non-renewal notice be delivered — email, certified mail, or other?",
          ],
        },
        {
          id: "security-deposit",
          rating: "watch-out",
          text: "Tenant shall pay a security deposit equal to two (2) months' rent, to be returned within thirty (30) days of Lease termination minus any deductions for damages or unpaid rent.",
          explanation: "A two-month security deposit is on the high end in many markets, though legal in most states. Confirm your state's security deposit cap.",
          whyUnfair: "Two months is at the legal maximum in several states. Confirm this amount is within your state's statutory limit before paying.",
          negotiationLanguage: null,
          exitGuidance: null,
          questionsToAsk: [
            "Is a two-month deposit within the legal maximum for this state?",
            "Under what specific conditions can deductions be made from the deposit?",
            "Exactly when after move-out will the deposit be returned?",
          ],
        },
        {
          id: "pet-clause",
          rating: "watch-out",
          text: "No pets of any kind are permitted on the premises. Violation of this clause may result in immediate termination of the Lease.",
          explanation: "While enforceable in general, this clause cannot override your right to an approved emotional support animal (ESA) under the Fair Housing Act if you have a documented disability.",
          whyUnfair: "Landlords must make reasonable accommodations for ESAs regardless of a no-pet policy. If this applies to you, an ESA addendum should be requested separately.",
          negotiationLanguage: null,
          exitGuidance: null,
          questionsToAsk: [
            "Does this clause apply to emotional support animals covered by the Fair Housing Act?",
            "If I have an ESA, can we add a separate addendum to document the accommodation?",
          ],
        },
        {
          id: "rent-amount",
          rating: "fair",
          text: "Tenant shall pay monthly rent of $2,100, due on the first day of each month. A grace period of five (5) days is provided before a late fee of $50 is assessed.",
          explanation: "Clear rent amount, due date, grace period, and late fee. This clause is well-structured and fair.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
          questionsToAsk: [
            "Are there any circumstances under which rent may be increased mid-lease?",
          ],
        },
        {
          id: "maintenance",
          rating: "fair",
          text: "Landlord is responsible for all structural repairs and maintaining the property in a habitable condition. Tenant is responsible for minor maintenance and keeping the unit clean.",
          explanation: "A balanced maintenance split that aligns with the implied warranty of habitability in most states.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
          questionsToAsk: [
            "How should maintenance requests be submitted and what is the expected response time?",
            "What counts as 'minor maintenance' that falls on the tenant?",
          ],
        },
      ],
      missingProtections: [
        "Move-in inspection checklist — no documented baseline for damage comparison",
        "Lease break clause — no defined process if you need to exit early",
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
    meta: "1 needs attention · Score 67",
    icon: Lock,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    data: {
      overallScore: 67,
      verdict: "Mostly fair — one clause may need revision before signing",
      summary: "This NDA is largely balanced and uses standard confidentiality language. One clause — an indefinite confidentiality term with no sunset date — is overly broad and may limit your future work. The non-solicitation scope is narrow and reasonable. Consider clarifying the perpetual term before signing.",
      reviewedAt: new Date().toISOString(),
      clauses: [
        {
          id: "indefinite-conf",
          rating: "red-flag",
          text: "Receiving Party's obligations of confidentiality shall survive the termination of this Agreement and shall continue in perpetuity with respect to all Confidential Information.",
          explanation: "A perpetual confidentiality obligation with no sunset clause is overly broad and, in many jurisdictions, may be unenforceable. It can also create ambiguity around industry knowledge you naturally develop over time.",
          whyUnfair: "Perpetual NDAs are increasingly disfavoured by courts, especially for general know-how. Standard is 2–5 years for trade secrets; open-ended terms can create ongoing uncertainty.",
          negotiationLanguage: "\"Receiving Party's obligations of confidentiality shall continue for three (3) years following termination of this Agreement, except for information that constitutes a trade secret under applicable law, which shall be protected for as long as it qualifies as a trade secret.\"",
          exitGuidance: "Consider requesting a defined term (2–5 years) with a separate carve-out for genuine trade secrets. A qualified professional can help you assess your options.",
          questionsToAsk: [
            "Can we set a specific time limit — such as 3–5 years — rather than a perpetual obligation?",
            "Is there a separate provision for trade secrets that would survive a time-limited term?",
            "How would industry knowledge I independently develop over time be treated under this clause?",
          ],
        },
        {
          id: "definition",
          rating: "watch-out",
          text: "Confidential Information means any information disclosed by Disclosing Party to Receiving Party, whether oral, written, or in any other form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.",
          explanation: "The phrase 'reasonably should be understood to be confidential' is broad. Without clearer boundaries, almost any information you receive could be treated as confidential.",
          whyUnfair: "Overly broad definitions create ambiguity. Standard exclusions — for information already known, independently developed, or publicly available — are absent here.",
          negotiationLanguage: "\"Confidential Information does not include information that: (a) is or becomes publicly known through no fault of Receiving Party; (b) was already known to Receiving Party at the time of disclosure; or (c) is independently developed by Receiving Party without use of Confidential Information.\"",
          exitGuidance: null,
          questionsToAsk: [
            "Can we add standard exclusions for information already in the public domain?",
            "Does this cover information I already knew before signing this agreement?",
            "How would knowledge I independently develop without using your confidential information be treated?",
          ],
        },
        {
          id: "non-solicit",
          rating: "fair",
          text: "During the term of this Agreement and for twelve (12) months thereafter, Receiving Party shall not solicit the employees or clients of Disclosing Party with whom Receiving Party had direct contact.",
          explanation: "A non-solicitation clause limited to people you directly worked with, for 12 months, is narrowly scoped and reasonable.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
          questionsToAsk: [
            "Does 'direct contact' mean only people I personally worked with?",
            "Does this apply to people who approach me first rather than me soliciting them?",
          ],
        },
        {
          id: "return-of-info",
          rating: "fair",
          text: "Upon termination of this Agreement, Receiving Party shall promptly return or destroy all Confidential Information and certify in writing that it has done so.",
          explanation: "A standard return/destroy clause. The written certification requirement is reasonable and protects both parties.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
          questionsToAsk: [
            "What form should the written certification of destruction take?",
            "What is the deadline for returning or destroying information after termination?",
          ],
        },
        {
          id: "governing-law",
          rating: "fair",
          text: "This Agreement shall be governed by the laws of the State of New York, and any disputes shall be resolved in the courts of New York County.",
          explanation: "Venue and governing law clauses are standard. New York has strong and well-developed NDA case law.",
          whyUnfair: null,
          negotiationLanguage: null,
          exitGuidance: null,
          questionsToAsk: [
            "Is New York the most convenient jurisdiction for both parties?",
            "Would mediation be available before any formal court proceedings?",
          ],
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

// ─── ContractReviewPrintReport ────────────────────────────────────────────────

function ContractReviewPrintReport({ result }: { result: ReviewResult }) {
  const redFlags  = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")
  const fair      = result.clauses.filter(c => c.rating === "fair")

  function formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) }
    catch { return iso }
  }

  return (
    <div className="print-only">
      {/* Cover */}
      <div className="print-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontWeight: 700, fontSize: "11pt", letterSpacing: "0.08em", textTransform: "uppercase", color: "#4F7CAC" }}>PlainPath</span>
          <span style={{ color: "#aaa", fontSize: "10pt" }}>·</span>
          <span style={{ fontSize: "9pt", color: "#888" }}>Contract Review Report</span>
        </div>
        <h1 style={{ fontSize: "18pt", fontWeight: 800, margin: "0 0 6px 0", lineHeight: 1.2 }}>Contract Review</h1>
        <div style={{ display: "flex", gap: "18px", fontSize: "9pt", color: "#555", marginBottom: "4px" }}>
          <span><strong>Fairness Score:</strong> {result.overallScore}/100</span>
          <span><strong>Rating:</strong> {interpretScore(result.overallScore).split("—")[0].trim()}</span>
          {result.reviewedAt && <span><strong>Reviewed:</strong> {formatDate(result.reviewedAt)}</span>}
        </div>
        <div style={{ borderTop: "2px solid #4F7CAC", marginTop: "12px" }} />
      </div>

      {/* Overall Verdict + Summary */}
      <div className="print-section">
        <h2 className="print-section-title">Overall Verdict</h2>
        <div className="print-item-title" style={{ fontSize: "11pt", marginBottom: "6px" }}>{result.verdict}</div>
        <p className="print-body">{result.summary}</p>
      </div>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div className="print-section print-break">
          <h2 className="print-section-title">Needs Attention ({redFlags.length})</h2>
          <p className="print-body" style={{ color: "#7f1d1d", marginBottom: "8px" }}>
            These clauses may create significant risk or obligation. Review each carefully and consider clarifying with the other party before signing.
          </p>
          {redFlags.map((c, i) => (
            <div key={c.id} style={{ marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #fee2e2" }}>
              <div className="print-item-title">
                {i + 1}. {c.text}
                <span className="print-badge" style={{ background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }}>NEEDS ATTENTION</span>
              </div>
              <p className="print-item-desc"><strong>What it means:</strong> {c.explanation}</p>
              {c.whyUnfair && (
                <p className="print-item-desc" style={{ color: "#92400e" }}><strong>Why this matters:</strong> {c.whyUnfair}</p>
              )}
              {c.negotiationLanguage && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "4px", padding: "6px 8px", margin: "4px 0 0 0" }}>
                  <p className="print-item-meta" style={{ color: "#1d4ed8", fontStyle: "normal", fontWeight: 600, marginBottom: "2px" }}>Suggested language to discuss:</p>
                  <p className="print-item-desc" style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{c.negotiationLanguage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Watch Outs */}
      {watchOuts.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Review Carefully ({watchOuts.length})</h2>
          <p className="print-body" style={{ color: "#78350f", marginBottom: "8px" }}>
            These clauses are vague, one-sided, or unusual. Understand what you're agreeing to and consider pushing back.
          </p>
          {watchOuts.map((c, i) => (
            <div key={c.id} style={{ marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #fef3c7" }}>
              <div className="print-item-title">
                {i + 1}. {c.text}
                <span className="print-badge" style={{ background: "#fffbeb", color: "#d97706", borderColor: "#fde68a" }}>REVIEW CAREFULLY</span>
              </div>
              <p className="print-item-desc"><strong>What it means:</strong> {c.explanation}</p>
              {c.whyUnfair && (
                <p className="print-item-desc" style={{ color: "#92400e" }}><strong>Why this is a concern:</strong> {c.whyUnfair}</p>
              )}
              {c.negotiationLanguage && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "4px", padding: "6px 8px", margin: "4px 0 0 0" }}>
                  <p className="print-item-meta" style={{ color: "#1d4ed8", fontStyle: "normal", fontWeight: 600, marginBottom: "2px" }}>Suggested language to discuss:</p>
                  <p className="print-item-desc" style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{c.negotiationLanguage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fair Clauses */}
      {fair.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Fair Clauses ({fair.length})</h2>
          <p className="print-body" style={{ marginBottom: "8px" }}>The following clauses appear balanced and reasonable:</p>
          {fair.map((c, i) => (
            <div key={c.id} className="print-check-item">
              <div>
                <div className="print-item-title">
                  {i + 1}. {c.text}
                  <span className="print-badge" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}>FAIR</span>
                </div>
                <p className="print-item-desc">{c.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Missing Protections */}
      {result.missingProtections && result.missingProtections.length > 0 && (
        <div className="print-section print-break">
          <h2 className="print-section-title">Missing Protections ({result.missingProtections.length})</h2>
          <p className="print-body" style={{ marginBottom: "8px" }}>
            Standard protections a balanced contract of this type should include — but this one doesn't.
          </p>
          {result.missingProtections.map((item, i) => (
            <div key={i} className="print-check-item">
              <div className="print-checkbox" />
              <div className="print-item-title">{item}</div>
            </div>
          ))}
        </div>
      )}

      {/* Before You Sign */}
      {result.preSigningChecklist && result.preSigningChecklist.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Before You Sign ({result.preSigningChecklist.length})</h2>
          <p className="print-body" style={{ marginBottom: "8px" }}>
            Work through each of these before signing. These are specific to the contract you reviewed.
          </p>
          {result.preSigningChecklist.map((item, i) => (
            <div key={i} className="print-check-item">
              <div className="print-checkbox" />
              <div className="print-item-title">{i + 1}. {item}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "20px", paddingTop: "10px", fontSize: "8pt", color: "#888", display: "flex", justifyContent: "space-between" }}>
        <span>Generated by PlainPath · plainpathapp.com</span>
        <span>AI-assisted review. Not legal advice — consult a qualified attorney before signing.</span>
      </div>
    </div>
  )
}

// ─── ClauseCard ───────────────────────────────────────────────────────────────

function ClauseCard({
  clause,
  defaultOpen = false,
  selected,
  onSelect,
}: {
  clause: ClauseResult
  defaultOpen?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const { getToken: rawGetToken } = useAuth()
  const getToken = makeGetTokenWithTimeout(rawGetToken as (opts?: Record<string, unknown>) => Promise<string | null>)
  const [open, setOpen] = useState(defaultOpen)
  const config = RATING_CONFIG[clause.rating]
  const Icon = config.icon
  const [negLoading, setNegLoading] = useState(false)
  const [negEmail, setNegEmail] = useState<string | null>(null)
  const [negError, setNegError] = useState<string | null>(null)
  const [negCopied, setNegCopied] = useState(false)

  function handleHeaderClick() {
    if (onSelect) {
      onSelect()
      setOpen(!selected)
    } else {
      setOpen(o => !o)
    }
  }

  async function handleDraftEmail() {
    setNegLoading(true)
    setNegError(null)
    try {
      const base = getApiBaseUrl()
      const tok = await waitForToken(getToken)
      const res = await fetch(`${base}/api/contracts/negotiate-clause`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
        },
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
    <Card className={`border transition-all ${
      selected
        ? "border-violet-400 dark:border-violet-500 ring-1 ring-violet-300/60 dark:ring-violet-700/60"
        : config.border
    }`}>
      <CardContent className="p-0">
        <button
          onClick={handleHeaderClick}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${selected ? "text-violet-500" : config.iconColor}`} />
          <span className="flex-1 text-sm font-semibold leading-snug">{clause.text}</span>
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
                {/* Source quote — always visible in expanded view */}
                <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">What it says</p>
                  <p className="text-[11px] text-muted-foreground italic leading-relaxed">"{clause.text}"</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Why this matters</p>
                  <p className="text-sm text-foreground/85 leading-relaxed">{clause.explanation}</p>
                  {clause.whyUnfair && (
                    <p className="text-sm text-foreground/70 leading-relaxed mt-1.5">{clause.whyUnfair}</p>
                  )}
                </div>

                {clause.questionsToAsk && clause.questionsToAsk.length > 0 && (
                  <div className="bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-900/40 rounded-lg p-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">Questions to Ask Before Signing</p>
                    <ul className="space-y-1.5">
                      {clause.questionsToAsk.map((q, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-violet-400 dark:text-violet-500 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
                          <p className="text-sm text-violet-900 dark:text-violet-100 leading-snug">{q}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {clause.negotiationLanguage && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Suggested language to discuss</p>
                      <CopyButton text={clause.negotiationLanguage} />
                    </div>
                    <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed font-mono bg-blue-100/50 dark:bg-blue-900/30 rounded p-2 mt-1 whitespace-pre-wrap">{clause.negotiationLanguage}</p>
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
                          : <><Mail className="w-3.5 h-3.5" /> Draft questions email</>
                        }
                      </button>
                    ) : (
                      <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-900/40 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Questions email draft</p>
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

type ReviewFilter = "all" | "attention" | "balanced" | "before-sign"

const REVIEW_FILTERS: { key: ReviewFilter; label: string; activeClass: string; inactiveClass: string }[] = [
  { key: "all",         label: "All",              activeClass: "bg-foreground text-background border-foreground",                                                    inactiveClass: "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40" },
  { key: "attention",   label: "Needs Attention",  activeClass: "bg-red-500 text-white border-red-500",                                                              inactiveClass: "border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" },
  { key: "balanced",    label: "Balanced",         activeClass: "bg-emerald-500 text-white border-emerald-500",                                                      inactiveClass: "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" },
  { key: "before-sign", label: "Before You Sign",  activeClass: "bg-blue-500 text-white border-blue-500",                                                            inactiveClass: "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30" },
]

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
    lines.push("─── NEEDS ATTENTION ───")
    redFlags.forEach(c => lines.push(`• ${c.text}`, `  ${c.explanation}`, ""))
  }
  if (watchOuts.length) {
    lines.push("─── REVIEW CAREFULLY ───")
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

function ResultsView({ result, onReset, onScrollToDocument }: {
  result: ReviewResult
  onReset: () => void
  onScrollToDocument?: () => void
}) {
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("all")
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null)

  const redFlags = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")
  const fair = result.clauses.filter(c => c.rating === "fair")
  const attentionClauses = [...redFlags, ...watchOuts]
  const missingCount = result.missingProtections?.length ?? 0
  const checklistCount = result.preSigningChecklist?.length ?? 0
  const beforeSignCount = checklistCount + missingCount
  const recommendation = primaryRecommendation(result)

  function handleClauseSelect(id: string) {
    const next = selectedClauseId === id ? null : id
    setSelectedClauseId(next)
    if (next) onScrollToDocument?.()
  }

  const showAttention  = activeFilter === "all" || activeFilter === "attention"
  const showBalanced   = activeFilter === "all" || activeFilter === "balanced"
  const showBeforeSign = activeFilter === "all" || activeFilter === "before-sign"

  const visibleFilters = REVIEW_FILTERS.filter(f => {
    if (f.key === "all")         return true
    if (f.key === "attention")   return attentionClauses.length > 0
    if (f.key === "balanced")    return fair.length > 0
    if (f.key === "before-sign") return beforeSignCount > 0
    return true
  })

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
              <ShieldAlert className="w-3 h-3" /> {redFlags.length} need{redFlags.length !== 1 ? "" : "s"} attention
            </span>
          )}
          {watchOuts.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" /> {watchOuts.length} caution{watchOuts.length !== 1 ? "s" : ""}
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

      {/* ── Filter chips ── */}
      <div className="flex flex-wrap gap-1.5">
        {visibleFilters.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => { setActiveFilter(f.key); setSelectedClauseId(null) }}
            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              activeFilter === f.key ? f.activeClass : f.inactiveClass
            }`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1 opacity-70">
                {f.key === "attention"   && `(${attentionClauses.length})`}
                {f.key === "balanced"    && `(${fair.length})`}
                {f.key === "before-sign" && `(${beforeSignCount})`}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Legal disclaimer ── */}
      <div className="bg-muted/30 border border-border/30 rounded-xl px-4 py-3 text-xs text-muted-foreground">
        AI-assisted contract review. Not legal advice — always consult a qualified attorney before signing any legal agreement.
      </div>

      {/* ── Key Clauses (Needs Attention: red flags + watch-outs combined) ── */}
      {attentionClauses.length > 0 && showAttention && (
        <SectionBlock
          id="key-clauses"
          title="Key Clauses"
          color="red"
          badge={<Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0 text-[10px]">{attentionClauses.length} need{attentionClauses.length === 1 ? "s" : ""} attention</Badge>}
        >
          <p className="text-xs text-muted-foreground mb-3">
            These clauses may create significant risk or obligation. Review each carefully and consider clarifying with the other party before signing.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {attentionClauses.map(c => (
              <ClauseCard
                key={c.id}
                clause={c}
                defaultOpen={true}
                selected={selectedClauseId === c.id}
                onSelect={() => handleClauseSelect(c.id)}
              />
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ── Balanced Clauses (collapsible) ── */}
      {fair.length > 0 && showBalanced && (
        <SectionBlock
          id="balanced-clauses"
          title="Balanced Clauses"
          color="emerald"
          badge={<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-[10px]">{fair.length}</Badge>}
          collapsible={true}
          defaultCollapsed={true}
        >
          <p className="text-xs text-muted-foreground mb-3">These clauses appear fair and reasonable. Expand each to see what it means in plain English.</p>
          <div className="grid grid-cols-1 gap-3">
            {fair.map(c => (
              <ClauseCard
                key={c.id}
                clause={c}
                defaultOpen={false}
                selected={selectedClauseId === c.id}
                onSelect={() => handleClauseSelect(c.id)}
              />
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ── Before You Sign (checklist + missing protections combined) ── */}
      {showBeforeSign && (result.preSigningChecklist?.length > 0 || result.missingProtections?.length > 0) && (
        <SectionBlock
          id="before-you-sign"
          title="Before You Sign"
          color="blue"
          badge={<Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-[10px]">{beforeSignCount} item{beforeSignCount !== 1 ? "s" : ""}</Badge>}
        >
          <div className="space-y-4">
            {result.preSigningChecklist && result.preSigningChecklist.length > 0 && (
              <Card className="border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3">Confirm each of these before signing</p>
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
            )}
            {result.missingProtections && result.missingProtections.length > 0 && (
              <Card className="border-violet-200/60 dark:border-violet-900/40">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-3">Items this contract is missing</p>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Standard items a balanced contract of this type should include — consider requesting these additions before signing.
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
            )}
          </div>
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
            onClick={() => triggerPrint()}
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

  const [activeTab, setActiveTab] = useState<"paste" | "upload" | "camera">("paste")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanFailed, setScanFailed] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(() => {
    if (typeof window !== "undefined" && (window as any).__PLAYWRIGHT_INITIAL_CONTRACT_RESULT__) {
      const data = (window as any).__PLAYWRIGHT_INITIAL_CONTRACT_RESULT__
      delete (window as any).__PLAYWRIGHT_INITIAL_CONTRACT_RESULT__
      return data as ReviewResult
    }
    return null
  })
  const [redactedNotice, setRedactedNotice] = useState(false)
  const [mobileResultTab, setMobileResultTab] = useState<"document" | "review">("review")
  const [scrollTrigger, setScrollTrigger] = useState(0)

  useEffect(() => {
    document.title = "Contract Review — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__PLAYWRIGHT_SET_CONTRACT_RESULT__) {
      (window as any).__PLAYWRIGHT_SET_CONTRACT_RESULT__ = (data: ReviewResult) => {
        setResult(data)
      }
    }
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
  const [upgradeModal, setUpgradeModal] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

  const { entitlements } = useEntitlements()
  const { getToken: rawGetToken } = useAuth()
  const getToken = makeGetTokenWithTimeout(rawGetToken as (opts?: Record<string, unknown>) => Promise<string | null>)

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
      const tok = await waitForToken(getToken)
      const response = await fetch(`${base}/api/contracts/scan-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
        },
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
      const tok = await waitForToken(getToken)
      let response: Response

      if (activeTab === "upload" && file) {
        const fd = new FormData()
        fd.append("file", file)
        response = await fetch(`${base}/api/contracts/review`, {
          method: "POST",
          headers: tok ? { Authorization: `Bearer ${tok}` } : undefined,
          body: fd,
        })
      } else {
        if (!text.trim() || text.trim().length < 50) {
          setError("Please paste at least 50 characters of contract text.")
          setScanFailed(true)
          setLoading(false)
          return
        }
        response = await fetch(`${base}/api/contracts/review`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
          },
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

  // Results view — split workspace
  if (result) {
    function copyResult() {
      navigator.clipboard.writeText(buildReviewText(result!)).then(() => {
        setCopyDone(true)
        setTimeout(() => setCopyDone(false), 2000)
      })
    }

    const hasPdf = file?.name.toLowerCase().endsWith(".pdf") ?? false

    const stickyHeader = (
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
              onClick={() => triggerPrint()}
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
    )

    const stageViewer = (
      <DocumentStageViewer
        fileName={file?.name ?? null}
        pdfFile={hasPdf ? file : null}
        scrollTrigger={scrollTrigger}
        contextLabel="Contract Review"
      />
    )

    const resultsPanel = (
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "max(4rem, env(safe-area-inset-bottom) + 4rem)" }}
      >
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 space-y-4">
          <ResultsView
            result={result}
            onReset={handleReset}
            onScrollToDocument={() => setScrollTrigger(t => t + 1)}
          />
        </div>
      </div>
    )

    return (
      <div className="h-screen flex flex-col cr-results-root">
        {/* Mobile tab bar */}
        <div className="md:hidden shrink-0 flex border-b border-border/40 bg-background no-print">
          <button
            onClick={() => setMobileResultTab("document")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              mobileResultTab === "document"
                ? "text-foreground border-b-2 border-amber-500"
                : "text-muted-foreground"
            }`}
          >
            Document
          </button>
          <button
            onClick={() => setMobileResultTab("review")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              mobileResultTab === "review"
                ? "text-foreground border-b-2 border-amber-500"
                : "text-muted-foreground"
            }`}
          >
            Review
          </button>
        </div>

        {/* Mobile panels (CSS-toggled) */}
        <div className="md:hidden flex-1 relative overflow-hidden no-print">
          <div className={`absolute inset-0 flex flex-col ${mobileResultTab === "document" ? "" : "hidden"}`}>
            {stageViewer}
          </div>
          <div className={`absolute inset-0 flex flex-col overflow-hidden ${mobileResultTab === "review" ? "" : "hidden"}`}>
            {stickyHeader}
            {resultsPanel}
          </div>
        </div>

        {/* Desktop split */}
        <div className="hidden md:flex flex-1 min-h-0 no-print">
          <div className="flex flex-col overflow-hidden border-r border-border/40" style={{ width: "60%" }}>
            {stageViewer}
          </div>
          <div className="flex flex-col overflow-hidden" style={{ width: "40%" }}>
            {stickyHeader}
            {resultsPanel}
          </div>
        </div>

        {/* Print-only report — hidden on screen, replaces the split layout when printing */}
        <ContractReviewPrintReport result={result} />
      </div>
    )
  }

  // Input form
  return (
    <div className="min-h-screen bg-background">
      <ToolPageHeader
        toolName="Contract Review"
        toolIcon={Scale}
        toolIconBg="bg-amber-100 dark:bg-amber-900/40"
        toolIconColor="text-amber-600 dark:text-amber-400"
        subtitle="Spot unfair clauses, clauses that need attention, and missing protections before you sign."
        backTo="/"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
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
              <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Concerns surfaced</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Cautions explained</span>
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
            {/* ── Tab row ── */}
            <div className="p-2 border-b border-border/30 bg-muted/30">
              <div className="grid grid-cols-3 rounded-xl bg-secondary/70 p-1 gap-1">
                {(["paste", "upload", "camera"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setError(null); setCameraError(null) }}
                    style={{ touchAction: "manipulation" }}
                    className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-lg transition-all min-h-[56px] ${
                      activeTab === tab
                        ? "bg-card text-foreground shadow-sm shadow-black/[0.06]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {tab === "paste" ? <Type className="w-4 h-4" /> : tab === "upload" ? <UploadCloud className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                      <span>{tab === "paste" ? "Paste Text" : tab === "upload" ? "Upload File" : "Scan Photo"}</span>
                    </div>
                    <span className="text-[10px] font-normal opacity-55">
                      {tab === "paste" ? "Copy & paste" : tab === "upload" ? "PDF, DOCX, TXT" : "Camera or image"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Input content ── */}
            <div className="p-4 sm:p-7">
              <AnimatePresence mode="wait">
                {activeTab === "paste" ? (
                  <motion.div key="paste" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.14 }} className="space-y-4">
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
                    <div className="relative">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste the full contract text here..."
                        className="w-full min-h-[140px] sm:min-h-[220px] p-4 rounded-xl border-2 border-border/50 bg-muted/20 focus:border-amber-400/60 focus:ring-4 focus:ring-amber-400/10 resize-none transition-all placeholder:text-muted-foreground/35 text-sm leading-relaxed font-mono outline-none"
                      />
                      {text.length > 0 && (
                        <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/40 font-mono select-none">
                          {text.length.toLocaleString()} chars
                        </span>
                      )}
                    </div>
                  </motion.div>
                ) : activeTab === "upload" ? (
                  <motion.div key="upload" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.14 }}>
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
                      style={{ touchAction: "manipulation" }}
                      className={`w-full border-2 border-dashed rounded-xl transition-all group min-h-[180px] sm:min-h-[220px] flex flex-col items-center justify-center ${
                        file
                          ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30"
                          : "border-border/50 hover:border-amber-400/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/10"
                      }`}
                    >
                      {file ? (
                        <div className="text-center space-y-3 p-6 sm:p-8 relative">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto" />
                          <div>
                            <p className="font-bold text-foreground text-sm">File ready</p>
                            <p className="text-xs text-muted-foreground mt-1">{file.name}</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                              {file.size < 1024 * 1024
                                ? `${Math.round(file.size / 1024)} KB`
                                : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                            </p>
                          </div>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={e => { e.stopPropagation(); setFile(null) }}
                            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setFile(null) } }}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <XIcon className="w-3.5 h-3.5" /> Remove
                          </span>
                        </div>
                      ) : (
                        <div className="text-center space-y-3 p-6 sm:p-8 pointer-events-none">
                          <div className="w-14 h-14 rounded-2xl bg-card border border-border shadow-md flex items-center justify-center mx-auto">
                            <UploadCloud className="w-7 h-7 text-amber-500 group-hover:text-amber-600 transition-colors" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground hidden sm:block">Drop a file or click to browse</p>
                            <p className="font-bold text-foreground sm:hidden text-sm">Tap to choose a file</p>
                            <p className="text-sm text-muted-foreground mt-1">PDF, Word (.docx), or plain text</p>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            {["PDF", "DOCX", "TXT"].map(fmt => (
                              <span key={fmt} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-bold text-muted-foreground shadow-sm">{fmt}</span>
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground/50">Max 20 MB · Text-based PDFs only</p>
                        </div>
                      )}
                    </button>
                  </motion.div>
                ) : (
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
                )}
              </AnimatePresence>
            </div>

            {/* ── Sample contracts ── */}
            <div className="px-4 sm:px-7 pb-6 space-y-3">
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
