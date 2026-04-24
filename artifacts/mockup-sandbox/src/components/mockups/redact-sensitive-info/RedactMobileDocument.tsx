export function RedactMobileDocument() {
  return (
    <div className="h-screen bg-[#0c0c0f] text-white flex flex-col overflow-hidden" style={{maxWidth:"390px"}}>
      {/* Top bar */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center text-xs font-bold">P</div>
        <span className="text-sm text-white/80 font-medium">Redact Sensitive Info</span>
        <div className="ml-auto flex items-center gap-1.5 border border-white/[0.08] rounded-lg overflow-hidden text-xs">
          <button className="px-2.5 py-1.5 text-white/35">Original</button>
          <button className="px-2.5 py-1.5 bg-violet-600 text-white">Preview</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        <button className="flex-1 py-2.5 text-xs font-medium border-b-2 border-transparent text-white/35">
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
      <div className="border-b border-white/[0.06] bg-[#0e0e12] px-3 py-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400"/>
            <span className="text-xs text-violet-300 font-medium">Account No. — §2·p.2 active</span>
          </div>
          <button className="text-white/25">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
            <span className="text-xs text-white/30">Was:</span>
            <span className="text-xs text-amber-300 font-medium">Account No. 7841</span>
          </div>
          <span className="text-white/20 text-xs">→</span>
          <span className="bg-black border border-white/20 text-transparent select-none rounded px-2 py-0.5 text-xs leading-5 inline-block" style={{minWidth:"60px"}}>████</span>
        </div>
        <button className="mt-1.5 text-xs text-white/30 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Return to Redactions tab
        </button>
      </div>

      {/* Document paper surface */}
      <div className="flex-1 overflow-y-auto bg-[#111115] p-3">
        <div className="bg-white text-gray-800 rounded-lg shadow-xl shadow-black/50 text-[11px] leading-6 font-serif mx-auto">
          {/* Paper header */}
          <div className="text-center p-4 pb-3 border-b border-gray-200">
            <p className="font-bold text-gray-900 text-sm tracking-wide">SERVICE AGREEMENT</p>
            <p className="text-gray-400 text-xs mt-0.5">SA-2025-8841</p>
          </div>

          {/* §1 — with redacted items */}
          <div className="p-4 border-b border-gray-100">
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1.5">§1 — Parties &amp; Services</p>
            <p className="text-gray-600">
              Agreement between Linmore Group LLC and Brightfield Creative. Contact:{" "}
              <span className="bg-black border border-white/20 text-transparent select-none rounded-sm px-1 py-0.5 text-xs inline-block" style={{minWidth:"70px"}}>████████</span>
              , at{" "}
              <span className="bg-black border border-white/20 text-transparent select-none rounded-sm px-1 py-0.5 text-xs inline-block" style={{minWidth:"80px"}}>████████</span>
              {" "} and{" "}
              <span className="text-gray-500 border border-amber-300/40 bg-amber-50/50 rounded px-0.5">(555) 391-8823</span>
              <span className="text-amber-600 text-xs ml-1">[not selected]</span>.
            </p>
          </div>

          {/* §2 — active section, highlighted */}
          <div className="p-4 border-b border-gray-100 border-l-4 border-l-violet-400 bg-violet-50/40">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider">§2 — Fees &amp; Payment</p>
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-violet-100 border border-violet-300 text-violet-700">● Active</span>
            </div>
            <p className="text-gray-700">
              Fee: $12,000 payable in installments. Bank: First National,{" "}
              {/* Active item with violet ring */}
              <span className="bg-amber-200 border-2 border-violet-500 text-amber-900 rounded px-0.5 font-medium ring-1 ring-violet-300">
                Account No. 7841
              </span>
              . Late payments at 1.5%/month.
            </p>
            {/* Snippet */}
            <div className="mt-2 bg-gray-100 border border-gray-200 rounded p-1.5">
              <p className="text-xs text-gray-400 font-mono">"…First National, <span className="text-amber-700 font-semibold">Account No. 7841</span>…"</p>
            </div>
            <p className="text-xs text-violet-600 mt-1.5">New language highlighted · See revised →</p>
          </div>

          {/* §3 — unchanged */}
          <div className="p-4 border-b border-gray-100">
            <p className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-1.5">§3 — IP</p>
            <p className="text-gray-400 text-xs leading-5">All deliverables become Client property upon final payment. Provider retains portfolio rights.</p>
          </div>

          {/* §4 — redacted items */}
          <div className="p-4">
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1.5">§4 — Personal Data</p>
            <p className="text-gray-600">
              Identity verification:{" "}
              <span className="bg-black border border-white/20 text-transparent select-none rounded-sm px-1 py-0.5 inline-block" style={{minWidth:"75px"}}>███</span>
              ,{" "}
              <span className="text-gray-500 border border-amber-300/40 bg-amber-50/50 rounded px-0.5 text-xs">DOB: 14/03/1987</span>
              <span className="text-amber-600 text-xs ml-1">[not selected]</span>.
              Confidentiality survives termination for 2 years.
            </p>
          </div>

          {/* Page footer */}
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between text-xs text-gray-400">
            <span>Service_Agreement_v3.pdf</span><span>p. 1 of 4</span>
          </div>
        </div>

        {/* Page dots */}
        <div className="flex items-center justify-center gap-2 py-3">
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
