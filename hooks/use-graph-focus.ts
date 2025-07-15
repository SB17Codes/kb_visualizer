"use client"

import { useState, useMemo } from "react"
import type { GraphData } from "@/lib/types"

export function useGraphFocus(data: GraphData) {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)

  const neighborNodes = useMemo(() => {
    if (!focusedNodeId) return new Set<string>()

    const neighbors = new Set<string>([focusedNodeId])

    data.links.forEach((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target

      if (sourceId === focusedNodeId) {
        neighbors.add(targetId)
      } else if (targetId === focusedNodeId) {
        neighbors.add(sourceId)
      }
    })

    return neighbors
  }, [focusedNodeId, data.links])

  const shouldShowNodeLabel = (nodeId: string): boolean => {
    // Always show labels for focused node and its direct neighbors
    if (focusedNodeId) {
      return neighborNodes.has(nodeId)
    }

    // When no node is focused, show labels for important entity types
    if (!focusedNodeId) {
      const node = data.nodes.find((n) => n.id === nodeId)
      if (node) {
        // Always show labels for plots and regions as they're important landmarks
        if (node.entityType === "plot" || node.entityType === "region") {
          return true
        }
      }
    }

    return false
  }

  const getNodeOpacity = (nodeId: string): number => {
    if (!focusedNodeId) return 1
    // Keep full opacity for focused node and neighbors, reduce others more
    return neighborNodes.has(nodeId) ? 1 : 0.2
  }

  const getLinkOpacity = (link: any): number => {
    if (!focusedNodeId) return 1

    const sourceId = typeof link.source === "object" ? link.source.id : link.source
    const targetId = typeof link.target === "object" ? link.target.id : link.target

    // Full opacity for links connected to focused node, very low for others
    return sourceId === focusedNodeId || targetId === focusedNodeId ? 1 : 0.1
  }

  return {
    focusedNodeId,
    setFocusedNodeId,
    neighborNodes,
    getNodeOpacity,
    getLinkOpacity,
    shouldShowNodeLabel,
  }
}
