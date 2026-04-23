import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ListChecks, Calendar, Users, DollarSign, Gavel,
  AlertTriangle, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DemoShell } from "@/demo/DemoShell"

const DEMO = {
  fileName: "Residential_Lease_Unit4B.pdf",
  fileSizeBytes: 186400,
  fileType: "pdf",
  results: {
    documentType: "Residential Lease Agreement",
    extractionConfidence: "high" as const,
    keyDates: {
      effectiveDate: "June 1, 2025",
      executionDate: "May 15, 2025",
      expirationDate: "May 31, 2026",
      renewalDate: null,
      noticeDeadline: "March 31, 2026",
      noticePeriod: "60 days before expiration",
    },
    parties: [
      { name: "Park Avenue Properties LLC", role: "Landlord", type: "company" as const, isSigner: true },
      { name: "Jordan M. Brooks", role: "Tenant", type: "individual" as const, isSigner: true },
      { name: "Riley T. Brooks", role: "Co-Tenant", type: "individual" as const, isSigner: true },
    ],
    financialTerms: {
      paymentAmount: "$2,400 / month",
      paymentSchedule: "Due on the 1st of each month; 5-day grace period",
      lateFees: "$75 flat fee after grace period; $10/day thereafter",
      refundLanguage: "Security deposit ($2,400) returned within 21 days of move-out",
      otherTerms: [
        "Last month's rent ($2,400) collected at signing",
        "Pet deposit of $500 (non-refundable) for one approved dog",
        "Tenant responsible for all utilities except water",
      ],
    },
    legalClauses: {
      governingLaw: {
        present: true,
        summary: "Governed by the laws of the State of Texas. Any disputes shall be resolved in Travis County courts.",
        snippet: "This Agreement shall be construed in accordance with the laws of the State of Texas…",
      },
      terminationClause: {
        present: true,
        summary: "Landlord may terminate with 30-day written notice for material breach. Tenant may terminate with 60-day written notice.",
        snippet: "Either party may terminate this Agreement upon written notice as specified herein…",
      },
      autoRenewal: {
        present: true,
        summary: "Lease converts to month-to-month at market rate if neither party provides 60-day written notice of intent not to renew before March 31, 2026.",
        snippet: "If Tenant fails to provide notice of non-renewal no later than sixty (60) days prior to the Expiration Date…",
      },
      liabilityCap: {
        present: false,
        summary: null,
        snippet: null,
      },
      indemnity: {
        present: true,
        summary: "Tenant indemnifies Landlord against claims arising from Tenant's use of the premises, negligence, or violation of this Agreement.",
        snippet: "Tenant shall indemnify, defend, and hold harmless Landlord from and against any claims…",
      },
      confidentiality: {
        present: false,
        summary: null,
        snippet: null,
      },
      assignment: {
        present: true,
        summary: "Subletting and assignment are prohibited without prior written consent of Landlord. Consent may not be unreasonably withheld.",
        snippet: "Tenant shall not assign this Agreement or sublet any portion of the Premises without…",
      },
      disputeResolution: {
        present: true,
        summary: "Disputes shall first be submitted to mediation. If unresolved within 30 days, either party may file in Travis County District Court.",
        snippet: "In the event of any dispute or claim arising out of this Agreement, the parties agree to first attempt mediation…",
      },
    },
    obligations: [
      {
        party: "Tenant",
        obligation: "Provide 60 days written notice of intent not to renew before March 31, 2026, to avoid automatic month-to-month conversion at market rate.",
        deadline: "March 31, 2026",
        consequence: "Lease auto-converts to month-to-month — rent may increase to market rate without cap.",
      },
      {
        party: "Tenant",
        obligation: "Pay $2,400 rent on or before the 1st of each month. Payment after the 5-day grace period incurs a $75 flat fee plus $10/day.",
        deadline: "1st of each month",
        consequence: "$75 flat + $10/day late fee; repeated late payments are grounds for termination.",
      },
      {
        party: "Tenant",
        obligation: "Obtain and maintain renter's insurance with minimum $100,000 liability coverage. Provide proof to Landlord within 30 days of move-in.",
        deadline: "July 1, 2025",
        consequence: "Breach of lease terms; Landlord may terminate with 30-day notice.",
      },
      {
        party: "Tenant",
        obligation: "Keep the premises in clean and sanitary condition; report maintenance issues within 48 hours of discovery.",
        deadline: "Ongoing",
        consequence: "Tenant may be liable for damage resulting from delayed reporting.",
      },
      {
        party: "Landlord",
        obligation: "Return security deposit of $2,400 with itemized deductions within 21 days of Tenant's move-out date.",
        deadline: "21 days after move-out",
        consequence: "Failure to return deposit within 21 days forfeits Landlord's right to deductions under Texas law.",
      },
      {
        party: "Landlord",
        obligation: "Provide 24-hour advance notice before entering the premises except in emergencies.",
        deadline: "Ongoing",
        consequence: "Unlawful entry may expose Landlord to liability under Texas Property Code §92.0081.",
      },
    ],
    missingFields: ["Parking allocation", "HOA rules addendum reference"],
  },
}

const CLAUSE_LABELS: Record<string, string> = {
  governingLaw: "Governing Law",
  terminationClause: "Termination",
  autoRenewal: "Auto-Renewal",
  liabilityCap: "Liability Cap",
  indemnity: "Indemnification",
  confidentiality: "Confidentiality",
  assignment: "Assignment",
  disputeResolution: "Dispute Resolution",
}

