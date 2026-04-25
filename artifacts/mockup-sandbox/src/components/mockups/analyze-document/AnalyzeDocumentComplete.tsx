import { useState } from "react"
import {
  FileText, ChevronRight, AlertTriangle, Calendar, CheckCircle2,
  Clock, ArrowRight, Circle, BookOpen, ListTodo, XCircle,
  Flag, Info, Zap, User,
} from "lucide-react"

const BG = "#0c0c0f"
const PANEL = "#111115"
const BORDER = "rgba(255,255,255,0.06)"

const DOC_SECTIONS = [
  {
    id: "s1", title: "§1 -- PARTIES & LEASE PREMISES",
    text: "This Commercial Lease Agreement ('Agreement') is entered into as of May 1, 2025, between Lakewood Holdings LLC ('Landlord'), a New Jersey limited liability company with principal offices at 88 Commerce Blvd, Newark, NJ, and Brightfield Goods Co. ('Tenant'), a Delaware corporation. Landlord agrees to lease to Tenant the premises described in Exhibit A attached hereto.",
  },
  {
    id: "s2", title: "§2 -- LEASE TERM",
    text: "The lease term shall commence on June 1, 2025 ('Commencement Date') and expire on May 31, 2028, unless sooner terminated pursuant to the terms hereof. Tenant shall have one option to renew for an additional 24-month period, exercisable by written notice no fewer than 90 days prior to expiration.",
  },
  {
    id: "s3", title: "§3 -- RENT & PAYMENT TERMS",
    text: "Tenant shall pay monthly base rent of $4,200, due on the first (1st) day of each calendar month. Rent not received within five (5) days of the due date shall incur a late fee equal to 5% of the monthly rent. Tenant shall pay a security deposit of $8,400 upon execution of this Agreement, to be held in trust.",
  },
  {
    id: "s4", title: "§4 -- INSURANCE REQUIREMENTS",
    text: "Tenant shall maintain, at its sole expense, commercial general liability insurance with limits no less than $1,000,000 per occurrence and $2,000,000 in aggregate. Landlord shall be named as an additional insured. Evidence of insurance shall be provided within 10 days of commencement. Failure to maintain required coverage constitutes a material breach.",
  },
  {
    id: "s5", title: "§5 -- AUTO-RENEWAL & TERMINATION",
    text: "Unless Tenant provides written termination notice no fewer than 90 days prior to lease expiration, this Agreement shall automatically renew on a month-to-month basis at 110% of the final month's base rent. Either party may terminate a month-to-month tenancy with 60 days' written notice.",
  },
]

const ACTIONS = [
  {
    step: 1,
    title: "Pay security deposit",
    instruction: "Remit $8,400 to Landlord upon signing. This is due at execution -- confirm wire instructions with Landlord before transferring.",
    why: "Failure to pay the deposit upon execution may void the agreement or delay your right to occupy the premises.",
    priority: "urgent" as const,
    status: "not-started" as const,
    party: "Tenant",
    deadline: "At signing",
    sourceId: "s3",
    sourceLabel: "§3 · p.2",
  },
  {
    step: 2,
    title: "Obtain and submit proof of insurance",
    instruction: "Arrange commercial general liability coverage (≥ $1M per occurrence, $2M aggregate), name Lakewood Holdings LLC as additional insured, and submit the certificate within 10 days of June 1.",
    why: "Failure to maintain required coverage is defined as a material breach -- Landlord can terminate the lease.",
    priority: "urgent" as const,
    status: "not-started" as const,
    party: "Tenant",
    deadline: "June 11, 2025",
    sourceId: "s4",
    sourceLabel: "§4 · p.3",
  },
  {
    step: 3,
    title: "Set rent payment reminder",
    instruction: "Set a recurring reminder to pay base rent of $4,200 on the 1st of each month. A 5% late fee applies after 5 days.",
    why: "Repeated late payments could constitute a lease violation.",
    priority: "important" as const,
    status: "not-started" as const,
    party: "Tenant",
    deadline: "1st of each month",
    sourceId: "s3",
    sourceLabel: "§3 · p.2",
  },
  {
    step: 4,
    title: "Schedule pre-move-in walk-through",
    instruction: "Coordinate with Landlord to document property condition before the June 1 commencement date to protect your security deposit.",
    why: "Pre-move-in documentation protects against disputed damage claims at lease end.",
    priority: "important" as const,
    status: "not-started" as const,
    party: "Tenant",
    deadline: "Before June 1, 2025",
    sourceId: "s1",
    sourceLabel: "§1 · p.1",
  },
  {
    step: 5,
    title: "Note the 90-day renewal notice window",
    instruction: "If you do not intend to renew, you must provide written notice by March 3, 2028 -- 90 days before expiration. Missing this triggers automatic month-to-month renewal at 110% of rent.",
    why: "Automatic renewal at 10% above market rate is a significant cost risk if the deadline is missed.",
    priority: "important" as const,
    status: "not-started" as const,
    party: "Tenant",
    deadline: "March 3, 2028",
    sourceId: "s5",
    sourceLabel: "§5 · p.4",
  },
]

