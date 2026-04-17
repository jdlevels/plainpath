import React, { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppStoreBadge } from "@/components/ui/AppStoreBadge";
import { PlayStoreBadge } from "@/components/ui/PlayStoreBadge";
import { WaitlistModal } from "@/components/WaitlistModal";
import {
  FileText, ShieldAlert, FileSignature, ShieldCheck,
  ArrowRight, Upload, Sparkles, Scale,
  AlertTriangle, CheckCircle2, Clock, Lock, X as XIcon,
} from "lucide-react";

/* ─── Animation helpers ──────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ─── Tool pill data ─────────────────────────────────────── */
const TOOLS = [
  { label: "Analyze a Document",   icon: FileText,       cls: "tool-btn-blue",    href: "/app/analyze"       },
  { label: "Document Trust Check", icon: ShieldAlert,    cls: "tool-btn-red",     href: "/app/import?mode=trust-check"   },
  { label: "Build a Contract",     icon: FileSignature,  cls: "tool-btn-emerald", href: "/app/build-contract" },
  { label: "Contract Review",      icon: Scale,          cls: "tool-btn-amber",   href: "/app/contract-review" },
];

/* ─── Feature cards ─────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-l-blue-500 dark:border-l-blue-400",
    accent: "bg-blue-500 dark:bg-blue-400",
    glow: "from-blue-50 dark:from-blue-900/10",
    title: "Analyze a Document",
    desc: "Upload any letter, lease, permit, or notice. PlainPath extracts what it means, what you must do, and when — in plain English.",
    result: { label: "Action Step Extracted", value: "Sign and return the lease addendum before April 22nd.", icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
    tags: ["Leases", "Gov't letters", "Medical bills", "Court notices"],
    tagCls: "bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/40",
  },
  {
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-l-red-500 dark:border-l-red-400",
    accent: "bg-red-500 dark:bg-red-400",
    glow: "from-red-50 dark:from-red-900/10",
    title: "Document Trust Check",
    desc: "Think a bill or letter looks suspicious? PlainPath scores it for legitimacy, surfaces red flags, and gives you a clear verdict.",
    result: { label: "Verdict Issued", value: "High scam risk — 3 fraud signals detected. Do not pay.", icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
    tags: ["IRS letters", "Debt collectors", "Utility shutoffs", "Legal threats"],
    tagCls: "bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-700/40",
  },
  {
    icon: Scale,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-l-amber-500 dark:border-l-amber-400",
    accent: "bg-amber-500 dark:bg-amber-400",
    glow: "from-amber-50 dark:from-amber-900/10",
    title: "Contract Review",
    desc: "Before you sign, PlainPath reads the fine print. It flags unfair clauses, identifies missing protections, and gives you negotiation language.",
    result: { label: "Clause Flagged", value: "5-year global non-compete — courts routinely reject this scope.", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
    tags: ["Job offers", "Freelance deals", "NDAs", "Service agreements"],
    tagCls: "bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/40",
  },
  {
    icon: FileSignature,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    border: "border-l-emerald-500 dark:border-l-emerald-400",
    accent: "bg-emerald-500 dark:bg-emerald-400",
    glow: "from-emerald-50 dark:from-emerald-900/10",
    title: "Build a Contract",
    desc: "Answer plain-English questions about your deal. Get a complete, professional agreement with a gap analysis — ready to download and send.",
    result: { label: "Contract Ready", value: "Freelance Services Agreement · 6 clauses · Gap analysis complete.", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    tags: ["Freelance work", "NDAs", "Rental agreements", "Payment plans"],
    tagCls: "bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/40",
  },
];

/* ─── How it works ───────────────────────────────────────── */
const HOW = [
  { icon: Upload,       num: "01", title: "Upload or paste",    desc: "Photo, PDF, or plain text — any format works." },
  { icon: Sparkles,     num: "02", title: "AI reads it for you", desc: "PlainPath extracts meaning, risks, and required actions." },
  { icon: CheckCircle2, num: "03", title: "Act with confidence", desc: "Clear summary, action checklist, deadlines — no jargon." },
];

