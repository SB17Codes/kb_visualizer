import { TreePine, MapPin, FlaskConical, Database, BarChart3, Map } from "lucide-react"
import type { EntityCounts } from "@/lib/types"

interface GraphLegendProps {
  entityCounts: EntityCounts
}

export function GraphLegend({ entityCounts }: GraphLegendProps) {
  return (
    <div className="absolute top-2 right-2 z-10 bg-background/90 backdrop-blur-sm p-2 rounded-md text-xs border shadow-sm space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-600"></div>
        <TreePine className="w-3 h-3" />
        <span>Trees ({entityCounts.trees})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
        <Map className="w-3 h-3" />
        <span>Plots ({entityCounts.plots})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
        <MapPin className="w-3 h-3" />
        <span>Regions ({entityCounts.regions})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-purple-600"></div>
        <FlaskConical className="w-3 h-3" />
        <span>Observations ({entityCounts.observations})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-violet-600"></div>
        <Database className="w-3 h-3" />
        <span>Collections ({entityCounts.collections})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-pink-600"></div>
        <BarChart3 className="w-3 h-3" />
        <span>Results ({entityCounts.results})</span>
      </div>
      {entityCounts.other > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
          <span>Other ({entityCounts.other})</span>
        </div>
      )}
    </div>
  )
}
