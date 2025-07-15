"use client"

import { useState } from "react"
import {
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  TreePine,
  MapPin,
  FlaskConical,
  Database,
  BarChart3,
  Map,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { GraphNode, GraphLink } from "@/lib/types"

interface RelationshipNavigatorProps {
  node: GraphNode
  relationships: {
    incoming: Array<{ link: GraphLink; node: GraphNode }>
    outgoing: Array<{ link: GraphLink; node: GraphNode }>
  }
  onNavigate: (node: GraphNode, relationship: string, direction: "incoming" | "outgoing") => void
}

export function RelationshipNavigator({ node, relationships, onNavigate }: RelationshipNavigatorProps) {
  const [incomingOpen, setIncomingOpen] = useState(true)
  const [outgoingOpen, setOutgoingOpen] = useState(true)

  const getEntityIcon = (entityType?: string) => {
    switch (entityType) {
      case "tree":
        return <TreePine className="w-4 h-4 text-green-600" />
      case "plot":
        return <Map className="w-4 h-4 text-blue-600" />
      case "region":
        return <MapPin className="w-4 h-4 text-indigo-600" />
      case "observation":
        return <FlaskConical className="w-4 h-4 text-purple-600" />
      case "observationCollection":
        return <Database className="w-4 h-4 text-violet-600" />
      case "result":
        return <BarChart3 className="w-4 h-4 text-pink-600" />
      default:
        return <ExternalLink className="w-4 h-4 text-gray-600" />
    }
  }

  const getRelationshipColor = (relationshipType?: string) => {
    switch (relationshipType) {
      case "containment":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "spatial":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "taxonomic":
        return "bg-green-100 text-green-800 border-green-200"
      case "observational":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "temporal":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const RelationshipItem = ({
    link,
    relatedNode,
    direction,
  }: {
    link: GraphLink
    relatedNode: GraphNode
    direction: "incoming" | "outgoing"
  }) => (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {getEntityIcon(relatedNode.entityType)}
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{relatedNode.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {relatedNode.entityType && (
              <Badge variant="outline" className="text-xs mr-2">
                {relatedNode.entityType}
              </Badge>
            )}
            {relatedNode.taxonomicInfo?.["dwc:family"] && <span>{relatedNode.taxonomicInfo["dwc:family"]}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className={`text-xs ${getRelationshipColor(link.relationshipType)}`}>
          {link.name}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(relatedNode, link.name, direction)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getEntityIcon(node.entityType)}
          RDF Navigation
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <div className="font-medium truncate">{node.name}</div>
          {node.entityType && (
            <Badge variant="outline" className="mt-1">
              {node.entityType}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Outgoing Relationships */}
        {relationships.outgoing.length > 0 && (
          <Collapsible open={outgoingOpen} onOpenChange={setOutgoingOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <div className="flex items-center gap-2">
                  <ChevronRight className={`h-4 w-4 transition-transform ${outgoingOpen ? "rotate-90" : ""}`} />
                  <span className="font-medium">Outgoing Relations ({relationships.outgoing.length})</span>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {relationships.outgoing.map((rel, index) => (
                <RelationshipItem key={`out-${index}`} link={rel.link} relatedNode={rel.node} direction="outgoing" />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {relationships.outgoing.length > 0 && relationships.incoming.length > 0 && <Separator />}

        {/* Incoming Relationships */}
        {relationships.incoming.length > 0 && (
          <Collapsible open={incomingOpen} onOpenChange={setIncomingOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <div className="flex items-center gap-2">
                  <ChevronLeft className={`h-4 w-4 transition-transform ${incomingOpen ? "rotate-90" : ""}`} />
                  <span className="font-medium">Incoming Relations ({relationships.incoming.length})</span>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {relationships.incoming.map((rel, index) => (
                <RelationshipItem key={`in-${index}`} link={rel.link} relatedNode={rel.node} direction="incoming" />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {relationships.incoming.length === 0 && relationships.outgoing.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <ExternalLink className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No relationships found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
