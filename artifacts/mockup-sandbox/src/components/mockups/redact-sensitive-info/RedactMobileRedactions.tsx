import { useState } from "react"

export function RedactMobileRedactions() {
  const [tab, setTab] = useState<"redactions" | "document">("redactions")
  const [selected, setSelected] = useState<Set<string>>(new Set(["name-1", "email-1", "account-1"]))

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const items = [
    { id: "name-1",    label: "Full name",      cat: "Name",      masked: "James R. H•••••••", src: "§1·p.1", high: true },
    { id: "email-1",  label: "Email address",   cat: "Contact",   masked: "j.•••••••@domain.com", src: "§1·p.1", high: true },
    { id: "account-1",label: "Account number",  cat: "Financial", masked: "Account ••••7841", src: "§2·p.2", high: true },
    { id: "ssn-1",    label: "SSN (partial)",   cat: "ID",        masked: "•••-••-••••", src: "§4·p.4", high: false },
    { id: "dob-1",    label: "Date of birth",   cat: "Personal",  masked: "••/••/••••", src: "§4·p.4", high: false },
  ]

  const catColor = (c: string) => c === "Financial" ? "text-amber-400 border-amber-500/25" : c === "ID" ? "text-red-400 border-red-500/25" : "text-white/40 border-white/10"

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
        <button onClick={() => setTab("redactions")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${tab === "redactions" ? "border-violet-500 text-violet-300 bg-violet-500/[0.04]" : "border-transparent text-white/35"}`}>
          <div className="flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" stroke="none"/><path d="M9 7h6M5 17h14"/></svg>
            Redactions
          </div>
        </button>
        <button onClick={() => setTab("document")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${tab === "document" ? "border-violet-500 text-violet-300 bg-violet-500/[0.04]" : "border-transparent text-white/35"}`}>
          <div className="flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
            Document
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Redaction summary */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Redaction Summary</p>
          <p className="text-xs text-white/60 leading-relaxed mb-2">
            <span className="font-medium text-white/80">8 possible sensitive items found</span> across 4 categories. Review each before creating a redacted copy.
          </p>
          <p className="text-xs text-amber-400/80">Review before export. Original document is unchanged.</p>
        </div>

        {/* Detection strip */}
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-1 rounded-full text-xs border border-white/10 text-white/50">8 items found</span>
          <span className="px-2 py-1 rounded-full text-xs border border-emerald-500/25 text-emerald-400">High confidence</span>
          <span className="px-2 py-1 rounded-full text-xs border border-red-500/25 text-red-400">2 high-priority</span>
          <span className="px-2 py-1 rounded-full text-xs border border-violet-500/25 text-violet-400">{selected.size} selected</span>
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {["All (8)", "Names", "Contact", "Financial", "IDs", "Dates"].map((c, i) => (
            <button key={c} className={`px-2.5 py-1 rounded-lg text-xs border transition-colors shrink-0 ${i === 0 ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-white/[0.07] text-white/40"}`}>{c}</button>
          ))}
        </div>

        {/* Suggested redactions */}
        <div>
          <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Suggested Redactions</p>
          <div className="space-y-2">
            {items.map(r => (
              <div key={r.id} className={`rounded-xl p-3 border transition-all ${selected.has(r.id) ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="mt-0.5 accent-emerald-500"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-medium text-white/90">{r.label}</span>
                      {r.high && <div className="w-1.5 h-1.5 rounded-full bg-red-400"/>}
                      <span className={`px-1.5 py-0.5 rounded-full text-xs border ${catColor(r.cat)}`}>{r.cat}</span>
                      <span className="ml-auto px-1.5 py-0.5 rounded text-xs border border-violet-500/25 text-violet-400">{r.src}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/30 rounded-lg px-2 py-1">
                      <div className="w-3 h-2 bg-white/20 rounded-sm"/>
                      <span className="text-xs text-white/30 font-mono">{r.masked}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review queue */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Review Queue</p>
          <div className="space-y-1.5">
            {[
              ["Selected for redaction", selected.size.toString(), "text-emerald-400"],
              ["Needs confirmation", "2", "text-amber-400"],
              ["Left visible", String(items.length - selected.size), "text-white/30"],
              ["Manually added", "0", "text-white/30"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="flex items-center justify-between text-xs">
                <span className="text-white/45">{l as string}</span>
                <span className={`font-medium ${c as string}`}>{v as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="space-y-2 pb-2">
          <button className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors">Export Redacted PDF</button>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/50">Preview redacted</button>
            <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/50">Save</button>
          </div>
          <p className="text-xs text-white/20 text-center">Original is unchanged. Redactions create a separate copy.</p>
        </div>
      </div>
    </div>
  )
}
