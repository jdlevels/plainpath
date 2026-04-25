import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react"
import { useParams, useLocation } from "wouter"
import { useAuth } from "@clerk/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload, FileText, ListChecks, Calendar, Users, AlertTriangle,
  ChevronDown, ChevronUp, ArrowLeft, Loader2, AlertCircle,
  RefreshCw, Copy, Download, Check, FileType2, X,
  Scale, Layers, Tag, BookOpen, FileSearch, Info,
  RotateCcw, MessageCircle, Clock, DollarSign,
  ChevronRight, ShieldCheck, Building2, Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { clauseExtractorApi } from "@/lib/clauseExtractorApi"
import { DocumentScanScreen } from "@/components/DocumentScanScreen"
import type {
  ClauseExtractorSessionDetail,
  ClauseExtractionResults,
  ClausePresence,
} from "@/lib/clauseExtractorTypes"

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

/* ─── Upload-state constants ─────────────────────────────────────────────── */

const CE_WORKS_WELL_WITH = [
  { icon: FileText,   label: "Residential & commercial leases", desc: "Rent terms, maintenance obligations, early exit, renewal options.",   color: "text-violet-400" },
  { icon: Briefcase,  label: "Freelance & service agreements",  desc: "Scope of work, payment schedule, revision limits, IP ownership.",     color: "text-blue-400"   },
  { icon: Building2,  label: "Employment & NDA contracts",      desc: "Non-compete clauses, confidentiality terms, termination language.",   color: "text-emerald-400"},
  { icon: Scale,      label: "Vendor & supplier agreements",    desc: "Delivery obligations, pricing, indemnity, governing law.",           color: "text-amber-400" },
  { icon: FileSearch, label: "Software & licensing terms",      desc: "Usage rights, restriction clauses, liability caps.",                 color: "text-sky-400"   },
  { icon: Calendar,   label: "Membership & subscription terms", desc: "Auto-renewal language, cancellation policy, refund clauses.",        color: "text-rose-400"  },
]

const CLAUSE_DEMOS: Array<{
  id: string
  label: string
  description: string
  data: import("@/lib/clauseExtractorTypes").ClauseExtractorSessionDetail
}> = [
  {
    id: "demo-lease",
    label: "Residential Lease — Thornfield Properties",
    description: "12 clauses · Lease agreement",
    data: {
      id: "demo-lease",
      fileName: "Thornfield_Residential_Lease_2025.pdf",
      fileSizeBytes: 184320,
      fileType: "application/pdf",
      status: "done",
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      results: {
        documentType: "Residential Lease Agreement",
        extractionConfidence: "high",
        keyDates: {
          effectiveDate: "January 15, 2025",
          executionDate: "January 12, 2025",
          expirationDate: "January 14, 2026",
          renewalDate: null,
          noticeDeadline: "December 15, 2025",
          noticePeriod: "30 days written notice required before end of term",
        },
        parties: [
          { name: "Jamie L. Moreno", role: "Tenant", type: "individual", isSigner: true },
          { name: "Thornfield Property Management LLC", role: "Landlord", type: "company", isSigner: true },
        ],
        financialTerms: {
          paymentAmount: "$1,850 per month",
          paymentSchedule: "Due on the 1st of each month",
          lateFees: "$75 late fee if payment received after the 5th of the month",
          refundLanguage: "Security deposit refunded within 21 days of move-out, less deductions for damage",
          otherTerms: ["Security deposit: $3,700 (two months' rent)", "Pro-rated first month rent if lease begins mid-month"],
        },
        legalClauses: {
          governingLaw: { present: true, summary: "Governed by the laws of the State of Colorado", snippet: "This agreement shall be governed by and construed in accordance with the laws of the State of Colorado." },
          terminationClause: { present: true, summary: "Either party may terminate with 30 days written notice before lease end; early termination requires 60 days notice and one month penalty", snippet: "Early termination by Tenant requires sixty (60) days written notice and forfeiture of one (1) month's rent as a termination fee." },
          autoRenewal: { present: true, summary: "Lease converts to month-to-month automatically if neither party provides notice", snippet: "Upon expiration, this Agreement shall automatically convert to a month-to-month tenancy unless either party provides written notice of non-renewal." },
          liabilityCap: { present: false, summary: null, snippet: null },
          indemnity: { present: true, summary: "Tenant indemnifies Landlord for damage caused by Tenant or guests", snippet: "Tenant shall indemnify and hold harmless Landlord from any claims arising from Tenant's use of the premises." },
          confidentiality: { present: false, summary: null, snippet: null },
          assignment: { present: true, summary: "Subletting prohibited without prior written consent from Landlord", snippet: "Tenant shall not sublet or assign this Agreement or any portion of the Premises without prior written consent of Landlord." },
          disputeResolution: { present: true, summary: "Disputes resolved through mediation first, then binding arbitration", snippet: "Any dispute arising under this Agreement shall first be submitted to mediation before proceeding to binding arbitration." },
        },
        obligations: [
          { party: "Tenant", obligation: "Pay rent on the 1st of each month", deadline: "Monthly", consequence: "$75 late fee after the 5th of the month" },
          { party: "Tenant", obligation: "Maintain premises in clean condition and report maintenance issues within 48 hours", deadline: "Ongoing", consequence: "Liable for damage resulting from failure to report" },
          { party: "Landlord", obligation: "Complete routine maintenance and repairs within 14 days of written request", deadline: "Within 14 days of request", consequence: null },
          { party: "Tenant", obligation: "Provide 30 days written notice of intent to vacate before lease expiration", deadline: "December 15, 2025", consequence: "Automatic month-to-month conversion if not provided" },
        ],
        missingFields: [],
      },
    },
  },
  {
    id: "demo-freelance",
    label: "Freelance Service Agreement — Studio Vela",
    description: "8 clauses · Service agreement",
    data: {
      id: "demo-freelance",
      fileName: "Studio_Vela_Freelance_Agreement.pdf",
      fileSizeBytes: 92160,
      fileType: "application/pdf",
      status: "done",
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      results: {
        documentType: "Freelance Service Agreement",
        extractionConfidence: "medium",
        keyDates: {
          effectiveDate: "March 1, 2025",
          executionDate: "February 26, 2025",
          expirationDate: null,
          renewalDate: null,
          noticeDeadline: null,
          noticePeriod: "14 days written notice to terminate",
        },
        parties: [
          { name: "Kendall Park", role: "Freelancer / Service Provider", type: "individual", isSigner: true },
          { name: "Studio Vela LLC", role: "Client", type: "company", isSigner: true },
        ],
        financialTerms: {
          paymentAmount: "$4,500 total project fee",
          paymentSchedule: "50% upon signing; 50% upon final delivery and approval",
          lateFees: "1.5% monthly interest on overdue invoices after 30 days",
          refundLanguage: "Upfront payment non-refundable if Freelancer completes initial deliverables",
          otherTerms: ["Expenses over $100 require prior written approval", "Revisions limited to 2 rounds per deliverable"],
        },
        legalClauses: {
          governingLaw: { present: true, summary: "Governed by the laws of the State of California", snippet: "This Agreement shall be governed by the laws of the State of California, without regard to its conflict of law provisions." },
          terminationClause: { present: true, summary: "Either party may terminate with 14 days written notice; Client pays for work completed to date", snippet: "Either party may terminate this Agreement with fourteen (14) days written notice. Client shall pay Freelancer for all work completed prior to termination." },
          autoRenewal: { present: false, summary: null, snippet: null },
          liabilityCap: { present: true, summary: "Freelancer liability capped at total fees paid under this agreement", snippet: "Freelancer's total liability shall not exceed the total fees paid by Client under this Agreement." },
          indemnity: { present: true, summary: "Each party indemnifies the other for claims arising from their own breach or negligence", snippet: "Each party shall indemnify and hold harmless the other from claims arising from its own breach or negligence." },
          confidentiality: { present: true, summary: "Freelancer keeps all Client materials and project details confidential for 2 years", snippet: "Freelancer agrees to keep all Client information confidential for a period of two (2) years following termination of this Agreement." },
          assignment: { present: true, summary: "All work product and IP transfers to Client upon final payment", snippet: "Upon receipt of full payment, Freelancer assigns all intellectual property rights in the work product to Client." },
          disputeResolution: { present: false, summary: null, snippet: null },
        },
        obligations: [
          { party: "Kendall Park", obligation: "Deliver initial design concepts within 10 business days of project kickoff", deadline: "March 14, 2025", consequence: "Client may request refund of 25% of upfront payment" },
          { party: "Studio Vela LLC", obligation: "Provide written feedback within 5 business days of each deliverable", deadline: "Per deliverable", consequence: "Freelancer may invoice for time lost due to delayed feedback" },
          { party: "Studio Vela LLC", obligation: "Pay final 50% within 7 days of final delivery approval", deadline: "7 days after approval", consequence: "1.5% monthly interest accrues on overdue balance" },
        ],
        missingFields: ["Dispute resolution mechanism"],
      },
    },
  },
]

