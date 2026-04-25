import {
  FileText, CheckCircle2, Zap, ChevronRight,
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

export default function AnalyzeDocumentMobileDocument() {
  return (
    <div className="flex flex-col" style={{ background: BG, width: 390, height: 844, fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>
      {/* Top bar */}
      <div className="h-10 border-b flex items-center px-3 gap-2 shrink-0" style={{ borderColor: BORDER }}>
        <div className="flex items-center justify-center shrink-0 rounded bg-violet-600" style={{ width: 18, height: 18 }}>
          <FileText className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-white/80 text-[13px] font-semibold">PlainPath</span>
        <div className="ml-auto">
          <div className="h-5 px-2 rounded-full flex items-center gap-1" style={{ background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <CheckCircle2 className="w-2 h-2 text-emerald-400" />
            <span className="text-emerald-300 text-[9px] font-medium">Complete</span>
          </div>
        </div>
      </div>

      {/* Filename bar */}
      <div className="px-3 py-2 flex items-center gap-1.5 shrink-0" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <FileText className="w-3 h-3 text-white/22 shrink-0" />
        <span className="text-white/35 text-[10px] truncate">Commercial-Lease-15OakSt.pdf</span>
        <span className="text-white/18 text-[9px] ml-auto shrink-0">5 sections</span>
      </div>

      {/* Tab bar -- Document active */}
      <div className="flex shrink-0" style={{ borderBottom: `1px solid ${BORDER}`, background: PANEL }}>
        <div className="flex-1 flex flex-col items-center py-2.5 gap-0.5 opacity-40">
          <Zap className="w-3.5 h-3.5 text-white/35" />
          <span className="text-white/30 text-[10px]">Analysis</span>
        </div>
        <div className="flex-1 flex flex-col items-center py-2.5 gap-0.5" style={{ borderBottom: "2px solid rgba(139,92,246,0.8)" }}>
          <FileText className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-violet-300 text-[10px] font-semibold">Document</span>
        </div>
      </div>

      {/* Return banner */}
      <div className="px-3 py-2 flex items-center gap-2 shrink-0 cursor-pointer" style={{ background: "rgba(139,92,246,0.06)", borderBottom: "1px solid rgba(139,92,246,0.14)" }}>
        <ChevronRight className="w-3 h-3 text-violet-400 rotate-180" />
        <span className="text-violet-300 text-[10.5px] font-medium">Return to Analysis</span>
      </div>

      {/* Document sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {DOC_SECTIONS.map((sec) => (
          <div
            key={sec.id}
            className="rounded-xl p-3.5"
            style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)" }}
          >
            <p className="text-[9.5px] font-semibold text-white/28 uppercase tracking-widest mb-2">{sec.title}</p>
            <p className="text-white/50 text-[11px] leading-relaxed">{sec.text}</p>
          </div>
        ))}

        <p className="text-white/15 text-[10px] text-center leading-relaxed py-2">
          Source document extracted by PlainPath. Not legal advice.
        </p>
      </div>
    </div>
  )
}
