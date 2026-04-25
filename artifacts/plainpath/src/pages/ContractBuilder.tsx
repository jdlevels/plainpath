import { useState, useCallback, useMemo, useEffect } from "react"
import { useLocation } from "wouter"
import {
  PenLine, Code2, Lock, CreditCard, Briefcase, Home as HomeIcon, FileText,
  ChevronRight, ChevronLeft, Sparkles, AlertCircle, Check, Save, Download,
  SkipForward, RefreshCcw, Loader2, Info, Clock, Lock as LockIcon,
  LayoutTemplate, DollarSign, Users, Shield, ArrowLeft, Eye,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getApiBaseUrl } from "@/lib/api"
import { beforeRunContractDraft, UsageLimitError } from "@/lib/analysisGate"
import { saveRecentWork } from "@/lib/recentWork"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeModal from "@/components/UpgradeModal"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ContractType = "freelance" | "nda" | "payment-agreement" | "service-agreement" | "lease" | "custom"
type PaymentStructure = "flat" | "hourly" | "milestone"
type IPTiming = "on-creation" | "on-payment" | "limited-license"
type DisputeResolution = "negotiation" | "mediation" | "arbitration" | "court"
type PartyType = "individual" | "business"
type MobileTab = "builder" | "preview"
type PageState = "empty" | "workspace" | "generating" | "review" | "error"

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
  purposeOfDisclosure: string
  confidentialInfoDescription: string
  ndaTerm: string
  serviceSchedule: string
  serviceStandards: string
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
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ["Type", "People", "Scope", "Money", "Protection", "Review"]

const CONTRACT_TYPES: Array<{
  id: ContractType
  title: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
  popular?: boolean
}> = [
  { id: "freelance",         title: "Freelance Service Agreement",  description: "For project-based creative, tech, or consulting work.", Icon: Code2, popular: true },
  { id: "nda",               title: "Non-Disclosure Agreement",     description: "Mutual or one-way confidentiality between two parties.", Icon: Lock },
  { id: "service-agreement", title: "Service Agreement",            description: "Ongoing or retainer-based service relationships.", Icon: Briefcase },
  { id: "lease",             title: "Lease Agreement",              description: "Residential or commercial property rental terms.", Icon: HomeIcon },
  { id: "payment-agreement", title: "Payment Agreement",            description: "Formalise a payment plan or installment arrangement.", Icon: CreditCard },
  { id: "custom",            title: "Custom Agreement",             description: "For structured agreements, notices, or business documents. Not for SOPs or manuals.", Icon: FileText },
]

const API_CONTRACT_TYPE = (ct: ContractType): string =>
  ct === "custom" ? "freelance" : ct

