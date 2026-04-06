import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, FileText, AlertTriangle, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react"

/* ─── Document types to cycle through ─────────────────────── */
const DOCUMENTS = [
  {
    type: "Eviction Notice",
    color: "text-red-400",
    bg: "bg-red-500/10",
    badge: "bg-red-500/15 text-red-400 border border-red-500/20",
    lines: [
      { text: "NOTICE TO QUIT AND VACATE PREMISES", bold: true, plain: true },
      { text: " " },
      { text: "Tenant(s): James R. Holloway", plain: true },
      { text: "Property: 412 Westfield Ave, Unit 3B", plain: true },
      { text: " " },
      {
        text: "YOU ARE HEREBY NOTIFIED that you must vacate and surrender",
        plain: true,
        parts: [
          { text: "YOU ARE HEREBY NOTIFIED that you must vacate and surrender" },
        ],
      },
      {
        text: "possession of the above premises within ",
        annotation: { label: "14 days to respond", type: "deadline", offset: 39, len: 10 },
        parts: [
          { text: "possession of the above premises within " },
          { text: "fourteen (14) days", highlight: "deadline" },
          { text: " of service of this" },
        ],
      },
      { text: "notice, or legal proceedings will be commenced.", plain: true },
      { text: " " },
      {
        parts: [
          { text: "Failure to respond may result in a " },
          { text: "default judgment", highlight: "risk" },
          { text: " being entered" },
        ],
        annotation: { label: "Risk: default judgment", type: "risk" },
      },
      { text: "against you for possession and court costs.", plain: true },
      { text: " " },
      {
        parts: [
          { text: "You must also submit " },
          { text: "proof of payment receipt (Form UD-105)", highlight: "required" },
        ],
        annotation: { label: "Required: Form UD-105", type: "required" },
      },
      { text: "within the 14-day response window.", plain: true },
      { text: " " },
      {
        parts: [
          { text: "Note: this notice will " },
          { text: "automatically renew", highlight: "renew" },
          { text: " if no response" },
        ],
        annotation: { label: "Auto-renews if ignored", type: "renew" },
      },
      { text: "is received within thirty (30) days of original service.", plain: true },
    ],
  },
  {
    type: "Lease Agreement",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    badge: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    lines: [
      { text: "RESIDENTIAL LEASE AGREEMENT", bold: true, plain: true },
      { text: " " },
      { text: "Landlord: Green Valley Properties LLC", plain: true },
      { text: "Tenant: Sarah M. Torres", plain: true },
      { text: "Term: January 1, 2026 – December 31, 2026", plain: true },
      { text: " " },
      {
        parts: [
          { text: "Tenant shall provide " },
          { text: "60 days written notice", highlight: "deadline" },
          { text: " prior to vacating." },
        ],
        annotation: { label: "60-day notice required", type: "deadline" },
      },
      { text: " " },
      {
        parts: [
          { text: "Any damage beyond normal wear shall be deducted from the " },
        ],
        plain: true,
      },
      {
        parts: [
          { text: "$2,400 security deposit", highlight: "required" },
          { text: " at landlord's sole discretion." },
        ],
        annotation: { label: "Required: document all damage", type: "required" },
      },
      { text: " " },
      {
        parts: [
          { text: "Tenant assumes " },
          { text: "full liability for injuries", highlight: "risk" },
          { text: " occurring on premises." },
        ],
        annotation: { label: "Risk: liability transfer", type: "risk" },
      },
      { text: " " },
      {
        parts: [
          { text: "This lease shall " },
          { text: "automatically renew month-to-month", highlight: "renew" },
          { text: " unless" },
        ],
        annotation: { label: "Auto-renews month-to-month", type: "renew" },
      },
      { text: "written notice is provided 60 days prior to expiration.", plain: true },
    ],
  },
  {
    type: "Benefit Award Letter",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    lines: [
      { text: "NOTICE OF BENEFIT DETERMINATION", bold: true, plain: true },
      { text: " " },
      { text: "Recipient: Marcus L. Chen", plain: true },
      { text: "Claim #: 2026-SS-00914", plain: true },
      { text: " " },
      { text: "You have been approved for monthly benefits of $1,847.", plain: true },
      {
        parts: [
          { text: "You must " },
          { text: "respond by March 15, 2026", highlight: "deadline" },
          { text: " to confirm enrollment." },
        ],
        annotation: { label: "Deadline: March 15, 2026", type: "deadline" },
      },
      { text: " " },
      {
        parts: [
          { text: "Failure to report income changes within " },
          { text: "10 business days", highlight: "deadline" },
          { text: " may" },
        ],
        annotation: { label: "10-day reporting window", type: "deadline" },
      },
      {
        parts: [
          { text: "result in " },
          { text: "overpayment recovery action", highlight: "risk" },
          { text: " against you." },
        ],
        annotation: { label: "Risk: repayment demand", type: "risk" },
      },
      { text: " " },
      {
        parts: [
          { text: "You must submit " },
          { text: "Form SSA-1099 and proof of residence", highlight: "required" },
          { text: "." },
        ],
        annotation: { label: "Required: SSA-1099 + proof", type: "required" },
      },
      { text: " " },
      {
        parts: [
          { text: "Benefits will " },
          { text: "automatically terminate", highlight: "renew" },
          { text: " if forms are not" },
        ],
        annotation: { label: "Auto-terminates without forms", type: "renew" },
      },
      { text: "received by the stated deadline.", plain: true },
    ],
  },
]

const HIGHLIGHT_STYLES: Record<string, string> = {
  deadline: "bg-red-400/20 text-red-300 rounded px-0.5",
  risk:     "bg-amber-400/20 text-amber-300 rounded px-0.5",
  required: "bg-blue-400/20 text-blue-300 rounded px-0.5",
  renew:    "bg-violet-400/20 text-violet-300 rounded px-0.5",
}

