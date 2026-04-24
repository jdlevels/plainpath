export function RedactLowConf() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Nav */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold">P</div>
        <span className="text-sm text-white/50">PlainPath</span>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-sm text-white/80">Redact Sensitive Info</span>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
          </svg>
          <span className="text-xs text-amber-300">Partial detection — low scan quality</span>
        </div>
      </header>

      {/* Amber warning banner */}
      <div className="border-b border-amber-500/20 bg-amber-500/[0.05] px-5 py-3 shrink-0">
        <div className="flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 mt-0.5 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-300">PlainPath could detect part of this document, but scan quality limits redaction confidence.</p>
            <p className="text-xs text-amber-400/70 mt-0.5">The original PDF appears to be a scanned image. Sections 2–4 could not be reliably processed. Manual review is required before exporting.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document viewer */}
        <div className="w-[60%] border-r border-white/[0.06] overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
              <span className="text-xs text-white/40">Medical_Intake_Form.pdf</span>
            </div>
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">low scan quality</span>
          </div>

          {/* Readable section */}
          <div className="rounded-xl p-4 border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50 font-mono">§1 · p.1</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-white/80">Patient Information</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">readable</span>
              </div>
            </div>
            <p className="text-xs text-white/55 leading-relaxed">
              Patient name: <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded">Sarah M. Crawford</span>,
              DOB: <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded">••/••/1987</span>.
              Insurance: BlueCross Ref No. <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded">BC-2024-91841</span>.
            </p>
          </div>

          {/* Low quality sections */}
          {[
            { id: "§2", title: "Medical History" },
            { id: "§3", title: "Treatment Plan" },
            { id: "§4", title: "Signature & Authorization" },
          ].map(s => (
            <div key={s.id} className="rounded-xl p-4 border border-amber-500/20 bg-amber-500/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50 font-mono">{s.id}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-white/60">{s.title}</span>
                  <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><path d="M3 3l18 18M4.12 4.12A10.07 10.07 0 002 12c0 5.52 4.48 10 10 10a9.95 9.95 0 007.88-3.88"/></svg>
                    low scan quality
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 opacity-30">
                <div className="h-2 bg-amber-500/20 rounded-full" style={{width:"70%"}}/>
                <div className="h-2 bg-amber-500/20 rounded-full" style={{width:"55%"}}/>
                <div className="h-2 bg-amber-500/20 rounded-full" style={{width:"80%"}}/>
              </div>
              <p className="text-xs text-amber-400/60 mt-2">Low scan quality — could not reliably detect sensitive information in this section</p>
            </div>
          ))}
          <div className="text-xs text-white/25 px-1">1 section readable · 3 sections unprocessed</div>
        </div>

        {/* Right: Partial results panel */}
        <div className="w-[40%] overflow-y-auto p-5 space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Partial Detection Results</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="px-2 py-1 rounded-full text-xs border border-emerald-500/20 text-emerald-400">1 section compared</span>
              <span className="px-2 py-1 rounded-full text-xs border border-amber-500/25 text-amber-400">3 sections unprocessed</span>
              <span className="px-2 py-1 rounded-full text-xs border border-white/10 text-white/40">3 items found</span>
            </div>

            <div className="mb-3">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-2">What was readable</p>
              <div className="space-y-2">
                {[
                  { label: "Full name", masked: "Sarah M. C•••••••", src: "§1·p.1" },
                  { label: "Date of birth", masked: "••/••/1987", src: "§1·p.1" },
                  { label: "Insurance ref", masked: "BC-2024-•••••", src: "§1·p.1" },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
                      <span className="text-xs text-white/70">{r.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/30 font-mono">{r.masked}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs border border-violet-500/25 text-violet-400">{r.src}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-2">What could not be verified</p>
              <div className="space-y-1.5">
                {["§2 · Medical History", "§3 · Treatment Plan", "§4 · Signature & Authorization"].map(s => (
                  <div key={s} className="flex items-center gap-2 text-xs text-amber-400/70">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    {s} — low scan quality in original
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/30 mt-2 italic">Document causing the issue: scanned image PDF. A digital text-based version would improve detection.</p>
            </div>
          </div>

          {/* Recommended next steps */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Recommended next steps</p>
            <div className="space-y-2.5">
              {[
                { icon: "📄", label: "Upload a clearer PDF", sub: "A digital text-based PDF produces higher confidence" },
                { icon: "📋", label: "Upload the original file", sub: "The source file (not a scan) will process fully" },
                { icon: "✍️", label: "Use a text-based version", sub: "Export from Word/Docs, not a scanner" },
                { icon: "✅", label: "Continue with partial results", sub: "Redact what was found, manually review the rest" },
                { icon: "💬", label: "Ask This Document", sub: "Ask specific questions about unprocessed sections" },
              ].map(s => (
                <button key={s.label} className="w-full flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-white/10 text-left transition-colors">
                  <span className="text-base mt-0.5">{s.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-white/80">{s.label}</div>
                    <div className="text-xs text-white/35 mt-0.5">{s.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-8 border-t border-white/[0.06] flex items-center px-4 shrink-0">
        <span className="text-xs text-white/25">1 section readable · 3 sections not processed · manual review required</span>
      </div>
    </div>
  )
}
