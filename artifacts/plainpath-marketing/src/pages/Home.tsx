import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PhoneHeroDemo } from "@/components/PhoneHeroDemo";
import { WebAppDemo } from "@/components/WebAppDemo";
import StatsBar from "@/components/StatsBar";
import ToolsShowcase from "@/components/ToolsShowcase";
import DocumentSituations from "@/components/DocumentSituations";
import FAQSection from "@/components/FAQSection";
import VideoWalkthrough from "@/components/VideoWalkthrough";
import { BackToTop } from "@/components/BackToTop";
import { Card } from "@/components/ui/card";
import {
  FileText, ShieldCheck,
  ArrowRight, Upload, Sparkles, Scale,
  AlertTriangle, CheckCircle2, Clock, Lock, X as XIcon,
  CalendarX, Eye, FileScan,
  DollarSign, ChevronDown, Star,
} from "lucide-react";

/* ─── Animation helpers ──────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ─── Rotating floating badge ─────────────────────────────── */
const BADGE_CYCLE = [
  {
    key: "action",
    icon: CheckCircle2,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Action Step",
    desc: "Sign and return by April 22nd",
  },
  {
    key: "scam",
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-red-600 dark:text-red-400",
    title: "Scam Detected",
    desc: "3 red flags found. Do not pay.",
  },
  {
    key: "speed",
    icon: Clock,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    title: "Ready in ~90 sec",
    desc: "Analysis complete",
  },
]

