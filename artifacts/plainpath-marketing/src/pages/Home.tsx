import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
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
import { BackToTop } from "@/components/BackToTop";
import { Card } from "@/components/ui/card";
import {
  FileText, FileSignature, ShieldCheck,
  ArrowRight, Upload, Sparkles, Scale,
  AlertTriangle, CheckCircle2, Clock, Lock, X as XIcon, EyeOff,
  CalendarX, Eye, PenLine, FileScan, ListChecks, GitCompare,
  DollarSign, Copy, Users, ChevronDown,
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
  { label: "Analyze a Document",    icon: FileScan,       cls: "tool-btn-blue",    href: "/app/analyze",                 comingSoon: false },
  { label: "Document Trust Check",  icon: ShieldCheck,    cls: "tool-btn-red",     href: "/app/import?mode=trust-check", comingSoon: false },
  { label: "Build a Contract",      icon: PenLine,        cls: "tool-btn-emerald", href: "/app/build-contract",          comingSoon: false },
  { label: "Contract Review",       icon: Scale,          cls: "tool-btn-amber",   href: "/app/contract-review",         comingSoon: false },
  { label: "Redact Sensitive Info", icon: EyeOff,         cls: "tool-btn-violet",  href: "/app/redact",                  comingSoon: false },
  { label: "Digital Signature",     icon: FileSignature,  cls: "tool-btn-indigo",  href: "/app/signature",               comingSoon: false },
  { label: "Clause Extractor",       icon: ListChecks,     cls: "tool-btn-fuchsia", href: "/app/clause-extractor",        comingSoon: false },
  { label: "Compare Versions",      icon: GitCompare,     cls: "tool-btn-sky",     href: "/app/compare-versions",        comingSoon: false },
];

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
    icon: ShieldCheck,
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
    icon: PenLine,
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
    icon: FileSignature,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    border: "border-l-indigo-500 dark:border-l-indigo-400",
    accent: "bg-indigo-500 dark:bg-indigo-400",
    glow: "from-indigo-50 dark:from-indigo-900/10",
    title: "Digital Signature",
    desc: "Send documents for e-signature, track signing status in real time, and download certified signed copies — all without leaving PlainPath. Powered by Dropbox Sign.",
    result: { label: "Signature Request Sent", value: "Sarah Chen received a secure signing link for the Consulting Agreement.", icon: CheckCircle2, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    tags: ["Contracts", "NDAs", "Agreements"],
    tagCls: "bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-700/40",
  },
  {
    icon: GitCompare,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-100 dark:bg-sky-900/30",
    border: "border-l-sky-500 dark:border-l-sky-400",
    accent: "bg-sky-500 dark:bg-sky-400",
    glow: "from-sky-50 dark:from-sky-900/10",
    title: "Compare Versions",
    desc: "Upload an original and a revised document. PlainPath maps every addition, deletion, and structural change — with zone-by-zone overlays and severity scoring.",
    result: { label: "Changes Found", value: "14 changes detected — 3 high-severity clause deletions identified.", icon: AlertTriangle, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-900/20" },
    tags: ["Contract revisions", "Lease renewals", "Policy updates", "Legal amendments"],
    tagCls: "bg-sky-50/80 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-700/40",
  },
  {
    icon: ListChecks,
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
    border: "border-l-fuchsia-500 dark:border-l-fuchsia-400",
    accent: "bg-fuchsia-500 dark:bg-fuchsia-400",
    glow: "from-fuchsia-50 dark:from-fuchsia-900/10",
    title: "Clause Extractor",
    desc: "Upload any contract or agreement and get a structured breakdown of critical dates, party roles, financial terms, legal clauses, and a plain-English obligation list.",
    result: { label: "Extraction Complete", value: "6 obligations found, 6 of 8 clauses present. Auto-renewal clause detected.", icon: CheckCircle2, color: "text-fuchsia-600 dark:text-fuchsia-400", bg: "bg-fuchsia-50 dark:bg-fuchsia-900/20" },
    tags: ["Key dates", "Obligations", "Legal clauses", "Party roles"],
    tagCls: "bg-fuchsia-50/80 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200/60 dark:border-fuchsia-700/40",
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
  { icon: Lock,        title: "Your documents stay yours", desc: "Documents are processed to give you answers, then discarded. We don't sell your data or train AI on your files." },
  { icon: ShieldCheck, title: "Built for every document",  desc: "Leases, IRS letters, medical bills, contracts, court notices, NDAs — if it's text-based, PlainPath can analyze it." },
  { icon: CheckCircle2,title: "Start in seconds",          desc: "No account needed to start. Paste or upload a document and get a plain-English breakdown in under 2 minutes — no sign-up required." },
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
    id: "trust-check-irs",
    tool: "Document Trust Check",
    title: "Fake IRS Payment Demand",
    desc: "A letter claiming your account is flagged, demanding $892 within 48 hours. Trust Check scores it 18/100 and surfaces 4 critical red flags.",
    icon: ShieldCheck,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    hoverBorder: "hover:border-red-400/50",
    hoverTitle: "group-hover:text-red-500 dark:group-hover:text-red-400",
    tags: ["Score: 18/100", "4 red flags", "Verdict: Likely Scam"],
    cta: "See trust verdict",
    href: "/demo/trust-check",
  },
  {
    id: "contract-builder-freelance",
    tool: "Build a Contract",
    title: "Freelance Services Agreement",
    desc: "Answer 6 questions about your deal — scope, payment, and deadline — and get a complete contract with IP, revisions, and termination terms ready.",
    icon: PenLine,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    hoverBorder: "hover:border-emerald-400/50",
    hoverTitle: "group-hover:text-emerald-500 dark:group-hover:text-emerald-400",
    tags: ["6-question wizard", "6 contract sections", "PDF ready"],
    cta: "Build a contract",
    href: "/demo/build-contract",
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
    href: "/demo/contract-review",
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
    cta: "Redact a document",
    href: "/demo/redact",
  },
  {
    id: "signature-freelance",
    tool: "Digital Signature",
    title: "Freelance Agreement — In Progress",
    desc: "A freelance contract sent to two signers. The client signed at 2:34 PM. The contractor's signature is still pending — see the live status.",
    icon: FileSignature,
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    hoverBorder: "hover:border-indigo-400/50",
    hoverTitle: "group-hover:text-indigo-500 dark:group-hover:text-indigo-400",
    tags: ["1 of 2 signed", "Status timeline", "Pre-loaded demo"],
    cta: "See signing status",
    href: "/demo/signature",
  },
  {
    id: "compare-nda",
    tool: "Compare Versions",
    title: "NDA v1 vs v2 — 1 Critical Change",
    desc: "A 2-year confidentiality term quietly changed to perpetuity between drafts. PlainPath caught it and explains what it means for you.",
    icon: GitCompare,
    color: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    hoverBorder: "hover:border-sky-400/50",
    hoverTitle: "group-hover:text-sky-500 dark:group-hover:text-sky-400",
    tags: ["3 changes found", "1 critical", "Side-by-side diff"],
    cta: "See what changed",
    href: "/demo/compare",
  },
  {
    id: "clause-extractor-lease",
    tool: "Clause Extractor",
    title: "Residential Lease — 6 Obligations Found",
    desc: "A 12-page lease broken down into structured fields: key dates, party roles, financial terms, auto-renewal clause, and a plain-English obligation list.",
    icon: ListChecks,
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    hoverBorder: "hover:border-purple-400/50",
    hoverTitle: "group-hover:text-purple-500 dark:group-hover:text-purple-400",
    tags: ["Key dates · Parties", "Obligations", "Legal clauses"],
    cta: "Extract clauses",
    href: "/demo/clause-extractor",
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
      { label: "Redact Sensitive Info", included: true,  comingSoon: false },
      { label: "Document Trust Check",  included: false, comingSoon: false },
      { label: "Build a Contract",      included: false, comingSoon: false },
      { label: "Contract Review",       included: false, comingSoon: false },
      { label: "Digital Signature",     included: false, comingSoon: false },
      { label: "Compare Versions",      included: false, comingSoon: false },
      { label: "Clause Extractor",      included: false, comingSoon: false },
    ],
    extras: [] as string[],
    cta: "Subscribe to Starter",
    href: "/app/subscribe?plan=starter",
  },
  {
    name: "Pro",
    monthly: { price: "$19.99", period: "/month", sub: null },
    annual:  { price: "$191.90", period: "/year", sub: "billed annually", eq: "≈ $16.00/mo", savings: "Save 20%" },
    desc: "All 8 tools in one plan — unlimited use across every workflow.",
    highlight: true,
    badge: "Best Value",
    tools: [
      { label: "Analyze a Document",    included: true,  comingSoon: false },
      { label: "Document Trust Check",  included: true,  comingSoon: false },
      { label: "Build a Contract",      included: true,  comingSoon: false },
      { label: "Contract Review",       included: true,  comingSoon: false },
      { label: "Redact Sensitive Info", included: true,  comingSoon: false },
      { label: "Digital Signature",     included: true,  comingSoon: false },
      { label: "Compare Versions",      included: true,  comingSoon: false },
      { label: "Clause Extractor",      included: true,  comingSoon: false },
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
    label: "Lease agreement",
    attyLow: 300, attyHigh: 600,
    ppPlan: "Starter", ppPrice: 4.99, ppTool: "Analyze a Document",
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
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Build a Contract",
    note: "Simple contract drafting, typically 1–4 attorney hrs.",
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
    ppPlan: "Pro", ppPrice: 19.99, ppTool: "Document Trust Check",
    note: "Tax attorney or CPA review, typically 1–3 hrs.",
  },
  {
    id: "eviction",
    label: "Eviction notice",
    attyLow: 150, attyHigh: 400,
    ppPlan: "Starter", ppPrice: 4.99, ppTool: "Analyze a Document",
    note: "Landlord-tenant attorney review, typically 1–2 hrs.",
  },
  {
    id: "medical",
    label: "Medical bill dispute",
    attyLow: 150, attyHigh: 350,
    ppPlan: "Starter", ppPrice: 4.99, ppTool: "Analyze a Document",
    note: "Healthcare billing advocate or attorney, 1–2 hrs.",
  },
  {
    id: "general",
    label: "General document review",
    attyLow: 200, attyHigh: 500,
    ppPlan: "Starter", ppPrice: 4.99, ppTool: "Analyze a Document",
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
              <p className="text-sm text-foreground/50 mb-4">per month · unlimited use</p>
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

/* ─── Refer a friend ─────────────────────────────────────── */
function ReferFriend() {
  const [copied, setCopied] = useState(false);
  const url = "https://plainpathapp.com";

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }).catch(() => {});
  }

  return (
    <div className="w-full bg-gradient-to-br from-violet-100/80 via-blue-100/65 to-indigo-100/70 dark:from-violet-950/30 dark:via-blue-950/20 dark:to-zinc-900/60 border-y border-violet-200/55 dark:border-violet-900/30 py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="grid md:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left — content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide">Refer a friend</span>
            </div>

            <h3
              className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-snug"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Know someone drowning in confusing paperwork?
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed mb-7">
              Share PlainPath with anyone dealing with a lease, contract, government notice, or medical bill.
              They can try it immediately — no account required.
            </p>

            {/* Value bullets */}
            <div className="space-y-2.5 mb-8">
              {[
                { text: "No account needed to start", detail: "Two free analyses included — no sign-up" },
                { text: "Results in under 2 minutes",  detail: "Upload, analyze, done" },
                { text: "Works on any document type",  detail: "Contracts, bills, notices, and more" },
              ].map(({ text, detail }) => (
                <div key={text} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-foreground">{text}</span>
                    <span className="text-sm text-muted-foreground"> — {detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/demo"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-primary/20"
              >
                Try free — 2 free analyses <ArrowRight className="w-4 h-4" />
              </a>

              {/* Copy link */}
              <div className="flex items-center gap-0 bg-background border border-border/60 rounded-xl pl-3.5 pr-1 py-1 shadow-sm">
                <span className="text-sm text-muted-foreground flex-1 truncate font-mono leading-none py-1.5 pr-2 min-w-0">
                  {url}
                </span>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    copied
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                      : "bg-muted text-foreground hover:bg-muted/80"
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
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/55 mt-4">
              Referral rewards and tracking are available inside your PlainPath account after sign-up.
            </p>
          </motion.div>

          {/* Right — visual card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex justify-center"
          >
            <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-md p-7 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3 pb-5 border-b border-border/50">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">PlainPath Referrals</p>
                  <p className="text-xs text-foreground/50 mt-0.5">Available inside your account</p>
                </div>
              </div>

              {/* Steps */}
              {[
                { step: "1", label: "Create your free account",   note: "No credit card required" },
                { step: "2", label: "Share your personal link",   note: "One click from your dashboard" },
                { step: "3", label: "Friend tries PlainPath",     note: "They get their first doc free" },
                { step: "4", label: "Both of you benefit",        note: "Rewards inside your account" },
              ].map(({ step, label, note }) => (
                <div key={step} className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-primary">{step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
                    <p className="text-xs text-foreground/45 mt-0.5">{note}</p>
                  </div>
                </div>
              ))}

              <div className="pt-1 border-t border-border/50">
                <a
                  href="/app/analyze"
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Get started to unlock <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────── */
export default function Home() {
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistPlatform, setWaitlistPlatform] = useState<"ios" | "android" | "both">("both")
  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ behavior: "instant" })
    }
  }, [])

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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/70 via-indigo-200/55 to-violet-200/65 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/20 pointer-events-none" />
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
                Leases, contracts, medical bills, and court notices — PlainPath gives you 8 tools to
                understand what any document means, spot problems before you sign, and know exactly
                what to do next. All in plain English.
              </motion.p>

              {/* Tool pills */}
              <motion.div custom={3} variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
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
                  href="/demo"
                  className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 h-12 sm:h-14 text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary/20 w-fit"
                >
                  Try it free — no account needed <ArrowRight className="w-4 h-4" />
                </a>
                <p className="text-xs text-muted-foreground/80">2 free analyses included — no sign-up required.</p>
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
                  From $4.99/month &nbsp;·&nbsp; All 8 tools on Pro &nbsp;·&nbsp; Cancel anytime
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
      <div className="w-full bg-gradient-to-b from-sky-200/70 via-blue-100/60 to-slate-200/65 dark:from-zinc-900/80 dark:via-blue-950/20 dark:to-zinc-900/60 border-y border-sky-300/50 dark:border-zinc-800/60 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <StatsBar />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          8 TOOLS — premium feature cards
      ════════════════════════════════════════════════ */}
      <section id="features" className="py-20 md:py-28 bg-gradient-to-b from-background via-white/70 to-background dark:bg-transparent">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">8 tools live</p>
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
              Whether you're reading, verifying, building, reviewing, redacting, signing, comparing, or editing — PlainPath has a tool for it.
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
        className="w-full bg-gradient-to-b from-indigo-200/65 via-sky-100/60 to-blue-200/55 dark:from-zinc-900/80 dark:via-blue-950/20 dark:to-zinc-900/60 border-y border-indigo-300/45 dark:border-zinc-800/60 py-16"
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
      <div className="w-full bg-gradient-to-b from-slate-100/80 via-white to-slate-100/60 dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900/90 border-b border-slate-300/50 dark:border-transparent py-20">
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
                    { icon: CalendarX,     title: "Deadlines buried in fine print",              desc: "A 30-day window in paragraph 8 that nobody told you about. Once it passes, your options disappear. Analyze a Document surfaces every one.",                                                  tool: "Analyze a Document",    iconBg: "rgba(59,130,246,0.15)",   iconColor: "#60a5fa", badgeBorder: "rgba(59,130,246,0.35)",   badgeColor: "#93c5fd"  },
                    { icon: FileScan,      title: "Fake notices designed to pressure you",        desc: "Scam notices look identical to real ones. Same formatting, same urgency. Document Trust Check scores legitimacy and flags every red flag.",                                                 tool: "Document Trust Check",  iconBg: "rgba(239,68,68,0.15)",    iconColor: "#f87171", badgeBorder: "rgba(239,68,68,0.35)",    badgeColor: "#fca5a5"  },
                    { icon: PenLine,       title: "Signing the other party's boilerplate",        desc: "When you don't have your own contract, you sign theirs — and every clause was written to protect them. Build a Contract creates a fair agreement from scratch.",                           tool: "Build a Contract",      iconBg: "rgba(16,185,129,0.15)",   iconColor: "#34d399", badgeBorder: "rgba(16,185,129,0.35)",   badgeColor: "#6ee7b7"  },
                    { icon: Eye,           title: "Clauses that shift all the risk to you",       desc: "One paragraph waives your right to dispute. Another transfers liability quietly. Contract Review reads it clause by clause and tells you exactly what you're agreeing to.",                 tool: "Contract Review",       iconBg: "rgba(245,158,11,0.15)",   iconColor: "#fbbf24", badgeBorder: "rgba(245,158,11,0.35)",   badgeColor: "#fcd34d"  },
                    { icon: EyeOff,        title: "Your private details go wherever the doc goes", desc: "Names, SSNs, account numbers — once you share a document they go with it. Redact Sensitive Info lets you strip them before anyone else sees the file.",                                   tool: "Redact Sensitive Info", iconBg: "rgba(139,92,246,0.15)",   iconColor: "#a78bfa", badgeBorder: "rgba(139,92,246,0.35)",   badgeColor: "#c4b5fd"  },
                    { icon: FileSignature, title: "Print, sign, scan — for every signature",      desc: "The old workflow adds days and creates unsigned copies nobody can track. Digital Signature sends a secure link and gives you a real-time audit trail.",                                    tool: "Digital Signature",     iconBg: "rgba(99,102,241,0.15)",   iconColor: "#818cf8", badgeBorder: "rgba(99,102,241,0.35)",   badgeColor: "#a5b4fc"  },
                    { icon: GitCompare,    title: "New contract version — what actually changed?", desc: "They sent a revised draft. You have no idea what moved. Compare Versions maps every addition, deletion, and structural change with severity scoring.",                                    tool: "Compare Versions",      iconBg: "rgba(20,184,166,0.15)",   iconColor: "#2dd4bf", badgeBorder: "rgba(20,184,166,0.35)",   badgeColor: "#5eead4"  },
                    { icon: ListChecks,    title: "Obligations buried in the fine print",         desc: "You're about to sign but you don't know who owes what by when. Clause Extractor pulls every obligation, assigns it to a party, and flags any that require action before signing.", tool: "Clause Extractor",      iconBg: "rgba(192,38,211,0.15)",   iconColor: "#f0abfc", badgeBorder: "rgba(192,38,211,0.35)",   badgeColor: "#fae8ff"  },
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
          TOOLS SHOWCASE — 6-card detailed grid
      ════════════════════════════════════════════════ */}
      <div id="solutions" className="w-full bg-gradient-to-br from-indigo-200/75 via-violet-200/60 to-slate-200/70 dark:from-violet-950/22 dark:via-slate-900 dark:to-slate-900 border-y border-indigo-300/50 dark:border-border/40 py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <ToolsShowcase />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          VIDEO WALKTHROUGH — dark cinematic
      ════════════════════════════════════════════════ */}
      <div id="walkthrough" className="w-full bg-gradient-to-b from-slate-950 via-[#0d1526] to-slate-950 py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <VideoWalkthrough />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          LIVE DEMOS — one demo per tool
      ════════════════════════════════════════════════ */}
      <div id="demos" className="w-full bg-gradient-to-br from-blue-200/75 via-indigo-200/60 to-sky-200/70 dark:from-blue-950/35 dark:via-slate-900 dark:to-slate-900 border-y border-blue-300/50 dark:border-primary/15 py-16 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Live demos</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>Pre-loaded examples — ready to run</motion.h2>
            <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Real documents, real scenarios — one per live tool. Click any card to open a pre-loaded example in the web app.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
      <div id="common-documents" className="w-full bg-gradient-to-br from-slate-200/70 via-blue-100/55 to-indigo-200/65 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-y border-slate-300/55 dark:border-border/40 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <DocumentSituations />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TRUST / CREDIBILITY
      ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-slate-100 via-blue-50/90 to-slate-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border-b border-slate-200/80 dark:border-border/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12">
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
      <div id="faq" className="w-full bg-gradient-to-b from-sky-200/65 via-blue-100/55 to-indigo-200/55 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-y border-sky-300/45 dark:border-border/40 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <FAQSection />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════ */}
      <div
        id="pricing"
        className="w-full bg-gradient-to-b from-violet-200/70 via-blue-200/55 to-indigo-200/65 dark:from-zinc-900/80 dark:via-blue-950/10 dark:to-zinc-900/60 border-y border-violet-300/50 dark:border-zinc-800/60 py-24 md:py-32"
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
              Start with document analysis, or unlock every tool with Pro. No commitment — cancel anytime.
            </motion.p>
          </div>

          {/* ── Attorney cost comparison ── */}
          <AttorneyComparison />

          <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">
            {PLANS.map((plan, i) => {
              const pr = plan.monthly;
              return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl border bg-card flex flex-col p-8 shadow-sm transition-shadow hover:shadow-lg ${plan.highlight ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20" : "border-border/60"}`}
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
                      {pr.price}
                    </span>
                    <span className="text-muted-foreground text-sm ml-0.5">{pr.period}</span>
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
            Web access included on all plans &nbsp;·&nbsp; iOS &amp; Android apps coming soon &nbsp;·&nbsp; Cancel anytime
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
      <section className="py-20 md:py-24 bg-gradient-to-br from-emerald-100/70 via-sky-100/60 to-blue-100/55 dark:bg-transparent border-y border-emerald-200/50 dark:border-transparent">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-100/40 dark:from-emerald-900/10 via-blue-50/30 dark:via-blue-900/10 to-transparent rounded-3xl blur-xl -z-10" />
              <WebAppDemo />
            </div>
            <div className="max-w-lg order-1 lg:order-2">
              <div className="bg-white/65 dark:bg-card/70 backdrop-blur-md rounded-2xl px-7 py-8 border border-white/90 dark:border-border/40 shadow-sm">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-foreground/60 dark:text-foreground/55 mb-3">Works on Every Device</p>
                <h2
                  className="text-3xl md:text-4xl font-bold mb-5 text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  One platform, every device.
                </h2>
                <p className="text-foreground/70 dark:text-foreground/65 mb-7 leading-relaxed">
                  Available on any device — phone, tablet, or laptop. No app to install — open it in any browser and start immediately.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: Upload,       text: "Upload a PDF, Word file, or paste text" },
                    { icon: Sparkles,     text: "AI analyzes in under 2 minutes" },
                    { icon: CheckCircle2, text: "Plain English summary + action plan" },
                  ].map(({ icon: Icon, text }, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/15 dark:bg-primary/20 flex items-center justify-center shrink-0">
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
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRIVACY
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-br from-indigo-200/75 dark:from-indigo-950/30 via-violet-200/60 dark:via-violet-950/20 to-blue-200/70 dark:to-zinc-900/60 border-y border-indigo-300/50 dark:border-indigo-900/40 py-20">
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
                We don't sell your data. We don't train AI on your documents.
                For standard analyses, documents are processed in memory and discarded after your results are returned.
                Pro workspaces (Document Builder, Compare Versions, Clause Extractor) store your working data so you can access it across sessions — you can delete it at any time.
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
            className="text-5xl md:text-6xl font-bold mb-5 text-white"
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
            className="text-xl text-white/60 mb-10 max-w-xl mx-auto leading-relaxed"
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
              href="/demo"
              className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-8 py-4 text-base font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/30"
            >
              Try it free — 2 free analyses <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
          <p className="mt-6 text-xs text-white/30">
            From $4.99/month &nbsp;·&nbsp; All 8 tools on Pro ($19.99/mo) &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </div>

      <Footer />

      <BackToTop />

      <WaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        defaultPlatform={waitlistPlatform}
      />
    </div>
  );
}
