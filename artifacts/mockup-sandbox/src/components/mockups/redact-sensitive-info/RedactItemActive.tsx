export function RedactItemActive() {
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
        <div className="ml-auto flex items-center gap-1.5 text-xs bg-violet-500/10 border border-violet-500/30 px-3 py-1.5 rounded-lg text-violet-300">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400"/>
          Sensitive item active — §2 · Account No.
        </div>
      </header>

      {/* Evidence banner */}
      <div className="border-b border-white/[0.06] bg-[#0e0e12] px-4 py-3 flex items-start justify-between gap-4 shrink-0">
        <div className="flex-1 flex gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-white/30 uppercase tracking-widest">Detected</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-amber-500/25 text-amber-400">Financial</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-emerald-500/25 text-emerald-400">High confidence</span>
              <span className="px-1.5 py-0.5 rounded text-xs border border-violet-500/25 text-violet-400">§2·p.2</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-1.5">
                <span className="text-xs text-white/30">In document:</span>
                <span className="text-xs font-medium text-amber-300">Account No. 7841</span>
              </div>
              <span className="text-white/20 text-xs">→</span>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                <span className="text-xs text-white/30">Redacted as:</span>
                <span className="bg-black border border-white/20 text-transparent select-none rounded px-3 py-0.5 text-xs leading-5" style={{minWidth:"80px"}}>redacted</span>
              </div>
            </div>
          </div>
        </div>
        <button className="text-white/25 hover:text-white/60 p-1 transition-colors mt-0.5 shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Document paper surface — scrolled to §2 ── */}
        <div className="w-[60%] border-r border-white/[0.06] overflow-y-auto bg-[#111115] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-white/35">Service_Agreement_v3.pdf · §2·p.2 highlighted</span>
            <span className="text-xs text-violet-400">§2·p.2 active</span>
          </div>

          {/* Paper page */}
          <div className="bg-white text-gray-800 rounded-lg shadow-2xl shadow-black/60 p-8 text-[13px] leading-7 font-serif mx-auto max-w-[600px]">
            {/* Page header */}
            <div className="text-center mb-6 pb-4 border-b border-gray-200">
              <p className="font-bold text-gray-900 text-base tracking-wide">SERVICE AGREEMENT</p>
              <p className="text-gray-500 text-xs mt-1">Reference: SA-2025-8841 · Effective June 1, 2025</p>
            </div>

            {/* §1 — dimmed, items shown but not active */}
            <p className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-2">§1 — Parties &amp; Services</p>
            <p className="mb-4 text-gray-400 opacity-60">
              This Service Agreement is entered into between Linmore Group LLC ("Client") and Brightfield Creative ("Provider"),
              commencing June 1, 2025. The Client contact is{" "}
              <span className="bg-amber-200/60 border border-amber-400/40 rounded px-0.5 text-gray-500">James R. Holloway</span>,
              reachable at <span className="bg-amber-200/60 border border-amber-400/40 rounded px-0.5 text-gray-500">j.holloway@linmore.com</span> and <span className="bg-amber-200/60 border border-amber-400/40 rounded px-0.5 text-gray-500">(555) 391-8823</span>.
            </p>

            {/* §2 — active, account highlighted with violet ring */}
            <div className="relative -mx-4 px-4 py-3 rounded-lg border-2 border-violet-400 bg-violet-50/80 mb-4">
              {/* Active source chip */}
              <div className="absolute -top-3 left-3">
                <span className="px-2 py-0.5 rounded-full text-xs bg-violet-600 text-white border border-violet-400">
                  ● Source — §2·p.2
                </span>
              </div>
              <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">§2 — Fees &amp; Payment Schedule</p>
              <p className="text-gray-700">
                The total project fee is $12,000, payable in three equal installments of $4,000.
                Invoices will be issued on kickoff, mid-project review, and final delivery.
                Payment via ACH to First National Bank,{" "}
                {/* Active item — amber highlight with violet ring */}
                <span className="relative inline-block">
                  <span className="bg-amber-200 border-2 border-violet-500 text-gray-900 rounded px-1 font-semibold ring-2 ring-violet-400/40 ring-offset-1">
                    Account No. 7841
                  </span>
                </span>
                . Late payments accrue interest at 1.5% per month.
              </p>
              {/* Extracted snippet */}
              <div className="mt-3 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500 font-mono">"…Payment via ACH to First National Bank, <span className="text-amber-700 font-semibold">Account No. 7841</span>…"</p>
                <p className="text-xs text-gray-400 mt-1">Old language highlighted above · See revised →</p>
              </div>
            </div>

            {/* §3 — dimmed */}
            <p className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-2 opacity-60">§3 — Intellectual Property</p>
            <p className="mb-4 text-gray-400 opacity-60">
              All deliverables produced under this agreement become the exclusive property of the Client upon receipt of final payment.
            </p>

            {/* §4 — dimmed with items */}
            <p className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-2 opacity-60">§4 — Personal Data &amp; Confidentiality</p>
            <p className="text-gray-400 opacity-60">
              For identity verification:{" "}
              <span className="bg-amber-200/50 border border-amber-400/30 rounded px-0.5">SSN: 482-00-7731</span>,{" "}
              <span className="bg-amber-200/50 border border-amber-400/30 rounded px-0.5">DOB: 14/03/1987</span>.
            </p>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400">
              <span>Service_Agreement_v3.pdf</span><span>Page 1 of 4</span>
            </div>
          </div>
          <p className="text-center text-xs text-violet-400/60 mt-4">§2·p.2 — Account No. 7841 highlighted · Include in redaction?</p>
        </div>

        {/* ── RIGHT: Active redaction card ── */}
        <div className="w-[40%] overflow-y-auto p-4 space-y-4">
          {/* Active card */}
          <div className="rounded-xl border-2 border-violet-500/50 bg-violet-500/[0.06] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400"/>
                <span className="text-sm font-medium text-white">Account number</span>
              </div>
              <button className="text-xs text-white/40 hover:text-white/70 border border-white/[0.08] px-2 py-1 rounded-lg">All items</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-amber-500/25 text-amber-400">Financial</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-emerald-500/25 text-emerald-400">High confidence</span>
              <span className="px-1.5 py-0.5 rounded text-xs border border-violet-500/30 text-violet-400">§2·p.2</span>
            </div>

            {/* Before / After */}
            <div className="space-y-2 mb-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                <div className="text-xs text-white/30 mb-1">In document (original)</div>
                <span className="text-sm font-medium text-amber-300">Account No. 7841</span>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-lg p-2.5">
                <div className="text-xs text-white/30 mb-1">Replaced in redacted copy</div>
                <div className="flex items-center gap-2">
                  <span className="bg-black border border-white/25 text-transparent select-none rounded px-3 py-1 text-xs leading-5 inline-block" style={{minWidth:"100px"}}>████████</span>
                  <span className="text-xs text-white/25">[REDACTED]</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium transition-colors">✓ Include in redaction</button>
              <button className="px-3 py-2 rounded-lg border border-white/[0.08] text-xs text-white/40 hover:text-white/70 transition-colors">Skip</button>
            </div>
          </div>

          {/* Other items */}
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Other detected items</p>
            <div className="space-y-2">
              {[
                { label: "Full name",    src: "§1·p.1", cat: "Name",     checked: true },
                { label: "Email",        src: "§1·p.1", cat: "Contact",  checked: true },
                { label: "Phone",        src: "§1·p.1", cat: "Contact",  checked: false },
                { label: "SSN (partial)",src: "§4·p.4", cat: "ID",       checked: false },
                { label: "Date of birth",src: "§4·p.4", cat: "Personal", checked: false },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:border-white/10 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${r.checked ? "bg-emerald-400" : "bg-white/20"}`}/>
                    <span className="text-xs text-white/60">{r.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/30">{r.cat}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs border border-violet-500/25 text-violet-400">{r.src}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
