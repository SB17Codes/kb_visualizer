"use client"

import { TreePine, MapPin, Map } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MapLegendProps {
  treesCount: number
  plotsCount: number
  regionsCount: number
}

export function MapLegend({ treesCount, plotsCount, regionsCount }: MapLegendProps) {
  const familyColors = [
    { name: "Fabaceae", color: "#16a34a" },
    { name: "Burseraceae", color: "#92400e" },
    { name: "Lecythidaceae", color: "#7c3aed" },
    { name: "Myristicaceae", color: "#dc2626" },
    { name: "Chrysobalanaceae", color: "#d97706" },
    { name: "Lauraceae", color: "#2563eb" },
    { name: "Arecaceae", color: "#059669" },
  ]

  return (
    <Card className="absolute top-4 right-4 z-10 bg-background/95 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Map Legend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Entity Types */}
        <div>
          <h4 className="font-medium mb-2">Entity Types</h4>
          <div className="space-y-1">
            {treesCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <TreePine className="w-3 h-3" />
                <span>Trees ({treesCount})</span>
              </div>
            )}
            {plotsCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <Map className="w-3 h-3" />
                <span>Plots ({plotsCount})</span>
              </div>
            )}
            {regionsCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <MapPin className="w-3 h-3" />
                <span>Regions ({regionsCount})</span>
              </div>
            )}
          </div>
        </div>

        {/* Tree Families */}
        {treesCount > 0 && (
          <div>
            <h4 className="font-medium mb-2">Tree Families</h4>
            <div className="space-y-1">
              {familyColors.map(({ name, color }) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selection Info */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Selected</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
