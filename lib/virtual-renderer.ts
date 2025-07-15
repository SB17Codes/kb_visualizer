import type { GraphData, GraphNode, GraphLink } from "./types"

interface ViewportBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export class VirtualRenderer {
  private viewportBounds: ViewportBounds = {
    minX: Number.NEGATIVE_INFINITY,
    maxX: Number.POSITIVE_INFINITY,
    minY: Number.NEGATIVE_INFINITY,
    maxY: Number.POSITIVE_INFINITY,
  }
  private nodeBuffer = 100 // Buffer around viewport
  private maxVisibleNodes = 1000
  private maxVisibleLinks = 2000

  updateViewport(bounds: ViewportBounds): void {
    this.viewportBounds = {
      minX: bounds.minX - this.nodeBuffer,
      maxX: bounds.maxX + this.nodeBuffer,
      minY: bounds.minY - this.nodeBuffer,
      maxY: bounds.maxY + this.nodeBuffer,
    }
  }

  filterVisibleNodes(nodes: GraphNode[]): GraphNode[] {
    const visibleNodes = nodes.filter((node) => {
      if (!node.x || !node.y) return true // Include nodes without positions

      return (
        node.x >= this.viewportBounds.minX &&
        node.x <= this.viewportBounds.maxX &&
        node.y >= this.viewportBounds.minY &&
        node.y <= this.viewportBounds.maxY
      )
    })

    // Limit number of visible nodes for performance
    return visibleNodes.slice(0, this.maxVisibleNodes)
  }

  filterVisibleLinks(links: GraphLink[], visibleNodeIds: Set<string>): GraphLink[] {
    const visibleLinks = links.filter((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target

      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId)
    })

    // Limit number of visible links for performance
    return visibleLinks.slice(0, this.maxVisibleLinks)
  }

  getVisibleData(data: GraphData): GraphData {
    const visibleNodes = this.filterVisibleNodes(data.nodes)
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
    const visibleLinks = this.filterVisibleLinks(data.links, visibleNodeIds)

    return {
      nodes: visibleNodes,
      links: visibleLinks,
      totalTriples: data.totalTriples,
    }
  }
}
