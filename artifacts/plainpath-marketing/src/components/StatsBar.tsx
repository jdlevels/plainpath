import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { FileText, Shield, Lock, CheckCircle2 } from "lucide-react"

const PILLARS = [
  {
    icon: FileText,
    label: "Plain English output",
    desc: "Every analysis surfaces action steps, deadlines, and risks — written for real people, not lawyers.",
    color: "text-primary",
  },
  {
    icon: Shield,
    label: "No document storage",
    desc: "Your files are processed in memory and never written to disk or stored in a database.",
    color: "text-red-500",
  },
  {
    icon: Lock,
    label: "Never used for AI training",
    desc: "Your documents are not retained, shared, or used to train any AI model.",
    color: "text-violet-500",
  },
  {
    icon: CheckCircle2,
    label: "No account required to start",
    desc: "Try your first two analyses immediately — no sign-up, no credit card.",
    color: "text-emerald-500",
  },
]

export default function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PILLARS.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col items-center justify-center text-center gap-2 px-4 py-6 rounded-2xl bg-card border border-slate-200 dark:border-border/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted/60">
              <p.icon className={`w-4 h-4 ${p.color}`} />
            </div>
            <div className="text-sm font-bold text-foreground leading-snug" style={{ fontFamily: "var(--font-display)" }}>
              {p.label}
            </div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">{p.desc}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
