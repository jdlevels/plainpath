import { ArrowLeft, ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Lock, Scale, Copy, Mail } from "lucide-react"

const BG = "#F8F7F4"
const CARD = "#FFFFFF"
const PRIMARY = "#4F7CAC"
const MUTED = "#737373"
const BORDER = "rgba(0,0,0,0.08)"
const FOREGROUND = "#1C1C1C"

function StatusBar() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 28px 4px", fontSize: 15, fontWeight: 600, color: FOREGROUND }}>
      <span>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><rect x="0" y="3" width="3" height="9" rx="1" fill={FOREGROUND}/><rect x="4.5" y="2" width="3" height="10" rx="1" fill={FOREGROUND}/><rect x="9" y="0" width="3" height="12" rx="1" fill={FOREGROUND}/><rect x="13.5" y="0" width="3" height="12" rx="1" fill={FOREGROUND} opacity="0.3"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 2.5C10.2 2.5 12.2 3.4 13.6 4.9L15 3.4C13.2 1.6 10.7.5 8 .5C5.3.5 2.8 1.6 1 3.4L2.4 4.9C3.8 3.4 5.8 2.5 8 2.5Z" fill={FOREGROUND}/><path d="M8 5.5C9.5 5.5 10.8 6.1 11.8 7.1L13.2 5.6C11.8 4.1 9.9 3.2 7.9 3.2 6 3.2 4.1 4 2.7 5.5L4.1 7C5.1 6 6.5 5.5 8 5.5Z" fill={FOREGROUND}/><circle cx="8" cy="10" r="1.8" fill={FOREGROUND}/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={FOREGROUND} strokeOpacity="0.35"/><rect x="2" y="2" width="17" height="8" rx="2" fill={FOREGROUND}/><path d="M23 4.5V7.5C23.8 7.2 24.5 6.5 24.5 6C24.5 5.5 23.8 4.8 23 4.5Z" fill={FOREGROUND} fillOpacity="0.4"/></svg>
      </div>
    </div>
  )
}

function NavHeader() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px 12px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: "#EEF1F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ArrowLeft size={16} color={MUTED} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 17, fontWeight: 700, color: FOREGROUND, letterSpacing: "-0.2px" }}>Contract Review</div>
        <div style={{ fontSize: 11, color: MUTED }}>Freelance Design Agreement · May 12, 2026</div>
      </div>
    </div>
  )
}

function ScoreCard() {
  const score = 32
  const barWidth = `${score}%`
  return (
    <div style={{ background: CARD, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 16, padding: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, marginBottom: 4 }}>Fairness Score</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: "#dc2626", lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 14, color: MUTED }}>/100</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Scale size={20} color="#dc2626" style={{ marginBottom: 4 }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: "#dc2626", textAlign: "center" }}>Review</div>
        </div>
      </div>
      {/* Score bar */}
      <div style={{ height: 6, background: "#fee2e2", borderRadius: 999, marginBottom: 10, overflow: "hidden" }}>
        <div style={{ width: barWidth, height: "100%", background: "#ef4444", borderRadius: 999 }} />
      </div>
      <div style={{ fontSize: 13, color: FOREGROUND, lineHeight: 1.5, fontWeight: 500 }}>
        Several clauses may need significant revision or clarification before signing.
      </div>
    </div>
  )
}

function SummaryChips() {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 11.5, fontWeight: 600, color: "#dc2626" }}>
        <ShieldAlert size={11} /> 2 needs attention
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 11.5, fontWeight: 600, color: "#d97706" }}>
        <AlertTriangle size={11} /> 2 cautions
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 11.5, fontWeight: 600, color: "#16a34a" }}>
        <CheckCircle2 size={11} /> 3 fair clauses
      </span>
    </div>
  )
}