/* ─── Category types ──────────────────────────────────────────────────────── */

type CategoryFilter = "All" | "Payment" | "Termination" | "Obligations" | "Liability" | "Confidentiality" | "Deadlines" | "Missing"
const CATEGORY_FILTERS: CategoryFilter[] = ["All", "Payment", "Termination", "Obligations", "Liability", "Confidentiality", "Deadlines", "Missing"]

type ImportanceLevel = "attention" | "standard" | "noted"

const IMPORTANCE: Record<ImportanceLevel, {
  dot: string; border: string; bg: string
  badgeBg: string; badgeBorder: string; badgeText: string; label: string
}> = {
  attention: {
    dot: "bg-amber-500",
    border: "border-amber-400/30 dark:border-amber-500/20",
    bg: "bg-amber-50/80 dark:bg-amber-500/[0.04]",
    badgeBg: "bg-amber-100 dark:bg-amber-500/12",
    badgeBorder: "border-amber-300 dark:border-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-300/70",
    label: "Needs attention",
  },
  standard: {
    dot: "bg-blue-500",
    border: "border-blue-400/30 dark:border-blue-500/15",
    bg: "bg-blue-50/50 dark:bg-blue-500/[0.03]",
    badgeBg: "bg-blue-100 dark:bg-blue-500/12",
    badgeBorder: "border-blue-300 dark:border-blue-500/20",
    badgeText: "text-blue-700 dark:text-blue-300/65",
    label: "Standard term",
  },
  noted: {
    dot: "bg-foreground/20",
    border: "border-border/50",
    bg: "bg-muted/20 dark:bg-white/[0.01]",
    badgeBg: "bg-muted dark:bg-white/[0.07]",
    badgeBorder: "border-border dark:border-white/[0.1]",
    badgeText: "text-muted-foreground dark:text-white/38",
    label: "Noted",
  },
}

const CLAUSE_META: Record<string, {
  label: string; category: CategoryFilter; chipLabel: string; importance: ImportanceLevel
}> = {
  terminationClause: { label: "Termination",       category: "Termination",    chipLabel: "Term.",     importance: "attention" },
  autoRenewal:       { label: "Auto-Renewal",       category: "Termination",    chipLabel: "Renewal",   importance: "attention" },
  liabilityCap:      { label: "Liability Cap",      category: "Liability",      chipLabel: "Liability", importance: "attention" },
  indemnity:         { label: "Indemnification",    category: "Obligations",    chipLabel: "Indemn.",   importance: "standard"  },
  confidentiality:   { label: "Confidentiality",    category: "Confidentiality",chipLabel: "Confid.",   importance: "standard"  },
  assignment:        { label: "Assignment",         category: "Obligations",    chipLabel: "Assign.",   importance: "noted"     },
  disputeResolution: { label: "Dispute Resolution", category: "Obligations",    chipLabel: "Dispute",   importance: "noted"     },
  governingLaw:      { label: "Governing Law",      category: "Obligations",    chipLabel: "Gov. Law",  importance: "noted"     },
}

/* ─── Source chip ─────────────────────────────────────────────────────────── */

interface SChipProps {
  label: string
  active?: boolean
  onClick?: () => void
}
function SChip({ label, active, onClick }: SChipProps) {
  return (
    <span
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap transition-all select-none",
        onClick ? "cursor-pointer" : "",
        active
          ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_6px_rgba(139,92,246,0.2)]"
          : "bg-violet-600/10 dark:bg-violet-600/10 border border-violet-400/30 dark:border-violet-500/18 text-violet-700/80 dark:text-violet-300/75 hover:bg-violet-500/20",
      ].join(" ")}
    >
      {active && <span className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />}
      {label}
    </span>
  )
}

/* ─── Copy hook ───────────────────────────────────────────────────────────── */

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])
  return { copied, copy }
}

/* ─── Build document sections from results ────────────────────────────────── */

interface DocSect {
  id: string
  title: string
  body: string
  snippet?: string
}

function buildDocSections(r: ClauseExtractionResults): DocSect[] {
  const sections: DocSect[] = []

  // Parties
  if (r.parties.length > 0) {
    const partiesText = r.parties
      .map(p => `${p.name}${p.role ? ` (${p.role})` : ""}${p.isSigner ? " — signer" : ""}`)
      .join("; ")
    sections.push({ id: "parties", title: "Parties & Scope", body: partiesText })
  }

  // Financial Terms
  const ft = r.financialTerms
  if (ft.paymentAmount || ft.paymentSchedule || ft.lateFees || ft.otherTerms.length > 0) {
    const parts = [
      ft.paymentAmount && `Payment: ${ft.paymentAmount}`,
      ft.paymentSchedule && `Schedule: ${ft.paymentSchedule}`,
      ft.lateFees && `Late fees: ${ft.lateFees}`,
      ft.refundLanguage && `Refund/deposit: ${ft.refundLanguage}`,
      ...ft.otherTerms,
    ].filter(Boolean)
    sections.push({ id: "payment", title: "Payment & Financial Terms", body: parts.join(" · ") })
  }

  // Key Dates
  const kd = r.keyDates
  const datesParts = [
    kd.effectiveDate && `Effective: ${kd.effectiveDate}`,
    kd.executionDate && `Executed: ${kd.executionDate}`,
    kd.expirationDate && `Expires: ${kd.expirationDate}`,
    kd.renewalDate && `Renewal: ${kd.renewalDate}`,
    kd.noticeDeadline && `Notice deadline: ${kd.noticeDeadline}`,
    kd.noticePeriod && `Notice period: ${kd.noticePeriod}`,
  ].filter(Boolean)
  if (datesParts.length > 0) {
    sections.push({ id: "dates", title: "Key Dates & Deadlines", body: datesParts.join(" · ") })
  }

  // Legal clauses — each present one becomes a section
  const clauseEntries = Object.entries(r.legalClauses) as Array<[string, ClausePresence]>
  for (const [key, clause] of clauseEntries) {
    if (!clause.present) continue
    const meta = CLAUSE_META[key]
    if (!meta) continue
    const body = clause.summary ?? "Clause present — no summary extracted."
    sections.push({
      id: key,
      title: meta.label,
      body,
      snippet: clause.snippet ?? undefined,
    })
  }

  // Obligations summary
  if (r.obligations.length > 0) {
    const text = r.obligations
      .slice(0, 4)
      .map(ob => `[${ob.party ?? "Party"}] ${ob.obligation}`)
      .join("; ")
    sections.push({ id: "obligations", title: "Obligations", body: text })
  }

  return sections
}

/* ─── Derive key clauses for C section ───────────────────────────────────── */

interface KeyClause {
  id: string
  title: string
  category: CategoryFilter
  chipLabel: string
  importance: ImportanceLevel
  plain: string
  action?: string
}

