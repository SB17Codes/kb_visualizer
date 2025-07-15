"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { extractGeoFeatures, calculateBounds } from "@/lib/geo-utils"
import { createMapboxSource, addMapLayers, fitMapToBounds } from "@/lib/mapbox-utils"
import type { GraphData, GraphNode } from "@/lib/types"
import type { GeoFeature } from "@/lib/geo-utils"
import type mapboxgl from "mapbox-gl"

declare global {
  interface Window {
    mapboxgl: any
  }
}

export function useMapboxIntegration(data: GraphData | null, selectedNodeId: string | null) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [geoFeatures, setGeoFeatures] = useState<GeoFeature[]>([])
  const [hasGeoData, setHasGeoData] = useState(false)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [isMapLoading, setIsMapLoading] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const initializationAttempted = useRef(false)

  // Get the token from environment
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  console.log("Mapbox integration state:", {
    hasToken: !!mapboxToken,
    tokenStart: mapboxToken?.substring(0, 20),
    hasMap: !!map,
    isLoading: isMapLoading,
    error: mapError,
  })

  // Initialize map when container is available
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || mapRef.current || initializationAttempted.current) {
      return
    }

    initializationAttempted.current = true
    setIsMapLoading(true)
    setMapError(null)

    const initializeMap = async () => {
      try {
        console.log("Starting Mapbox initialization...")

        // Load Mapbox GL if not already loaded
        if (!window.mapboxgl) {
          console.log("Loading Mapbox GL script...")
          const script = document.createElement("script")
          script.src = "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"
          script.async = true

          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              console.log("Mapbox GL script loaded")
              resolve()
            }
            script.onerror = () => {
              console.error("Failed to load Mapbox GL script")
              reject(new Error("Failed to load Mapbox GL"))
            }
            document.head.appendChild(script)
          })

          // Small delay to ensure script is fully loaded
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        if (!window.mapboxgl) {
          throw new Error("Mapbox GL not available after loading")
        }

        const mapboxgl = window.mapboxgl
        mapboxgl.accessToken = mapboxToken

        console.log("Creating Mapbox instance...")
        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [-53.975, 5.487], // French Guiana coordinates
          zoom: 12,
          attributionControl: false,
        })

        // Add navigation controls
        mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right")
        mapInstance.addControl(
          new mapboxgl.AttributionControl({
            compact: true,
          }),
          "bottom-right",
        )

        // Handle map load
        mapInstance.on("load", () => {
          console.log("Map loaded successfully!")
          mapRef.current = mapInstance
          setMap(mapInstance)
          setIsMapLoading(false)
          setMapError(null)
        })

        // Handle map errors
        mapInstance.on("error", (e) => {
          console.error("Map error:", e)
          setMapError(`Map error: ${e.error?.message || "Unknown error"}`)
          setIsMapLoading(false)
        })

        // Handle style load errors
        mapInstance.on("style.load", () => {
          console.log("Map style loaded")
        })

        // Timeout fallback
        setTimeout(() => {
          if (isMapLoading && !mapRef.current) {
            console.error("Map loading timeout")
            setMapError("Map loading timeout - please check your internet connection")
            setIsMapLoading(false)
          }
        }, 15000) // 15 second timeout
      } catch (error) {
        console.error("Error initializing map:", error)
        setMapError(`Initialization error: ${error instanceof Error ? error.message : "Unknown error"}`)
        setIsMapLoading(false)
        initializationAttempted.current = false // Allow retry
      }
    }

    initializeMap()
  }, [mapboxToken, isMapLoading])

  // Extract geo features when data changes (not when switching tabs)
  useEffect(() => {
    console.log("Processing geo features from data...")
    if (!data) {
      setGeoFeatures([])
      setHasGeoData(false)
      return
    }

    const features = extractGeoFeatures(data.nodes)
    console.log(`Extracted ${features.length} geo features`)
    setGeoFeatures(features)
    setHasGeoData(features.length > 0)
  }, [data]) // Only depend on data, not map

  // Update map data when both map and features are available
  useEffect(() => {
    if (!map || geoFeatures.length === 0) {
      return
    }

    console.log("Updating map with geo features...")
    try {
      const geoJsonData = createMapboxSource(geoFeatures)
      const source = map.getSource("geo-features")

      if (source) {
        // Update existing source
        ;(source as mapboxgl.GeoJSONSource).setData(geoJsonData)
        console.log("Updated existing map source")
      } else {
        // Add new source and layers
        console.log("Adding new map source and layers...")
        map.addSource("geo-features", {
          type: "geojson",
          data: geoJsonData,
        })

        // Wait for source to be loaded before adding layers
        const checkSourceLoaded = () => {
          if (map.isSourceLoaded("geo-features")) {
            console.log("Source loaded, adding layers...")
            addMapLayers(map)
            setupMapInteractions(map)

            // Fit map to show all features
            const bounds = calculateBounds(geoFeatures)
            if (bounds) {
              console.log("Fitting map to bounds...")
              fitMapToBounds(map, bounds)
            }
          } else {
            // Check again in a bit
            setTimeout(checkSourceLoaded, 100)
          }
        }
        checkSourceLoaded()
      }
    } catch (error) {
      console.error("Error updating map data:", error)
      setMapError(`Data update error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }, [map, geoFeatures])

  // Handle external node selection (from graph)
  useEffect(() => {
    if (!map || !selectedNodeId) {
      // Clear previous selection
      if (selectedFeatureId) {
        clearFeatureSelection(map, selectedFeatureId)
        setSelectedFeatureId(null)
      }
      return
    }

    const feature = geoFeatures.find((f) => f.id === selectedNodeId)
    if (feature) {
      selectFeatureOnMap(map, feature.id)
      setSelectedFeatureId(feature.id)

      // Center map on selected feature
      map.flyTo({
        center: [feature.coordinates.longitude, feature.coordinates.latitude],
        zoom: Math.max(map.getZoom(), 14),
        duration: 1000,
      })
    }
  }, [selectedNodeId, map, geoFeatures, selectedFeatureId])

  const setupMapInteractions = useCallback(
    (mapInstance: mapboxgl.Map) => {
      console.log("Setting up map interactions...")
      const layers = ["trees", "plots", "regions"]

      layers.forEach((layer) => {
        // Change cursor on hover
        mapInstance.on("mouseenter", layer, () => {
          mapInstance.getCanvas().style.cursor = "pointer"
        })

        mapInstance.on("mouseleave", layer, () => {
          mapInstance.getCanvas().style.cursor = ""
        })

        // Handle clicks
        mapInstance.on("click", layer, (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0]
            const featureId = feature.id as string

            // Clear previous selection
            if (selectedFeatureId && selectedFeatureId !== featureId) {
              clearFeatureSelection(mapInstance, selectedFeatureId)
            }

            // Select new feature
            selectFeatureOnMap(mapInstance, featureId)
            setSelectedFeatureId(featureId)

            // Find the corresponding node and trigger selection
            const geoFeature = geoFeatures.find((f) => f.id === featureId)
            if (geoFeature && onFeatureSelect) {
              onFeatureSelect(geoFeature.node)
            }
          }
        })
      })

      // Handle map clicks (deselect)
      mapInstance.on("click", (e) => {
        // Check if click was on a feature
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ["trees", "plots", "regions"],
        })

        if (features.length === 0 && selectedFeatureId) {
          clearFeatureSelection(mapInstance, selectedFeatureId)
          setSelectedFeatureId(null)
          if (onFeatureDeselect) {
            onFeatureDeselect()
          }
        }
      })
    },
    [geoFeatures, selectedFeatureId],
  )

  const selectFeatureOnMap = useCallback((mapInstance: mapboxgl.Map, featureId: string) => {
    try {
      mapInstance.setFeatureState({ source: "geo-features", id: featureId }, { selected: true })
    } catch (error) {
      console.error("Error selecting feature:", error)
    }
  }, [])

  const clearFeatureSelection = useCallback((mapInstance: mapboxgl.Map, featureId: string) => {
    try {
      mapInstance.setFeatureState({ source: "geo-features", id: featureId }, { selected: false })
    } catch (error) {
      console.error("Error clearing feature selection:", error)
    }
  }, [])

  // Callback handlers (to be set by parent component)
  const [onFeatureSelect, setOnFeatureSelect] = useState<((node: GraphNode) => void) | null>(null)
  const [onFeatureDeselect, setOnFeatureDeselect] = useState<(() => void) | null>(null)

  const selectNodeOnMap = useCallback(
    (nodeId: string) => {
      if (!map) return

      const feature = geoFeatures.find((f) => f.id === nodeId)
      if (feature && selectedFeatureId !== nodeId) {
        // Clear previous selection
        if (selectedFeatureId) {
          clearFeatureSelection(map, selectedFeatureId)
        }

        selectFeatureOnMap(map, nodeId)
        setSelectedFeatureId(nodeId)

        // Center map on selected feature
        map.flyTo({
          center: [feature.coordinates.longitude, feature.coordinates.latitude],
          zoom: Math.max(map.getZoom(), 14),
          duration: 1000,
        })
      }
    },
    [map, geoFeatures, selectedFeatureId, selectFeatureOnMap, clearFeatureSelection],
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log("Cleaning up map...")
        mapRef.current.remove()
        mapRef.current = null
        setMap(null)
        initializationAttempted.current = false
      }
    }
  }, [])

  return {
    mapContainer,
    map,
    geoFeatures,
    hasGeoData,
    selectedFeatureId,
    isMapLoading,
    mapError,
    setOnFeatureSelect,
    setOnFeatureDeselect,
    selectNodeOnMap,
    mapboxToken,
  }
}
