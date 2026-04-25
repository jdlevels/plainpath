import { FileText, Shield, Scale, ListChecks, ArrowLeftRight, X } from "lucide-react"

const DARK = "bg-[#0d0d10]"

function ZoomBtns() {
  return (
    <div className="flex items-center gap-0.5">
      {["Fit", "75%", "100%"].map((z, i) => (
        <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i === 1 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{z}</button>
      ))}
    </div>
  )
}

function ToolRow({ icon: Icon, color, label, badge, badgeColor }: {
  icon: React.ElementType; color: string; label: string; badge: string; badgeColor: string
}) {
  return (
    <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 shrink-0 bg-white/[0.01]">
      <Icon className={`w-3 h-3 ${color} shrink-0`} />
      <span className="text-[10px] text-white/28 font-medium flex-1">{label}</span>
      <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${badgeColor}`}>{badge}</span>
    </div>
  )
}

function FileRow({ filename, count, color }: { filename: string; count: number; color: string }) {
  return (
    <div className="h-9 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
      <FileText className={`w-3.5 h-3.5 shrink-0 ${color}`} />
      <span className="text-white/45 text-xs flex-1 truncate">{filename}</span>
      <span className="text-white/18 text-xs shrink-0">{count} sections</span>
      <div className="w-px h-4 bg-white/[0.06] mx-1" />
      <ZoomBtns />
    </div>
  )
}

function SectionCard({ title, body, index, highlight = false }: { title: string; body: string; index: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${highlight
      ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20"
      : "border-white/[0.05] bg-white/[0.015]"}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-mono text-white/18">Section {index}</span>
        {highlight && (
          <span className="h-3.5 px-1 rounded-full border border-violet-500/35 bg-violet-500/25 text-violet-200/75 text-[8px]">Source</span>
        )}
      </div>
      <p className={`text-xs font-semibold mb-1 ${highlight ? "text-violet-300/80" : "text-white/45"}`}>{title}</p>
      <p className={`text-[11px] leading-relaxed ${highlight ? "text-white/65" : "text-white/32"}`}>{body}</p>
    </div>
  )
}

function TrustCheckDocViewer() {
  return (
    <div className={`flex flex-col ${DARK} border border-white/[0.06] rounded-xl overflow-hidden`}>
      <ToolRow
        icon={Shield}
        color="text-blue-400/45"
        label="Document Trust Check"
        badge="High Trust · 82/100"
        badgeColor="border-emerald-500/28 bg-emerald-500/10 text-emerald-300/75"
      />
      <FileRow filename="Employment_Agreement_2025.pdf" count={6} color="text-violet-400/60" />
      <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
        <SectionCard index={1} title="Employer & Employee Details" body="Identifies both parties, their roles, and effective date. Signers confirmed." />
        <SectionCard index={2} title="Compensation & Benefits" body="Annual salary of $95,000 with health insurance, 401(k) matching up to 4%, and PTO accrual at 1.5 days/month." />
        <SectionCard index={3} title="Non-Compete Clause" body="12-month restriction on competing within 50-mile radius. May limit future employment options." />
      </div>
      <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4">
        <span className="text-white/20 text-xs">6 sections</span>
        <div className="flex gap-1">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${i === 2 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{i}</div>
          ))}
        </div>
        <span className="text-white/14 text-[10px]">Jump to section</span>
      </div>
    </div>
  )
}

function ContractReviewDocViewer() {
  return (
    <div className={`flex flex-col ${DARK} border border-white/[0.06] rounded-xl overflow-hidden`}>
      <ToolRow
        icon={Scale}
        color="text-amber-400/40"
        label="Contract Review"
        badge="3 risks found"
        badgeColor="border-red-500/28 bg-red-500/10 text-red-300/75"
      />
      <FileRow filename="SaaS_Subscription_Contract.pdf" count={8} color="text-amber-400/55" />
      <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
        <SectionCard index={1} title="Parties & Effective Date" body="Agreement between Apex Software LLC and the Subscriber, effective January 1, 2025." />
        <SectionCard index={2} title="Payment Terms" body="Monthly fees of $499/user billed on the 1st. Late payment incurs 1.5% monthly interest." />
        <SectionCard index={3} title="Auto-Renewal Clause" body="Contract auto-renews for 12 months unless cancelled 60 days in advance in writing." />
      </div>
      <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4">
        <span className="text-white/20 text-xs">8 sections</span>
        <div className="flex gap-1">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${i === 3 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{i}</div>
          ))}
        </div>
        <span className="text-white/14 text-[10px]">Jump to section</span>
      </div>
    </div>
  )
}

function ClauseExtractorDocViewer() {
  return (
    <div className={`flex flex-col ${DARK} border border-white/[0.06] rounded-xl overflow-hidden`}>
      <ToolRow
        icon={ListChecks}
        color="text-violet-400/45"
        label="Clause Extractor"
        badge="6 of 8 clauses extracted"
        badgeColor="border-blue-500/28 bg-blue-500/10 text-blue-300/75"
      />
      <FileRow filename="Music_Production_Contract.pdf" count={7} color="text-violet-400/60" />
      <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
        <SectionCard index={1} title="Parties & Scope" body="Recording agreement between Verve Records and the Artist for two studio albums." />
        <SectionCard index={2} title="Financial Terms" body="$25,000 advance against 15% royalty rate on net receipts from streaming and physical sales." />
        <SectionCard index={3} title="Termination / Notice" body="Either party may terminate with 30-day written notice after first album release." />
      </div>
      <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4">
        <span className="text-white/20 text-xs">7 sections</span>
        <div className="flex gap-1">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${i === 1 ? "bg-violet-600 text-white" : "text-white/22"}`}>{i}</div>
          ))}
        </div>
        <span className="text-white/14 text-[10px]">Jump to section</span>
      </div>
    </div>
  )
}

