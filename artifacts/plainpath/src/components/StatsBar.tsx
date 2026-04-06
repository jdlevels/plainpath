import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { FileText, Star, Shield, PenLine } from "lucide-react"

const STATS = [
  { icon: FileText, value: 50000, suffix: "+", label: "Pages analyzed", color: "text-primary" },
  { icon: Star, value: 4.9, suffix: "★", label: "Average rating", color: "text-amber-500", decimals: 1 },
  { icon: Shield, value: 12000, suffix: "+", label: "Trust checks run", color: "text-emerald-500" },
  { icon: PenLine, value: 3000, suffix: "+", label: "Contracts drafted", color: "text-violet-500" },
]

function AnimatedNumber({
  target,
  decimals = 0,
  duration = 1800,
}: {
  target: number
  decimals?: number
  duration?: number
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(parseFloat((ease * target).toFixed(decimals)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, target, decimals, duration])

  return <span ref={ref}>{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
}

export default function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto mb-24"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col items-center justify-center text-center gap-2 px-4 py-6 rounded-2xl bg-card border border-slate-200 dark:border-border/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-muted/60`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-display font-bold text-foreground tabular-nums">
              <AnimatedNumber target={stat.value} decimals={stat.decimals} />
              {stat.suffix}
            </div>
            <div className="text-xs font-medium text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
