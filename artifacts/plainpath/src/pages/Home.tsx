import { useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  ArrowRight, FileCheck, Clock, ShieldCheck, Upload,
  Sparkles, ClipboardList, GraduationCap, Banknote,
  Receipt, Scale, HeartPulse, FileSignature, MailWarning,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import PricingSection from "@/components/PricingSection"
import GridPulseCanvas from "@/components/GridPulseCanvas"

const DEMOS = [
  {
    id: "event-permit",
    title: "Small Business Event Permit Packet",
    desc: "City government permit to host a public event. Requires 4 departmental sign-offs, a $1M liability certificate, and a 45-day lead time before the event date.",
    icon: ClipboardList,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    tags: ["8 action steps", "6 required docs", "3 deadlines"],
  },
  {
    id: "school-enrollment",
    title: "School Enrollment Packet",
    desc: "K–12 district enrollment requiring residency proof, immunization compliance, and prior school records. One missing document holds up the entire registration.",
    icon: GraduationCap,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    tags: ["7 action steps", "6 required docs", "2 deadlines"],
  },
  {
    id: "grant-application",
    title: "Small Business Community Grant Application",
    desc: "Competitive city grant for $5,000–$25,000. Requires a business plan, 2 years of financials, vendor quotes, and references. Incomplete packages are not reviewed.",
    icon: Banknote,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    tags: ["8 action steps", "8 required docs", "2 deadlines"],
  },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload or paste your document",
    desc: "Drop in a PDF, Word file, or paste text directly. PlainPath reads the full content.",
    icon: Upload,
  },
  {
    step: "02",
    title: "We extract every requirement",
    desc: "Required steps, documents, deadlines, risks, and open questions — all pulled from the source.",
    icon: FileCheck,
  },
  {
    step: "03",
    title: "Work through your action plan",
    desc: "Check off items as you go. Track what's missing and see your progress in real time.",
    icon: CheckCircle2,
  },
]

const DOCUMENT_FAMILIES = [
  { icon: Receipt,       label: "Tax & Government Forms",    color: "text-violet-500 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-950/50"  },
  { icon: Scale,         label: "Legal & Business Filings",  color: "text-blue-500 dark:text-blue-400",      bg: "bg-blue-50 dark:bg-blue-950/50"      },
  { icon: HeartPulse,    label: "Healthcare & Insurance",     color: "text-rose-500 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-950/50"      },
  { icon: FileSignature, label: "Contracts & Agreements",     color: "text-amber-500 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-950/50"    },
  { icon: MailWarning,   label: "Bills, Notices & Summons",   color: "text-emerald-500 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-950/50"},
  { icon: Sparkles,      label: "Applications & Permits",     color: "text-indigo-500 dark:text-indigo-400",  bg: "bg-indigo-50 dark:bg-indigo-950/50"  },
]

