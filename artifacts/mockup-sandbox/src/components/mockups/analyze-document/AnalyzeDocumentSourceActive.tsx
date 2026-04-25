import {
  FileText, ChevronRight, CheckCircle2, Clock, AlertTriangle,
  Calendar, Circle, BookOpen, ListTodo, XCircle, Flag,
  Info, Zap, User,
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
    active: true,
  },
  {
    id: "s5", title: "§5 -- AUTO-RENEWAL & TERMINATION",
    text: "Unless Tenant provides written termination notice no fewer than 90 days prior to lease expiration, this Agreement shall automatically renew on a month-to-month basis at 110% of the final month's base rent. Either party may terminate a month-to-month tenancy with 60 days' written notice.",
  },
]

function PriorityBadge({ p }: { p: "urgent" | "important" }) {
  return (
    <span className={`inline-flex items-center h-[17px] px-2 rounded-full border text-[9px] font-semibold uppercase tracking-wide ${p === "urgent" ? "bg-red-500/12 border-red-500/22 text-red-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"}`}>
      {p}
    </span>
  )
}

function SourceChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center h-[17px] px-1.5 rounded text-[9px] font-mono font-medium ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/30"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse mr-1 shrink-0" />}
      {label}
    </span>
  )
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9.5px] uppercase tracking-[0.12em] font-semibold text-white/24 mb-2.5">{children}</p>
}

