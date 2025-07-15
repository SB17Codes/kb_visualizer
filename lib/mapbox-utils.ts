import type { GeoFeature, GeoJSON } from "./geo-utils"

/**
 * Builds a GeoJSON source from our extracted features.
 */
export function createMapboxSource(features: GeoFeature[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map((f) => ({
      type: "Feature",
      id: f.id,
      geometry: {
        type: "Point",
        coordinates: [f.coordinates.longitude, f.coordinates.latitude],
      },
      properties: {
        id: f.id,
        type: f.type,
        name: f.node.name,
        family: f.node.taxonomicInfo?.["dwc:family"] ?? null,
      },
    })),
  }
}

/**
 * Adds three simple circle layers (trees, plots, regions).
 * NB:  The map instance already has the "geo-features" source attached.
 */
export function addMapLayers(map: any) {
  const makePaint = (color: string, radius: number) => ({
    "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], radius * 1.5, radius],
    "circle-color": ["case", ["boolean", ["feature-state", "selected"], false], "#FF8C00", color],
    "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 1],
    "circle-stroke-color": ["case", ["boolean", ["feature-state", "selected"], false], "#FF8C00", "#ffffff"],
    "circle-opacity": 0.8,
  })

  if (!map.getLayer("trees")) {
    map.addLayer({
      id: "trees",
      type: "circle",
      source: "geo-features",
      filter: ["==", ["get", "type"], "tree"],
      paint: makePaint("#22c55e", 6),
    })
  }

  if (!map.getLayer("plots")) {
    map.addLayer({
      id: "plots",
      type: "circle",
      source: "geo-features",
      filter: ["==", ["get", "type"], "plot"],
      paint: makePaint("#3b82f6", 8),
    })
  }

  if (!map.getLayer("regions")) {
    map.addLayer({
      id: "regions",
      type: "circle",
      source: "geo-features",
      filter: ["==", ["get", "type"], "region"],
      paint: makePaint("#6366f1", 10),
    })
  }
}
