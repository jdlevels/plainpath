import { motion } from "framer-motion"
import {
  FileScan, ShieldCheck, PenLine, Scale, ArrowRight,
  ListTodo, Calendar, AlertTriangle, CheckCircle2,
  Flag, BarChart2, FileCheck, Sparkles, Copy, MessageSquare,
  EyeOff, Download, ArrowRightLeft, Lock, Clock, MessageCircle, Send, Eye,
  GitCompare, ListChecks, CalendarClock, Layers, Users,
} from "lucide-react"
import { Card } from "@/components/ui/card"

const TOOLS = [
  {
    icon: FileScan,
    title: "Analyze a Document",
    verb: "Read it.",
    tagline: "Turn any document into a structured action plan",
    description: "Upload a PDF, Word file, or paste text. Get action steps, required documents, deadlines, risks, and plain English explanations — all sourced from the actual text.",
    features: [
      { icon: ListTodo, label: "Prioritized action steps" },
      { icon: Calendar, label: "Deadlines extracted from fine print" },
      { icon: AlertTriangle, label: "Risks flagged with severity" },
      { icon: Flag, label: "Key terms defined in plain English" },
    ],
    cta: "Analyze a Document",
    href: "/app/analyze",
    color: "from-blue-50/80 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    badgeLabel: "Starter · Pro",
    border: "border-blue-200/60 dark:border-blue-900/40",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    verbColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: ShieldCheck,
    title: "Document Trust Check",
    verb: "Trust it.",
    tagline: "Know if a document is legitimate before you act",
    description: "Paste or upload any document that made you uneasy — a job offer, a lease, a prize notice, a payment request. Get a scored verdict with red flags called out explicitly.",
    features: [
      { icon: BarChart2, label: "Authenticity + risk scoring" },
      { icon: AlertTriangle, label: "Red flags surfaced clearly" },
      { icon: CheckCircle2, label: "Verification action steps" },
      { icon: FileCheck, label: "Pattern-based fraud detection" },
    ],
    cta: "Run a Trust Check",
    href: "/app/import?mode=trust-check",
    color: "from-red-50/80 to-red-50 dark:from-red-950/20 dark:to-red-950/20",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    badgeLabel: "Pro",
    border: "border-red-200/60 dark:border-red-900/40",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-red-600 dark:text-red-400",
    verbColor: "text-red-600 dark:text-red-400",
  },
  {
    icon: PenLine,
    title: "Build a Contract",
    verb: "Build it.",
    tagline: "Build a real contract from scratch in minutes",
    description: "Answer six steps about your deal — who, what, how much, when, and how disputes get resolved. Get a complete, clause-by-clause contract draft with gap analysis built in.",
    features: [
      { icon: Sparkles, label: "AI-generated clause drafts" },
      { icon: CheckCircle2, label: "Gap analysis — nothing left out" },
      { icon: ShieldCheck, label: "5 contract types supported" },
      { icon: FileCheck, label: "Download-ready PDF output" },
    ],
    cta: "Build a Contract",
    href: "/app/build-contract",
    color: "from-emerald-50/80 to-emerald-50 dark:from-emerald-950/20 dark:to-emerald-950/20",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    badgeLabel: "Pro",
    border: "border-emerald-200/60 dark:border-emerald-900/40",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    verbColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Scale,
    title: "Contract Review",
    verb: "Review it.",
    tagline: "Review a contract you didn't write — before you sign",
    description: "Someone handed you a contract. Paste it in and get a clause-by-clause review: unfair terms flagged, missing protections identified, and exact negotiation language ready to copy and send back.",
    features: [
      { icon: Flag, label: "Red flags and watch-outs called out" },
      { icon: Copy, label: "Negotiation language ready to copy" },
      { icon: MessageSquare, label: "Plain English for every clause" },
      { icon: AlertTriangle, label: "Missing protections identified" },
    ],
    cta: "Review a Contract",
    href: "/app/contract-review",
    color: "from-amber-50/80 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    badgeLabel: "Pro",
    border: "border-amber-200/60 dark:border-amber-900/40",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    verbColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: EyeOff,
    title: "Redact Sensitive Info",
    verb: "Protect it.",
    tagline: "Remove private details before sharing, analyzing, or reviewing",
    description: "Paste or upload a document. PlainPath detects names, SSNs, account numbers, phone numbers, and more. You choose exactly what gets redacted — nothing is removed without your approval.",
    features: [
      { icon: Lock, label: "Auto-detection of 14 PII categories" },
      { icon: CheckCircle2, label: "You approve every redaction" },
      { icon: Download, label: "Export redacted copy as text" },
      { icon: ArrowRightLeft, label: "Send directly into any PlainPath tool" },
    ],
    cta: "Redact a Document",
    href: "/app/redact",
    color: "from-violet-50/80 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    badgeLabel: "Starter · Pro",
    border: "border-violet-200/60 dark:border-violet-900/40",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    verbColor: "text-violet-600 dark:text-violet-400",
    comingSoon: false,
  },
  {
    icon: MessageSquare,
    title: "Ask This Document",
    verb: "Ask it.",
    tagline: "Get plain-English answers from any document",
    description: "Upload a document and ask questions about clauses, dates, obligations, risks, missing items, or confusing language — and get direct answers sourced from the actual text.",
    features: [
      { icon: MessageSquare, label: "\"What does this require me to do?\"" },
      { icon: Clock, label: "\"What deadlines are listed?\"" },
      { icon: AlertTriangle, label: "\"What sections should I review first?\"" },
      { icon: CheckCircle2, label: "\"Are there payment terms?\"" },
    ],
    cta: "Ask a Document",
    href: "/app/analyze",
    color: "from-indigo-50/60 to-indigo-50/40 dark:from-indigo-900/10 dark:to-indigo-900/10",
    badge: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
    badgeLabel: "Pro",
    border: "border-indigo-200/60 dark:border-indigo-900/40",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    verbColor: "text-indigo-600 dark:text-indigo-400",
    comingSoon: false,
  },
  {
    icon: GitCompare,
    title: "Compare Versions",
    verb: "Compare it.",
    tagline: "Spot every change between two document versions",
    description: "Upload an original and a revised PDF. PlainPath maps every addition, deletion, and structural change — with severity scoring so you see what actually matters.",
    features: [
      { icon: ArrowRightLeft, label: "Side-by-side PDF workspace" },
      { icon: AlertTriangle, label: "Severity-sorted change summary" },
      { icon: Sparkles, label: "AI enrichment for context" },
      { icon: FileCheck, label: "Page-by-page zone mapping" },
    ],
    cta: "Compare Documents",
    href: "/app/compare-versions",
    color: "from-sky-50/80 to-sky-50 dark:from-sky-950/20 dark:to-sky-950/20",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    badgeLabel: "Pro",
    border: "border-sky-200/60 dark:border-sky-900/40",
    iconBg: "bg-sky-100 dark:bg-sky-900/40",
    iconColor: "text-sky-600 dark:text-sky-400",
    verbColor: "text-sky-600 dark:text-sky-400",
    comingSoon: false,
  },
  {
    icon: ListChecks,
    title: "Clause Extractor",
    verb: "Decode it.",
    tagline: "Extract key clauses, deadlines, and obligations",
    description: "Upload any contract or agreement and get a structured breakdown of critical dates, party roles, financial terms, legal clauses, and a plain-English obligation list.",
    features: [
      { icon: CalendarClock, label: "Key dates and deadlines extracted" },
      { icon: Users, label: "Parties and roles identified" },
      { icon: Layers, label: "Legal clauses mapped and scored" },
      { icon: CheckCircle2, label: "Obligations assigned by party" },
    ],
    cta: "Extract Clauses",
    href: "/app/clause-extractor",
    color: "from-fuchsia-50/80 to-fuchsia-50 dark:from-fuchsia-950/20 dark:to-fuchsia-950/20",
    badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
    badgeLabel: "Pro",
    border: "border-fuchsia-200/60 dark:border-fuchsia-900/40",
    iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
    verbColor: "text-fuchsia-600 dark:text-fuchsia-400",
    comingSoon: false,
  },
]

