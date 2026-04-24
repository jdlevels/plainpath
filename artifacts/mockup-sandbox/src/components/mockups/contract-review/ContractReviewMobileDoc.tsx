import {
  FileText, AlertTriangle, ChevronRight, Scale, Bookmark, X
} from "lucide-react";

const CLAUSES = [
  {
    id: "c1", tag: "§1–3", title: "Parties & Services",
    body: `ClearPoint Digital Services, LLC ("Vendor") agrees to provide Enterprise Software Development & Support Services to Redwood Software Group ("Client") as detailed in Exhibit A (Statement of Work) and Exhibit B (Pricing Schedule).`,
    risk: null,
  },
  {
    id: "c2", tag: "§4", title: "Term & Renewal",
    body: "Initial term: 12 months commencing May 1, 2025. Agreement auto-renews for successive 12-month terms unless written non-renewal notice is provided at least 90 days prior to term expiration.",
    risk: "high", riskNote: "90-day cancel notice",
  },
  {
    id: "c3", tag: "§5", title: "Payment & Fees",
    body: "Monthly fee: $14,400.00. Due net 30 from invoice. Late payments accrue interest at 1.5% per month. Vendor may suspend services after 2 consecutive missed payments.",
    risk: "caution", riskNote: "1.5%/month late fee",
    active: true,
    highlight: "Late payments accrue interest at the rate of 1.5% per month from the due date until paid.",
  },
  {
    id: "c4", tag: "§6", title: "Intellectual Property",
    body: "Custom deliverables assigned to Client on full payment. Vendor retains all pre-existing IP and improvements thereto, even if incorporated into deliverables.",
    risk: "caution", riskNote: "Vendor retains prior IP",
  },
  {
    id: "c5", tag: "§8", title: "Limitation of Liability",
    body: "Vendor's total liability capped at the monthly fee in the month preceding the claim ($14,400). Applies to all claims including breach, tort, and negligence.",
    risk: "high", riskNote: "$14,400 cap — low",
  },
  {
    id: "c6", tag: "§9", title: "Termination",
    body: "Either party may terminate for material breach on 30 days written notice. Breaching party has 30-day cure period before termination is effective.",
    risk: "caution", riskNote: "30-day cure period",
  },
  {
    id: "c7", tag: "§12", title: "Dispute Resolution",
    body: "All disputes resolved by binding AAA arbitration in Delaware. Jury trial rights and class actions are waived. Initiating party bears initial arbitration costs.",
    risk: "high", riskNote: "Binding arbitration only",
  },
  {
    id: "c8", tag: "§7", title: "Confidentiality",
    body: "Both parties maintain confidentiality of non-public information. Obligations survive termination for 3 years.",
    risk: null,
  },
];

