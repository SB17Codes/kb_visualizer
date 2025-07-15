import { Badge } from "@/components/ui/badge"
import type { GraphNode } from "@/lib/types"

interface FocusIndicatorProps {
  focusedNode: GraphNode | null
  neighborCount: number
}

export function FocusIndicator({ focusedNode, neighborCount }: FocusIndicatorProps) {
  if (!focusedNode) return null

  return (
    <div className="absolute bottom-2 left-2 z-10 bg-background/90 backdrop-blur-sm p-2 rounded-md text-xs border shadow-sm">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Focused
        </Badge>
        <span className="font-medium">{focusedNode.name}</span>
      </div>
      {neighborCount > 0 && (
        <p className="text-muted-foreground mt-1">
          {neighborCount} connected {neighborCount === 1 ? "entity" : "entities"}
        </p>
      )}
    </div>
  )
}
