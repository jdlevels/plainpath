import { motion } from "framer-motion"
import { useLocation } from "wouter"
import {
  Clock, AlertTriangle, FileText, ArrowRight, ChevronRight,
  ShieldCheck, XCircle, PenLine, BadgeCheck, Download, Scale,
  MessageSquare, Sparkles, EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"

/* ─── Shared design tokens ─────────────────────────────────────────────────
   CARD_BASE: shared shell — border supplied per-tool for color differentiation
   ────────────────────────────────────────────────────────────────────────── */
const TOOL = {
  blue:    { card: "pp-tool-card pp-tool-card-blue",    chrome: "pp-tool-chrome pp-tool-chrome-blue"    },
  red:     { card: "pp-tool-card pp-tool-card-red",     chrome: "pp-tool-chrome pp-tool-chrome-red"     },
  emerald: { card: "pp-tool-card pp-tool-card-emerald", chrome: "pp-tool-chrome pp-tool-chrome-emerald" },
  amber:   { card: "pp-tool-card pp-tool-card-amber",   chrome: "pp-tool-chrome pp-tool-chrome-amber"   },
}
const INNER  = "rounded-xl bg-slate-900/55 border border-slate-700/30"
const LABEL  = "text-[10px] uppercase tracking-widest text-slate-500 font-semibold"
const ICON   = "w-5 h-5 rounded-md flex items-center justify-center shrink-0"

/* ─── Data ──────────────────────────────────────────────────────────────── */
const DOC_LINES = [
  { text: "STATE OF CALIFORNIA — SUPERIOR COURT",         style: "text-slate-400 text-[10px] uppercase tracking-widest text-center" },
  { text: "UNLAWFUL DETAINER · Case No. 2026-CV-04912",   style: "text-white font-bold text-xs text-center" },
  { text: "",                                              style: "" },
  { text: "To: Occupant of Record, Unit 4B",              style: "text-slate-300 text-xs" },
  { text: "You are hereby notified that you have",        style: "text-slate-300 text-xs" },
  { text: "14 CALENDAR DAYS",                             style: "px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 text-xs font-bold", highlight: true },
  { text: "from the date of service to vacate the",       style: "text-slate-300 text-xs" },
  { text: "premises or contest this notice.",             style: "text-slate-300 text-xs" },
  { text: "",                                              style: "" },
  { text: "Failure to respond constitutes an",            style: "text-slate-300 text-xs" },
  { text: "AUTOMATIC WAIVER",                             style: "px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs font-bold", highlight: true },
  { text: "of your right to dispute this claim.",         style: "text-slate-300 text-xs" },
  { text: "",                                              style: "" },
  { text: "Required at time of filing:",                  style: "text-slate-400 text-xs font-semibold" },
  { text: "· Form UD-105 (Unlawful Detainer Answer)",     style: "text-blue-300 text-xs ml-2" },
  { text: "· Certified Proof of Service",                 style: "text-blue-300 text-xs ml-2" },
]

const ANALYZE_OUTPUT = {
  deadline: { label: "14 days to respond", sub: "Court deadline — starts from service date", tag: "URGENT" },
  risks: [
    { label: "Risk: Default Judgment",       sub: "Missing deadline = automatic loss in court"    },
    { label: "Risk: Rights Waived by Silence", sub: "No response = legal waiver you can't undo"  },
  ],
  docs:  ["Form UD-105 (Answer)", "Certified Proof of Service"],
  steps: ["File your completed response with the court clerk", "Appear at the hearing on the scheduled date"],
}

const TRUST_FLAGS = [
  { label: "Urgent payment demand with 48-hr deadline",         severity: "red"   },
  { label: "Sender identity unverifiable — no agency code",     severity: "red"   },
  { label: "Threatening language inconsistent with IRS style",  severity: "amber" },
]

const CONTRACT_CLAUSES = [
  "1. Alex Rivera shall provide brand identity design services including logo, color palette, and type system with 3 revision rounds.",
  "2. Client shall pay $4,500 total: $2,250 due upon signing and $2,250 due upon final delivery.",
]

const REVIEW_FLAGS = [
  { label: "Termination without notice — no severance protection",        severity: "red"   },
  { label: "5-year global non-compete — likely unenforceable but risky",  severity: "red"   },
  { label: "IP clause transfers rights regardless of payment status",      severity: "amber" },
]

/* ─── Sub-components ────────────────────────────────────────────────────── */

/** Uniform chrome bar used on every card/panel */
function Chrome({
  iconBg, IconEl, title, right, chromeCls,
}: {
  iconBg: string
  IconEl: React.ReactNode
  title: React.ReactNode
  right?: React.ReactNode
  chromeCls: string
}) {
  return (
    <div className={chromeCls}>
      <div className={`${ICON} ${iconBg}`}>{IconEl}</div>
      <span className="text-xs font-bold text-slate-200 tracking-tight">{title}</span>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  )
}

/** Status pill badge */
function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "emerald" | "red" | "amber" | "slate" | "violet" }) {
  const map = {
    emerald: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    red:     "bg-red-500/15     text-red-400     border border-red-500/25",
    amber:   "bg-amber-500/15   text-amber-400   border border-amber-500/25",
    violet:  "bg-violet-500/15  text-violet-400  border border-violet-500/25",
    slate:   "bg-slate-700/50   text-slate-400   border border-slate-600/30",
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${map[color]}`}>
      {children}
    </span>
  )
}

/** Uniform section label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className={`${LABEL} mb-2`}>{children}</p>
}

/* ─── Main export ───────────────────────────────────────────────────────── */
export default function ProductPreview() {
  const [, setLocation] = useLocation()

  return (
    <div className="w-full">

      {/* Section header */}
      <div className="text-center mb-12">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-widest text-primary/80 mb-3">
          See it in action
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold mb-4 text-white text-balance">
          Any document. Any risk. Any contract.
          <br className="hidden md:block" />
          <span className="text-slate-400">PlainPath handles all of it.</span>
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.1 }} className="text-slate-400 text-lg max-w-2xl mx-auto">
          Five tools. One platform. Everything you need to read, trust, and act on paperwork.
        </motion.p>
        {/* Tool lane badges */}
        <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.18 }} className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
          {[
            { icon: FileText,    label: "Analyze a Document",   btnCls: "pp-dark-btn-blue"    },
            { icon: ShieldCheck, label: "Document Trust Check", btnCls: "pp-dark-btn-red"     },
            { icon: PenLine,     label: "Build a Contract",     btnCls: "pp-dark-btn-emerald" },
            { icon: Scale,       label: "Contract Review",      btnCls: "pp-dark-btn-amber"   },
            { icon: EyeOff,      label: "Redact Sensitive Info", btnCls: "pp-dark-btn-violet" },
          ].map(({ icon: Icon, label, btnCls }, i) => (
            <span key={i} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${btnCls}`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          LANE 1 — Analyze a Document (full-width split-panel module)
      ═══════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }} transition={{ delay: 0.08 }}
        className="max-w-5xl mx-auto mb-4">
        <div className={TOOL.blue.card}>

          {/* Outer chrome — tool identity */}
          <Chrome
            chromeCls={TOOL.blue.chrome}
            iconBg="bg-blue-500/20"
            IconEl={<FileText className="w-3 h-3 text-blue-400" />}
            title="Analyze a Document"
            right={<Badge color="slate">Eviction Notice · 3 pages</Badge>}
          />

          {/* Inner two-panel layout */}
          <div className="p-3 grid grid-cols-1 lg:grid-cols-[1fr_48px_1fr] gap-3 items-stretch">

            {/* Left — raw document */}
            <div className={`${INNER} overflow-hidden`}>
              {/* Faux browser chrome */}
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-slate-700/30 bg-slate-900/40">
                <div className="w-2 h-2 rounded-full bg-red-500/40" />
                <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                <span className="ml-2.5 text-[10px] text-slate-500 font-mono">eviction_notice_2026.pdf</span>
              </div>
              <div className="px-5 py-4 space-y-1.5 font-mono overflow-hidden">
                {DOC_LINES.map((line, i) => {
                  if (!line.text) return <div key={i} className="h-1.5" />
                  if (line.highlight) {
                    return (
                      <motion.span key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                        viewport={{ once: true }} transition={{ delay: 0.04 * i }}
                        className={`inline-block ${line.style}`}>
                        {line.text}
                      </motion.span>
                    )
                  }
                  return (
                    <motion.p key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                      viewport={{ once: true }} transition={{ delay: 0.03 * i }}
                      className={line.style}>
                      {line.text}
                    </motion.p>
                  )
                })}
              </div>
              <div className="h-8 bg-gradient-to-t from-[#0b0f1a]/80 to-transparent -mt-8 pointer-events-none" />
              <p className="text-[10px] text-slate-600 text-center pb-3 font-mono">— page 1 of 3 —</p>
            </div>

            {/* Center connector */}
            <div className="hidden lg:flex flex-col items-center justify-center gap-1.5">
              <div className="w-px flex-1 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-[9px] text-blue-400/50 font-bold uppercase tracking-widest">AI</p>
              <div className="w-px flex-1 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
            </div>

            {/* Right — action plan output */}
            <div className={`${INNER} overflow-hidden flex flex-col`}>
              {/* Inner panel chrome */}
              <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-700/30 bg-slate-900/40">
                <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-primary" />
                </div>
                <span className="text-[11px] font-bold text-slate-200">PlainPath Action Plan</span>
                <div className="ml-auto"><Badge color="emerald"><BadgeCheck className="w-2.5 h-2.5" /> Complete</Badge></div>
              </div>

              <div className="p-3 space-y-2.5 flex-1">
                {/* Deadline */}
                <motion.div initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: 0.14 }}
                  className="rounded-lg bg-red-500/10 border border-red-500/22 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <p className="text-red-300 font-bold text-sm flex-1">{ANALYZE_OUTPUT.deadline.label}</p>
                    <Badge color="red">{ANALYZE_OUTPUT.deadline.tag}</Badge>
                  </div>
                  <p className="text-red-400/65 text-[11px] mt-1 ml-[22px]">{ANALYZE_OUTPUT.deadline.sub}</p>
                </motion.div>

                {/* Risks */}
                <div>
                  <SectionLabel>Risks flagged</SectionLabel>
                  <div className="space-y-1.5">
                    {ANALYZE_OUTPUT.risks.map((risk, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.07 }}
                        className="rounded-lg bg-amber-500/8 border border-amber-500/18 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-px" />
                          <p className="text-amber-300 font-semibold text-[11px] leading-snug">{risk.label}</p>
                        </div>
                        <p className="text-amber-400/55 text-[10px] mt-0.5 ml-5">{risk.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Required docs */}
                <div>
                  <SectionLabel>Required documents</SectionLabel>
                  <div className="space-y-1.5">
                    {ANALYZE_OUTPUT.docs.map((doc, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.06 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/8 border border-blue-500/15">
                        <FileText className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                        <p className="text-blue-300 text-[11px] font-medium">{doc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action steps */}
                <div>
                  <SectionLabel>Action steps</SectionLabel>
                  <div className="space-y-1.5">
                    {ANALYZE_OUTPUT.steps.map((step, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.38 + i * 0.06 }}
                        className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/25">
                        <div className="w-4 h-4 rounded-full border border-slate-600/60 flex items-center justify-center shrink-0 mt-px">
                          <span className="text-[9px] text-slate-500 font-bold">{i + 1}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-snug">{step}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════
          LANES 2-4 — Trust Check · Build a Contract · Contract Review
      ═══════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }} transition={{ delay: 0.12 }}
        className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">

        {/* ── Trust Check ── */}
        <div className={TOOL.red.card}>
          <Chrome
            chromeCls={TOOL.red.chrome}
            iconBg="bg-red-500/20"
            IconEl={<ShieldCheck className="w-3 h-3 text-red-400" />}
            title="Document Trust Check"
            right={<Badge color="slate">fake_irs_notice.pdf</Badge>}
          />
          <div className="p-3 space-y-2.5">
            <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/22 px-3.5 py-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <span className="text-red-400 font-black text-base leading-none">18</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-red-400 font-bold text-sm leading-tight">Likely Scam</p>
                <p className="text-slate-500 text-[11px]">Score 18 / 100 · Do not pay</p>
              </div>
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            </motion.div>

            <SectionLabel>Red flags found</SectionLabel>
            <div className="space-y-1.5">
              {TRUST_FLAGS.map((flag, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.07 }}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${
                    flag.severity === "red" ? "bg-red-500/8 border-red-500/18" : "bg-amber-500/8 border-amber-500/18"}`}>
                  <AlertTriangle className={`w-3 h-3 mt-px shrink-0 ${flag.severity === "red" ? "text-red-400" : "text-amber-400"}`} />
                  <p className="text-slate-200 text-[11px] leading-snug">{flag.label}</p>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.38 }}
              className="rounded-lg bg-slate-800/40 border border-slate-700/25 px-3 py-2.5">
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <span className="text-emerald-400 font-semibold">Safe next step: </span>
                Contact the IRS at irs.gov directly. Do not use contact details from this document.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Build a Contract ── */}
        <div className={TOOL.emerald.card}>
          <Chrome
            chromeCls={TOOL.emerald.chrome}
            iconBg="bg-emerald-500/20"
            IconEl={<PenLine className="w-3 h-3 text-emerald-400" />}
            title="Build a Contract"
            right={<Badge color="emerald"><BadgeCheck className="w-2.5 h-2.5" /> Ready</Badge>}
          />
          <div className="p-3 space-y-2.5">
            <motion.div initial={{ opacity: 0, y: -4 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="rounded-xl bg-slate-800/40 border border-slate-700/25 px-3.5 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Freelance Services Agreement</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Alex Rivera → Bright Marketing Co. · $4,500</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 pt-0.5">3 pages</span>
              </div>
            </motion.div>

            <SectionLabel>Generated clauses</SectionLabel>
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/25 px-3.5 py-3 space-y-2">
              {CONTRACT_CLAUSES.map((clause, i) => (
                <motion.p key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                  viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.1 }}
                  className="text-slate-300 text-[11px] leading-relaxed">
                  {clause}
                </motion.p>
              ))}
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: 0.34 }}
                className="border-t border-slate-700/40 pt-2 mt-1">
                <p className="text-amber-400 text-[11px] font-medium flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-px" />
                  Gap found: No IP ownership clause. PlainPath recommends adding one before signing.
                </p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 4 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="flex items-center gap-2 rounded-lg bg-slate-800/40 border border-slate-700/25 px-3 py-2.5">
              <Download className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <p className="text-slate-300 text-[11px] font-semibold">Contract ready to download as PDF</p>
            </motion.div>
          </div>
        </div>

        {/* ── Contract Review ── */}
        <div className={TOOL.amber.card}>
          <Chrome
            chromeCls={TOOL.amber.chrome}
            iconBg="bg-amber-500/20"
            IconEl={<Scale className="w-3 h-3 text-amber-400" />}
            title="Contract Review"
            right={<Badge color="slate">employment_offer.pdf</Badge>}
          />
          <div className="p-3 space-y-2.5">
            <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/22 px-3.5 py-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <span className="text-red-400 font-black text-base leading-none">28</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-red-400 font-bold text-sm leading-tight">Heavily One-Sided</p>
                <p className="text-slate-500 text-[11px]">Score 28 / 100 · Do not sign as-is</p>
              </div>
              <Scale className="w-5 h-5 text-red-400 shrink-0" />
            </motion.div>

            <SectionLabel>Red flags found</SectionLabel>
            <div className="space-y-1.5">
              {REVIEW_FLAGS.map((flag, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.07 }}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${
                    flag.severity === "red" ? "bg-red-500/8 border-red-500/18" : "bg-amber-500/8 border-amber-500/18"}`}>
                  <AlertTriangle className={`w-3 h-3 mt-px shrink-0 ${flag.severity === "red" ? "text-red-400" : "text-amber-400"}`} />
                  <p className="text-slate-200 text-[11px] leading-snug">{flag.label}</p>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.38 }}
              className="rounded-lg bg-slate-800/40 border border-slate-700/25 px-3 py-2.5">
              <p className="text-slate-300 text-[11px] leading-relaxed flex items-start gap-1.5">
                <MessageSquare className="w-3 h-3 text-slate-400 shrink-0 mt-px" />
                <span><span className="text-slate-200 font-semibold">Negotiation language ready: </span>"We request the termination clause include 30 days written notice."</span>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ delay: 0.2 }}
        className="text-center">
        <Button size="lg" onClick={() => setLocation("/import")}
          className="h-12 px-8 text-base rounded-xl font-semibold shadow-md shadow-primary/20">
          Try it on your document <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        <p className="text-xs text-slate-500 mt-3">Free for 2 analyses · No account required · No documents stored</p>
      </motion.div>

    </div>
  )
}