const MISSING = [
  {
    title: "Exhibit A (floor plan) not attached",
    why: "The lease references the premises as \'described in Exhibit A\' but no exhibit is attached. Without it, the leased premises are not clearly defined.",
    resolve: "Request that Landlord provide and attach the signed Exhibit A before execution.",
    sourceId: "s1",
    sourceLabel: "§1 · p.1",
  },
  {
    title: "Tenant address not specified",
    why: "No registered address for Brightfield Goods Co. is included, which may affect notice delivery and legal validity.",
    resolve: "Add Tenant's full business address and registered agent to the Parties section.",
    sourceId: null,
    sourceLabel: null,
  },
  {
    title: "Personal guarantee not confirmed",
    why: "It is unclear whether a personal guarantee from any principal of Brightfield Goods Co. is required. Some landlords require this for entity tenants.",
    resolve: "Confirm with Landlord whether a personal guarantee addendum is required prior to signing.",
    sourceId: null,
    sourceLabel: null,
  },
]

const DEADLINES = [
  { date: "At signing", label: "Security deposit due", consequence: "Agreement may not be valid without receipt", priority: "urgent" as const, sourceLabel: "§3 · p.2" },
  { date: "June 1, 2025", label: "Lease commencement / move-in", consequence: "Right to occupy begins", priority: "important" as const, sourceLabel: "§2 · p.1" },
  { date: "June 11, 2025", label: "Proof of insurance due", consequence: "Material breach if not submitted", priority: "urgent" as const, sourceLabel: "§4 · p.3" },
  { date: "March 3, 2028", label: "Renewal/termination notice deadline", consequence: "Auto-renews at 110% rent if missed", priority: "important" as const, sourceLabel: "§5 · p.4" },
]

const RISKS = [
  { label: "Auto-renewal at 110% rent", detail: "Missing the 90-day notice window triggers month-to-month renewal at 110% of your final base rent. This is a significant cost escalation risk.", priority: "high" as const, sourceLabel: "§5 · p.4" },
  { label: "Insurance breach = immediate termination", detail: "Failure to maintain required coverage is explicitly defined as a material breach, giving Landlord grounds to terminate the lease.", priority: "high" as const, sourceLabel: "§4 · p.3" },
  { label: "Premises not precisely defined", detail: "Exhibit A is referenced but absent. The leased premises are technically undefined until it is attached and signed.", priority: "medium" as const, sourceLabel: "§1 · p.1" },
]

function PriorityBadge({ p }: { p: "urgent" | "important" | "optional" }) {
  const styles = {
    urgent: "bg-red-500/12 border-red-500/22 text-red-300",
    important: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    optional: "bg-white/[0.04] border-white/[0.08] text-white/35",
  }
  return (
    <span className={`inline-flex items-center h-[18px] px-2 rounded-full border text-[9px] font-semibold uppercase tracking-wide ${styles[p]}`}>
      {p}
    </span>
  )
}

function StatusDot({ s }: { s: "not-started" | "in-progress" | "complete" }) {
  if (s === "complete") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
  if (s === "in-progress") return <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
  return <Circle className="w-3.5 h-3.5 text-white/18 shrink-0" />
}

function SourceChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center h-[17px] px-1.5 rounded text-[9px] font-mono font-medium cursor-pointer transition-all ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/30"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse mr-1 shrink-0" />}
      {label}
    </span>
  )
}

function SLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <p className="text-[9.5px] uppercase tracking-[0.12em] font-semibold text-white/24 flex-1">{children}</p>
      {right}
    </div>
  )
}

