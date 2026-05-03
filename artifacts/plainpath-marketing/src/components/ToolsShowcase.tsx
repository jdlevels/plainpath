import { motion } from "framer-motion"
import {
  FileScan, Scale, ArrowRight,
  ListTodo, Calendar, AlertTriangle, CheckCircle2,
  Flag, FileCheck, Copy, MessageSquare,
  Clock,
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
    cta: "See demo",
    href: "/demo/analyze",
    color: "from-blue-50/80 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    badgeLabel: "Starter · Pro",
    border: "border-blue-200/60 dark:border-blue-900/40",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    verbColor: "text-blue-600 dark:text-blue-400",
    comingSoon: false,
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
    cta: "See demo",
    href: "/demo/contract-review",
    color: "from-amber-50/80 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    badgeLabel: "Pro",
    border: "border-amber-200/60 dark:border-amber-900/40",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    verbColor: "text-amber-600 dark:text-amber-400",
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
          Two tools, in detail
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Read it. Review it.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Whether you need to understand what a document means or review a contract before you sign — PlainPath gives you the right tool for the job, in plain English.
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
