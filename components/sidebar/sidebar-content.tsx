"use client"

import { Navigation } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { QuickJump } from "@/components/navigation/quick-jump"
import { EntitySummary } from "./entity-summary"
import type { GraphData } from "@/lib/types"

interface SidebarContentProps {
  data: GraphData | null
  entityCounts: Record<string, number>
  onQuickJump: (node: any) => void
}

export function SidebarContent({ data, entityCounts, onQuickJump }: SidebarContentProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          RDF Navigator
        </CardTitle>
        <CardDescription>Click on a node to start navigating relationships.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <p className="text-sm text-muted-foreground mb-4">No element selected.</p>
        {data && (
          <div className="space-y-4">
            <QuickJump data={data} onJumpTo={onQuickJump} />
            <Separator />
            <EntitySummary entityCounts={entityCounts} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