export default function Home() {
  const [, setLocation] = useLocation()

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Hero — Grid Pulse dark background ────────────── */}
      <div className="relative w-full overflow-hidden bg-[#0f172a]" style={{ minHeight: "88vh" }}>
        <GridPulseCanvas />
        <div className="relative z-10 flex flex-col items-center px-4">
          <section className="max-w-4xl w-full text-center pt-24 pb-24 space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300 tracking-wide uppercase backdrop-blur-sm"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Structured document analysis
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
              className="text-5xl md:text-[4.5rem] lg:text-[5.5rem] font-display font-bold tracking-tight text-white leading-[1.05] text-balance"
            >
              Stop guessing what<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-500">a document requires.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              PlainPath reads your paperwork and gives you a clear, prioritized action plan — every required step, every document to gather, every deadline — in plain English.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 text-base px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border-0"
                onClick={() => setLocation("/import")}
              >
                Analyze a Document <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 text-base rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20"
                onClick={() => document.getElementById("demos")?.scrollIntoView({ behavior: "smooth" })}
              >
                View demos
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            >
              {[
                "From $4.99/month",
                "No account required",
                "Documents not stored by PlainPath",
                "Analyses saved on your device only",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                  {item}
                </span>
              ))}
            </motion.div>
          </section>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center pb-36 px-4">

        {/* ── Document types strip ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-6xl mb-32 pt-16"
        >
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8">Works with all kinds of confusing paperwork</p>
          <div className="flex flex-wrap justify-center gap-4">
            {DOCUMENT_FAMILIES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-default"
              >
                <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center`}>
                  <f.icon className={`w-4.5 h-4.5 ${f.color}`} />
                </div>
                <span className="text-base font-semibold text-foreground/80">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── How it works ──────────────────────────────────── */}
        <section className="max-w-7xl w-full mb-36">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4"
            >
              How it works
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-display font-bold"
            >
              From confusing to clear in seconds
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-border via-primary/30 to-border" />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <Card className="h-full bg-card border-border/50 shadow-md hover:shadow-xl transition-shadow rounded-2xl overflow-hidden">
                  <div className="p-9">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-13 h-13 rounded-2xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30 relative z-10 w-[52px] h-[52px]">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-6xl font-display font-bold text-foreground/10 leading-none select-none">{step.step}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground text-base leading-relaxed">{step.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── What you get ─────────────────────────────────── */}
        <section className="max-w-7xl w-full mb-36">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4"
            >
              What you get
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-display font-bold"
            >
              Everything a document is asking for — organized
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileCheck,
                title: "Prioritized Action Steps",
                desc: "Every task extracted and ranked by urgency. High-priority items flagged first. Category labels on every step.",
                color: "bg-primary/10",
                iconColor: "text-primary",
              },
              {
                icon: ShieldCheck,
                title: "Required Documents",
                desc: "A complete list of every attachment, form, ID, or proof you need to gather — with source quotes showing exactly where each was mentioned.",
                color: "bg-emerald-50 dark:bg-emerald-950/50",
                iconColor: "text-emerald-600 dark:text-emerald-400",
              },
              {
                icon: Clock,
                title: "Deadlines & Risks",
                desc: "Hard dates surfaced from fine print. High-severity risks flagged before they become problems. Confidence ratings on every item.",
                color: "bg-rose-50 dark:bg-rose-950/50",
                iconColor: "text-rose-600 dark:text-rose-400",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-card border-border/40 shadow-md hover:shadow-xl transition-shadow rounded-2xl">
                  <div className="p-9 space-y-6">
                    <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center`}>
                      <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                      <p className="text-muted-foreground text-base leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Demos ────────────────────────────────────────── */}
        <section id="demos" className="max-w-7xl w-full scroll-mt-24">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4"
            >
              Live demos
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-display font-bold mb-4"
            >
              See a real result instantly
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-xl max-w-xl mx-auto"
            >
              Three pre-loaded examples — click any card to open a full structured action plan.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {DEMOS.map((demo, i) => (
              <motion.div
                key={demo.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
              >
                <button
                  onClick={() => setLocation(`/analyze?demo=${demo.id}`)}
                  className="w-full text-left h-full group"
                >
                  <Card className="h-full border-border/40 hover:border-primary/40 hover:shadow-xl transition-all overflow-hidden bg-card rounded-2xl shadow-md">
                    <div className="p-8 flex flex-col h-full">
                      <div className={`w-14 h-14 rounded-2xl ${demo.bg} flex items-center justify-center mb-6`}>
                        <demo.icon className={`w-7 h-7 ${demo.color}`} />
                      </div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-3 leading-snug">{demo.title}</h3>
                      <p className="text-base text-muted-foreground leading-relaxed mb-6 flex-1">{demo.desc}</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {demo.tags.map((tag) => (
                          <span key={tag} className="inline-block px-3 py-1.5 rounded-full bg-secondary text-sm font-semibold text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-base font-semibold text-primary">
                        Open action plan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────── */}
        <PricingSection />

      </main>
    </div>
  )
}
