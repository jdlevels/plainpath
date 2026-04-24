import { useState } from "react"

export function RedactPreview() {
  const [view, setView] = useState<"original" | "preview">("preview")

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Nav */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold">P</div>
        <span className="text-sm text-white/50">PlainPath</span>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-sm text-white/80">Redact Sensitive Info</span>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-sm text-white/60">Service_Agreement_v3.pdf</span>
        <div className="ml-auto flex items-center gap-2">
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
          <button className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 rounded-lg hover:bg-white/[0.07]">
            ↩ Adjust
          </button>
          <button className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
            Export Redacted PDF
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document viewer with redaction overlays */}
        <div className="w-[60%] border-r border-white/[0.06] overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
              <span className="text-xs text-white/40">Service_Agreement_v3.pdf</span>
            </div>
            {view === "preview" && (
              <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                Redaction preview — 4 items hidden
              </span>
            )}
          </div>

          {/* §1 — with name redacted */}
          <div className="rounded-xl p-4 border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50 font-mono">§1 · p.1</span>
              <span className="text-xs font-medium text-white/80">Parties & Services</span>
            </div>
            <p className="text-xs text-white/55 leading-relaxed">
              Service agreement between Linmore Group LLC ("Client") and Brightfield Creative ("Provider") for design services, commencing June 2025. Client contact:{" "}
              {view === "preview" ? (
                <span className="inline-flex items-center gap-1 mx-0.5">
                  <span className="bg-black/90 border border-white/[0.15] text-white/0 select-none rounded px-3 py-0.5 text-xs" style={{minWidth:"90px"}}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                </span>
              ) : (
                <span className="bg-red-500/20 border border-red-500/30 text-red-300 px-1.5 py-0.5 rounded mx-0.5">James R. Holloway</span>
              )}
              , 742 Evergreen Terrace, Suite 4B, Springfield.
              {" "}Contact:{" "}
              {view === "preview" ? (
                <span className="inline-flex items-center gap-1 mx-0.5">
                  <span className="bg-black/90 border border-white/[0.15] text-white/0 select-none rounded px-3 py-0.5 text-xs" style={{minWidth:"110px"}}>&nbsp;</span>
                </span>
              ) : (
                <span className="bg-red-500/20 border border-red-500/30 text-red-300 px-1.5 py-0.5 rounded mx-0.5">j.holloway@domain.com</span>
              )}
            </p>
          </div>

          {/* §2 — with account redacted */}
          <div className="rounded-xl p-4 border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50 font-mono">§2 · p.2</span>
              <span className="text-xs font-medium text-white/80">Fees & Schedule</span>
            </div>
            <p className="text-xs text-white/55 leading-relaxed">
              Project fee: $12,000, due in three equal installments. Bank: First National, Account No.{" "}
              {view === "preview" ? (
                <span className="bg-black/90 border border-white/[0.15] text-white/0 select-none rounded px-2 py-0.5 text-xs mx-0.5" style={{minWidth:"70px"}}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              ) : (
                <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded mx-0.5">7841</span>
              )}
              . Payment via ACH or check.
            </p>
          </div>

          {/* §3 — unchanged */}
          <div className="rounded-xl p-4 border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50 font-mono">§3 · p.3</span>
              <span className="text-xs font-medium text-white/80">Intellectual Property</span>
            </div>
            <p className="text-xs text-white/55 leading-relaxed">All work created by the Provider is owned by the Client upon full payment. Provider retains rights to portfolio display.</p>
          </div>

          {view === "preview" && (
            <div className="border border-emerald-500/20 rounded-xl p-3 bg-emerald-500/[0.03]">
              <p className="text-xs text-emerald-400/80 text-center">Redaction preview — original document is unchanged. 4 items will be hidden in the exported copy.</p>
            </div>
          )}
        </div>

        {/* Right: Summary panel */}
        <div className="w-[40%] overflow-y-auto p-5 space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Redaction summary</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
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
                { label: "Full name", src: "§1·p.1", color: "text-red-400" },
                { label: "Email address", src: "§1·p.1", color: "text-red-400" },
                { label: "Account number", src: "§2·p.2", color: "text-amber-400" },
                { label: "SSN (partial)", src: "§4·p.4", color: "text-red-400" },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-2 bg-black/80 border border-white/20 rounded-sm"/>
                    <span className={r.color}>{r.label}</span>
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
                2 items were reviewed and left visible
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors">
              Export Redacted PDF
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/50 hover:border-white/15 transition-colors">Export DOCX</button>
              <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/50 hover:border-white/15 transition-colors">↩ Adjust</button>
            </div>
            <p className="text-xs text-white/20 text-center">Original is preserved. Redaction creates a separate copy.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
