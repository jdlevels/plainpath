import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppStoreBadge } from "@/components/ui/AppStoreBadge";
import { PlayStoreBadge } from "@/components/ui/PlayStoreBadge";
import { WaitlistModal } from "@/components/WaitlistModal";
import { PhoneHeroDemo } from "@/components/PhoneHeroDemo";
import { WebAppDemo } from "@/components/WebAppDemo";
import StatsBar from "@/components/StatsBar";
import ToolsShowcase from "@/components/ToolsShowcase";
import DocumentSituations from "@/components/DocumentSituations";
import FAQSection from "@/components/FAQSection";
import VideoWalkthrough from "@/components/VideoWalkthrough";
import { Card } from "@/components/ui/card";
import {
  FileText, ShieldAlert, FileSignature, ShieldCheck,
  ArrowRight, Upload, Sparkles, Scale,
  AlertTriangle, CheckCircle2, Clock, Lock, X as XIcon, EyeOff, Pen,
  CalendarX, Eye, PenLine, FileScan,
  DollarSign, Copy, Users,
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

/* ─── Tool pill data ─────────────────────────────────────── */
const TOOLS = [
  { label: "Analyze a Document",    icon: FileText,      cls: "tool-btn-blue",    href: "/app/analyze",       comingSoon: false },
  { label: "Document Trust Check",  icon: ShieldAlert,   cls: "tool-btn-red",     href: "/app/import?mode=trust-check", comingSoon: false },
  { label: "Build a Contract",      icon: FileSignature, cls: "tool-btn-emerald", href: "/app/build-contract", comingSoon: false },
  { label: "Contract Review",       icon: Scale,         cls: "tool-btn-amber",   href: "/app/contract-review", comingSoon: false },
  { label: "Redact Sensitive Info", icon: EyeOff,        cls: "tool-btn-violet",  href: "/app/redact",         comingSoon: false },
  { label: "Digital Signature",     icon: Pen,           cls: "tool-btn-slate",   href: "",                    comingSoon: true  },
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
  {
    icon: EyeOff,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-900/30",
    border: "border-l-violet-500 dark:border-l-violet-400",
    accent: "bg-violet-500 dark:bg-violet-400",
    glow: "from-violet-50 dark:from-violet-900/10",
    title: "Redact Sensitive Info",
    desc: "Paste or upload any document. PlainPath detects names, SSNs, account numbers, phone numbers, and more — then you choose exactly what gets removed before sharing or analyzing.",
    result: { label: "Redaction Applied", value: "3 names, 2 SSNs, and 1 account number removed. Redacted copy ready to share.", icon: Lock, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
    tags: ["Medical records", "Legal documents", "Financial statements", "Personal correspondence"],
    tagCls: "bg-violet-50/80 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-700/40",
  },
  {
    icon: Pen,
    color: "text-slate-400 dark:text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800/40",
    border: "border-l-slate-300 dark:border-l-slate-700",
    accent: "bg-slate-300 dark:bg-slate-700",
    glow: "from-slate-50 dark:from-slate-900/10",
    title: "Digital Signature",
    desc: "Request signatures, track status, and complete multi-party signing workflows — all without leaving PlainPath. Integrates with any document you build or review.",
    result: null,
    tags: [],
    tagCls: "",
    comingSoon: true,
  },
];

/* ─── How it works ───────────────────────────────────────── */
const HOW = [
  { icon: Upload,       num: "01", title: "Drop it in",            desc: "PDF, Word file, or paste text — any text-based document." },
  { icon: Sparkles,     num: "02", title: "AI does the reading",   desc: "PlainPath extracts what matters: risks, obligations, deadlines, and required actions." },
  { icon: CheckCircle2, num: "03", title: "Get clarity, not confusion", desc: "A plain-English summary, prioritized action checklist, and deadlines — every time." },
];

/* ─── Trust ──────────────────────────────────────────────── */
const TRUST = [
  { icon: FileText,    title: "Results you can act on",   desc: "Every analysis is written in plain English — no jargon. Read it once and know exactly what to do." },
  { icon: Lock,        title: "Your documents stay yours", desc: "Documents are never stored permanently. We don't sell your data or train AI on your files." },
  { icon: ShieldCheck, title: "Built for every document",  desc: "Leases, IRS letters, medical bills, contracts, court notices, NDAs — PlainPath handles them all." },
  { icon: CheckCircle2,title: "Start in seconds",          desc: "No account needed for your first analysis. Try any tool immediately — sign up when you're ready." },
];

/* ─── Live demos ─────────────────────────────────────────── */
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
    href: "/app/analyze?demo=event-permit",
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
    href: "/app/import?mode=trust-check",
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
    href: "/app/build-contract",
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
    href: "/app/contract-review",
  },
  {
    id: "redact-medical",
    tool: "Redact Sensitive Info",
    title: "Medical Intake Form — Before Sharing",
    desc: "A patient intake form with SSN, insurance number, and date of birth. PlainPath detects all 3 automatically and lets you approve each redaction before export.",
    icon: EyeOff,
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    hoverBorder: "hover:border-violet-400/50",
    hoverTitle: "group-hover:text-violet-500 dark:group-hover:text-violet-400",
    tags: ["3 PII items found", "You approve each", "Export redacted copy"],
    cta: "Try redaction",
    href: "/app/redact",
  },
]

