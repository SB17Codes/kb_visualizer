"use client"

import { ChevronRight, Home, ArrowLeft, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { NavigationPath } from "@/hooks/use-graph-navigation"

interface NavigationBreadcrumbsProps {
  breadcrumbs: NavigationPath[]
  canGoBack: boolean
  canGoForward: boolean
  onGoBack: () => void
  onGoForward: () => void
  onClearHistory: () => void
  onNavigateToPath: (index: number) => void
}

export function NavigationBreadcrumbs({
  breadcrumbs,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onClearHistory,
  onNavigateToPath,
}: NavigationBreadcrumbsProps) {
  if (breadcrumbs.length === 0) return null

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-sm">
      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onGoBack} disabled={!canGoBack} className="h-7 w-7 p-0">
          <ArrowLeft className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onGoForward} disabled={!canGoForward} className="h-7 w-7 p-0">
          <ArrowRight className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearHistory} className="h-7 w-7 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-4" />

      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto">
        <Home className="h-3 w-3 text-muted-foreground flex-shrink-0" />

        {breadcrumbs.map((path, index) => (
          <div key={index} className="flex items-center gap-1 flex-shrink-0">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />

            {/* Relationship indicator */}
            {path.relationship && (
              <>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {path.relationship}
                </Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </>
            )}

            {/* Node */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToPath(index)}
              className="h-6 px-2 text-xs font-medium truncate max-w-32"
            >
              {path.node.name}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
