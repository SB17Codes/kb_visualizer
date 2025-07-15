"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Network, MapPin } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ViewToggleProps {
  currentView: "graph" | "map"
  onViewChange: (view: "graph" | "map") => void
  hasGeoData: boolean
}

export function ViewToggle({ currentView, onViewChange, hasGeoData }: ViewToggleProps) {
  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={currentView}
        onValueChange={(value) => value && onViewChange(value as "graph" | "map")}
      >
        <ToggleGroupItem value="graph" aria-label="Graph view">
          <Network className="h-4 w-4 mr-2" />
          Graph
        </ToggleGroupItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="map" aria-label="Map view" disabled={!hasGeoData}>
              <MapPin className="h-4 w-4 mr-2" />
              Map
            </ToggleGroupItem>
          </TooltipTrigger>
          {!hasGeoData && (
            <TooltipContent>
              <p>No geographic data found in the current dataset</p>
            </TooltipContent>
          )}
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  )
}
