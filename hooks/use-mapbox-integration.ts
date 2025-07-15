"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import mapboxgl from "mapbox-gl"
import { extractGeoFeatures, calculateBounds } from "@/lib/geo-utils"
import { createMapboxSource, addMapLayers, fitMapToBounds } from "@/lib/mapbox-utils"
import type { GraphData, GraphNode } from "@/lib/types"
import type { GeoFeature } from "@/lib/geo-utils"

// Set access token at module level
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
}

export function useMapboxIntegration(data: GraphData | null, selectedNodeId: string | null) {
  // ---- state --------------------------------------------------------------
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [geoFeatures, setGeoFeatures] = useState<GeoFeature[]>([])
  const [hasGeoData, setHasGeoData] = useState(false)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [isMapLoading, setIsMapLoading] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // ---- refs ---------------------------------------------------------------
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const initialized = useRef(false)

  // ---- token --------------------------------------------------------------
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  console.log("Mapbox integration state:", {
    hasToken: !!mapboxToken,
    tokenStart: mapboxToken?.substring(0, 20),
    hasMap: !!map,
    isLoading: isMapLoading,
    error: mapError,
    initialized: initialized.current,
  })

  // Callback handlers (to be set by parent component)
  const [onFeatureSelect, setOnFeatureSelect] = useState<((node: GraphNode) => void) | null>(null)
  const [onFeatureDeselect, setOnFeatureDeselect] = useState<(() => void) | null>(null)

  // =========================================================================
  // 1.  INITIALIZE MAPBOX MAP
  // =========================================================================
  useEffect(() => {
    // Only initialize once
    if (!mapboxToken || !mapContainer.current || initialized.current || mapRef.current) {
      return
    }

    console.log("Starting Mapbox initialization...")
    initialized.current = true
    setIsMapLoading(true)
    setMapError(null)

    try {
      console.log("Creating Mapbox instance...")
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [-53.975, 5.487], // French Guiana coordinates
        zoom: 12,
        attributionControl: false,
      })

      // Store reference immediately
      mapRef.current = mapInstance

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

      // Timeout fallback
      const timeout = setTimeout(() => {
        if (isMapLoading) {
          console.error("Map loading timeout")
          setMapError("Map loading timeout - please check your token and internet connection")
          setIsMapLoading(false)
        }
      }, 10000) // 10 second timeout

      return () => {
        clearTimeout(timeout)
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError(`Initialization error: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsMapLoading(false)
      initialized.current = false // Allow retry
    }
  }, [mapboxToken, isMapLoading])

  // =========================================================================
  // 2.  CONVERT NODES ➜ GEO FEATURES WHEN THE DATA CHANGES
  // =========================================================================
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
  }, [data])

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
    [geoFeatures, selectedFeatureId, onFeatureSelect, onFeatureDeselect],
  )

  // =========================================================================
  // 3.  PUSH FEATURES INTO THE MAP / (RE)ADD SOURCE + LAYERS
  // =========================================================================
  useEffect(() => {
    if (!map || geoFeatures.length === 0) return

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

        // Add layers immediately after source
        addMapLayers(map)
        setupMapInteractions(map)

        // Fit map to show all features
        const bounds = calculateBounds(geoFeatures)
        if (bounds) {
          console.log("Fitting map to bounds...")
          fitMapToBounds(map, bounds)
        }
      }
    } catch (error) {
      console.error("Error updating map data:", error)
      setMapError(`Data update error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }, [map, geoFeatures, setupMapInteractions])

  // =========================================================================
  // 4.  HANDLE EXTERNAL NODE SELECTION (FROM THE GRAPH VIEW)
  // =========================================================================
  useEffect(() => {
    if (!map || !selectedNodeId) {
      // Clear previous selection
      if (selectedFeatureId && map) {
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

  // =========================================================================
  // 5.  CLEAN-UP ON UNMOUNT
  // =========================================================================
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log("Cleaning up map...")
        mapRef.current.remove()
        mapRef.current = null
        setMap(null)
        initialized.current = false
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
