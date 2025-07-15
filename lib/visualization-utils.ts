import type { GraphNode, GraphLink } from "./types"

export function getNodeColor(
  node: GraphNode,
  selectedId: string | null,
  focusedNodeId: string | null,
  opacity = 1,
): string {
  const alpha = opacity

  // Enhanced highlighting for selected and focused nodes
  if (node.id === selectedId) {
    return `rgba(255, 140, 0, ${alpha})` // Bright orange for selected
  }
  if (node.id === focusedNodeId) {
    return `rgba(255, 215, 0, ${alpha})` // Gold for focused
  }

  // Enhanced colors by entity type with better contrast
  switch (node.entityType) {
    case "tree":
      // Color trees by family if available
      if (node.taxonomicInfo?.["dwc:family"]) {
        const family = node.taxonomicInfo["dwc:family"]
        switch (family) {
          case "Fabaceae":
            return `rgba(22, 163, 74, ${alpha})` // Darker green
          case "Burseraceae":
            return `rgba(120, 53, 15, ${alpha})` // Darker brown
          case "Lecythidaceae":
            return `rgba(147, 51, 234, ${alpha})` // Darker purple
          case "Myristicaceae":
            return `rgba(220, 38, 38, ${alpha})` // Darker red
          case "Chrysobalanaceae":
            return `rgba(217, 119, 6, ${alpha})` // Darker amber
          case "Lauraceae":
            return `rgba(37, 99, 235, ${alpha})` // Darker blue
          case "Arecaceae":
            return `rgba(5, 150, 105, ${alpha})` // Darker emerald
          default:
            return `rgba(22, 163, 74, ${alpha})` // Default darker green for trees
        }
      }
      return `rgba(22, 163, 74, ${alpha})` // Darker green for trees
    case "plot":
      return `rgba(37, 99, 235, ${alpha})` // Darker blue for plots
    case "region":
      return `rgba(79, 70, 229, ${alpha})` // Darker indigo for regions
    case "observation":
      return `rgba(147, 51, 234, ${alpha})` // Darker purple for observations
    case "observationCollection":
      return `rgba(124, 58, 237, ${alpha})` // Darker violet for collections
    case "result":
      return `rgba(219, 39, 119, ${alpha})` // Darker pink for results
    default:
      return `rgba(75, 85, 99, ${alpha})` // Darker gray for other
  }
}

export function getNodeSize(node: GraphNode, selectedId: string | null, focusedNodeId: string | null): number {
  let baseSize = 8

  // Larger size for trees and plots
  if (node.entityType === "tree") baseSize = 10
  if (node.entityType === "plot") baseSize = 12

  // Significantly increase size for selected/focused nodes
  if (node.id === selectedId) {
    baseSize *= 1.8
  } else if (node.id === focusedNodeId) {
    baseSize *= 1.5
  }

  return baseSize
}

export function getLinkColor(link: GraphLink, opacity = 1): string {
  const alpha = opacity

  switch (link.relationshipType) {
    case "containment":
      return `rgba(59, 130, 246, ${alpha})` // Blue for containment (tree in plot)
    case "spatial":
      return `rgba(16, 185, 129, ${alpha})` // Emerald for spatial
    case "taxonomic":
      return `rgba(34, 197, 94, ${alpha})` // Green for taxonomic
    case "observational":
      return `rgba(168, 85, 247, ${alpha})` // Purple for observational
    case "temporal":
      return `rgba(245, 158, 11, ${alpha})` // Amber for temporal
    default:
      return `rgba(107, 114, 128, ${alpha})` // Gray for other
  }
}

export function getLinkWidth(link: GraphLink, opacity = 1): number {
  const baseWidth = 2

  // Thicker lines for important relationships
  if (link.relationshipType === "containment") return baseWidth * 1.5
  if (link.relationshipType === "spatial") return baseWidth * 1.2

  return baseWidth * opacity
}