function RotatingBadge() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % BADGE_CYCLE.length), 3000)
    return () => clearInterval(id)
  }, [])
  const b = BADGE_CYCLE[idx]
  const Icon = b.icon
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={b.key}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2.5 rounded-2xl shadow-lg border border-border/40 flex items-center gap-2.5 w-[168px]"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${b.iconBg}`}>
          <Icon className={`w-3 h-3 ${b.iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-foreground leading-tight">{b.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug truncate">{b.desc}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Feature cards ─────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileScan,
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
];

/* ─── How it works ───────────────────────────────────────── */
const HOW = [
  { icon: Upload,       num: "01", title: "Choose a tool and add your document", desc: "Upload a PDF or Word file, or paste your text — both tools start with one simple step." },
  { icon: Sparkles,     num: "02", title: "PlainPath reads and reviews",          desc: "Depending on the tool: it analyzes what your document means and surfaces risks, deadlines, and action steps — or reviews your contract clause by clause with risk identification." },
  { icon: CheckCircle2, num: "03", title: "Review results and take action",       desc: "Get plain-English results you can act on — summaries, risk flags, deadlines, clause breakdowns, and negotiation language." },
];

/* ─── Trust ──────────────────────────────────────────────── */
const TRUST = [
  { icon: CheckCircle2, title: "Guided action plan",           desc: "PlainPath surfaces deadlines, signatures, missing documents, risks, and next steps." },
  { icon: Lock,         title: "Temporary processing",         desc: "Files are processed only to return your results." },
  { icon: ShieldCheck,  title: "Privacy-minded document review", desc: "Your documents are not retained, shared, or used to train AI models." },
  { icon: FileText,     title: "Ready-to-use packet",          desc: "Compile your summary, checklist, risks, source evidence, and open items." },
];

/* ─── Live demos ─────────────────────────────────────────── */
const DEMOS = [
  {
    id: "analyze-lease",
    tool: "Analyze a Document",
    title: "Residential Lease — Unit 4B",
    desc: "A 12-page lease with a 60-day auto-renew trap, a capped late fee, and a landlord entry clause below state law minimums.",
    icon: FileScan,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    hoverBorder: "hover:border-blue-400/50",
    hoverTitle: "group-hover:text-blue-500 dark:group-hover:text-blue-400",
    tags: ["4 risks found", "4 next steps", "3 deadlines"],
    cta: "Open analysis",
    href: "/demo/analyze",
  },
  {
    id: "contract-review-employment",
    tool: "Contract Review",
    title: "Employment Offer — Heavily One-Sided",
    desc: "An offer letter with a 5-year global non-compete, no severance clause, and IP rights stripping. Risk level: High — negotiation language included.",
    icon: Scale,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    hoverBorder: "hover:border-amber-400/50",
    hoverTitle: "group-hover:text-amber-500 dark:group-hover:text-amber-400",
    tags: ["Risk level: High", "4 clauses flagged", "Negotiation language"],
    cta: "Review a contract",
    href: "/demo/contract-review",
  },
]

/* ─── Comparison ─────────────────────────────────────────── */
const COMPARISON_ROWS = [
  { feature: "Time to get an answer",     lawyer: "Days",              diy: "Hours",           pp: "Under 2 minutes" },
  { feature: "Cost",                      lawyer: "$150–$500/hour",    diy: "Free (if lucky)", pp: "$19.99/month" },
  { feature: "Plain English explanation", lawyer: "Sometimes",         diy: "Rarely",          pp: "Every time" },
  { feature: "Key terms surfaced",        lawyer: "Yes (manual)",      diy: "Not reliably",    pp: "Automatically" },
  { feature: "Contract risks identified", lawyer: "Yes",               diy: "Not reliably",    pp: "Yes" },
  { feature: "Available 24/7",           lawyer: "No",                diy: "Yes",             pp: "Yes" },
]

/* ─── Pricing ────────────────────────────────────────────── */
const PLANS = [
  {
    name: "PlainPath Pro",
    price: "$19.99",
    period: "/month",
    desc: "Analyze any document in plain English and get a full contract review before you sign — both tools, one plan.",
    highlight: true,
    badge: "All tools included" as string | null,
    tools: [
      { label: "Analyze a Document", included: true, comingSoon: false },
      { label: "Contract Review",    included: true, comingSoon: false },
    ],
    extras: ["Saved analysis history"] as string[],
    cta: "Get PlainPath Pro",
    href: "/app/subscribe?plan=pro",
  },
];

/* ─── Attorney cost comparison ───────────────────────────── */
const ATTORNEY_SCENARIOS = [
  {
    id: "lease",
    label: "Lease agreement",
    attyLow: 300, attyHigh: 600,
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Analyze a Document",
    note: "1–2 hrs at typical attorney rates of $150–$350/hr.",
  },
  {
    id: "employment",
    label: "Employment contract",
    attyLow: 500, attyHigh: 1500,
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Contract Review",
    note: "Employment attorney review, typically 3–10 hrs.",
  },
  {
    id: "freelance",
    label: "Freelance agreement",
    attyLow: 200, attyHigh: 800,
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Contract Review",
    note: "Simple contract review, typically 1–4 attorney hrs.",
  },
  {
    id: "nda",
    label: "NDA",
    attyLow: 300, attyHigh: 750,
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Contract Review",
    note: "NDA review or drafting, typically 1–3 attorney hrs.",
  },
  {
    id: "business",
    label: "Business contract",
    attyLow: 500, attyHigh: 2000,
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Contract Review",
    note: "Complex agreement review, typically 2–8 attorney hrs.",
  },
  {
    id: "irs",
    label: "IRS notice response",
    attyLow: 200, attyHigh: 600,
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Analyze a Document",
    note: "Tax attorney or CPA review, typically 1–3 hrs.",
  },
  {
    id: "eviction",
    label: "Eviction notice",
    attyLow: 150, attyHigh: 400,
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Analyze a Document",
    note: "Landlord-tenant attorney review, typically 1–2 hrs.",
  },
  {
    id: "medical",
    label: "Medical bill dispute",
    attyLow: 150, attyHigh: 350,
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Analyze a Document",
    note: "Healthcare billing advocate or attorney, 1–2 hrs.",
  },
  {
    id: "general",
    label: "General document review",
    attyLow: 200, attyHigh: 500,
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Analyze a Document",
    note: "General attorney document review, typically 1–2 hrs.",
  },
] as const;

function AttorneyComparison() {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const s = ATTORNEY_SCENARIOS[idx];
  const savingsLow  = s.attyLow  - s.ppPrice;
  const savingsHigh = s.attyHigh - s.ppPrice;

  /* Close dropdown when clicking outside */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="max-w-4xl mx-auto mb-12">
      {/* Section header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 mb-4">
          <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Attorney vs. PlainPath
          </span>
        </div>
        <h3
          className="text-2xl md:text-4xl font-bold text-foreground mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          One attorney hour or a full month of PlainPath?
        </h3>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Select a document type to see a typical cost comparison.
        </p>
      </div>

      {/* Scenario dropdown */}
      <div className="flex justify-center mb-6">
        <div ref={dropRef} className="relative w-full max-w-xs">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-card border border-border/70 rounded-xl shadow-sm text-sm font-semibold text-foreground hover:border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="truncate">{s.label}</span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute top-[calc(100%+6px)] left-0 right-0 bg-card border border-border/70 rounded-xl shadow-xl overflow-hidden"
                style={{ zIndex: 50 }}
              >
                {ATTORNEY_SCENARIOS.map((scenario, i) => (
                  <button
                    key={scenario.id}
                    onClick={() => { setIdx(i); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      idx === i
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted/60 font-normal"
                    }`}
                  >
                    {scenario.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Comparison card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="rounded-2xl border border-border/60 overflow-hidden shadow-sm"
        >
          <div className="grid grid-cols-2 divide-x divide-border/60">
            {/* Attorney column */}
            <div className="p-5 sm:p-8 bg-red-50/60 dark:bg-red-950/10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-900/30 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                  Attorney
                </span>
              </div>
              <p className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight leading-none mb-1">
                ${s.attyLow.toLocaleString()}–${s.attyHigh.toLocaleString()}
              </p>
              <p className="text-sm text-foreground/50 mb-4">per engagement</p>
              <div className="space-y-2">
                {[
                  "Hours of consultation",
                  "Scheduling required",
                  s.note,
                ].map((item) => (
                  <p key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 shrink-0 mt-1.5" />
                    {item}
                  </p>
                ))}
              </div>
            </div>

            {/* PlainPath column */}
            <div className="p-5 sm:p-8 bg-emerald-50/60 dark:bg-emerald-950/10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  PlainPath {s.ppPlan}
                </span>
              </div>
              <p className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight leading-none mb-1">
                ${s.ppPrice}
              </p>
              <p className="text-sm text-foreground/50 mb-4">per month</p>
              <div className="space-y-2">
                {[s.ppTool, "Results in under 2 minutes", "Cancel anytime"].map((item) => (
                  <p key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Savings footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 sm:px-7 py-4 bg-emerald-50/80 dark:bg-emerald-950/20 border-t border-border/50">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-0.5">
                Estimated savings on this task
              </p>
              <p className="text-xs text-muted-foreground">vs. one attorney engagement</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              ${Math.round(savingsLow).toLocaleString()}–${Math.round(savingsHigh).toLocaleString()}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-[11px] text-muted-foreground/55 mt-3 leading-relaxed">
        Attorney rates vary widely. Estimates reflect typical hourly ranges ($150–$500+/hr) and are approximate.
        PlainPath supplements but does not replace legal advice.
      </p>
    </div>
  );
}


/* ─── Component ──────────────────────────────────────────── */
const DEMO_INTERVAL_MS = 5200

export default function Home() {
  const [activeDemoTool, setActiveDemoTool] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveDemoTool(prev => (prev + 1) % 2), DEMO_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ behavior: "instant" })
    }
  }, [])

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-0 md:pt-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/70 via-indigo-200/55 to-violet-200/65 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-violet-200/30 dark:from-violet-900/20 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <motion.div
          className="absolute top-[-160px] left-[-120px] w-[580px] h-[580px] rounded-full bg-gradient-to-br from-blue-300/45 dark:from-blue-600/15 to-transparent blur-3xl pointer-events-none"
          animate={{ x: [0, 45, 0], y: [0, -35, 0], scale: [1, 1.14, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[40px] left-[28%] w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-violet-300/38 dark:from-violet-600/12 to-transparent blur-3xl pointer-events-none"
          animate={{ x: [0, -28, 0], y: [0, 28, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <motion.div
          className="absolute top-[25%] right-[8%] w-[360px] h-[360px] rounded-full bg-gradient-to-bl from-indigo-300/32 dark:from-indigo-600/10 to-transparent blur-3xl pointer-events-none"
          animate={{ x: [0, 22, 0], y: [0, 32, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 7 }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-end">

            {/* ── Left col ── */}
            <motion.div initial="hidden" animate="visible" className="pb-16 md:pb-24">
              <motion.div
                custom={0} variants={fadeUp}
                className="flex flex-wrap items-center gap-2.5 mb-5"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 shadow-sm text-xs font-semibold text-primary tracking-wide uppercase">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Web App — iOS Coming Soon
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50 shadow-sm text-xs font-semibold text-red-700 dark:text-red-400">
                  <Star className="w-3 h-3 text-amber-500" style={{ fill: "currentColor", color: "#f59e0b" }} />
                  Veteran-Owned Business
                </div>
              </motion.div>

              <motion.h1
                custom={1} variants={fadeUp}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.06] tracking-tight mb-5 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Understand it.{" "}
                <span
                  className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  Complete it.
                </span>{" "}
                Submit it.
              </motion.h1>

              <motion.p
                custom={2} variants={fadeUp}
                className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg"
              >
                PlainPath turns confusing paperwork into clear answers, required documents, signatures, risks, and next steps — so you know what to complete or ask before you submit or sign.
              </motion.p>

              {/* CTAs */}
              <motion.div custom={3} variants={fadeUp} className="flex flex-col gap-3 mb-5" id="download">
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/demo/analyze"
                    className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 h-12 sm:h-14 text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary/20"
                  >
                    Start a Document Plan <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/demo/contract-review"
                    className="inline-flex items-center gap-2 bg-background border border-border text-foreground rounded-xl px-5 h-12 sm:h-14 text-sm font-semibold hover:bg-secondary/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    Review a Contract <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground/70">PlainPath Pro &nbsp;•&nbsp; $19.99/month &nbsp;•&nbsp; Both tools included &nbsp;•&nbsp; Cancel anytime</p>
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

                <PhoneHeroDemo toolIndex={activeDemoTool} />

                {/* Single rotating floating badge — bottom-right, clear of phone content */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="absolute -right-5 top-[62%]"
                >
                  <RotatingBadge />
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />
      </section>

      {/* ════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-b from-sky-200/70 via-blue-100/60 to-slate-200/65 dark:from-zinc-900/80 dark:via-blue-950/20 dark:to-zinc-900/60 border-y border-sky-300/50 dark:border-zinc-800/60 py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <StatsBar />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          8 TOOLS — premium feature cards
      ════════════════════════════════════════════════ */}
      <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-background via-white/70 to-background dark:bg-transparent">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">2 tools available now</p>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Two common document situations,{" "}
              <span
                className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                covered.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Analyze any document in plain English or get a clause-by-clause contract review — clear answers in minutes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {FEATURES.map((feature, i) => {
              const { icon: Icon, color, bg, border, accent, glow, title, desc, result, tags, tagCls } = feature;
              const isComingSoon = (feature as any).comingSoon === true;
              const ResultIcon = result?.icon;
              return (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  whileHover={isComingSoon ? {} : { y: -3 }}
                  className={`bg-card rounded-2xl border-l-4 ${border} border border-border/85 shadow-md relative overflow-hidden h-full ${isComingSoon ? "opacity-55 cursor-default select-none" : "group"}`}
                >
                  <div className={`absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl ${glow} to-transparent opacity-50 ${isComingSoon ? "" : "group-hover:opacity-80"} transition-opacity duration-300`} />
                  <div className="relative z-10 p-7 flex flex-col h-full">
                    <div className="flex items-center justify-between gap-3.5 mb-4">
                      <div className="flex items-center gap-3.5">
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
                      {isComingSoon && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-semibold border border-slate-200/60 dark:border-slate-700/40">
                          <Clock className="w-3 h-3" />
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">{desc}</p>
                    {!isComingSoon && result && ResultIcon && (
                      <div className={`${result.bg} rounded-xl p-3.5 mb-4 border border-border/40`}>
                        <div className="flex items-start gap-2.5">
                          <ResultIcon className={`w-4 h-4 ${result.color} mt-0.5 shrink-0`} />
                          <div>
                            <p className={`text-[11px] font-semibold ${result.color} uppercase tracking-wide mb-0.5`}>{result.label}</p>
                            <p className="text-xs text-foreground leading-relaxed font-medium">"{result.value}"</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {!isComingSoon && tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(t => (
                          <span key={t} className={`px-2 py-0.5 ${tagCls} rounded-md text-[11px] font-medium`}>{t}</span>
                        ))}
                      </div>
                    )}
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
        className="w-full bg-gradient-to-b from-indigo-200/65 via-sky-100/60 to-blue-200/55 dark:from-zinc-900/80 dark:via-blue-950/20 dark:to-zinc-900/60 border-y border-indigo-300/45 dark:border-zinc-800/60 py-12"
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <p className="text-center text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-12">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-border via-primary/30 to-border" />
            {HOW.map(({ icon: Icon, num, title, desc }) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -3 }}
                className="flex flex-col items-center text-center gap-3 relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-background border border-border/60 shadow-sm flex flex-col items-center justify-center gap-0.5">
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="text-[9px] font-bold text-muted-foreground tracking-widest">{num}</span>
                </div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          THE PROBLEM — dark product story
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-b from-slate-100/80 via-white to-slate-100/60 dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900/90 border-b border-slate-300/50 dark:border-transparent py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-80px" }}>
            <div className="rounded-3xl bg-slate-950 dark:bg-slate-900 text-white px-6 py-16 sm:px-12 sm:py-20 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 opacity-80 pointer-events-none" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="mb-10">
                  <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-5">The problem</motion.p>
                  <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.06 }}
                    className="text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-white mb-6" style={{ fontFamily: "var(--font-display)" }}>
                    Every clause<br />matters.<br />
                    <span className="text-slate-400">Know what you're<br />agreeing to.</span>
                  </motion.h2>
                  <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.12 }}
                    className="text-slate-400 leading-relaxed text-base sm:text-lg max-w-2xl">
                    Contracts, notices, and government forms are written by specialists with one goal: protecting the organization that issued them. Nobody writes them for you.
                  </motion.p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: CalendarX, title: "Deadlines buried in fine print",        desc: "A 30-day window in paragraph 8 that nobody told you about. Once it passes, your options disappear. Analyze a Document surfaces every one.",                                   tool: "Analyze a Document", iconBg: "rgba(59,130,246,0.15)",  iconColor: "#60a5fa", badgeBorder: "rgba(59,130,246,0.35)",  badgeColor: "#93c5fd" },
                    { icon: Eye,       title: "Clauses that shift all the risk to you", desc: "One paragraph waives your right to dispute. Another transfers liability quietly. Contract Review reads it clause by clause and tells you exactly what you're agreeing to.", tool: "Contract Review",    iconBg: "rgba(245,158,11,0.15)", iconColor: "#fbbf24", badgeBorder: "rgba(245,158,11,0.35)", badgeColor: "#fcd34d" },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-3.5 bg-white/5 hover:bg-white/8 transition-colors rounded-2xl px-4 py-3.5">
                      <div style={{ backgroundColor: item.iconBg }} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon style={{ width: 16, height: 16, color: item.iconColor }} />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm mb-0.5 leading-snug">{item.title}</p>
                        <p className="text-slate-400 text-xs leading-relaxed mb-2">{item.desc}</p>
                        <span style={{ color: item.badgeColor, borderColor: item.badgeBorder }} className="inline-block text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5">{item.tool}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TOOLS SHOWCASE — 9-card detailed grid
      ════════════════════════════════════════════════ */}
      <div id="solutions" className="w-full bg-gradient-to-br from-indigo-200/75 via-violet-200/60 to-slate-200/70 dark:from-violet-950/22 dark:via-slate-900 dark:to-slate-900 border-y border-indigo-300/50 dark:border-border/40 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <ToolsShowcase />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          VIDEO WALKTHROUGH — dark cinematic
      ════════════════════════════════════════════════ */}
      <div id="walkthrough" className="w-full bg-gradient-to-b from-slate-950 via-[#0d1526] to-slate-950 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <VideoWalkthrough activeTool={activeDemoTool} onToolChange={setActiveDemoTool} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          LIVE DEMOS — one demo per tool
      ════════════════════════════════════════════════ */}
      <div id="demos" className="w-full bg-gradient-to-br from-blue-200/75 via-indigo-200/60 to-sky-200/70 dark:from-blue-950/35 dark:via-slate-900 dark:to-slate-900 border-y border-blue-300/50 dark:border-primary/15 py-12 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-8">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Live demos</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>Pre-loaded examples — ready to run</motion.h2>
            <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Real documents, real scenarios — one per live tool. Click any card to open a pre-loaded example in the web app.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {DEMOS.map((demo, i) => (
              <motion.div key={demo.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="h-full">
                <a href={demo.href} className="w-full text-left h-full group block">
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
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          DOCUMENT SITUATIONS
      ════════════════════════════════════════════════ */}
      <div id="common-documents" className="w-full bg-gradient-to-br from-slate-200/70 via-blue-100/55 to-indigo-200/65 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-y border-slate-300/55 dark:border-border/40 py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <DocumentSituations />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TRUST / CREDIBILITY
      ════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-slate-100 via-blue-50/90 to-slate-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border-b border-slate-200/80 dark:border-border/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-block bg-white/70 dark:bg-card/60 backdrop-blur-sm rounded-2xl px-8 py-6 border border-slate-200/70 dark:border-border/40 shadow-sm mb-4">
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-foreground/60 dark:text-foreground/55 mb-3">Why PlainPath</p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-3 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Built for real people, not lawyers.
              </h2>
              <p className="text-foreground/70 dark:text-foreground/65 max-w-lg mx-auto">
                Confusing documents shouldn't require hiring a professional every time.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRUST.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-2xl border border-border/70 p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
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
          FAQ
      ════════════════════════════════════════════════ */}
      <div id="faq" className="w-full bg-gradient-to-b from-sky-200/65 via-blue-100/55 to-indigo-200/55 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-y border-sky-300/45 dark:border-border/40 py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <FAQSection />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          COMPARISON — PlainPath vs. alternatives
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-b from-slate-950 via-[#0c1525] to-slate-950 border-y border-white/5 py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10">
            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-xs font-semibold tracking-[0.12em] uppercase text-white/35 mb-3"
            >
              Compare
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4 text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              PlainPath vs.{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-violet-400 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                the old way
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/45"
            >
              Why pay $150/hour for answers that take seconds?
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-4 bg-white/5 border-b border-white/10">
              <div className="py-4 px-5 text-sm font-semibold text-white/40" />
              <div className="py-4 px-4 text-center text-sm font-semibold text-white/40">Hire a Lawyer</div>
              <div className="py-4 px-4 text-center text-sm font-semibold text-white/40">Google It</div>
              <div className="py-4 px-4 text-center">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">PlainPath ✓</span>
              </div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className={`grid grid-cols-4 border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"} hover:bg-white/[0.04] transition-colors`}
              >
                <div className="py-4 px-5 text-sm font-medium text-white/65 flex items-center">{row.feature}</div>
                <div className="py-4 px-4 text-center text-sm text-white/35 flex items-center justify-center">{row.lawyer}</div>
                <div className="py-4 px-4 text-center text-sm text-white/35 flex items-center justify-center">{row.diy}</div>
                <div className="py-4 px-4 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{row.pp}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-10 text-center"
          >
            <a
              href="/demo"
              className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-8 py-3.5 text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/30"
            >
              Open App <ArrowRight className="w-4 h-4" />
            </a>
            <p className="mt-3 text-xs text-white/30">PlainPath Pro · $19.99/month · Cancel anytime</p>
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════ */}
      <div
        id="pricing"
        className="w-full bg-gradient-to-b from-violet-200/70 via-blue-200/55 to-indigo-200/65 dark:from-zinc-900/80 dark:via-blue-950/10 dark:to-zinc-900/60 border-y border-violet-300/50 dark:border-zinc-800/60 py-20 md:py-28"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3"
            >
              Pricing
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Honest pricing.{" "}
              <span
                className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                No surprises.
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="text-lg text-muted-foreground"
            >
              Both tools included. No commitment — cancel anytime.
            </motion.p>
          </div>

          {/* ── Attorney cost comparison ── */}
          <AttorneyComparison />

          <div className="max-w-xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className={`relative rounded-3xl border bg-card flex flex-col p-10 shadow-sm transition-shadow hover:shadow-xl ${plan.highlight ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20" : "border-border/60"}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold px-4 py-1 rounded-full tracking-wide whitespace-nowrap shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                      {plan.name}
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-0.5 mb-1">
                    <span className="text-4xl font-bold text-foreground tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm ml-0.5">{plan.period}</span>
                  </div>
                  <div className="mb-2" />
                  <p className="text-sm text-muted-foreground leading-snug">{plan.desc}</p>
                </div>

                <div className="space-y-2.5 mb-8 flex-1">
                  {plan.tools.map(tool => (
                    <div key={tool.label} className="flex items-center gap-2.5">
                      {tool.comingSoon
                        ? <Clock className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        : tool.included
                          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          : <XIcon className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                      }
                      <span className={`text-sm ${tool.comingSoon ? "text-muted-foreground/40 italic" : tool.included ? "text-foreground" : "text-muted-foreground/40"}`}>
                        {tool.label}{tool.comingSoon ? " — coming soon" : ""}
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

                <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>30-day money-back guarantee</span>
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

          {/* ── Trust badges ── */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {[
              { icon: Lock,         text: "Encrypted in transit" },
              { icon: XIcon,        text: "Data never sold" },
              { icon: ShieldCheck,  text: "Not used for AI training" },
              { icon: CheckCircle2, text: "Cancel anytime" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                {text}
              </span>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Web access included on all plans &nbsp;·&nbsp; iOS app coming soon
          </p>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Questions? Email us at{" "}
            <a href="mailto:support@plainpathapp.com" className="text-primary hover:underline font-medium">
              support@plainpathapp.com
            </a>
          </p>
        </div>
      </div>


      {/* ════════════════════════════════════════════════
          APP SHOWCASE — web + mobile
      ════════════════════════════════════════════════ */}
      <section id="app-showcase" className="py-16 md:py-20 bg-gradient-to-b from-slate-950 via-[#0c1525] to-slate-950 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

            {/* ── Left: live demo panel — no padding, fills fully ── */}
            <div className="relative order-2 lg:order-1 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-zinc-800/60 min-h-[360px]">
              <WebAppDemo activeTool={activeDemoTool} onToolChange={setActiveDemoTool} />
            </div>

            {/* ── Right: content panel ── */}
            <div className="order-1 lg:order-2 flex">
              <div className="bg-zinc-900/70 backdrop-blur-md rounded-2xl px-7 py-8 border border-zinc-800/50 shadow-xl flex-1 flex flex-col justify-center">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-zinc-500 mb-3">Works on Every Device</p>
                <h2
                  className="text-3xl md:text-4xl font-bold mb-5 text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  One platform, every device.
                </h2>
                <p className="text-zinc-400 mb-7 leading-relaxed">
                  Available on any device — phone, tablet, or laptop. No app to install — open it in any browser and start immediately.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: Upload,       text: "Upload a PDF, Word file, or paste text" },
                    { icon: Sparkles,     text: "AI analyzes in under 2 minutes" },
                    { icon: CheckCircle2, text: "Plain English summary + action plan" },
                  ].map(({ icon: Icon, text }, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-zinc-300 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="/app/sign-in"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Open the web app <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRIVACY
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-br from-indigo-200/75 dark:from-indigo-950/30 via-violet-200/60 dark:via-violet-950/20 to-blue-200/70 dark:to-zinc-900/60 border-y border-indigo-300/50 dark:border-indigo-900/40 py-16">
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
                Your data is never sold or used for AI training.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We don't sell your data. We don't train AI on your documents. Your documents are processed and discarded after your results are returned — we never retain them across sessions.
              </p>
              <div className="flex flex-wrap gap-5 text-sm font-medium text-foreground">
                {["Not sold", "Not shared", "Not used for training", "Encrypted in transit"].map(item => (
                  <span key={item} className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" /> {item}
                  </span>
                ))}
              </div>
              <a
                href="/privacy"
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
      <div className="w-full bg-gradient-to-br from-slate-950 via-[#0c1525] to-violet-950/40 border-t border-white/5 py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.12em] uppercase text-white/40 mb-4"
          >
            Available on Web · iOS coming soon
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-5xl md:text-6xl font-bold mb-5 text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Stop guessing.{" "}
            <span
              className="bg-gradient-to-r from-primary via-blue-400 to-violet-400 bg-clip-text text-transparent"
              style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              Start understanding.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="text-xl text-white/60 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Upload your document and get clear answers in minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-wrap justify-center gap-4 mb-6"
          >
            <a
              href="/demo/analyze"
              className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-8 py-4 text-base font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/30"
            >
              Analyze a Document <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
          <p className="mt-6 text-xs text-white/30">
            PlainPath Pro &nbsp;·&nbsp; $19.99/month &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </div>

      <Footer />

      <BackToTop />

    </div>
  );
}
