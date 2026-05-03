import { motion } from "framer-motion"
import {
  Home, Briefcase, FileHeart, Mail,
  ArrowRight,
  BookOpen, Scale,
} from "lucide-react"
import { Card } from "@/components/ui/card"

const SITUATIONS = [
  {
    icon: Home,
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    doc: "Lease or rental notice",
    tool: "Analyze a Document",
    toolColor: "text-blue-600 dark:text-blue-400",
    toolBg: "bg-blue-50 dark:bg-blue-950/40",
    toolIcon: BookOpen,
    href: "/demo/analyze",
    what: "Find every deadline, required document, and landlord obligation buried in the lease — before you sign or respond.",
  },
  {
    icon: Briefcase,
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    doc: "Job offer or employment contract",
    tool: "Contract Review",
    toolColor: "text-amber-600 dark:text-amber-400",
    toolBg: "bg-amber-50 dark:bg-amber-950/40",
    toolIcon: Scale,
    href: "/demo/contract-review",
    what: "Spot non-competes, IP clauses, and one-sided terms in the offer you received — and get exact language to push back.",
  },
  {
    icon: FileHeart,
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    doc: "Medical bill or EOB",
    tool: "Analyze a Document",
    toolColor: "text-blue-600 dark:text-blue-400",
    toolBg: "bg-blue-50 dark:bg-blue-950/40",
    toolIcon: BookOpen,
    href: "/demo/analyze",
    what: "Break down what you actually owe, what insurance covered, and what to dispute — in plain English.",
  },
  {
    icon: Mail,
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    doc: "Government or agency letter",
    tool: "Analyze a Document",
    toolColor: "text-blue-600 dark:text-blue-400",
    toolBg: "bg-blue-50 dark:bg-blue-950/40",
    toolIcon: BookOpen,
    href: "/demo/analyze",
    what: "Know exactly what the agency is asking you to do, by when, and what happens if you don't respond.",
  },
]

export default function DocumentSituations() {
  return (
    <section className="w-full">
      <div className="text-center mb-10">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3"
        >
          Common situations
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Documents people bring to PlainPath
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Real document types. One recommended tool for each. Here is what PlainPath helps you do with each one.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SITUATIONS.map((s, i) => {
          const ToolIcon = s.toolIcon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.18 } }}
              className="h-full"
            >
              <a href={s.href} className="block h-full group">
                <Card className="h-full bg-white dark:bg-card border-border/40 hover:border-border hover:shadow-lg transition-all rounded-2xl p-5 flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-snug mb-1">{s.doc}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.what}</p>
                  </div>
                  <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.toolBg} ${s.toolColor}`}>
                      <ToolIcon className="w-3 h-3" />
                      {s.tool}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${s.toolColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                  </div>
                </Card>
              </a>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
