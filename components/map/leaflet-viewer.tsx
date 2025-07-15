"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TreePine, MapIcon } from "lucide-react"
import { extractGeoFeatures, calculateBounds } from "@/lib/geo-utils"
import type { GraphData, GraphNode } from "@/lib/types"

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const useMap = dynamic(() => import("react-leaflet").then((mod) => mod.useMap), { ssr: false })

interface LeafletViewerProps {
  data: GraphData | null
  selectedNodeId: string | null
  onNodeSelect: (node: GraphNode) => void
  onNodeDeselect: () => void
  className?: string
}

// Component to handle map bounds and selection
function MapController({
  geoFeatures,
  selectedNodeId,
  onNodeSelect,
}: {
  geoFeatures: any[]
  selectedNodeId: string | null
  onNodeSelect: (node: GraphNode) => void
}) {
  const map = useMap()

  // Fit bounds when features change
  useEffect(() => {
    if (geoFeatures.length > 0) {
      const bounds = calculateBounds(geoFeatures)
      if (bounds && map) {
        const leafletBounds = [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng],
        ] as [[number, number], [number, number]]

        map.fitBounds(leafletBounds, { padding: [20, 20] })
      }
    }
  }, [geoFeatures, map])

  // Handle external selection
  useEffect(() => {
    if (selectedNodeId && geoFeatures.length > 0) {
      const feature = geoFeatures.find((f) => f.id === selectedNodeId)
      if (feature && map) {
        map.setView([feature.coordinates.latitude, feature.coordinates.longitude], Math.max(map.getZoom(), 15))
      }
    }
  }, [selectedNodeId, geoFeatures, map])

  return null
}

export function LeafletViewer({ data, selectedNodeId, onNodeSelect, onNodeDeselect, className }: LeafletViewerProps) {
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const geoFeatures = useMemo(() => {
    if (!data) return []
    return extractGeoFeatures(data.nodes)
  }, [data])

  const hasGeoData = geoFeatures.length > 0

  const getFeatureColor = (feature: any, isSelected = false) => {
    if (isSelected) return "#FF8C00"

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
  }

  const getFeatureSize = (feature: any, isSelected = false) => {
    let baseSize = 8
    if (feature.type === "plot") baseSize = 10
    else if (feature.type === "region") baseSize = 12
    else if (feature.type === "tree") baseSize = 6

    return isSelected ? baseSize * 1.5 : baseSize
  }

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

  const treesCount = geoFeatures.filter((f) => f.type === "tree").length
  const plotsCount = geoFeatures.filter((f) => f.type === "plot").length
  const regionsCount = geoFeatures.filter((f) => f.type === "region").length

  // Default center (French Guiana)
  const defaultCenter: [number, number] = [5.487, -53.975]

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
            <MapContainer
              center={defaultCenter}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              <MapController geoFeatures={geoFeatures} selectedNodeId={selectedNodeId} onNodeSelect={onNodeSelect} />

              {geoFeatures.map((feature) => {
                const isSelected = feature.id === selectedNodeId
                const color = getFeatureColor(feature, isSelected)
                const size = getFeatureSize(feature, isSelected)

                return (
                  <CircleMarker
                    key={feature.id}
                    center={[feature.coordinates.latitude, feature.coordinates.longitude]}
                    radius={size}
                    fillColor={color}
                    color={isSelected ? "#FF8C00" : "#ffffff"}
                    weight={isSelected ? 3 : 2}
                    opacity={1}
                    fillOpacity={0.8}
                    eventHandlers={{
                      click: () => {
                        onNodeSelect(feature.node)
                      },
                    }}
                  >
                    <Popup>
                      <div className="space-y-2">
                        <div className="font-semibold text-sm">{feature.node.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {feature.type}
                          </Badge>
                          {feature.node.taxonomicInfo?.["dwc:family"] && (
                            <Badge variant="secondary" className="text-xs">
                              {feature.node.taxonomicInfo["dwc:family"]}
                            </Badge>
                          )}
                        </div>
                        {feature.node.taxonomicInfo?.["dwc:genus"] &&
                          feature.node.taxonomicInfo?.["dwc:specificEpithet"] && (
                            <div className="text-xs text-muted-foreground italic">
                              {feature.node.taxonomicInfo["dwc:genus"]}{" "}
                              {feature.node.taxonomicInfo["dwc:specificEpithet"]}
                            </div>
                          )}
                        <div className="text-xs text-muted-foreground">
                          {feature.coordinates.latitude.toFixed(6)}, {feature.coordinates.longitude.toFixed(6)}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