/* ─── Pricing ────────────────────────────────────────────── */
const PLANS = [
  {
    name: "Starter",
    monthly: { price: "$4.99", period: "/month", sub: null },
    annual:  { price: "$47.99", period: "/year", sub: "billed annually", eq: "≈ $4.00/mo", savings: "Save about 20%" },
    desc: "Analyze and redact documents in plain English — key terms, deadlines, required actions, and sensitive info removal. Unlimited use.",
    highlight: false,
    badge: null as string | null,
    tools: [
      { label: "Analyze a Document",    included: true,  comingSoon: false },
      { label: "Document Trust Check",  included: false, comingSoon: false },
      { label: "Build a Contract",      included: false, comingSoon: false },
      { label: "Contract Review",       included: false, comingSoon: false },
      { label: "Redact Sensitive Info", included: true,  comingSoon: false },
      { label: "Digital Signature",     included: false, comingSoon: true  },
    ],
    extras: [] as string[],
    cta: "Subscribe to Starter",
    href: "/app/subscribe?plan=starter",
  },
  {
    name: "Pro",
    monthly: { price: "$29.99", period: "/month", sub: null },
    annual:  { price: "$251.99", period: "/year", sub: "billed annually", eq: "≈ $21.00/mo", savings: "Save about 30%" },
    desc: "All 5 live tools in one plan — unlimited use across every workflow.",
    highlight: true,
    badge: "Best Value",
    tools: [
      { label: "Analyze a Document",    included: true,  comingSoon: false },
      { label: "Document Trust Check",  included: true,  comingSoon: false },
      { label: "Build a Contract",      included: true,  comingSoon: false },
      { label: "Contract Review",       included: true,  comingSoon: false },
      { label: "Redact Sensitive Info", included: true,  comingSoon: false },
      { label: "Digital Signature",     included: false, comingSoon: true  },
    ],
    extras: ["Saved analysis history", "Premium output and workflow tools"],
    cta: "Subscribe to Pro",
    href: "/app/subscribe?plan=pro",
  },
];

