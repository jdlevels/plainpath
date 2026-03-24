import { Badge } from "@/components/ui/badge"
import type { ActionStepConfidence } from "@workspace/api-client-react/src/generated/api.schemas"

export function ConfidenceBadge({ level }: { level: ActionStepConfidence | string }) {
  if (level === 'high') {
    return <Badge variant="success" className="font-medium text-[10px] px-2 h-5">High Confidence</Badge>
  }
  if (level === 'medium') {
    return <Badge variant="warning" className="font-medium text-[10px] px-2 h-5">Medium Confidence</Badge>
  }
  return <Badge variant="destructive" className="font-medium text-[10px] px-2 h-5">Low Confidence</Badge>
}
