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
        <span className="text-sm text-white/60">Service_Agreement_v3.pdf</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs bg-violet-500/10 border border-violet-500/30 px-3 py-1.5 rounded-lg text-violet-300">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400"/>
          Sensitive item active — §1 · Names
        </div>
      </header>

      {/* Evidence banner */}
      <div className="border-b border-white/[0.06] bg-[#0e0e12] px-4 py-3 flex items-start justify-between gap-4 shrink-0">
        <div className="flex-1 flex gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-white/30 uppercase tracking-widest">Detected as</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-white/10 text-white/50 bg-white/[0.04]">Full name</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-red-500/30 text-red-400">Name</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-emerald-500/25 text-emerald-400">High confidence</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                <span className="text-xs text-white/30">In document:</span>
                <span className="text-xs font-medium text-red-300">James R. Holloway</span>
              </div>
              <span className="text-white/20 text-xs">→</span>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                <span className="text-xs text-white/30">Redacted as:</span>
                <div className="flex items-center gap-1">
                  <div className="w-14 h-3 bg-black rounded-sm border border-white/20"/>
                  <span className="text-xs text-white/30">[NAME REDACTED]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button className="text-white/25 hover:text-white/60 p-1 transition-colors mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document viewer — active section highlighted */}
        <div className="w-[60%] border-r border-white/[0.06] overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs text-white/40">Service_Agreement_v3.pdf</span>
            <span className="text-xs text-white/20">·</span>
            <span className="text-xs text-violet-400">§1·p.1 highlighted left</span>
          </div>

          {/* Active section with highlight */}
          <div className="rounded-xl border-2 border-violet-500/60 bg-violet-500/[0.06] p-4 relative">
            <div className="absolute -top-3 left-4">
              <span className="px-2 py-0.5 rounded-full text-xs border border-violet-500/50 bg-[#0c0c0f] text-violet-400">
                ● Source — §1·p.1 (original)
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50 font-mono">§1 · p.1</span>
              <span className="text-xs font-medium text-white/80">Parties & Services</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Service agreement between Linmore Group LLC ("Client") and Brightfield Creative ("Provider") for design services, commencing June 2025. Client contact:{" "}
              <span className="bg-red-500/30 border border-red-500/40 text-red-300 px-1.5 py-0.5 rounded font-medium mx-0.5">
                James R. Holloway
              </span>
              , 742 Evergreen Terrace, Suite 4B, Springfield.
            </p>
            <div className="mt-3 bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2">
              <p className="text-xs text-white/30 font-mono">"…Client contact: <span className="text-red-300">James R. Holloway</span>…"</p>
            </div>
          </div>

          {/* Other sections dimmed */}
          {[
            { id: "§2", title: "Fees & Schedule" },
            { id: "§3", title: "Intellectual Property" },
            { id: "§4", title: "Confidentiality" },
          ].map(s => (
            <div key={s.id} className="rounded-xl p-4 border border-white/[0.04] bg-white/[0.01] opacity-40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50 font-mono">{s.id}</span>
                <span className="text-xs font-medium text-white/80">{s.title}</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 bg-white/[0.04] rounded-full" style={{width:"80%"}}/>
                <div className="h-2 bg-white/[0.04] rounded-full" style={{width:"65%"}}/>
              </div>
            </div>
          ))}

          <p className="text-xs text-white/25 px-1">Section 1 of 4 · §1·p.1 highlighted above</p>
        </div>

        {/* Right: Active redaction card */}
        <div className="w-[40%] overflow-y-auto p-4 space-y-4">
          {/* Active card */}
          <div className="rounded-xl border-2 border-violet-500/50 bg-violet-500/[0.06] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400"/>
                <span className="text-sm font-medium text-white">Full name</span>
              </div>
              <button className="text-xs text-white/40 hover:text-white/70 border border-white/[0.08] px-2 py-1 rounded-lg">All items</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-white/10 text-white/50">Name</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-emerald-500/25 text-emerald-400">High confidence</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs border border-violet-500/30 text-violet-400">§1·p.1</span>
            </div>
            <div className="bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-2 bg-white/20 rounded-sm"/>
                <span className="text-xs text-white/30 font-mono">James R. H•••••••</span>
              </div>
            </div>

            {/* Before / After */}
            <div className="space-y-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <div className="text-xs text-white/30 mb-1">Before</div>
                <span className="text-xs font-medium text-red-300">James R. Holloway</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                <div className="text-xs text-white/30 mb-1">After (redacted)</div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-3 bg-black rounded-sm border border-white/25"/>
                  <span className="text-xs text-white/30">[NAME REDACTED]</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium transition-colors">
                ✓ Include in redaction
              </button>
              <button className="px-3 py-2 rounded-lg border border-white/[0.08] text-xs text-white/40 hover:text-white/70 transition-colors">
                Skip
              </button>
            </div>
          </div>

          {/* Other items list */}
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Other items</p>
            <div className="space-y-2">
              {[
                { label: "Email address", src: "§1·p.1", cat: "Contact" },
                { label: "Account number", src: "§2·p.2", cat: "Financial" },
                { label: "SSN (partial)",  src: "§4·p.4", cat: "ID" },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:border-white/10 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"/>
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
