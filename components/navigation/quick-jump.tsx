"use client"

import { useState } from "react"
import { Search, Zap, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import type { GraphData, GraphNode } from "@/lib/types"

interface QuickJumpProps {
  data: GraphData
  onJumpTo: (node: GraphNode) => void
}

export function QuickJump({ data, onJumpTo }: QuickJumpProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [entityFilter, setEntityFilter] = useState<string>("all")

  // Filter and search nodes
  const filteredNodes = data.nodes
    .filter((node) => {
      const matchesSearch =
        searchTerm === "" ||
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.taxonomicInfo &&
          Object.values(node.taxonomicInfo).some((v) => v.toLowerCase().includes(searchTerm.toLowerCase())))

      const matchesFilter = entityFilter === "all" || node.entityType === entityFilter

      return matchesSearch && matchesFilter
    })
    .slice(0, 20) // Limit results

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-4 h-4" />
          Quick Jump
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-24 h-8">
              <Filter className="w-3 h-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="tree">Trees</SelectItem>
              <SelectItem value="plot">Plots</SelectItem>
              <SelectItem value="region">Regions</SelectItem>
              <SelectItem value="observation">Observations</SelectItem>
              <SelectItem value="observationCollection">Collections</SelectItem>
              <SelectItem value="result">Results</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer"
              onClick={() => onJumpTo(node)}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{node.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  {node.entityType && (
                    <Badge variant="outline" className="text-xs">
                      {node.entityType}
                    </Badge>
                  )}
                  {node.taxonomicInfo?.["dwc:family"] && (
                    <Badge variant="secondary" className="text-xs">
                      {node.taxonomicInfo["dwc:family"]}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Zap className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {filteredNodes.length === 0 && searchTerm && (
            <div className="text-center text-muted-foreground py-4 text-sm">
              No entities found matching "{searchTerm}"
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
