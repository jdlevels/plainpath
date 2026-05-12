import { FileScan, Scale, Clock, LayoutGrid, ChevronRight, CreditCard, FileText, ArrowRight, BookMarked } from "lucide-react"

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

function AppHeader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 14px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13L7 3L12 8L14 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 17, color: FOREGROUND, letterSpacing: "-0.3px" }}>PlainPath</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, border: `1px solid ${BORDER}`, background: CARD, fontSize: 12, fontWeight: 600, color: MUTED }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
        PlainPath Pro
        <CreditCard size={12} style={{ opacity: 0.5 }} />
      </div>
    </div>
  )
}

function ToolCard({ icon: Icon, label, desc, color, bg, locked }: { icon: any; label: string; desc: string; color: string; bg: string; locked?: boolean }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color={color} />
        </div>
        {locked && (
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "2px 7px" }}>Pro</span>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: FOREGROUND, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>{desc}</div>
    </div>
  )
}

function RecentItem({ icon: Icon, color, tool, title, time }: { icon: any; color: string; tool: string; title: string; time: string }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <Icon size={11} color={color} />
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color }}>{tool}</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: MUTED }}>{time}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: FOREGROUND, lineHeight: 1.4, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: PRIMARY }}>View analysis →</div>
    </div>
  )
}

export function Dashboard() {
  return (
    <div style={{ width: 390, minHeight: 844, background: BG, fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <StatusBar />
      <AppHeader />

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Hero */}
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 24, fontWeight: 700, color: FOREGROUND, letterSpacing: "-0.4px", lineHeight: 1.2, marginBottom: 6 }}>
            Welcome back, Sarah.
          </div>
          <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
            Choose a tool below to get started, or pick up where you left off.
          </div>
        </div>

        {/* Tools */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <LayoutGrid size={14} color={MUTED} />
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED }}>Tools</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <ToolCard
              icon={FileScan}
              label="Analyze a Document"
              desc="Understand any paperwork in plain English — deadlines, action steps, risks."
              color="#3b82f6"
              bg="#eff6ff"
            />
            <ToolCard
              icon={Scale}
              label="Contract Review"
              desc="Clause-by-clause review of any agreement before you sign."
              color="#f59e0b"
              bg="#fffbeb"
            />
          </div>
        </section>

        {/* Recent Work */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Clock size={14} color={MUTED} />
              <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED }}>Recent Work</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: PRIMARY }}>
              My Documents <ChevronRight size={13} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <RecentItem icon={FileScan} color="#3b82f6" tool="Analyze a Document" title="Freelance Design Contract — Studio Bevel" time="2h ago" />
            <RecentItem icon={Scale} color="#f59e0b" tool="Contract Review" title="Employment Offer Letter — Meridian Group" time="Yesterday" />
            <RecentItem icon={FileScan} color="#3b82f6" tool="Analyze a Document" title="Apartment Lease Agreement — 482 Oak Ave" time="3d ago" />
          </div>
        </section>

        {/* Quick Start */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <ArrowRight size={14} color={MUTED} />
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED }}>Quick Start</span>
          </div>
          <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 14 }}>Jump into a tool with a real-world scenario — no setup needed.</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: FileScan, color: "#3b82f6", bg: "#eff6ff", tool: "Analyze", title: "Small Business Event Permit" },
              { icon: Scale, color: "#f59e0b", bg: "#fffbeb", tool: "Contract Review", title: "Employment Offer — One-Sided" },
            ].map((d) => (
              <div key={d.title} style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: d.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <d.icon size={15} color={d.color} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: d.color, marginBottom: 4 }}>{d.tool}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: FOREGROUND, lineHeight: 1.35 }}>{d.title}</div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Bottom safe area */}
      <div style={{ height: 34, background: BG }} />
    </div>
  )
}