function CompareDocPanels() {
  return (
    <div className="flex gap-2">
      {/* Original */}
      <div className={`flex-1 flex flex-col ${DARK} border border-white/[0.06] rounded-xl overflow-hidden`}>
        <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 shrink-0 bg-white/[0.01]">
          <ArrowLeftRight className="w-3 h-3 text-white/22 shrink-0" />
          <span className="text-[10px] text-white/28 font-medium flex-1">Compare Versions</span>
          <span className="text-[9px] text-white/18">5 sections</span>
        </div>
        <div className="h-8 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
          <FileText className="w-3 h-3 text-white/25 shrink-0" />
          <span className="text-[11px] text-white/50 font-semibold">Original</span>
          <span className="text-[10px] text-white/22 ml-1 flex-1 truncate">NDA_v1_2024.pdf</span>
          <span className="h-4 px-1.5 rounded border border-red-400/22 bg-red-400/[0.07] text-red-300/60 text-[9px] font-medium">2 removed</span>
        </div>
        <div className="p-2.5 space-y-2">
          {[
            { title: "Scope of Confidentiality", body: "All information disclosed under this Agreement shall be deemed confidential..." },
            { title: "Obligations of Receiving Party", body: "Recipient agrees to maintain strict confidentiality and not disclose..." },
          ].map((s, i) => (
            <div key={i} className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-2.5">
              <p className="text-[10px] font-medium text-white/45 mb-1">{s.title}</p>
              <p className="text-[9px] text-white/28 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Revised */}
      <div className={`flex-1 flex flex-col ${DARK} border border-white/[0.06] rounded-xl overflow-hidden`}>
        <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 shrink-0 bg-white/[0.01]">
          <span className="flex-1" />
          <span className="text-[9px] text-white/18">5 sections</span>
        </div>
        <div className="h-8 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
          <FileText className="w-3 h-3 text-violet-400/55 shrink-0" />
          <span className="text-[11px] text-violet-300/65 font-semibold">Revised</span>
          <span className="text-[10px] text-white/22 ml-1 flex-1 truncate">NDA_v2_2025.pdf</span>
          <span className="h-4 px-1.5 rounded border border-emerald-400/22 bg-emerald-400/[0.07] text-emerald-300/60 text-[9px] font-medium">3 added</span>
        </div>
        <div className="p-2.5 space-y-2">
          {[
            { title: "Scope of Confidentiality", body: "All information disclosed under this Agreement shall be deemed confidential, including trade secrets..." },
            { title: "Obligations of Receiving Party", body: "Recipient agrees to maintain strict confidentiality and not disclose. Additional obligations apply..." },
          ].map((s, i) => (
            <div key={i} className="rounded-lg border border-violet-500/20 bg-violet-500/[0.03] p-2.5">
              <p className="text-[10px] font-medium text-violet-300/60 mb-1">{s.title}</p>
              <p className="text-[9px] text-white/28 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LeftPaneB_Loaded() {
  return (
    <div className="bg-[#0c0c0f] min-h-screen p-6 flex flex-col gap-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <p className="text-white/35 text-xs mb-1 font-mono">B. Loaded left-pane view — all tools</p>
        <p className="text-white/18 text-[10px]">Standardized two-row header: tool identity row + file toolbar. Dark theme, footer section nav.</p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-white/22 text-[9px] uppercase tracking-wider font-mono">Trust Check</p>
          <div className="h-[340px] flex flex-col">
            <TrustCheckDocViewer />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-white/22 text-[9px] uppercase tracking-wider font-mono">Contract Review</p>
          <div className="h-[340px] flex flex-col">
            <ContractReviewDocViewer />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-white/22 text-[9px] uppercase tracking-wider font-mono">Clause Extractor</p>
          <div className="h-[340px] flex flex-col">
            <ClauseExtractorDocViewer />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-white/22 text-[9px] uppercase tracking-wider font-mono">Compare Versions — Document Panels</p>
          <div className="h-[340px] flex flex-col">
            <CompareDocPanels />
          </div>
        </div>
      </div>
    </div>
  )
}