function ClauseCard({ clauseKey, clause }: { clauseKey: string; clause: typeof DEMO.results.legalClauses.governingLaw }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      clause.present
        ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30"
        : "border-border/60 bg-muted/40"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {clause.present
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            : <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
          <span className={`text-xs font-medium leading-tight ${clause.present ? "text-foreground" : "text-muted-foreground/70"}`}>
            {CLAUSE_LABELS[clauseKey] ?? clauseKey}
          </span>
        </div>
        {clause.present && clause.summary && (
          <button onClick={() => setOpen(o => !o)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-auto">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && clause.summary && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{clause.summary}</p>
            {clause.snippet && (
              <p className="text-[11px] text-muted-foreground/60 mt-2 italic border-l-2 border-emerald-400/60 pl-2.5 leading-relaxed">
                "{clause.snippet}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionHeader({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-semibold text-foreground tracking-tight">{label}</h3>
    </div>
  )
}

function DateRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/40 last:border-0 gap-6">
      <span className="text-xs text-muted-foreground shrink-0 pt-px">{label}</span>
      <span className="text-xs font-medium text-foreground text-right leading-relaxed">{value}</span>
    </div>
  )
}

export default function DemoClauseExtractor() {
  const r = DEMO.results
  const clauses = Object.entries(r.legalClauses) as Array<[string, typeof r.legalClauses.governingLaw]>
  const presentCount = clauses.filter(([, c]) => c.present).length

  return (
    <DemoShell
      toolName="Clause Extractor"
      subtitle="Upload any contract and get a structured breakdown of key dates, parties, financial terms, legal clauses, and obligations — in under 30 seconds."
      scenarioLabel="Residential lease · Unit 4B, Austin TX · 6 obligations · 5 of 8 clauses present"
    >
      {/* Summary banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl border border-fuchsia-200 dark:border-fuchsia-800 bg-fuchsia-50/50 dark:bg-fuchsia-950/15"
      >
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
          <span className="text-sm font-semibold text-fuchsia-800 dark:text-fuchsia-200">Residential_Lease_Unit4B.pdf</span>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>5 key dates</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{presentCount}/8 clauses present</span>
          </div>
          <Badge className="text-[10px] bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 border-fuchsia-300">6 obligations</Badge>
          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300">high confidence</Badge>
        </div>
      </motion.div>

      <div className="space-y-5">
        {/* Key Dates */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-5 rounded-2xl border border-border/50">
            <SectionHeader icon={Calendar} label="Key Dates" color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" />
            <div className="divide-y divide-border/30">
              <DateRow label="Effective date" value={r.keyDates.effectiveDate} />
              <DateRow label="Execution date" value={r.keyDates.executionDate} />
              <DateRow label="Expiration date" value={r.keyDates.expirationDate} />
              <DateRow label="Notice deadline" value={r.keyDates.noticeDeadline} />
              <DateRow label="Notice period" value={r.keyDates.noticePeriod} />
            </div>
          </Card>
        </motion.div>

        {/* Parties */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
          <Card className="p-5 rounded-2xl border border-border/50">
            <SectionHeader icon={Users} label="Parties" color="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" />
            <div className="space-y-2">
              {r.parties.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-2.5">
                  <div>
                    <span className="text-xs font-medium text-foreground">{p.name}</span>
                    <span className="text-[11px] text-muted-foreground ml-2">· {p.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[10px] capitalize">{p.type}</Badge>
                    {p.isSigner && <Badge className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">Signer</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Financial Terms */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-5 rounded-2xl border border-border/50">
            <SectionHeader icon={DollarSign} label="Financial Terms" color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" />
            <div className="divide-y divide-border/30">
              <DateRow label="Monthly rent" value={r.financialTerms.paymentAmount} />
              <DateRow label="Payment schedule" value={r.financialTerms.paymentSchedule} />
              <DateRow label="Late fees" value={r.financialTerms.lateFees} />
              <DateRow label="Security deposit" value={r.financialTerms.refundLanguage} />
            </div>
            <ul className="mt-3 space-y-1.5 pt-1">
              {r.financialTerms.otherTerms.map((t, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 shrink-0">·</span>{t}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Legal Clauses */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
          <Card className="p-5 rounded-2xl border border-border/50">
            <div className="flex items-center gap-2.5 justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                  <Gavel className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Legal Clauses</h3>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">{presentCount} / {clauses.length} present</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clauses.map(([key, clause]) => (
                <ClauseCard key={key} clauseKey={key} clause={clause} />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Obligations */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-5 rounded-2xl border border-border/50">
            <SectionHeader icon={ListChecks} label={`Obligations (${r.obligations.length})`} color="bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-400" />
            <div className="space-y-3">
              {r.obligations.map((ob, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 + i * 0.04 }}
                  className="rounded-xl border border-border/50 bg-card p-4 flex gap-4"
                >
                  <div className="w-6 h-6 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{ob.obligation}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ob.party && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium">{ob.party}</span>
                      )}
                      {ob.deadline && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{ob.deadline}
                        </span>
                      )}
                    </div>
                    {ob.consequence && (
                      <p className="text-[11px] text-muted-foreground mt-2 flex items-start gap-1.5 leading-relaxed">
                        <AlertTriangle className="w-3 h-3 text-amber-500 mt-px shrink-0" />
                        {ob.consequence}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Missing / Not Found */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}>
          <Card className="p-5 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20">
            <SectionHeader icon={AlertTriangle} label="Missing / Not Found" color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-wrap gap-2">
              {r.missingFields.map((f, i) => (
                <Badge key={i} variant="outline" className="text-[11px] px-2.5 py-0.5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">{f}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </DemoShell>
  )
}
