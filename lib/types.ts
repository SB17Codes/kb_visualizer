import type * as N3 from "n3"

export interface GraphNode extends N3.Quad_Subject {
  id: string
  name: string
  type: "uri" | "literal" | "blank"
  entityType?: "tree" | "region" | "observation" | "observationCollection" | "result" | "plot"
  taxonomicInfo?: Record<string, string>
  geometryType?: string
  coordinates?: string
  observationInfo?: Record<string, string>
  collectionInfo?: Record<string, string>
  plotInfo?: Record<string, string>
  val?: number
  x?: number
  y?: number
}

export interface GraphLink {
  source: string
  target: string
  name: string
  relationshipType?: "spatial" | "taxonomic" | "observational" | "temporal" | "containment"
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  totalTriples?: number
}

export type SelectedElement = {
  type: "node" | "link"
  data: any
}

export type FilterType = "all" | "trees" | "regions" | "observations" | "collections" | "results" | "plots"

export interface EntityCounts {
  trees: number
  regions: number
  observations: number
  collections: number
  results: number
  plots: number
  other: number
}

export interface Connection {
  node: GraphNode
  relationship: string
  direction: "incoming" | "outgoing"
}
