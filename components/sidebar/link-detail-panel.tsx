"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { GraphLink } from "@/lib/types"

interface LinkDetailPanelProps {
  link: GraphLink
}

export function LinkDetailPanel({ link }: LinkDetailPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-lg">Relationship Details</CardTitle>
          <CardDescription className="break-words text-sm">Connection between entities</CardDescription>
          {link.relationshipType && (
            <Badge variant="outline" className="w-fit capitalize">
              {link.relationshipType}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4 text-sm">
          <div className="space-y-3">
            <h4 className="font-semibold">Predicate</h4>
            <div className="bg-muted/50 rounded-lg p-3">
              <Badge variant="secondary" className="font-mono">
                {link.name}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Connection</h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-3">
              <div>
                <span className="text-muted-foreground font-medium">Source:</span>
                <p className="font-semibold mt-1 break-all">
                  {typeof link.source === "object" ? link.source.name : link.source}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-8 h-px bg-border relative">
                  <div className="absolute right-0 top-0 w-0 h-0 border-l-4 border-l-border border-t-2 border-b-2 border-t-transparent border-b-transparent transform -translate-y-1/2"></div>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Target:</span>
                <p className="font-semibold mt-1 break-all">
                  {typeof link.target === "object" ? link.target.name : link.target}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">Technical Details</h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div>
                <span className="text-muted-foreground font-medium">Source URI:</span>
                <p className="font-mono text-xs mt-1 p-2 bg-background rounded border break-all select-all">
                  {typeof link.source === "object" ? link.source.id : link.source}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Target URI:</span>
                <p className="font-mono text-xs mt-1 p-2 bg-background rounded border break-all select-all">
                  {typeof link.target === "object" ? link.target.id : link.target}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
