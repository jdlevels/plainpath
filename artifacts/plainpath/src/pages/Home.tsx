import { useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  ArrowRight, ShieldCheck, Upload,
  Sparkles, Receipt, Scale, HeartPulse, FileSignature, MailWarning,
  CheckCircle2, PenLine, FileScan, CalendarX, Eye, AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import PricingSection from "@/components/PricingSection"
import StatsBar from "@/components/StatsBar"
import TestimonialsSection from "@/components/TestimonialsSection"
import FAQSection from "@/components/FAQSection"
import ToolsShowcase from "@/components/ToolsShowcase"
import ProductPreview from "@/components/ProductPreview"
import DemoSection from "@/components/DemoSection"
import VideoWalkthrough from "@/components/VideoWalkthrough"

const DEMOS = [
  {
    id: "event-permit",
    tool: "Analyze a Document",
    title: "Small Business Event Permit Packet",
    desc: "City permit to host a public event. Requires 4 departmental sign-offs, a $1M liability certificate, and a 45-day lead time.",
    icon: FileScan,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    hoverBorder: "hover:border-blue-400/50",
    hoverTitle: "group-hover:text-blue-500 dark:group-hover:text-blue-400",
    tags: ["8 action steps", "6 required docs", "3 deadlines"],
    cta: "Open action plan",
    path: "/analyze?demo=event-permit",
  },
  {
    id: "trust-check-irs",
    tool: "Document Trust Check",
    title: "Fake IRS Payment Demand",
    desc: "A letter claiming your account is flagged, demanding $892 within 48 hours. Trust Check scores it 18/100 and surfaces 3 critical red flags.",
    icon: ShieldCheck,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    hoverBorder: "hover:border-red-400/50",
    hoverTitle: "group-hover:text-red-500 dark:group-hover:text-red-400",
    tags: ["Score: 18/100", "3 red flags", "Verdict: Likely Scam"],
    cta: "See trust verdict",
    path: "/import?mode=trust-check",
  },
  {
    id: "contract-builder-freelance",
    tool: "Build a Contract",
    title: "Freelance Services Agreement",
    desc: "Answer 6 questions about your deal — scope, payment, and deadline — and get a complete contract with gap analysis ready to download.",
    icon: PenLine,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    hoverBorder: "hover:border-emerald-400/50",
    hoverTitle: "group-hover:text-emerald-500 dark:group-hover:text-emerald-400",
    tags: ["6-question wizard", "Gap analysis included", "PDF ready"],
    cta: "Build a contract",
    path: "/contract-builder",
  },
  {
    id: "contract-review-employment",
    tool: "Contract Review",
    title: "Employment Offer — Heavily One-Sided",
    desc: "An offer letter with a 5-year global non-compete, no severance clause, and IP rights stripping. Scored 28/100 with negotiation language ready.",
    icon: Scale,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    hoverBorder: "hover:border-amber-400/50",
    hoverTitle: "group-hover:text-amber-500 dark:group-hover:text-amber-400",
    tags: ["Score: 28/100", "4 clauses flagged", "Negotiation language"],
    cta: "Review a contract",
    path: "/contract-review",
  },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose the right tool",
    desc: "Analyze a document, run a trust check on something suspicious, build a contract from scratch, or review one before you sign. Each tool is built for a specific situation.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "Upload, paste, or answer a few questions",
    desc: "Drop in a PDF, paste text, or work through a short guided wizard. No complex setup and no account required to get started.",
    icon: Upload,
  },
  {
    step: "03",
    title: "Get a plain English result, ready to act on",
    desc: "Action plans, authenticity verdicts, contract drafts, or clause-by-clause reviews — all structured, sourced, and written so anyone can understand them.",
    icon: CheckCircle2,
  },
]

