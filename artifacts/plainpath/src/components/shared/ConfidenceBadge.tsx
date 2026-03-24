import { cn } from "@/lib/utils"

type Level = "high" | "medium" | "low" | string

interface ConfidenceBadgeProps {
  level: Level
  className?: string
  showLabel?: boolean
}

const CONFIG = {
  high: {
    dot: "bg-emerald-500 dark:bg-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400",
    label: "Confirmed",
  },
  medium: {
    dot: "bg-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-900/50 text-amber-700 dark:text-amber-400",
    label: "Needs review",
  },
  low: {
    dot: "bg-rose-400 dark:bg-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/50 border-rose-200/60 dark:border-rose-900/50 text-rose-700 dark:text-rose-400",
    label: "Uncertain",
  },
}

export function ConfidenceBadge({ level, className, showLabel = true }: ConfidenceBadgeProps) {
  const cfg = CONFIG[level as keyof typeof CONFIG] ?? CONFIG.low

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide",
        cfg.bg,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {showLabel && cfg.label}
    </span>
  )
}