/* ─── Trust ──────────────────────────────────────────────── */
const TRUST = [
  { icon: FileText,    title: "Plain-English results",    desc: "No legal jargon. Every result is written to be read and acted on immediately." },
  { icon: Lock,        title: "Secure processing",        desc: "Documents are processed securely. Content is never sold or shared." },
  { icon: ShieldCheck, title: "Works for any document",   desc: "Leases, IRS letters, medical bills, contracts, notices — all handled." },
  { icon: CheckCircle2,title: "No account required",      desc: "Try any tool instantly — no sign-up needed to get your first result." },
];

/* ─── Pricing ────────────────────────────────────────────── */
const PLANS = [
  {
    name: "Starter",
    price: "$4.99",
    period: "/month",
    desc: "Document clarity on demand for individuals.",
    highlight: false,
    badge: null as string | null,
    tools: [
      { label: "Analyze a Document",   included: true  },
      { label: "Document Trust Check", included: false },
      { label: "Build a Contract",     included: false },
      { label: "Contract Review",      included: false },
    ],
    extras: [] as string[],
    cta: "Start with Starter",
    href: "/app/analyze",
  },
  {
    name: "Pro",
    price: "$14.99",
    period: "/month",
    desc: "Full access to all four tools. Best for individuals.",
    highlight: true,
    badge: "Most Popular",
    tools: [
      { label: "Analyze a Document",   included: true },
      { label: "Document Trust Check", included: true },
      { label: "Build a Contract",     included: true },
      { label: "Contract Review",      included: true },
    ],
    extras: ["Saved analysis history", "Deeper output formatting"],
    cta: "Get Pro",
    href: "/app/analyze",
  },
  {
    name: "Teams",
    price: "$49.99",
    period: "/month",
    desc: "All four tools for your entire team, with shared workflows.",
    highlight: false,
    badge: null as string | null,
    tools: [
      { label: "Analyze a Document",   included: true },
      { label: "Document Trust Check", included: true },
      { label: "Build a Contract",     included: true },
      { label: "Contract Review",      included: true },
    ],
    extras: ["Everything in Pro", "Team collaboration", "Admin dashboard", "Shared workflows"],
    cta: "Get Teams",
    href: "/app/analyze",
  },
];