function buildKeyClauses(r: ClauseExtractionResults): KeyClause[] {
  const out: KeyClause[] = []

  // From legal clauses
  const clauseEntries = Object.entries(r.legalClauses) as Array<[string, ClausePresence]>
  for (const [key, clause] of clauseEntries) {
    const meta = CLAUSE_META[key]
    if (!meta) continue
    const title = clause.present
      ? `${meta.label}${clause.summary ? " — " + clause.summary.slice(0, 50).trimEnd() + (clause.summary.length > 50 ? "…" : "") : ""}`
      : `${meta.label} — not identified`
    out.push({
      id: key,
      title,
      category: meta.category,
      chipLabel: meta.chipLabel,
      importance: clause.present ? meta.importance : "noted",
      plain: clause.present
        ? (clause.summary ?? "Clause identified in document.")
        : "This clause was not identified in the uploaded document.",
    })
  }

  // Payment term as a clause
  const ft = r.financialTerms
  if (ft.paymentAmount || ft.paymentSchedule) {
    const plain = [ft.paymentAmount, ft.paymentSchedule, ft.lateFees].filter(Boolean).join(" · ")
    out.push({
      id: "payment",
      title: `Payment terms — ${ft.paymentAmount ?? "amount not specified"}`,
      category: "Payment",
      chipLabel: "Payment",
      importance: "standard",
      plain: plain || "Payment terms present.",
    })
  }

  // Missing fields as "Missing" category clauses
  for (const f of r.missingFields) {
    out.push({
      id: `missing-${f}`,
      title: `Possible missing: ${f}`,
      category: "Missing",
      chipLabel: "Missing",
      importance: "attention",
      plain: `No ${f.toLowerCase()} clause identified. This may be standard for your document type — verify with a professional.`,
      action: "Term to verify — not legal advice.",
    })
  }

  return out
}

/* ─── Build obligations for E section ────────────────────────────────────── */

interface ObligationRow {
  obligation: string
  party: string
  deadline: string
  chip: string
}

function buildObligations(r: ClauseExtractionResults): ObligationRow[] {
  return r.obligations.map((ob, i) => ({
    obligation: ob.obligation,
    party: ob.party ?? "—",
    deadline: ob.deadline ?? "—",
    chip: `Obl. ${i + 1}`,
  }))
}

/* ─── Build dates for F section ──────────────────────────────────────────── */

interface DateRow {
  date: string
  event: string
  notice?: string
  chip: string
  amber?: boolean
}

function buildDates(r: ClauseExtractionResults): DateRow[] {
  const rows: DateRow[] = []
  const kd = r.keyDates
  if (kd.effectiveDate)   rows.push({ date: kd.effectiveDate,   event: "Agreement commencement date",          chip: "Eff. Date" })
  if (kd.executionDate)   rows.push({ date: kd.executionDate,   event: "Execution / signing date",            chip: "Exec. Date" })
  if (kd.expirationDate)  rows.push({ date: kd.expirationDate,  event: "Agreement expiration / end date",     chip: "Expiry" })
  if (kd.renewalDate)     rows.push({ date: kd.renewalDate,     event: "Renewal date",                        chip: "Renewal" })
  if (kd.noticeDeadline)  rows.push({ date: kd.noticeDeadline,  event: "Notice deadline",                     chip: "Notice", notice: kd.noticePeriod ?? undefined, amber: true })
  if (kd.noticePeriod && !kd.noticeDeadline)
    rows.push({ date: "See document", event: "Required notice period",             chip: "Notice", notice: kd.noticePeriod })
  return rows
}

/* ─── Confidence strip ────────────────────────────────────────────────────── */

function buildConfidenceStrip(r: ClauseExtractionResults): Array<{ label: string; cls: string }> {
  const presentCount = (Object.values(r.legalClauses) as ClausePresence[]).filter(c => c.present).length
  const totalClauses = Object.keys(r.legalClauses).length
  const confColor = r.extractionConfidence === "high"
    ? "bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/22 text-emerald-700 dark:text-emerald-300/80"
    : r.extractionConfidence === "medium"
    ? "bg-amber-100 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/22 text-amber-700 dark:text-amber-300/80"
    : "bg-rose-100 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/22 text-rose-700 dark:text-rose-300/80"
  return [
    { label: `${presentCount} of ${totalClauses} clauses extracted`, cls: confColor },
    { label: `${r.extractionConfidence.charAt(0).toUpperCase() + r.extractionConfidence.slice(1)} extraction confidence`, cls: confColor },
    ...(r.obligations.length > 0 ? [{ label: `${r.obligations.length} obligation${r.obligations.length !== 1 ? "s" : ""}`, cls: "bg-blue-100 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/22 text-blue-700 dark:text-blue-300/80" }] : []),
    ...(buildDates(r).length > 0 ? [{ label: `${buildDates(r).length} date${buildDates(r).length !== 1 ? "s" : ""} / deadline${buildDates(r).length !== 1 ? "s" : ""}`, cls: "bg-blue-100 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/22 text-blue-700 dark:text-blue-300/80" }] : []),
    ...(r.missingFields.length > 0 ? [{ label: `${r.missingFields.length} unclear or missing term${r.missingFields.length !== 1 ? "s" : ""}`, cls: "bg-amber-100 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/22 text-amber-700 dark:text-amber-300/80" }] : []),
  ]
}

/* ─── Document Viewer (left panel) ───────────────────────────────────────── */

const CLAUSE_TEXT_SIZES = [
  { label: "A",   body: "text-[11px]", title: "text-xs"     },
  { label: "A+",  body: "text-xs",     title: "text-[13px]" },
  { label: "A++", body: "text-sm",     title: "text-[14px]" },
] as const

interface DocViewerProps {
  session: ClauseExtractorSessionDetail
  sections: DocSect[]
  activeSection: string | null
  onClearSource: () => void
  evidenceBanner?: { sectionTitle: string; snippet?: string } | null
}

