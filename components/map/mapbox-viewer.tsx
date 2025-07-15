"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TreePine, MapIcon, AlertCircle } from "lucide-react"
import { extractGeoFeatures, calculateBounds } from "@/lib/geo-utils"
import type { GraphData, GraphNode } from "@/lib/types"

interface MapboxViewerProps {
  data: GraphData | null
  selectedNodeId: string | null
  onNodeSelect: (node: GraphNode) => void
  onNodeDeselect: () => void
  className?: string
}

export function MapboxViewer({ data, selectedNodeId, onNodeSelect, onNodeDeselect, className }: MapboxViewerProps) {
  const [isClient, setIsClient] = useState(false)
  const [MapComponents, setMapComponents] = useState<any>(null)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [hoveredFeature, setHoveredFeature] = useState<any>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  // Load Mapbox components dynamically
  useEffect(() => {
    setIsClient(true)

    if (!mapboxToken) {
      setMapError("Mapbox token not configured")
      return
    }

    const loadMapbox = async () => {
      try {
        // Import all components at once to avoid multiple dynamic imports
        const [ReactMapboxGl, { Layer }, { Feature }, { Popup }, { ZoomControl }] = await Promise.all([
          import("react-mapbox-gl").then((mod) => mod.default),
          import("react-mapbox-gl"),
          import("react-mapbox-gl"),
          import("react-mapbox-gl"),
          import("react-mapbox-gl"),
        ])

        const Map = ReactMapboxGl({
          accessToken: mapboxToken,
          scrollZoom: true,
          dragRotate: false,
          pitchWithRotate: false,
          attributionControl: true,
          logoPosition: "bottom-left",
        })

        setMapComponents({
          Map,
          Layer,
          Feature,
          Popup,
          ZoomControl,
        })
      } catch (error) {
        console.error("Failed to load Mapbox:", error)
        setMapError("Failed to load map components")
      }
    }

    loadMapbox()
  }, [mapboxToken])

  const geoFeatures = useMemo(() => {
    if (!data) return []
    return extractGeoFeatures(data.nodes)
  }, [data])

  const hasGeoData = geoFeatures.length > 0

  // Calculate map bounds and center
  const mapBounds = useMemo(() => {
    if (geoFeatures.length === 0) return null
    return calculateBounds(geoFeatures)
  }, [geoFeatures])

  const mapCenter = useMemo((): [number, number] => {
    if (!mapBounds) return [-53.975, 5.487] // French Guiana default
    return [(mapBounds.minLng + mapBounds.maxLng) / 2, (mapBounds.minLat + mapBounds.maxLat) / 2]
  }, [mapBounds])

  const fitBounds = useMemo(() => {
    if (!mapBounds) return undefined
    return [
      [mapBounds.minLng, mapBounds.minLat],
      [mapBounds.maxLng, mapBounds.maxLat],
    ] as [[number, number], [number, number]]
  }, [mapBounds])

  // Handle external selection
  useEffect(() => {
    if (selectedNodeId && geoFeatures.length > 0) {
      const feature = geoFeatures.find((f) => f.id === selectedNodeId)
      if (feature) {
        setSelectedFeature(feature)
      }
    } else {
      setSelectedFeature(null)
    }
  }, [selectedNodeId, geoFeatures])

  const getFeatureColor = useCallback((feature: any, isSelected = false, isHovered = false) => {
    if (isSelected) return "#FF8C00"
    if (isHovered) return "#FFB84D"

    switch (feature.type) {
      case "tree":
        const family = feature.node.taxonomicInfo?.["dwc:family"]
        switch (family) {
          case "Fabaceae":
            return "#16a34a"
          case "Burseraceae":
            return "#92400e"
          case "Lecythidaceae":
            return "#7c3aed"
          case "Myristicaceae":
            return "#dc2626"
          case "Chrysobalanaceae":
            return "#d97706"
          case "Lauraceae":
            return "#2563eb"
          case "Arecaceae":
            return "#059669"
          default:
            return "#22c55e"
        }
      case "plot":
        return "#3b82f6"
      case "region":
        return "#6366f1"
      default:
        return "#6b7280"
    }
  }, [])

  const getFeatureSize = useCallback((feature: any, isSelected = false, isHovered = false) => {
    let baseSize = 8
    if (feature.type === "plot") baseSize = 10
    else if (feature.type === "region") baseSize = 12
    else if (feature.type === "tree") baseSize = 6

    if (isSelected) return baseSize * 1.8
    if (isHovered) return baseSize * 1.3
    return baseSize
  }, [])

  const handleFeatureClick = useCallback(
    (feature: any) => {
      if (selectedFeature?.id === feature.id) {
        setSelectedFeature(null)
        onNodeDeselect()
      } else {
        setSelectedFeature(feature)
        onNodeSelect(feature.node)
      }
    },
    [selectedFeature, onNodeSelect, onNodeDeselect],
  )

  const handleFeatureHover = useCallback((feature: any) => {
    setHoveredFeature(feature)
  }, [])

  const handleFeatureLeave = useCallback(() => {
    setHoveredFeature(null)
  }, [])

  const handleMapClick = useCallback(() => {
    if (selectedFeature) {
      setSelectedFeature(null)
      onNodeDeselect()
    }
  }, [selectedFeature, onNodeDeselect])

  if (!isClient) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic View
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mapError || !mapboxToken) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic View
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{mapError || "Mapbox token not configured"}</p>
            <p className="text-sm">Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to environment variables</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasGeoData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic View
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <MapIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No geographic data available</p>
            <p className="text-sm">Upload data with coordinates to see the map view</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!MapComponents) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic View
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4">Initializing map...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { Map, Layer, Feature, Popup, ZoomControl } = MapComponents

  const treesCount = geoFeatures.filter((f) => f.type === "tree").length
  const plotsCount = geoFeatures.filter((f) => f.type === "plot").length
  const regionsCount = geoFeatures.filter((f) => f.type === "region").length

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic View
          </CardTitle>
          <div className="flex items-center gap-2">
            {treesCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <TreePine className="w-3 h-3" />
                {treesCount}
              </Badge>
            )}
            {plotsCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapIcon className="w-3 h-3" />
                {plotsCount}
              </Badge>
            )}
            {regionsCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {regionsCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div className="w-full h-96 rounded-b-lg overflow-hidden" style={{ minHeight: "400px" }}>
            <Map
              style="mapbox://styles/mapbox/satellite-streets-v12"
              center={mapCenter}
              zoom={[12]}
              fitBounds={fitBounds}
              fitBoundsOptions={{ padding: 50 }}
              containerStyle={{ height: "100%", width: "100%" }}
              onClick={handleMapClick}
            >
              <ZoomControl position="top-right" />

              {/* Trees Layer */}
              <Layer
                type="circle"
                paint={{
                  "circle-radius": 6,
                  "circle-color": "#22c55e",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.8,
                }}
              >
                {geoFeatures
                  .filter((f) => f.type === "tree")
                  .map((feature) => {
                    const isSelected = selectedFeature?.id === feature.id
                    const isHovered = hoveredFeature?.id === feature.id

                    return (
                      <Feature
                        key={feature.id}
                        coordinates={[feature.coordinates.longitude, feature.coordinates.latitude]}
                        properties={{
                          color: getFeatureColor(feature, isSelected, isHovered),
                          size: getFeatureSize(feature, isSelected, isHovered),
                        }}
                        onClick={() => handleFeatureClick(feature)}
                        onMouseEnter={() => handleFeatureHover(feature)}
                        onMouseLeave={handleFeatureLeave}
                      />
                    )
                  })}
              </Layer>

              {/* Plots Layer */}
              <Layer
                type="circle"
                paint={{
                  "circle-radius": 10,
                  "circle-color": "#3b82f6",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.7,
                }}
              >
                {geoFeatures
                  .filter((f) => f.type === "plot")
                  .map((feature) => {
                    const isSelected = selectedFeature?.id === feature.id
                    const isHovered = hoveredFeature?.id === feature.id

                    return (
                      <Feature
                        key={feature.id}
                        coordinates={[feature.coordinates.longitude, feature.coordinates.latitude]}
                        properties={{
                          color: getFeatureColor(feature, isSelected, isHovered),
                          size: getFeatureSize(feature, isSelected, isHovered),
                        }}
                        onClick={() => handleFeatureClick(feature)}
                        onMouseEnter={() => handleFeatureHover(feature)}
                        onMouseLeave={handleFeatureLeave}
                      />
                    )
                  })}
              </Layer>

              {/* Regions Layer */}
              <Layer
                type="circle"
                paint={{
                  "circle-radius": 12,
                  "circle-color": "#6366f1",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.6,
                }}
              >
                {geoFeatures
                  .filter((f) => f.type === "region")
                  .map((feature) => {
                    const isSelected = selectedFeature?.id === feature.id
                    const isHovered = hoveredFeature?.id === feature.id

                    return (
                      <Feature
                        key={feature.id}
                        coordinates={[feature.coordinates.longitude, feature.coordinates.latitude]}
                        properties={{
                          color: getFeatureColor(feature, isSelected, isHovered),
                          size: getFeatureSize(feature, isSelected, isHovered),
                        }}
                        onClick={() => handleFeatureClick(feature)}
                        onMouseEnter={() => handleFeatureHover(feature)}
                        onMouseLeave={handleFeatureLeave}
                      />
                    )
                  })}
              </Layer>

              {/* Popup for selected feature */}
              {selectedFeature && (
                <Popup
                  coordinates={[selectedFeature.coordinates.longitude, selectedFeature.coordinates.latitude]}
                  offset={{ bottom: [0, -10] }}
                  anchor="bottom"
                >
                  <div className="space-y-2 min-w-48">
                    <div className="font-semibold text-sm">{selectedFeature.node.name}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedFeature.type}
                      </Badge>
                      {selectedFeature.node.taxonomicInfo?.["dwc:family"] && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedFeature.node.taxonomicInfo["dwc:family"]}
                        </Badge>
                      )}
                    </div>
                    {selectedFeature.node.taxonomicInfo?.["dwc:genus"] &&
                      selectedFeature.node.taxonomicInfo?.["dwc:specificEpithet"] && (
                        <div className="text-xs text-muted-foreground italic">
                          {selectedFeature.node.taxonomicInfo["dwc:genus"]}{" "}
                          {selectedFeature.node.taxonomicInfo["dwc:specificEpithet"]}
                        </div>
                      )}
                    <div className="text-xs text-muted-foreground">
                      {selectedFeature.coordinates.latitude.toFixed(6)},{" "}
                      {selectedFeature.coordinates.longitude.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
