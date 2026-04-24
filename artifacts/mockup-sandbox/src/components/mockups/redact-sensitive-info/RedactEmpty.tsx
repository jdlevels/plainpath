export function RedactEmpty() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Nav */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold">P</div>
        <span className="text-sm text-white/50">PlainPath</span>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-sm text-white/80">Redact Sensitive Info</span>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-10 max-w-3xl mx-auto w-full">
        {/* Icon + headline */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-red-400">
              <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" stroke="none"/>
              <path d="M9 7h6M5 17h14M7 12V7a5 5 0 0110 0v5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Find and redact sensitive information.</h1>
          <p className="text-sm text-white/50 max-w-lg leading-relaxed">
            Upload, paste, or scan a document. PlainPath identifies possible sensitive details, lets you review each item, and helps create a redacted copy for safer sharing.
          </p>
        </div>

        {/* Upload zone */}
        <div className="border border-dashed border-white/15 rounded-xl p-8 mb-4 text-center hover:border-violet-500/40 transition-colors cursor-pointer bg-white/[0.02]">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-white/40">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
          </div>
          <p className="text-sm text-white/70 font-medium mb-1">Upload PDF or DOCX</p>
          <p className="text-xs text-white/30">Up to 50 MB · PDF, DOCX</p>
          <button className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors">Choose file</button>
        </div>

        {/* Alt inputs */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "📋", label: "Paste Text", sub: "Paste document content" },
            { icon: "📷", label: "Scan Photo", sub: "Scan a physical document" },
            { icon: "🔗", label: "Import Link", sub: "From URL or cloud storage" },
          ].map(a => (
            <button key={a.label} className="border border-white/[0.07] rounded-xl p-4 text-left hover:border-white/15 transition-colors bg-white/[0.02]">
              <div className="text-lg mb-1">{a.icon}</div>
              <div className="text-xs font-medium text-white/80">{a.label}</div>
              <div className="text-xs text-white/35 mt-0.5">{a.sub}</div>
            </button>
          ))}
        </div>

        {/* Works well with */}
        <div className="mb-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Works well with</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["📄 Contracts", "Term sheets, agreements, NDAs"],
              ["📋 Forms", "Applications, intake, registration"],
              ["📮 Letters", "Official notices, correspondence"],
              ["🧾 Invoices", "Bills, receipts, financial records"],
              ["⚖️ Legal documents", "Court filings, affidavits"],
              ["👥 HR documents", "Employee records, onboarding"],
              ["💰 Financial records", "Statements, tax documents"],
              ["🏥 Medical / Insurance", "Health forms, claims, coverage"],
            ].map(([label, sub]) => (
              <div key={label as string} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white/80">{label as string}</div>
                  <div className="text-xs text-white/35 mt-0.5">{sub as string}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What gets detected */}
        <div className="mb-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">What gets detected</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {["Names & identifiers", "Addresses & locations", "Phone & email", "Account & financial details",
              "ID & reference numbers", "Dates of birth", "Signatures", "Medical identifiers"].map(i => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                <div className="w-1 h-1 rounded-full bg-violet-400/50"/>
                {i}
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border border-amber-500/20 rounded-xl p-4 bg-amber-500/[0.04]">
          <div className="flex gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            <p className="text-xs text-white/50 leading-relaxed">
              PlainPath provides <span className="text-white/70">possible sensitive information detection</span> — review before redacting. Redacted copy is separate from your original. Does not replace manual review for high-sensitivity documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
