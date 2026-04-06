import { motion } from "framer-motion"
import { useLocation } from "wouter"
import {
  Clock, AlertTriangle, FileText, ArrowRight, ChevronRight,
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
  deadline: {
    label: "14 days to respond",
    sub: "Court deadline — starts from service date.",
    tag: "URGENT",
  },
  risks: [
    { label: "Risk: Default Judgment", sub: "Missing deadline = automatic loss in court" },
    { label: "Risk: Rights Waived by Silence", sub: "No response = legal waiver you can't undo" },
  ],
  docs: ["Form UD-105 (Answer)", "Certified Proof of Service"],
  steps: ["File your completed response with the court clerk", "Appear at the hearing on the scheduled date"],
}

export default function ProductPreview() {
  const [, setLocation] = useLocation()

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="text-center mb-12">
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
          className="text-3xl md:text-4xl font-display font-bold mb-4 text-balance"
        >
          See risks, deadlines, and missing pieces<br className="hidden md:block" /> before they cost you.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-lg max-w-xl mx-auto"
        >
          Drop in any document. PlainPath reads every clause and turns it into a clear, prioritized action plan.
        </motion.p>
      </div>

      {/* Split panel */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ delay: 0.1 }}
        className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch"
      >
        {/* ── Left: Document panel ── */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/4">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            <span className="ml-3 text-[11px] text-slate-500 font-mono truncate">eviction_notice_2026.pdf</span>
          </div>

          {/* Document content */}
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

          {/* "More content" fade */}
          <div className="h-8 bg-gradient-to-t from-slate-950 to-transparent -mt-8 pointer-events-none" />
          <p className="text-[10px] text-slate-600 text-center pb-3 font-mono">— page 1 of 3 —</p>
        </div>

        {/* ── Center: Arrow connector ── */}
        <div className="hidden lg:flex flex-col items-center justify-center px-2 gap-1.5">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-primary/50" />
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-primary" />
            </div>
            <div className="w-px h-12 bg-gradient-to-t from-transparent to-primary/50" />
          </div>
          <span className="text-[10px] text-primary/60 font-semibold uppercase tracking-widest rotate-0">AI</span>
        </div>

        {/* ── Right: Action plan output ── */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/4">
          {/* Panel chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
            <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
              <FileText className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs font-semibold text-slate-300">PlainPath Action Plan</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">Complete</span>
          </div>

          <div className="p-4 space-y-3 overflow-hidden">
            {/* Urgent deadline */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-300 font-bold text-sm">{OUTPUT_ITEMS.deadline.label}</p>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                  {OUTPUT_ITEMS.deadline.tag}
                </span>
              </div>
              <p className="text-red-400/70 text-[11px] mt-1 ml-6">{OUTPUT_ITEMS.deadline.sub}</p>
            </motion.div>

            {/* Risks */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Risks flagged</p>
              <div className="space-y-2">
                {OUTPUT_ITEMS.risks.map((risk, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.07 }}
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

            {/* Required documents */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Required documents</p>
              <div className="space-y-1.5">
                {OUTPUT_ITEMS.docs.map((doc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/8 border border-blue-500/15"
                  >
                    <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                    <p className="text-blue-300 text-xs font-medium">{doc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Action steps */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Action steps</p>
              <div className="space-y-1.5">
                {OUTPUT_ITEMS.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.38 + i * 0.06 }}
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
      </motion.div>

      {/* Mobile connector label */}
      <div className="lg:hidden flex items-center justify-center gap-2 my-1 text-primary/60 text-xs font-semibold">
        <div className="w-10 h-px bg-primary/30" />
        <ChevronRight className="w-3.5 h-3.5" />
        <span>PlainPath Action Plan</span>
        <div className="w-10 h-px bg-primary/30" />
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-center mt-10"
      >
        <Button
          size="lg"
          onClick={() => setLocation("/import")}
          className="h-12 px-8 text-base rounded-xl font-semibold shadow-md shadow-primary/20"
        >
          Try it on your document <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2.5">Free for 2 analyses · No account required · No documents stored</p>
      </motion.div>
    </div>
  )
}
