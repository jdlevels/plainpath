import { useState } from "react"
import {
  EyeOff, ArrowLeft, Download, Shield, Check,
  User, Hash, Mail, Phone, MapPin, CreditCard, ChevronDown,
  CheckCircle2, AlertCircle, Loader2,
} from "lucide-react"

const PII_CATEGORIES = [
  { id: "names",    label: "Names",            icon: User,       count: 4,  color: "text-blue-400",   bg: "bg-blue-900/30 border-blue-800/50"   },
  { id: "ssn",      label: "SSN / Tax IDs",    icon: Hash,       count: 2,  color: "text-red-400",    bg: "bg-red-900/30 border-red-800/50"     },
  { id: "email",    label: "Email Addresses",  icon: Mail,       count: 3,  color: "text-violet-400", bg: "bg-violet-900/30 border-violet-800/50"},
  { id: "phone",    label: "Phone Numbers",    icon: Phone,      count: 2,  color: "text-amber-400",  bg: "bg-amber-900/30 border-amber-800/50" },
  { id: "address",  label: "Addresses",        icon: MapPin,     count: 3,  color: "text-emerald-400",bg: "bg-emerald-900/30 border-emerald-800/50"},
  { id: "financial",label: "Financial Data",   icon: CreditCard, count: 1,  color: "text-orange-400", bg: "bg-orange-900/30 border-orange-800/50"},
]

const DOC_LINES = [
  { text: "This Employment Agreement is entered into between ", highlight: null },
  { text: "Jane M. Doe", highlight: "name", label: "Name" },
  { text: " (\"Employee\") and TechCorp Incorporated.", highlight: null },
  { text: "", highlight: null },
  { text: "Employee SSN: ", highlight: null },
  { text: "***-**-6789", highlight: "ssn", label: "SSN" },
  { text: "   Date of Birth: ", highlight: null },
  { text: "March 15, 1988", highlight: "dob", label: "DOB" },
  { text: "", highlight: null },
  { text: "Home Address: ", highlight: null },
  { text: "1842 Oak Street, Apt 3B, San Francisco, CA 94102", highlight: "address", label: "Address" },
  { text: "", highlight: null },
  { text: "Contact: ", highlight: null },
  { text: "jane.doe@gmail.com", highlight: "email", label: "Email" },
  { text: "  |  ", highlight: null },
  { text: "(415) 555-0147", highlight: "phone", label: "Phone" },
]

const HIGHLIGHT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  name:    { bg: "bg-blue-900/50",    text: "text-blue-200",    border: "border-blue-700/60"    },
  ssn:     { bg: "bg-red-900/60",     text: "text-red-200",     border: "border-red-700/60"     },
  dob:     { bg: "bg-amber-900/50",   text: "text-amber-200",   border: "border-amber-700/60"   },
  address: { bg: "bg-emerald-900/50", text: "text-emerald-200", border: "border-emerald-700/60" },
  email:   { bg: "bg-violet-900/50",  text: "text-violet-200",  border: "border-violet-700/60"  },
  phone:   { bg: "bg-amber-900/50",   text: "text-amber-200",   border: "border-amber-700/60"   },
}