const STEP_SECTIONS: Record<number, string> = {
  1: "Parties & Services",
  2: "Scope of Work",
  3: "Payment & Compensation",
  4: "IP & Confidentiality",
  5: "Governing Law",
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE DOCUMENT PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderLines({ count = 3, widths }: { count?: number; widths?: number[] }) {
  const ws = widths ?? [100, 88, 75, 60].slice(0, count)
  return (
    <div className="space-y-1.5">
      {ws.map((w, i) => (
        <div key={i} className="h-2 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

function SectionHeading({ num, title, active, done }: { num: string; title: string; active: boolean; done: boolean }) {
  return (
    <div className={`font-bold text-[11px] uppercase tracking-wider font-sans mb-2 ${active ? "text-violet-700" : done ? "text-[#1a1a1a]" : "text-[#aaa]"}`}>
      {num} — {title}
    </div>
  )
}

function LiveDocumentPreview({
  contractType,
  people,
  scope,
  money,
  protection,
  step,
  draft,
  aiActive,
}: {
  contractType: ContractType | null
  people: Partial<PeopleData>
  scope: Partial<ScopeData>
  money: Partial<MoneyData>
  protection: Partial<ProtectionData>
  step: number
  draft: DraftPayload | null
  aiActive?: boolean
}) {
  const clientName = people.clientName?.trim() || people.clientEntityName?.trim() || null
  const freelancerName = people.freelancerName?.trim() || people.freelancerEntityName?.trim() || null
  const govLaw = people.governingLaw?.trim() || null
  const totalFee = money.totalFee?.trim() || null
  const deposit = money.depositRequired && money.depositAmount ? money.depositAmount : null
  const invoiceDays = money.invoiceDueDays?.trim() || "30"
  const scopeDesc = scope.scopeDescription?.trim() || null
  const deliverables = scope.deliverables?.trim() || null
  const titleLabel = contractType ? CONTRACT_TYPES.find(c => c.id === contractType)?.title ?? "Agreement" : "Agreement"

  const sectionActive = (s: number) => step === s
  const sectionDone = (s: number) => step > s

  // If we have a fully generated draft, render it
  if (draft) {
    return (
      <div className="w-full max-w-[580px] bg-[#FFFEF8] rounded-lg shadow-[0_4px_40px_rgba(0,0,0,0.3)] p-10 font-serif text-[#1a1a1a] text-sm leading-relaxed min-h-[700px]">
        <div className="text-center mb-8">
          <div className="font-bold text-base tracking-wide uppercase">{titleLabel}</div>
          {draft.parties && (
            <div className="text-xs text-[#888] font-sans mt-1">
              {draft.parties.partyA?.name} × {draft.parties.partyB?.name}
            </div>
          )}
        </div>
        {draft.sections?.map((section, i) => (
          <div key={i} className="mb-6">
            <div className="font-bold text-[11px] uppercase tracking-wider font-sans mb-2">§{i + 1} — {section.title}</div>
            {section.clauses?.map((clause, j) => (
              <p key={j} className="text-[13px] mb-2 leading-relaxed">{clause}</p>
            ))}
          </div>
        ))}
        <div className="mt-10 pt-8 border-t border-gray-200 grid grid-cols-2 gap-8">
          <div>
            <div className="text-[11px] font-sans text-gray-400 mb-6">CLIENT</div>
            <div className="border-b border-gray-300 mb-1.5" />
            <div className="text-[11px] font-sans text-gray-500">{draft.parties?.partyA?.name}</div>
          </div>
          <div>
            <div className="text-[11px] font-sans text-gray-400 mb-6">FREELANCER</div>
            <div className="border-b border-gray-300 mb-1.5" />
            <div className="text-[11px] font-sans text-gray-500">{draft.parties?.partyB?.name}</div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-sans">PlainPath · Document drafting support. Review before use. Not legal advice.</span>
          <span className="text-[10px] text-gray-400 font-sans">Page 1 of 1</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[580px] bg-[#FFFEF8] rounded-lg shadow-[0_4px_40px_rgba(0,0,0,0.3)] p-10 font-serif text-[#1a1a1a] text-sm leading-relaxed min-h-[700px]">
      <div className="text-center mb-8">
        <div className="font-bold text-base tracking-wide uppercase">{titleLabel}</div>
        {(clientName || freelancerName) && (
          <div className="text-xs text-[#888] font-sans mt-1">
            {clientName ?? "—"} × {freelancerName ?? "—"}
            {govLaw ? ` · ${govLaw}` : ""}
          </div>
        )}
        {!clientName && !freelancerName && (
          <div className="text-xs text-[#bbb] font-sans mt-1">Complete the form to see your document build here</div>
        )}
      </div>

      {/* §1 — Parties */}
      <div className={`mb-5 ${sectionActive(1) ? "rounded-lg border-2 border-violet-500/60 bg-violet-500/[0.03] p-3 -mx-1 relative" : ""}`}>
        {sectionActive(1) && (
          <div className="absolute -top-2.5 left-3 flex items-center gap-1.5 bg-[#FFFEF8] px-2">
            <span className="text-[10px] text-violet-500 font-bold font-sans uppercase tracking-wider">● Editing this section</span>
          </div>
        )}
        <SectionHeading num="§1" title="PARTIES & SERVICES" active={sectionActive(1)} done={sectionDone(1)} />
        {(sectionDone(1) || sectionActive(1)) && (clientName || freelancerName) ? (
          <p className="text-[13px]">
            This Agreement is entered into between{" "}
            <strong>{clientName ?? <span className="bg-amber-100 text-amber-800 px-1 rounded font-sans text-[11px]">client name needed</span>}</strong>{" "}
            ("Client")
            {people.clientAddress ? `, ${people.clientAddress}` : ""}
            {people.governingLaw ? `, a ${people.governingLaw} entity` : ""}, and{" "}
            <strong>{freelancerName ?? <span className="bg-amber-100 text-amber-800 px-1 rounded font-sans text-[11px]">freelancer name needed</span>}</strong>{" "}
            ("Freelancer")
            {people.freelancerAddress
              ? `, ${people.freelancerAddress}`
              : <span className="inline-block bg-amber-100 text-amber-800 px-1.5 rounded font-sans text-[11px] ml-1">address needed</span>
            }
            {money.startDate ? `, effective ${new Date(money.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}.
          </p>
        ) : (
          <>
            <PlaceholderLines count={2} widths={[90, 75]} />
            {step < 1 && <div className="mt-1.5 text-[10px] text-gray-400 font-sans italic">Complete Step 2 — Parties to fill this section</div>}
          </>
        )}
      </div>

      {/* §2 — Scope */}
      <div className={`mb-5 ${sectionActive(2) ? "rounded-lg border-2 border-violet-500/60 bg-violet-500/[0.03] p-3 -mx-1 relative" : ""} ${!sectionDone(1) && !sectionActive(2) ? "opacity-50" : ""}`}>
        {sectionActive(2) && (
          <div className="absolute -top-2.5 left-3 flex items-center gap-1.5 bg-[#FFFEF8] px-2">
            <span className="text-[10px] text-violet-500 font-bold font-sans uppercase tracking-wider">● Editing this section</span>
          </div>
        )}
        <SectionHeading num="§2" title="SCOPE OF WORK" active={sectionActive(2)} done={sectionDone(2)} />
        {sectionDone(2) && scopeDesc ? (
          <p className="text-[13px]">{scopeDesc}{deliverables ? ` Deliverables include: ${deliverables.split("\n").slice(0, 3).join("; ")}.` : ""}</p>
        ) : (
          <>
            <PlaceholderLines count={3} widths={[100, 88, 72]} />
            {!sectionDone(2) && step < 2 && <div className="mt-1.5 text-[10px] text-gray-400 font-sans italic">Complete Step 3 — Scope to fill this section</div>}
          </>
        )}
      </div>

      {/* §3 — Payment */}
      <div className={`mb-5 ${sectionActive(3) ? "rounded-lg border-2 border-violet-500/60 bg-violet-500/[0.03] p-3 -mx-1 relative" : ""} ${!sectionDone(2) && !sectionActive(3) ? "opacity-40" : ""}`}>
        {sectionActive(3) && (
          <div className="absolute -top-2.5 left-3 flex items-center gap-1.5 bg-[#FFFEF8] px-2">
            <span className="text-[10px] text-violet-500 font-bold font-sans uppercase tracking-wider">● Editing this section</span>
          </div>
        )}
        <SectionHeading num="§3" title="PAYMENT & COMPENSATION" active={sectionActive(3)} done={sectionDone(3)} />
        {sectionDone(3) && totalFee ? (
          <p className="text-[13px]">
            Total fee: <strong>${parseInt(totalFee).toLocaleString()}</strong>.
            {deposit && ` Deposit of $${parseInt(deposit).toLocaleString()} (${Math.round((parseInt(deposit) / parseInt(totalFee)) * 100)}%) due upon execution.`}
            {` Balance due within ${invoiceDays} days of final delivery.`}
            {money.lateFee && money.lateFeeAmount && ` Late payments accrue ${money.lateFeeAmount}% per month interest.`}
          </p>
        ) : (
          <PlaceholderLines count={2} widths={[95, 82]} />
        )}
      </div>

      {/* §4 — IP */}
      <div className={`mb-5 ${sectionActive(4) ? "rounded-lg border-2 border-violet-500/60 bg-violet-500/[0.03] p-3 -mx-1 relative" : ""} ${!sectionDone(3) && !sectionActive(4) ? "opacity-30" : ""}`}>
        {sectionActive(4) && aiActive && (
          <div className="absolute -top-2.5 left-3 flex items-center gap-1.5 bg-[#FFFEF8] px-2">
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span className="text-[10px] text-violet-500 font-bold font-sans uppercase tracking-wider">AI — suggesting language</span>
          </div>
        )}
        {sectionActive(4) && !aiActive && (
          <div className="absolute -top-2.5 left-3 flex items-center gap-1.5 bg-[#FFFEF8] px-2">
            <span className="text-[10px] text-violet-500 font-bold font-sans uppercase tracking-wider">● Editing this section</span>
          </div>
        )}
        <SectionHeading num="§4" title="INTELLECTUAL PROPERTY & CONFIDENTIALITY" active={sectionActive(4)} done={sectionDone(4)} />
        {sectionDone(4) ? (
          <p className="text-[13px]">
            {protection.ipTiming === "on-payment"
              ? "All deliverables become exclusive property of Client upon receipt of full payment. Until then, IP remains with Freelancer."
              : "IP transfers to Client upon creation of each deliverable."}
            {protection.portfolioUsage ? " Freelancer retains portfolio display rights." : ""}
            {protection.confidentiality ? " Both parties agree to maintain confidentiality for 2 years post-engagement." : ""}
          </p>
        ) : (
          <PlaceholderLines count={2} widths={[90, 78]} />
        )}
      </div>

      {/* §5 — Governing Law */}
      <div className={`mb-5 ${!sectionDone(4) && !sectionActive(5) ? "opacity-25" : ""}`}>
        <SectionHeading num="§5" title="GOVERNING LAW" active={sectionActive(5)} done={sectionDone(5)} />
        {govLaw ? (
          <p className="text-[13px]">
            This Agreement is governed by the laws of <strong>{govLaw}</strong>.
            {protection.disputeResolution && ` Disputes shall be resolved by ${protection.disputeResolution}.`}
          </p>
        ) : (
          <PlaceholderLines count={1} widths={[70]} />
        )}
      </div>

      <div className="mt-10 pt-4 border-t border-gray-200 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 font-sans">PlainPath · Document drafting support. Review before use. Not legal advice.</span>
        <span className="text-[10px] text-gray-400 font-sans">Draft · Page 1</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────

function BuilderHeader({
  filename,
  unsaved,
  onSave,
  onExport,
  canExport,
}: {
  filename: string
  unsaved: boolean
  onSave: () => void
  onExport: () => void
  canExport: boolean
}) {
  return (
    <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0 bg-[#0c0c0f]">
      <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
        <PenLine className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm font-medium text-white/50 hidden sm:inline">Build a Contract</span>
      <span className="text-white/20 hidden sm:inline">/</span>
      <span className="text-sm font-medium text-white/80 truncate max-w-[200px]">{filename}</span>
      {unsaved && (
        <div className="ml-1 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/[0.08] border border-amber-500/20 rounded-full px-2.5 py-0.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Unsaved</span>
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/60 hover:text-white/80 transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> Save draft
        </button>
        <button
          onClick={onExport}
          disabled={!canExport}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP PROGRESS
// ─────────────────────────────────────────────────────────────────────────────

function StepProgress({ step }: { step: number }) {
  const current = step - 1 // steps 1-5 (People to Review)
  return (
    <div className="px-5 pt-5 pb-3 border-b border-white/[0.05] shrink-0">
      <div className="flex items-center gap-0.5 mb-3 flex-wrap">
        {STEPS.slice(1).map((s, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium shrink-0 ${
              i < current ? "bg-violet-600 text-white" :
              i === current ? "bg-violet-600 text-white ring-2 ring-violet-400/30" :
              "bg-white/[0.05] text-white/25"
            }`}>
              {i < current ? <Check className="w-3 h-3" /> : i + 2}
            </div>
            <span className={`text-[10px] mx-0.5 ${
              i === current ? "text-white/80 font-medium" :
              i < current ? "text-white/40" : "text-white/20"
            }`}>{s}</span>
            {i < STEPS.length - 2 && (
              <div className={`w-3 h-px mx-0.5 ${i < current ? "bg-violet-500/50" : "bg-white/[0.08]"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-600 rounded-full transition-all duration-500"
          style={{ width: `${(current / (STEPS.length - 2)) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE — TYPE SELECTION
// ─────────────────────────────────────────────────────────────────────────────

const RECENT_DRAFTS_DEMO = [
  { name: "Acme-Riverton-ServiceAgreement.draft", updated: "2 days ago", type: "Freelance", pct: 70 },
  { name: "SunBridge-NDA.draft",                  updated: "4 days ago", type: "NDA",       pct: 40 },
]

function EmptyState({ onSelect }: { onSelect: (ct: ContractType) => void }) {
  const [hasSavedDraft, setHasSavedDraft] = useState(false)
  useEffect(() => {
    setHasSavedDraft(!!localStorage.getItem("plainpath-contract-draft-latest"))
  }, [])

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-12 bg-[#0c0c0f]">
      <div className="max-w-3xl mx-auto pt-10">
        <h1 className="text-2xl font-semibold text-white mb-1">What would you like to build?</h1>
        <p className="text-sm text-white/40 mb-8">
          PlainPath guides you through each section with drafting support. Your document grows in real time as you answer.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {CONTRACT_TYPES.map((ct) => {
            const Icon = ct.Icon
            return (
              <button
                key={ct.id}
                onClick={() => onSelect(ct.id)}
                className={`group relative flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all text-left ${
                  ct.popular
                    ? "border-violet-500/40 bg-violet-600/[0.06] hover:bg-violet-600/[0.10]"
                    : "border-white/[0.07] bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]"
                }`}
              >
                {ct.popular && (
                  <span className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-violet-600/20 text-violet-300 border-violet-500/30">
                    Most Popular
                  </span>
                )}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ct.popular ? "bg-violet-600/20" : "bg-white/[0.05]"}`}>
                  <Icon className={`w-5 h-5 ${ct.popular ? "text-violet-400" : "text-white/50"}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/85 mb-0.5 leading-tight">{ct.title}</div>
                  <div className="text-xs text-white/35 leading-relaxed">{ct.description}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Scoping notice */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl mb-6">
          <Info className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
          <p className="text-xs text-white/30 leading-relaxed">
            PlainPath supports contracts, agreements, notices, and structured business/legal documents.
            Not for SOPs, policy manuals, or general long-form writing.
          </p>
        </div>

        {/* Recent drafts */}
        <div className="border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-white/30" />
            <span className="text-xs text-white/30 uppercase tracking-widest">Recent Drafts</span>
          </div>
          {hasSavedDraft ? (
            <button
              onClick={() => {
                const raw = localStorage.getItem("plainpath-contract-draft-latest")
                if (raw) {
                  try {
                    const saved = JSON.parse(raw)
                    if (saved.contractType) onSelect(saved.contractType)
                  } catch { /* ignore */ }
                }
              }}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/80 truncate">Saved draft — click to resume</div>
                <div className="text-xs text-white/30 mt-0.5">Auto-saved</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
            </button>
          ) : (
            RECENT_DRAFTS_DEMO.map((d, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-white/[0.04] last:border-0 opacity-40">
                <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/80 truncate">{d.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1 w-20 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs text-white/30">{d.pct}% · {d.updated}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="text-center text-xs text-white/20 leading-relaxed">
          PlainPath helps draft structured documents. Review before use.{" "}
          <span className="text-white/30 font-medium">Not legal advice.</span>{" "}
          Consider professional review for high-stakes documents.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM STEP SECTIONS (Right panel content)
// ─────────────────────────────────────────────────────────────────────────────

function FieldGroup({ label, required, optional, children }: {
  label: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] text-white/30 uppercase tracking-widest">{label}</span>
        {required && (
          <span className="text-[10px] text-red-400/70 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5">Required</span>
        )}
        {optional && (
          <span className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.07] rounded px-1.5 py-0.5">Optional</span>
        )}
      </div>
      {children}
    </div>
  )
}

function TextInput({
  label, value, onChange, placeholder, required, note,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; note?: string
}) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1 block">{label}</label>
      <input
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 placeholder-white/25 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {!value.trim() && required && (
        <div className="flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] text-amber-400">Required — will appear in document</span>
        </div>
      )}
      {note && !(!value.trim() && required) && (
        <p className="text-xs text-white/25 mt-1 leading-relaxed">{note}</p>
      )}
    </div>
  )
}

function TextareaInput({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1 block">{label}</label>
      <textarea
        rows={rows}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 placeholder-white/25 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-colors resize-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function SegmentedControl({ options, value, onChange }: {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
            value === opt.value
              ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
              : "border-white/[0.07] text-white/40 hover:border-white/15 hover:text-white/60"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, value, onChange, note }: {
  label: string; value: boolean; onChange: (v: boolean) => void; note?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/50">{label}</label>
        <button
          onClick={() => onChange(!value)}
          className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${value ? "bg-violet-600 justify-end" : "bg-white/[0.10] justify-start"}`}
        >
          <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
        </button>
      </div>
      {note && <p className="text-xs text-white/25 mt-1 leading-relaxed">{note}</p>}
    </div>
  )
}

function AIHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-violet-600/[0.06] border border-violet-500/15 rounded-xl">
      <Sparkles className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
      <p className="text-xs text-violet-300/70 leading-relaxed">{children}</p>
    </div>
  )
}

// Step 1 — People
function PeopleSection({
  contractType,
  people,
  onChange,
}: {
  contractType: ContractType
  people: Partial<PeopleData>
  onChange: (d: Partial<PeopleData>) => void
}) {
  const isLease = contractType === "lease"
  const isNda = contractType === "nda" || contractType === "payment-agreement"
  const clientLabel = isLease ? "Tenant" : isNda ? "Disclosing Party" : "Client"
  const freelancerLabel = isLease ? "Landlord / Property Manager" : isNda ? "Receiving Party" : contractType === "freelance" ? "Freelancer / Contractor" : "Service Provider"

  const set = (k: keyof PeopleData) => (v: string) => onChange({ ...people, [k]: v })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-0.5">Step 2 — Parties</h3>
        <p className="text-xs text-white/35">Enter the full legal names and contact details for both parties.</p>
      </div>

      <FieldGroup label={`Party A — ${clientLabel}`} required>
        <div className="space-y-2">
          <TextInput
            label="Full legal name or entity name"
            value={people.clientName ?? ""}
            onChange={set("clientName")}
            placeholder={`e.g. Acme Corp`}
            required
          />
          <TextInput
            label="Business address"
            value={people.clientAddress ?? ""}
            onChange={set("clientAddress")}
            placeholder="Street, City, State, ZIP"
          />
        </div>
      </FieldGroup>

      <FieldGroup label={`Party B — ${freelancerLabel}`} required>
        <div className="space-y-2">
          <TextInput
            label="Full legal name or entity name"
            value={people.freelancerName ?? ""}
            onChange={set("freelancerName")}
            placeholder="e.g. Jordan R. / Riverton Design Studio"
            required
          />
          <TextInput
            label="Business address"
            value={people.freelancerAddress ?? ""}
            onChange={set("freelancerAddress")}
            placeholder="Street, City, State, ZIP"
            required
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Governing State" optional>
        <TextInput
          label="State whose laws govern this agreement"
          value={people.governingLaw ?? ""}
          onChange={set("governingLaw")}
          placeholder="e.g. New Jersey, California"
          note="Usually the state where work is performed or where both parties are located."
        />
      </FieldGroup>

      {contractType === "freelance" || contractType === "service-agreement" ? (
        <FieldGroup label="Project / Engagement Title" optional>
          <TextInput
            label="Short name for this engagement"
            value={people.projectTitle ?? ""}
            onChange={set("projectTitle")}
            placeholder="e.g. Brand Identity & Website Design"
          />
        </FieldGroup>
      ) : null}

      <FieldGroup label="Effective Date" optional>
        <TextInput
          label="Agreement effective date"
          value={people.clientState ?? ""}
          onChange={set("clientState")}
          placeholder="e.g. July 1, 2025"
          note="Leave blank to use the signature date."
        />
      </FieldGroup>

      <AIHint>
        Match legal names exactly to any business registration. For LLCs, include the state of formation.
      </AIHint>
    </div>
  )
}

// Step 2 — Scope
function ScopeSection({
  contractType,
  scope,
  onChange,
}: {
  contractType: ContractType
  scope: Partial<ScopeData>
  onChange: (d: Partial<ScopeData>) => void
}) {
  const set = (k: keyof ScopeData) => (v: string) => onChange({ ...scope, [k]: v })
  const isLease = contractType === "lease"
  const isNda = contractType === "nda"

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-0.5">Step 3 — Scope of Work</h3>
        <p className="text-xs text-white/35">Define what is being delivered or agreed to.</p>
      </div>

      {isLease ? (
        <>
          <FieldGroup label="Property Address" required>
            <TextInput
              label="Full address of the rental property"
              value={scope.propertyAddress ?? ""}
              onChange={set("propertyAddress")}
              placeholder="e.g. 210 Oak St, Apt 3B, Newark, NJ 07102"
              required
            />
          </FieldGroup>
          <FieldGroup label="Property Type" optional>
            <SegmentedControl
              options={[
                { label: "Residential", value: "residential" },
                { label: "Commercial", value: "commercial" },
              ]}
              value={scope.propertyType ?? "residential"}
              onChange={set("propertyType")}
            />
          </FieldGroup>
          <FieldGroup label="Lease Type" optional>
            <SegmentedControl
              options={[
                { label: "Fixed-term", value: "fixed" },
                { label: "Month-to-month", value: "month-to-month" },
              ]}
              value={scope.leaseType ?? "fixed"}
              onChange={set("leaseType")}
            />
          </FieldGroup>
        </>
      ) : isNda ? (
        <>
          <FieldGroup label="Purpose of Disclosure" required>
            <TextInput
              label="Why is confidential information being shared?"
              value={scope.purposeOfDisclosure ?? ""}
              onChange={set("purposeOfDisclosure")}
              placeholder="e.g. Evaluating a potential business partnership"
              required
            />
          </FieldGroup>
          <FieldGroup label="Confidential Information" optional>
            <TextareaInput
              label="Describe the type of information covered"
              value={scope.confidentialInfoDescription ?? ""}
              onChange={set("confidentialInfoDescription")}
              placeholder="e.g. Trade secrets, financial data, product roadmaps, customer lists"
            />
          </FieldGroup>
          <FieldGroup label="NDA Duration" optional>
            <TextInput
              label="How long does the NDA remain in effect?"
              value={scope.ndaTerm ?? ""}
              onChange={set("ndaTerm")}
              placeholder="e.g. 2 years, 3 years"
              note="A defined term (1–3 years) is standard. Leave blank for indefinite."
            />
          </FieldGroup>
        </>
      ) : (
        <>
          <FieldGroup label="Service Type" optional>
            <TextInput
              label="Category of work"
              value={scope.serviceType ?? ""}
              onChange={set("serviceType")}
              placeholder="e.g. Web Development, Graphic Design, IT Support"
            />
          </FieldGroup>
          <FieldGroup label="Scope Description" required>
            <TextareaInput
              label="Describe the work in plain terms"
              value={scope.scopeDescription ?? ""}
              onChange={set("scopeDescription")}
              rows={4}
              placeholder="Describe what the freelancer will do for the client..."
            />
          </FieldGroup>
          <FieldGroup label="Deliverables" optional>
            <TextareaInput
              label="List specific items to be delivered (one per line)"
              value={scope.deliverables ?? ""}
              onChange={set("deliverables")}
              rows={3}
              placeholder={"1) Figma mockups\n2) Coded website\n3) Source files"}
            />
          </FieldGroup>
          <FieldGroup label="Exclusions" optional>
            <TextareaInput
              label="What is explicitly NOT included?"
              value={scope.exclusions ?? ""}
              onChange={set("exclusions")}
              rows={2}
              placeholder="e.g. Ongoing hosting, SEO copywriting, logo design"
            />
          </FieldGroup>
          <FieldGroup label="Revision Rounds" optional>
            <TextInput
              label="Number of revision rounds included"
              value={scope.revisionLimit ?? ""}
              onChange={set("revisionLimit")}
              placeholder="e.g. 2"
              note="Without a limit, clients can request revisions indefinitely."
            />
          </FieldGroup>
        </>
      )}

      <AIHint>
        Suggested language only — review before use. Clear scope definitions reduce disputes. Not legal advice.
      </AIHint>
    </div>
  )
}

// Step 3 — Money
function MoneySection({
  contractType,
  money,
  onChange,
}: {
  contractType: ContractType
  money: Partial<MoneyData>
  onChange: (d: Partial<MoneyData>) => void
}) {
  const set = (k: keyof MoneyData) => (v: string | boolean) => onChange({ ...money, [k]: v })
  const isLease = contractType === "lease"

  if (isLease) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white mb-0.5">Step 4 — Rent & Fees</h3>
          <p className="text-xs text-white/35">Define the financial terms of this lease.</p>
        </div>
        <FieldGroup label="Monthly Rent" required>
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 gap-2">
            <span className="text-white/40 text-sm">$</span>
            <input
              className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 focus:outline-none"
              value={money.monthlyRent ?? ""}
              onChange={(e) => set("monthlyRent")(e.target.value)}
              placeholder="e.g. 2,200"
            />
            <span className="text-white/30 text-xs">/month</span>
          </div>
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Lease Start" optional>
            <input
              type="date"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 focus:outline-none focus:border-violet-500/40 transition-colors"
              value={money.leaseStartDate ?? ""}
              onChange={(e) => set("leaseStartDate")(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Lease End" optional>
            <input
              type="date"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 focus:outline-none focus:border-violet-500/40 transition-colors"
              value={money.leaseEndDate ?? ""}
              onChange={(e) => set("leaseEndDate")(e.target.value)}
            />
          </FieldGroup>
        </div>
        <FieldGroup label="Security Deposit" optional>
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 gap-2">
            <span className="text-white/40 text-sm">$</span>
            <input
              className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 focus:outline-none"
              value={money.securityDeposit ?? ""}
              onChange={(e) => set("securityDeposit")(e.target.value)}
              placeholder="e.g. 4,400 (2 months)"
            />
          </div>
        </FieldGroup>
        <FieldGroup label="Late Rent Fee" optional>
          <Toggle
            label="Charge a late fee for overdue rent"
            value={money.lateFee ?? false}
            onChange={(v) => set("lateFee")(v)}
          />
          {money.lateFee && (
            <div className="mt-2">
              <TextInput
                label="Late fee amount or rate"
                value={money.lateFeeAmount ?? ""}
                onChange={(v) => set("lateFeeAmount")(v)}
                placeholder="e.g. $100 flat or 5% of monthly rent"
              />
            </div>
          )}
        </FieldGroup>
        <AIHint>Suggested language only — review before use. Security deposits are governed by state law. Not legal advice.</AIHint>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-0.5">Step 4 — Payment & Compensation</h3>
        <p className="text-xs text-white/35">Define how and when payment will be made.</p>
      </div>

      <FieldGroup label="Payment Structure" required>
        <SegmentedControl
          options={[
            { label: "Flat fee", value: "flat" },
            { label: "Hourly", value: "hourly" },
            { label: "Milestone", value: "milestone" },
          ]}
          value={money.paymentStructure ?? "flat"}
          onChange={(v) => set("paymentStructure")(v)}
        />
      </FieldGroup>

      {(money.paymentStructure ?? "flat") !== "hourly" ? (
        <FieldGroup label="Total Project Fee" required>
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 gap-2">
            <span className="text-white/40 text-sm">$</span>
            <input
              className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 focus:outline-none"
              value={money.totalFee ?? ""}
              onChange={(e) => set("totalFee")(e.target.value)}
              placeholder="e.g. 9,500"
            />
          </div>
        </FieldGroup>
      ) : (
        <FieldGroup label="Hourly Rate" required>
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 gap-2">
            <span className="text-white/40 text-sm">$</span>
            <input
              className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 focus:outline-none"
              value={money.hourlyRate ?? ""}
              onChange={(e) => set("hourlyRate")(e.target.value)}
              placeholder="e.g. 120"
            />
            <span className="text-white/30 text-xs">/hour</span>
          </div>
        </FieldGroup>
      )}

      <FieldGroup label="Upfront Deposit" optional>
        <Toggle
          label="Require a deposit before work begins"
          value={money.depositRequired ?? false}
          onChange={(v) => set("depositRequired")(v)}
          note="A 25–50% deposit is standard. Common for projects over $500."
        />
        {money.depositRequired && (
          <div className="mt-2">
            <TextInput
              label="Deposit amount"
              value={money.depositAmount ?? ""}
              onChange={(v) => set("depositAmount")(v)}
              placeholder="e.g. 2,375"
            />
          </div>
        )}
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Project Start" optional>
          <input
            type="date"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 focus:outline-none focus:border-violet-500/40 transition-colors"
            value={money.startDate ?? ""}
            onChange={(e) => set("startDate")(e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Delivery Deadline" optional>
          <input
            type="date"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 focus:outline-none focus:border-violet-500/40 transition-colors"
            value={money.deadline ?? ""}
            onChange={(e) => set("deadline")(e.target.value)}
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Invoice Due Period" optional>
        <TextInput
          label="Days after delivery for payment"
          value={money.invoiceDueDays ?? ""}
          onChange={(v) => set("invoiceDueDays")(v)}
          placeholder="e.g. 30 (NET 30)"
          note="NET 14 or NET 30 sets clear expectations."
        />
      </FieldGroup>

      <FieldGroup label="Late Payment Fee" optional>
        <Toggle
          label="Charge a late fee on overdue invoices"
          value={money.lateFee ?? false}
          onChange={(v) => set("lateFee")(v)}
          note="1.5%/month is standard and enforceable in most U.S. states."
        />
        {money.lateFee && (
          <div className="mt-2">
            <TextInput
              label="Late fee rate"
              value={money.lateFeeAmount ?? ""}
              onChange={(v) => set("lateFeeAmount")(v)}
              placeholder="e.g. 1.5 (% per month)"
            />
          </div>
        )}
      </FieldGroup>

      <AIHint>
        Suggested language only — review before use. Not legal advice.
      </AIHint>
    </div>
  )
}

// Step 4 — Protection
function ProtectionSection({
  contractType,
  protection,
  onChange,
}: {
  contractType: ContractType
  protection: Partial<ProtectionData>
  onChange: (d: Partial<ProtectionData>) => void
}) {
  const set = (k: keyof ProtectionData) => (v: string | boolean) => onChange({ ...protection, [k]: v })
  const isLease = contractType === "lease"

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-0.5">Step 5 — Protection & Terms</h3>
        <p className="text-xs text-white/35">{isLease ? "Tenant rights, maintenance, and termination terms." : "IP, confidentiality, termination, and dispute resolution."}</p>
      </div>

      {!isLease && (
        <>
          <FieldGroup label="IP Ownership Transfer" required>
            <SegmentedControl
              options={[
                { label: "On full payment", value: "on-payment" },
                { label: "On creation", value: "on-creation" },
                { label: "Limited license", value: "limited-license" },
              ]}
              value={protection.ipTiming ?? "on-payment"}
              onChange={(v) => set("ipTiming")(v)}
            />
            {protection.ipTiming === "on-creation" && (
              <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300/70">IP transfers before full payment — client could use work without paying the balance.</p>
              </div>
            )}
          </FieldGroup>

          <FieldGroup label="Confidentiality" optional>
            <Toggle
              label="Include confidentiality clause"
              value={protection.confidentiality ?? false}
              onChange={(v) => set("confidentiality")(v)}
              note="Protects proprietary information shared during the engagement."
            />
          </FieldGroup>

          <FieldGroup label="Portfolio Usage" optional>
            <Toggle
              label="Freelancer may display work in portfolio"
              value={protection.portfolioUsage ?? true}
              onChange={(v) => set("portfolioUsage")(v)}
            />
          </FieldGroup>

          <FieldGroup label="Kill Fee" optional>
            <Toggle
              label="Charge a kill fee if client cancels"
              value={protection.killFee ?? false}
              onChange={(v) => set("killFee")(v)}
              note="Compensates for lost time if the project is cancelled mid-way."
            />
            {protection.killFee && (
              <div className="mt-2">
                <TextInput
                  label="Kill fee amount or percentage"
                  value={protection.killFeeAmount ?? ""}
                  onChange={(v) => set("killFeeAmount")(v)}
                  placeholder="e.g. 50% of remaining balance"
                />
              </div>
            )}
          </FieldGroup>

          <FieldGroup label="Client Feedback Deadline" optional>
            <TextInput
              label="Days for client to respond to deliverables"
              value={protection.clientFeedbackDeadlineDays ?? ""}
              onChange={(v) => set("clientFeedbackDeadlineDays")(v)}
              placeholder="e.g. 5"
              note="Prevents indefinite delays from client-side inaction."
            />
          </FieldGroup>
        </>
      )}

      <FieldGroup label="Termination Notice" optional>
        <TextInput
          label="Notice period required to terminate (days)"
          value={protection.terminationNoticeDays ?? ""}
          onChange={(v) => set("terminationNoticeDays")(v)}
          placeholder="e.g. 14"
          note="Gives both parties time to wrap up the engagement."
        />
      </FieldGroup>

      <FieldGroup label="Dispute Resolution" optional>
        <SegmentedControl
          options={[
            { label: "Negotiation", value: "negotiation" },
            { label: "Mediation", value: "mediation" },
            { label: "Arbitration", value: "arbitration" },
          ]}
          value={protection.disputeResolution ?? "negotiation"}
          onChange={(v) => set("disputeResolution")(v)}
        />
      </FieldGroup>

      <AIHint>
        Suggested clause language — review before use. Consider professional review for high-risk documents. Not legal advice.
      </AIHint>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW PANEL (Right side when draft is ready)
// ─────────────────────────────────────────────────────────────────────────────

const REVIEW_SECTIONS = [
  { label: "Type & Template",      key: "type" },
  { label: "Parties",              key: "people" },
  { label: "Scope of Work",        key: "scope" },
  { label: "Payment",              key: "money" },
  { label: "Protection & Terms",   key: "protection" },
  { label: "Governing Law",        key: "law" },
]

function ReviewExportPanel({
  draft,
  contractType,
  people,
  onDownload,
  onRestart,
}: {
  draft: DraftPayload
  contractType: ContractType
  people: Partial<PeopleData>
  onDownload: (format: "pdf" | "docx" | "text") => void
  onRestart: () => void
}) {
  const [downloaded, setDownloaded] = useState(false)
  const clientName = people.clientName?.trim() || people.clientEntityName?.trim() || "—"
  const freelancerName = people.freelancerName?.trim() || people.freelancerEntityName?.trim() || "—"

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Check className="w-4 h-4 text-green-400" />
        <span className="text-sm font-semibold text-white">Ready to Download</span>
      </div>
      <p className="text-xs text-white/35 mb-5">All sections complete. Review the document then export.</p>

      {/* Completion checklist */}
      <div className="border border-white/[0.07] rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.05]">
          <span className="text-xs text-white/30 uppercase tracking-widest">Section checklist</span>
        </div>
        {REVIEW_SECTIONS.map((s, i) => {
          const note =
            s.key === "type" ? CONTRACT_TYPES.find(c => c.id === contractType)?.title ?? "—" :
            s.key === "people" ? `${clientName} · ${freelancerName}` :
            s.key === "scope" ? (draft.sections?.[1]?.title ?? "—") :
            s.key === "money" ? (draft.paymentSummary?.[0] ?? "—") :
            s.key === "protection" ? (draft.protectionSummary?.[0] ?? "—") :
            (people.governingLaw ?? "—")
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
              <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/75">{s.label}</div>
                <div className="text-[11px] text-white/30 truncate">{note}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Review flags */}
      {draft.reviewFlags && draft.reviewFlags.length > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-500/[0.05] border border-amber-500/15 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-medium text-amber-300 mb-1">Review before use</div>
            {draft.reviewFlags.slice(0, 2).map((flag, i) => (
              <div key={i} className="text-[11px] text-amber-300/50 leading-relaxed">{flag}</div>
            ))}
          </div>
        </div>
      )}

      {/* Signatures warning */}
      <div className="flex items-start gap-3 p-3.5 bg-amber-500/[0.05] border border-amber-500/15 rounded-xl mb-5">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="text-xs font-medium text-amber-300 mb-0.5">Signatures not added</div>
          <div className="text-[11px] text-amber-300/50 leading-relaxed">
            Add signatures to make this document legally binding. You can download without signatures and sign manually.
          </div>
        </div>
      </div>

      {/* Export options */}
      <div className="mb-1">
        <div className="text-[10px] text-white/25 uppercase tracking-widest mb-2">Export options</div>
        <div className="space-y-2">
          <button
            onClick={() => { onDownload("pdf"); setDownloaded(true) }}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors"
          >
            {downloaded ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {downloaded ? "Preparing PDF..." : "Download PDF"}
          </button>
          <button
            onClick={() => onDownload("docx")}
            className="w-full py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:border-white/15 flex items-center justify-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" /> Download DOCX
          </button>
          <button
            onClick={() => onDownload("text")}
            className="w-full py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/70 hover:border-white/15 flex items-center justify-center gap-2 transition-colors"
          >
            Copy plain text
          </button>
        </div>
      </div>

      {/* E-signature — Coming soon / disabled */}
      <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] opacity-50 cursor-not-allowed">
        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
          <LockIcon className="w-4 h-4 text-white/30" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-white/40">E-signature workflow</div>
            <span className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">Coming soon</span>
          </div>
          <div className="text-xs text-white/25">Send for signature via Dropbox Sign</div>
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="flex items-start gap-2 p-3 mt-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
        <Info className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
        <p className="text-xs text-white/25 leading-relaxed">
          PlainPath provides document drafting support. Review before use. Not legal advice. Consider professional review before execution.
        </p>
      </div>

      <button
        onClick={onRestart}
        className="w-full mt-4 py-2.5 rounded-xl border border-white/[0.07] text-sm text-white/40 hover:text-white/60 hover:border-white/15 flex items-center justify-center gap-2 transition-colors"
      >
        Start a new document
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATING STATE (AI Suggestion-like)
// ─────────────────────────────────────────────────────────────────────────────

const GENERATING_PHASES = [
  "Structuring document sections...",
  "Drafting party and scope clauses...",
  "Writing payment and protection terms...",
  "Finalising governing law...",
  "Assembling your document...",
]

function GeneratingView({
  contractType,
  people,
  scope,
  money,
  protection,
}: {
  contractType: ContractType
  people: Partial<PeopleData>
  scope: Partial<ScopeData>
  money: Partial<MoneyData>
  protection: Partial<ProtectionData>
}) {
  const [phaseIdx, setPhaseIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setPhaseIdx(i => Math.min(i + 1, GENERATING_PHASES.length - 1)), 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left — paper with AI cursor */}
      <div className="w-[58%] border-r border-white/[0.05] bg-[#111115] flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b border-white/[0.05] flex items-center gap-2 shrink-0">
          <span className="text-xs text-white/30">Generating your document...</span>
          <span className="ml-auto text-xs text-violet-400/60 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 animate-pulse" /> PlainPath writing...
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
          <LiveDocumentPreview
            contractType={contractType}
            people={people}
            scope={scope}
            money={money}
            protection={protection}
            step={4}
            draft={null}
            aiActive
          />
        </div>
      </div>
      {/* Right — AI suggestion panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-5">
          <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">PlainPath suggests language for review</h3>
        <p className="text-xs text-white/35 mb-6 leading-relaxed">
          Drafting your {CONTRACT_TYPES.find(c => c.id === contractType)?.title ?? "document"} based on your answers. This usually takes 10–20 seconds.
        </p>
        <div className="w-full max-w-xs space-y-2 text-left mb-6">
          {GENERATING_PHASES.map((phase, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs">
              {i < phaseIdx
                ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                : i === phaseIdx
                  ? <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border border-white/[0.12] shrink-0" />
              }
              <span className={i <= phaseIdx ? "text-white/70" : "text-white/25"}>{phase}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/20 leading-relaxed max-w-xs">
          This is drafting support, not legal advice. Review before use. Consider professional review for high-stakes documents.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────────────────

function ErrorView({
  error,
  onRetry,
  onSave,
  onRestart,
}: {
  error: string
  onRetry: () => void
  onSave: () => void
  onRestart: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto w-full py-16">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Document could not be generated.</h2>
      <p className="text-sm text-white/40 mb-2 leading-relaxed">
        PlainPath ran into a problem. Your form data is saved and no progress was lost.
      </p>
      {error && (
        <p className="text-xs text-white/25 mb-8 font-mono bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 max-w-sm">
          {error}
        </p>
      )}

      <div className="flex gap-3 w-full max-w-sm mb-6">
        <button
          onClick={onRetry}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> Try again
        </button>
        <button
          onClick={onSave}
          className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:border-white/15 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save draft
        </button>
      </div>

      <div className="w-full max-w-sm border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] text-left">
          <span className="text-xs text-white/30 uppercase tracking-widest">Other options</span>
        </div>
        {[
          { icon: LayoutTemplate, label: "Use another template for this section", sub: "Pre-built clause options for this document type." },
          { icon: Sparkles,       label: "Ask PlainPath",                          sub: "Describe what you need and PlainPath will draft the language." },
          { icon: FileText,       label: "Export what's complete",                sub: "Download the document with completed sections." },
        ].map((a, i) => {
          const Icon = a.icon
          return (
            <button
              key={i}
              onClick={i === 0 ? onRestart : i === 2 ? onSave : undefined}
              className="w-full flex items-start gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] border-b border-white/[0.04] last:border-0 transition-colors"
            >
              <Icon className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-white/70">{a.label}</div>
                <div className="text-xs text-white/30 mt-0.5 leading-relaxed">{a.sub}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLIT-SCREEN WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────

function SplitWorkspace({
  contractType,
  people,
  scope,
  money,
  protection,
  step,
  onPeopleChange,
  onScopeChange,
  onMoneyChange,
  onProtectionChange,
  onBack,
  onNext,
  canSkip,
}: {
  contractType: ContractType
  people: Partial<PeopleData>
  scope: Partial<ScopeData>
  money: Partial<MoneyData>
  protection: Partial<ProtectionData>
  step: number
  onPeopleChange: (d: Partial<PeopleData>) => void
  onScopeChange: (d: Partial<ScopeData>) => void
  onMoneyChange: (d: Partial<MoneyData>) => void
  onProtectionChange: (d: Partial<ProtectionData>) => void
  onBack: () => void
  onNext: () => void
  canSkip: boolean
}) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("builder")

  const stepLabel = STEP_SECTIONS[step] ?? "Section"
  const backLabel = STEPS[step - 1] ?? "Back"
  const nextLabel = step < STEPS.length - 1
    ? (STEP_SECTIONS[step + 1] ?? STEPS[step + 1] ?? "Next")
    : "Review"

  const formContent = (() => {
    switch (step) {
      case 1: return <PeopleSection     contractType={contractType} people={people}         onChange={onPeopleChange} />
      case 2: return <ScopeSection      contractType={contractType} scope={scope}           onChange={onScopeChange} />
      case 3: return <MoneySection      contractType={contractType} money={money}           onChange={onMoneyChange} />
      case 4: return <ProtectionSection contractType={contractType} protection={protection} onChange={onProtectionChange} />
      default: return null
    }
  })()

  const preview = (
    <LiveDocumentPreview
      contractType={contractType}
      people={people}
      scope={scope}
      money={money}
      protection={protection}
      step={step}
      draft={null}
    />
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Desktop: Left panel — live paper preview ── */}
      <div className="hidden md:flex md:w-[58%] border-r border-white/[0.05] bg-[#111115] flex-col overflow-hidden">
        <div className="px-4 py-2 border-b border-white/[0.05] flex items-center gap-2 text-xs text-white/30 shrink-0">
          <span>Document preview</span>
          <span className="ml-auto text-violet-400/60">
            {stepLabel} — step {step} of {STEPS.length - 1}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
          {preview}
        </div>
      </div>

      {/* ── Desktop: Right panel — builder controls ── */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden">
        <StepProgress step={step} />
        <div className="flex-1 overflow-y-auto px-5 py-5">{formContent}</div>
        <div className="px-5 py-4 border-t border-white/[0.05] flex items-center gap-2 shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl border border-white/[0.07] text-white/40 hover:text-white/60 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {backLabel}
          </button>
          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
          >
            {step >= STEPS.length - 2 ? "Review Summary" : `Next: ${nextLabel}`}
            <ChevronRight className="w-4 h-4" />
          </button>
          {canSkip && (
            <button
              onClick={onNext}
              className="flex items-center gap-1 text-xs px-3 py-2.5 rounded-xl border border-white/[0.07] text-white/25 hover:text-white/50 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile: Tab view ── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06] shrink-0">
          <button
            onClick={() => setMobileTab("builder")}
            className={`flex-1 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors ${
              mobileTab === "builder"
                ? "font-medium text-white border-b-2 border-violet-500"
                : "text-white/40"
            }`}
          >
            <PenLine className={`w-3.5 h-3.5 ${mobileTab === "builder" ? "text-violet-400" : ""}`} /> Builder
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors ${
              mobileTab === "preview"
                ? "font-medium text-white border-b-2 border-violet-500"
                : "text-white/40"
            }`}
          >
            <Eye className={`w-3.5 h-3.5 ${mobileTab === "preview" ? "text-violet-400" : ""}`} /> Preview
          </button>
        </div>

        {mobileTab === "builder" ? (
          <>
            <StepProgress step={step} />
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">{formContent}</div>
            <div className="fixed bottom-0 left-0 right-0 bg-[#0c0c0f] border-t border-white/[0.06] px-4 py-3 flex items-center gap-2 z-10">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl border border-white/[0.07] text-white/40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={onNext}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-xl bg-violet-600 text-white font-medium"
              >
                {step >= STEPS.length - 2 ? "Review" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
              {canSkip && (
                <button onClick={onNext} className="flex items-center text-xs px-3 py-2.5 rounded-xl border border-white/[0.07] text-white/25">
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setMobileTab("builder")}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600/[0.06] border-b border-violet-500/10 hover:bg-violet-600/[0.10] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-violet-300">Return to Builder to edit</span>
            </button>
            <div className="flex-1 overflow-y-auto px-3 py-4 bg-[#111115]">
              <div className="text-[10px] text-white/25 text-center mb-3 font-sans">
                Live preview — updates as you fill the Builder
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-[360px]">
                  {preview}
                </div>
              </div>
              <div className="flex items-start gap-1.5 mt-3 px-1">
                <Info className="w-3 h-3 text-white/20 mt-0.5 shrink-0" />
                <p className="text-[10px] text-white/20 leading-relaxed">
                  Drafting support only. Review before use. Not legal advice.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW STEP — Right panel form for confirming before generation
// ─────────────────────────────────────────────────────────────────────────────

function ReviewFormPanel({
  contractType,
  people,
  onGenerate,
  generating,
}: {
  contractType: ContractType
  people: Partial<PeopleData>
  onGenerate: () => void
  generating: boolean
}) {
  const clientName = people.clientName?.trim() || people.clientEntityName?.trim() || null
  const freelancerName = people.freelancerName?.trim() || people.freelancerEntityName?.trim() || null
  const canGenerate = !!(clientName && freelancerName)

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <h3 className="text-sm font-semibold text-white mb-0.5">Step 6 — Review & Generate</h3>
      <p className="text-xs text-white/35 mb-5 leading-relaxed">
        Check your answers below. PlainPath will draft your document based on the information you provided.
      </p>

      {!canGenerate && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-500/[0.05] border border-red-500/15 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-medium text-red-300 mb-0.5">Required fields missing</div>
            <div className="text-[11px] text-red-300/50">Both party names are required before generating. Return to Step 2 — Parties.</div>
          </div>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {[
          { label: "Document type",  value: CONTRACT_TYPES.find(c => c.id === contractType)?.title ?? "—" },
          { label: "Party A (Client)",      value: clientName ?? "⚠ Missing", warn: !clientName },
          { label: "Party B (Freelancer)",  value: freelancerName ?? "⚠ Missing", warn: !freelancerName },
          { label: "Governing law",  value: people.governingLaw ?? "Not specified" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
            <span className="text-xs text-white/35 w-36 shrink-0 mt-0.5">{item.label}</span>
            <span className={`text-xs font-medium ${(item as any).warn ? "text-red-400" : "text-white/75"}`}>{item.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={!canGenerate || generating}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-3"
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Drafting...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate document</>
        )}
      </button>

      <div className="flex items-start gap-2 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
        <Info className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
        <p className="text-xs text-white/25 leading-relaxed">
          PlainPath provides document drafting support. Review before use. Not legal advice. Consider professional review before execution.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PEOPLE: Partial<PeopleData> = { clientType: "individual", freelancerType: "individual", partyAType: "individual", partyBType: "individual" }
const DEFAULT_MONEY: Partial<MoneyData> = { paymentStructure: "flat", depositRequired: false, lateFee: false, milestones: [] }
const DEFAULT_PROTECTION: Partial<ProtectionData> = { ipTiming: "on-payment", portfolioUsage: true, confidentiality: false, killFee: false, fileReleaseOnPayment: true, disputeResolution: "negotiation", subcontractingAllowed: false }

function deriveFilename(ct: ContractType | null, people: Partial<PeopleData>): string {
  if (!ct) return "NewDocument.draft"
  const clientSlug = (people.clientName ?? people.clientEntityName ?? "Client").split(" ").slice(0, 1).join("")
  const freelancerSlug = (people.freelancerName ?? people.freelancerEntityName ?? "Freelancer").split(" ").slice(0, 1).join("")
  const typeSlug = ct === "freelance" ? "ServiceAgreement" : ct === "nda" ? "NDA" : ct === "lease" ? "Lease" : ct === "service-agreement" ? "ServiceAgreement" : ct === "payment-agreement" ? "PaymentAgreement" : "Agreement"
  if (clientSlug === "Client" && freelancerSlug === "Freelancer") return `NewDocument-${typeSlug}.draft`
  return `${clientSlug}-${freelancerSlug}-${typeSlug}.draft`
}

export default function ContractBuilder() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const { entitlements } = useEntitlements()
  const [upgradeModal, setUpgradeModal] = useState(false)

  // Core state
  const [contractType, setContractType] = useState<ContractType | null>(null)
  const [step, setStep] = useState(0)
  const [people, setPeople] = useState<Partial<PeopleData>>(DEFAULT_PEOPLE)
  const [scope, setScope] = useState<Partial<ScopeData>>({})
  const [money, setMoney] = useState<Partial<MoneyData>>(DEFAULT_MONEY)
  const [protection, setProtection] = useState<Partial<ProtectionData>>(DEFAULT_PROTECTION)
  const [draft, setDraft] = useState<DraftPayload | null>(null)
  const [generating, setGenerating] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [unsaved, setUnsaved] = useState(false)

  // Mark unsaved on any field change
  const markUnsaved = useCallback(() => setUnsaved(true), [])
  const setPeopleTracked = useCallback((d: Partial<PeopleData>) => { setPeople(d); markUnsaved() }, [markUnsaved])
  const setScopeTracked = useCallback((d: Partial<ScopeData>) => { setScope(d); markUnsaved() }, [markUnsaved])
  const setMoneyTracked = useCallback((d: Partial<MoneyData>) => { setMoney(d); markUnsaved() }, [markUnsaved])
  const setProtectionTracked = useCallback((d: Partial<ProtectionData>) => { setProtection(d); markUnsaved() }, [markUnsaved])

  const filename = useMemo(() => deriveFilename(contractType, people), [contractType, people])

  // Restore saved draft on mount
  useEffect(() => {
    const raw = localStorage.getItem("plainpath-contract-draft-latest")
    if (!raw) return
    try {
      const saved = JSON.parse(raw)
      if (saved.contractType) {
        setContractType(saved.contractType)
        if (saved.people) setPeople(saved.people)
        if (saved.scope) setScope(saved.scope)
        if (saved.money) setMoney(saved.money)
        if (saved.protection) setProtection(saved.protection)
      }
    } catch { /* ignore */ }
  }, [])

  // Determine page state
  const pageState: PageState = useMemo(() => {
    if (!contractType || step === 0) return "empty"
    if (generating) return "generating"
    if (draftError) return "error"
    if (draft) return "review"
    return "workspace"
  }, [contractType, step, generating, draftError, draft])

  function saveDraft() {
    localStorage.setItem(
      "plainpath-contract-draft-latest",
      JSON.stringify({ contractType, people, scope, money, protection, savedAt: new Date().toISOString() })
    )
    setUnsaved(false)
    if (contractType) {
      saveRecentWork({ tool: "contract-builder", title: filename })
    }
    toast({ title: "Draft saved", description: "Your progress has been saved locally." })
  }

  async function generateDraft() {
    if (!contractType) return
    const clientName = people.clientName?.trim() || people.clientEntityName?.trim()
    const freelancerName = people.freelancerName?.trim() || people.freelancerEntityName?.trim()
    if (!clientName || !freelancerName) {
      toast({ title: "Missing party names", description: "Both party names are required before generating.", variant: "destructive" })
      setStep(1)
      return
    }
    try {
      await beforeRunContractDraft(entitlements?.plan ?? null)
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
        body: JSON.stringify({
          contractType: API_CONTRACT_TYPE(contractType),
          people,
          scope,
          money,
          protection,
        }),
      })
      const data = await r.json()
      if (data.error) throw new Error(data.message ?? "Generation failed")
      setDraft(data.draft)
      saveRecentWork({ tool: "contract-builder", title: filename })
      localStorage.removeItem("plainpath-contract-draft-latest")
    } catch (e) {
      setDraftError((e as Error).message || "Draft generation failed. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload(format: "pdf" | "docx" | "text") {
    if (!draft) return
    const sections = draft.sections?.map((s, i) => `§${i + 1} — ${s.title}\n\n${s.clauses.join("\n\n")}`) ?? []
    const text = [
      (CONTRACT_TYPES.find(c => c.id === contractType)?.title ?? "Agreement").toUpperCase(),
      `${draft.parties?.partyA?.name} × ${draft.parties?.partyB?.name}`,
      "",
      ...sections,
      "",
      "---",
      "Document drafting support. Review before use. Not legal advice. Consider professional review before execution.",
    ].join("\n\n")

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename.replace(".draft", format === "pdf" ? ".txt" : format === "docx" ? ".txt" : ".txt")
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Downloaded", description: `${filename} exported as text. PDF/DOCX export coming soon.` })
  }

  function handleSelectType(ct: ContractType) {
    setContractType(ct)
    setStep(1)
    setDraft(null)
    setDraftError(null)
    setUnsaved(false)
  }

  function handleBack() {
    if (draft) { setDraft(null); return }
    if (draftError) { setDraftError(null); return }
    if (step <= 1) { setStep(0); setContractType(null); return }
    setStep(s => Math.max(s - 1, 0))
  }

  function handleNext() {
    if (step >= STEPS.length - 1) return
    const next = step + 1
    setStep(next)
    if (contractType) {
      localStorage.setItem(
        "plainpath-contract-draft-latest",
        JSON.stringify({ contractType, people, scope, money, protection, savedAt: new Date().toISOString() })
      )
    }
  }

  function handleRestart() {
    setStep(0); setContractType(null)
    setPeople(DEFAULT_PEOPLE); setScope({})
    setMoney(DEFAULT_MONEY); setProtection(DEFAULT_PROTECTION)
    setDraft(null); setDraftError(null); setUnsaved(false)
    localStorage.removeItem("plainpath-contract-draft-latest")
  }

  // Review step is last (step 5)
  const isReviewStep = step === STEPS.length - 1

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      <UpgradeModal open={upgradeModal} onClose={() => setUpgradeModal(false)} reason="contractDraft" />

      {/* Header — always visible once a type is selected */}
      {pageState !== "empty" && (
        <BuilderHeader
          filename={filename}
          unsaved={unsaved}
          onSave={saveDraft}
          onExport={() => draft ? handleDownload("pdf") : undefined}
          canExport={!!draft}
        />
      )}

      {/* Page content */}
      {pageState === "empty" && (
        <EmptyState onSelect={handleSelectType} />
      )}

      {pageState === "generating" && contractType && (
        <GeneratingView
          contractType={contractType}
          people={people}
          scope={scope}
          money={money}
          protection={protection}
        />
      )}

      {pageState === "error" && draftError && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ErrorView
            error={draftError}
            onRetry={generateDraft}
            onSave={saveDraft}
            onRestart={handleRestart}
          />
        </div>
      )}

      {pageState === "review" && draft && contractType && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left — final document */}
          <div className="w-[58%] border-r border-white/[0.05] bg-[#111115] flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-white/[0.05] flex items-center gap-2 shrink-0">
              <span className="text-xs text-white/30">Final document — {filename}</span>
              <span className="ml-auto text-xs text-green-400/70 flex items-center gap-1.5">
                <Check className="w-3 h-3" /> All sections complete
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
              <LiveDocumentPreview
                contractType={contractType}
                people={people}
                scope={scope}
                money={money}
                protection={protection}
                step={5}
                draft={draft}
              />
            </div>
          </div>
          {/* Right — export panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] shrink-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold">Ready to Download</span>
              </div>
              <p className="text-xs text-white/35">All sections complete. Review document then export.</p>
            </div>
            <ReviewExportPanel
              draft={draft}
              contractType={contractType}
              people={people}
              onDownload={handleDownload}
              onRestart={handleRestart}
            />
          </div>
        </div>
      )}

      {pageState === "workspace" && contractType && (
        isReviewStep ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Left — preview with all data */}
            <div className="hidden md:flex w-[58%] border-r border-white/[0.05] bg-[#111115] flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-white/[0.05] flex items-center gap-2 text-xs text-white/30 shrink-0">
                <span>Final review preview</span>
                <span className="ml-auto text-violet-400/60">Step 6 of 6</span>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
                <LiveDocumentPreview
                  contractType={contractType}
                  people={people}
                  scope={scope}
                  money={money}
                  protection={protection}
                  step={5}
                  draft={null}
                />
              </div>
            </div>
            {/* Right — review confirm + generate */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <StepProgress step={step} />
              <ReviewFormPanel
                contractType={contractType}
                people={people}
                onGenerate={generateDraft}
                generating={generating}
              />
              <div className="px-5 py-4 border-t border-white/[0.05] flex items-center gap-3 shrink-0">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl border border-white/[0.07] text-white/40 hover:text-white/60 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Protection
                </button>
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl border border-white/[0.07] text-white/30 hover:text-white/50 transition-colors"
                >
                  Start over
                </button>
              </div>
            </div>
          </div>
        ) : (
          <SplitWorkspace
            contractType={contractType}
            people={people}
            scope={scope}
            money={money}
            protection={protection}
            step={step}
            onPeopleChange={setPeopleTracked}
            onScopeChange={setScopeTracked}
            onMoneyChange={setMoneyTracked}
            onProtectionChange={setProtectionTracked}
            onBack={handleBack}
            onNext={handleNext}
            canSkip={step >= 2}
          />
        )
      )}
    </div>
  )
}
