import { cn } from "@/lib/utils"

type Level = "high" | "medium" | "low" | string

const CONFIG = {
  high: {
    bg: "bg-red-50 border-red-200/60 text-red-700",
    label: "High",
  },
  medium: {
    bg: "bg-amber-50 border-amber-200/60 text-amber-700",
    label: "Medium",
  },
  low: {
    bg: "bg-secondary border-border text-muted-foreground",
    label: "Low",
  },
}

export function PriorityBadge({ level, className }: { level: Level; className?: string }) {
  const cfg = CONFIG[level as keyof typeof CONFIG] ?? CONFIG.low

  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide", cfg.bg, className)}>
      {cfg.label} priority
    </span>
  )
}
