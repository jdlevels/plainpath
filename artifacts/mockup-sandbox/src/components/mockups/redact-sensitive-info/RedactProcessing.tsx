export function RedactProcessing() {
  const steps = [
    { label: "Reading document structure", done: true },
    { label: "Detecting names and contact details", done: true },
    { label: "Finding financial or account details", done: true },
    { label: "Checking IDs, dates, and personal data", active: true },
    { label: "Grouping sensitive items by category", pending: true },
    { label: "Preparing redaction review", pending: true },
  ]

  const leftSections = [
    { id: "§1", title: "Parties & Services", pages: "p.1", read: true },
    { id: "§2", title: "Fees & Schedule", pages: "p.2", read: true },
    { id: "§3", title: "Personal Information", pages: "p.3", active: true },
    { id: "§4", title: "Account Details", pages: "p.4", active: true },
    { id: "§5", title: "Signatures & Execution", pages: "p.5", pending: true },
  ]

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Nav */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold">P</div>
        <span className="text-sm text-white/50">PlainPath</span>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-sm text-white/80">Redact Sensitive Info</span>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>
          <span className="text-xs text-amber-300">Scanning document…</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: document preview */}
        <div className="w-[60%] border-r border-white/[0.06] overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="text-xs text-white/40">Service_Agreement_v3.pdf</span>
            <span className="text-xs text-white/20">·</span>
            <span className="text-xs text-white/30">5 sections · 2.4 MB</span>
          </div>

          {leftSections.map(s => (
            <div key={s.id} className={`rounded-xl p-4 border transition-all ${
              s.active ? "border-violet-500/40 bg-violet-500/[0.05]" :
              s.read ? "border-white/[0.06] bg-white/[0.02]" :
              "border-white/[0.04] bg-white/[0.01] opacity-50"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 font-mono">{s.id} · {s.pages}</span>
                  <span className="text-xs text-white/70 font-medium">{s.title}</span>
                </div>
                {s.read && !s.active && <span className="text-xs text-white/25">read</span>}
                {s.active && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>
                    scanning…
                  </span>
                )}
              </div>
              {s.read && (
                <div className="space-y-1.5">
                  <div className={`h-2 rounded-full ${s.active ? "bg-violet-500/20" : "bg-white/[0.05]"}`} style={{width:"88%"}}/>
                  <div className={`h-2 rounded-full ${s.active ? "bg-violet-500/20" : "bg-white/[0.05]"}`} style={{width:"72%"}}/>
                  <div className={`h-2 rounded-full ${s.active ? "bg-violet-500/20" : "bg-white/[0.05]"}`} style={{width:"60%"}}/>
                </div>
              )}
              {!s.read && (
                <div className="space-y-1.5 opacity-40">
                  <div className="h-2 bg-white/[0.03] rounded-full" style={{width:"80%"}}/>
                  <div className="h-2 bg-white/[0.03] rounded-full" style={{width:"65%"}}/>
                </div>
              )}
            </div>
          ))}
          <div className="text-xs text-white/25 px-1">3 of 5 sections processed</div>
        </div>

        {/* Right: progress panel */}
        <div className="w-[40%] overflow-y-auto p-5 space-y-5">
          {/* File badges */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              </svg>
              <span className="text-xs text-white/60">Service_Agreement_v3.pdf</span>
              <span className="text-xs text-white/25 ml-auto">5 pages · 2.4 MB</span>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Detection in progress</span>
              <span className="text-xs text-white/40">4 of 6 steps</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{width:"66%"}}/>
            </div>
            <div className="text-xs text-white/35 mb-4">~14 seconds remaining</div>

            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  {s.done ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  ) : s.active ? (
                    <div className="w-5 h-5 rounded-full border border-violet-500/60 bg-violet-500/10 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"/>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/10 shrink-0"/>
                  )}
                  <span className={`text-xs ${s.done ? "text-white/60" : s.active ? "text-white/90" : "text-white/25"}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preview of what will be included */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Your redaction review will include</p>
            <div className="grid grid-cols-2 gap-2">
              {["Sensitive items by type", "Detection confidence", "Categories found", "Manual redaction tools",
                "Review before export", "Source-backed items"].map(i => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-white/40">
                  <div className="w-1 h-1 rounded-full bg-violet-400/40 shrink-0"/>
                  {i}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/25 text-center">Sensitive information detection — review before export. Not legal advice.</p>
        </div>
      </div>

      {/* Footer progress */}
      <div className="h-8 border-t border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <span className="text-xs text-white/25">3 of 5 sections processed</span>
      </div>
    </div>
  )
}
