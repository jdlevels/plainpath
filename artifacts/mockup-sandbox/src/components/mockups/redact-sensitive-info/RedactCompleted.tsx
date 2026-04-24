import { useState } from "react"

const sensitive = [
  { id: "name-1",    text: "James R. Holloway",        category: "Name",      confidence: "High", source: "§1·p.1" },
  { id: "email-1",  text: "j.holloway@linmore.com",    category: "Contact",   confidence: "High", source: "§1·p.1" },
  { id: "phone-1",  text: "(555) 391-8823",            category: "Contact",   confidence: "High", source: "§1·p.1" },
  { id: "account-1",text: "Account No. 7841",          category: "Financial", confidence: "High", source: "§2·p.2" },
  { id: "ssn-1",    text: "SSN: 482-00-7731",          category: "ID",        confidence: "Med",  source: "§4·p.4" },
  { id: "dob-1",    text: "DOB: 14/03/1987",           category: "Personal",  confidence: "Med",  source: "§4·p.4" },
]

export function RedactCompleted() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["name-1", "email-1", "account-1"]))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"original" | "preview">("original")

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const activate = (id: string) => setActiveId(id === activeId ? null : id)

  const highlight = (id: string) => {
    const isActive = id === activeId
    const isSelected = selected.has(id)
    if (viewMode === "preview" && isSelected) return null // render black bar instead
    if (isActive) return "bg-violet-500/40 border border-violet-400 rounded px-0.5"
    if (isSelected) return "bg-amber-400/20 border border-amber-400/50 rounded px-0.5"
    return "bg-amber-300/10 border border-amber-400/30 rounded px-0.5"
  }

  const confColor = (c: string) => c === "High" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : "text-amber-400 bg-amber-500/10 border-amber-500/25"
  const catColor  = (c: string) => c === "Financial" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : c === "ID" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-white/50 bg-white/[0.05] border-white/10"

  const Redacted = ({ id, text }: { id: string, text: string }) => {
    const isActive   = id === activeId
    const isSelected = selected.has(id)
    if (viewMode === "preview" && isSelected) {
      return (
        <span className={`inline-flex items-center mx-0.5 align-middle ${isActive ? "ring-2 ring-violet-400 rounded" : ""}`}>
          <span className="bg-black border border-white/10 text-transparent select-none rounded px-1 text-xs leading-5" style={{minWidth: `${text.length * 5.5}px`}}>{text}</span>
        </span>
      )
    }
    const hlClass = highlight(id)
    return (
      <span onClick={() => activate(id)} className={`cursor-pointer mx-0.5 ${hlClass || ""}`}>{text}</span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Nav */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold">P</div>
        <span className="text-sm text-white/50">PlainPath</span>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-sm text-white/80">Redact Sensitive Info</span>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-sm text-white/50">Service_Agreement_v3.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          {/* Original / Preview toggle */}
          <div className="flex items-center border border-white/[0.08] rounded-lg overflow-hidden text-xs">
            <button onClick={() => setViewMode("original")}
              className={`px-3 py-1.5 transition-colors ${viewMode === "original" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/60"}`}>
              Original
            </button>
            <button onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 transition-colors ${viewMode === "preview" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/60"}`}>
              Redaction Preview
            </button>
          </div>
          <button className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 rounded-lg hover:bg-white/[0.07]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export Redacted
          </button>
          <button className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 rounded-lg">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
            Save
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Document viewer as paper surface ── */}
        <div className="w-[60%] border-r border-white/[0.06] overflow-y-auto bg-[#111115] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-white/35">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
              Service_Agreement_v3.pdf &nbsp;·&nbsp; 4 pages
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/25">
              {viewMode === "preview"
                ? <span className="text-violet-400">{selected.size} items redacted</span>
                : <span>{sensitive.length} items detected</span>}
            </div>
          </div>

          {/* Paper page */}
          <div className="bg-white text-gray-800 rounded-lg shadow-2xl shadow-black/60 p-8 text-[13px] leading-7 font-serif mx-auto max-w-[600px]">
            {/* Page header */}
            <div className="text-center mb-6 pb-4 border-b border-gray-200">
              <p className="font-bold text-gray-900 text-base tracking-wide">SERVICE AGREEMENT</p>
              <p className="text-gray-500 text-xs mt-1">Reference: SA-2025-8841 &nbsp;·&nbsp; Effective June 1, 2025</p>
            </div>

            {/* §1 */}
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2 mt-0">§1 &nbsp;— &nbsp;Parties &amp; Services</p>
            <p className="mb-4 text-gray-700">
              This Service Agreement is entered into between Linmore Group LLC ("Client") and Brightfield Creative ("Provider"),
              commencing June 1, 2025. The Client contact for this agreement is{" "}
              <Redacted id="name-1" text="James R. Holloway" />,
              reachable at{" "}
              <Redacted id="email-1" text="j.holloway@linmore.com" />{" "}
              and{" "}
              <Redacted id="phone-1" text="(555) 391-8823" />.
              Services include design, production, and delivery as detailed in Exhibit A.
            </p>

            {/* §2 */}
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">§2 &nbsp;— &nbsp;Fees &amp; Payment Schedule</p>
            <p className="mb-4 text-gray-700">
              The total project fee is $12,000, payable in three equal installments of $4,000.
              Invoices will be issued on kickoff, mid-project review, and final delivery.
              Payment via ACH to First National Bank,{" "}
              <Redacted id="account-1" text="Account No. 7841" />.
              Late payments accrue interest at 1.5% per month.
            </p>

            {/* §3 */}
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">§3 &nbsp;— &nbsp;Intellectual Property</p>
            <p className="mb-4 text-gray-700">
              All deliverables produced under this agreement become the exclusive property of the Client upon receipt of final payment.
              Provider retains the right to display work in a professional portfolio.
              No third-party disclosure of proprietary information is permitted.
            </p>

            {/* §4 */}
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">§4 &nbsp;— &nbsp;Personal Data &amp; Confidentiality</p>
            <p className="mb-2 text-gray-700">
              For identity verification, the following personal data was provided by the Client:{" "}
              <Redacted id="ssn-1" text="SSN: 482-00-7731" />,{" "}
              <Redacted id="dob-1" text="DOB: 14/03/1987" />.
              This data will not be shared with any third party and will be destroyed after verification.
              Confidentiality obligations survive termination of this agreement for a period of two years.
            </p>

            {/* Page footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
              <span>Service_Agreement_v3.pdf</span>
              <span>Page 1 of 4</span>
            </div>
          </div>

          {viewMode === "original" && (
            <p className="text-center text-xs text-white/25 mt-4">Click a highlighted item to select it · Original document unchanged</p>
          )}
          {viewMode === "preview" && (
            <p className="text-center text-xs text-violet-400/60 mt-4">Redaction preview — black bars replace {selected.size} selected items in the exported copy</p>
          )}
        </div>

        {/* ── RIGHT: Redaction control panel ── */}
        <div className="w-[40%] overflow-y-auto p-4 space-y-4">
          {/* A. Summary */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">A. Redaction Summary</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                <span className="text-sm font-bold text-red-400">{sensitive.length}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{sensitive.length} possible sensitive items found</p>
                <p className="text-xs text-white/40">4 categories · 4 pages</p>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-1">Names, contact details, financial account numbers, and personal identifiers detected. Review each item on the document before exporting a redacted copy.</p>
            <p className="text-xs text-amber-400/80">Review before export. Original document is unchanged.</p>
          </div>

          {/* B. Detection strip */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">B. Detection Strip</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-1 rounded-full text-xs border border-white/10 text-white/55">{sensitive.length} items found</span>
              <span className="px-2 py-1 rounded-full text-xs border border-emerald-500/25 text-emerald-400">High confidence</span>
              <span className="px-2 py-1 rounded-full text-xs border border-white/10 text-white/55">4 categories</span>
              <span className="px-2 py-1 rounded-full text-xs border border-red-500/25 text-red-400">2 high-priority</span>
              <span className="px-2 py-1 rounded-full text-xs border border-violet-500/25 text-violet-400">{selected.size} selected</span>
            </div>
          </div>

          {/* C. Suggested Redactions */}
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">C. Suggested Redactions</p>
            <div className="space-y-2">
              {sensitive.map(r => (
                <div key={r.id}
                  onClick={() => activate(r.id)}
                  className={`rounded-xl p-3 border cursor-pointer transition-all ${
                    activeId === r.id ? "border-violet-500/50 bg-violet-500/[0.06]" :
                    selected.has(r.id) ? "border-emerald-500/30 bg-emerald-500/[0.04]" :
                    "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
                  }`}>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" checked={selected.has(r.id)} onClick={e => e.stopPropagation()} onChange={() => toggle(r.id)} className="mt-0.5 accent-emerald-500 cursor-pointer"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-xs font-medium text-white/90">{r.category === "ID" || r.category === "Financial" ? "🔴" : "🟡"} {r.category}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs border ${confColor(r.confidence)}`}>{r.confidence}</span>
                        <span className="ml-auto px-1.5 py-0.5 rounded text-xs border border-violet-500/30 text-violet-400">{r.source}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/20 rounded-lg px-2 py-1">
                        {selected.has(r.id) && viewMode === "preview"
                          ? <span className="bg-black border border-white/10 text-transparent select-none rounded px-1 text-xs leading-5" style={{minWidth:"80px"}}>{r.text}</span>
                          : <span className="text-xs text-white/40 font-mono">{r.text.replace(/[a-z]/gi, "•").replace(/\d/g, "·")}</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. Categories */}
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">D. Redaction Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {["All (6)", "Names (1)", "Contact (2)", "Financial (1)", "IDs (1)", "Personal (1)"].map((c, i) => (
                <button key={c} className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${i === 0 ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-white/[0.07] text-white/40"}`}>{c}</button>
              ))}
            </div>
          </div>

          {/* E. Review Queue */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">E. Review Queue</p>
            <div className="space-y-1.5">
              {[["Selected for redaction", String(selected.size), "text-emerald-400"],
                ["Needs confirmation", "2", "text-amber-400"],
                ["Left visible", String(sensitive.length - selected.size), "text-white/30"],
                ["Manually added", "0", "text-white/30"]].map(([l, v, c]) => (
                <div key={l as string} className="flex items-center justify-between text-xs">
                  <span className="text-white/45">{l as string}</span><span className={`font-medium ${c as string}`}>{v as string}</span>
                </div>
              ))}
            </div>
          </div>

          {/* F. Manual Tools */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">F. Manual Redaction Tools</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[["✏️","Select text to redact"],["➕","Add manual region"],["↩️","Undo last"],["🗑️","Clear all manual"]].map(([i, l]) => (
                <button key={l as string} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.06] text-xs text-white/45 hover:border-white/15 transition-colors">{i as string} {l as string}</button>
              ))}
            </div>
          </div>

          {/* G. Export */}
          <div className="space-y-2">
            <button className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-colors">Export Redacted PDF</button>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/45">Export DOCX</button>
              <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/45">Download copy</button>
            </div>
            <p className="text-xs text-white/25 text-center">Original document is not modified. Redactions create a separate copy.</p>
          </div>

          {/* H. Source Traceability */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">H. Source Traceability</p>
            <div className="flex flex-wrap gap-1.5">
              {["§1·p.1 ×3", "§2·p.2 ×1", "§4·p.4 ×2"].map(c => (
                <button key={c} className="px-2 py-1 rounded-lg text-xs border border-violet-500/25 text-violet-400 hover:bg-violet-500/10 transition-colors">{c}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
