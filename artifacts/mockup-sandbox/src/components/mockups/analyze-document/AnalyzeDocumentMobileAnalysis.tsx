import {
  FileText, CheckCircle2, AlertTriangle, Calendar, Circle,
  XCircle, Zap, BookOpen, ListTodo, User, Clock, Flag,
} from "lucide-react"

const BG = "#0c0c0f"
const PANEL = "#111115"
const BORDER = "rgba(255,255,255,0.06)"

function PriorityBadge({ p }: { p: "urgent" | "important" }) {
  return (
    <span className={`inline-flex items-center h-[16px] px-1.5 rounded-full border text-[8px] font-semibold uppercase tracking-wide ${p === "urgent" ? "bg-red-500/12 border-red-500/22 text-red-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"}`}>
      {p}
    </span>
  )
}

function SourceChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-[16px] px-1.5 rounded text-[9px] font-mono bg-violet-600/10 border border-violet-500/18 text-violet-300/75">
      {label}
    </span>
  )
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/24 mb-2">{children}</p>
}

export default function AnalyzeDocumentMobileAnalysis() {
  return (
    <div className="flex flex-col" style={{ background: BG, width: 390, height: 844, fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>
      {/* Top bar */}
      <div className="h-10 border-b flex items-center px-3 gap-2 shrink-0" style={{ borderColor: BORDER }}>
        <div className="w-4.5 h-4.5 rounded bg-violet-600 flex items-center justify-center shrink-0" style={{ width: 18, height: 18 }}>
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
      </div>

      {/* Tab bar */}
      <div className="flex shrink-0" style={{ borderBottom: `1px solid ${BORDER}`, background: PANEL }}>
        <div className="flex-1 flex flex-col items-center py-2.5 gap-0.5" style={{ borderBottom: "2px solid rgba(139,92,246,0.8)" }}>
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-violet-300 text-[10px] font-semibold">Analysis</span>
        </div>
        <div className="flex-1 flex flex-col items-center py-2.5 gap-0.5 opacity-40">
          <FileText className="w-3.5 h-3.5 text-white/35" />
          <span className="text-white/30 text-[10px]">Document</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">

        {/* A -- Plain-English Summary */}
        <div>
          <SLabel><span className="flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" />Plain-English Summary</span></SLabel>
          <div className="rounded-xl px-3 py-3 text-[11px] text-white/55 leading-relaxed" style={{ background: "rgba(255,255,255,0.024)", border: `1px solid ${BORDER}` }}>
            3-year commercial lease, 15 Oak St. You are the Tenant (Brightfield Goods Co.). Pay $8,400 deposit and submit proof of insurance before move-in June 1. Miss the 90-day renewal notice and the lease auto-renews at 110% of your rent. Exhibit A is missing -- the premises are not fully defined.
          </div>
        </div>

        {/* B -- Action Plan Snapshot */}
        <div>
          <SLabel><span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Action Plan Snapshot</span></SLabel>
          <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { val: "5", label: "actions", color: "text-violet-300" },
                { val: "2", label: "urgent", color: "text-red-300" },
                { val: "3", label: "missing", color: "text-amber-300" },
                { val: "4", label: "deadlines", color: "text-sky-300" },
              ].map((s, i) => (
                <div key={i} className="flex items-baseline gap-0.5">
                  <span className={`text-[13px] font-bold ${s.color}`}>{s.val}</span>
                  <span className="text-white/28 text-[10px]">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-amber-300 text-[10px] font-semibold">Needs completion</span>
            </div>
          </div>
        </div>

        {/* C -- Step-by-Step Required Actions */}
        <div>
          <SLabel><span className="flex items-center gap-1"><ListTodo className="w-2.5 h-2.5" />Step-by-Step Required Actions</span></SLabel>
          <div className="flex flex-col gap-2">
            {[
              {
                step: 1, title: "Pay security deposit", priority: "urgent" as const,
                instruction: "Remit $8,400 to Landlord upon signing. Confirm wire instructions first.",
                deadline: "At signing", source: "§3 · p.2",
              },
              {
                step: 2, title: "Submit proof of insurance", priority: "urgent" as const,
                instruction: "CGL coverage ≥ $1M per occurrence, $2M aggregate. Add Landlord as additional insured. Submit within 10 days of June 1.",
                deadline: "June 11, 2025", source: "§4 · p.3",
              },
              {
                step: 3, title: "Set monthly rent reminder", priority: "important" as const,
                instruction: "Recurring reminder for $4,200 on the 1st. 5% late fee applies after 5 days.",
                deadline: "1st of each month", source: "§3 · p.2",
              },
              {
                step: 4, title: "Schedule pre-move-in walk-through", priority: "important" as const,
                instruction: "Document property condition before June 1 to protect your deposit.",
                deadline: "Before June 1", source: "§1 · p.1",
              },
              {
                step: 5, title: "Calendar renewal notice deadline", priority: "important" as const,
                instruction: "Set a reminder for March 3, 2028 -- 90 days before lease expiry. Missing it auto-renews at 110% rent.",
                deadline: "March 3, 2028", source: "§5 · p.4",
              },
            ].map((a) => (
              <div key={a.step} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.022)", border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                    <span className="text-violet-300 text-[9px] font-bold">{a.step}</span>
                  </div>
                  <Circle className="w-3 h-3 text-white/18 shrink-0" />
                  <span className="text-white/80 text-[11.5px] font-semibold flex-1 min-w-0">{a.title}</span>
                  <PriorityBadge p={a.priority} />
                </div>
                <p className="text-white/45 text-[10.5px] leading-relaxed mb-2">{a.instruction}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-white/20" />
                    <span className="text-white/28 text-[9.5px]">{a.deadline}</span>
                  </div>
                  <SourceChip label={a.source} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* D -- Missing Items */}
        <div>
          <SLabel><span className="flex items-center gap-1"><XCircle className="w-2.5 h-2.5" />Missing Items / Information Needed</span></SLabel>
          <div className="flex flex-col gap-1.5">
            {[
              "Exhibit A (floor plan) not attached -- premises undefined",
              "Tenant registered address not specified",
              "Personal guarantee status -- not confirmed",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.14)" }}>
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-white/55 text-[10.5px] leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* E -- Deadlines */}
        <div>
          <SLabel><span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />Deadlines &amp; Time-Sensitive Items</span></SLabel>
          <div className="flex flex-col gap-1.5">
            {[
              { date: "At signing", label: "Security deposit due", u: true },
              { date: "June 1, 2025", label: "Lease commencement", u: false },
              { date: "June 11, 2025", label: "Proof of insurance due", u: true },
              { date: "March 3, 2028", label: "Renewal/termination notice", u: false },
            ].map((d, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.018)", border: `1px solid ${BORDER}` }}>
                <Calendar className={`w-3 h-3 shrink-0 ${d.u ? "text-red-400" : "text-amber-400"}`} />
                <span className={`text-[10px] font-semibold shrink-0 ${d.u ? "text-red-300" : "text-amber-300"}`}>{d.date}</span>
                <span className="text-white/35 text-[10.5px]">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* F -- Risks (condensed) */}
        <div>
          <SLabel><span className="flex items-center gap-1"><Flag className="w-2.5 h-2.5" />Key Risks / Watchouts</span></SLabel>
          <div className="flex flex-col gap-1.5">
            {[
              { label: "Auto-renewal at 110% rent if 90-day notice missed", s: "§5 · p.4", high: true },
              { label: "Insurance lapse = material breach and potential termination", s: "§4 · p.3", high: true },
              { label: "Premises not fully defined -- Exhibit A missing", s: "§1 · p.1", high: false },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
                <AlertTriangle className="w-3 h-3 text-red-400/70 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-[10.5px] leading-relaxed mb-1">{r.label}</p>
                  <SourceChip label={r.s} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/15 text-[10px] leading-relaxed text-center pb-2">Based on the document. Verify before acting. Not legal advice.</p>
      </div>
    </div>
  )
}
