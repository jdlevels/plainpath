export function RedactMobileDocument() {
  return (
    <div className="h-screen bg-[#0c0c0f] text-white flex flex-col overflow-hidden" style={{maxWidth:"390px"}}>
      {/* Top bar */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center text-xs font-bold">P</div>
        <span className="text-sm text-white/80 font-medium">Redact Sensitive Info</span>
        <div className="ml-auto">
          <button className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        <button className="flex-1 py-2.5 text-xs font-medium border-b-2 border-transparent text-white/35 transition-colors">
          <div className="flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" stroke="none"/></svg>
            Redactions
          </div>
        </button>
        <button className="flex-1 py-2.5 text-xs font-medium border-b-2 border-violet-500 text-violet-300 bg-violet-500/[0.04]">
          <div className="flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
            Document
          </div>
        </button>
      </div>

      {/* Evidence banner */}
      <div className="border-b border-white/[0.06] bg-[#0e0e12] px-3 py-2.5 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-violet-300 font-medium">Account number active — §2·p.2</span>
          <button className="text-white/25 p-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
            <span className="text-xs text-white/30">In doc:</span>
            <span className="text-xs text-amber-300 font-medium">Account No. 7841</span>
          </div>
          <span className="text-white/20">→</span>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1">
            <div className="w-10 h-2.5 bg-black/80 border border-white/20 rounded-sm"/>
          </div>
        </div>
        <button className="mt-2 text-xs text-white/30 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Return to Redactions tab
        </button>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/40">Service_Agreement_v3.pdf</span>
          <div className="flex items-center gap-1.5 border border-white/[0.08] rounded-lg overflow-hidden text-xs">
            <button className="px-2 py-1 text-white/40">Original</button>
            <button className="px-2 py-1 bg-violet-600/60 text-violet-200">Preview</button>
          </div>
        </div>

        {/* §1 — with name redacted preview */}
        <div className="rounded-xl p-3 border border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/45 font-mono">§1 · p.1</span>
            <span className="text-xs text-white/60">Parties & Services</span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Service agreement between Linmore Group LLC and Brightfield Creative. Client contact:{" "}
            <span className="bg-black/80 border border-white/20 text-white/0 px-3 py-0.5 rounded text-xs mx-0.5 inline-block" style={{minWidth:"70px"}}>&nbsp;</span>
            , 742 Evergreen Terrace, Suite 4B.
          </p>
          <button className="mt-1.5 text-xs text-white/25">See this in Redactions tab →</button>
        </div>

        {/* §2 — active, account highlighted */}
        <div className="rounded-xl p-3 border-2 border-violet-500/50 bg-violet-500/[0.05]">
          <div className="absolute-like flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-violet-500/50 bg-[#0c0c0f] text-violet-400">● Source — §2·p.2</span>
            </div>
            <span className="text-xs text-white/60">Fees & Schedule</span>
          </div>
          <p className="text-xs text-white/55 leading-relaxed">
            Project fee: $12,000, due in three installments. Bank: First National, Account No.{" "}
            <span className="bg-amber-500/25 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded mx-0.5 font-medium">7841</span>.
            Payment by ACH or check.
          </p>
          <div className="mt-2 bg-black/30 border border-white/[0.07] rounded-lg px-2 py-1.5">
            <p className="text-xs text-white/30 font-mono">"…Account No. <span className="text-amber-300">7841</span>…"</p>
            <p className="text-xs text-white/25 mt-0.5">New language highlighted above — See revised →</p>
          </div>
        </div>

        {/* §3 — unchanged */}
        <div className="rounded-xl p-3 border border-white/[0.05] bg-white/[0.02] opacity-60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/45 font-mono">§3 · p.3</span>
            <span className="text-xs text-white/60">Intellectual Property</span>
          </div>
          <p className="text-xs text-white/45 leading-relaxed">All work created by the Provider is owned by the Client upon full payment. No sensitive items detected.</p>
          <button className="mt-1.5 text-xs text-white/25">See this in Redactions tab →</button>
        </div>

        {/* §4 — SSN/DOB items */}
        <div className="rounded-xl p-3 border border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/45 font-mono">§4 · p.4</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/60">Confidentiality</span>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            SSN:{" "}
            <span className="bg-black/80 border border-white/20 text-white/0 px-3 py-0.5 rounded mx-0.5 inline-block text-xs" style={{minWidth:"65px"}}>&nbsp;</span>
            {" "}DOB:{" "}
            <span className="bg-black/80 border border-white/20 text-white/0 px-3 py-0.5 rounded mx-0.5 inline-block text-xs" style={{minWidth:"55px"}}>&nbsp;</span>.
            Obligations survive for two years.
          </p>
          <button className="mt-1.5 text-xs text-white/25">See this in Redactions tab →</button>
        </div>

        {/* Page indicator */}
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="text-xs text-white/25">4 sections</span>
          <div className="flex gap-1">
            {[1,2,3,4].map(n => (
              <div key={n} className={`w-1.5 h-1.5 rounded-full ${n === 2 ? "bg-violet-400" : "bg-white/15"}`}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
