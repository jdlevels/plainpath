import { useState } from "react"

export function RedactPreview() {
  const [view, setView] = useState<"original" | "preview">("preview")

  const Redacted = ({ text, always = false }: { text: string, always?: boolean }) => {
    if (view === "preview" || always) {
      return <span className="bg-black border border-white/10 text-transparent select-none rounded-sm mx-0.5 inline-block align-middle leading-5 text-xs" style={{ minWidth: `${Math.max(text.length * 6, 40)}px` }}>{text}</span>
    }
    return <span className="bg-amber-200 border border-amber-400 rounded px-0.5 text-amber-900 font-medium">{text}</span>
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
            <button onClick={() => setView("original")}
              className={`px-3 py-1.5 transition-colors ${view === "original" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/60"}`}>
              Original
            </button>
            <button onClick={() => setView("preview")}
              className={`px-3 py-1.5 transition-colors ${view === "preview" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/60"}`}>
              Redaction Preview
            </button>
          </div>
          <button className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-white/50 hover:border-white/15 transition-colors">↩ Adjust</button>
          <button className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export Redacted PDF
          </button>
        </div>
      </header>

      {view === "preview" && (
        <div className="border-b border-violet-500/20 bg-violet-500/[0.04] px-4 py-2 flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400"/>
          <span className="text-xs text-violet-300">Redaction preview — 4 items will appear as black bars in the exported copy. Original document is not modified.</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Document paper surface ── */}
        <div className="w-[60%] border-r border-white/[0.06] overflow-y-auto bg-[#111115] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-white/35">Service_Agreement_v3.pdf · 4 pages</span>
            {view === "preview"
              ? <span className="text-xs text-violet-400">4 redactions applied in preview</span>
              : <span className="text-xs text-amber-400">4 items highlighted</span>}
          </div>

          {/* Paper surface */}
          <div className="bg-white text-gray-800 rounded-lg shadow-2xl shadow-black/60 p-8 text-[13px] leading-7 font-serif mx-auto max-w-[600px]">
            <div className="text-center mb-6 pb-4 border-b border-gray-200">
              <p className="font-bold text-gray-900 text-base tracking-wide">SERVICE AGREEMENT</p>
              <p className="text-gray-500 text-xs mt-1">Reference: SA-2025-8841 · Effective June 1, 2025</p>
            </div>

            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">§1 — Parties &amp; Services</p>
            <p className="mb-4 text-gray-700">
              This Service Agreement is entered into between Linmore Group LLC ("Client") and Brightfield Creative ("Provider"),
              commencing June 1, 2025. The Client contact for this agreement is{" "}
              <Redacted text="James R. Holloway" />,
              reachable at{" "}
              <Redacted text="j.holloway@linmore.com" />{" "}
              and{" "}
              <span className={`rounded px-0.5 mx-0.5 ${view === "original" ? "bg-amber-100 border border-amber-300 text-amber-900" : "text-gray-700"}`}>(555) 391-8823</span>
              {view === "original" && <span className="text-xs text-amber-600 ml-1">[not selected]</span>}.
              Services include design, production, and delivery as detailed in Exhibit A.
            </p>

            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">§2 — Fees &amp; Payment Schedule</p>
            <p className="mb-4 text-gray-700">
              The total project fee is $12,000, payable in three equal installments of $4,000.
              Payment via ACH to First National Bank,{" "}
              <Redacted text="Account No. 7841" />.
              Late payments accrue interest at 1.5% per month.
            </p>

            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">§3 — Intellectual Property</p>
            <p className="mb-4 text-gray-700">
              All deliverables become the exclusive property of the Client upon receipt of final payment.
              Provider retains the right to display work in a professional portfolio.
            </p>

            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">§4 — Personal Data &amp; Confidentiality</p>
            <p className="mb-4 text-gray-700">
              For identity verification, the following personal data was provided:{" "}
              <Redacted text="SSN: 482-00-7731" />,{" "}
              <span className={`rounded px-0.5 mx-0.5 ${view === "original" ? "bg-amber-100 border border-amber-300 text-amber-900" : "text-gray-700"}`}>DOB: 14/03/1987</span>
              {view === "original" && <span className="text-xs text-amber-600 ml-1">[not selected]</span>}.
              Confidentiality obligations survive termination for two years.
            </p>

            {/* Signature lines */}
            <div className="mt-8 pt-6 border-t border-gray-300 grid grid-cols-2 gap-8">
              <div>
                <div className="border-b border-gray-400 mb-1 h-8"/>
                <p className="text-xs text-gray-500">Client signature</p>
              </div>
              <div>
                <div className="border-b border-gray-400 mb-1 h-8"/>
                <p className="text-xs text-gray-500">Provider signature</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400">
              <span>Service_Agreement_v3.pdf</span><span>Page 1 of 4</span>
            </div>
          </div>

          {view === "preview" && (
            <div className="mt-4 border border-emerald-500/20 rounded-xl p-3 bg-emerald-500/[0.03]">
              <p className="text-xs text-emerald-400/80 text-center">
                4 items replaced with black redaction bars in the exported copy · Original document is unchanged
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Summary panel ── */}
        <div className="w-[40%] overflow-y-auto p-5 space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Redaction summary</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white mb-0.5">4</div>
                <div className="text-xs text-white/40">Items to redact</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white mb-0.5">2</div>
                <div className="text-xs text-white/40">Left visible</div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Full name",    src: "§1·p.1" },
                { label: "Email address",src: "§1·p.1" },
                { label: "Account No.", src: "§2·p.2" },
                { label: "SSN (partial)",src: "§4·p.4" },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-black border border-white/20 rounded-sm w-8 h-3 inline-block"/>
                    <span className="text-white/60">{r.label}</span>
                  </div>
                  <span className="text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded text-xs">{r.src}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Before you export</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                4 sensitive items selected for redaction
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                Original document will not be modified
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-400/80">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                2 items reviewed and left visible
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors">Export Redacted PDF</button>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/50">Export DOCX</button>
              <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/50">↩ Adjust</button>
            </div>
            <p className="text-xs text-white/20 text-center">Original preserved. Redaction creates a separate copy.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
