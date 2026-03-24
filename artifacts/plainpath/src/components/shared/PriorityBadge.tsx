import { Badge } from "@/components/ui/badge"
import type { ActionStepPriority } from "@workspace/api-client-react/src/generated/api.schemas"
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react"

export function PriorityBadge({ level }: { level: ActionStepPriority | string }) {
  if (level === 'high') {
    return (
      <Badge variant="destructive" className="gap-1 px-2.5 py-1">
        <AlertCircle className="w-3.5 h-3.5" /> High Priority
      </Badge>
    )
  }
  if (level === 'medium') {
    return (
      <Badge variant="warning" className="gap-1 px-2.5 py-1">
        <Clock className="w-3.5 h-3.5" /> Medium Priority
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1 px-2.5 py-1">
      <CheckCircle2 className="w-3.5 h-3.5" /> Low Priority
    </Badge>
  )
}
