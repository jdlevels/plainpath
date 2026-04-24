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
        {/* ── LEFT: Paper document surface ── */}
        <div className="w-[60%] border-r border-white/[0.06] overflow-y-auto bg-[#111115] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-white/35">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
              Medical_Intake_Form.pdf
            </div>
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">low scan quality</span>
          </div>

          {/* Paper page */}
          <div className="bg-white rounded-lg shadow-2xl shadow-black/60 mx-auto max-w-[600px] overflow-hidden">
            {/* Page header */}
            <div className="bg-gray-50 border-b border-gray-200 p-6 text-center">
              <p className="font-bold text-gray-900 text-base tracking-wide">PATIENT INTAKE FORM</p>
              <p className="text-gray-500 text-xs mt-1">Medical_Intake_Form.pdf · Scanned document</p>
            </div>

            {/* §1 — readable, items highlighted */}
            <div className="p-6 font-serif text-[13px] leading-7 text-gray-700 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider">§1 — Patient Information</p>
                <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">✓ readable</span>
              </div>
              <p>
                Patient name:{" "}
                <span className="bg-amber-200 border border-amber-400 rounded px-0.5 text-amber-900 font-medium">Sarah M. Crawford</span>,
                DOB:{" "}
                <span className="bg-amber-200 border border-amber-400 rounded px-0.5 text-amber-900 font-medium">14/03/1987</span>.
                Insurance provider: BlueCross BlueShield.
                Policy reference:{" "}
                <span className="bg-amber-200 border border-amber-400 rounded px-0.5 text-amber-900 font-medium">BC-2024-91841</span>.
                Contact:{" "}
                <span className="bg-amber-200 border border-amber-400 rounded px-0.5 text-amber-900 font-medium">(555) 204-7711</span>.
              </p>
            </div>

            {/* §2 — low quality / unreadable */}
            <div className="p-6 border-b border-gray-200 bg-amber-50/60">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">§2 — Medical History</p>
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  low scan quality
                </span>
              </div>
              {/* Blurry/degraded text simulation */}
              <div className="space-y-2 opacity-40 blur-[0.4px] select-none">
                <div className="h-3 bg-gray-300 rounded" style={{width:"92%"}}/>
                <div className="h-3 bg-gray-300 rounded" style={{width:"78%"}}/>
                <div className="h-3 bg-gray-300 rounded" style={{width:"85%"}}/>
                <div className="h-3 bg-gray-300 rounded" style={{width:"67%"}}/>
              </div>
              <p className="text-xs text-amber-600 mt-3 italic">Low scan quality — sensitive items in this section could not be reliably detected</p>
            </div>

            {/* §3 — low quality */}
            <div className="p-6 border-b border-gray-200 bg-amber-50/60">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">§3 — Treatment Plan</p>
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  low scan quality
                </span>
              </div>
              <div className="space-y-2 opacity-30 blur-[0.6px] select-none">
                <div className="h-3 bg-gray-300 rounded" style={{width:"88%"}}/>
                <div className="h-3 bg-gray-300 rounded" style={{width:"73%"}}/>
                <div className="h-3 bg-gray-300 rounded" style={{width:"80%"}}/>
              </div>
              <p className="text-xs text-amber-600 mt-3 italic">Low scan quality — could not detect sensitive items in this section</p>
            </div>

            {/* §4 — low quality */}
            <div className="p-6 bg-amber-50/60">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">§4 — Signature &amp; Authorization</p>
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  low scan quality
                </span>
              </div>
              <div className="space-y-2 opacity-25 blur-[0.8px] select-none">
                <div className="h-3 bg-gray-300 rounded" style={{width:"60%"}}/>
                <div className="h-8 bg-gray-200 rounded mt-4" style={{width:"45%"}}/>
              </div>
              <p className="text-xs text-amber-600 mt-3 italic">Signature area — manual review required</p>
            </div>
          </div>

          <p className="text-center text-xs text-white/25 mt-4">1 section readable · 3 sections could not be reliably processed</p>
        </div>

        {/* ── RIGHT: Partial results panel ── */}
        <div className="w-[40%] overflow-y-auto p-5 space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Partial Detection Results</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="px-2 py-1 rounded-full text-xs border border-emerald-500/20 text-emerald-400">1 section readable</span>
              <span className="px-2 py-1 rounded-full text-xs border border-amber-500/25 text-amber-400">3 sections unprocessed</span>
              <span className="px-2 py-1 rounded-full text-xs border border-white/10 text-white/40">4 items detected</span>
            </div>

            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">What was readable</p>
            <div className="space-y-2 mb-4">
              {[
                { label: "Full name",        masked: "Sarah M. C•••••••", src: "§1·p.1" },
                { label: "Date of birth",    masked: "14/••/••••", src: "§1·p.1" },
                { label: "Insurance ref",    masked: "BC-2024-•••••", src: "§1·p.1" },
                { label: "Phone number",     masked: "(555) •••-••••", src: "§1·p.1" },
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

            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">What could not be verified</p>
            <div className="space-y-1.5 mb-2">
              {["§2 · Medical History", "§3 · Treatment Plan", "§4 · Signature & Authorization"].map(s => (
                <div key={s} className="flex items-center gap-2 text-xs text-amber-400/70">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  {s}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/25 italic">Document is a scanned image. A digital text-based PDF would produce full detection.</p>
          </div>

          {/* Recommended next steps */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Recommended next steps</p>
            <div className="space-y-2.5">
              {[
                { icon: "📄", label: "Upload a clearer PDF", sub: "A digital text-based PDF produces full detection confidence" },
                { icon: "📋", label: "Upload the original file", sub: "Source file (not a scan) processes fully" },
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
    </div>
  )
}
