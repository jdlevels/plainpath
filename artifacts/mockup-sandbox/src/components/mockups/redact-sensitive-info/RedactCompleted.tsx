import { useState } from "react"

export function RedactCompleted() {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set(["name-1", "email-1", "phone-1", "account-1"]))

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const docSections = [
    { id: "§1", title: "Parties & Services", content: "Service agreement between Linmore Group LLC ("Client") and Brightfield Creative ("Provider"). Client contact: James R. Holloway, 742 Evergreen Terrace, Suite 4B, Springfield.", hasItem: true },
    { id: "§2", title: "Fees & Schedule", content: "Project fee: $12,000, due in three equal installments. Kickoff, mid-project, and delivery. Bank: First National, Account No. ••••7841.", hasItem: true },
    { id: "§3", title: "Intellectual Property", content: "All work created by the Provider is owned by the Client upon full payment. Provider retains rights to portfolio display. No third-party disclosure.", hasItem: false },
    { id: "§4", title: "Confidentiality", content: "Provider agrees not to disclose proprietary information. SSN on file: •••-••-••••. DOB: ••/••/••••. Obligations survive agreement for two years.", hasItem: true },
  ]

  const suggestedRedactions = [
    { id: "name-1",    label: "Full name",      category: "Name",      masked: "James R. H•••••••", reason: "Personal identifier in party clause", conf: "High", src: "§1·p.1" },
    { id: "email-1",  label: "Email address",   category: "Contact",   masked: "j.holloway@•••••.com", reason: "Direct contact detail", conf: "High", src: "§1·p.1" },
    { id: "phone-1",  label: "Phone number",    category: "Contact",   masked: "(555) •••-••••",   reason: "Personal phone number", conf: "High", src: "§1·p.1" },
    { id: "account-1",label: "Account number",  category: "Financial", masked: "Account No. ••••7841", reason: "Financial account reference", conf: "High", src: "§2·p.2" },
    { id: "ssn-1",    label: "SSN (partial)",   category: "ID",        masked: "•••-••-••••", reason: "Social Security number detected", conf: "Med",  src: "§4·p.4" },
    { id: "dob-1",    label: "Date of birth",   category: "Personal",  masked: "••/••/••••", reason: "Date of birth in personal data section", conf: "Med", src: "§4·p.4" },
  ]

  const confColor = (c: string) => c === "High" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : "text-amber-400 bg-amber-500/10 border-amber-500/25"
  const catColor = (c: string) => c === "Financial" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : c === "ID" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-white/50 bg-white/[0.05] border-white/10"

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
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
            {selected.size} items selected
          </div>
          <button className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 rounded-lg hover:bg-white/[0.07]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export Redacted
          </button>
          <button className="flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 rounded-lg hover:bg-white/[0.07]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
            Save
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document viewer 60% */}
        <div className="w-[60%] border-r border-white/[0.06] overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
              <span className="text-xs text-white/40">Service_Agreement_v3.pdf</span>
            </div>
            <span className="text-xs text-white/25">4 sections · 3 pages</span>
          </div>
          {docSections.map(s => (
            <div key={s.id} onClick={() => setActiveSection(s.id === activeSection ? null : s.id)}
              className={`rounded-xl p-4 border cursor-pointer transition-all ${activeSection === s.id ? "border-violet-500/50 bg-violet-500/[0.05]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50 font-mono">{s.id}</span>
                <span className="text-xs font-medium text-white/80">{s.title}</span>
                {s.hasItem && <div className="w-2 h-2 rounded-full bg-amber-400"/>}
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>

        {/* Right: Redaction control panel 40% */}
        <div className="w-[40%] overflow-y-auto p-4 space-y-4">
          {/* A. Redaction Summary */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">A. Redaction Summary</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                <span className="text-sm font-bold text-red-400">8</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">8 possible sensitive items found</p>
                <p className="text-xs text-white/40">across 4 categories · 4 pages</p>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-1">Names, contact details, financial account numbers, and personal identifiers were detected. Review each item before creating a redacted copy.</p>
            <p className="text-xs text-amber-400/80">Review before export. Original document is unchanged.</p>
          </div>

          {/* B. Detection / Confidence Strip */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">B. Detection Strip</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-1 rounded-full text-xs border border-white/10 text-white/60">8 items found</span>
              <span className="px-2 py-1 rounded-full text-xs border border-emerald-500/25 text-emerald-400">High confidence</span>
              <span className="px-2 py-1 rounded-full text-xs border border-white/10 text-white/60">4 categories</span>
              <span className="px-2 py-1 rounded-full text-xs border border-red-500/25 text-red-400">2 high-priority</span>
              <span className="px-2 py-1 rounded-full text-xs border border-violet-500/25 text-violet-400">{selected.size} selected</span>
            </div>
          </div>

          {/* C. Suggested Redactions */}
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">C. Suggested Redactions</p>
            <div className="space-y-2">
              {suggestedRedactions.map(r => (
                <div key={r.id} className={`rounded-xl p-3 border transition-all ${selected.has(r.id) ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)}
                      className="mt-0.5 accent-emerald-500 cursor-pointer"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-xs font-medium text-white/90">{r.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs border ${catColor(r.category)}`}>{r.category}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs border ${confColor(r.conf)}`}>{r.conf}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-xs border border-violet-500/30 text-violet-400 ml-auto">{r.src}</span>
                      </div>
                      <p className="text-xs text-white/40 mb-1">{r.reason}</p>
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

          {/* D. Redaction Categories */}
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">D. Redaction Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {["All (8)", "Names (2)", "Contact (2)", "Financial (2)", "IDs (1)", "Dates (1)"].map((c, i) => (
                <button key={c} className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${i === 0 ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-white/[0.07] text-white/40 hover:border-white/15"}`}>{c}</button>
              ))}
            </div>
          </div>

          {/* E. Review Queue */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">E. Review Queue</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Selected for redaction</span><span className="text-emerald-400 font-medium">{selected.size}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Needs confirmation</span><span className="text-amber-400 font-medium">2</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Ignored / left visible</span><span className="text-white/30">{suggestedRedactions.length - selected.size}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Manually added</span><span className="text-white/30">0</span>
              </div>
            </div>
          </div>

          {/* F. Manual Redaction Tools */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">F. Manual Redaction Tools</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: "✏️", label: "Select text to redact" },
                { icon: "➕", label: "Add manual region" },
                { icon: "↩️", label: "Undo last redaction" },
                { icon: "🗑️", label: "Clear all manual" },
              ].map(t => (
                <button key={t.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-xs text-white/50 hover:text-white/70 hover:border-white/15 transition-colors">
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
            <button className="mt-2 w-full py-2 rounded-lg border border-violet-500/30 text-xs text-violet-400 hover:bg-violet-500/10 transition-colors">
              Preview redacted copy
            </button>
          </div>

          {/* G. Export */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">G. Export / Save</p>
            <div className="space-y-2">
              <button className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-colors">Export Redacted PDF</button>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/50 hover:border-white/15 transition-colors">Export DOCX</button>
                <button className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/50 hover:border-white/15 transition-colors">Download copy</button>
              </div>
              <p className="text-xs text-white/25 text-center">Original document is not modified. Redactions create a separate copy.</p>
            </div>
          </div>

          {/* H. Source Traceability */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">H. Source Traceability</p>
            <div className="flex flex-wrap gap-1.5">
              {["§1·p.1 ×3", "§2·p.2 ×2", "§4·p.4 ×2", "§3·p.3"].map(c => (
                <button key={c} className="px-2 py-1 rounded-lg text-xs border border-violet-500/25 text-violet-400 hover:bg-violet-500/10 transition-colors">{c}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