const DOCUMENT_FAMILIES = [
  { icon: Receipt,       label: "Tax & Government Forms",   color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/50" },
  { icon: Scale,         label: "Legal & Business Filings", color: "text-blue-500 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-950/50"     },
  { icon: HeartPulse,    label: "Healthcare & Insurance",   color: "text-rose-500 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-950/50"     },
  { icon: FileSignature, label: "Contracts & Agreements",   color: "text-amber-500 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/50"   },
  { icon: MailWarning,   label: "Bills, Notices & Summons", color: "text-emerald-500 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-950/50"},
  { icon: Sparkles,      label: "Applications & Permits",   color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/50" },
]

/* ─── Reusable band container ─────────────────────────────── */
function Band({
  children,
  className = "",
  innerClassName = "",
  id,
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  id?: string
}) {
  return (
    <div id={id} className={`w-full ${className}`}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${innerClassName}`}>
        {children}
      </div>
    </div>
  )
}

export default function Home() {
  const [, setLocation] = useLocation()

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">

      {/* ── Hero background decoration ─────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-[90vh] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/70 via-indigo-50/60 to-violet-100/50 dark:from-primary/8 dark:via-transparent dark:to-violet-500/5" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-blue-300/30 dark:bg-primary/8 blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-200/50 dark:bg-blue-900/20 blur-3xl -translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-violet-200/60 dark:bg-violet-900/15 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" className="text-slate-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>
      </div>

      <main className="flex-1 flex flex-col w-full">

        {/* ═══════════════════════════════════════════════════
            BAND 1 — HERO  (bg-background, transparent)
        ════════════════════════════════════════════════════ */}
        <Band className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-violet-50/50 dark:from-transparent dark:via-transparent dark:to-transparent" innerClassName="pt-28 pb-24">
          <div className="max-w-4xl mx-auto text-center space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 shadow-sm text-xs font-semibold text-primary dark:text-primary tracking-wide uppercase"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Four tools · one platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
              className="text-5xl md:text-[4.5rem] lg:text-[5.5rem] font-display font-bold tracking-tight text-foreground leading-[1.05] text-balance"
            >
              Stop guessing what<br />
              <span className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent">
                your documents mean.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              PlainPath is a four-tool document platform. Analyze any paperwork, verify its legitimacy, build contracts, and review agreements before you sign — all turned into plain English and clear action.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 w-full max-w-3xl mx-auto"
            >
              {[
                { label: "Analyze a Document",   Icon: FileScan,    path: "/import",                 col: "tool-btn-blue"    },
                { label: "Document Trust Check", Icon: ShieldCheck, path: "/import?mode=trust-check", col: "tool-btn-red"     },
                { label: "Build a Contract",     Icon: PenLine,     path: "/contract-builder",        col: "tool-btn-emerald" },
                { label: "Contract Review",      Icon: Scale,       path: "/contract-review",         col: "tool-btn-amber"   },
              ].map(({ label, Icon, path, col }) => (
                <Button key={label} size="lg" variant="ghost" onClick={() => setLocation(path)}
                  className={`w-full h-12 px-4 text-sm rounded-xl font-semibold border transition-all ${col}`}>
                  <Icon className="mr-2 w-4 h-4 shrink-0" /> {label}
                </Button>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground"
                onClick={() => document.getElementById("demos")?.scrollIntoView({ behavior: "smooth" })}>
                View demos <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            >
              {["Plans from $4.99/month", "No account required", "Documents not stored by PlainPath", "Free for your first two analyses"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground/80 dark:text-muted-foreground/55">
                  <span className="w-1 h-1 rounded-full bg-primary/40 dark:bg-muted-foreground/30 shrink-0" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </Band>

        {/* ═══════════════════════════════════════════════════
            BAND 2 — STATS + DOC TYPES  (muted/tinted)
        ════════════════════════════════════════════════════ */}
        <div className="w-full bg-gradient-to-b from-slate-100 via-blue-50/80 to-slate-100/60 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 border-y border-slate-200 dark:border-border/50">
          <Band innerClassName="py-20">
            <StatsBar />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16"
            >
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-7">
                Works with all kinds of confusing paperwork
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {DOCUMENT_FAMILIES.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-default"
                  >
                    <div className={`w-7 h-7 rounded-lg ${f.bg} flex items-center justify-center`}>
                      <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                    </div>
                    <span className="text-sm font-semibold text-foreground/80">{f.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Band>
        </div>

        {/* ═══════════════════════════════════════════════════
            BAND 3 — THE PROBLEM  (neutral band, dark card inside)
        ════════════════════════════════════════════════════ */}
        <Band className="bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900/90" innerClassName="py-20 border-b border-slate-100 dark:border-transparent">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <div className="rounded-3xl bg-slate-950 dark:bg-slate-900 text-white px-6 py-16 sm:px-12 sm:py-20 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 opacity-80 pointer-events-none" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div>
                  <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-5">The problem</motion.p>
                  <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.06 }}
                    className="text-4xl sm:text-5xl font-display font-bold leading-[1.08] tracking-tight text-white mb-6">
                    They wrote<br />every clause.<br />
                    <span className="text-slate-400">You have to live<br />with every one.</span>
                  </motion.h2>
                  <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.12 }}
                    className="text-slate-400 leading-relaxed text-base sm:text-lg max-w-md">
                    Contracts, notices, and government forms are written by specialists with one goal: protecting the organization that issued them. Nobody writes them for you.
                  </motion.p>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: CalendarX, title: "Deadlines buried in fine print",          desc: "A 30-day window in paragraph 8 that nobody told you about. Once it passes, your options disappear. Analyze a Document surfaces every one.", tool: "Analyze a Document",   iconBg: "rgba(59,130,246,0.15)",  iconColor: "#60a5fa", badgeBorder: "rgba(59,130,246,0.35)",  badgeColor: "#93c5fd" },
                    { icon: FileScan,  title: "Fake notices designed to pressure you",   desc: "Scam notices look identical to real ones. Same formatting, same urgency. Document Trust Check scores legitimacy and flags every red flag.", tool: "Document Trust Check", iconBg: "rgba(239,68,68,0.15)",   iconColor: "#f87171", badgeBorder: "rgba(239,68,68,0.35)",   badgeColor: "#fca5a5" },
                    { icon: PenLine,   title: "Signing the other party's boilerplate",   desc: "When you don't have your own contract, you sign theirs — and every clause was written to protect them. Build a Contract creates a fair agreement from scratch.", tool: "Build a Contract",     iconBg: "rgba(16,185,129,0.15)", iconColor: "#34d399", badgeBorder: "rgba(16,185,129,0.35)", badgeColor: "#6ee7b7" },
                    { icon: Eye,       title: "Clauses that shift all the risk to you",  desc: "One paragraph waives your right to dispute. Another transfers liability quietly. Contract Review reads it clause by clause and tells you exactly what you're agreeing to.", tool: "Contract Review",      iconBg: "rgba(245,158,11,0.15)", iconColor: "#fbbf24", badgeBorder: "rgba(245,158,11,0.35)", badgeColor: "#fcd34d" },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-4 bg-white/5 hover:bg-white/8 transition-colors rounded-2xl px-5 py-4">
                      <div style={{ backgroundColor: item.iconBg }} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon style={{ width: 18, height: 18, color: item.iconColor }} />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm mb-0.5">{item.title}</p>
                        <p className="text-slate-400 text-sm leading-relaxed mb-2">{item.desc}</p>
                        <span style={{ color: item.badgeColor, borderColor: item.badgeBorder }} className="inline-block text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5">{item.tool}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </Band>

        {/* ═══════════════════════════════════════════════════
            BAND 3.5 — PRODUCT PREVIEW  (dark, proof block)
        ════════════════════════════════════════════════════ */}
        <div className="w-full bg-gradient-to-b from-slate-950 via-[#0c1422] to-slate-950">
          <Band innerClassName="py-20">
            <ProductPreview />
          </Band>
        </div>

        {/* ═══════════════════════════════════════════════════
            BAND 4 — TOOLS SHOWCASE  (muted/tinted)
        ════════════════════════════════════════════════════ */}
        <div id="solutions" className="w-full bg-gradient-to-br from-indigo-50/90 via-violet-50/70 to-slate-50/90 dark:from-violet-950/22 dark:via-slate-900 dark:to-slate-900 border-y border-indigo-100 dark:border-border/40">
          <Band innerClassName="py-20">
            <ToolsShowcase />
          </Band>
        </div>

        {/* ═══════════════════════════════════════════════════
            BAND 5 — SEE IT IN ACTION  (neutral, dark card inside)
        ════════════════════════════════════════════════════ */}
        <Band className="bg-gradient-to-b from-white via-sky-50/60 to-slate-50 dark:from-slate-950 dark:via-sky-950/10 dark:to-slate-950 border-b border-slate-100 dark:border-transparent" innerClassName="py-20">
          <DemoSection />
        </Band>

        {/* ═══════════════════════════════════════════════════
            BAND 6 — HOW IT WORKS  (muted/tinted)
        ════════════════════════════════════════════════════ */}
        <div id="how-it-works" className="w-full bg-gradient-to-b from-slate-100/90 via-blue-50/50 to-slate-100/70 dark:from-slate-900 dark:via-slate-800/40 dark:to-slate-900 border-y border-slate-200 dark:border-border/40">
          <Band innerClassName="py-20">
            <div className="text-center mb-14">
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">How it works</motion.p>
              <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-3xl md:text-4xl font-display font-bold mb-4">
                One platform, built for every document situation
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground text-lg max-w-xl mx-auto">
                No matter what kind of document you're dealing with, there's a PlainPath tool purpose-built for it.
              </motion.p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-border via-primary/30 to-border" />
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                  <Card className="h-full bg-white dark:bg-card border-slate-200/80 dark:border-border/50 shadow-md hover:shadow-xl hover:border-primary/20 transition-all rounded-2xl overflow-hidden">
                    <div className="p-7">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 relative z-10">
                          <step.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-4xl font-display font-bold text-foreground/8 dark:text-foreground/10 leading-none select-none">{step.step}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Band>
        </div>

        {/* ═══════════════════════════════════════════════════
            BAND 7 — VIDEO WALKTHROUGH  (dark cinematic)
        ════════════════════════════════════════════════════ */}
        <div className="w-full bg-gradient-to-b from-slate-950 via-[#0d1526] to-slate-950">
          <Band innerClassName="py-20">
            <VideoWalkthrough />
          </Band>
        </div>

        {/* ═══════════════════════════════════════════════════
            BAND 8 — LIVE DEMOS  (primary-tinted)
        ════════════════════════════════════════════════════ */}
        <div className="w-full bg-gradient-to-br from-blue-50 via-indigo-50/80 to-white dark:from-blue-950/35 dark:via-slate-900 dark:to-slate-900 border-y border-blue-100 dark:border-primary/15">
          <Band id="demos" innerClassName="py-16 scroll-mt-24">
            <div className="text-center mb-12">
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Live demos</motion.p>
              <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-3xl md:text-4xl font-display font-bold mb-3">One demo for each tool</motion.h2>
              <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.1 }} className="text-muted-foreground text-lg max-w-xl mx-auto">
                Four tools, four real-world examples. Click any card to try that tool with a pre-loaded scenario.
              </motion.p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {DEMOS.map((demo, i) => (
                <motion.div key={demo.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                  <button onClick={() => setLocation(demo.path)} className="w-full text-left h-full group">
                    <Card className={`h-full border-slate-200 dark:border-border/40 ${demo.hoverBorder} hover:shadow-xl transition-all overflow-hidden bg-white dark:bg-card rounded-2xl shadow-md`}>
                      <div className="p-6 flex flex-col h-full">
                        <div className={`w-11 h-11 rounded-xl ${demo.bg} flex items-center justify-center mb-4`}>
                          <demo.icon className={`w-5 h-5 ${demo.color}`} />
                        </div>
                        <p className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${demo.color}`}>{demo.tool}</p>
                        <h3 className={`text-base font-bold ${demo.hoverTitle} transition-colors mb-2 leading-snug`}>{demo.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{demo.desc}</p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {demo.tags.map((tag) => (
                            <span key={tag} className="inline-block px-2.5 py-1 rounded-full bg-secondary text-xs font-semibold text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                        <div className={`flex items-center gap-1.5 text-sm font-semibold ${demo.color}`}>
                          {demo.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </button>
                </motion.div>
              ))}
            </div>
          </Band>
        </div>

        {/* ═══════════════════════════════════════════════════
            BAND 9 — TESTIMONIALS  (muted)
        ════════════════════════════════════════════════════ */}
        <div className="w-full bg-gradient-to-br from-violet-50/90 via-purple-50/50 to-slate-50 dark:from-violet-950/20 dark:via-slate-900 dark:to-slate-900 border-y border-violet-100 dark:border-border/40">
          <Band innerClassName="py-16">
            <TestimonialsSection />
          </Band>
        </div>

        {/* ═══════════════════════════════════════════════════
            BAND 10 — PRICING  (clean white/dark)
        ════════════════════════════════════════════════════ */}
        <div id="pricing" className="w-full bg-white dark:bg-transparent border-y border-slate-200 dark:border-border/25">
          <PricingSection />
        </div>

        {/* ═══════════════════════════════════════════════════
            BAND 11 — FAQ  (muted, last section)
        ════════════════════════════════════════════════════ */}
        <div id="faq" className="w-full bg-gradient-to-b from-slate-100/90 via-slate-50 to-blue-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-t border-slate-200 dark:border-border/40">
          <Band innerClassName="py-16">
            <FAQSection />
          </Band>
        </div>

        {/* ═══════════════════════════════════════════════════
            BAND 12 — CLOSING CTA  (strong, dark)
        ════════════════════════════════════════════════════ */}
        <div className="w-full bg-gradient-to-br from-slate-950 via-[#0c1525] to-violet-950/40 border-t border-white/5">
          <Band innerClassName="py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xs font-semibold uppercase tracking-widest text-primary/70"
              >
                Get started today
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.1] tracking-tight text-balance"
              >
                Your next document<br />
                <span className="bg-gradient-to-r from-primary via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  shouldn't be a guessing game.
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-slate-400 text-lg leading-relaxed"
              >
                Free to start. No account required. Four tools to handle any document situation you face.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.18 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
              >
                <Button
                  size="lg"
                  onClick={() => setLocation("/import")}
                  className="h-12 px-8 text-base rounded-xl font-semibold shadow-lg shadow-primary/30 min-w-[200px]"
                >
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById("solutions")?.scrollIntoView({ behavior: "smooth" })}
                  className="h-12 px-8 text-base rounded-xl font-semibold border-white/20 text-white hover:bg-white/8 hover:border-white/35"
                >
                  Explore all four tools
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.28 }}
                className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2"
              >
                {["Plans from $4.99/month", "Cancel any time", "No documents stored on our servers"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </Band>
        </div>

      </main>
    </div>
  )
}
