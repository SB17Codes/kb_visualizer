"use client"

import {
  TreePine,
  MapPin,
  FlaskConical,
  Database,
  BarChart3,
  ExternalLink,
  Calendar,
  User,
  Shield,
  Network,
  Map,
  Leaf,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getConnectedNodes, formatDateTime } from "@/lib/graph-utils"
import type { GraphData, GraphNode } from "@/lib/types"

interface NodeDetailPanelProps {
  node: GraphNode
  data: GraphData
  onNavigate: (node: GraphNode, relationship: string, direction: "incoming" | "outgoing") => void
}

export function NodeDetailPanel({ node, data, onNavigate }: NodeDetailPanelProps) {
  const connections = getConnectedNodes(node.id, data)

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "tree":
        return <TreePine className="w-4 h-4" />
      case "plot":
        return <Map className="w-4 h-4" />
      case "region":
        return <MapPin className="w-4 h-4" />
      case "observation":
        return <FlaskConical className="w-4 h-4" />
      case "observationCollection":
        return <Database className="w-4 h-4" />
      case "result":
        return <BarChart3 className="w-4 h-4" />
      default:
        return null
    }
  }

  const getEntityTitle = (entityType: string) => {
    switch (entityType) {
      case "tree":
        return "Tree"
      case "plot":
        return "Forest Plot"
      case "region":
        return "Region"
      case "observation":
        return "Observation"
      case "observationCollection":
        return "Collection"
      case "result":
        return "Result"
      default:
        return "Node"
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getEntityIcon(node.entityType)}
            {getEntityTitle(node.entityType)}
          </CardTitle>
          <CardDescription className="break-words text-sm font-medium">{node.name}</CardDescription>
          {node.entityType && (
            <Badge variant="outline" className="w-fit capitalize">
              {node.entityType}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4 text-sm">
          {/* Connected Nodes Section */}
          {connections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-600" />
                <h4 className="font-semibold">Connected Entities ({connections.length})</h4>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {connections.map((connection, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs p-2 bg-background rounded border cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      const targetNode = data.nodes.find((n) => n.id === connection.node.id)
                      if (targetNode) {
                        onNavigate(targetNode, connection.relationship, connection.direction)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getEntityIcon(connection.node.entityType)}
                      <span className="font-medium truncate">{connection.node.name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {connection.relationship}
                      </Badge>
                      <span
                        className={`text-xs ${connection.direction === "outgoing" ? "text-blue-600" : "text-green-600"}`}
                      >
                        {connection.direction === "outgoing" ? "→" : "←"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Taxonomic Information */}
          {node.taxonomicInfo && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold">Taxonomic Classification</h4>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {Object.entries(node.taxonomicInfo).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize font-medium">{key.replace("dwc:", "")}:</span>
                    <span className="font-semibold text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spatial Information */}
          {node.geometryType && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold">Spatial Information</h4>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Geometry Type:</span>
                  <Badge variant="secondary">{node.geometryType}</Badge>
                </div>
                {node.coordinates && (
                  <div>
                    <span className="text-muted-foreground font-medium">Coordinates:</span>
                    <p className="font-mono text-xs mt-1 p-2 bg-background rounded border break-all">
                      {node.coordinates}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plot Information */}
          {node.plotInfo && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold">Plot Information</h4>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {Object.entries(node.plotInfo).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize font-medium">{key}:</span>
                    <Badge variant="outline">{value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observation Data */}
          {node.observationInfo && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold">Observation Data</h4>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                {Object.entries(node.observationInfo).map(([key, value]) => (
                  <div key={key}>
                    {key === "resultTime" ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Result Time:</span>
                        <span className="font-semibold">{formatDateTime(String(value))}</span>
                      </div>
                    ) : key === "numericValue" ? (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Numeric Value:</span>
                        <Badge variant="default" className="font-mono">
                          {value}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground capitalize font-medium">
                          {key.replace(/([A-Z])/g, " $1")}:
                        </span>
                        <span className="font-semibold text-right">{String(value)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collection Information */}
          {node.collectionInfo && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-600" />
                <h4 className="font-semibold">Collection Information</h4>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                {Object.entries(node.collectionInfo).map(([key, value]) => (
                  <div key={key}>
                    {key === "creator" ? (
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Creator:</span>
                        <span className="font-semibold">{String(value)}</span>
                      </div>
                    ) : key === "license" ? (
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">License:</span>
                        <Badge variant="outline">{String(value)}</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground capitalize font-medium">
                          {key.replace(/([A-Z])/g, " $1")}:
                        </span>
                        <span className="font-semibold text-right">{String(value)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Technical Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gray-600" />
              <h4 className="font-semibold">Technical Details</h4>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div>
                <span className="text-muted-foreground font-medium">URI:</span>
                <p className="font-mono text-xs mt-1 p-2 bg-background rounded border break-all select-all">
                  {node.id}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">RDF Type:</span>
                <Badge variant="outline">{node.type}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
