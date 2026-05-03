import { motion } from "framer-motion"
import { useLocation } from "wouter"
import {
  BookOpen, ShieldCheck, PenLine, Scale, ArrowRight,
  ListTodo, Calendar, AlertTriangle, CheckCircle2,
  Flag, BarChart2, FileCheck, Sparkles, Copy, MessageSquare,
  EyeOff, Download, ArrowRightLeft, Lock, Clock, Pen, Send, Eye,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const TOOLS = [
  {
    icon: BookOpen,
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
    route: "/import",
    color: "from-blue-50/80 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    badgeLabel: "PlainPath Pro",
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
    route: "/import?mode=trust-check",
    color: "from-red-50/80 to-red-50 dark:from-red-950/20 dark:to-red-950/20",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    badgeLabel: "Pro · Team",
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
    route: "/contract-builder",
    color: "from-emerald-50/80 to-emerald-50 dark:from-emerald-950/20 dark:to-emerald-950/20",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    badgeLabel: "Pro · Team",
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
    route: "/contract-review",
    color: "from-amber-50/80 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    badgeLabel: "Pro · Team",
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
    route: "/redact",
    color: "from-violet-50/80 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    badgeLabel: "PlainPath Pro",
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
    route: "/import",
    color: "from-indigo-50/60 to-indigo-50/40 dark:from-indigo-900/10 dark:to-indigo-900/10",
    badge: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
    badgeLabel: "Pro",
    border: "border-indigo-200/60 dark:border-indigo-900/40",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    verbColor: "text-indigo-600 dark:text-indigo-400",
    comingSoon: false,
  },
]

export default function ToolsShowcase() {
  const [, setLocation] = useLocation()

  return (
    <section className="w-full">
      <div className="text-center mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3"
        >
          9 tools live
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold mb-4"
        >
          Read it. Trust it. Build it. Review it. Protect it.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Whether you are reading a document, questioning its legitimacy, creating an agreement, reviewing one before you sign, or redacting private information — PlainPath has a dedicated tool for exactly that.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.10 }}
            whileHover={tool.comingSoon ? {} : { y: -6, scale: 1.02 }}
            className={tool.comingSoon ? "cursor-default" : "group cursor-pointer"}
            onClick={() => !tool.comingSoon && tool.route && setLocation(tool.route)}
          >
            <Card className={`h-full rounded-2xl border-2 ${tool.border} shadow-md ${tool.comingSoon ? "" : "group-hover:shadow-2xl"} transition-all duration-200 overflow-hidden bg-gradient-to-b ${tool.color} ${tool.comingSoon ? "opacity-60" : ""}`}>
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
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
