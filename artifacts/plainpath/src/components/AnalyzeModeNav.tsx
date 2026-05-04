import { BookOpen, ListTodo, CheckSquare, Package } from "lucide-react"
import type { AnalyzeMode } from "@/lib/completionFlowConfig"

interface Props {
  activeMode: AnalyzeMode
  onModeChange: (mode: AnalyzeMode) => void
  totalItems: number
  doneItems: number
}

interface ModeConfig {
  id: AnalyzeMode
  label: string
  shortLabel: string
  icon: React.ElementType
  description: string
}

const MODES: ModeConfig[] = [
  { id: "understand", label: "Understand", shortLabel: "Read",     icon: BookOpen,    description: "Plain-language explanation" },
  { id: "plan",       label: "Plan",       shortLabel: "Plan",     icon: ListTodo,    description: "Tasks, docs, deadlines"     },
  { id: "complete",   label: "Complete",   shortLabel: "Complete", icon: CheckSquare, description: "Work through each item"     },
  { id: "compile",    label: "Summary",    shortLabel: "Summary",  icon: Package,     description: "Review completion summary"  },
]

export function AnalyzeModeNav({ activeMode, onModeChange, totalItems, doneItems }: Props) {
  const activeModeIndex = MODES.findIndex((m) => m.id === activeMode)

  return (
    <div className="no-print mb-4 sm:mb-5">
      <div className="flex items-stretch gap-1 bg-secondary/40 rounded-2xl p-1">
        {MODES.map((mode, i) => {
          const Icon = mode.icon
          const isActive = activeMode === mode.id
          const isPast = i < activeModeIndex

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onModeChange(mode.id)}
              style={{ touchAction: "manipulation", flex: "1 1 0" }}
              className={`relative flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : isPast
                  ? "text-foreground/80 hover:text-foreground hover:bg-secondary/70"
                  : "text-muted-foreground hover:text-foreground/70 hover:bg-secondary/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {/* Full label on sm+, short on xs */}
              <span className="hidden sm:inline whitespace-nowrap">{mode.label}</span>
              <span className="sm:hidden whitespace-nowrap">{mode.shortLabel}</span>
              {/* Progress badge on Complete + Packet */}
              {(mode.id === "complete" || mode.id === "compile") && totalItems > 0 && (
                <span
                  className={`hidden sm:inline ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none shrink-0 ${
                    isActive
                      ? "bg-background/25 text-background"
                      : doneItems === totalItems
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-border/60 text-muted-foreground"
                  }`}
                >
                  {doneItems}/{totalItems}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Current mode description — subtle context line */}
      <p className="text-[10px] text-muted-foreground/50 font-medium px-1 mt-1.5 hidden sm:block">
        {MODES.find((m) => m.id === activeMode)?.description}
      </p>
    </div>
  )
}