const CALLOUT_STYLES: Record<string, string> = {
  deadline: "bg-red-500/15 border border-red-500/30 text-red-300",
  risk:     "bg-amber-500/15 border border-amber-500/30 text-amber-300",
  required: "bg-blue-500/15 border border-blue-500/30 text-blue-300",
  renew:    "bg-violet-500/15 border border-violet-500/30 text-violet-300",
}

const CALLOUT_ICONS: Record<string, typeof Clock> = {
  deadline: Clock,
  risk:     AlertTriangle,
  required: FileText,
  renew:    RefreshCcw,
}

const LEGEND = [
  { type: "deadline", label: "Deadline",       icon: Clock,         style: "bg-red-500/15 text-red-400 border-red-500/25"     },
  { type: "risk",     label: "Risk",            icon: AlertTriangle, style: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  { type: "required", label: "Required",        icon: FileText,      style: "bg-blue-500/15 text-blue-400 border-blue-500/25"    },
  { type: "renew",    label: "Auto-renew",      icon: RefreshCcw,    style: "bg-violet-500/15 text-violet-400 border-violet-500/25"},
]

export default function DocumentAnnotationSection() {
  const [docIdx, setDocIdx] = useState(0)
  const [revealedLines, setRevealedLines] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doc = DOCUMENTS[docIdx]
  const annotatedLines = doc.lines.filter((l) => l.annotation)

  /* Animate lines appearing */
  useEffect(() => {
    setRevealedLines(0)
    let i = 0
    const interval = setInterval(() => {
      i++
      setRevealedLines(i)
      if (i >= doc.lines.length) clearInterval(interval)
    }, 110)
    return () => clearInterval(interval)
  }, [docIdx])

  /* Auto-cycle documents */
  useEffect(() => {
    if (paused) return
    timerRef.current = setTimeout(() => {
      setDocIdx((d) => (d + 1) % DOCUMENTS.length)
    }, 7000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [docIdx, paused])

  function goDoc(i: number) {
    setDocIdx(i)
    setPaused(true)
  }

  return (
    <div className="w-full">
      <div className="rounded-3xl bg-slate-950 dark:bg-slate-900 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-20">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-4"
            >
              Inside your document
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 }}
              className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight mb-4"
            >
              Every clause, decoded.<br />
              <span className="text-slate-400">Every risk, surfaced.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="text-slate-400 text-base max-w-xl mx-auto"
            >
              PlainPath reads the actual text of your document and annotates exactly what matters — deadlines, risks, obligations, and hidden auto-renewals.
            </motion.p>
          </div>

          {/* Document type selector */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {DOCUMENTS.map((d, i) => (
              <button
                key={i}
                onClick={() => goDoc(i)}
                className={[
                  "px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
                  i === docIdx ? d.badge : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {d.type}
              </button>
            ))}
          </div>

          {/* Main two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start max-w-5xl mx-auto">

            {/* Left — annotated document */}
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              {/* Doc header bar */}
              <div className="bg-slate-800/80 border-b border-slate-700/50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={docIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={["text-[11px] font-semibold px-3 py-1 rounded-full", doc.badge].join(" ")}
                  >
                    {doc.type}
                  </motion.span>
                </AnimatePresence>
                <div className="w-16" />
              </div>

              {/* Document text */}
              <div className="px-6 py-5 font-mono text-[12px] leading-relaxed select-none min-h-[320px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={docIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {doc.lines.map((line, li) => {
                      if (li >= revealedLines) return null
                      if (line.text === " " || (!line.parts && !line.text)) {
                        return <div key={li} className="h-2.5" />
                      }
                      if (line.plain || !line.parts) {
                        return (
                          <motion.p
                            key={li}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className={["text-slate-400 leading-relaxed", line.bold ? "text-slate-200 font-bold text-[13px]" : ""].join(" ")}
                          >
                            {line.text}
                          </motion.p>
                        )
                      }
                      return (
                        <motion.p
                          key={li}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15 }}
                          className="text-slate-400 leading-relaxed"
                        >
                          {line.parts!.map((part, pi) => (
                            part.highlight ? (
                              <span key={pi} className={HIGHLIGHT_STYLES[part.highlight]}>
                                {part.text}
                              </span>
                            ) : (
                              <span key={pi}>{part.text}</span>
                            )
                          ))}
                        </motion.p>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right — callout panel */}
            <div className="flex flex-col gap-3">
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide mb-1">
                PlainPath found
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={docIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-2.5"
                >
                  {annotatedLines.map((line, i) => {
                    const ann = line.annotation!
                    const Icon = CALLOUT_ICONS[ann.type]
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.12 + 0.4 }}
                        className={["flex items-start gap-3 rounded-xl px-4 py-3", CALLOUT_STYLES[ann.type]].join(" ")}
                      >
                        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-[12px] font-semibold leading-snug">{ann.label}</p>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-600 text-[11px] font-bold uppercase tracking-wide mb-2.5">Annotation key</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {LEGEND.map((l) => (
                    <div key={l.type} className={["flex items-center gap-2 rounded-lg px-2.5 py-2 border text-[11px] font-semibold", l.style].join(" ")}>
                      <l.icon className="w-3 h-3 shrink-0" />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom nav dots + prev/next */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => goDoc((docIdx - 1 + DOCUMENTS.length) % DOCUMENTS.length)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <div className="flex gap-2">
              {DOCUMENTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goDoc(i)}
                  className={["rounded-full transition-all", i === docIdx ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-slate-700 hover:bg-slate-500"].join(" ")}
                />
              ))}
            </div>
            <button
              onClick={() => goDoc((docIdx + 1) % DOCUMENTS.length)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
