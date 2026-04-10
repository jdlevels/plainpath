import { useState, useEffect, useCallback, useMemo } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  Code2, Lock, CreditCard, Briefcase, Home as HomeIcon,
  ArrowRight, ArrowLeft, Sparkles, AlertTriangle, CheckCircle2,
  Info, ChevronDown, ChevronUp, Save, FileText, RotateCcw,
  Shield, Clock, DollarSign, Users, BookOpen, ClipboardCheck,
  Loader2, Download, TriangleAlert, Search, Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { getApiBaseUrl } from "@/lib/api"
import { beforeRunContractDraft, UsageLimitError } from "@/lib/analysisGate"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeModal from "@/components/UpgradeModal"
import SendForSignatureModal from "@/components/SendForSignatureModal"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ContractType = "freelance" | "nda" | "payment-agreement" | "service-agreement" | "lease"
type PaymentStructure = "flat" | "hourly" | "milestone"
type IPTiming = "on-creation" | "on-payment" | "limited-license"
type DisputeResolution = "negotiation" | "mediation" | "arbitration" | "court"
type PartyType = "individual" | "business"

interface PeopleData {
  clientName: string
  clientType: PartyType
  clientEntityName: string
  clientAddress: string
  clientState: string
  freelancerName: string
  freelancerType: PartyType
  freelancerEntityName: string
  freelancerAddress: string
  governingLaw: string
  projectTitle: string
  // NDA / simple fields
  partyAName: string
  partyAType: PartyType
  partyBName: string
  partyBType: PartyType
}

interface ScopeData {
  serviceType: string
  scopeDescription: string
  deliverables: string
  exclusions: string
  revisionLimit: string
  acceptanceCriteria: string
  // NDA
  purposeOfDisclosure: string
  confidentialInfoDescription: string
  ndaTerm: string
  // Service Agreement
  serviceSchedule: string
  serviceStandards: string
  // Lease
  propertyAddress: string
  propertyType: string
  propertyDescription: string
  leaseType: string
  utilitiesIncluded: string
  petsAllowed: string
}

interface MoneyData {
  paymentStructure: PaymentStructure
  totalFee: string
  hourlyRate: string
  depositRequired: boolean
  depositAmount: string
  lateFee: boolean
  lateFeeAmount: string
  startDate: string
  deadline: string
  invoiceDueDays: string
  milestones: Array<{ name: string; amount: string; date: string }>
  // Lease-specific
  monthlyRent: string
  securityDeposit: string
  petDeposit: string
  leaseTerm: string
  leaseStartDate: string
  leaseEndDate: string
}

interface ProtectionData {
  ipTiming: IPTiming
  portfolioUsage: boolean
  confidentiality: boolean
  terminationNoticeDays: string
  killFee: boolean
  killFeeAmount: string
  disputeResolution: DisputeResolution
  clientFeedbackDeadlineDays: string
  fileReleaseOnPayment: boolean
  subcontractingAllowed: boolean
}

interface AIInsights {
  suggestions: string[]
  warnings: string[]
  draftGuidance: string[]
}

