"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TreePine, MapIcon } from "lucide-react"
import type { GraphData, GraphNode } from "@/lib/types"
import { extractGeoFeatures, calculateBounds } from "@/lib/geo-utils"

interface SimpleMapViewerProps {
  data: GraphData | null
  selectedNodeId: string | null
  onNodeSelect: (node: GraphNode) => void
  onNodeDeselect: () => void
  className?: string
}

export function SimpleMapViewer({
  data,
  selectedNodeId,
  onNodeSelect,
  onNodeDeselect,
  className,
}: SimpleMapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [geoFeatures, setGeoFeatures] = useState<any[]>([])
  const [bounds, setBounds] = useState<any>(null)
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  // Extract geo features when data changes
  useEffect(() => {
    if (!data) {
      setGeoFeatures([])
      setBounds(null)
      return
    }

    const features = extractGeoFeatures(data.nodes)
    setGeoFeatures(features)

    if (features.length > 0) {
      const calculatedBounds = calculateBounds(features)
      setBounds(calculatedBounds)
    }
  }, [data])

  // Draw the map
  useEffect(() => {
    if (!canvasRef.current || geoFeatures.length === 0 || !bounds) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Calculate scale and offset
    const padding = 50
    const scaleX = (rect.width - padding * 2) / (bounds.maxLng - bounds.minLng)
    const scaleY = (rect.height - padding * 2) / (bounds.maxLat - bounds.minLat)
    const scale = Math.min(scaleX, scaleY)

    const offsetX = (rect.width - (bounds.maxLng - bounds.minLng) * scale) / 2
    const offsetY = (rect.height - (bounds.maxLat - bounds.minLat) * scale) / 2

    // Convert coordinates to canvas position
    const toCanvasCoords = (lng: number, lat: number) => ({
      x: (lng - bounds.minLng) * scale + offsetX,
      y: rect.height - ((lat - bounds.minLat) * scale + offsetY), // Flip Y axis
    })

    // Draw grid
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = (rect.width / 10) * i
      const y = (rect.height / 10) * i

      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, rect.height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y)
      ctx.stroke()
    }

    // Draw features
    geoFeatures.forEach((feature) => {
      const pos = toCanvasCoords(feature.coordinates.longitude, feature.coordinates.latitude)
      const isSelected = feature.id === selectedNodeId
      const isHovered = feature.id === hoveredFeature

      // Get color based on type and family
      let color = "#22c55e" // default green
      if (feature.type === "plot")
        color = "#3b82f6" // blue
      else if (feature.type === "region")
        color = "#6366f1" // indigo
      else if (feature.node.taxonomicInfo?.["dwc:family"]) {
        const family = feature.node.taxonomicInfo["dwc:family"]
        switch (family) {
          case "Fabaceae":
            color = "#16a34a"
            break
          case "Burseraceae":
            color = "#92400e"
            break
          case "Lecythidaceae":
            color = "#7c3aed"
            break
          case "Myristicaceae":
            color = "#dc2626"
            break
          case "Chrysobalanaceae":
            color = "#d97706"
            break
          case "Lauraceae":
            color = "#2563eb"
            break
          case "Arecaceae":
            color = "#059669"
            break
        }
      }

      // Size based on type
      let size = 6
      if (feature.type === "plot") size = 8
      else if (feature.type === "region") size = 10

      if (isSelected || isHovered) {
        size *= 1.5
        color = isSelected ? "#FF8C00" : color
      }

      // Draw feature
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      // Draw border
      ctx.strokeStyle = isSelected ? "#FF8C00" : "#ffffff"
      ctx.lineWidth = isSelected ? 3 : 1
      ctx.stroke()

      // Draw label for selected or hovered features
      if (isSelected || isHovered) {
        ctx.fillStyle = "#ffffff"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(feature.node.name, pos.x, pos.y - size - 5)
      }
    })

    // Draw legend
    const legendX = 20
    const legendY = 20
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
    ctx.fillRect(legendX - 10, legendY - 10, 200, 120)

    ctx.fillStyle = "#ffffff"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText("Legend", legendX, legendY + 10)

    // Legend items
    const legendItems = [
      { color: "#22c55e", label: "Trees", count: geoFeatures.filter((f) => f.type === "tree").length },
      { color: "#3b82f6", label: "Plots", count: geoFeatures.filter((f) => f.type === "plot").length },
      { color: "#6366f1", label: "Regions", count: geoFeatures.filter((f) => f.type === "region").length },
    ]

    legendItems.forEach((item, index) => {
      if (item.count > 0) {
        const y = legendY + 30 + index * 20
        ctx.beginPath()
        ctx.arc(legendX + 10, y, 6, 0, 2 * Math.PI)
        ctx.fillStyle = item.color
        ctx.fill()
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = "#ffffff"
        ctx.fillText(`${item.label} (${item.count})`, legendX + 25, y + 5)
      }
    })
  }, [geoFeatures, bounds, selectedNodeId, hoveredFeature])

  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !bounds) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find feature under mouse
    const padding = 50
    const scaleX = (rect.width - padding * 2) / (bounds.maxLng - bounds.minLng)
    const scaleY = (rect.height - padding * 2) / (bounds.maxLat - bounds.minLat)
    const scale = Math.min(scaleX, scaleY)

    const offsetX = (rect.width - (bounds.maxLng - bounds.minLng) * scale) / 2
    const offsetY = (rect.height - (bounds.maxLat - bounds.minLat) * scale) / 2

    let foundFeature = null
    for (const feature of geoFeatures) {
      const pos = {
        x: (feature.coordinates.longitude - bounds.minLng) * scale + offsetX,
        y: rect.height - ((feature.coordinates.latitude - bounds.minLat) * scale + offsetY),
      }

      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
      if (distance <= 15) {
        // 15px hit area
        foundFeature = feature.id
        break
      }
    }

    setHoveredFeature(foundFeature)
    canvasRef.current.style.cursor = foundFeature ? "pointer" : "default"
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !bounds) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find feature under mouse
    const padding = 50
    const scaleX = (rect.width - padding * 2) / (bounds.maxLng - bounds.minLng)
    const scaleY = (rect.height - padding * 2) / (bounds.maxLat - bounds.minLat)
    const scale = Math.min(scaleX, scaleY)

    const offsetX = (rect.width - (bounds.maxLng - bounds.minLng) * scale) / 2
    const offsetY = (rect.height - (bounds.maxLat - bounds.minLat) * scale) / 2

    let clickedFeature = null
    for (const feature of geoFeatures) {
      const pos = {
        x: (feature.coordinates.longitude - bounds.minLng) * scale + offsetX,
        y: rect.height - ((feature.coordinates.latitude - bounds.minLat) * scale + offsetY),
      }

      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
      if (distance <= 15) {
        // 15px hit area
        clickedFeature = feature
        break
      }
    }

    if (clickedFeature) {
      onNodeSelect(clickedFeature.node)
    } else {
      onNodeDeselect()
    }
  }

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

  if (geoFeatures.length === 0) {
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

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic View (Canvas)
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
          <canvas
            ref={canvasRef}
            className="w-full h-96 rounded-b-lg cursor-default"
            style={{ minHeight: "400px" }}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
          />
        </div>
      </CardContent>
    </Card>
  )
}