/* ─── Attorney cost comparison ───────────────────────────── */
const ATTORNEY_SCENARIOS = [
  {
    id: "lease",
    label: "Review a Lease",
    attyLow: 300, attyHigh: 600,
    ppPlan: "Starter",
    ppPrice: 4.99,
    ppTool: "Analyze a Document",
    note: "1–2 hrs at typical attorney rates of $150–$350/hr.",
  },
  {
    id: "trust",
    label: "Check a Suspicious Letter",
    attyLow: 150, attyHigh: 400,
    ppPlan: "Pro",
    ppPrice: 29.99,
    ppTool: "Document Trust Check",
    note: "Brief attorney consultation for letter review.",
  },
  {
    id: "employment",
    label: "Review an Employment Contract",
    attyLow: 500, attyHigh: 1500,
    ppPlan: "Pro",
    ppPrice: 29.99,
    ppTool: "Contract Review",
    note: "Employment attorney review, typically 3–10 hrs.",
  },
  {
    id: "build",
    label: "Build a Freelance Contract",
    attyLow: 200, attyHigh: 800,
    ppPlan: "Pro",
    ppPrice: 29.99,
    ppTool: "Build a Contract",
    note: "Simple contract drafting, typically 1–4 attorney hrs.",
  },
  {
    id: "redact",
    label: "Redact a Document",
    attyLow: 100, attyHigh: 300,
    ppPlan: "Starter",
    ppPrice: 4.99,
    ppTool: "Redact Sensitive Info",
    note: "Redaction services via paralegal or attorney.",
  },
] as const;