interface DraftSection { title: string; clauses: string[] }
interface DraftParty { label: string; name: string; type: string }
interface DraftPayload {
  contractType: string
  parties: { partyA: DraftParty; partyB: DraftParty }
  sections: DraftSection[]
  paymentSummary: string[]
  protectionSummary: string[]
  defaultClauses: string[]
  reviewFlags: string[]
  missingProtections: string[]
  plainEnglishSummary: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILDER DEMO PRE-FILLS
// ─────────────────────────────────────────────────────────────────────────────

interface BuilderDemo {
  id: string
  label: string
  meta: string
  contractType: ContractType
  people: Partial<PeopleData>
  scope: Partial<ScopeData>
  money: Partial<MoneyData>
  protection: Partial<ProtectionData>
}

const BUILDER_DEMOS: BuilderDemo[] = [
  {
    id: "web-dev-freelance",
    label: "Freelance Web Dev Contract",
    meta: "Freelance · Flat-fee · 30-day project",
    contractType: "freelance",
    people: {
      clientName: "Acme Corp",
      clientType: "business",
      clientEntityName: "Acme Corporation LLC",
      clientAddress: "123 Market St, San Francisco, CA 94105",
      clientState: "California",
      freelancerName: "Jordan Lee",
      freelancerType: "individual",
      freelancerAddress: "456 Oak Ave, Oakland, CA 94601",
      governingLaw: "California",
      projectTitle: "E-commerce Website Redesign",
    },
    scope: {
      serviceType: "Web Development",
      scopeDescription: "Full redesign and development of Acme Corp's e-commerce storefront using React and Tailwind CSS, including product catalogue, cart, and checkout flow.",
      deliverables: "1) Figma mockups (mobile + desktop)\n2) Fully coded React storefront\n3) Stripe payment integration\n4) Admin dashboard for product management\n5) Deployment to Vercel",
      exclusions: "Custom CMS development, SEO copywriting, logo design, ongoing hosting fees.",
      revisionLimit: "2",
      acceptanceCriteria: "Deliverables are accepted when they match approved Figma mockups, pass basic QA testing, and process a successful test payment.",
    },
    money: {
      paymentStructure: "milestone",
      depositRequired: true,
      depositAmount: "2500",
      lateFee: true,
      lateFeeAmount: "1.5",
      startDate: "2026-05-01",
      deadline: "2026-05-31",
      invoiceDueDays: "14",
      milestones: [
        { name: "Kickoff deposit", amount: "2500", date: "2026-05-01" },
        { name: "Mockup approval", amount: "2500", date: "2026-05-15" },
        { name: "Final delivery", amount: "2000", date: "2026-05-31" },
      ],
    },
    protection: {
      ipTiming: "on-payment",
      portfolioUsage: true,
      confidentiality: true,
      terminationNoticeDays: "7",
      killFee: true,
      killFeeAmount: "25",
      disputeResolution: "negotiation",
      clientFeedbackDeadlineDays: "5",
      fileReleaseOnPayment: true,
      subcontractingAllowed: false,
    },
  },
  {
    id: "nda-mutual",
    label: "Mutual Non-Disclosure Agreement",
    meta: "NDA · 2-year term · Both parties",
    contractType: "nda",
    people: {
      partyAName: "TechVenture Inc",
      partyAType: "business",
      partyBName: "Bright Idea Studios",
      partyBType: "business",
      governingLaw: "New York",
      projectTitle: "Product Partnership Exploration",
    },
    scope: {
      purposeOfDisclosure: "Evaluating a potential co-development partnership for a B2B SaaS product. Both parties may share proprietary technology roadmaps, financial projections, and customer data.",
      confidentialInfoDescription: "Business plans, source code, product roadmaps, financial data, customer lists, and any information marked 'Confidential' or that a reasonable person would understand to be confidential.",
      ndaTerm: "2",
    },
    money: {
      paymentStructure: "flat",
      depositRequired: false,
      lateFee: false,
    },
    protection: {
      confidentiality: true,
      disputeResolution: "arbitration",
      subcontractingAllowed: false,
      portfolioUsage: false,
      ipTiming: "on-payment",
      fileReleaseOnPayment: false,
      killFee: false,
    },
  },
  {
    id: "lease-residential",
    label: "Residential Lease Agreement",
    meta: "Lease · 12-month · 2-bed apartment",
    contractType: "lease",
    people: {
      partyAName: "Greenwood Properties LLC",
      partyAType: "business",
      partyBName: "Sam Rivera",
      partyBType: "individual",
      governingLaw: "Texas",
      projectTitle: "2BR Apartment at 88 Elm Street",
    },
    scope: {
      propertyAddress: "88 Elm Street, Unit 4B, Austin, TX 78701",
      propertyType: "Apartment",
      propertyDescription: "2-bedroom, 1-bathroom apartment on the 4th floor. Includes one assigned parking space (#12). No smoking permitted on premises.",
      leaseType: "fixed",
      utilitiesIncluded: "Water and trash. Tenant is responsible for electricity, gas, and internet.",
      petsAllowed: "Small pets under 25 lbs permitted with a $300 pet deposit.",
    },
    money: {
      paymentStructure: "flat",
      monthlyRent: "1850",
      securityDeposit: "3700",
      petDeposit: "300",
      leaseTerm: "12",
      leaseStartDate: "2026-06-01",
      leaseEndDate: "2027-05-31",
      depositRequired: true,
      lateFee: true,
      lateFeeAmount: "75",
    },
    protection: {
      terminationNoticeDays: "60",
      disputeResolution: "mediation",
      confidentiality: false,
      killFee: false,
      subcontractingAllowed: false,
      portfolioUsage: false,
      ipTiming: "on-payment",
      fileReleaseOnPayment: false,
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ["Type", "People", "Scope", "Money", "Protection", "Review"]
const DEFAULT_CLAUSES = ["Severability clause", "Entire Agreement clause", "Notices clause", "Force majeure clause"]

const CONTRACT_TYPES: Array<{
  id: ContractType
  title: string
  description: string
  example: string
  Icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  ready: boolean
}> = [
  {
    id: "freelance",
    title: "Freelance Services Agreement",
    description: "For independent contractors delivering a defined project or service.",
    example: "e.g. Logo design, web development, copywriting",
    Icon: Code2,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    ready: true,
  },
  {
    id: "nda",
    title: "NDA / Confidentiality Agreement",
    description: "Protects sensitive information shared between two parties.",
    example: "e.g. Business partnership, hiring process, vendor talks",
    Icon: Lock,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    ready: true,
  },
  {
    id: "payment-agreement",
    title: "Simple Payment Agreement",
    description: "Formalises a payment plan between two parties.",
    example: "e.g. Personal loan, installment plan, deposit arrangement",
    Icon: CreditCard,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ready: true,
  },
  {
    id: "service-agreement",
    title: "Service Agreement",
    description: "General agreement for ongoing or retainer-based services.",
    example: "e.g. IT support, cleaning services, consulting retainer",
    Icon: Briefcase,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ready: true,
  },
  {
    id: "lease",
    title: "Lease / Rental Agreement",
    description: "Defines the terms of a property rental between landlord and tenant.",
    example: "e.g. Apartment lease, equipment rental, office space",
    Icon: HomeIcon,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    ready: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function contractLabel(ct: ContractType | null): string {
  return CONTRACT_TYPES.find((c) => c.id === ct)?.title ?? "Contract"
}

function computeRuleInsights(
  step: number,
  contractType: ContractType | null,
  people: Partial<PeopleData>,
  scope: Partial<ScopeData>,
  money: Partial<MoneyData>,
  protection: Partial<ProtectionData>
): AIInsights {
  const suggestions: string[] = []
  const warnings: string[] = []
  const draftGuidance: string[] = []

  if (!contractType) return { suggestions, warnings, draftGuidance }

  if (contractType === "freelance") {
    if (step >= 3) {
      const fee = parseFloat((money.totalFee ?? "").replace(/[^0-9.]/g, "") || "0")
      if (fee > 1500 && !money.depositRequired) {
        suggestions.push("Projects over $1,500 — consider requiring a deposit before work starts.")
      }
      if (!money.lateFee) {
        warnings.push("No late fee added. Late payments are very common without one.")
      }
      if (money.paymentStructure === "milestone") {
        draftGuidance.push("Milestone structure selected — a payment schedule clause will be added.")
      }
      if (money.depositRequired && money.depositAmount) {
        draftGuidance.push(`Deposit of ${money.depositAmount} will be stated as due before work begins.`)
      }
    }

    if (step >= 4) {
      if (protection.ipTiming === "on-creation") {
        warnings.push("IP transfers on creation — client could use work before full payment.")
      }
      if (!protection.killFee) {
        warnings.push("No kill fee. If the client cancels mid-project, you may receive nothing.")
      }
      if (!protection.clientFeedbackDeadlineDays || protection.clientFeedbackDeadlineDays === "0") {
        suggestions.push("No client feedback deadline. Delays become hard to dispute without one.")
      }
      if (!protection.fileReleaseOnPayment) {
        warnings.push("Files release before payment — this is high-risk for the freelancer.")
      }
    }

    if (step >= 2) {
      if (!scope.revisionLimit || scope.revisionLimit === "0") {
        suggestions.push("No revision limit — unlimited revisions can cause scope creep.")
      }
      if (!scope.exclusions || scope.exclusions.trim().length < 5) {
        suggestions.push("Adding explicit exclusions prevents scope disputes later.")
      }
      if (scope.serviceType) {
        draftGuidance.push(`Service type "${scope.serviceType}" will define the work-for-hire clause.`)
      }
    }
  }

  if (contractType === "nda") {
    if (step >= 2) {
      if (!scope.ndaTerm || scope.ndaTerm === "") {
        suggestions.push("No NDA duration set. A defined term (1–3 years) is standard.")
      }
    }
  }

  if (contractType === "service-agreement") {
    if (step >= 2) {
      if (!scope.serviceSchedule || scope.serviceSchedule.trim().length < 3) {
        suggestions.push("No service schedule defined — when/how often services are provided should be explicit.")
      }
      if (!scope.exclusions || scope.exclusions.trim().length < 5) {
        suggestions.push("Add explicit exclusions to prevent scope creep on ongoing service contracts.")
      }
    }
    if (step >= 3) {
      if (!money.lateFee) {
        warnings.push("No late fee clause — late payments are common in retainer arrangements without one.")
      }
      if (!protection.terminationNoticeDays || protection.terminationNoticeDays === "0") {
        suggestions.push("Define a termination notice period (e.g. 30 days) so either party can exit cleanly.")
      }
    }
  }

  if (contractType === "lease") {
    if (step >= 2) {
      if (!scope.propertyAddress || scope.propertyAddress.trim().length < 5) {
        warnings.push("No property address entered — this is required for a legally binding lease.")
      }
      if (!scope.leaseType) {
        suggestions.push("Specify fixed-term or month-to-month — this affects notice requirements and rights.")
      }
    }
    if (step >= 3) {
      if (!money.monthlyRent || money.monthlyRent === "0") {
        warnings.push("No monthly rent amount set — this is a required term of any lease agreement.")
      }
      if (!money.securityDeposit) {
        suggestions.push("No security deposit specified. Most leases require one to protect against damage.")
      }
      if (!money.lateFee) {
        suggestions.push("Consider adding a late fee clause to deter overdue rent payments.")
      }
      if (!money.leaseStartDate) {
        warnings.push("No lease start date — this must be specified for the lease to take effect.")
      }
    }
  }

  draftGuidance.push(...DEFAULT_CLAUSES.map((c) => `Default: ${c} will be included.`))

  return { suggestions, warnings, draftGuidance: draftGuidance.slice(0, 4) }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

function WizardProgressBar({ step }: { step: number }) {
  return (
    <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-2.5">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {STEPS.map((label, i) => {
            const done = i < step
            const active = i === step
            return (
              <div key={label} className="flex items-center flex-1 min-w-0">
                <div className={`flex items-center gap-1 flex-shrink-0 text-xs font-medium transition-colors ${active ? "text-primary" : done ? "text-primary/60" : "text-muted-foreground/40"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${active ? "bg-primary text-primary-foreground" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/40"}`}>
                    {done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${done ? "bg-primary/30" : "bg-border/40"}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AI INSIGHT PANEL
// ─────────────────────────────────────────────────────────────────────────────

function AIInsightPanel({
  insights,
  loading,
}: {
  insights: AIInsights
  loading: boolean
}) {
  const hasContent =
    insights.suggestions.length > 0 ||
    insights.warnings.length > 0 ||
    insights.draftGuidance.length > 0

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold">AI Insights</span>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-auto" />}
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
        {loading && !hasContent && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-muted/60 rounded animate-pulse" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
        )}

        {!loading && !hasContent && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Fill in your answers to see live guidance.
          </p>
        )}

        {insights.warnings.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">Heads Up</p>
            {insights.warnings.map((w, i) => (
              <div key={i} className="flex gap-2 text-xs text-foreground/80 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {insights.suggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-500">Suggestions</p>
            {insights.suggestions.map((s, i) => (
              <div key={i} className="flex gap-2 text-xs text-foreground/80 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2.5">
                <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}

        {insights.draftGuidance.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Draft Preview</p>
            {insights.draftGuidance.map((g, i) => (
              <div key={i} className="flex gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5">
                <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{g}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MobileInsightDrawer({ insights, loading }: { insights: AIInsights; loading: boolean }) {
  const [open, setOpen] = useState(false)
  const count = insights.warnings.length + insights.suggestions.length
  return (
    <div className="lg:hidden mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-card border border-border/50 text-sm font-medium"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>AI Insights</span>
          {count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2">
              <AIInsightPanel insights={insights} loading={loading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 0 — CONTRACT TYPE
// ─────────────────────────────────────────────────────────────────────────────

function TypeStep({
  selected,
  onSelect,
}: {
  selected: ContractType | null
  onSelect: (t: ContractType) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-1">What are you building?</h2>
        <p className="text-muted-foreground text-sm">Choose the contract type that best fits your situation.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {CONTRACT_TYPES.map(({ id, title, description, example, Icon, color, bg, ready }, idx) => {
          const isSelected = selected === id
          const centreLastRow = CONTRACT_TYPES.length % 3 === 2 && idx === CONTRACT_TYPES.length - 2
          return (
            <button
              key={id}
              onClick={() => ready && onSelect(id)}
              className={`relative text-left rounded-2xl border-2 p-4 transition-all duration-200 ${centreLastRow ? "xl-col-start-2" : ""} ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : ready
                  ? "border-border/50 hover:border-primary/40 hover:bg-accent/30"
                  : "border-border/30 opacity-50 cursor-not-allowed"
              }`}
            >
              {!ready && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  Coming soon
                </span>
              )}
              {isSelected && (
                <span className="absolute top-3 right-3">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="text-sm font-semibold mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{description}</p>
              <span className="text-[10px] text-muted-foreground/70 italic">{example}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — PEOPLE
// ─────────────────────────────────────────────────────────────────────────────

function PartySection({
  label,
  nameKey,
  typeKey,
  entityKey,
  addressKey,
  data,
  onChange,
}: {
  label: string
  nameKey: keyof PeopleData
  typeKey: keyof PeopleData
  entityKey: keyof PeopleData
  addressKey: keyof PeopleData
  data: Partial<PeopleData>
  onChange: (d: Partial<PeopleData>) => void
}) {
  const type = (data[typeKey] as PartyType) ?? "individual"
  return (
    <div className="rounded-xl border border-border/50 p-4 space-y-4 bg-card/50">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="space-y-1">
        <Label className="text-xs">Legal Name</Label>
        <Input
          placeholder="Full legal name"
          value={(data[nameKey] as string) ?? ""}
          onChange={(e) => onChange({ ...data, [nameKey]: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Party Type</Label>
        <div className="flex gap-2">
          {(["individual", "business"] as PartyType[]).map((t) => (
            <button
              key={t}
              onClick={() => onChange({ ...data, [typeKey]: t })}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                type === t ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:bg-accent/30"
              }`}
            >
              {t === "individual" ? "Individual" : "Business / LLC"}
            </button>
          ))}
        </div>
      </div>
      {type === "business" && (
        <div className="space-y-1">
          <Label className="text-xs">Business / Entity Name</Label>
          <Input
            placeholder="Acme Corp LLC"
            value={(data[entityKey] as string) ?? ""}
            onChange={(e) => onChange({ ...data, [entityKey]: e.target.value })}
          />
        </div>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Address (optional)</Label>
        <Input
          placeholder="123 Main St, City, State"
          value={(data[addressKey] as string) ?? ""}
          onChange={(e) => onChange({ ...data, [addressKey]: e.target.value })}
        />
      </div>
    </div>
  )
}

function PeopleStep({
  data,
  onChange,
  contractType,
}: {
  data: Partial<PeopleData>
  onChange: (d: Partial<PeopleData>) => void
  contractType: ContractType
}) {
  const isFreelance = contractType === "freelance"
  const isNDA = contractType === "nda"
  const isPayment = contractType === "payment-agreement"

  const clientLabel = isFreelance ? "Client" : isNDA ? "Disclosing Party" : isPayment ? "Borrower / Payer" : "Party A"
  const freelancerLabel = isFreelance ? "Freelancer / Contractor" : isNDA ? "Receiving Party" : isPayment ? "Lender / Payee" : "Party B"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-1">Who's involved?</h2>
        <p className="text-muted-foreground text-sm">Enter the legal details for both parties.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <PartySection
          label={clientLabel}
          nameKey="clientName"
          typeKey="clientType"
          entityKey="clientEntityName"
          addressKey="clientAddress"
          data={data}
          onChange={onChange}
        />
        <PartySection
          label={freelancerLabel}
          nameKey="freelancerName"
          typeKey="freelancerType"
          entityKey="freelancerEntityName"
          addressKey="freelancerAddress"
          data={data}
          onChange={onChange}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Governing Law / State</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs text-xs">
                This is the U.S. state whose laws will govern the contract. Usually the state where the work is performed or where the freelancer is located.
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            placeholder="e.g. California, New York, Texas"
            value={data.governingLaw ?? ""}
            onChange={(e) => onChange({ ...data, governingLaw: e.target.value })}
          />
        </div>
        {isFreelance && (
          <div className="space-y-1">
            <Label className="text-xs">Project Title (optional)</Label>
            <Input
              placeholder="e.g. Brand Identity Redesign 2026"
              value={data.projectTitle ?? ""}
              onChange={(e) => onChange({ ...data, projectTitle: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — SCOPE
// ─────────────────────────────────────────────────────────────────────────────

function ScopeStep({
  data,
  onChange,
  contractType,
}: {
  data: Partial<ScopeData>
  onChange: (d: Partial<ScopeData>) => void
  contractType: ContractType
}) {
  if (contractType === "nda") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold mb-1">What's being protected?</h2>
          <p className="text-muted-foreground text-sm">Describe what information will be kept confidential.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Purpose of Disclosure</Label>
            <Input
              placeholder="e.g. Evaluating a potential business partnership"
              value={data.purposeOfDisclosure ?? ""}
              onChange={(e) => onChange({ ...data, purposeOfDisclosure: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description of Confidential Information</Label>
            <Textarea
              rows={4}
              placeholder="e.g. Trade secrets, business plans, financial projections, customer lists, software source code, and other proprietary information..."
              value={data.confidentialInfoDescription ?? ""}
              onChange={(e) => onChange({ ...data, confidentialInfoDescription: e.target.value })}
              className="resize-none"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">NDA Duration</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs">
                  How long the confidentiality obligation lasts. 1–3 years is typical. Perpetual NDAs are enforceable for true trade secrets.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              placeholder="e.g. 2 years, 3 years, indefinite for trade secrets"
              value={data.ndaTerm ?? ""}
              onChange={(e) => onChange({ ...data, ndaTerm: e.target.value })}
            />
          </div>
        </div>
      </div>
    )
  }

  if (contractType === "payment-agreement") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold mb-1">What is the payment for?</h2>
          <p className="text-muted-foreground text-sm">Describe the reason for the payment arrangement.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Purpose / Description</Label>
            <Textarea
              rows={5}
              placeholder="e.g. Personal loan of $3,000 to cover emergency vehicle repair, to be repaid in 6 monthly installments..."
              value={data.scopeDescription ?? ""}
              onChange={(e) => onChange({ ...data, scopeDescription: e.target.value })}
              className="resize-none"
            />
          </div>
        </div>
      </div>
    )
  }

  if (contractType === "service-agreement") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold mb-1">What services are being provided?</h2>
          <p className="text-muted-foreground text-sm">Define the ongoing services, schedule, and scope boundaries.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Service Type</Label>
            <Input
              placeholder="e.g. IT support, cleaning services, consulting, marketing retainer"
              value={data.serviceType ?? ""}
              onChange={(e) => onChange({ ...data, serviceType: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Scope of Services</Label>
            <Textarea
              rows={4}
              placeholder="Describe what the service provider will do. Be specific — this becomes the core of the services clause."
              value={data.scopeDescription ?? ""}
              onChange={(e) => onChange({ ...data, scopeDescription: e.target.value })}
              className="resize-none"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">Service Schedule</Label>
                <Tooltip>
                  <TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent className="text-xs max-w-xs">How often the service is performed — e.g. weekly, monthly, on-call, or during business hours.</TooltipContent>
                </Tooltip>
              </div>
              <Input
                placeholder="e.g. Weekly, monthly, on-demand, Mon–Fri 9am–5pm"
                value={data.serviceSchedule ?? ""}
                onChange={(e) => onChange({ ...data, serviceSchedule: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">Service Standards / SLAs (optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent className="text-xs max-w-xs">Any measurable standards — e.g. "respond within 4 hours", "99% uptime", "resolve issues within 24 hours".</TooltipContent>
                </Tooltip>
              </div>
              <Input
                placeholder="e.g. 4-hour response time, issues resolved within 1 business day"
                value={data.serviceStandards ?? ""}
                onChange={(e) => onChange({ ...data, serviceStandards: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">What is NOT included (Exclusions)</Label>
            <Textarea
              rows={3}
              placeholder="e.g. Hardware procurement, after-hours emergency calls, travel outside the local area"
              value={data.exclusions ?? ""}
              onChange={(e) => onChange({ ...data, exclusions: e.target.value })}
              className="resize-none"
            />
          </div>
        </div>
      </div>
    )
  }

  if (contractType === "lease") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold mb-1">What is being rented?</h2>
          <p className="text-muted-foreground text-sm">Describe the property and rental conditions.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Property Address</Label>
            <Input
              placeholder="e.g. 123 Main Street, Apt 4B, New York, NY 10001"
              value={data.propertyAddress ?? ""}
              onChange={(e) => onChange({ ...data, propertyAddress: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Property Type</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {["Residential", "Commercial", "Office", "Equipment"].map((t) => (
                  <button
                    key={t}
                    onClick={() => onChange({ ...data, propertyType: t })}
                    className={`text-sm py-2 px-3 rounded-xl border-2 font-medium transition-all ${data.propertyType === t ? "border-primary bg-primary/5 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lease Type</Label>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: "fixed-term", label: "Fixed Term", desc: "Set start and end date" },
                  { id: "month-to-month", label: "Month-to-Month", desc: "Ongoing, monthly renewal" },
                ].map((lt) => (
                  <button
                    key={lt.id}
                    onClick={() => onChange({ ...data, leaseType: lt.id })}
                    className={`text-left px-3 py-2 rounded-xl border-2 transition-all ${data.leaseType === lt.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
                  >
                    <div className="text-sm font-semibold">{lt.label}</div>
                    <div className="text-[11px] text-muted-foreground">{lt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Property Description (optional)</Label>
            <Textarea
              rows={3}
              placeholder="e.g. 2-bedroom, 1-bathroom apartment, furnished, includes parking space #12, no garage"
              value={data.propertyDescription ?? ""}
              onChange={(e) => onChange({ ...data, propertyDescription: e.target.value })}
              className="resize-none"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Utilities Included</Label>
              <Input
                placeholder="e.g. Water, trash (tenant pays electric)"
                value={data.utilitiesIncluded ?? ""}
                onChange={(e) => onChange({ ...data, utilitiesIncluded: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pets Allowed?</Label>
              <div className="flex gap-1.5">
                {["Yes", "No", "Case by case"].map((v) => (
                  <button
                    key={v}
                    onClick={() => onChange({ ...data, petsAllowed: v })}
                    className={`flex-1 text-xs py-2 rounded-lg border-2 font-medium transition-all ${data.petsAllowed === v ? "border-primary bg-primary/5 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-1">What's the work?</h2>
        <p className="text-muted-foreground text-sm">Define the scope, deliverables, and boundaries of this engagement.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">Service Type</Label>
          <Input
            placeholder="e.g. Logo design, web development, photography, copywriting"
            value={data.serviceType ?? ""}
            onChange={(e) => onChange({ ...data, serviceType: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Scope of Work</Label>
          <Textarea
            rows={5}
            placeholder="Describe in detail what you will deliver. Be specific — this becomes the core of the services clause."
            value={data.scopeDescription ?? ""}
            onChange={(e) => onChange({ ...data, scopeDescription: e.target.value })}
            className="resize-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Specific Deliverables</Label>
            <Textarea
              rows={3}
              placeholder="List what you'll hand over — e.g. 3 logo concepts, final SVG/PNG files, brand guide PDF"
              value={data.deliverables ?? ""}
              onChange={(e) => onChange({ ...data, deliverables: e.target.value })}
              className="resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">What is NOT included (Exclusions)</Label>
            <Textarea
              rows={3}
              placeholder="e.g. Social media templates, print production, animated versions, copywriting"
              value={data.exclusions ?? ""}
              onChange={(e) => onChange({ ...data, exclusions: e.target.value })}
              className="resize-none"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Revision Rounds Included</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs">
                  A "revision round" means one set of client feedback that you address. Setting a limit protects against scope creep. 2–3 rounds is common.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 2"
              value={data.revisionLimit ?? ""}
              onChange={(e) => onChange({ ...data, revisionLimit: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Acceptance Criteria (optional)</Label>
            <Input
              placeholder="e.g. Client approves final files in writing"
              value={data.acceptanceCriteria ?? ""}
              onChange={(e) => onChange({ ...data, acceptanceCriteria: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — MONEY / TIMING
// ─────────────────────────────────────────────────────────────────────────────

function YesNoToggle({ label, value, onChange, tooltip }: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  tooltip?: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{label}</span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-xs">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex gap-1">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            onClick={() => onChange(v)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              value === v
                ? v ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" : "border-border bg-muted text-muted-foreground"
                : "border-border/40 text-muted-foreground/60 hover:border-border"
            }`}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  )
}

function MoneyStep({ data, onChange, contractType }: { data: Partial<MoneyData>; onChange: (d: Partial<MoneyData>) => void; contractType: ContractType | null }) {
  const structure = data.paymentStructure ?? "flat"
  const isLease = contractType === "lease"

  const PAYMENT_OPTIONS: Array<{ id: PaymentStructure; label: string; desc: string }> = [
    { id: "flat", label: "Flat Fee", desc: "One total price for the entire project" },
    { id: "hourly", label: "Hourly Rate", desc: "Billed based on hours worked" },
    { id: "milestone", label: "Milestone", desc: "Payments tied to project phases" },
  ]

  if (isLease) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold mb-1">Rent & Lease Terms</h2>
          <p className="text-muted-foreground text-sm">Set the rental amounts, dates, and deposit requirements.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Monthly Rent</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input className="pl-7" placeholder="0.00" value={data.monthlyRent ?? ""} onChange={(e) => onChange({ ...data, monthlyRent: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Security Deposit</Label>
              <Tooltip>
                <TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent className="text-xs">Typically 1–2 months rent. Check your local laws for the legal maximum.</TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input className="pl-7" placeholder="0.00" value={data.securityDeposit ?? ""} onChange={(e) => onChange({ ...data, securityDeposit: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Lease Start Date</Label>
            <Input type="date" value={data.leaseStartDate ?? ""} onChange={(e) => onChange({ ...data, leaseStartDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Lease End Date</Label>
            <Input type="date" value={data.leaseEndDate ?? ""} onChange={(e) => onChange({ ...data, leaseEndDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Rent Due Day</Label>
            <Input placeholder="e.g. 1st of month" value={data.invoiceDueDays ?? ""} onChange={(e) => onChange({ ...data, invoiceDueDays: e.target.value })} />
          </div>
        </div>
        <div className="rounded-xl border border-border/50 p-4 bg-card/50 space-y-0">
          <YesNoToggle
            label="Charge a late fee for overdue rent?"
            value={data.lateFee ?? false}
            onChange={(v) => onChange({ ...data, lateFee: v })}
            tooltip="A late fee clause deters late payments. Common amounts are $25–$100 or 5–10% of monthly rent. Check local rent laws."
          />
          {data.lateFee && (
            <div className="pt-2 pb-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input className="pl-7" placeholder="e.g. 50.00" value={data.lateFeeAmount ?? ""} onChange={(e) => onChange({ ...data, lateFeeAmount: e.target.value })} />
              </div>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pet Deposit (if pets allowed)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input className="pl-7" placeholder="e.g. 300.00 (leave blank if no pets)" value={data.petDeposit ?? ""} onChange={(e) => onChange({ ...data, petDeposit: e.target.value })} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-1">Money & Timeline</h2>
        <p className="text-muted-foreground text-sm">Set up payment terms, amounts, and key dates.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Payment Structure</Label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_OPTIONS.map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => onChange({ ...data, paymentStructure: id })}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                structure === id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
              }`}
            >
              <div className="text-sm font-semibold mb-0.5">{label}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {structure === "hourly" ? (
          <div className="space-y-1">
            <Label className="text-xs">Hourly Rate</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input className="pl-7" placeholder="0.00" value={data.hourlyRate ?? ""} onChange={(e) => onChange({ ...data, hourlyRate: e.target.value })} />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs">{structure === "milestone" ? "Total Project Fee" : "Total Fee"}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input className="pl-7" placeholder="0.00" value={data.totalFee ?? ""} onChange={(e) => onChange({ ...data, totalFee: e.target.value })} />
            </div>
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Invoice Due Period</Label>
            <Tooltip>
              <TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
              <TooltipContent className="text-xs">How many days the client has to pay each invoice. "NET 14" means 14 days.</TooltipContent>
            </Tooltip>
          </div>
          <Input placeholder="e.g. NET 14, NET 30" value={data.invoiceDueDays ?? ""} onChange={(e) => onChange({ ...data, invoiceDueDays: e.target.value })} />
        </div>
      </div>

      {structure === "milestone" && (
        <div className="space-y-2">
          <Label className="text-xs">Milestone Schedule (up to 3)</Label>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => {
              const ms = (data.milestones ?? [])[i] ?? { name: "", amount: "", date: "" }
              const update = (field: string, val: string) => {
                const next = [...(data.milestones ?? [{ name: "", amount: "", date: "" }, { name: "", amount: "", date: "" }, { name: "", amount: "", date: "" }])]
                next[i] = { ...ms, [field]: val }
                onChange({ ...data, milestones: next })
              }
              return (
                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                  <Input placeholder={`Phase ${i + 1} name`} value={ms.name} onChange={(e) => update("name", e.target.value)} />
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input className="pl-7" placeholder="Amount" value={ms.amount} onChange={(e) => update("amount", e.target.value)} /></div>
                  <Input type="date" value={ms.date} onChange={(e) => update("date", e.target.value)} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/50 p-4 bg-card/50 space-y-0">
        <YesNoToggle
          label="Require a deposit before work starts?"
          value={data.depositRequired ?? false}
          onChange={(v) => onChange({ ...data, depositRequired: v })}
          tooltip="A deposit (typically 25–50%) reduces the risk of non-payment. It is standard for creative and project-based work."
        />
        {data.depositRequired && (
          <div className="pt-2 pb-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input className="pl-7" placeholder="Deposit amount" value={data.depositAmount ?? ""} onChange={(e) => onChange({ ...data, depositAmount: e.target.value })} />
            </div>
          </div>
        )}
        <YesNoToggle
          label="Include a late payment fee?"
          value={data.lateFee ?? false}
          onChange={(v) => onChange({ ...data, lateFee: v })}
          tooltip="A late fee (e.g. 1.5% per month or a flat $50) incentivises on-time payment and is legally enforceable in most states."
        />
        {data.lateFee && (
          <div className="pt-2 pb-1">
            <Input placeholder="e.g. 1.5% per month, or $50 flat" value={data.lateFeeAmount ?? ""} onChange={(e) => onChange({ ...data, lateFeeAmount: e.target.value })} />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Project Start Date</Label>
          <Input type="date" value={data.startDate ?? ""} onChange={(e) => onChange({ ...data, startDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Final Deadline</Label>
          <Input type="date" value={data.deadline ?? ""} onChange={(e) => onChange({ ...data, deadline: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — RIGHTS / PROTECTION
// ─────────────────────────────────────────────────────────────────────────────

function ProtectionStep({
  data,
  onChange,
  contractType,
}: {
  data: Partial<ProtectionData>
  onChange: (d: Partial<ProtectionData>) => void
  contractType: ContractType
}) {
  const IP_OPTIONS: Array<{ id: IPTiming; label: string; desc: string; risk?: string }> = [
    { id: "on-payment", label: "On Final Payment", desc: "IP transfers only when fully paid", risk: undefined },
    { id: "on-creation", label: "On Creation", desc: "IP transfers as work is completed", risk: "⚠ Higher risk for freelancer" },
    { id: "limited-license", label: "Limited License", desc: "Client can use the work; freelancer retains ownership", risk: undefined },
  ]

  const DISPUTE_OPTIONS: Array<{ id: DisputeResolution; label: string; desc: string }> = [
    { id: "negotiation", label: "Negotiation", desc: "Resolve directly between parties" },
    { id: "mediation", label: "Mediation", desc: "Use a neutral third-party mediator" },
    { id: "arbitration", label: "Arbitration", desc: "Binding arbitration (private)" },
    { id: "court", label: "Court", desc: "Full litigation in courts" },
  ]

  if (contractType === "nda" || contractType === "payment-agreement") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold mb-1">Protection terms</h2>
          <p className="text-muted-foreground text-sm">Set the key protective provisions for this agreement.</p>
        </div>
        <div className="rounded-xl border border-border/50 p-4 bg-card/50 space-y-0">
          <YesNoToggle label="Require confidentiality?" value={data.confidentiality ?? false} onChange={(v) => onChange({ ...data, confidentiality: v })} />
          <div className="space-y-2">
            <Label className="text-xs">Dispute Resolution</Label>
            <div className="grid grid-cols-2 gap-2">
              {DISPUTE_OPTIONS.map(({ id, label, desc }) => (
                <button
                  key={id}
                  onClick={() => onChange({ ...data, disputeResolution: id })}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${data.disputeResolution === id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
                >
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-[11px] text-muted-foreground">{desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1 pt-2">
            <Label className="text-xs">Termination Notice Period (days)</Label>
            <Input type="number" min="0" placeholder="e.g. 14" value={data.terminationNoticeDays ?? ""} onChange={(e) => onChange({ ...data, terminationNoticeDays: e.target.value })} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-1">Rights & Protection</h2>
        <p className="text-muted-foreground text-sm">Define ownership, termination terms, and how disputes will be handled.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs">IP Ownership Timing</Label>
          <Tooltip>
            <TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
            <TooltipContent className="text-xs max-w-xs">
              This controls when the client legally owns the work. "On final payment" is the safest option for freelancers — the client can't use the deliverables until fully paid.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          {IP_OPTIONS.map(({ id, label, desc, risk }) => (
            <button
              key={id}
              onClick={() => onChange({ ...data, ipTiming: id })}
              className={`text-left p-3 rounded-xl border-2 transition-all ${data.ipTiming === id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
            >
              <div className="text-sm font-semibold mb-0.5">{label}</div>
              <div className="text-[11px] text-muted-foreground mb-1">{desc}</div>
              {risk && <div className="text-[10px] text-amber-500">{risk}</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 p-4 bg-card/50 space-y-0">
        <YesNoToggle label="Allow portfolio usage of this work?" value={data.portfolioUsage ?? true} onChange={(v) => onChange({ ...data, portfolioUsage: v })} tooltip="Allows you to show this project in your portfolio. Clients may request to restrict this for confidential work." />
        <YesNoToggle label="Require confidentiality from client?" value={data.confidentiality ?? false} onChange={(v) => onChange({ ...data, confidentiality: v })} tooltip="Adds a mutual NDA provision to the contract — useful when sharing business strategy, pricing, or proprietary processes." />
        <YesNoToggle label="Include a kill fee for cancellations?" value={data.killFee ?? false} onChange={(v) => onChange({ ...data, killFee: v })} tooltip="A kill fee compensates you if the client cancels mid-project. Typically 25–50% of the remaining balance." />
        {data.killFee && (
          <div className="pt-2 pb-1">
            <Input placeholder="e.g. 50% of remaining balance" value={data.killFeeAmount ?? ""} onChange={(e) => onChange({ ...data, killFeeAmount: e.target.value })} />
          </div>
        )}
        <YesNoToggle label="Release final files only after full payment?" value={data.fileReleaseOnPayment ?? true} onChange={(v) => onChange({ ...data, fileReleaseOnPayment: v })} tooltip="Highly recommended. Delays file delivery until the final invoice is paid in full." />
        <YesNoToggle label="Allow subcontracting?" value={data.subcontractingAllowed ?? false} onChange={(v) => onChange({ ...data, subcontractingAllowed: v })} tooltip="If yes, you can hire other freelancers to help. Most clients prefer to restrict this so they know exactly who is working on their project." />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Client Feedback Deadline (days)</Label>
            <Tooltip>
              <TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
              <TooltipContent className="text-xs max-w-xs">How many days the client has to review and respond after you submit a deliverable. If they don't respond in time, the work is deemed approved.</TooltipContent>
            </Tooltip>
          </div>
          <Input type="number" min="0" placeholder="e.g. 5" value={data.clientFeedbackDeadlineDays ?? ""} onChange={(e) => onChange({ ...data, clientFeedbackDeadlineDays: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Termination Notice Period (days)</Label>
          <Input type="number" min="0" placeholder="e.g. 14" value={data.terminationNoticeDays ?? ""} onChange={(e) => onChange({ ...data, terminationNoticeDays: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Dispute Resolution</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DISPUTE_OPTIONS.map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => onChange({ ...data, disputeResolution: id })}
              className={`text-left p-3 rounded-xl border-2 transition-all ${data.disputeResolution === id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
            >
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-[11px] text-muted-foreground">{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GAP ANALYSIS — types, computation, sub-component
// ─────────────────────────────────────────────────────────────────────────────

interface GapItem {
  id: string
  label: string
  description: string
  severity: "warning" | "suggestion"
  group?: "money" | "protection" | "people" | "scope"
  editStep?: number
  quickFillKey?: string
  quickFillType?: "text" | "number" | "date"
  quickFillLabel?: string
  quickFillPlaceholder?: string
  canQuickFill: boolean
}

function computeGaps(
  contractType: ContractType,
  people: Partial<PeopleData>,
  scope: Partial<ScopeData>,
  money: Partial<MoneyData>,
  protection: Partial<ProtectionData>
): GapItem[] {
  const gaps: GapItem[] = []

  // ── Party name check — required for every contract type ──────────────────
  const partyAEffective = people.clientName?.trim() || people.clientEntityName?.trim() || ""
  const partyBEffective = people.freelancerName?.trim() || people.freelancerEntityName?.trim() || ""

  if (!partyAEffective) {
    const label =
      contractType === "nda" ? "Disclosing Party name" :
      contractType === "payment-agreement" ? "Borrower name" :
      "Client name"
    gaps.push({
      id: "party-a-name",
      label: `Required: ${label} is missing`,
      description: "A contract must identify both parties by name. Return to the People step to add this before generating.",
      severity: "warning",
      editStep: 1,
      group: "people",
      canQuickFill: false,
    })
  }
  if (!partyBEffective) {
    const label =
      contractType === "nda" ? "Receiving Party name" :
      contractType === "payment-agreement" ? "Lender name" :
      contractType === "freelance" ? "Freelancer / Contractor name" :
      contractType === "lease" ? "Landlord / Property Manager name" :
      "Service Provider name"
    gaps.push({
      id: "party-b-name",
      label: `Required: ${label} is missing`,
      description: "A contract must identify both parties by name. Return to the People step to add this before generating.",
      severity: "warning",
      editStep: 1,
      group: "people",
      canQuickFill: false,
    })
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (contractType === "freelance" || contractType === "service-agreement") {
    if (!money.lateFee) {
      gaps.push({
        id: "late-fee",
        label: "No late payment fee included",
        description: "Without one, overdue invoices have no automatic penalty. 1.5%/month is standard.",
        severity: "warning",
        group: "money",
        quickFillKey: "lateFeeAmount",
        quickFillType: "text",
        quickFillLabel: "Late fee rate",
        quickFillPlaceholder: "e.g. 1.5% per month or $50 flat",
        canQuickFill: true,
      })
    }
    if (!protection.killFee) {
      gaps.push({
        id: "kill-fee",
        label: "No kill fee for project cancellations",
        description: "If the client cancels mid-project you may receive nothing. A kill fee protects your lost time.",
        severity: "warning",
        group: "protection",
        quickFillKey: "killFeeAmount",
        quickFillType: "text",
        quickFillLabel: "Kill fee amount",
        quickFillPlaceholder: "e.g. 50% of remaining balance",
        canQuickFill: true,
      })
    }
    if (!protection.clientFeedbackDeadlineDays) {
      gaps.push({
        id: "feedback-deadline",
        label: "No client feedback deadline",
        description: "Without one, clients can delay feedback indefinitely — stalling your timeline.",
        severity: "suggestion",
        group: "protection",
        quickFillKey: "clientFeedbackDeadlineDays",
        quickFillType: "number",
        quickFillLabel: "Days to respond",
        quickFillPlaceholder: "e.g. 5",
        canQuickFill: true,
      })
    }
    if (!scope.revisionLimit) {
      gaps.push({
        id: "revision-limit",
        label: "No revision limit — unlimited revisions allowed",
        description: "Without a cap, clients can request revisions indefinitely. 2–3 rounds is standard.",
        severity: "suggestion",
        editStep: 2,
        group: "scope",
        canQuickFill: false,
      })
    }
    if (protection.ipTiming === "on-creation") {
      gaps.push({
        id: "ip-timing",
        label: "IP transfers on creation — before full payment",
        description: "The client legally owns the work before the final balance is paid. Consider switching to On Final Payment.",
        severity: "warning",
        editStep: 4,
        group: "protection",
        canQuickFill: false,
      })
    }
    if (!money.depositRequired) {
      gaps.push({
        id: "deposit",
        label: "No upfront deposit required",
        description: "A 25–50% deposit reduces non-payment risk before work begins. Common for projects over $500.",
        severity: "suggestion",
        editStep: 3,
        group: "money",
        canQuickFill: false,
      })
    }
  }

  if (!people.governingLaw) {
    gaps.push({
      id: "governing-law",
      label: "No governing state specified",
      description: "Which state's law applies is important for any legal dispute.",
      severity: "warning",
      group: "people",
      quickFillKey: "governingLaw",
      quickFillType: "text",
      quickFillLabel: "Governing state",
      quickFillPlaceholder: "e.g. California",
      canQuickFill: true,
    })
  }

  if (!money.deadline) {
    gaps.push({
      id: "deadline",
      label: "No delivery deadline set",
      description: "Without a final deadline there is no binding timeline for project completion.",
      severity: "suggestion",
      group: "money",
      quickFillKey: "deadline",
      quickFillType: "date",
      quickFillLabel: "Final deadline",
      quickFillPlaceholder: "",
      canQuickFill: true,
    })
  }

  if (!money.invoiceDueDays) {
    gaps.push({
      id: "invoice-due",
      label: "No invoice payment window",
      description: "NET 14 or NET 30 sets clear expectations for when invoices must be paid.",
      severity: "suggestion",
      group: "money",
      quickFillKey: "invoiceDueDays",
      quickFillType: "text",
      quickFillLabel: "Invoice due period",
      quickFillPlaceholder: "e.g. NET 14",
      canQuickFill: true,
    })
  }

  if (!protection.terminationNoticeDays) {
    gaps.push({
      id: "termination-notice",
      label: "No termination notice period",
      description: "A notice period (e.g. 14 days) gives both parties time to wrap up the engagement.",
      severity: "suggestion",
      group: "protection",
      quickFillKey: "terminationNoticeDays",
      quickFillType: "number",
      quickFillLabel: "Notice period (days)",
      quickFillPlaceholder: "e.g. 14",
      canQuickFill: true,
    })
  }

  return gaps
}

function GapRow({
  gap,
  isExpanded,
  inputValue,
  onToggle,
  onInputChange,
  onApply,
  onEdit,
}: {
  gap: GapItem
  isExpanded: boolean
  inputValue: string
  onToggle: () => void
  onInputChange: (v: string) => void
  onApply: () => void
  onEdit: (step: number) => void
}) {
  return (
    <div className={`rounded-lg border overflow-hidden transition-colors ${gap.severity === "warning" ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20" : "border-border/40 bg-background"}`}>
      <div className="flex items-start gap-3 p-3">
        {gap.severity === "warning"
          ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          : <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{gap.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{gap.description}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0 ml-2">
          {gap.canQuickFill && (
            <Button
              size="sm"
              variant={isExpanded ? "secondary" : "outline"}
              className="h-7 px-2.5 text-xs"
              onClick={onToggle}
            >
              {isExpanded ? "Cancel" : "Add"}
            </Button>
          )}
          {!gap.canQuickFill && gap.editStep !== undefined && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-xs gap-1 text-muted-foreground"
              onClick={() => onEdit(gap.editStep!)}
            >
              <Pencil className="w-3 h-3" /> Edit
            </Button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex gap-2 border-t border-border/30 pt-2.5">
              {gap.quickFillLabel && (
                <Label className="sr-only">{gap.quickFillLabel}</Label>
              )}
              <Input
                type={gap.quickFillType === "date" ? "date" : gap.quickFillType === "number" ? "number" : "text"}
                placeholder={gap.quickFillPlaceholder}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                className="flex-1 h-8 text-sm"
                min={gap.quickFillType === "number" ? "0" : undefined}
                autoFocus
              />
              <Button
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={onApply}
                disabled={!inputValue.trim()}
              >
                Apply
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — REVIEW SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

function SummaryItem({ ok, label, value }: { ok: boolean | "warn" | "missing"; label: string; value?: string }) {
  const icon = ok === true ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    : ok === "warn" ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
    : <TriangleAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="mt-0.5">{icon}</div>
      <div>
        <span className="text-sm font-medium">{label}</span>
        {value && <span className="text-sm text-muted-foreground ml-1.5">{value}</span>}
      </div>
    </div>
  )
}

function ReviewStep({
  contractType,
  people,
  scope,
  money,
  protection,
  onEdit,
  onGenerate,
  onSave,
  generating,
  error,
  onFillMoney,
  onFillProtection,
  onFillPeople,
}: {
  contractType: ContractType
  people: Partial<PeopleData>
  scope: Partial<ScopeData>
  money: Partial<MoneyData>
  protection: Partial<ProtectionData>
  onEdit: (step: number) => void
  onGenerate: () => void
  onSave: () => void
  generating: boolean
  error: string | null
  onFillMoney: (u: Partial<MoneyData>) => void
  onFillProtection: (u: Partial<ProtectionData>) => void
  onFillPeople: (u: Partial<PeopleData>) => void
}) {
  const [expandedGap, setExpandedGap] = useState<string | null>(null)
  const [gapInputValue, setGapInputValue] = useState("")

  const isFreelance = contractType === "freelance"
  const clientEffective = people.clientName?.trim() || people.clientEntityName?.trim() || ""
  const freelancerEffective = people.freelancerName?.trim() || people.freelancerEntityName?.trim() || ""
  const clientName = clientEffective || "—"
  const freelancerName = freelancerEffective || "—"
  const totalFee = money.totalFee ? `$${money.totalFee}` : money.hourlyRate ? `$${money.hourlyRate}/hr` : "—"
  const missingPartyNames = !clientEffective || !freelancerEffective

  const gaps = computeGaps(contractType, people, scope, money, protection)
  const warningGaps = gaps.filter((g) => g.severity === "warning")
  const suggestionGaps = gaps.filter((g) => g.severity === "suggestion")

  function applyGapFill(gap: GapItem) {
    const v = gapInputValue.trim()
    if (!v || !gap.canQuickFill) return
    if (gap.group === "money") {
      if (gap.id === "late-fee") onFillMoney({ lateFee: true, lateFeeAmount: v })
      else if (gap.id === "deadline") onFillMoney({ deadline: v })
      else if (gap.id === "invoice-due") onFillMoney({ invoiceDueDays: v })
    } else if (gap.group === "protection") {
      if (gap.id === "kill-fee") onFillProtection({ killFee: true, killFeeAmount: v })
      else if (gap.id === "feedback-deadline") onFillProtection({ clientFeedbackDeadlineDays: v })
      else if (gap.id === "termination-notice") onFillProtection({ terminationNoticeDays: v })
    } else if (gap.group === "people") {
      if (gap.id === "governing-law") onFillPeople({ governingLaw: v })
    }
    setExpandedGap(null)
    setGapInputValue("")
  }

  function toggleGap(id: string) {
    if (expandedGap === id) {
      setExpandedGap(null)
      setGapInputValue("")
    } else {
      setExpandedGap(id)
      setGapInputValue("")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-3">{contractLabel(contractType)}</Badge>
        <h2 className="text-2xl font-display font-bold mb-1">Review Summary</h2>
        <p className="text-muted-foreground text-sm">Review your answers and fill any gaps before generating your draft.</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-border/50 p-4 bg-card/50 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Parties</p>
          <SummaryItem ok={!!clientEffective} label="Client:" value={clientName} />
          <SummaryItem ok={!!freelancerEffective} label={isFreelance ? "Freelancer:" : "Party B:"} value={freelancerName} />
          <SummaryItem ok={!!people.governingLaw} label="Governing Law:" value={people.governingLaw || "—"} />
          {people.projectTitle && <SummaryItem ok={true} label="Project:" value={people.projectTitle} />}
        </div>

        {isFreelance && (
          <div className="rounded-xl border border-border/50 p-4 bg-card/50 space-y-0.5 cursor-pointer hover:bg-accent/10" onClick={() => onEdit(2)}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Scope</p>
            <SummaryItem ok={!!scope.serviceType} label="Service:" value={scope.serviceType || "—"} />
            <SummaryItem ok={!!scope.scopeDescription && scope.scopeDescription.length > 10} label="Scope" value={scope.scopeDescription ? `${scope.scopeDescription.slice(0, 60)}…` : "Not set"} />
            <SummaryItem ok={!!scope.revisionLimit} label="Revisions:" value={scope.revisionLimit ? `${scope.revisionLimit} round(s)` : "Unlimited"} />
          </div>
        )}

        <div className="rounded-xl border border-border/50 p-4 bg-card/50 space-y-0.5 cursor-pointer hover:bg-accent/10" onClick={() => onEdit(3)}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Payment</p>
          <SummaryItem ok={!!(money.totalFee || money.hourlyRate)} label="Fee:" value={totalFee} />
          <SummaryItem ok={money.paymentStructure !== undefined} label="Structure:" value={money.paymentStructure || "—"} />
          <SummaryItem ok={!!money.depositRequired} label="Deposit:" value={money.depositRequired ? (money.depositAmount ? `$${money.depositAmount}` : "Yes") : "No"} />
          <SummaryItem ok={money.lateFee ?? false} label="Late Fee:" value={money.lateFee ? (money.lateFeeAmount || "Yes") : "No"} />
          {money.deadline && <SummaryItem ok={true} label="Deadline:" value={money.deadline} />}
        </div>

        {isFreelance && (
          <div className="rounded-xl border border-border/50 p-4 bg-card/50 space-y-0.5 cursor-pointer hover:bg-accent/10" onClick={() => onEdit(4)}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Protection</p>
            <SummaryItem
              ok={protection.ipTiming !== "on-creation" ? true : "warn"}
              label="IP Ownership:"
              value={protection.ipTiming === "on-payment" ? "Transfers on final payment" : protection.ipTiming === "on-creation" ? "Transfers on creation" : "Limited license"}
            />
            <SummaryItem ok={protection.fileReleaseOnPayment ?? true} label="File Release:" value={protection.fileReleaseOnPayment ? "After final payment" : "Before payment"} />
            <SummaryItem ok={protection.killFee ?? false} label="Kill Fee:" value={protection.killFee ? (protection.killFeeAmount || "Yes") : "No"} />
            <SummaryItem ok={!!protection.clientFeedbackDeadlineDays} label="Feedback Deadline:" value={protection.clientFeedbackDeadlineDays ? `${protection.clientFeedbackDeadlineDays} days` : "None set"} />
            <SummaryItem ok={true} label="Dispute:" value={protection.disputeResolution || "negotiation"} />
          </div>
        )}

        {/* ── Check for Gaps & Fill ─────────────────────────── */}
        <div className="rounded-xl border border-border/60 bg-card/30 overflow-hidden">
          <div className="px-4 py-3 bg-muted/20 border-b border-border/30 flex items-start gap-2.5">
            <Search className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Check for Gaps &amp; Fill Recommendations</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {gaps.length === 0
                  ? "No gaps found — your contract looks well-covered."
                  : `${gaps.length} item${gaps.length !== 1 ? "s" : ""} found. Review before generating.`}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {warningGaps.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">Business Protections</p>
                {warningGaps.map((gap) => (
                  <GapRow
                    key={gap.id}
                    gap={gap}
                    isExpanded={expandedGap === gap.id}
                    inputValue={expandedGap === gap.id ? gapInputValue : ""}
                    onToggle={() => toggleGap(gap.id)}
                    onInputChange={setGapInputValue}
                    onApply={() => applyGapFill(gap)}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            )}

            {suggestionGaps.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Suggested Additions</p>
                {suggestionGaps.map((gap) => (
                  <GapRow
                    key={gap.id}
                    gap={gap}
                    isExpanded={expandedGap === gap.id}
                    inputValue={expandedGap === gap.id ? gapInputValue : ""}
                    onToggle={() => toggleGap(gap.id)}
                    onInputChange={setGapInputValue}
                    onApply={() => applyGapFill(gap)}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            )}

            <div className={`space-y-1.5 ${gaps.length > 0 ? "pt-3 border-t border-border/30" : ""}`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Default Legal Protections (auto-added)</p>
              {DEFAULT_CLAUSES.map((c) => (
                <div key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {missingPartyNames && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-800/60 dark:bg-red-950/20 px-4 py-3">
          <TriangleAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Party names required before generating</p>
            <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
              A contract cannot be generated without identifying both parties by name.{" "}
              <button
                onClick={() => onEdit(1)}
                className="underline font-medium hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                Go to the People step
              </button>{" "}
              to add the missing name{!clientEffective && !freelancerEffective ? "s" : ""}.
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="outline" onClick={onSave} className="gap-2">
          <Save className="w-4 h-4" /> Save Draft
        </Button>
        <Button variant="outline" onClick={() => onEdit(1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Edit Answers
        </Button>
        <Button onClick={onGenerate} disabled={generating || missingPartyNames} className="gap-2 flex-1 sm:flex-initial">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Generating…" : "Generate Draft"}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAFT RESULT VIEW
// ─────────────────────────────────────────────────────────────────────────────

function DraftResultView({ draft, contractType, onBack, onRestart }: {
  draft: DraftPayload
  contractType: ContractType
  onBack: () => void
  onRestart: () => void
}) {
  const { toast } = useToast()
  const [showSignatureModal, setShowSignatureModal] = useState(false)

  function exportJSON() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${contractType}-draft-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Draft exported", description: "JSON file downloaded." })
  }

  function downloadPDF() {
    const partiesHtml = Object.values(draft.parties)
      .map(p => `<div class="party"><span class="party-label">${p.label}</span> <strong>${p.name || "TBD"}</strong>${p.type ? ` <span class="party-type">(${p.type})</span>` : ""}</div>`)
      .join("")

    const summaryHtml = (draft.plainEnglishSummary ?? [])
      .map(line => `<li>&#10003; ${line}</li>`)
      .join("")

    const sectionsHtml = (draft.sections ?? [])
      .map(section => `
        <div class="section">
          <h3>${section.title}</h3>
          <ol>${section.clauses.map(c => `<li>${c}</li>`).join("")}</ol>
        </div>`)
      .join("")

    const defaultClausesHtml = (draft.defaultClauses ?? [])
      .map(c => `<li>&#10003; ${c}</li>`)
      .join("")

    const flagsHtml = [
      ...(draft.reviewFlags ?? []).map(f => `<li>&#9651; ${f}</li>`),
      ...(draft.missingProtections ?? []).map(m => `<li>&#9432; ${m}</li>`),
    ].join("")

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${draft.contractType} — PlainPath Draft</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; font-size: 11pt; color: #111; line-height: 1.65; padding: 60px 80px; max-width: 860px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #111; padding-bottom: 20px; }
    .header h1 { font-size: 18pt; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .header .subtitle { font-size: 10pt; color: #555; }
    .block { margin-bottom: 28px; }
    .block-title { font-size: 8.5pt; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.1em; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; }
    .party { margin-bottom: 5px; font-size: 10.5pt; }
    .party-label { font-size: 8pt; background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: Arial, sans-serif; margin-right: 4px; }
    .party-type { color: #666; font-size: 9pt; }
    ul, ol { padding-left: 20px; }
    li { margin-bottom: 5px; font-size: 10.5pt; }
    .section { margin-bottom: 22px; }
    .section h3 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; color: #222; }
    .flags li { color: #b45309; }
    .footer { margin-top: 60px; border-top: 1px solid #ddd; padding-top: 16px; font-size: 8.5pt; color: #888; font-family: Arial, sans-serif; text-align: center; }
    .sig-block { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .sig-line { border-top: 1px solid #333; padding-top: 6px; font-size: 9pt; color: #444; }
    @media print { body { padding: 40px 60px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${draft.contractType}</h1>
    <div class="subtitle">Draft prepared with PlainPath · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>

  <div class="block">
    <div class="block-title">Parties</div>
    ${partiesHtml}
  </div>

  ${summaryHtml ? `<div class="block"><div class="block-title">Plain English Summary</div><ul>${summaryHtml}</ul></div>` : ""}

  ${sectionsHtml}

  ${defaultClausesHtml ? `<div class="block"><div class="block-title">Standard Clauses</div><ul>${defaultClausesHtml}</ul></div>` : ""}

  ${flagsHtml ? `<div class="block flags"><div class="block-title">Items Needing Review</div><ul>${flagsHtml}</ul></div>` : ""}

  <div class="sig-block">
    ${Object.values(draft.parties).map(p => `
      <div>
        <div class="sig-line">Signature — ${p.name || p.label}</div>
        <div class="sig-line" style="margin-top:24px">Date</div>
      </div>`).join("")}
  </div>

  <div class="footer">
    This is a draft document prepared for review purposes only. It is not legal advice. Have a qualified attorney review any contract before signing.
  </div>
</body>
</html>`

    const w = window.open("", "_blank")
    if (!w) {
      toast({ title: "Popup blocked", description: "Allow popups for this site and try again.", variant: "destructive" })
      return
    }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 400)
    toast({ title: "Contract ready", description: "Use 'Save as PDF' in the print dialog." })
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Badge variant="secondary" className="mb-2">{draft.contractType}</Badge>
          <h2 className="text-2xl font-display font-bold">Your Contract Draft</h2>
          <p className="text-sm text-muted-foreground mt-1">Review the draft below, then download or send for signature.</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Back</Button>
          <Button variant="ghost" size="sm" onClick={onRestart} className="gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Start Over</Button>
        </div>
      </div>

      {/* Primary action bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 border border-border/40 rounded-2xl">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-0.5">Next step</p>
          <p className="text-xs text-muted-foreground">Download a formatted PDF to share, or send directly for e-signature.</p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0 flex-wrap sm:flex-nowrap">
          <Button size="default" onClick={downloadPDF} className="gap-2 bg-primary text-white hover:bg-primary/90 flex-1 sm:flex-none">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
          <Button
            size="default"
            onClick={() => setShowSignatureModal(true)}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white flex-1 sm:flex-none"
          >
            <Lock className="w-4 h-4" /> Send for Signature
          </Button>
          <Button variant="outline" size="default" onClick={exportJSON} className="gap-2 hidden sm:flex">
            <Download className="w-4 h-4" /> Export JSON
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Parties</p>
            <div className="space-y-2">
              {Object.values(draft.parties).map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{p.label}</Badge>
                  <span className="text-sm font-medium">{p.name || "[TBD]"}</span>
                  {p.type && <span className="text-xs text-muted-foreground">({p.type})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Plain English Summary</p>
            <ul className="space-y-1">
              {(draft.plainEnglishSummary ?? []).map((line, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {(draft.sections ?? []).map((section) => (
          <Card key={section.title}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{section.title}</p>
              <ul className="space-y-1.5">
                {section.clauses.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary/40 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Default Clauses</p>
            <ul className="space-y-1">
              {(draft.defaultClauses ?? DEFAULT_CLAUSES).map((c, i) => (
                <li key={i} className="flex gap-2 text-xs"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /><span>{c}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {((draft.reviewFlags?.length ?? 0) > 0 || (draft.missingProtections?.length ?? 0) > 0) && (
          <Card className="border-amber-500/30">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Needs Review</p>
              {(draft.reviewFlags ?? []).map((f, i) => (
                <div key={i} className="flex gap-2 text-xs mb-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /><span>{f}</span></div>
              ))}
              {(draft.missingProtections ?? []).map((m, i) => (
                <div key={i} className="flex gap-2 text-xs mb-1 text-muted-foreground"><Info className="w-3.5 h-3.5 flex-shrink-0" /><span>{m}</span></div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="bg-muted/30 border border-border/40 rounded-xl p-4 text-xs text-muted-foreground text-center">
        This is a structured draft payload for internal review. It is not a final legal document. Always have a qualified attorney review any contract before signing.
      </div>

      <SendForSignatureModal
        open={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        draft={draft as unknown as Record<string, unknown>}
        parties={draft.parties as unknown as Record<string, { label: string; name: string; type?: string }>}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ContractBuilder() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  // ── All hooks before any early returns ──
  const [step, setStep] = useState(0)
  const [contractType, setContractType] = useState<ContractType | null>(null)
  const [people, setPeople] = useState<Partial<PeopleData>>({ clientType: "individual", freelancerType: "individual" })
  const [scope, setScope] = useState<Partial<ScopeData>>({})
  const [money, setMoney] = useState<Partial<MoneyData>>({ paymentStructure: "flat", depositRequired: false, lateFee: false })
  const [protection, setProtection] = useState<Partial<ProtectionData>>({
    ipTiming: "on-payment",
    portfolioUsage: true,
    confidentiality: false,
    killFee: false,
    fileReleaseOnPayment: true,
    disputeResolution: "negotiation",
    subcontractingAllowed: false,
  })
  const [aiInsights, setAiInsights] = useState<AIInsights>({ suggestions: [], warnings: [], draftGuidance: [] })
  const [insightLoading, setInsightLoading] = useState(false)
  const [draft, setDraft] = useState<DraftPayload | null>(null)
  const [generating, setGenerating] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [upgradeModal, setUpgradeModal] = useState(false)
  const { entitlements } = useEntitlements()

  useEffect(() => {
    document.title = "Contract Builder — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  // Load saved draft on mount
  useEffect(() => {
    const saved = localStorage.getItem("plainpath-contract-draft-latest")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.contractType) setContractType(data.contractType)
        if (data.people) setPeople(data.people)
        if (data.scope) setScope(data.scope)
        if (data.money) setMoney(data.money)
        if (data.protection) setProtection(data.protection)
      } catch {
        // Ignore corrupted draft
      }
    }
  }, [])

  const ruleInsights = useMemo(
    () => computeRuleInsights(step, contractType, people, scope, money, protection),
    [step, contractType, people, scope, money, protection]
  )

  const mergedInsights: AIInsights = useMemo(() => ({
    suggestions: [...ruleInsights.suggestions, ...aiInsights.suggestions.filter((s) => !ruleInsights.suggestions.includes(s))].slice(0, 4),
    warnings: [...ruleInsights.warnings, ...aiInsights.warnings.filter((w) => !ruleInsights.warnings.includes(w))].slice(0, 4),
    draftGuidance: [...ruleInsights.draftGuidance, ...aiInsights.draftGuidance.filter((g) => !ruleInsights.draftGuidance.includes(g))].slice(0, 5),
  }), [ruleInsights, aiInsights])

  const fetchAIInsights = useCallback(async (nextStep: number) => {
    if (!contractType) return
    setInsightLoading(true)
    try {
      const base = getApiBaseUrl()
      const r = await fetch(`${base}/api/contracts/insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractType, step: nextStep, people, scope, money, protection }),
      })
      const data = await r.json()
      setAiInsights({
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
        draftGuidance: Array.isArray(data.draftGuidance) ? data.draftGuidance : [],
      })
    } catch {
      // Silent fail — rule-based insights remain
    } finally {
      setInsightLoading(false)
    }
  }, [contractType, people, scope, money, protection])

  function saveDraft() {
    const data = { contractType, people, scope, money, protection }
    localStorage.setItem("plainpath-contract-draft-latest", JSON.stringify({ ...data, savedAt: new Date().toISOString() }))
    toast({ title: "Draft saved", description: "Your progress has been saved and will load next time you return." })
  }

  async function generateDraft() {
    // Pre-flight: party names are required — block silently-broken drafts
    const partyAOk = !!(people.clientName?.trim() || people.clientEntityName?.trim())
    const partyBOk = !!(people.freelancerName?.trim() || people.freelancerEntityName?.trim())
    if (!partyAOk || !partyBOk) {
      setDraftError("Please add names for both parties before generating your contract. Go back to the People step.")
      return
    }
    try {
      beforeRunContractDraft(entitlements?.plan ?? null)
    } catch (err) {
      if (err instanceof UsageLimitError) { setUpgradeModal(true); return }
    }
    setGenerating(true)
    setDraftError(null)
    try {
      const base = getApiBaseUrl()
      const r = await fetch(`${base}/api/contracts/generate-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractType, people, scope, money, protection }),
      })
      const data = await r.json()
      if (data.error) throw new Error(data.message)
      setDraft(data.draft)
    } catch (e) {
      setDraftError((e as Error).message || "Draft generation failed. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  function handleNext() {
    if (step === 0 && !contractType) return
    const next = Math.min(step + 1, STEPS.length - 1)
    setStep(next)
    void fetchAIInsights(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
    // Auto-save progress on every step advance so mobile users don't lose work
    if (contractType) {
      localStorage.setItem(
        "plainpath-contract-draft-latest",
        JSON.stringify({ contractType, people, scope, money, protection, savedAt: new Date().toISOString() })
      )
    }
  }

  function handleBack() {
    if (draft) { setDraft(null); return }
    if (step === 0) { setLocation("/"); return }
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleRestart() {
    setStep(0)
    setContractType(null)
    setPeople({ clientType: "individual", freelancerType: "individual" })
    setScope({})
    setMoney({ paymentStructure: "flat", depositRequired: false, lateFee: false })
    setProtection({ ipTiming: "on-payment", portfolioUsage: true, confidentiality: false, killFee: false, fileReleaseOnPayment: true, disputeResolution: "negotiation", subcontractingAllowed: false })
    setDraft(null)
    setDraftError(null)
    setAiInsights({ suggestions: [], warnings: [], draftGuidance: [] })
    localStorage.removeItem("plainpath-contract-draft-latest")
  }

  const canProceed = step === 0 ? !!contractType : true
  const isLastStep = step === STEPS.length - 1

  const stepContent = [
    <TypeStep key="type" selected={contractType} onSelect={(t) => { setContractType(t); setAiInsights({ suggestions: [], warnings: [], draftGuidance: [] }) }} />,
    <PeopleStep key="people" data={people} onChange={setPeople} contractType={contractType ?? "freelance"} />,
    <ScopeStep key="scope" data={scope} onChange={setScope} contractType={contractType ?? "freelance"} />,
    <MoneyStep key="money" data={money} onChange={setMoney} contractType={contractType} />,
    <ProtectionStep key="protection" data={protection} onChange={setProtection} contractType={contractType ?? "freelance"} />,
    <ReviewStep
      key="review"
      contractType={contractType ?? "freelance"}
      people={people}
      scope={scope}
      money={money}
      protection={protection}
      onEdit={(s) => setStep(s)}
      onGenerate={generateDraft}
      onSave={saveDraft}
      generating={generating}
      error={draftError}
      onFillMoney={(u) => setMoney((m) => ({ ...m, ...u }))}
      onFillProtection={(u) => setProtection((p) => ({ ...p, ...u }))}
      onFillPeople={(u) => setPeople((p) => ({ ...p, ...u }))}
    />,
  ]

  return (
    <div className="min-h-screen bg-background">
      <UpgradeModal
        open={upgradeModal}
        onClose={() => setUpgradeModal(false)}
        reason="contractDraft"
      />
      <WizardProgressBar step={step} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {draft ? (
          <DraftResultView
            draft={draft}
            contractType={contractType ?? "freelance"}
            onBack={() => setDraft(null)}
            onRestart={handleRestart}
          />
        ) : (
          <div className="flex gap-8">
            {/* ── Main content ── */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {stepContent[step]}
                </motion.div>
              </AnimatePresence>

              {/* ── Demo pre-fill shortcuts (step 0 only) ── */}
              {step === 0 && (
                <div className="mt-8 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Or load a demo contract</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {BUILDER_DEMOS.map((demo) => (
                      <button
                        key={demo.id}
                        onClick={() => {
                          setContractType(demo.contractType)
                          setPeople((p) => ({ ...p, ...demo.people }))
                          setScope((s) => ({ ...s, ...demo.scope }))
                          setMoney((m) => ({ ...m, ...demo.money }))
                          setProtection((p) => ({ ...p, ...demo.protection }))
                          setStep(5)
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 hover:border-emerald-400/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{demo.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{demo.meta}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/30">
                <Button variant="ghost" onClick={handleBack} className="gap-1.5 text-sm">
                  <ArrowLeft className="w-4 h-4" />
                  {step === 0 ? "Home" : "Back"}
                </Button>
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <Button variant="outline" size="sm" onClick={saveDraft} className="gap-1.5">
                      <Save className="w-3.5 h-3.5" /> Save Draft
                    </Button>
                  )}
                  {!isLastStep && (
                    <Button onClick={handleNext} disabled={!canProceed} className="gap-1.5">
                      {step === STEPS.length - 2 ? "Review Summary" : "Next"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Mobile AI insights drawer */}
              {step > 0 && <MobileInsightDrawer insights={mergedInsights} loading={insightLoading} />}
            </div>

            {/* ── Desktop AI panel ── */}
            {step > 0 && (
              <div className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-32">
                  <AIInsightPanel insights={mergedInsights} loading={insightLoading} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
