"use client"

import { useState, useEffect, useRef } from "react"
import { extractGeoFeatures, calculateBounds } from "@/lib/geo-utils"
import { createMapboxSource, addMapLayers } from "@/lib/mapbox-utils"
import type { GraphData } from "@/lib/types"
import type { GeoFeature } from "@/lib/geo-utils"

export function useMapboxIntegration(data: GraphData | null, selectedNodeId: string | null) {
  // ---- state --------------------------------------------------------------
  const [map, setMap] = useState<any>(null)
  const [geoFeatures, setGeoFeatures] = useState<GeoFeature[]>([])
  const [hasGeoData, setHasGeoData] = useState(false)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [isMapLoading, setIsMapLoading] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // ---- refs ---------------------------------------------------------------
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null) // will hold the map instance
  const mbRef = useRef<any>(null) // will hold the loaded mapbox-gl module
  const initTried = useRef(false)

  // ---- token --------------------------------------------------------------
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  // =========================================================================
  // 1.  DYNAMICALLY LOAD MAPBOX-GL (ESM) THE FIRST TIME WE NEED IT
  // =========================================================================
  useEffect(() => {
    if (!token || !mapContainer.current || initTried.current || mapRef.current) return
    initTried.current = true
    setIsMapLoading(true)
    ;(async () => {
      try {
        // Load the ESM build – esm.sh sets correct CORS + MIME headers
        const { default: mapboxgl } = await import("https://esm.sh/mapbox-gl@3.4.0")
        mbRef.current = mapboxgl
        mapboxgl.accessToken = token

        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [-53.975, 5.487],
          zoom: 12,
          attributionControl: false,
        })

        mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right")
        mapInstance.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right")

        mapInstance.on("load", () => {
          mapRef.current = mapInstance
          setMap(mapInstance)
          setIsMapLoading(false)
        })

        mapInstance.on("error", (e: any) => {
          console.error("Map error:", e)
          setMapError(e.error?.message || "Unknown Mapbox error")
          setIsMapLoading(false)
        })
      } catch (err) {
        console.error("Failed to initialise Mapbox-GL:", err)
        setMapError((err as Error).message ?? "Unknown error")
        setIsMapLoading(false)
        initTried.current = false // allow retry
      }
    })()
  }, [token])

  // =========================================================================
  // 2.  CONVERT NODES ➜ GEO FEATURES WHEN THE DATA CHANGES
  // =========================================================================
  useEffect(() => {
    if (!data) {
      setGeoFeatures([])
      setHasGeoData(false)
      return
    }
    const feats = extractGeoFeatures(data.nodes)
    setGeoFeatures(feats)
    setHasGeoData(feats.length > 0)
  }, [data])

  // =========================================================================
  // 3.  PUSH FEATURES INTO THE MAP / (RE)ADD SOURCE + LAYERS
  // =========================================================================
  useEffect(() => {
    if (!map || geoFeatures.length === 0) return

    const srcId = "geo-features"
    const geojson = createMapboxSource(geoFeatures)

    if (map.getSource(srcId)) {
      ;(map.getSource(srcId) as any).setData(geojson)
    } else {
      map.addSource(srcId, { type: "geojson", data: geojson })
      addMapLayers(map)
      const bounds = calculateBounds(geoFeatures)
      if (bounds) {
        map.fitBounds(
          [
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat],
          ],
          {
            padding: 50,
            maxZoom: 15,
          },
        )
      }
    }
  }, [map, geoFeatures])

  // =========================================================================
  // 4.  HANDLE EXTERNAL NODE SELECTION (FROM THE GRAPH VIEW)
  // =========================================================================
  useEffect(() => {
    if (!map || !selectedNodeId) return

    const feature = geoFeatures.find((f) => f.id === selectedNodeId)
    if (!feature) return

    if (selectedFeatureId && selectedFeatureId !== feature.id) {
      map.setFeatureState({ source: "geo-features", id: selectedFeatureId }, { selected: false })
    }

    map.setFeatureState({ source: "geo-features", id: feature.id }, { selected: true })
    setSelectedFeatureId(feature.id)

    map.flyTo({
      center: [feature.coordinates.longitude, feature.coordinates.latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: 800,
    })
  }, [selectedNodeId, map, geoFeatures, selectedFeatureId])

  // =========================================================================
  // 5.  CLEAN-UP ON UNMOUNT
  // =========================================================================
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return {
    mapContainer,
    map,
    geoFeatures,
    hasGeoData,
    isMapLoading,
    mapError,
  }
}