/* ─── Component ──────────────────────────────────────────── */
export default function Home() {
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistPlatform, setWaitlistPlatform] = useState<"ios" | "android" | "both">("both")

  function openWaitlist(platform: "ios" | "android" | "both") {
    setWaitlistPlatform(platform)
    setWaitlistOpen(true)
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-0 md:pt-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/70 via-indigo-50/60 to-violet-100/50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-violet-200/30 dark:from-violet-900/20 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-end">

            {/* ── Left col ── */}
            <motion.div initial="hidden" animate="visible" className="pb-16 md:pb-24">
              <motion.div
                custom={0} variants={fadeUp}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 shadow-sm text-xs font-semibold text-primary tracking-wide uppercase mb-5"
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Web app — iOS &amp; Android coming soon
              </motion.div>

              <motion.h1
                custom={1} variants={fadeUp}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.06] tracking-tight mb-5 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Stop guessing what{" "}
                <span
                  className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  your documents
                </span>{" "}
                mean.
              </motion.h1>

              <motion.p
                custom={2} variants={fadeUp}
                className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed max-w-lg"
              >
                Leases, contracts, medical bills, and court notices. PlainPath gives you four ways to
                move forward: analyze documents, trust-check suspicious paperwork, review agreements,
                and build contracts — all in plain English.
              </motion.p>

              {/* Tool pills */}
              <motion.div custom={3} variants={fadeUp} className="grid grid-cols-2 gap-2 mb-6">
                {TOOLS.map(({ label, icon: Icon, cls, href }) => (
                  <a
                    key={label}
                    href={href}
                    className={`${cls} flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-opacity hover:opacity-80 w-full`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-tight">{label}</span>
                  </a>
                ))}
              </motion.div>

              {/* CTA + App Store badges */}
              <motion.div custom={4} variants={fadeUp} className="flex flex-col gap-3 mb-5" id="download">
                <a
                  href="/app/analyze"
                  className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 h-12 sm:h-14 text-sm font-semibold hover:opacity-90 transition-opacity w-fit"
                >
                  Try it free — no account needed <ArrowRight className="w-4 h-4" />
                </a>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <AppStoreBadge onClick={() => openWaitlist("ios")} />
                  <PlayStoreBadge onClick={() => openWaitlist("android")} />
                </div>
                <p className="text-xs text-muted-foreground/70">
                  iOS &amp; Android apps coming soon — tap to get notified.
                </p>
              </motion.div>

              <motion.div custom={5} variants={fadeUp}>
                <p className="text-xs text-muted-foreground">
                  Plans from $4.99/month &nbsp;·&nbsp; All four tools on Pro &nbsp;·&nbsp; Cancel anytime
                </p>
              </motion.div>
            </motion.div>

            {/* ── Right col — phone mockup (desktop only) ── */}
            <div className="hidden lg:relative lg:flex lg:justify-end pb-0">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[340px] mx-auto lg:mx-0"
              >
                <div className="absolute -inset-8 bg-gradient-to-tr from-primary/15 via-violet-200/20 dark:via-violet-900/10 to-transparent rounded-[4rem] blur-3xl -z-10" />

                <img
                  src={`${import.meta.env.BASE_URL}images/mockup-1.png`}
                  alt="PlainPath app on iPhone"
                  className="w-full h-auto drop-shadow-2xl rounded-[2.5rem] border-[7px] border-white/95 dark:border-zinc-800/95 object-cover aspect-[9/19.5]"
                />

                {/* Floating card — action step */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="absolute -left-10 top-[22%] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-border/50 w-[176px]"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground leading-tight">Action Step</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">Sign and return by Friday, April 14th.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card — trust verdict */}
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="absolute -right-8 top-[55%] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-border/50 w-[164px]"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 leading-tight">Scam Detected</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">3 red flags found. Do not pay.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card — timing */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="absolute -left-4 bottom-[12%] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-border/50 flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-[11px] font-semibold text-foreground">Ready in ~90 sec</p>
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />
      </section>

      {/* ════════════════════════════════════════════════
          FOUR TOOLS — premium cards
      ════════════════════════════════════════════════ */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">Four tools · one platform</p>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Every document situation,{" "}
              <span
                className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                covered.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you're reading, verifying, building, or negotiating — PlainPath has a tool for it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, color, bg, border, accent, glow, title, desc, result, tags, tagCls }, i) => {
              const ResultIcon = result.icon;
              return (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  whileHover={{ y: -3 }}
                  className={`bg-card rounded-2xl border-l-4 ${border} border border-border/60 shadow-sm relative overflow-hidden group h-full`}
                >
                  <div className={`absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl ${glow} to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-300`} />
                  <div className="relative z-10 p-7 flex flex-col h-full">
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                          {title}
                        </h3>
                        <div className={`h-0.5 w-8 ${accent} rounded-full mt-1.5 opacity-60`} />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">{desc}</p>
                    <div className={`${result.bg} rounded-xl p-3.5 mb-4 border border-border/40`}>
                      <div className="flex items-start gap-2.5">
                        <ResultIcon className={`w-4 h-4 ${result.color} mt-0.5 shrink-0`} />
                        <div>
                          <p className={`text-[11px] font-semibold ${result.color} uppercase tracking-wide mb-0.5`}>{result.label}</p>
                          <p className="text-xs text-foreground leading-relaxed font-medium">"{result.value}"</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(t => (
                        <span key={t} className={`px-2 py-0.5 ${tagCls} rounded-md text-[11px] font-medium`}>{t}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════ */}
      <div
        id="how-it-works"
        className="w-full bg-gradient-to-b from-slate-100/90 via-blue-50/50 to-slate-100/70 dark:from-zinc-900/80 dark:via-blue-950/20 dark:to-zinc-900/60 border-y border-slate-200/80 dark:border-zinc-800/60 py-16"
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <p className="text-center text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-12">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-border via-primary/30 to-border" />
            {HOW.map(({ icon: Icon, num, title, desc }) => (
              <div key={num} className="flex flex-col items-center text-center gap-3 relative">
                <div className="w-16 h-16 rounded-2xl bg-background border border-border/60 shadow-sm flex flex-col items-center justify-center gap-0.5">
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="text-[9px] font-bold text-muted-foreground tracking-widest">{num}</span>
                </div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TRUST / CREDIBILITY
      ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">Why PlainPath</p>
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Built for real people, not lawyers.
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Confusing documents shouldn't require hiring a professional every time.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRUST.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════ */}
      <div
        id="pricing"
        className="w-full bg-gradient-to-b from-slate-100/90 via-blue-50/40 to-slate-100/70 dark:from-zinc-900/80 dark:via-blue-950/10 dark:to-zinc-900/60 border-y border-slate-200/80 dark:border-zinc-800/60 py-20 md:py-28"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">Pricing</p>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Clear pricing.{" "}
              <span
                className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                No surprises.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits how you work. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className={`relative rounded-2xl border bg-card flex flex-col p-7 shadow-sm transition-shadow hover:shadow-md ${plan.highlight ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20" : "border-border/60"}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold px-4 py-1 rounded-full tracking-wide whitespace-nowrap shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-0.5 mb-2">
                    <span className="text-4xl font-bold text-foreground tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-0.5">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{plan.desc}</p>
                </div>

                <div className="space-y-2.5 mb-8 flex-1">
                  {plan.tools.map(tool => (
                    <div key={tool.label} className="flex items-center gap-2.5">
                      {tool.included
                        ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        : <XIcon className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                      }
                      <span className={`text-sm ${tool.included ? "text-foreground" : "text-muted-foreground/40"}`}>
                        {tool.label}
                      </span>
                    </div>
                  ))}
                  {plan.extras.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-border/40 space-y-2.5">
                      {plan.extras.map(extra => (
                        <div key={extra} className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm text-foreground">{extra}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href={plan.href}
                  className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            All plans include web and mobile access &nbsp;·&nbsp; No contracts &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          APP SHOWCASE — web + mobile
      ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-100/40 dark:from-emerald-900/10 via-blue-50/30 dark:via-blue-900/10 to-transparent rounded-3xl blur-xl -z-10" />
              <img
                src={`${import.meta.env.BASE_URL}images/mockup-2.png`}
                alt="PlainPath web app"
                className="w-full h-auto rounded-2xl shadow-2xl border border-border/50 object-cover"
              />
            </div>
            <div className="max-w-lg order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">Web &amp; Mobile</p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-5 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                One platform, every device.
              </h2>
              <p className="text-muted-foreground mb-7 leading-relaxed">
                Start on your phone with a photo. Finish on your laptop.
                PlainPath feels fast and natural everywhere.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Upload,       text: "Upload a photo, PDF, or paste text" },
                  { icon: Sparkles,     text: "AI analyzes in under 2 minutes" },
                  { icon: CheckCircle2, text: "Plain English summary + action plan" },
                ].map(({ icon: Icon, text }, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{text}</span>
                  </div>
                ))}
              </div>
              <a
                href="/app/analyze"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Open the web app <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRIVACY
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-br from-indigo-50/90 dark:from-indigo-950/30 via-violet-50/70 dark:via-violet-950/20 to-slate-50/90 dark:to-zinc-900/60 border-y border-indigo-100 dark:border-indigo-900/40 py-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center shrink-0">
              <Lock className="w-8 h-8 text-background" />
            </div>
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold mb-3 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your documents aren't permanently stored.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We don't sell your data. We don't train AI on your documents.
                Your contracts, bills, and notices belong to you.
                We process them to give you answers — then they stay secure.
              </p>
              <div className="flex flex-wrap gap-5 text-sm font-medium text-foreground">
                {["Not sold", "Not shared", "Not used for training", "Encrypted in transit"].map(item => (
                  <span key={item} className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" /> {item}
                  </span>
                ))}
              </div>
              <a
                href="/app/privacy"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Read our Privacy Policy <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          FINAL CTA — dark, premium
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-br from-slate-950 via-[#0c1525] to-violet-950/40 border-t border-white/5 py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-white/40 mb-4">Available on Web · iOS &amp; Android coming soon</p>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready for{" "}
            <span
              className="bg-gradient-to-r from-primary via-blue-400 to-violet-400 bg-clip-text text-transparent"
              style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              absolute clarity?
            </span>
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            Never sign something confusing again. PlainPath reads it so you don't have to.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <a
              href="/app/analyze"
              className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-6 h-13 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Try it free — no account needed <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="mt-6 text-xs text-white/25">
            Plans from $4.99/month &nbsp;·&nbsp; All four tools on Pro &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </div>

      <Footer />

      <WaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        defaultPlatform={waitlistPlatform}
      />
    </div>
  );
}
