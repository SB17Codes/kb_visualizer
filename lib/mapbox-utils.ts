import mapboxgl from "mapbox-gl"
import type { GeoFeature, GeoJSON } from "./geo-utils"

export function createMapboxSource(features: GeoFeature[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map((feature) => ({
      type: "Feature",
      id: feature.id,
      geometry: {
        type: "Point",
        coordinates: [feature.coordinates.longitude, feature.coordinates.latitude],
      },
      properties: {
        id: feature.id,
        type: feature.type,
        name: feature.node.name,
        entityType: feature.node.entityType,
        family: feature.node.taxonomicInfo?.["dwc:family"] || null,
        genus: feature.node.taxonomicInfo?.["dwc:genus"] || null,
        species: feature.node.taxonomicInfo?.["dwc:specificEpithet"] || null,
        plotInfo: feature.node.plotInfo || null,
      },
    })),
  }
}

export function addMapLayers(map: mapboxgl.Map) {
  // Add trees layer
  map.addLayer({
    id: "trees",
    type: "circle",
    source: "geo-features",
    filter: ["==", ["get", "type"], "tree"],
    paint: {
      "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 9, 6],
      "circle-color": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        "#FF8C00",
        [
          "match",
          ["get", "family"],
          "Fabaceae",
          "#16a34a",
          "Burseraceae",
          "#92400e",
          "Lecythidaceae",
          "#7c3aed",
          "Myristicaceae",
          "#dc2626",
          "Chrysobalanaceae",
          "#d97706",
          "Lauraceae",
          "#2563eb",
          "Arecaceae",
          "#059669",
          "#22c55e", // default green
        ],
      ],
      "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 1],
      "circle-stroke-color": ["case", ["boolean", ["feature-state", "selected"], false], "#FF8C00", "#ffffff"],
      "circle-opacity": 0.8,
      "circle-stroke-opacity": 1,
    },
  })

  // Add plots layer
  map.addLayer({
    id: "plots",
    type: "circle",
    source: "geo-features",
    filter: ["==", ["get", "type"], "plot"],
    paint: {
      "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 12, 8],
      "circle-color": ["case", ["boolean", ["feature-state", "selected"], false], "#FF8C00", "#3b82f6"],
      "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 2],
      "circle-stroke-color": ["case", ["boolean", ["feature-state", "selected"], false], "#FF8C00", "#ffffff"],
      "circle-opacity": 0.7,
      "circle-stroke-opacity": 1,
    },
  })

  // Add regions layer
  map.addLayer({
    id: "regions",
    type: "circle",
    source: "geo-features",
    filter: ["==", ["get", "type"], "region"],
    paint: {
      "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 15, 10],
      "circle-color": ["case", ["boolean", ["feature-state", "selected"], false], "#FF8C00", "#6366f1"],
      "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 2],
      "circle-stroke-color": ["case", ["boolean", ["feature-state", "selected"], false], "#FF8C00", "#ffffff"],
      "circle-opacity": 0.6,
      "circle-stroke-opacity": 1,
    },
  })
}

export function fitMapToBounds(
  map: mapboxgl.Map,
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
) {
  const mapBounds = new mapboxgl.LngLatBounds([bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat])

  map.fitBounds(mapBounds, {
    padding: { top: 50, bottom: 50, left: 50, right: 50 },
    maxZoom: 15,
  })
}