export function Redact() {
  const [redacted, setRedacted] = useState<Record<string, boolean>>({
    names: true, ssn: true, email: true, phone: false, address: false, financial: false,
  })
  const [showRedacted, setShowRedacted] = useState(false)

  const toggleCategory = (id: string) => setRedacted(r => ({ ...r, [id]: !r[id] }))
  const redactedCount = Object.values(redacted).filter(Boolean).length
  const totalPii = PII_CATEGORIES.reduce((sum, c) => sum + c.count, 0)
  const redactedPii = PII_CATEGORIES.filter(c => redacted[c.id]).reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-red-900/50 border border-red-700/40 flex items-center justify-center shrink-0">
          <EyeOff className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Redact</span>
          <h1 className="text-sm font-bold text-slate-100 truncate">employment_agreement_final.pdf</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <span className="text-xs font-bold text-slate-300">{redactedPii}/{totalPii}</span>
            <span className="text-[10px] text-slate-500">PII redacted</span>
          </div>
          <button
            onClick={() => setShowRedacted(!showRedacted)}
            className={`p-1.5 rounded-lg border transition-colors ${showRedacted ? "border-violet-700 bg-violet-900/40 text-violet-400" : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors">
            <Download className="w-3.5 h-3.5" /> Download Redacted
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto">
          <div className="px-3 py-4 border-b border-slate-800/80">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-3">PII Detected</p>
            <div className="space-y-1.5">
              {PII_CATEGORIES.map(cat => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl border cursor-pointer transition-colors ${
                    redacted[cat.id] ? cat.bg : "border-slate-800 bg-slate-800/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={redacted[cat.id] ?? false}
                    onChange={() => toggleCategory(cat.id)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                    redacted[cat.id] ? "bg-red-600 border-red-600" : "border-slate-600"
                  }`}>
                    {redacted[cat.id] && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <cat.icon className={`w-3.5 h-3.5 shrink-0 ${redacted[cat.id] ? cat.color : "text-slate-600"}`} />
                  <span className={`text-xs font-medium flex-1 ${redacted[cat.id] ? "text-slate-200" : "text-slate-600"}`}>{cat.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${redacted[cat.id] ? "bg-slate-900/50 text-slate-400" : "bg-slate-800 text-slate-600"}`}>
                    {cat.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="px-3 py-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              {redactedCount === PII_CATEGORIES.length
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              }
              <span className="text-xs text-slate-400">
                {redactedCount === PII_CATEGORIES.length ? "All PII protected" : `${PII_CATEGORIES.length - redactedCount} categories exposed`}
              </span>
            </div>
            <button
              onClick={() => {
                const allTrue = Object.fromEntries(PII_CATEGORIES.map(c => [c.id, true]))
                setRedacted(allTrue)
              }}
              className="w-full py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 font-medium hover:bg-slate-700"
            >
              Redact All PII
            </button>
          </div>

          <div className="px-3 pb-3 mt-auto pt-3">
            <a href="#" className="flex items-center gap-1.5 text-[9px] text-slate-700 hover:text-slate-600">
              <Shield className="w-3 h-3" /> Files never stored on our servers
            </a>
          </div>
        </aside>

        {/* Document preview */}
        <main className="flex-1 overflow-y-auto bg-slate-900/50 flex items-start justify-center p-8">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Doc header bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-gray-400 font-mono ml-2">employment_agreement_final.pdf</span>
            </div>

            {/* Document content */}
            <div className="px-8 py-8 text-sm text-gray-800 leading-relaxed font-serif space-y-1">
              <p className="text-center font-bold text-base mb-4">EMPLOYMENT AGREEMENT</p>

              {DOC_LINES.map((line, i) => {
                if (!line.text && !line.highlight) return <br key={i} />

                if (line.highlight) {
                  const cat = line.highlight === "ssn" ? "ssn" : line.highlight === "dob" ? "names" : line.highlight
                  const isRedacted = redacted[cat]

                  if (isRedacted && !showRedacted) {
                    return (
                      <span key={i} className="inline-flex items-center gap-1 mx-0.5">
                        <span className="inline-block bg-gray-900 text-gray-900 rounded px-2 py-0.5 text-xs select-none" style={{ minWidth: `${line.text.length * 7}px` }}>
                          {line.text}
                        </span>
                        {line.label && <span className="text-[8px] font-bold text-gray-400 uppercase">[{line.label}]</span>}
                      </span>
                    )
                  }

                  const style = HIGHLIGHT_STYLES[line.highlight] ?? {}
                  return (
                    <span key={i} className="inline-flex items-center gap-1 mx-0.5">
                      <span className={`inline-block px-1 py-0.5 rounded border text-xs ${isRedacted ? `${style.bg} ${style.text} ${style.border}` : "bg-yellow-100 border-yellow-300 text-yellow-900"}`}>
                        {line.text}
                      </span>
                      {line.label && <span className="text-[8px] font-bold text-gray-400 uppercase">[{line.label}]</span>}
                    </span>
                  )
                }

                return <span key={i}>{line.text}</span>
              })}

              <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                <p>The Employee shall perform the duties of <strong>Senior Software Engineer</strong> beginning on the start date specified above.</p>
                <p>Annual compensation shall be <strong>$125,000 USD</strong>, paid bi-weekly via direct deposit.</p>
                <p>This agreement is governed by the laws of the State of California.</p>
              </div>

              <div className="mt-8 flex gap-16 pt-4 border-t border-gray-200">
                <div>
                  <div className="h-8 w-32 border-b border-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Employee Signature</p>
                </div>
                <div>
                  <div className="h-8 w-32 border-b border-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Employer Signature</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