export default function AnalyzeDocumentSourceActive() {
  return (
    <div className="flex flex-col" style={{ background: BG, width: 1280, height: 900, fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>
      {/* Top bar */}
      <div className="h-11 border-b flex items-center px-4 gap-2.5 shrink-0" style={{ borderColor: BORDER }}>
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <div className="w-px h-3.5 bg-white/10" />
        <span className="text-white/35 text-xs">Analyze a Document</span>
        <ChevronRight className="w-3 h-3 text-white/15" />
        <span className="text-white/30 text-xs">Commercial-Lease-15OakSt.pdf</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-300 text-[10px] font-medium">Analysis complete</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT -- Document Viewer with active section highlighted */}
        <div className="flex flex-col border-r" style={{ width: "57%", borderColor: BORDER }}>
          <div className="h-9 border-b flex items-center px-4 gap-2 shrink-0" style={{ borderColor: BORDER, background: PANEL }}>
            <FileText className="w-3.5 h-3.5 text-white/22" />
            <span className="text-white/30 text-[11px] font-medium">Commercial Lease Agreement -- 15 Oak Street</span>
          </div>

          {/* Evidence banner */}
          <div className="px-4 py-2.5 flex items-start gap-2.5 shrink-0" style={{ background: "rgba(139,92,246,0.08)", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
            <div className="w-1 h-full rounded-full shrink-0 self-stretch" style={{ background: "rgba(139,92,246,0.6)", minHeight: 14, width: 3 }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-violet-300 text-[10px] font-semibold uppercase tracking-widest">Source for</span>
                <span className="text-white/70 text-[11px] font-semibold">Step 2 -- Obtain and submit proof of insurance</span>
                <SourceChip label="§4 · p.3" active />
              </div>
              <p className="text-violet-200/60 text-[10.5px] leading-relaxed">
                "Tenant shall maintain… commercial general liability insurance… Evidence of insurance shall be provided within 10 days of commencement. Failure to maintain required coverage constitutes a material breach."
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {DOC_SECTIONS.map((sec) => {
              const isActive = sec.active
              return (
                <div
                  key={sec.id}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    border: isActive ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.05)",
                    background: isActive ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.012)",
                    boxShadow: isActive ? "0 0 0 3px rgba(139,92,246,0.15), 0 4px 24px rgba(139,92,246,0.1)" : "none",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{sec.title}</p>
                    {isActive && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.2)", color: "rgba(196,181,253,0.9)" }}>
                        ● SOURCE
                      </span>
                    )}
                  </div>
                  <p className={`text-[12px] leading-relaxed ${isActive ? "text-white/72" : "text-white/50"}`}>
                    {isActive ? (
                      <>
                        Tenant shall maintain, at its sole expense, commercial general liability insurance with limits no less than <span className="text-violet-200 font-medium bg-violet-500/15 px-0.5 rounded">$1,000,000 per occurrence and $2,000,000 in aggregate.</span> Landlord shall be named as an additional insured. <span className="text-violet-200 font-medium bg-violet-500/15 px-0.5 rounded">Evidence of insurance shall be provided within 10 days of commencement.</span> <span className="text-violet-200 font-medium bg-violet-500/15 px-0.5 rounded">Failure to maintain required coverage constitutes a material breach.</span>
                      </>
                    ) : sec.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT -- Intelligence Panel -- active step card prominent */}
        <div className="flex flex-col" style={{ width: "43%", background: PANEL }}>
          <div className="h-9 border-b flex items-center px-4 gap-2 shrink-0" style={{ borderColor: BORDER }}>
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-white/55 text-[11px] font-semibold">Document Action Plan</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

            {/* A -- Summary (condensed) */}
            <div>
              <SLabel>Plain-English Summary</SLabel>
              <div className="rounded-xl px-3.5 py-2.5 text-[11.5px] text-white/45 leading-relaxed" style={{ background: "rgba(255,255,255,0.018)", border: `1px solid ${BORDER}` }}>
                3-year commercial lease, 15 Oak St. Security deposit $8,400 and insurance certificate required before move-in June 1. Auto-renewal at 110% if 90-day notice missed.
              </div>
            </div>

            {/* B -- Snapshot */}
            <div>
              <SLabel>Action Plan Snapshot</SLabel>
              <div className="rounded-xl px-3.5 py-2.5 flex flex-wrap gap-2" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.14)" }}>
                {[
                  { val: "5", label: "actions", color: "text-violet-300" },
                  { val: "2", label: "urgent", color: "text-red-300" },
                  { val: "3", label: "missing", color: "text-amber-300" },
                  { val: "4", label: "deadlines", color: "text-sky-300" },
                ].map((s, i) => (
                  <div key={i} className="flex items-baseline gap-1">
                    <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
                    <span className="text-white/30 text-[10.5px]">{s.label}</span>
                    {i < 3 && <span className="text-white/15 ml-1">·</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* C -- Actions -- Step 2 active */}
            <div>
              <SLabel>Step-by-Step Required Actions</SLabel>
              <div className="flex flex-col gap-2">
                {/* Step 1 -- dimmed */}
                <div className="rounded-xl p-3 opacity-40" style={{ background: "rgba(255,255,255,0.018)", border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      <span className="text-violet-300 text-[9px] font-bold">1</span>
                    </div>
                    <Circle className="w-3 h-3 text-white/18" />
                    <span className="text-white/60 text-[11.5px] font-medium">Pay security deposit</span>
                    <PriorityBadge p="urgent" />
                  </div>
                </div>

                {/* Step 2 -- ACTIVE */}
                <div className="rounded-xl p-3.5" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.35)", boxShadow: "0 0 0 2px rgba(139,92,246,0.12), 0 4px 20px rgba(139,92,246,0.1)" }}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.45)" }}>
                      <span className="text-violet-200 text-[10px] font-bold">2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Circle className="w-3.5 h-3.5 text-white/18" />
                        <span className="text-white/88 text-[12px] font-semibold">Obtain and submit proof of insurance</span>
                        <PriorityBadge p="urgent" />
                      </div>
                      <p className="text-white/55 text-[11px] leading-relaxed mb-2">Arrange commercial general liability coverage (≥ $1M per occurrence, $2M aggregate), name Lakewood Holdings LLC as additional insured, and submit the certificate within 10 days of June 1.</p>
                      <div className="rounded-lg px-2.5 py-1.5 mb-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-white/32 text-[10px] leading-relaxed"><span className="text-white/22 uppercase tracking-widest text-[9px] font-semibold mr-1">Why it matters</span>Failure to maintain required coverage is a material breach -- Landlord can terminate the lease.</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-white/22" />
                          <span className="text-white/28 text-[10px]">Tenant</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-white/22" />
                          <span className="text-white/28 text-[10px]">June 11, 2025</span>
                        </div>
                        <SourceChip label="§4 · p.3" active />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps 3-5 -- dimmed */}
                {[
                  { n: 3, label: "Set rent payment reminder", p: "important" as const },
                  { n: 4, label: "Schedule pre-move-in walk-through", p: "important" as const },
                  { n: 5, label: "Note the 90-day renewal notice window", p: "important" as const },
                ].map((s) => (
                  <div key={s.n} className="rounded-xl p-3 opacity-35" style={{ background: "rgba(255,255,255,0.018)", border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.18)" }}>
                        <span className="text-violet-300 text-[9px] font-bold">{s.n}</span>
                      </div>
                      <Circle className="w-3 h-3 text-white/18" />
                      <span className="text-white/55 text-[11.5px] font-medium">{s.label}</span>
                      <PriorityBadge p={s.p} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D -- Missing (collapsed summary) */}
            <div>
              <SLabel>Missing Items / Information Needed</SLabel>
              <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.14)" }}>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p className="text-amber-200/60 text-[11px]">3 items may need attention -- Exhibit A missing, Tenant address missing, personal guarantee status unclear.</p>
              </div>
            </div>

            {/* E -- Deadlines (condensed) */}
            <div>
              <SLabel>Deadlines &amp; Time-Sensitive Items</SLabel>
              <div className="flex flex-col gap-1.5">
                {[
                  { date: "At signing", label: "Security deposit due", u: true },
                  { date: "June 11, 2025", label: "Proof of insurance due", u: true },
                  { date: "March 3, 2028", label: "Renewal/termination notice", u: false },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.018)", border: `1px solid ${BORDER}` }}>
                    <Calendar className={`w-3 h-3 shrink-0 ${d.u ? "text-red-400" : "text-amber-400"}`} />
                    <span className={`text-[10px] font-semibold ${d.u ? "text-red-300" : "text-amber-300"}`}>{d.date}</span>
                    <span className="text-white/35 text-[10.5px]">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
