import { ArrowLeft } from "lucide-react"
import { useLocation } from "wouter"

interface ToolPageHeaderProps {
  toolName: string
  toolIcon: React.ElementType
  toolIconBg: string
  toolIconColor: string
  subtitle?: string | null
  onBack?: () => void
  backTo?: string
  rightSlot?: React.ReactNode
}

export function ToolPageHeader({
  toolName,
  toolIcon: Icon,
  toolIconBg,
  toolIconColor,
  subtitle,
  onBack,
  backTo = "/",
  rightSlot,
}: ToolPageHeaderProps) {
  const [, setLocation] = useLocation()

  function handleBack() {
    if (onBack) { onBack(); return }
    setLocation(backTo)
  }

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
      <button
        onClick={handleBack}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className={`w-8 h-8 rounded-xl ${toolIconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${toolIconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-foreground leading-none">{toolName}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {rightSlot && (
        <div className="ml-auto shrink-0">{rightSlot}</div>
      )}
    </div>
  )
}