export default function ToolsShowcase() {
  return (
    <section className="w-full">
      <div className="text-center mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3"
        >
          Every tool, in detail
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Read it. Trust it. Build it. Review it. Protect it. Sign it. Compare it. Decode it.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Whether you are reading a document, questioning its legitimacy, creating an agreement, reviewing one before you sign, redacting private information, asking plain-English questions, comparing versions, or extracting clauses — PlainPath has a dedicated tool for exactly that.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.10 }}
            whileHover={tool.comingSoon ? {} : { y: -6, scale: 1.02 }}
            className={`h-full ${tool.comingSoon ? "cursor-default" : "group cursor-pointer"}`}
          >
            {tool.comingSoon ? (
              <Card className={`h-full rounded-2xl border-2 ${tool.border} border shadow-md transition-all duration-200 overflow-hidden bg-gradient-to-b ${tool.color} opacity-60`}>
                <ToolCardContent tool={tool} />
              </Card>
            ) : (
              <a href={tool.href} className="block h-full">
                <Card className={`h-full rounded-2xl border-2 ${tool.border} border shadow-md group-hover:shadow-2xl transition-all duration-200 overflow-hidden bg-gradient-to-b ${tool.color}`}>
                  <ToolCardContent tool={tool} />
                </Card>
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function ToolCardContent({ tool }: { tool: typeof TOOLS[number] }) {
  return (
    <div className="p-7 flex flex-col h-full gap-5">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl ${tool.iconBg} flex items-center justify-center ${tool.comingSoon ? "" : "group-hover:scale-110"} transition-transform duration-200`}>
          <tool.icon className={`w-6 h-6 ${tool.iconColor}`} />
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tool.badge}`}>
          {tool.badgeLabel}
        </span>
      </div>

      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${tool.verbColor}`}>{tool.verb}</p>
        <h3 className="text-xl font-bold mb-1">{tool.title}</h3>
        <p className="text-sm font-medium text-muted-foreground">{tool.tagline}</p>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{tool.description}</p>

      {!tool.comingSoon && (
        <ul className="space-y-2">
          {tool.features.map((f, fi) => (
            <li key={fi} className="flex items-center gap-2.5 text-xs text-foreground/70">
              <f.icon className={`w-3.5 h-3.5 ${tool.iconColor} shrink-0`} />
              {f.label}
            </li>
          ))}
        </ul>
      )}

      {tool.comingSoon ? (
        <div className="w-full flex items-center justify-center mt-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 gap-2">
          <Clock className="w-3.5 h-3.5" />
          Coming Soon
        </div>
      ) : (
        <div className={`w-full flex items-center justify-between mt-2 px-4 py-2.5 rounded-xl font-semibold text-sm ${tool.iconColor} bg-white/40 dark:bg-white/5 group-hover:bg-white/70 dark:group-hover:bg-white/15 transition-colors duration-200`}>
          {tool.cta}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      )}
    </div>
  )
}