function AttorneyComparison() {
  const [idx, setIdx] = useState(0);
  const s = ATTORNEY_SCENARIOS[idx];
  const savingsLow  = s.attyLow  - s.ppPrice;
  const savingsHigh = s.attyHigh - s.ppPrice;

  return (
    <div className="max-w-3xl mx-auto mb-14">
      {/* Section header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 mb-4">
          <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Attorney vs. PlainPath
          </span>
        </div>
        <h3
          className="text-2xl md:text-3xl font-bold text-foreground mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          One attorney hour or a full month of PlainPath?
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Select a task to see a typical cost comparison. Attorney rates vary by region and specialization.
        </p>
      </div>

      {/* Scenario pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-7">
        {ATTORNEY_SCENARIOS.map((scenario, i) => (
          <button
            key={scenario.id}
            onClick={() => setIdx(i)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
              idx === i
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-transparent text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {scenario.label}
          </button>
        ))}
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
            <div className="p-6 sm:p-8 bg-red-50/60 dark:bg-red-950/10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-900/30 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                  Attorney
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-none mb-1">
                ${s.attyLow.toLocaleString()}–${s.attyHigh.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mb-5">per engagement</p>
              <div className="space-y-2">
                {[
                  "Hours of consultation",
                  "Scheduling delays",
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
            <div className="p-6 sm:p-8 bg-emerald-50/60 dark:bg-emerald-950/10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  PlainPath {s.ppPlan}
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-none mb-1">
                ${s.ppPrice}
              </p>
              <p className="text-sm text-muted-foreground mb-5">per month · unlimited use</p>
              <div className="space-y-2">
                {[
                  s.ppTool,
                  "Results in under 2 minutes",
                  "Cancel anytime",
                ].map((item) => (
                  <p key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Savings footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-4 bg-emerald-50/80 dark:bg-emerald-950/20 border-t border-border/50">
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

      <p className="text-center text-[11px] text-muted-foreground/55 mt-4 leading-relaxed">
        Attorney rates vary widely. Estimates reflect typical hourly ranges ($150–$500+/hr) and are approximate.
        PlainPath supplements but does not replace legal advice.
      </p>
    </div>
  );
}

/* ─── Refer a friend ─────────────────────────────────────── */
function ReferFriend() {
  const [copied, setCopied] = useState(false);
  const url = "https://plainpathapp.com";

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {});
  }

  return (
    <div className="w-full bg-gradient-to-br from-violet-50/80 via-blue-50/60 to-slate-50 dark:from-violet-950/30 dark:via-blue-950/20 dark:to-zinc-900/60 border-y border-violet-100/60 dark:border-violet-900/30 py-20">
      <div className="max-w-xl mx-auto px-5 sm:px-6 text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <Users className="w-7 h-7 text-primary" />
        </div>

        <h3
          className="text-2xl md:text-3xl font-bold text-foreground mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Know someone dealing with confusing paperwork?
        </h3>
        <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto mb-7">
          No account needed to try their first document analysis. Share the link and they can start immediately.
        </p>

        {/* Value bullets */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2.5 mb-8">
          {[
            "No account needed",
            "Results in under 2 minutes",
            "Any document type",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {item}
            </span>
          ))}
        </div>

        {/* Copy box */}
        <div className="flex items-center gap-2 bg-background border border-border/60 rounded-xl pl-4 pr-1.5 py-1.5 max-w-sm mx-auto shadow-sm">
          <span className="text-sm text-muted-foreground flex-1 truncate font-mono leading-none py-1.5">
            {url}
          </span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              copied
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Copied!
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy link
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        <p className="text-xs text-muted-foreground/50 mt-4">
          Just the link — no spam, no referral tracking.
        </p>
      </div>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────── */
export default function Home() {
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistPlatform, setWaitlistPlatform] = useState<"ios" | "android" | "both">("both")
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")

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
                Leases, contracts, medical bills, and court notices. PlainPath gives you 5 tools to
                move forward: analyze documents, trust-check suspicious paperwork, review agreements,
                build contracts, and redact sensitive information — all in plain English.
              </motion.p>

              {/* Tool pills */}
              <motion.div custom={3} variants={fadeUp} className="grid grid-cols-2 gap-2 mb-6">
                {TOOLS.map(({ label, icon: Icon, cls, href, comingSoon }) => (
                  comingSoon ? (
                    <span
                      key={label}
                      className="relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/30 text-xs sm:text-sm font-medium w-full pointer-events-none select-none text-slate-400 dark:text-slate-500"
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 opacity-50" />
                      <span className="leading-tight truncate">{label}</span>
                      <span className="ml-auto shrink-0 text-[9px] font-bold tracking-wide bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">SOON</span>
                    </span>
                  ) : (
                    <a
                      key={label}
                      href={href}
                      className={`${cls} flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-opacity hover:opacity-80 w-full`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-tight">{label}</span>
                    </a>
                  )
                ))}
              </motion.div>

              {/* CTA + App Store badges */}
              <motion.div custom={4} variants={fadeUp} className="flex flex-col gap-3 mb-5" id="download">
                <a
                  href="/app/analyze"
                  className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 h-12 sm:h-14 text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary/20 w-fit"
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
                  From $4.99/month &nbsp;·&nbsp; All 5 tools on Pro &nbsp;·&nbsp; Cancel anytime
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

                <PhoneHeroDemo />

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
      <div className="w-full bg-gradient-to-b from-slate-100/90 via-blue-50/50 to-slate-100/70 dark:from-zinc-900/80 dark:via-blue-950/20 dark:to-zinc-900/60 border-y border-slate-200/80 dark:border-zinc-800/60 py-14">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <StatsBar />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          FIVE TOOLS — premium feature cards
          (Digital Signature card is coming soon — not shown here)
      ════════════════════════════════════════════════ */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">5 tools live · Digital Signature coming soon</p>
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
              Whether you're reading, verifying, building, reviewing, or redacting — PlainPath has a tool for it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  className={`bg-card rounded-2xl border-l-4 ${border} border border-border/60 shadow-sm relative overflow-hidden h-full ${isComingSoon ? "opacity-55 cursor-default select-none" : "group"}`}
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
        className="w-full bg-gradient-to-b from-slate-100/90 via-blue-50/50 to-slate-100/70 dark:from-zinc-900/80 dark:via-blue-950/20 dark:to-zinc-900/60 border-y border-slate-200/80 dark:border-zinc-800/60 py-16"
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
      <div className="w-full bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900/90 border-b border-slate-100 dark:border-transparent py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-80px" }}>
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
                    className="text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-white mb-6" style={{ fontFamily: "var(--font-display)" }}>
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
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TOOLS SHOWCASE — 6-card detailed grid
      ════════════════════════════════════════════════ */}
      <div id="solutions" className="w-full bg-gradient-to-br from-indigo-50/90 via-violet-50/70 to-slate-50/90 dark:from-violet-950/22 dark:via-slate-900 dark:to-slate-900 border-y border-indigo-100 dark:border-border/40 py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <ToolsShowcase />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          VIDEO WALKTHROUGH — dark cinematic
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-b from-slate-950 via-[#0d1526] to-slate-950 py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <VideoWalkthrough />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          LIVE DEMOS — one demo per tool
      ════════════════════════════════════════════════ */}
      <div id="demos" className="w-full bg-gradient-to-br from-blue-50 via-indigo-50/80 to-white dark:from-blue-950/35 dark:via-slate-900 dark:to-slate-900 border-y border-blue-100 dark:border-primary/15 py-16 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Live demos</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>One demo for each tool</motion.h2>
            <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Five real-world examples — one per live tool. Click any card to try it with a pre-loaded scenario.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
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
      <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-y border-slate-200 dark:border-border/40 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <DocumentSituations />
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
                whileHover={{ y: -4 }}
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
          FAQ
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-b from-slate-100/90 via-slate-50 to-blue-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-t border-slate-200 dark:border-border/40 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <FAQSection />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════ */}
      <div
        id="pricing"
        className="w-full bg-gradient-to-b from-slate-100/90 via-blue-50/40 to-slate-100/70 dark:from-zinc-900/80 dark:via-blue-950/10 dark:to-zinc-900/60 border-y border-slate-200/80 dark:border-zinc-800/60 py-20 md:py-28"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
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
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
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
              Start with document analysis, or unlock every tool with Pro. No contracts — cancel anytime.
            </motion.p>

            {/* ── Billing toggle ── */}
            <div className="mt-8 flex items-center justify-center">
              <div className="relative flex items-center bg-muted/60 dark:bg-zinc-800/60 border border-border/50 rounded-full p-1 gap-1 shadow-inner">
                {(["monthly", "yearly"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setBilling(option)}
                    className={`relative px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      billing === option
                        ? "bg-card text-foreground shadow-sm border border-border/40"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option === "monthly" ? "Monthly" : "Yearly"}
                    {option === "yearly" && (
                      <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                        billing === "yearly"
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                          : "bg-emerald-100/60 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                      }`}>
                        Save
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Attorney cost comparison ── */}
          <AttorneyComparison />

          <div className="grid md:grid-cols-2 gap-5 items-stretch max-w-3xl mx-auto">
            {PLANS.map((plan, i) => {
              const pr = billing === "yearly" ? plan.annual : plan.monthly;
              return (
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
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                      {plan.name}
                    </h3>
                    {billing === "yearly" && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        {plan.annual.savings}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5 mb-1">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={`${plan.name}-${billing}`}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className="text-4xl font-bold text-foreground tracking-tight"
                      >
                        {pr.price}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-muted-foreground text-sm ml-0.5">{pr.period}</span>
                  </div>
                  {billing === "yearly" ? (
                    <p className="text-xs text-muted-foreground mb-2">
                      {plan.annual.sub} &nbsp;·&nbsp; {plan.annual.eq}
                    </p>
                  ) : (
                    <div className="mb-2" />
                  )}
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
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Web access included on all plans &nbsp;·&nbsp; iOS &amp; Android coming soon &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          REFER A FRIEND
      ════════════════════════════════════════════════ */}
      <ReferFriend />

      {/* ════════════════════════════════════════════════
          APP SHOWCASE — web + mobile
      ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-100/40 dark:from-emerald-900/10 via-blue-50/30 dark:via-blue-900/10 to-transparent rounded-3xl blur-xl -z-10" />
              <WebAppDemo />
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
                Works great on any device — phone, tablet, or laptop.
                PlainPath feels fast and natural everywhere.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Upload,       text: "Upload a PDF, Word file, or paste text" },
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
                We process them to give you answers — then we discard them.
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
      <div className="w-full bg-gradient-to-br from-slate-950 via-[#0c1525] to-violet-950/40 border-t border-white/5 py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.12em] uppercase text-white/40 mb-4"
          >
            Available on Web · iOS &amp; Android coming soon
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
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
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Never sign something confusing again. PlainPath reads it so you don't have to.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-wrap justify-center gap-4 mb-6"
          >
            <a
              href="/app/analyze"
              className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/25"
            >
              Try it free — no account needed <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </motion.div>
          <p className="mt-6 text-xs text-white/25">
            From $4.99/month &nbsp;·&nbsp; All 5 tools on Pro ($29.99/mo) &nbsp;·&nbsp; Cancel anytime
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
