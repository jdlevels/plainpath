import { FileText, Scale, ListChecks, FileSearch } from "lucide-react"

const DARK = "bg-[#0d0d10]"

function SectionCard({ title, body, active = false }: { title: string; body: string; active?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${active ? "border-violet-500/45 bg-violet-500/[0.06]" : "border-white/[0.05] bg-white/[0.015]"}`}>
      <p className={`text-xs font-semibold mb-1 ${active ? "text-violet-300/80" : "text-white/45"}`}>{title}</p>
      <p className={`text-[11px] leading-relaxed ${active ? "text-white/65" : "text-white/32"}`}>{body}</p>
    </div>
  )
}

function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-white/22 text-[9px] uppercase tracking-wider font-mono">{label}</p>
      <div className="w-[280px] bg-[#0c0c0f] rounded-[28px] border border-white/10 overflow-hidden shadow-2xl" style={{ height: 580 }}>
        {/* Status bar mock */}
        <div className="h-7 bg-[#0c0c0f] flex items-center justify-between px-5">
          <span className="text-white/30 text-[9px] font-semibold">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-1.5 rounded-sm bg-white/25" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>
        {/* App content */}
        <div className="flex flex-col h-[calc(100%-28px)] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

function ContractReviewMobile() {
  return (
    <PhoneFrame label="Contract Review — Mobile Document Tab">
      {/* App top bar */}
      <div className="h-11 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-amber-600 flex items-center justify-center">
          <Scale className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/80 text-sm font-semibold">PlainPath</span>
        <span className="text-white/15 text-[10px] mx-0.5">·</span>
        <span className="text-white/28 text-xs">Contract Review</span>
      </div>
      {/* Mobile tab bar */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        <div className="flex-1 h-10 text-xs font-medium flex items-center justify-center gap-1.5 text-white/35">
          <Scale className="w-3.5 h-3.5" /> Analysis
        </div>
        <div className="flex-1 h-10 text-xs font-medium flex items-center justify-center gap-1.5 text-amber-400 border-b-2 border-amber-500">
          <FileText className="w-3.5 h-3.5" /> Document
        </div>
      </div>
      {/* DocViewer — full width on mobile */}
      <div className={`flex-1 flex flex-col ${DARK} overflow-hidden`}>
        {/* Tool identity row */}
        <div className="h-7 border-b border-white/[0.04] flex items-center px-3 gap-2 bg-white/[0.01]">
          <Scale className="w-3 h-3 text-amber-400/40" />
          <span className="text-[10px] text-white/28 font-medium flex-1">Contract Review</span>
          <span className="h-4 px-1.5 rounded border border-red-500/28 bg-red-500/10 text-red-300/75 text-[9px]">3 risks</span>
        </div>
        {/* File row */}
        <div className="h-9 border-b border-white/[0.06] flex items-center px-3 gap-2 shrink-0">
          <FileText className="w-3.5 h-3.5 text-amber-400/55" />
          <span className="text-white/40 text-xs flex-1 truncate">SaaS_Subscription.pdf</span>
          <span className="text-white/18 text-[10px]">8 sections</span>
        </div>
        {/* Sections */}
        <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
          <SectionCard title="Parties & Effective Date" body="Agreement between Apex Software LLC and the Subscriber, effective January 1, 2025." />
          <SectionCard title="Payment Terms" body="Monthly fees of $499/user billed on the 1st. Late payment incurs 1.5% monthly interest." />
          <SectionCard title="Auto-Renewal Clause" body="Contract auto-renews for 12 months unless cancelled 60 days in advance in writing." active />
          <SectionCard title="Limitation of Liability" body="Liability capped at three months' subscription fees paid in the prior 12-month period." />
        </div>
        {/* Footer nav */}
        <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-3 shrink-0">
          <span className="text-white/20 text-[10px]">Section 3 of 8</span>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`w-5 h-5 rounded text-[8px] flex items-center justify-center ${i === 3 ? "bg-amber-600 text-white" : "text-white/22"}`}>{i}</div>
            ))}
            <div className="w-5 h-5 rounded text-[8px] flex items-center justify-center text-white/15">…</div>
          </div>
          <span className="text-white/14 text-[9px]">Jump</span>
        </div>
      </div>
    </PhoneFrame>
  )
}

function ClauseExtractorMobile() {
  return (
    <PhoneFrame label="Clause Extractor — Mobile Document Tab">
      {/* App top bar */}
      <div className="h-11 border-b border-border/30 flex items-center px-4 gap-2 shrink-0 bg-background">
        <ListChecks className="w-4.5 h-4.5 text-violet-600" />
        <span className="text-sm font-semibold text-foreground">PlainPath</span>
        <span className="text-foreground/20 text-[10px] mx-0.5">·</span>
        <span className="text-foreground/40 text-xs">Clause Extractor</span>
      </div>
      {/* Mobile tab bar */}
      <div className="flex border-b border-border/50 shrink-0 bg-background">
        <div className="flex-1 h-10 text-xs font-medium flex items-center justify-center gap-1.5 text-muted-foreground">
          <FileSearch className="w-3.5 h-3.5" /> Clauses
        </div>
        <div className="flex-1 h-10 text-xs font-medium flex items-center justify-center gap-1.5 text-violet-600 border-b-2 border-violet-500">
          <FileText className="w-3.5 h-3.5" /> Document
        </div>
      </div>
      {/* DocViewer — dark theme on mobile too */}
      <div className={`flex-1 flex flex-col ${DARK} overflow-hidden`}>
        {/* Tool identity row */}
        <div className="h-7 border-b border-white/[0.04] flex items-center px-3 gap-2 bg-white/[0.01]">
          <ListChecks className="w-3 h-3 text-violet-400/45" />
          <span className="text-[10px] text-white/28 font-medium flex-1">Clause Extractor</span>
          <span className="h-4 px-1.5 rounded border border-blue-500/28 bg-blue-500/10 text-blue-300/75 text-[9px]">6 of 8</span>
        </div>
        {/* File row */}
        <div className="h-9 border-b border-white/[0.06] flex items-center px-3 gap-2 shrink-0">
          <FileText className="w-3.5 h-3.5 text-violet-400/60" />
          <span className="text-white/45 text-xs flex-1 truncate">Music_Contract.pdf</span>
          <span className="text-white/18 text-[10px]">7 sections</span>
        </div>
        {/* Sections */}
        <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
          <SectionCard title="Parties & Scope" body="Recording agreement between Verve Records and the Artist for two studio albums over 36 months." />
          <SectionCard title="Financial Terms" body="$25,000 advance against 15% royalty rate on net receipts from streaming and physical sales." active />
          <SectionCard title="Termination / Notice" body="Either party may terminate with 30-day written notice after first album release." />
        </div>
        {/* Footer nav */}
        <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-3 shrink-0">
          <span className="text-white/20 text-[10px]">Section 2 of 7</span>
          <div className="flex gap-0.5">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className={`w-5 h-5 rounded text-[8px] flex items-center justify-center ${i === 2 ? "bg-violet-600 text-white" : "text-white/22"}`}>{i}</div>
            ))}
          </div>
          <span className="text-white/14 text-[9px]">Jump</span>
        </div>
      </div>
    </PhoneFrame>
  )
}

export default function LeftPaneD_Mobile() {
  return (
    <div className="bg-[#0c0c0f] min-h-screen p-6 flex flex-col gap-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <p className="text-white/35 text-xs mb-1 font-mono">D. Mobile document view — Contract Review + Clause Extractor</p>
        <p className="text-white/18 text-[10px]">Full-width document pane on mobile with tool identity row, file toolbar, and section footer. Dark theme maintained.</p>
      </div>
      <div className="flex gap-10 justify-center">
        <ContractReviewMobile />
        <ClauseExtractorMobile />
      </div>
    </div>
  )
}
