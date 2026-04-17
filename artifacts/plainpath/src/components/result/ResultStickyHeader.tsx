import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResultStickyHeaderProps {
  toolIcon: React.ElementType
  toolLabel: string
  toolIconClass?: string
  subtitleText: string
  verdictLabel: string
  verdictBadgeClass: string
  onBack?: () => void
  actions: React.ReactNode
}

export function ResultStickyHeader({
  toolIcon: ToolIcon,
  toolLabel,
  toolIconClass = "text-primary/70",
  subtitleText,
  verdictLabel,
  verdictBadgeClass,
  onBack,
  actions,
}: ResultStickyHeaderProps) {
  return (
    <div className="bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-30 print:hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-secondary active:bg-secondary rounded-xl transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ToolIcon className={`w-3 h-3 ${toolIconClass}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${toolIconClass}`}>
                {toolLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {subtitleText}
            </p>
          </div>

          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 hidden sm:inline-flex ${verdictBadgeClass}`}>
            {verdictLabel}
          </span>

          {actions}
        </div>
      </div>
    </div>
  )
}
