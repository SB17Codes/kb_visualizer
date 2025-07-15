"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TreePine, MapIcon, AlertCircle } from "lucide-react"
import { useMapboxIntegration } from "@/hooks/use-mapbox-integration"
import type { GraphData, GraphNode } from "@/lib/types"

interface MapboxViewerProps {
  data: GraphData | null
  selectedNodeId: string | null
  onNodeSelect: (node: GraphNode) => void
  onNodeDeselect: () => void
  className?: string
}

export function MapboxViewer({ data, selectedNodeId, onNodeSelect, onNodeDeselect, className }: MapboxViewerProps) {
  const {
    mapContainer,
    hasGeoData,
    geoFeatures,
    setOnFeatureSelect,
    setOnFeatureDeselect,
    selectNodeOnMap,
    map,
    mapboxToken,
    isMapLoading,
    mapError,
  } = useMapboxIntegration(data, selectedNodeId)

  // Set up callbacks
  useEffect(() => {
    setOnFeatureSelect(() => onNodeSelect)
    setOnFeatureDeselect(() => onNodeDeselect)
  }, [onNodeSelect, onNodeDeselect, setOnFeatureSelect, setOnFeatureDeselect])

  // Handle external node selection
  useEffect(() => {
    if (selectedNodeId && map) {
      selectNodeOnMap(selectedNodeId)
    }
  }, [selectedNodeId, selectNodeOnMap, map])

  console.log("MapboxViewer render:", {
    hasToken: !!mapboxToken,
    hasGeoData,
    featuresCount: geoFeatures.length,
    isLoading: isMapLoading,
    hasMap: !!map,
    error: mapError,
  })

  if (!mapboxToken) {
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
            <p>Mapbox token not configured</p>
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

  if (mapError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic View
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-destructive">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="font-medium">Map Error</p>
            <p className="text-sm">{mapError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Reload Page
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

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
          <div ref={mapContainer} className="w-full h-96 rounded-b-lg overflow-hidden" style={{ minHeight: "400px" }} />
          {(isMapLoading || !map) && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-b-lg">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {isMapLoading ? "Loading map..." : "Initializing..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
