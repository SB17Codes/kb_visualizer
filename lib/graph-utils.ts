import type { GraphData, EntityCounts, Connection, FilterType } from "./types"

export function getEntityCounts(graphData: GraphData | null): EntityCounts {
  if (!graphData) return { trees: 0, regions: 0, observations: 0, collections: 0, results: 0, plots: 0, other: 0 }

  return graphData.nodes.reduce(
    (acc, node) => {
      switch (node.entityType) {
        case "tree":
          acc.trees++
          break
        case "plot":
          acc.plots++
          break
        case "region":
          acc.regions++
          break
        case "observation":
          acc.observations++
          break
        case "observationCollection":
          acc.collections++
          break
        case "result":
          acc.results++
          break
        default:
          acc.other++
      }
      return acc
    },
    { trees: 0, regions: 0, observations: 0, collections: 0, results: 0, plots: 0, other: 0 },
  )
}

export function getConnectedNodes(nodeId: string, graphData: GraphData): Connection[] {
  const connections: Connection[] = []

  graphData.links.forEach((link) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source
    const targetId = typeof link.target === "object" ? link.target.id : link.target

    if (sourceId === nodeId) {
      const targetNode = graphData.nodes.find((n) => n.id === targetId)
      if (targetNode) {
        connections.push({
          node: targetNode,
          relationship: link.name,
          direction: "outgoing",
        })
      }
    } else if (targetId === nodeId) {
      const sourceNode = graphData.nodes.find((n) => n.id === sourceId)
      if (sourceNode) {
        connections.push({
          node: sourceNode,
          relationship: link.name,
          direction: "incoming",
        })
      }
    }
  })

  return connections
}

export function applyFilters(data: GraphData, filterType: FilterType, searchTerm: string): GraphData {
  let nodes = data.nodes
  let links = data.links

  // Apply entity type filter
  if (filterType !== "all") {
    nodes = nodes.filter((node) => {
      switch (filterType) {
        case "trees":
          return node.entityType === "tree"
        case "plots":
          return node.entityType === "plot"
        case "regions":
          return node.entityType === "region"
        case "observations":
          return node.entityType === "observation"
        case "collections":
          return node.entityType === "observationCollection"
        case "results":
          return node.entityType === "result"
        default:
          return true
      }
    })

    const nodeIds = new Set(nodes.map((n) => n.id))
    links = links.filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target))
  }

  // Apply search filter
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase()
    const matchingNodes = nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(searchLower) ||
        (n.taxonomicInfo && Object.values(n.taxonomicInfo).some((v) => v.toLowerCase().includes(searchLower))) ||
        (n.observationInfo &&
          Object.values(n.observationInfo).some((v) => String(v).toLowerCase().includes(searchLower))) ||
        (n.plotInfo && Object.values(n.plotInfo).some((v) => String(v).toLowerCase().includes(searchLower))),
    )

    if (matchingNodes.length > 0) {
      const relatedNodeIds = new Set<string>()
      matchingNodes.forEach((node) => relatedNodeIds.add(node.id))

      // Add connected nodes (1 hop)
      links.forEach((link) => {
        if (relatedNodeIds.has(link.source)) relatedNodeIds.add(link.target)
        if (relatedNodeIds.has(link.target)) relatedNodeIds.add(link.source)
      })

      nodes = nodes.filter((node) => relatedNodeIds.has(node.id))
      links = links.filter((link) => relatedNodeIds.has(link.source) && relatedNodeIds.has(link.target))
    } else {
      nodes = []
      links = []
    }
  }

  return { nodes, links }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  } catch {
    return dateString
  }
}

export function getTaxonomicSummary(data: GraphData): Record<string, number> {
  const summary: Record<string, number> = {}

  data.nodes
    .filter((n) => n.entityType === "tree" && n.taxonomicInfo)
    .forEach((node) => {
      const family = node.taxonomicInfo?.["dwc:family"] || "Unknown"
      summary[family] = (summary[family] || 0) + 1
    })

  return summary
}

export function getSpatialSummary(data: GraphData): Record<string, number> {
  const summary: Record<string, number> = {}

  data.links
    .filter((l) => l.relationshipType === "containment")
    .forEach((link) => {
      const plot = data.nodes.find((n) => n.id === link.target)
      if (plot?.entityType === "plot") {
        const regionMatch = plot.name.match(/BAFOG_([IVX]+)/)
        const region = regionMatch ? `BAFOG_${regionMatch[1]}` : "Unknown"
        summary[region] = (summary[region] || 0) + 1
      }
    })

  return summary
}
