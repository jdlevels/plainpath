import { cn } from "@/lib/utils"

type Level = "high" | "medium" | "low" | string

interface ConfidenceBadgeProps {
  level: Level
  className?: string
  showLabel?: boolean
}

const CONFIG = {
  high: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 border-emerald-200/60 text-emerald-700",
    label: "Confirmed",
  },
  medium: {
    dot: "bg-amber-400",
    bg: "bg-amber-50 border-amber-200/60 text-amber-700",
    label: "Needs review",
  },
  low: {
    dot: "bg-rose-400",
    bg: "bg-rose-50 border-rose-200/60 text-rose-700",
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
