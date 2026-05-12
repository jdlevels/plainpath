import { ArrowLeft, FileText, Upload, Clipboard, Camera, FileCheck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"

const BG = "#F8F7F4"
const CARD = "#FFFFFF"
const PRIMARY = "#4F7CAC"
const MUTED = "#737373"
const BORDER = "rgba(0,0,0,0.08)"
const FOREGROUND = "#1C1C1C"
const SECONDARY = "#EEF1F5"

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
      <div style={{ width: 36, height: 36, borderRadius: 12, background: SECONDARY, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ArrowLeft size={16} color={MUTED} />
      </div>
      <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 17, fontWeight: 700, color: FOREGROUND, letterSpacing: "-0.2px" }}>Analyze a Document</span>
    </div>
  )
}

function Tab({ label, icon: Icon, active }: { label: string; icon: any; active?: boolean }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 4px", borderRadius: 10, background: active ? CARD : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.07)" : "none" }}>
      <Icon size={17} color={active ? FOREGROUND : MUTED} />
      <span style={{ fontSize: 11, fontWeight: active ? 600 : 500, color: active ? FOREGROUND : MUTED }}>{label}</span>
    </div>
  )
}

const DOC_TYPES = [
  { label: "Employment / Job Offer", bg: "#eff6ff", color: "#3b82f6" },
  { label: "Lease / Rental Agreement", bg: "#f0fdf4", color: "#22c55e" },
  { label: "Independent Contractor", bg: "#faf5ff", color: "#a855f7" },
  { label: "NDA / Confidentiality", bg: "#fffbeb", color: "#f59e0b" },
  { label: "Service Agreement", bg: "#fff7ed", color: "#f97316" },
  { label: "IRS / Tax Notice", bg: "#fef2f2", color: "#ef4444" },
]

export function AnalyzeDocument() {
  return (
    <div style={{ width: 430, height: 932, background: BG, fontFamily: "'Inter', sans-serif", overflowX: "hidden", overflowY: "hidden" }}>
      <StatusBar />
      <NavHeader />

      <div style={{ padding: "24px 16px 0" }}>
        {/* Icon + title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <FileText size={28} color="#3b82f6" />
          </div>
          <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 26, fontWeight: 700, color: FOREGROUND, letterSpacing: "-0.4px", marginBottom: 8 }}>
            Analyze a Document
          </div>
          <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.55, maxWidth: 300, margin: "0 auto" }}>
            Upload, paste, or scan a document to get a plain-English action plan.
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 12 }}>
            {[
              { icon: Clock, color: "#3b82f6", label: "Key deadlines" },
              { icon: AlertTriangle, color: "#f59e0b", label: "Concerns flagged" },
              { icon: CheckCircle2, color: "#22c55e", label: "Action steps" },
            ].map(({ icon: Icon, color, label }) => (
              <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: MUTED }}>
                <Icon size={13} color={color} />{label}
              </span>
            ))}
          </div>
        </div>

        {/* Main card */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: 20 }}>
          {/* Tabs */}
          <div style={{ padding: "8px", background: SECONDARY, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.05)", borderRadius: 14, padding: 4 }}>
              <Tab label="Paste" icon={Clipboard} active />
              <Tab label="Upload" icon={Upload} />
              <Tab label="Scan" icon={Camera} />
            </div>
          </div>

          {/* Paste area */}
          <div style={{ padding: 16 }}>
            <div style={{
              minHeight: 140,
              border: `1.5px dashed ${BORDER}`,
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "#fafafa",
              padding: 20,
              marginBottom: 14,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clipboard size={20} color={MUTED} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: FOREGROUND, marginBottom: 4 }}>Paste your document text</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>Copy the text from any document<br />and paste it here to begin</div>
              </div>
            </div>

            <button style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              background: PRIMARY,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              letterSpacing: "-0.1px",
            }}>
              Analyze Document
            </button>
          </div>
        </div>

        {/* Document type hints */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, marginBottom: 12 }}>Works with any document type</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {DOC_TYPES.map((dt) => (
              <div key={dt.label} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${BORDER}`,
                background: CARD,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: dt.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileCheck size={13} color={dt.color} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: FOREGROUND, lineHeight: 1.3 }}>{dt.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 34, background: BG }} />
    </div>
  )
}
