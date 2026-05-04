import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { FileText, Shield, Lock, CheckCircle2 } from "lucide-react"

const PILLARS = [
  {
    icon: FileText,
    label: "Action plan in minutes",
    desc: "Deadlines, missing documents, signatures, and risks — all surfaced and organized for you.",
    color: "text-primary",
  },
  {
    icon: Shield,
    label: "Temporary processing",
    desc: "Files are processed only to return your results. Nothing is stored beyond your session.",
    color: "text-red-500",
  },
  {
    icon: Lock,
    label: "Privacy-minded",
    desc: "Your documents are not retained, shared, or used to train AI models.",
    color: "text-violet-500",
  },
  {
    icon: CheckCircle2,
    label: "Two tools, one plan",
    desc: "Analyze any document. Review any contract. Both included at $19.99/month.",
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
