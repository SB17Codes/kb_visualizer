import type { GraphNode } from "./types"

export interface GeoCoordinates {
  longitude: number
  latitude: number
}

export interface GeoFeature {
  id: string
  coordinates: GeoCoordinates
  node: GraphNode
  type: "tree" | "plot" | "region"
}

export function parseWKTCoordinates(wkt: string): GeoCoordinates | null {
  if (!wkt) return null

  console.log("Parsing WKT:", wkt)

  // Handle POINT format: POINT(-53.97515488 5.486866474)
  const pointMatch = wkt.match(/POINT\s*$$\s*([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)\s*$$/)
  if (pointMatch) {
    const coords = {
      longitude: Number.parseFloat(pointMatch[1]),
      latitude: Number.parseFloat(pointMatch[2]),
    }
    console.log("Successfully parsed POINT:", coords)
    return coords
  }

  // Handle coordinate string format: "-53.97515488 5.486866474"
  const coordMatch = wkt.match(/([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)/)
  if (coordMatch) {
    const coords = {
      longitude: Number.parseFloat(coordMatch[1]),
      latitude: Number.parseFloat(coordMatch[2]),
    }
    console.log("Successfully parsed coordinates:", coords)
    return coords
  }

  // Handle POLYGON format (extract first coordinate for center point)
  const polygonMatch = wkt.match(/POLYGON\s*\(\s*\(\s*([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)/)
  if (polygonMatch) {
    const coords = {
      longitude: Number.parseFloat(polygonMatch[1]),
      latitude: Number.parseFloat(polygonMatch[2]),
    }
    console.log("Successfully parsed POLYGON center:", coords)
    return coords
  }

  console.log("Failed to parse WKT:", wkt)
  return null
}

export function extractGeoFeatures(nodes: GraphNode[]): GeoFeature[] {
  const features: GeoFeature[] = []

  console.log("Extracting geo features from", nodes.length, "nodes")

  nodes.forEach((node) => {
    if (node.coordinates) {
      console.log("Found node with coordinates:", node.name, node.coordinates, node.entityType)
    }

    if (
      node.coordinates &&
      (node.entityType === "tree" || node.entityType === "plot" || node.entityType === "region")
    ) {
      const coords = parseWKTCoordinates(node.coordinates)
      if (coords) {
        console.log("Successfully parsed coordinates for", node.name, coords)
        features.push({
          id: node.id,
          coordinates: coords,
          node,
          type: node.entityType as "tree" | "plot" | "region",
        })
      } else {
        console.log("Failed to parse coordinates for", node.name, node.coordinates)
      }
    }
  })

  console.log("Extracted", features.length, "geo features")
  return features
}

export function calculateBounds(features: GeoFeature[]): {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
} | null {
  if (features.length === 0) return null

  let minLng = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  features.forEach((feature) => {
    const { longitude, latitude } = feature.coordinates
    minLng = Math.min(minLng, longitude)
    maxLng = Math.max(maxLng, longitude)
    minLat = Math.min(minLat, latitude)
    maxLat = Math.max(maxLat, latitude)
  })

  return { minLng, maxLng, minLat, maxLat }
}

export function getFeatureColor(feature: GeoFeature, isSelected = false): string {
  if (isSelected) {
    return "#FF8C00" // Orange for selected
  }

  switch (feature.type) {
    case "tree":
      // Color by family if available
      const family = feature.node.taxonomicInfo?.["dwc:family"]
      switch (family) {
        case "Fabaceae":
          return "#16a34a" // Green
        case "Burseraceae":
          return "#92400e" // Brown
        case "Lecythidaceae":
          return "#7c3aed" // Purple
        case "Myristicaceae":
          return "#dc2626" // Red
        case "Chrysobalanaceae":
          return "#d97706" // Amber
        case "Lauraceae":
          return "#2563eb" // Blue
        case "Arecaceae":
          return "#059669" // Emerald
        default:
          return "#22c55e" // Default green for trees
      }
    case "plot":
      return "#3b82f6" // Blue for plots
    case "region":
      return "#6366f1" // Indigo for regions
    default:
      return "#6b7280" // Gray for others
  }
}

export function getFeatureSize(feature: GeoFeature, isSelected = false): number {
  const baseSize = feature.type === "tree" ? 6 : feature.type === "plot" ? 8 : 10
  return isSelected ? baseSize * 1.5 : baseSize
}
