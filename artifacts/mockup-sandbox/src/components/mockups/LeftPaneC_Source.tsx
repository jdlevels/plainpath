import { FileText, Shield, Scale, ListChecks, X } from "lucide-react"

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

function SourceBanner({ title, snippet, onColor }: { title: string; snippet: string; onColor: string }) {
  return (
    <div className={`mx-3 mt-2 mb-1 shrink-0 rounded-lg border px-3 py-2 flex items-center gap-2.5 ${onColor}`}>
      <div className="w-2 h-2 rounded-full bg-current animate-pulse shrink-0 opacity-60" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium truncate">Source: {title}</p>
        <p className="text-[9px] italic truncate opacity-60">"{snippet}"</p>
        <p className="text-[9px] opacity-45">Document scrolled to matching section</p>
      </div>
      <button className="opacity-30 hover:opacity-60 shrink-0"><X className="w-3 h-3" /></button>
    </div>
  )
}

function ActiveSectionCard({ title, body, snippet, color }: { title: string; body: string; snippet: string; color: string }) {
  return (
    <div className={`rounded-xl border p-3.5 ring-1 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-mono opacity-40">Section 2</span>
        <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
          <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-violet-200/75 text-[9px]">Source</span>
        </div>
      </div>
      <p className="text-xs font-semibold mb-1.5 opacity-80">{title}</p>
      <p className="text-[11px] leading-relaxed opacity-65">{body}</p>
      <div className="mt-2 rounded-lg border border-violet-500/18 bg-violet-500/[0.06] px-2.5 py-1.5">
        <p className="text-violet-200/60 text-[9px] leading-relaxed">"{snippet}"</p>
      </div>
    </div>
  )
}

function DimmedCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 opacity-35">
      <p className="text-xs text-white/40">{title}</p>
    </div>
  )
}

function TrustCheckSourceActive() {
  return (
    <div className={`flex flex-col ${DARK} border border-white/[0.06] rounded-xl overflow-hidden h-full`}>
      <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 bg-white/[0.01]">
        <Shield className="w-3 h-3 text-blue-400/45" />
        <span className="text-[10px] text-white/28 font-medium flex-1">Document Trust Check</span>
        <span className="h-4 px-1.5 rounded border border-emerald-500/28 bg-emerald-500/10 text-emerald-300/75 text-[9px] font-medium">High Trust · 82/100</span>
      </div>
      <div className="h-9 border-b border-white/[0.06] flex items-center px-4 gap-2.5">
        <FileText className="w-3.5 h-3.5 text-violet-400/60" />
        <span className="text-white/45 text-xs flex-1 truncate">Employment_Agreement_2025.pdf</span>
        <span className="text-white/18 text-xs">6 sections</span>
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <ZoomBtns />
      </div>
      {/* Active citation banner */}
      <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-violet-200/85 text-[10px] font-medium">Source: Non-Compete Clause</p>
          <p className="text-violet-300/45 text-[9px] italic">"12-month restriction on competing within 50-mile radius..."</p>
        </div>
        <button className="text-white/20 shrink-0"><X className="w-3 h-3" /></button>
      </div>
      <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
        <DimmedCard title="Employer & Employee Details" />
        <ActiveSectionCard
          color="border-violet-500/45 bg-violet-500/[0.06] ring-violet-500/20"
          title="Non-Compete Clause"
          body="12-month restriction on competing within 50-mile radius. May limit future employment options significantly."
          snippet="12-month restriction on competing within 50-mile radius"
        />
        <DimmedCard title="Compensation & Benefits" />
      </div>
    </div>
  )
}

function ContractReviewSourceActive() {
  return (
    <div className={`flex flex-col ${DARK} border border-white/[0.06] rounded-xl overflow-hidden h-full`}>
      <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 bg-white/[0.01]">
        <Scale className="w-3 h-3 text-amber-400/40" />
        <span className="text-[10px] text-white/28 font-medium flex-1">Contract Review</span>
        <span className="h-4 px-1.5 rounded border border-red-500/28 bg-red-500/10 text-red-300/75 text-[9px] font-medium">3 risks found</span>
      </div>
      <div className="h-9 border-b border-white/[0.06] flex items-center px-4 gap-2.5">
        <FileText className="w-3.5 h-3.5 text-amber-400/55" />
        <span className="text-white/40 text-xs flex-1 truncate">SaaS_Subscription_Contract.pdf</span>
        <span className="text-white/18 text-xs">8 sections</span>
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <ZoomBtns />
      </div>
      {/* Active citation banner — amber for contract review */}
      <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-amber-500/28 bg-amber-500/[0.07] px-3 py-2 flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-amber-200/85 text-[10px] font-medium">Source: Auto-Renewal Clause</p>
          <p className="text-amber-300/45 text-[9px] italic">"Contract auto-renews for 12 months unless cancelled 60 days in advance..."</p>
        </div>
        <button className="text-white/20 shrink-0"><X className="w-3 h-3" /></button>
      </div>
      <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
        <DimmedCard title="Parties & Effective Date" />
        <div className="rounded-xl border border-amber-500/45 bg-amber-500/[0.05] ring-1 ring-amber-500/15 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono text-amber-400/40">Section 3</span>
            <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-amber-500/25 border border-amber-500/35">
              <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-200/75 text-[9px]">Source</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-amber-300/80 mb-1.5">Auto-Renewal Clause</p>
          <p className="text-[11px] leading-relaxed text-white/65">Contract auto-renews for 12 months unless cancelled 60 days in advance in writing.</p>
          <div className="mt-2 rounded-lg border border-amber-500/18 bg-amber-500/[0.06] px-2.5 py-1.5">
            <p className="text-amber-200/60 text-[9px] italic">"auto-renews for 12 months unless cancelled 60 days in advance in writing"</p>
          </div>
        </div>
        <DimmedCard title="Payment Terms" />
      </div>
    </div>
  )
}

function ClauseExtractorSourceActive() {
  return (
    <div className={`flex flex-col ${DARK} border border-white/[0.06] rounded-xl overflow-hidden h-full`}>
      <div className="h-7 border-b border-white/[0.04] flex items-center px-4 gap-2 bg-white/[0.01]">
        <ListChecks className="w-3 h-3 text-violet-400/45" />
        <span className="text-[10px] text-white/28 font-medium flex-1">Clause Extractor</span>
        <span className="h-4 px-1.5 rounded border border-blue-500/28 bg-blue-500/10 text-blue-300/75 text-[9px] font-medium">6 of 8 clauses extracted</span>
      </div>
      <div className="h-9 border-b border-white/[0.06] flex items-center px-4 gap-2">
        <FileText className="w-3.5 h-3.5 text-violet-400/60" />
        <span className="text-white/45 text-xs flex-1 truncate">Music_Production_Contract.pdf</span>
        <span className="text-white/18 text-xs">7 sections</span>
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <ZoomBtns />
      </div>
      {/* Evidence banner — violet style */}
      <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-violet-200/85 text-[10px] font-medium">Source: Financial Terms</p>
          <p className="text-violet-300/45 text-[9px] italic">"$25,000 advance against 15% royalty rate..."</p>
          <p className="text-violet-300/40 text-[9px]">Document scrolled to matching section</p>
        </div>
        <button className="text-white/20 shrink-0"><X className="w-3 h-3" /></button>
      </div>
      <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
        <DimmedCard title="Parties & Scope" />
        <ActiveSectionCard
          color="border-violet-500/45 bg-violet-500/[0.06] ring-violet-500/20"
          title="Financial Terms"
          body="$25,000 advance against 15% royalty rate on net receipts from streaming and physical sales worldwide."
          snippet="$25,000 advance against 15% royalty rate on net receipts"
        />
        <DimmedCard title="Termination / Notice" />
      </div>
      <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4">
        <span className="text-white/20 text-xs">Section 2 of 7</span>
        <div className="flex gap-1">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${i === 2 ? "bg-violet-600 text-white" : "text-white/22"}`}>{i}</div>
          ))}
        </div>
        <span className="text-white/14 text-[10px]">Jump to section</span>
      </div>
    </div>
  )
}

export default function LeftPaneC_Source() {
  return (
    <div className="bg-[#0c0c0f] min-h-screen p-6 flex flex-col gap-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <p className="text-white/35 text-xs mb-1 font-mono">C. Source-chip active state — ContractReview, TrustCheck, ClauseExtractor</p>
        <p className="text-white/18 text-[10px]">When an intelligence chip is tapped the document pane scrolls to the matching section and shows a source banner.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 h-[460px]">
        <TrustCheckSourceActive />
        <ContractReviewSourceActive />
        <ClauseExtractorSourceActive />
      </div>
    </div>
  )
}