function ClauseCard({ rating, text, explanation, expanded }: { rating: "needs-attention" | "caution" | "fair"; text: string; explanation: string; expanded?: boolean }) {
  const configs = {
    "needs-attention": { label: "Needs Attention", badge: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" }, icon: ShieldAlert, iconColor: "#ef4444", border: "rgba(239,68,68,0.15)" },
    "caution": { label: "Review Carefully", badge: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" }, icon: AlertTriangle, iconColor: "#f59e0b", border: "rgba(245,158,11,0.15)" },
    "fair": { label: "Fair", badge: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" }, icon: CheckCircle2, iconColor: "#22c55e", border: "rgba(34,197,94,0.1)" },
  }
  const c = configs[rating]
  const Icon = c.icon
  return (
    <div style={{ background: CARD, border: `1px solid ${c.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px" }}>
        <Icon size={15} color={c.iconColor} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: FOREGROUND, lineHeight: 1.35 }}>{text}</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: c.badge.bg, color: c.badge.color, border: `1px solid ${c.badge.border}`, flexShrink: 0, whiteSpace: "nowrap" }}>
          {c.label}
        </span>
        <ChevronDown size={14} color={MUTED} style={{ flexShrink: 0 }} />
      </div>
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ paddingTop: 12 }}>
            <div style={{ background: "#f8f9fa", borderRadius: 10, padding: "10px 12px", marginBottom: 10, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, marginBottom: 4 }}>What it says</div>
              <div style={{ fontSize: 11.5, color: MUTED, fontStyle: "italic", lineHeight: 1.5 }}>"{text}"</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, marginBottom: 5 }}>Why this matters</div>
              <div style={{ fontSize: 12.5, color: FOREGROUND, lineHeight: 1.55, opacity: 0.85 }}>{explanation}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: PRIMARY, border: `1px solid rgba(79,124,172,0.3)`, background: "rgba(79,124,172,0.06)", borderRadius: 9, padding: "7px 11px" }}>
                <Copy size={12} /> Copy negotiation language
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: PRIMARY, border: `1px solid rgba(79,124,172,0.3)`, background: "rgba(79,124,172,0.06)", borderRadius: 9, padding: "7px 11px" }}>
                <Mail size={12} /> Draft email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ContractReviewResult() {
  return (
    <div style={{ width: 430, height: 932, background: BG, fontFamily: "'Inter', sans-serif", overflowX: "hidden", overflowY: "hidden" }}>
      <StatusBar />
      <NavHeader />

      <div style={{ padding: "16px 14px" }}>
        <ScoreCard />
        <SummaryChips />

        {/* Pre-signing recommendation */}
        <div style={{ background: "#fffbeb", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700 }}>Before you sign:</span> 2 clauses need revision. Review the questions and suggested language below, then discuss with the other party.
        </div>

        {/* Section label */}
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: MUTED, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <ShieldAlert size={12} color="#ef4444" /> Needs Attention (2)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <ClauseCard
            rating="needs-attention"
            text="Perpetual IP assignment — all work product owned by client forever"
            explanation="You permanently transfer all intellectual property rights to the client. Even work created before this contract or using your own tools may be covered. This is unusually broad."
            expanded
          />
          <ClauseCard
            rating="needs-attention"
            text="Non-solicitation clause restricts client contacts for 24 months"
            explanation="You cannot contact or work with any of the client's current customers, employees, or vendors for two years after the project ends."
          />
        </div>

        {/* Cautions */}
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: MUTED, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={12} color="#f59e0b" /> Review Carefully (2)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <ClauseCard
            rating="caution"
            text="Payment terms: Net 60 with no late payment interest"
            explanation="Client has 60 days to pay. No penalty or interest is specified for late payments, which is longer than the typical Net 30."
          />
          <ClauseCard
            rating="caution"
            text="Revisions capped at two rounds with no definition of 'minor'"
            explanation="The revision limit is vague. What counts as a minor vs major revision isn't defined, leaving room for dispute."
          />
        </div>

        {/* Fair */}
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: MUTED, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle2 size={12} color="#22c55e" /> Fair Clauses (3)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ClauseCard rating="fair" text="Payment of $4,800 for brand identity deliverables" explanation="Rate and scope are clearly stated." />
          <ClauseCard rating="fair" text="Governing law — California" explanation="Standard jurisdiction clause for California-based parties." />
          <ClauseCard rating="fair" text="30-day termination notice with work-to-date payment" explanation="Reasonable notice period with compensation for completed work." />
        </div>
      </div>

      <div style={{ height: 34, background: BG }} />
    </div>
  )
}