export default function AnalyzeDocumentComplete() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <div className="flex flex-col" style={{ background: BG, width: 1280, height: 900, fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>
      {/* Top bar */}
      <div className="h-11 border-b flex items-center px-4 gap-2.5 shrink-0" style={{ borderColor: BORDER, background: "#0c0c0f" }}>
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <div className="w-px h-3.5 bg-white/10" />
        <span className="text-white/35 text-xs">Analyze a Document</span>
        <ChevronRight className="w-3 h-3 text-white/15" />
        <span className="text-white/30 text-xs truncate">Commercial-Lease-15OakSt.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-300 text-[10px] font-medium">Analysis complete</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg text-white/28 text-xs flex items-center gap-1.5" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <ArrowRight className="w-3 h-3 rotate-180" />
            Home
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT -- Document Viewer (57%) */}
        <div className="flex flex-col border-r" style={{ width: "57%", borderColor: BORDER }}>
          <div className="h-9 border-b flex items-center px-4 gap-2 shrink-0" style={{ borderColor: BORDER, background: PANEL }}>
            <FileText className="w-3.5 h-3.5 text-white/22" />
            <span className="text-white/30 text-[11px] font-medium">Commercial Lease Agreement -- 15 Oak Street Commercial District</span>
            <span className="ml-auto text-white/18 text-[10px]">5 sections</span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {DOC_SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id
              return (
                <div
                  key={sec.id}
                  id={`doc-sec-${sec.id}`}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    border: isActive ? "1px solid rgba(139,92,246,0.45)" : "1px solid rgba(255,255,255,0.05)",
                    background: isActive ? "rgba(139,92,246,0.06)" : "rgba(255,255,255,0.012)",
                    boxShadow: isActive ? "0 0 0 2px rgba(139,92,246,0.18)" : "none",
                  }}
                >
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">{sec.title}</p>
                  <p className="text-white/55 text-[12px] leading-relaxed">{sec.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT -- Intelligence Panel (43%) */}
        <div className="flex flex-col" style={{ width: "43%", background: PANEL }}>
          <div className="h-9 border-b flex items-center px-4 gap-2 shrink-0" style={{ borderColor: BORDER }}>
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-white/55 text-[11px] font-semibold">Document Action Plan</span>
            <span className="ml-auto text-white/18 text-[10px]">5 actions · 2 missing · 4 deadlines</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

            {/* A -- Plain-English Summary */}
            <div>
              <SLabel><span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />Plain-English Summary</span></SLabel>
              <div className="rounded-xl px-4 py-3.5 text-[12px] text-white/62 leading-relaxed" style={{ background: "rgba(255,255,255,0.024)", border: "1px solid rgba(255,255,255,0.06)" }}>
                This is a 3-year commercial lease for retail/office space at 15 Oak Street. You (Brightfield Goods Co.) are the Tenant. Before you move in on June 1, you must pay an $8,400 security deposit and submit proof of insurance -- both are hard requirements. Watch the auto-renewal clause: if you don't give 90 days' written notice before May 2028, the lease renews automatically at 10% above your current rent. Exhibit A is referenced but not attached -- the leased premises are not fully defined until it is included.
              </div>
            </div>

            {/* B -- Action Plan Snapshot */}
            <div>
              <SLabel><span className="flex items-center gap-1"><Zap className="w-3 h-3" />Action Plan Snapshot</span></SLabel>
              <div className="rounded-xl px-4 py-3 flex flex-wrap gap-2.5" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
                {[
                  { val: "5", label: "actions", color: "text-violet-300" },
                  { val: "2", label: "urgent", color: "text-red-300" },
                  { val: "3", label: "missing items", color: "text-amber-300" },
                  { val: "4", label: "deadlines", color: "text-sky-300" },
                  { val: "5", label: "source-backed", color: "text-emerald-300" },
                ].map((s, i) => (
                  <div key={i} className="flex items-baseline gap-1">
                    <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
                    <span className="text-white/35 text-[11px]">{s.label}</span>
                    {i < 4 && <span className="text-white/15 text-[11px] ml-1.5">·</span>}
                  </div>
                ))}
                <div className="w-full flex items-center gap-1.5 mt-1 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300 text-[11px] font-semibold">Needs completion</span>
                  <span className="text-white/25 text-[10px]">-- required items outstanding before signing</span>
                </div>
              </div>
            </div>

            {/* C -- Step-by-Step Required Actions */}
            <div>
              <SLabel right={<span className="text-[10px] text-white/22">5 steps</span>}>
                <span className="flex items-center gap-1"><ListTodo className="w-3 h-3" />Step-by-Step Required Actions</span>
              </SLabel>
              <div className="flex flex-col gap-2.5">
                {ACTIONS.map((a) => (
                  <div
                    key={a.step}
                    className="rounded-xl p-3.5 transition-all cursor-pointer"
                    onClick={() => setActiveSection(a.sourceId)}
                    style={{ background: "rgba(255,255,255,0.024)", border: `1px solid ${BORDER}` }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                        <span className="text-violet-300 text-[10px] font-bold">{a.step}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <StatusDot s={a.status} />
                          <span className="text-white/82 text-[12px] font-semibold">{a.title}</span>
                          <PriorityBadge p={a.priority} />
                        </div>
                        <p className="text-white/50 text-[11px] leading-relaxed mb-2">{a.instruction}</p>
                        <div className="rounded-lg px-2.5 py-1.5 mb-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <p className="text-white/30 text-[10px] leading-relaxed"><span className="text-white/22 uppercase tracking-widest text-[9px] font-semibold mr-1">Why it matters</span>{a.why}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {a.party && (
                            <div className="flex items-center gap-1">
                              <User className="w-2.5 h-2.5 text-white/22" />
                              <span className="text-white/28 text-[10px]">{a.party}</span>
                            </div>
                          )}
                          {a.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-white/22" />
                              <span className="text-white/28 text-[10px]">{a.deadline}</span>
                            </div>
                          )}
                          <SourceChip label={a.sourceLabel} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D -- Missing Items */}
            <div>
              <SLabel right={<span className="text-[10px] text-white/22">3 items</span>}>
                <span className="flex items-center gap-1"><XCircle className="w-3 h-3" />Missing Items / Information Needed</span>
              </SLabel>
              <div className="flex flex-col gap-2">
                {MISSING.map((m, i) => (
                  <div key={i} className="rounded-xl px-3.5 py-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.14)" }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/75 text-[11.5px] font-semibold mb-1">{m.title}</p>
                        <p className="text-white/38 text-[10.5px] leading-relaxed mb-1.5">{m.why}</p>
                        <div className="flex items-start gap-1.5">
                          <Info className="w-2.5 h-2.5 text-white/20 shrink-0 mt-0.5" />
                          <p className="text-white/28 text-[10px] leading-relaxed">{m.resolve}</p>
                        </div>
                        {m.sourceLabel && (
                          <div className="mt-1.5"><SourceChip label={m.sourceLabel} /></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* E -- Deadlines */}
            <div>
              <SLabel right={<span className="text-[10px] text-white/22">4 deadlines</span>}>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Deadlines &amp; Time-Sensitive Items</span>
              </SLabel>
              <div className="flex flex-col gap-2">
                {DEADLINES.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.024)", border: `1px solid ${BORDER}` }}>
                    <div className="flex flex-col items-center shrink-0 w-14">
                      <span className={`text-[10px] font-bold ${d.priority === "urgent" ? "text-red-300" : "text-amber-300"}`}>{d.priority === "urgent" ? "URGENT" : "NOTED"}</span>
                      <span className="text-white/22 text-[9px] text-center mt-0.5 leading-tight">{d.date}</span>
                    </div>
                    <div className="w-px h-8 shrink-0" style={{ background: BORDER }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-[11px] font-medium">{d.label}</p>
                      <p className="text-white/30 text-[10px] mt-0.5">{d.consequence}</p>
                    </div>
                    <SourceChip label={d.sourceLabel} />
                  </div>
                ))}
              </div>
            </div>

            {/* F -- Key Risks */}
            <div>
              <SLabel right={<span className="text-[10px] text-white/22">3 risks</span>}>
                <span className="flex items-center gap-1"><Flag className="w-3 h-3" />Key Risks / Watchouts</span>
              </SLabel>
              <div className="flex flex-col gap-2">
                {RISKS.map((r, i) => (
                  <div key={i} className="rounded-xl px-3.5 py-3" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400/70 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white/72 text-[11.5px] font-semibold">{r.label}</p>
                          <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${r.priority === "high" ? "text-red-300 bg-red-500/10" : "text-amber-300 bg-amber-500/10"}`}>{r.priority}</span>
                        </div>
                        <p className="text-white/38 text-[10.5px] leading-relaxed mb-1.5">{r.detail}</p>
                        <SourceChip label={r.sourceLabel} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* G -- Source Traceability */}
            <div>
              <SLabel><span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Source Traceability</span></SLabel>
              <div className="rounded-xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.016)", border: `1px solid ${BORDER}` }}>
                <p className="text-white/22 text-[10px] leading-relaxed mb-2.5">All findings above are sourced from the uploaded document. Click any source chip to jump to the referenced section.</p>
                <div className="flex flex-wrap gap-1.5">
                  {["§1 · p.1", "§2 · p.1", "§3 · p.2", "§4 · p.3", "§5 · p.4"].map((s) => (
                    <SourceChip key={s} label={s} />
                  ))}
                </div>
                <p className="text-white/15 text-[10px] mt-3 leading-relaxed">Based on the provided document. Verify all items before acting. Not legal advice.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
