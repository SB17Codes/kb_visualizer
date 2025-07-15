"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RelationshipNavigator } from "@/components/navigation/relationship-navigator"
import { QuickJump } from "@/components/navigation/quick-jump"
import { NodeDetailPanel } from "./node-detail-panel"
import { LinkDetailPanel } from "./link-detail-panel"
import type { SelectedElement, GraphData, GraphNode } from "@/lib/types"

interface DetailTabsProps {
  selectedElement: SelectedElement
  data: GraphData
  currentNode: GraphNode | null
  currentNodeRelationships: {
    incoming: Array<{ link: any; node: GraphNode }>
    outgoing: Array<{ link: any; node: GraphNode }>
  }
  onNavigate: (node: GraphNode, relationship: string, direction: "incoming" | "outgoing") => void
  onQuickJump: (node: any) => void
}

export function DetailTabs({
  selectedElement,
  data,
  currentNode,
  currentNodeRelationships,
  onNavigate,
  onQuickJump,
}: DetailTabsProps) {
  return (
    <Tabs defaultValue="details" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="navigate">Navigate</TabsTrigger>
        <TabsTrigger value="jump">Jump</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="flex-1 overflow-hidden">
        {selectedElement.type === "node" ? (
          <NodeDetailPanel node={selectedElement.data} data={data} onNavigate={onNavigate} />
        ) : (
          <LinkDetailPanel link={selectedElement.data} />
        )}
      </TabsContent>

      <TabsContent value="navigate" className="flex-1 overflow-hidden">
        {currentNode && (
          <RelationshipNavigator node={currentNode} relationships={currentNodeRelationships} onNavigate={onNavigate} />
        )}
      </TabsContent>

      <TabsContent value="jump" className="flex-1 overflow-hidden">
        <QuickJump data={data} onJumpTo={onQuickJump} />
      </TabsContent>
    </Tabs>
  )
}