function DocViewer({ session, sections, activeSection, onClearSource, evidenceBanner }: DocViewerProps) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [sizeIdx, setSizeIdx] = useState<0 | 1 | 2>(0)
  const textSize = CLAUSE_TEXT_SIZES[sizeIdx]

  useEffect(() => {
    if (activeSection && sectionRefs.current[activeSection]) {
      sectionRefs.current[activeSection]?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [activeSection])

  const r = session.results
  const clauseCount = r ? Object.values(r.legalClauses).filter((c: ClausePresence) => c.present).length : null
  const totalClauses = r ? Object.keys(r.legalClauses).length : null
  const confidence = r?.extractionConfidence ?? null

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0d0d10]">
      {/* Tool identity row */}
      <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 shrink-0 bg-white/[0.01]">
        <ListChecks className="w-3 h-3 text-violet-400/45 shrink-0" />
        <span className="text-[10px] text-white/50 font-medium flex-1">Clause Extractor</span>
        {clauseCount != null && totalClauses != null && (
          <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${
            confidence === "high" ? "border-emerald-500/28 bg-emerald-500/10 text-emerald-300/75"
            : confidence === "medium" ? "border-blue-500/28 bg-blue-500/10 text-blue-300/75"
            : "border-amber-500/28 bg-amber-500/10 text-amber-300/75"
          }`}>{clauseCount} of {totalClauses} clauses extracted</span>
        )}
      </div>
      {/* File toolbar */}
      <div className="h-9 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <FileText className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
        <span className="text-white/58 text-xs flex-1 truncate">{session.fileName}</span>
        {sections.length > 0 && (
          <span className="text-white/50 text-xs shrink-0">{sections.length} sections</span>
        )}
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <div className="flex items-center gap-0.5">
          {CLAUSE_TEXT_SIZES.map((s, i) => (
            <button
              key={i}
              onClick={() => setSizeIdx(i as 0 | 1 | 2)}
              title={`Text size: ${s.label}`}
              className={`h-5 px-1.5 rounded text-[9px] font-medium transition-colors ${
                i === sizeIdx
                  ? "bg-white/[0.09] text-white/70"
                  : "text-white/28 hover:text-white/55 hover:bg-white/[0.05]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence banner — shown when source chip is active */}
      <AnimatePresence>
        {activeSection && evidenceBanner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mx-3 mt-2 mb-1 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5 shrink-0"
          >
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-violet-200/85 text-[10px] font-medium truncate">
                Source: {evidenceBanner.sectionTitle}
              </p>
              {evidenceBanner.snippet && (
                <p className="text-violet-300/45 text-[9px] italic truncate">"{evidenceBanner.snippet}"</p>
              )}
              <p className="text-violet-300/40 text-[9px]">Document scrolled to matching section</p>
            </div>
            <button
              onClick={onClearSource}
              className="text-white/20 hover:text-white/45 shrink-0 transition-colors"
              aria-label="Dismiss source"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {sections.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <FileText className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-white/22 text-sm font-medium mb-1">Document sections not available</p>
            <p className="text-white/15 text-xs max-w-xs">Upload a text-based PDF or DOCX to see document content here alongside extracted clauses.</p>
          </div>
        ) : (
          sections.map((sec, idx) => {
            const isActive = activeSection === sec.id
            return (
              <div
                key={sec.id}
                ref={el => { sectionRefs.current[sec.id] = el }}
                className={`w-full rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${
                  isActive
                    ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                    : activeSection
                    ? "border-white/[0.04] bg-white/[0.01] opacity-40"
                    : "border-white/[0.05] bg-white/[0.015]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-[9px] font-mono ${isActive ? "text-violet-300/60" : "text-white/18"}`}>
                    Section {idx + 1}
                  </span>
                  {isActive && (
                    <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
                      <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-200/75 text-[9px]">Source</span>
                    </div>
                  )}
                </div>
                {sec.title && (
                  <p className={`${textSize.title} font-semibold leading-tight ${isActive ? "text-violet-300/80" : "text-white/70"}`}>
                    {sec.title}
                  </p>
                )}
                <p className={`${textSize.body} leading-relaxed ${isActive ? "text-white/82" : "text-white/62"}`}>
                  {sec.body}
                </p>
                {isActive && sec.snippet && (
                  <div className="mt-1.5 rounded-lg border border-violet-500/18 bg-violet-500/[0.06] px-2.5 py-1.5">
                    <p className="text-violet-200/60 text-[9px] leading-relaxed line-clamp-2">"{sec.snippet}"</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Section navigation footer */}
      {sections.length > 0 && (
        <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
          <span className="text-white/20 text-xs">
            {activeSection
              ? `Section ${(sections.findIndex(s => s.id === activeSection) + 1)} of ${sections.length}`
              : `${sections.length} section${sections.length !== 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-1">
            {sections.slice(0, 8).map((s, i) => (
              <button
                key={s.id}
                onClick={() => { const el = sectionRefs.current[s.id]; if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }) }}
                className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center transition-colors ${
                  activeSection === s.id ? "bg-violet-600 text-white" : "text-white/22 hover:text-white/45 hover:bg-white/[0.05]"
                }`}
              >{i + 1}</button>
            ))}
          </div>
          <span className="text-white/14 text-[10px]">Jump to section</span>
        </div>
      )}
    </div>
  )
}

/* ─── Extraction Panel (right panel) ─────────────────────────────────────── */

interface ExtractionPanelProps {
  session: ClauseExtractorSessionDetail
  activeSection: string | null
  onSourceClick: (sectionId: string, sectionTitle: string, snippet?: string) => void
  onDelete: () => void
  onReExtract: () => void
  isMobile?: boolean
}

function ExtractionPanel({
  session, activeSection, onSourceClick, onDelete, onReExtract, isMobile,
}: ExtractionPanelProps) {
  const { copied, copy } = useCopy()
  const [, setLocation] = useLocation()
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All")
  const [sourceOpen, setSourceOpen] = useState(false)
  const [missingOpen, setMissingOpen] = useState(false)

  const r = session.results!

  const sections = useMemo(() => buildDocSections(r), [r])
  const keyClauses = useMemo(() => buildKeyClauses(r), [r])
  const obligations = useMemo(() => buildObligations(r), [r])
  const dates = useMemo(() => buildDates(r), [r])
  const confidenceStrip = useMemo(() => buildConfidenceStrip(r), [r])

  const filteredClauses = useMemo(() => {
    if (activeCategory === "All") return keyClauses
    return keyClauses.filter(c => c.category === activeCategory)
  }, [keyClauses, activeCategory])

  const secClausesRef   = useRef<HTMLDivElement>(null)
  const secObligRef     = useRef<HTMLDivElement>(null)
  const secDatesRef     = useRef<HTMLDivElement>(null)
  const secMissingRef   = useRef<HTMLDivElement>(null)

  const buildSummaryText = useCallback(() => {
    const lines: string[] = [
      `Clause Extractor — ${session.fileName}`,
      `Document type: ${r.documentType ?? "Unknown"}`,
      `Extraction confidence: ${r.extractionConfidence}`,
      "",
      "=== KEY CLAUSES ===",
      ...keyClauses.slice(0, 8).map(c => `• ${c.title} [${c.importance}]`),
      "",
      "=== OBLIGATIONS ===",
      ...obligations.map(o => `• [${o.party}] ${o.obligation} — ${o.deadline}`),
      "",
      "=== DATES ===",
      ...dates.map(d => `• ${d.date}: ${d.event}`),
      "",
      r.missingFields.length > 0 ? "=== MISSING / UNCLEAR ===" : "",
      ...r.missingFields.map(f => `• ${f}`),
    ]
    return lines.filter(l => l !== undefined).join("\n")
  }, [session, r, keyClauses, obligations, dates])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Command bar */}
      <div className={`border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 py-2.5 flex items-center gap-2 shrink-0 ${!isMobile ? "sticky top-0 z-10" : ""}`}>
        <button
          onClick={() => setLocation("/clause-extractor")}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate leading-tight">{session.fileName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">Clause Extractor</span>
            {r.documentType && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-px rounded-full border border-border/60">{r.documentType}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => copy(buildSummaryText())}
            className="h-7 px-2.5 rounded-lg border border-border/60 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={onDelete}
            className="h-7 px-2.5 rounded-lg border border-border/60 text-[11px] text-muted-foreground hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1.5"
            aria-label="Delete session"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Results-first chip navigation strip */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 py-2 flex flex-wrap gap-1.5 shrink-0">
          <button
            onClick={() => secClausesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="h-6 px-2.5 rounded-full border border-violet-300/50 dark:border-violet-500/25 bg-violet-50/60 dark:bg-violet-500/[0.08] text-violet-700 dark:text-violet-300/80 text-[10px] font-medium hover:bg-violet-100/60 dark:hover:bg-violet-500/12 transition-colors"
          >
            {keyClauses.length} clause{keyClauses.length !== 1 ? "s" : ""}
          </button>
          {obligations.length > 0 && (
            <button
              onClick={() => secObligRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="h-6 px-2.5 rounded-full border border-border/60 dark:border-white/10 text-muted-foreground dark:text-white/40 text-[10px] font-medium hover:bg-muted/50 dark:hover:bg-white/[0.04] transition-colors"
            >
              {obligations.length} obligation{obligations.length !== 1 ? "s" : ""}
            </button>
          )}
          {dates.length > 0 && (
            <button
              onClick={() => secDatesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="h-6 px-2.5 rounded-full border border-amber-300/50 dark:border-amber-500/22 bg-amber-50/50 dark:bg-amber-500/[0.07] text-amber-700 dark:text-amber-300/80 text-[10px] font-medium hover:bg-amber-100/50 dark:hover:bg-amber-500/12 transition-colors"
            >
              {dates.length} date{dates.length !== 1 ? "s" : ""}
            </button>
          )}
          {r.missingFields.length > 0 && (
            <button
              onClick={() => secMissingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="h-6 px-2.5 rounded-full border border-amber-300/50 dark:border-amber-500/22 bg-amber-50/50 dark:bg-amber-500/[0.07] text-amber-700 dark:text-amber-300/80 text-[10px] font-medium hover:bg-amber-100/50 dark:hover:bg-amber-500/12 transition-colors"
            >
              {r.missingFields.length} to verify
            </button>
          )}
        </div>

        {/* Doc identity */}
        <div className="px-4 pt-4 pb-3 border-b border-border/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/25 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight truncate">{session.fileName.replace(/\.[^.]+$/, "")}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {r.documentType ?? "Contract"} · {fmtBytes(session.fileSizeBytes)}
                {r.parties.length > 0 && ` · ${r.parties.length} part${r.parties.length !== 1 ? "ies" : "y"}`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-5">

          {/* A. Extraction Summary */}
          <div>
            <SectionLabel icon={BookOpen} text="A. Extraction Summary" />
            <div className="rounded-xl border border-border/50 bg-muted/20 dark:bg-white/[0.02] p-4 text-[12px] text-muted-foreground dark:text-white/58 leading-relaxed space-y-1.5">
              <p>
                <strong className="text-foreground dark:text-white/72 font-semibold">Document type:</strong>{" "}
                {r.documentType ?? "Contract or agreement"}.
              </p>
              <p>
                <strong className="text-foreground dark:text-white/72 font-semibold">Extracted clauses:</strong>{" "}
                {(Object.values(r.legalClauses) as ClausePresence[]).filter(c => c.present).length} clause categories identified
                {r.obligations.length > 0 ? `, ${r.obligations.length} obligation${r.obligations.length !== 1 ? "s" : ""}` : ""}.
              </p>
              {r.missingFields.length > 0 && (
                <p>
                  <strong className="text-amber-600 dark:text-amber-300/80 font-semibold">Terms to verify:</strong>{" "}
                  {r.missingFields.slice(0, 3).join(", ")}{r.missingFields.length > 3 ? ", and more" : ""} — not identified in the document.
                </p>
              )}
            </div>
            <div className="mt-2 flex items-start gap-1.5 px-1">
              <Info className="w-3 h-3 text-muted-foreground/30 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground/45">
                Source-backed extracted terms — not legal advice. Review with a qualified professional before signing.
              </p>
            </div>
          </div>

          {/* B. Confidence Strip */}
          <div>
            <SectionLabel icon={FileSearch} text="B. Confidence Strip" />
            <div className="rounded-xl border border-border/50 bg-muted/20 dark:bg-white/[0.02] p-3 flex flex-wrap gap-1.5">
              {confidenceStrip.map(c => (
                <span key={c.label} className={`h-6 px-2.5 rounded-full border text-[10px] font-medium ${c.cls}`}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>

          {/* C. Key Extracted Clauses + D. Category Filters */}
          <div ref={secClausesRef}>
            <div className="flex items-center justify-between mb-2.5">
              <SectionLabel icon={Tag} text="C. Key Extracted Clauses" inline />
              <span className="text-[10px] text-muted-foreground/50">{filteredClauses.length} shown</span>
            </div>

            {/* D. Category filter chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={[
                    "h-6 px-2.5 rounded-full border text-[10px] font-medium transition-colors",
                    activeCategory === cat
                      ? "bg-foreground/10 dark:bg-white/[0.1] border-foreground/20 dark:border-white/[0.15] text-foreground dark:text-white/75"
                      : "border-border/50 dark:border-white/[0.07] text-muted-foreground dark:text-white/35 hover:bg-muted/50 dark:hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredClauses.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-muted/20 py-6 text-center">
                <p className="text-xs text-muted-foreground/40">No clauses in this category.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClauses.map(cl => {
                  const imp = IMPORTANCE[cl.importance]
                  const sectionId = cl.id.startsWith("missing-") ? undefined : cl.id
                  const section = sections.find(s => s.id === sectionId)
                  const isActiveChip = activeSection === sectionId
                  return (
                    <div
                      key={cl.id}
                      className={[
                        "rounded-xl border p-3 transition-all duration-200",
                        isActiveChip
                          ? "border-violet-400/50 dark:border-violet-500/35 bg-violet-50/80 dark:bg-violet-500/[0.06] ring-1 ring-violet-400/20 dark:ring-violet-500/15"
                          : `${imp.border} ${imp.bg}`,
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${imp.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-foreground leading-snug">{cl.title}</p>
                            {sectionId && (
                              <SChip
                                label={cl.chipLabel}
                                active={isActiveChip}
                                onClick={() => {
                                  if (section) onSourceClick(cl.id, section.title, section.snippet)
                                  else if (sectionId) onSourceClick(sectionId, cl.title)
                                }}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${imp.badgeBg} ${imp.badgeBorder} ${imp.badgeText}`}>
                              {imp.label}
                            </span>
                            <span className="h-4 px-1.5 rounded bg-muted dark:bg-white/[0.05] border border-border dark:border-white/[0.08] text-[9px] text-muted-foreground dark:text-white/32">
                              {cl.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground dark:text-white/65 pl-4 leading-snug">{cl.plain}</p>
                      {cl.action && (
                        <p className="text-[10px] text-violet-600/60 dark:text-violet-300/50 pl-4 mt-1.5">› {cl.action}</p>
                      )}
                      {!sectionId && (
                        <div className="mt-2 pl-4 flex items-center gap-1.5">
                          <div className="h-px w-3 bg-muted-foreground/20 dark:bg-white/10 shrink-0" />
                          <span className="text-[9px] text-muted-foreground/40 dark:text-white/28 italic">No exact source found — not identified in this document</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* E. Obligations & Owners */}
          {obligations.length > 0 && (
            <div ref={secObligRef}>
              <SectionLabel icon={Users} text="E. Obligations & Owners" />
              <div className="rounded-xl border border-border/50 dark:border-white/[0.07] bg-muted/10 dark:bg-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-[9px] uppercase tracking-wide text-muted-foreground/40 font-semibold px-3.5 py-2 border-b border-border/40 dark:border-white/[0.05]">
                  <span>Obligation</span>
                  <span className="text-center px-2">Who</span>
                  <span className="text-center px-2">By when</span>
                  <span className="text-center px-2">Source</span>
                </div>
                {obligations.map((ob, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1fr_auto_auto_auto] gap-0 px-3.5 py-2.5 items-center ${i < obligations.length - 1 ? "border-b border-border/30 dark:border-white/[0.04]" : ""}`}
                  >
                    <p className="text-[11px] text-foreground/70 dark:text-white/70 leading-snug pr-2">{ob.obligation}</p>
                    <p className="text-[10px] text-muted-foreground dark:text-white/55 px-2 text-center whitespace-nowrap">{ob.party}</p>
                    <p className="text-[10px] text-muted-foreground/70 dark:text-white/50 px-2 text-center whitespace-nowrap">{ob.deadline}</p>
                    <div className="px-2 flex justify-center">
                      <SChip
                        label={ob.chip}
                        onClick={() => onSourceClick("obligations", "Obligations")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* F. Dates & Deadlines */}
          {dates.length > 0 && (
            <div ref={secDatesRef}>
              <SectionLabel icon={Calendar} text="F. Dates & Deadlines" />
              <div className="space-y-2">
                {dates.map((d, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-3 ${d.amber ? "border-amber-400/30 dark:border-amber-500/18 bg-amber-50/60 dark:bg-amber-500/[0.04]" : "border-border/50 dark:border-white/[0.06] bg-card dark:bg-white/[0.015]"}`}
                  >
                    <div className="w-24 shrink-0">
                      <p className="text-[11px] font-semibold text-foreground dark:text-white/65">{d.date}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground dark:text-white/68 truncate">{d.event}</p>
                      {d.notice && (
                        <p className="text-[10px] text-amber-600/70 dark:text-amber-300/50 mt-0.5">{d.notice}</p>
                      )}
                    </div>
                    <SChip
                      label={d.chip}
                      onClick={() => onSourceClick("dates", "Key Dates & Deadlines")}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* G. Missing / Unclear Clauses */}
          {r.missingFields.length > 0 && (
            <div ref={secMissingRef}>
              <button
                className="w-full"
                onClick={() => setMissingOpen(o => !o)}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <AlertTriangle className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                  <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground/40 flex-1 text-left">
                    G. Missing / Unclear Clauses
                  </p>
                  <span className="h-4 px-1.5 rounded border bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/18 text-[9px] text-amber-700 dark:text-amber-300/55">
                    {r.missingFields.length} flagged
                  </span>
                  {missingOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/30" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/30" />}
                </div>
              </button>
              <AnimatePresence initial={false}>
                {missingOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pb-1">
                      {r.missingFields.map((f, i) => (
                        <div key={i} className="rounded-xl border border-amber-400/25 dark:border-amber-500/18 bg-amber-50/40 dark:bg-amber-500/[0.04] p-3.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 shrink-0" />
                            <p className="text-[11px] font-semibold text-foreground/70 dark:text-white/65">{f}</p>
                            <span className="ml-auto h-4 px-1.5 rounded border bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/18 text-[9px] font-medium text-amber-700 dark:text-amber-300/55">
                              Possible gap
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 dark:text-white/58 pl-3.5 leading-snug">
                            No {f.toLowerCase()} clause identified. Verify whether this applies to your situation — not legal advice.
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* H. Source Traceability */}
          <div>
            <button
              className="w-full rounded-xl border border-border/50 dark:border-white/[0.06] bg-muted/10 dark:bg-white/[0.01] hover:bg-muted/30 dark:hover:bg-white/[0.025] transition-colors"
              onClick={() => setSourceOpen(o => !o)}
            >
              <div className="flex items-center gap-2.5 px-4 py-3">
                <Layers className="w-3.5 h-3.5 text-muted-foreground/30" />
                <p className="text-muted-foreground/50 text-xs font-medium flex-1 text-left">H. Source Traceability</p>
                <span className="h-4 px-1.5 rounded border bg-violet-100 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/18 text-[9px] text-violet-600 dark:text-violet-300/55">
                  {sections.length} sections
                </span>
                {sourceOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/25" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/25" />}
              </div>
            </button>
            <AnimatePresence initial={false}>
              {sourceOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1.5 pb-1">
                    {sections.map(sec => (
                      <div
                        key={sec.id}
                        className="rounded-xl border border-border/40 dark:border-white/[0.05] bg-card dark:bg-white/[0.015] px-3.5 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-muted/30 dark:hover:bg-white/[0.03] transition-colors"
                        onClick={() => onSourceClick(sec.id, sec.title, sec.snippet)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground/65 dark:text-white/55">{sec.title}</p>
                          <p className="text-[10px] text-muted-foreground/40 dark:text-white/28 truncate mt-0.5">{sec.body.slice(0, 60)}…</p>
                        </div>
                        <SChip label={sec.id.slice(0, 8)} onClick={() => onSourceClick(sec.id, sec.title, sec.snippet)} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
        <div className="h-8" />
      </div>
    </div>
  )
}

/* ─── Section label helper ────────────────────────────────────────────────── */

function SectionLabel({
  icon: Icon, text, inline,
}: { icon: React.ElementType; text: string; inline?: boolean }) {
  const content = (
    <div className={`flex items-center gap-1.5 ${inline ? "" : "mb-2.5"}`}>
      <Icon className="w-3 h-3 text-muted-foreground/30 dark:text-white/25" />
      <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground/40 dark:text-white/24">{text}</p>
    </div>
  )
  return content
}

/* ─── WorkspaceView (completed state) ────────────────────────────────────── */

function WorkspaceView({
  session,
  onDelete,
}: {
  session: ClauseExtractorSessionDetail
  onDelete: () => void
}) {
  const [, setLocation] = useLocation()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [evidenceBanner, setEvidenceBanner] = useState<{ sectionTitle: string; snippet?: string } | null>(null)
  const [mobileTab, setMobileTab] = useState<"clauses" | "document">("clauses")

  const r = session.results!
  const sections = useMemo(() => buildDocSections(r), [r])

  const handleSourceClick = useCallback((sectionId: string, sectionTitle: string, snippet?: string) => {
    setActiveSection(prev => prev === sectionId ? null : sectionId)
    setEvidenceBanner(prev => prev?.sectionTitle === sectionTitle ? null : { sectionTitle, snippet })
  }, [])

  const handleClearSource = useCallback(() => {
    setActiveSection(null)
    setEvidenceBanner(null)
  }, [])

  const handleReExtract = useCallback(() => {
    setLocation("/clause-extractor")
  }, [setLocation])

  const clauseCount = r.legalClauses
    ? Object.values(r.legalClauses).filter((c: import("@/lib/clauseExtractorTypes").ClausePresence) => c.present).length
    : 0

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d10] text-white overflow-hidden">

      {/* Page-level tool header */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <button
          onClick={handleReExtract}
          className="p-1 rounded-md text-white/25 hover:text-white/55 transition-colors mr-0.5"
          aria-label="New extraction"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <ListChecks className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/30 text-xs font-medium">PlainPath</span>
        <span className="text-white/15 text-xs">·</span>
        <span className="text-white/70 text-xs font-semibold">Clause Extractor</span>
        <ChevronRight className="w-3 h-3 text-white/15 shrink-0" />
        <span className="text-white/38 text-xs truncate max-w-[160px]">{session.fileName}</span>
        {clauseCount > 0 && (
          <div className="h-5 px-2 rounded-full bg-violet-600/15 border border-violet-500/20 flex items-center shrink-0">
            <span className="text-[10px] text-violet-300/70">{clauseCount} clause{clauseCount !== 1 ? "s" : ""} found</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleReExtract}
            className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 text-xs font-medium hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> New
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 hover:text-rose-400/70 hover:border-rose-500/20 hover:bg-rose-500/[0.04] transition-colors"
            aria-label="Delete session"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="flex border-b border-white/[0.06] bg-[#0d0d10] shrink-0 sm:hidden">
        <button
          onClick={() => setMobileTab("clauses")}
          className={`flex-1 h-10 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "clauses"
              ? "text-violet-400 border-b-2 border-violet-500"
              : "text-white/30"
          }`}
        >
          <FileSearch className="w-3.5 h-3.5" /> Clauses
        </button>
        <button
          onClick={() => setMobileTab("document")}
          className={`flex-1 h-10 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "document"
              ? "text-violet-400 border-b-2 border-violet-500"
              : "text-white/30"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Document
        </button>
      </div>

      {/* Split workspace — desktop */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left: Doc Viewer — hidden on mobile when Clauses tab */}
        <div className={`
          ${mobileTab === "clauses" ? "hidden sm:flex" : "flex"}
          w-full sm:w-[58%] border-r border-border/50 flex-col overflow-hidden
        `}>
          <DocViewer
            session={session}
            sections={sections}
            activeSection={activeSection}
            onClearSource={handleClearSource}
            evidenceBanner={evidenceBanner}
          />
        </div>

        {/* Right: Extraction Panel — hidden on mobile when Document tab */}
        <div className={`
          ${mobileTab === "document" ? "hidden sm:flex" : "flex"}
          w-full sm:flex-1 flex-col overflow-hidden
        `}>
          <ExtractionPanel
            session={session}
            activeSection={activeSection}
            onSourceClick={handleSourceClick}
            onDelete={onDelete}
            onReExtract={handleReExtract}
            isMobile={false}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Low Confidence View ─────────────────────────────────────────────────── */

function LowConfView({
  session,
  onRetry,
  onUploadDifferent,
}: {
  session: ClauseExtractorSessionDetail
  onRetry: () => void
  onUploadDifferent: () => void
}) {
  const r = session.results

  if (r) {
    return <WorkspaceView session={session} onDelete={onUploadDifferent} />
  }

  return (
    <div className="flex flex-col sm:flex-row h-full min-h-0">
      {/* Left: doc viewer placeholder */}
      <div className="w-full sm:w-[58%] border-b sm:border-b-0 sm:border-r border-border/50 flex flex-col overflow-hidden">
        <div className="h-10 border-b border-border/50 flex items-center px-4 gap-2 shrink-0 bg-muted/20">
          <FileText className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground/60 font-medium truncate">{session.fileName}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {[
            { ok: true,  title: "Parties & Scope",      body: "Parties identified — readable section." },
            { ok: false, title: "Financial Terms",       body: "Fee schedule — partially readable.", lines: [55, 35, 45] },
            { ok: false, title: "Termination / Notice",  body: "Notice period — language unclear.",   lines: [40, 30, 50] },
            { ok: false, title: "Signature block",       body: "Execution block — partially unreadable.", lines: [30, 20, 25] },
          ].map((pg, i) => (
            <div key={i} className={`rounded-xl border p-3.5 ${pg.ok ? "border-emerald-400/30 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-500/[0.03]" : "border-amber-400/30 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/[0.03]"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] font-semibold ${pg.ok ? "text-emerald-600 dark:text-emerald-400/60" : "text-amber-600 dark:text-amber-400/60"}`}>{pg.title}</p>
                <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${pg.ok ? "bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/18 text-emerald-700 dark:text-emerald-300/55" : "bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/18 text-amber-700 dark:text-amber-300/55"}`}>
                  {pg.ok ? "extracted" : "partial"}
                </span>
              </div>
              {pg.ok ? (
                <p className="text-[11px] text-muted-foreground/60 dark:text-white/48">{pg.body}</p>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-amber-600/50 dark:text-amber-300/45 italic mb-1">{pg.body}</p>
                  {pg.lines!.map((w, j) => (
                    <div key={j} className="h-1.5 rounded-full bg-amber-500/20" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Low conf panel */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="rounded-xl border border-amber-400/30 dark:border-amber-500/25 bg-amber-50/60 dark:bg-amber-500/[0.05] p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200/85">Partial clause extraction — low scan quality</p>
          </div>
          <p className="text-xs text-amber-700/70 dark:text-amber-200/55 leading-relaxed mb-4">
            PlainPath could extract part of this document, but the scan quality limits extraction confidence. Key sections could not be fully extracted. The findings below are partial only.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={onRetry}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
            <button
              onClick={onUploadDifferent}
              className="flex-1 border border-border text-muted-foreground text-xs font-medium py-2.5 rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Different file
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 font-semibold mb-3">Recommended next steps</p>
          <div className="space-y-2">
            {[
              { icon: Upload,         title: "Upload a clearer scan or higher-resolution PDF", desc: "Better image quality enables more complete clause extraction." },
              { icon: FileText,       title: "Upload a text-based version",                    desc: "Export from Word or the original source app for best results." },
              { icon: MessageCircle,  title: "Ask This Document",                              desc: "Ask targeted questions — sometimes works on poor-quality scans." },
              { icon: FileSearch,     title: "Analyze a Document",                             desc: "Plain-English analysis from whatever text was extracted." },
            ].map(opt => (
              <button
                key={opt.title}
                onClick={onUploadDifferent}
                className="w-full rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors px-4 py-3 flex items-center gap-3 text-left"
              >
                <opt.icon className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground/65">{opt.title}</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/30">
          Incomplete or partial findings should be reviewed with a qualified professional. PlainPath provides extraction support, not legal advice.
        </p>
      </div>
    </div>
  )
}

/* ─── Error View ──────────────────────────────────────────────────────────── */

function ErrorView({
  message,
  fileName,
  onRetry,
  onUploadDifferent,
}: {
  message: string
  fileName?: string
  onRetry: () => void
  onUploadDifferent: () => void
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm w-full">
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <h2 className="text-base font-bold text-foreground mb-2">Clause extraction could not be completed.</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mb-6">{message}</p>

          {fileName && (
            <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 flex items-center gap-3 text-left mb-6">
              <div className="w-7 h-7 rounded-lg bg-muted border border-border/40 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{fileName}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">Extraction failed</p>
              </div>
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={onRetry}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
            <button
              onClick={onUploadDifferent}
              className="flex-1 border border-border text-muted-foreground text-xs font-medium py-2.5 rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Different file
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 font-semibold mb-3 text-center">What you can try instead</p>
          <div className="space-y-2">
            {[
              { icon: MessageCircle, title: "Ask This Document",   desc: "Ask targeted questions — works on some protected files." },
              { icon: FileSearch,    title: "Analyze a Document",  desc: "Plain-English analysis once the file is readable." },
            ].map(opt => (
              <button
                key={opt.title}
                onClick={onUploadDifferent}
                className="w-full rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors px-4 py-3 flex items-center gap-3 text-left"
              >
                <opt.icon className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground/65">{opt.title}</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/30 mt-6">Clause extraction support — source-backed extracted terms, not legal advice.</p>
      </div>
    </div>
  )
}

/* ─── Upload View ─────────────────────────────────────────────────────────── */

type UploadStage = "idle" | "selected" | "uploading"

function UploadView({
  onUploaded,
  onUploading,
  onDemo,
}: {
  onUploaded: (s: ClauseExtractorSessionDetail) => void
  onUploading: (fileName: string | null) => void
  onDemo: (s: ClauseExtractorSessionDetail) => void
}) {
  const { getToken } = useAuth()
  const [stage, setStage] = useState<UploadStage>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndSelect = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!ext || !["pdf", "docx"].includes(ext)) {
      setError("Only PDF and DOCX files are supported.")
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20 MB.")
      return
    }
    setError(null)
    setSelectedFile(file)
    setStage("selected")
  }, [])

  const handleExtract = useCallback(async () => {
    if (!selectedFile) return
    setError(null)
    setStage("uploading")
    onUploading(selectedFile.name)
    try {
      const token = await getToken().catch(() => null)
      const session = await clauseExtractorApi.createSession(selectedFile, token)
      onUploaded(session)
    } catch (e: any) {
      setError(e.message || "Upload failed. Please try again.")
      setStage("selected")
      onUploading(null)
    }
  }, [selectedFile, getToken, onUploaded, onUploading])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setStage("idle")
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }, [validateAndSelect])

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d10] text-white">

      {/* Tool header */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <button
          onClick={() => window.history.back()}
          className="p-1 rounded-md text-white/25 hover:text-white/55 transition-colors mr-0.5"
          aria-label="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <ListChecks className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/30 text-xs font-medium">PlainPath</span>
        <span className="text-white/15 text-xs">·</span>
        <span className="text-white/70 text-xs font-semibold">Clause Extractor</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-5 py-14 flex flex-col items-center text-center">

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-5">
            <ListChecks className="w-7 h-7 text-violet-400/70" />
          </div>
          <h2 className="text-white/90 text-lg font-semibold mb-2">Extract key clauses from any contract.</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-7 max-w-sm">
            Upload a contract or agreement — key clauses, obligations, dates, and responsible parties are extracted and organized automatically.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSelect(f) }}
          />

          <AnimatePresence mode="wait">
            {stage === "idle" && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div
                  className={`w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer px-8 py-10 mb-4 ${
                    dragging
                      ? "border-violet-400/60 bg-violet-500/[0.06]"
                      : "border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.025] hover:border-violet-500/25"
                  }`}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-600/12 border border-violet-500/18 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-5 h-5 text-violet-400/70" />
                  </div>
                  <p className="text-white/55 text-sm font-medium mb-1">Drop your contract here</p>
                  <p className="text-white/28 text-xs mb-4">PlainPath reads the contract and extracts obligations, deadlines, and key terms</p>
                  <button
                    onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                    className="h-8 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                  >
                    Choose file
                  </button>
                  <p className="text-white/18 text-[10px] mt-2">PDF or DOCX · Up to 20 MB</p>
                </div>
              </motion.div>
            )}

            {(stage === "selected" || stage === "uploading") && selectedFile && (
              <motion.div
                key="selected"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full space-y-3 mb-4"
              >
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/12 border border-violet-500/18 flex items-center justify-center shrink-0">
                    <FileType2 className="w-5 h-5 text-violet-400/70" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white/80 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-white/30">
                      {fmtBytes(selectedFile.size)} · {selectedFile.name.split(".").pop()?.toUpperCase()}
                    </p>
                  </div>
                  {stage === "selected" && (
                    <button
                      onClick={clearFile}
                      className="p-1.5 rounded-lg text-white/25 hover:text-white/55 hover:bg-white/[0.04] transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  className="w-full h-11 rounded-xl gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold flex items-center justify-center transition-colors disabled:opacity-50"
                  onClick={handleExtract}
                  disabled={stage === "uploading"}
                >
                  {stage === "uploading" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  ) : (
                    <><ListChecks className="w-4 h-4" /> Extract Clauses</>
                  )}
                </button>
                <p className="text-xs text-white/25 text-center">
                  AI extracts key clauses, obligations, and dates — usually 15–30 seconds
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full mt-1 mb-4 flex items-center gap-2 text-sm text-rose-400 text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Trust chips */}
          <div className="flex items-center justify-center gap-5 mb-7">
            <span className="flex items-center gap-1.5 text-white/28 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/60" />
              End-to-end encrypted
            </span>
            <span className="flex items-center gap-1.5 text-white/28 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400/60" />
              Extracts in ~20 sec
            </span>
          </div>

          {/* Disclaimer */}
          <div className="w-full flex items-start gap-2 rounded-xl border border-white/[0.05] bg-amber-500/[0.04] px-3 py-2.5 mb-8 text-left">
            <Info className="w-3.5 h-3.5 text-amber-400/50 shrink-0 mt-0.5" />
            <p className="text-white/48 text-[10px] leading-relaxed">
              PlainPath identifies and organizes contract terms for review.{" "}
              <span className="text-amber-300/65 font-medium">Results are not legal advice.</span>{" "}
              Always verify with a qualified professional before acting on any contract term.
            </p>
          </div>

          {/* Works well with */}
          <p className="text-white/48 text-[9px] uppercase tracking-widest font-semibold mb-3">Works well with</p>
          <div className="w-full grid grid-cols-2 gap-2 mb-8">
            {CE_WORKS_WELL_WITH.map(item => (
              <div
                key={item.label}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] text-left"
              >
                <item.icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${item.color}`} />
                <div>
                  <p className="text-white/52 text-[11px] font-medium leading-tight">{item.label}</p>
                  <p className="text-white/42 text-[10px] leading-tight mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Demo chips */}
          <p className="text-white/48 text-[9px] uppercase tracking-widest font-semibold mb-3">Or try a demo</p>
          <div className="w-full flex flex-col gap-2">
            {CLAUSE_DEMOS.map(d => (
              <button
                key={d.id}
                onClick={() => onDemo(d.data)}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/20 hover:bg-violet-500/[0.03] transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-violet-600/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                  <ListChecks className="w-3.5 h-3.5 text-violet-400/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/55 text-xs font-medium leading-tight">{d.label}</p>
                  <p className="text-white/42 text-[10px]">{d.description}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/18 shrink-0" />
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ─── Processing View ─────────────────────────────────────────────────────── */

function ProcessingView({
  sessionId,
  onDone,
  onError,
}: {
  sessionId: string
  onDone: (s: ClauseExtractorSessionDetail) => void
  onError: (msg: string) => void
}) {
  const { getToken } = useAuth()

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const token = await getToken().catch(() => null)
        while (!cancelled) {
          await new Promise(r => setTimeout(r, 2500))
          const s = await clauseExtractorApi.getSession(sessionId, token)
          if (cancelled) return
          if (s.status === "done") { onDone(s); return }
          if (s.status === "error") { onError(s.errorMessage || "Extraction failed"); return }
        }
      } catch (e: any) {
        if (!cancelled) onError(e.message || "Network error")
      }
    }
    poll()
    return () => { cancelled = true }
  }, [sessionId])

  return null
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

type PageState =
  | { stage: "upload" }
  | { stage: "processing"; sessionId: string; fileName: string }
  | { stage: "results"; session: ClauseExtractorSessionDetail }
  | { stage: "lowconf"; session: ClauseExtractorSessionDetail }
  | { stage: "error"; message: string; fileName?: string }

export default function ClauseExtractor() {
  const { id } = useParams<{ id?: string }>()
  const { getToken } = useAuth()
  const [, setLocation] = useLocation()

  const [state, setState] = useState<PageState>(() =>
    id ? { stage: "processing", sessionId: id, fileName: "" } : { stage: "upload" }
  )
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null)

  const handleUploading = useCallback((fileName: string | null) => {
    setUploadingFileName(fileName)
  }, [])

  const handleUploaded = useCallback((session: ClauseExtractorSessionDetail) => {
    setUploadingFileName(null)
    if (session.status === "error") {
      setState({ stage: "error", message: session.errorMessage || "Extraction failed.", fileName: session.fileName })
    } else if (session.status === "done" && session.results) {
      if (session.results.extractionConfidence === "low") {
        setState({ stage: "lowconf", session })
      } else {
        setState({ stage: "results", session })
      }
      setLocation(`/clause-extractor/${session.id}`, { replace: true })
    } else {
      setState({ stage: "processing", sessionId: session.id, fileName: session.fileName })
      setLocation(`/clause-extractor/${session.id}`, { replace: true })
    }
  }, [setLocation])

  const handleDone = useCallback((session: ClauseExtractorSessionDetail) => {
    setUploadingFileName(null)
    if (session.results?.extractionConfidence === "low") {
      setState({ stage: "lowconf", session })
    } else {
      setState({ stage: "results", session })
    }
  }, [])

  const handleDelete = useCallback(async () => {
    const sessionId = state.stage === "results" ? state.session.id
      : state.stage === "lowconf" ? state.session.id
      : null
    if (sessionId) {
      try {
        const token = await getToken().catch(() => null)
        await clauseExtractorApi.deleteSession(sessionId, token)
      } catch {}
    }
    setState({ stage: "upload" })
    setLocation("/clause-extractor", { replace: true })
  }, [state, getToken, setLocation])

  const handleRetry = useCallback(() => {
    setState({ stage: "upload" })
    setLocation("/clause-extractor", { replace: true })
  }, [setLocation])

  const handleDemo = useCallback((session: ClauseExtractorSessionDetail) => {
    setState({ stage: "results", session })
  }, [])

  // Processing scan screen
  if (uploadingFileName) {
    return <DocumentScanScreen mode="clause-extractor" fileName={uploadingFileName} />
  }

  // Processing polling (url-loaded)
  if (state.stage === "processing") {
    return (
      <>
        <DocumentScanScreen mode="clause-extractor" fileName={state.fileName || "document"} />
        <ProcessingView
          sessionId={state.sessionId}
          onDone={handleDone}
          onError={msg => setState({ stage: "error", message: msg })}
        />
      </>
    )
  }

  // Workspace layouts — full height
  if (state.stage === "results") {
    return <WorkspaceView session={state.session} onDelete={handleDelete} />
  }

  if (state.stage === "lowconf") {
    return (
      <div className="h-full flex flex-col">
        <LowConfView
          session={state.session}
          onRetry={handleRetry}
          onUploadDifferent={handleRetry}
        />
      </div>
    )
  }

  if (state.stage === "error") {
    return (
      <div className="h-full flex flex-col">
        <ErrorView
          message={state.message}
          fileName={state.fileName}
          onRetry={handleRetry}
          onUploadDifferent={handleRetry}
        />
      </div>
    )
  }

  // Upload
  return <UploadView onUploaded={handleUploaded} onUploading={handleUploading} onDemo={handleDemo} />
}