export function ContractReviewMobileDoc() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-6 px-2 rounded-full border flex items-center gap-1 bg-red-600/12 border-red-500/22 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[9px] font-medium">3 high-risk</span>
          </div>
          <button className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
            <Bookmark className="w-3 h-3 text-white/28" />
          </button>
        </div>
      </div>

      {/* Tab bar — Document tab active */}
      <div className="h-10 border-b border-white/[0.06] flex items-end px-1 shrink-0">
        {["Review","Document"].map((tab,i) => (
          <button key={i} className={`flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-medium pb-0.5 border-b-2 transition-all ${i===1?"border-violet-500 text-violet-300":"border-transparent text-white/28"}`}>
            {i===0?<FileText className="w-3 h-3" />:<Scale className="w-3 h-3" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Evidence banner — source chip §5.4 active */}
      <div className="mx-3 mt-2 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-start gap-2.5">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-violet-200/80 text-[10px] font-medium leading-tight">
            Source: "…shall accrue interest at the rate of 1.5% per month…"
          </p>
          <p className="text-violet-300/38 text-[9px] mt-0.5">Jumped from risk finding — §5 Payment &amp; Fees · p.4</p>
        </div>
        <button className="text-white/20 hover:text-white/45 shrink-0 mt-0.5">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Document header */}
      <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-2.5 shrink-0 mt-1.5">
        <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/14 flex items-center justify-center shrink-0">
          <Scale className="w-3.5 h-3.5 text-red-400/65" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/72 text-xs font-semibold truncate">ClearPoint MSA v2</p>
          <p className="text-white/22 text-[10px]">8 pages · $14,400/mo · Enterprise Services</p>
        </div>
        <div className="flex items-center gap-0.5">
          {["Fit","100%"].map((z,i) => (
            <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i===0?"bg-white/[0.07] text-white/52":"text-white/20"}`}>{z}</button>
          ))}
        </div>
      </div>

      {/* Clauses */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {CLAUSES.map(clause => (
          <div
            key={clause.id}
            className={`rounded-xl border p-3 transition-all duration-300 ${
              (clause as any).active
                ? "border-violet-500/42 bg-violet-500/[0.06] ring-1 ring-violet-500/18 shadow-[0_0_16px_rgba(139,92,246,0.06)]"
                : clause.risk === "high"
                ? "border-red-500/16 bg-red-500/[0.02]"
                : clause.risk === "caution"
                ? "border-amber-500/12 bg-amber-500/[0.018]"
                : "border-white/[0.05] bg-white/[0.015]"
            }`}
          >
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`h-4 px-1 rounded text-[9px] font-mono font-medium ${(clause as any).active?"bg-violet-500/25 border border-violet-500/35 text-violet-200/80":"bg-violet-600/10 border border-violet-500/16 text-violet-300/55"}`}>
                {clause.tag}
              </span>
              <p className={`text-[10px] font-semibold flex-1 ${(clause as any).active?"text-violet-200/85":"text-white/48"}`}>{clause.title}</p>
              {clause.risk === "high" && !((clause as any).active) && (
                <div className="flex items-center gap-0.5 h-4 px-1.5 rounded-full bg-red-500/10 border border-red-500/16 shrink-0">
                  <AlertTriangle className="w-2 h-2 text-red-400/70" />
                  <span className="text-red-300/55 text-[8px] font-medium">{(clause as any).riskNote}</span>
                </div>
              )}
              {clause.risk === "caution" && !((clause as any).active) && (
                <div className="flex items-center gap-0.5 h-4 px-1.5 rounded-full bg-amber-500/10 border border-amber-500/14 shrink-0">
                  <AlertTriangle className="w-2 h-2 text-amber-400/60" />
                  <span className="text-amber-300/52 text-[8px]">{(clause as any).riskNote}</span>
                </div>
              )}
              {(clause as any).active && (
                <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/22 border border-violet-500/32 shrink-0">
                  <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-violet-200/70 text-[8px]">+ Source</span>
                </div>
              )}
            </div>

            {/* Clause text */}
            <p className={`text-[11px] leading-relaxed ${(clause as any).active?"text-white/55":clause.risk==="high"?"text-white/40":clause.risk==="caution"?"text-white/38":"text-white/30"}`}>
              {clause.body}
            </p>

            {/* Active highlight quote */}
            {(clause as any).active && (clause as any).highlight && (
              <div className="mt-2 rounded-lg border border-violet-500/22 bg-violet-500/[0.07] px-2.5 py-2">
                <p className="text-violet-200/60 text-[9px] leading-relaxed">"{(clause as any).highlight}"</p>
              </div>
            )}

            {/* Jump link */}
            {clause.risk && (
              <div className="mt-2 flex items-center gap-1 cursor-pointer">
                <ChevronRight className="w-2.5 h-2.5 text-violet-400/28 shrink-0" />
                <p className="text-violet-300/40 text-[9px]">See this in Review tab →</p>
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/[0.04] mt-1 mb-2">
          <p className="text-white/18 text-[9px] leading-relaxed">Risk flags highlighted per clause. Tap "See in Review" to view detailed analysis.</p>
        </div>
      </div>

      {/* Page nav */}
      <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
        <span className="text-white/18 text-xs">8 sections</span>
        <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(n=><button key={n} className={`w-5 h-5 rounded text-[9px] flex items-center justify-center ${n===3?"bg-violet-600 text-white":"text-white/20"}`}>{n}</button>)}<span className="text-white/14 text-[9px] px-1">…</span></div>
        <span className="text-white/14 text-[9px]">Jump</span>
      </div>
    </div>
  );
}
