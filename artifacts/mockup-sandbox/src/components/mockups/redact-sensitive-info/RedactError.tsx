export function RedactError() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Nav */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold">P</div>
        <span className="text-sm text-white/50">PlainPath</span>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-sm text-white/80">Redact Sensitive Info</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto w-full">
        {/* Error icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-red-400">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4m0 4h.01"/>
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Sensitive information scan could not be completed.</h2>
        <p className="text-sm text-white/45 mb-8 leading-relaxed">
          The file could not be processed. This may be due to encryption, an unsupported format, or a corrupted upload.
        </p>

        {/* File status */}
        <div className="w-full border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] text-left">
            <span className="text-xs text-white/30 uppercase tracking-widest">File uploaded</span>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs font-medium text-white/80">Contract_ENCRYPTED.pdf</div>
              <div className="text-xs text-red-400 mt-0.5">Encrypted or password-protected — could not read</div>
            </div>
          </div>
        </div>

        {/* Primary actions */}
        <div className="flex gap-3 w-full mb-6">
          <button className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Try again
          </button>
          <button className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:border-white/15 transition-colors flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 15V3"/></svg>
            Upload different file
          </button>
        </div>

        {/* What you can try instead */}
        <div className="w-full border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] text-left">
            <span className="text-xs text-white/30 uppercase tracking-widest">What you can try instead</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[
              { icon: "🔓", label: "Remove password protection", sub: "Open in your PDF viewer, remove the password, re-export, and re-upload." },
              { icon: "📋", label: "Use a text-based version", sub: "A digital PDF (not a scan) will process more reliably." },
              { icon: "💬", label: "Ask This Document", sub: "Ask specific questions about the document you can open." },
              { icon: "🔍", label: "Analyze a Document", sub: "Extract key terms and clauses from a single document instead." },
            ].map(a => (
              <button key={a.label} className="w-full flex items-start gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
                <span className="text-lg mt-0.5">{a.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white/80">{a.label}</div>
                  <div className="text-xs text-white/35 mt-0.5 leading-relaxed">{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
