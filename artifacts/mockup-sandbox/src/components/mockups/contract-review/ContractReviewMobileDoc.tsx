import {
  FileText, AlertTriangle, ChevronRight, Scale, Bookmark
} from "lucide-react";

const CLAUSES = [
  {
    id: "c1", tag: "§1–3", title: "Parties & Services",
    body: `ClearPoint Digital Services, LLC ("Vendor") agrees to provide Enterprise Software Development & Support Services to Redwood Software Group ("Client") as detailed in Exhibit A (Statement of Work) and Exhibit B (Pricing Schedule).`,
    risk: null,
  },
  {
    id: "c2", tag: "§4", title: "Term & Renewal",
    body: "The Agreement commences May 1, 2025 for an initial term of twelve (12) months and shall automatically renew for successive twelve (12) month periods unless either party provides written notice of non-renewal no less than ninety (90) days prior to expiration.",
    risk: "high",
    riskNote: "90-day cancel notice",
  },
  {
    id: "c3", tag: "§5", title: "Payment & Fees",
    body: "Monthly service fee: $14,400.00. Due within thirty (30) days of invoice. Late payments accrue interest at 1.5% per month. Vendor may suspend services after two consecutive missed payments.",
    risk: "medium",
    riskNote: "1.5%/month late fee",
  },
  {
    id: "c4", tag: "§6", title: "Intellectual Property",
    body: "All work product created specifically for Client shall be assigned to Client upon full payment. Vendor retains all right, title, and interest in pre-existing IP and any improvements thereto, even if incorporated into deliverables.",
    risk: "medium",
    riskNote: "Vendor retains prior IP",
  },
  {
    id: "c5", tag: "§8", title: "Limitation of Liability",
    body: "IN NO EVENT SHALL VENDOR'S TOTAL CUMULATIVE LIABILITY EXCEED THE MONTHLY FEES PAID OR PAYABLE IN THE MONTH IMMEDIATELY PRECEDING THE CLAIM ($14,400). THIS LIMITATION APPLIES TO ALL CLAIMS INCLUDING BREACH OF CONTRACT, TORT, AND NEGLIGENCE.",
    risk: "high",
    riskNote: "$14,400 cap — unusually low",
  },
  {
    id: "c6", tag: "§9", title: "Termination",
    body: "Either party may terminate for material breach upon thirty (30) days written notice to cure. In the absence of a cure within the notice period, the non-breaching party may terminate this Agreement immediately.",
    risk: "medium",
    riskNote: "30-day cure period required",
  },
  {
    id: "c7", tag: "§12", title: "Dispute Resolution",
    body: "All disputes shall be resolved by binding arbitration under the AAA Commercial Rules in Delaware. Each party waives its right to a jury trial and to participate in a class action. Arbitration costs shall be borne by the initiating party.",
    risk: "high",
    riskNote: "Binding arbitration only",
  },
  {
    id: "c8", tag: "§7", title: "Confidentiality",
    body: "Each party agrees to keep confidential the non-public information of the other party. Confidentiality obligations survive termination for three (3) years. No exceptions for information already publicly known.",
    risk: null,
  },
];

export function ContractReviewMobileDoc() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Mobile top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-6 px-2 rounded-full border flex items-center gap-1 bg-red-600/12 border-red-500/28 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[9px] font-medium">3 critical</span>
          </div>
          <button className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
            <Bookmark className="w-3 h-3 text-white/30" />
          </button>
        </div>
      </div>

      {/* Tab bar — Document tab active */}
      <div className="h-10 border-b border-white/[0.06] flex items-end px-1 shrink-0">
        {["Review", "Document"].map((tab, i) => (
          <button key={i} className={`flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-medium pb-0.5 border-b-2 transition-all ${i===1 ? "border-violet-500 text-violet-300" : "border-transparent text-white/28"}`}>
            {i===0 ? <FileText className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Document header */}
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/15 flex items-center justify-center shrink-0">
          <Scale className="w-3.5 h-3.5 text-red-400/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/75 text-xs font-semibold truncate">ClearPoint MSA v2</p>
          <p className="text-white/25 text-[10px]">8 pages · Enterprise Software Services · $14,400/mo</p>
        </div>
        <div className="flex items-center gap-0.5">
          {["Fit","100%"].map((z, i) => (
            <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i===0 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{z}</button>
          ))}
        </div>
      </div>

      {/* Document viewer */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {CLAUSES.map(clause => (
          <div
            key={clause.id}
            className={`rounded-xl border p-3 transition-all ${
              clause.risk === "high"
                ? "border-red-500/18 bg-red-500/[0.025]"
                : clause.risk === "medium"
                ? "border-amber-500/14 bg-amber-500/[0.02]"
                : "border-white/[0.05] bg-white/[0.015]"
            }`}
          >
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="h-4 px-1 rounded text-[9px] font-mono font-medium bg-violet-600/10 border border-violet-500/18 text-violet-300/60">{clause.tag}</span>
              <p className="text-white/50 text-[10px] font-semibold flex-1">{clause.title}</p>
              {clause.risk === "high" && (
                <div className="flex items-center gap-0.5 h-4 px-1.5 rounded-full bg-red-500/10 border border-red-500/18">
                  <AlertTriangle className="w-2 h-2 text-red-400/75" />
                  <span className="text-red-300/60 text-[8px] font-medium">{clause.riskNote}</span>
                </div>
              )}
              {clause.risk === "medium" && (
                <div className="flex items-center gap-0.5 h-4 px-1.5 rounded-full bg-amber-500/10 border border-amber-500/18">
                  <AlertTriangle className="w-2 h-2 text-amber-400/65" />
                  <span className="text-amber-300/55 text-[8px]">{clause.riskNote}</span>
                </div>
              )}
            </div>

            {/* Clause text */}
            <p className={`text-[11px] leading-relaxed ${clause.risk === "high" ? "text-white/45" : clause.risk === "medium" ? "text-white/42" : "text-white/32"}`}>
              {clause.body}
            </p>

            {/* Tap to see finding */}
            {clause.risk && (
              <div className="mt-2.5 flex items-center gap-1.5 cursor-pointer">
                <ChevronRight className="w-2.5 h-2.5 text-violet-400/30 shrink-0" />
                <p className="text-violet-300/45 text-[9px]">See this in Review tab →</p>
              </div>
            )}
          </div>
        ))}

        {/* Disclaimer */}
        <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/[0.05] mb-2">
          <p className="text-white/20 text-[9px] leading-relaxed">Risk flags highlighted in document view. Tap "See in Review" to view detailed analysis for any clause.</p>
        </div>
      </div>

      {/* Page nav */}
      <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
        <span className="text-white/20 text-xs">8 sections · 8 pages</span>
        <div className="flex items-center gap-1">{[1,2,3,4,5].map(n=><button key={n} className={`w-5 h-5 rounded text-[9px] flex items-center justify-center ${n===1?"bg-violet-600 text-white":"text-white/22"}`}>{n}</button>)}<span className="text-white/15 text-[9px] px-1">…</span></div>
        <span className="text-white/15 text-[9px]">Jump</span>
      </div>
    </div>
  );
}
