import { motion } from "framer-motion"
import { useLocation } from "wouter"
import {
  Clock, AlertTriangle, FileText, ArrowRight, ChevronRight,
  ShieldCheck, XCircle, PenLine, BadgeCheck, Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const DOC_LINES = [
  { text: "STATE OF CALIFORNIA — SUPERIOR COURT", style: "text-slate-400 text-[10px] uppercase tracking-widest text-center" },
  { text: "UNLAWFUL DETAINER · Case No. 2026-CV-04912", style: "text-white font-bold text-xs text-center" },
  { text: "", style: "" },
  { text: "To: Occupant of Record, Unit 4B", style: "text-slate-300 text-xs" },
  { text: "You are hereby notified that you have", style: "text-slate-300 text-xs" },
  { text: "14 CALENDAR DAYS", style: "px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 text-xs font-bold", highlight: true },
  { text: "from the date of service to vacate the", style: "text-slate-300 text-xs" },
  { text: "premises or contest this notice.", style: "text-slate-300 text-xs" },
  { text: "", style: "" },
  { text: "Failure to respond constitutes an", style: "text-slate-300 text-xs" },
  { text: "AUTOMATIC WAIVER", style: "px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs font-bold", highlight: true },
  { text: "of your right to dispute this claim.", style: "text-slate-300 text-xs" },
  { text: "", style: "" },
  { text: "Required at time of filing:", style: "text-slate-400 text-xs font-semibold" },
  { text: "· Form UD-105 (Unlawful Detainer Answer)", style: "text-blue-300 text-xs ml-2" },
  { text: "· Certified Proof of Service", style: "text-blue-300 text-xs ml-2" },
]

const OUTPUT_ITEMS = {
  deadline: { label: "14 days to respond", sub: "Court deadline — starts from service date.", tag: "URGENT" },
  risks: [
    { label: "Risk: Default Judgment", sub: "Missing deadline = automatic loss in court" },
    { label: "Risk: Rights Waived by Silence", sub: "No response = legal waiver you can't undo" },
  ],
  docs: ["Form UD-105 (Answer)", "Certified Proof of Service"],
  steps: ["File your completed response with the court clerk", "Appear at the hearing on the scheduled date"],
}

const TRUST_FLAGS = [
  { label: "Urgent payment demand with 48-hr deadline", severity: "red" },
  { label: "Sender identity unverifiable — no agency code", severity: "red" },
  { label: "Threatening language inconsistent with IRS style", severity: "amber" },
]

const CONTRACT_CLAUSES = [
  "1. Alex Rivera shall provide brand identity design services including logo, color palette, and type system with 3 revision rounds.",
  "2. Client shall pay $4,500 total: $2,250 due upon signing and $2,250 due upon final delivery.",
]

export default function ProductPreview() {
  const [, setLocation] = useLocation()

  return (
    <div className="w-full">
      {/* ── Section header ── */}
      <div className="text-center mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-widest text-primary/80 mb-3"
        >
          See it in action
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold mb-4 text-balance text-white"
        >
          Any document. Any risk. Any contract.
          <br className="hidden md:block" />
          <span className="text-slate-400">PlainPath handles all of it.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 text-lg max-w-2xl mx-auto"
        >
          Four tools. One platform. Everything you need to read, trust, and act on paperwork.
        </motion.p>

        {/* Lane badges */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.18 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-6"
        >
          {[
            { icon: FileText,   label: "Analyze a Document",      color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
            { icon: ShieldCheck, label: "Document Trust Check",   color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
            { icon: PenLine,    label: "Build a Contract",         color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          ].map(({ icon: Icon, label, color, bg, border }, i) => (
            <span key={i} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${bg} ${border} text-xs font-semibold ${color}`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════
          LANE 1: Analyze — main split panel
      ═════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ delay: 0.1 }}
        className="max-w-5xl mx-auto mb-6"
      >
        {/* Lane label */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400/80">Analyze a Document</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
          {/* Left: Document panel */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/4">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              <span className="ml-3 text-[11px] text-slate-500 font-mono truncate">eviction_notice_2026.pdf</span>
            </div>
            <div className="p-6 space-y-1.5 font-mono overflow-hidden">
              {DOC_LINES.map((line, i) => {
                if (!line.text) return <div key={i} className="h-2" />
                if (line.highlight) {
                  return (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 * i }}
                      className={`inline-block ${line.style}`}
                    >
                      {line.text}
                    </motion.span>
                  )
                }
                return (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.04 * i }}
                    className={line.style}
                  >
                    {line.text}
                  </motion.p>
                )
              })}
            </div>
            <div className="h-8 bg-gradient-to-t from-slate-950 to-transparent -mt-8 pointer-events-none" />
            <p className="text-[10px] text-slate-600 text-center pb-3 font-mono">— page 1 of 3 —</p>
          </div>

          {/* Center arrow */}
          <div className="hidden lg:flex flex-col items-center justify-center px-2 gap-1.5">
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-blue-400/40" />
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-blue-400" />
            </div>
            <div className="w-px h-12 bg-gradient-to-t from-transparent to-blue-400/40" />
            <span className="text-[10px] text-blue-400/60 font-semibold uppercase tracking-widest">AI</span>
          </div>

          {/* Right: Action plan output */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/4">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
              <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                <FileText className="w-3 h-3 text-primary" />
              </div>
              <span className="text-xs font-semibold text-slate-300">PlainPath Action Plan</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">Complete</span>
            </div>
            <div className="p-4 space-y-3 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-red-300 font-bold text-sm">{OUTPUT_ITEMS.deadline.label}</p>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">{OUTPUT_ITEMS.deadline.tag}</span>
                </div>
                <p className="text-red-400/70 text-[11px] mt-1 ml-6">{OUTPUT_ITEMS.deadline.sub}</p>
              </motion.div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Risks flagged</p>
                <div className="space-y-2">
                  {OUTPUT_ITEMS.risks.map((risk, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.07 }}
                      className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <p className="text-amber-300 font-semibold text-xs">{risk.label}</p>
                      </div>
                      <p className="text-amber-400/60 text-[11px] mt-0.5 ml-5">{risk.sub}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Required documents</p>
                <div className="space-y-1.5">
                  {OUTPUT_ITEMS.docs.map((doc, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/8 border border-blue-500/15"
                    >
                      <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                      <p className="text-blue-300 text-xs font-medium">{doc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Action steps</p>
                <div className="space-y-1.5">
                  {OUTPUT_ITEMS.steps.map((step, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: 0.38 + i * 0.06 }}
                      className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/30"
                    >
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] text-slate-500 font-bold">{i + 1}</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-snug">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          LANES 2 + 3: Trust Check + Contract Builder — proof cards
      ═════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: 0.15 }}
        className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
      >
        {/* ── Trust Check proof card ── */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/4">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
            <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-violet-400" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Document Trust Check</span>
            <span className="ml-auto text-[10px] text-violet-400/60 font-mono">fake_irs_notice.pdf</span>
          </div>
          <div className="p-4 space-y-3">
            {/* Verdict banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <span className="text-red-400 font-black text-base">18</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-red-400 font-bold text-sm">Likely Scam</p>
                <p className="text-slate-500 text-[11px]">Trust score 18/100 · Do not pay or respond</p>
              </div>
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            </motion.div>
            {/* Flags */}
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Red flags found</p>
            <div className="space-y-2">
              {TRUST_FLAGS.map((flag, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.08 }}
                  className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 border ${
                    flag.severity === "red"
                      ? "bg-red-500/8 border-red-500/20"
                      : "bg-amber-500/8 border-amber-500/20"
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${flag.severity === "red" ? "text-red-400" : "text-amber-400"}`} />
                  <p className="text-white text-xs leading-snug">{flag.label}</p>
                </motion.div>
              ))}
            </div>
            {/* Recommendation */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="rounded-xl bg-slate-800/60 border border-slate-700/40 px-3.5 py-2.5"
            >
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <span className="text-emerald-400 font-semibold">Safe next step:</span> Contact the IRS directly at irs.gov to verify. Do not use contact details from this document.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Contract Builder proof card ── */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/4">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
              <PenLine className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Contract Builder</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" /> Ready
            </span>
          </div>
          <div className="p-4 space-y-3">
            {/* Contract header */}
            <motion.div
              initial={{ opacity: 0, y: -6 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-white font-bold text-sm">Freelance Services Agreement</p>
                <p className="text-slate-500 text-[11px]">Alex Rivera → Bright Marketing Co. · $4,500</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">3 pages</span>
            </motion.div>
            {/* Clause previews */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/40 px-4 py-3 space-y-2.5">
              {CONTRACT_CLAUSES.map((clause, i) => (
                <motion.p key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                  viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.1 }}
                  className="text-slate-300 text-[11px] leading-relaxed"
                >
                  {clause}
                </motion.p>
              ))}
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: 0.35 }}
                className="border-t border-slate-700/50 pt-2.5 mt-1"
              >
                <p className="text-amber-400 text-[11px] font-medium flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  Gap found: No intellectual property clause. PlainPath recommends adding one before signing.
                </p>
              </motion.div>
            </div>
            {/* Download CTA */}
            <motion.div initial={{ opacity: 0, y: 4 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="flex items-center gap-2 rounded-xl bg-emerald-600/15 border border-emerald-500/25 px-3.5 py-2.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className="text-emerald-300 text-xs font-semibold">Contract ready to download as PDF</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <Button
          size="lg"
          onClick={() => setLocation("/import")}
          className="h-12 px-8 text-base rounded-xl font-semibold shadow-md shadow-primary/20"
        >
          Try it on your document <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        <p className="text-xs text-slate-500 mt-3">Free for 2 analyses · No account required · No documents stored</p>
      </motion.div>
    </div>
  )
}
