import { motion } from "framer-motion"
import { useLocation } from "wouter"
import {
  BookOpen, ShieldCheck, PenLine, ArrowRight,
  ListTodo, Calendar, AlertTriangle, CheckCircle2,
  Flag, BarChart2, FileCheck, Sparkles,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const TOOLS = [
  {
    icon: BookOpen,
    title: "Analyze a Document",
    tagline: "Turn any document into a structured action plan",
    description: "Upload a PDF, Word file, or paste text. Get action steps, required documents, deadlines, risks, and plain English explanations — all sourced from the actual text.",
    features: [
      { icon: ListTodo, label: "Prioritized action steps" },
      { icon: Calendar, label: "Deadlines extracted from fine print" },
      { icon: AlertTriangle, label: "Risks flagged with severity" },
      { icon: Flag, label: "Key terms defined" },
    ],
    cta: "Analyze a Document",
    route: "/import",
    color: "from-primary/10 to-blue-50 dark:from-primary/10 dark:to-blue-950/20",
    badge: "bg-primary/10 text-primary",
    badgeLabel: "Core Tool",
    border: "border-primary/20",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Document Trust Check",
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
    color: "from-emerald-50/80 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    badgeLabel: "Pro · Team",
    border: "border-emerald-200/60 dark:border-emerald-900/40",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: PenLine,
    title: "Contract Builder",
    tagline: "Build a real contract from scratch in minutes",
    description: "Answer six steps about your deal — who, what, how much, when, and how disputes get resolved. Get a complete, clause-by-clause contract draft with gap analysis built in.",
    features: [
      { icon: Sparkles, label: "AI-generated clause drafts" },
      { icon: CheckCircle2, label: "Gap analysis — nothing left out" },
      { icon: ShieldCheck, label: "3 contract types supported" },
      { icon: FileCheck, label: "Download-ready PDF output" },
    ],
    cta: "Build a Contract",
    route: "/contract-builder",
    color: "from-violet-50/80 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    badgeLabel: "Pro · Team",
    border: "border-violet-200/60 dark:border-violet-900/40",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
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
          Three tools, one platform
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold mb-4"
        >
          Read it. Trust it. Build it.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Every document situation — understanding, verifying, or creating — covered in one place.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="group"
          >
            <Card className={`h-full rounded-2xl border ${tool.border} shadow-md hover:shadow-xl transition-all overflow-hidden bg-gradient-to-b ${tool.color}`}>
              <div className="p-7 flex flex-col h-full gap-5">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${tool.iconBg} flex items-center justify-center`}>
                    <tool.icon className={`w-6 h-6 ${tool.iconColor}`} />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tool.badge}`}>
                    {tool.badgeLabel}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-1">{tool.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{tool.tagline}</p>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{tool.description}</p>

                <ul className="space-y-2">
                  {tool.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5 text-xs text-foreground/70">
                      <f.icon className={`w-3.5 h-3.5 ${tool.iconColor} shrink-0`} />
                      {f.label}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="ghost"
                  className={`w-full justify-between mt-2 ${tool.iconColor} hover:bg-white/60 dark:hover:bg-white/10 font-semibold text-sm`}
                  onClick={() => setLocation(tool.route)}
                >
                  {tool.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
