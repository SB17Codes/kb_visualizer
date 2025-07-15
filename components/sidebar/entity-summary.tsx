"use client"

import { TreePine, MapPin, FlaskConical, Database, BarChart3, Map } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EntitySummaryProps {
  entityCounts: Record<string, number>
}

export function EntitySummary({ entityCounts }: EntitySummaryProps) {
  const entityItems = [
    { key: "trees", icon: TreePine, label: "Trees", color: "text-green-600" },
    { key: "plots", icon: Map, label: "Plots", color: "text-blue-600" },
    { key: "regions", icon: MapPin, label: "Regions", color: "text-indigo-600" },
    { key: "observations", icon: FlaskConical, label: "Observations", color: "text-purple-600" },
    { key: "collections", icon: Database, label: "Collections", color: "text-violet-600" },
    { key: "results", icon: BarChart3, label: "Results", color: "text-pink-600" },
  ]

  return (
    <div>
      <h4 className="font-semibold mb-3">Entity Summary</h4>
      <div className="space-y-3 text-sm">
        {entityItems.map(({ key, icon: Icon, label, color }) => (
          <div key={key} className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span>{label}:</span>
            </div>
            <Badge variant="secondary">{entityCounts[key] || 0}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
