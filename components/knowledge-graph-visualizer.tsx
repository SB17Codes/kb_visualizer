"use client"

import { useEffect, useRef, useCallback } from "react"
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d"
import type { GraphData, SelectedElement } from "@/lib/types"
import { useGraphFocus } from "@/hooks/use-graph-focus"
import { getNodeColor, getNodeSize, getLinkColor, getLinkWidth } from "@/lib/visualization-utils"
import { FocusIndicator } from "./graph/focus-indicator"

interface KnowledgeGraphVisualizerProps {
  data: GraphData
  onElementSelect: (element: SelectedElement | null) => void
  selectedId: string | null
}

const KnowledgeGraphVisualizer = ({ data, onElementSelect, selectedId }: KnowledgeGraphVisualizerProps) => {
  const fgRef = useRef<ForceGraphMethods>()
  const containerRef = useRef<HTMLDivElement>(null)

  const { focusedNodeId, setFocusedNodeId, neighborNodes, getNodeOpacity, getLinkOpacity, shouldShowNodeLabel } =
    useGraphFocus(data)

  useEffect(() => {
    if (fgRef.current) {
      // Adjust forces for forest data visualization
      fgRef.current.d3Force("link")?.distance((link: any) => {
        // Shorter distances for containment relationships (tree-plot)
        if (link.relationshipType === "containment") return 80
        // Medium distances for spatial relationships
        if (link.relationshipType === "spatial") return 120
        // Longer distances for other relationships
        return 150
      })
      fgRef.current.d3Force("charge")?.strength(-300)
      fgRef.current.d3Force("center")?.strength(0.1)
    }
  }, [])

  const zoomToFit = useCallback(
    (nodeId: string, duration = 1000) => {
      if (!fgRef.current) return

      const node = data.nodes.find((n) => n.id === nodeId)
      if (!node || typeof node.x !== "number" || typeof node.y !== "number") return

      // Calculate appropriate zoom level based on node connections
      const connectedLinks = data.links.filter((link) => {
        const sourceId = typeof link.source === "object" ? link.source.id : link.source
        const targetId = typeof link.target === "object" ? link.target.id : link.target
        return sourceId === nodeId || targetId === nodeId
      })

      // More connections = more zoomed out
      const zoomLevel = Math.max(1.5, 3 - Math.min(connectedLinks.length / 10, 1.5))

      fgRef.current.centerAt(node.x, node.y, duration)
      fgRef.current.zoom(zoomLevel, duration)
    },
    [data.nodes, data.links],
  )

  useEffect(() => {
    if (selectedId) {
      const node = data.nodes.find((n) => n.id === selectedId)
      if (node) {
        zoomToFit(selectedId)
      }
    }
  }, [selectedId, data.nodes, zoomToFit])

  const handleNodeClick = (node: any) => {
    if (focusedNodeId === node.id) {
      setFocusedNodeId(null)
      onElementSelect({ type: "node", data: node })
    } else {
      setFocusedNodeId(node.id)
      onElementSelect({ type: "node", data: node })
    }
  }

  const handleBackgroundClick = () => {
    setFocusedNodeId(null)
    onElementSelect(null)
  }

  const handleLinkClick = (link: any) => {
    onElementSelect({ type: "link", data: link })
  }

  const focusedNode = focusedNodeId ? data.nodes.find((n) => n.id === focusedNodeId) : null

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={containerRef.current?.clientWidth}
        height={containerRef.current?.clientHeight}
        nodeLabel={(node) => {
          let label = `${node.name} (${node.entityType || node.type})`

          if (node.taxonomicInfo) {
            const family = node.taxonomicInfo["dwc:family"]
            const genus = node.taxonomicInfo["dwc:genus"]
            const species = node.taxonomicInfo["dwc:specificEpithet"]
            if (family && genus && species) {
              label += `\nTaxonomy: ${family} > ${genus} ${species}`
            } else if (family) {
              label += `\nFamily: ${family}`
            }
          }

          if (node.plotInfo) {
            const region = node.plotInfo.region
            const plotNumber = node.plotInfo.plotNumber
            if (region && plotNumber) {
              label += `\nPlot: ${region} #${plotNumber}`
            }
          }

          if (node.observationInfo?.numericValue) {
            label += `\nValue: ${node.observationInfo.numericValue}`
            if (node.observationInfo.unit) {
              label += ` ${node.observationInfo.unit}`
            }
          }

          if (node.coordinates) {
            label += `\nCoordinates: ${node.coordinates}`
          }

          return label
        }}
        nodeVal={(node) => {
          const baseSize = getNodeSize(node, selectedId, focusedNodeId)
          // Make selected/focused nodes even larger
          if (node.id === selectedId) return baseSize * 1.8
          if (node.id === focusedNodeId) return baseSize * 1.5
          return baseSize
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name || ""
          const fontSize = Math.max(8, 10 / globalScale)
          const nodeSize = getNodeSize(node, selectedId, focusedNodeId) / globalScale
          const opacity = getNodeOpacity(node.id)
          const isSelected = node.id === selectedId
          const isFocused = node.id === focusedNodeId

          ctx.font = `${fontSize}px Sans-Serif`

          // Node circle with enhanced highlighting for selected nodes
          ctx.beginPath()
          ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false)
          ctx.fillStyle = getNodeColor(node, selectedId, focusedNodeId, opacity)
          ctx.fill()

          // Enhanced node border for selected or focused
          if (isSelected || isFocused) {
            ctx.strokeStyle = isSelected ? `rgba(255, 165, 0, ${opacity})` : `rgba(255, 215, 0, ${opacity})`
            ctx.lineWidth = 3 / globalScale
            ctx.stroke()

            // Add a glow effect for selected nodes
            if (isSelected) {
              ctx.shadowColor = "rgba(255, 165, 0, 0.6)"
              ctx.shadowBlur = 10
              ctx.stroke()
              ctx.shadowBlur = 0
            }
          }

          // Always show labels for selected/focused nodes or when zoomed in
          if (isSelected || isFocused || shouldShowNodeLabel(node.id) || globalScale > 2) {
            // Determine what to display in the label
            let displayLabel = label
            if (node.entityType === "tree" && node.taxonomicInfo) {
              const family = node.taxonomicInfo["dwc:family"] || ""
              const genus = node.taxonomicInfo["dwc:genus"] || ""
              const species = node.taxonomicInfo["dwc:specificEpithet"] || ""

              if (genus && species) {
                displayLabel = `${genus} ${species}`
              } else if (family) {
                displayLabel = family
              }
            }

            // Background for label
            const textWidth = ctx.measureText(displayLabel).width
            const padding = 4

            // Enhanced background for selected nodes
            ctx.fillStyle = isSelected
              ? `rgba(255, 236, 179, ${opacity * 0.9})`
              : `rgba(255, 255, 255, ${opacity * 0.8})`

            ctx.fillRect(
              node.x! - textWidth / 2 - padding,
              node.y! + nodeSize + 2,
              textWidth + padding * 2,
              fontSize + padding * 2,
            )

            // Add border to label background for selected nodes
            if (isSelected) {
              ctx.strokeStyle = `rgba(255, 165, 0, ${opacity})`
              ctx.lineWidth = 1
              ctx.strokeRect(
                node.x! - textWidth / 2 - padding,
                node.y! + nodeSize + 2,
                textWidth + padding * 2,
                fontSize + padding * 2,
              )
            }

            // Text with enhanced visibility for selected nodes
            ctx.fillStyle = isSelected ? `rgba(0, 0, 0, ${opacity})` : `rgba(0, 0, 0, ${opacity * 0.9})`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(displayLabel, node.x!, node.y! + nodeSize + fontSize / 2 + 4)

            // Add entity type label for selected nodes
            if (isSelected && node.entityType) {
              const typeLabel = node.entityType.charAt(0).toUpperCase() + node.entityType.slice(1)
              const typeWidth = ctx.measureText(typeLabel).width

              ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`
              ctx.fillRect(
                node.x! - typeWidth / 2 - padding,
                node.y! - nodeSize - fontSize - padding,
                typeWidth + padding * 2,
                fontSize + padding,
              )

              ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.9})`
              ctx.fillText(typeLabel, node.x!, node.y! - nodeSize - fontSize / 2 - 2)
            }
          }
        }}
        linkLabel={(link) => {
          const baseLabel = `${link.name} (${link.relationshipType || "relationship"})`
          if (link.relationshipType === "containment") {
            return `${baseLabel}\nTree contained in plot`
          }
          return baseLabel
        }}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkCurvature={(link) => {
          // Curve containment links more to show hierarchy
          return link.relationshipType === "containment" ? 0.3 : 0.15
        }}
        linkColor={(link) => getLinkColor(link, getLinkOpacity(link))}
        linkWidth={(link) => getLinkWidth(link, getLinkOpacity(link))}
        onNodeClick={handleNodeClick}
        onLinkClick={handleLinkClick}
        onBackgroundClick={handleBackgroundClick}
        cooldownTicks={100}
        enableNodeDrag={true}
        nodeRelSize={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={2}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        minZoom={0.1}
        maxZoom={8}
        nodeCanvasObjectMode={() => "after"} // Render custom objects after default
        linkDirectionalParticles={(link) => {
          const sourceId = typeof link.source === "object" ? link.source.id : link.source
          const targetId = typeof link.target === "object" ? link.target.id : link.target

          // Show particles on links connected to selected/focused nodes
          if (selectedId && (sourceId === selectedId || targetId === selectedId)) return 4
          if (focusedNodeId && (sourceId === focusedNodeId || targetId === focusedNodeId)) return 2
          return 0
        }}
        linkDirectionalParticleSpeed={0.008}
        linkDirectionalParticleWidth={(link) => {
          const sourceId = typeof link.source === "object" ? link.source.id : link.source
          const targetId = typeof link.target === "object" ? link.target.id : link.target

          // Larger particles for selected/focused connections
          if (selectedId && (sourceId === selectedId || targetId === selectedId)) return 3
          if (focusedNodeId && (sourceId === focusedNodeId || targetId === focusedNodeId)) return 2
          return 1
        }}
        onNodeHover={(node) => {
          // Optional: Add hover effects
          if (node) {
            document.body.style.cursor = "pointer"
          } else {
            document.body.style.cursor = "default"
          }
        }}
      />

      {/* Add a highlight effect for the selected node's connections */}
      {useEffect(() => {
        // When a node is selected, highlight its connections
        if (selectedId && fgRef.current) {
          // Briefly pause the simulation
          fgRef.current.pauseAnimation()

          // Find the selected node's connections
          const selectedLinks = data.links.filter((link) => {
            const sourceId = typeof link.source === "object" ? link.source.id : link.source
            const targetId = typeof link.target === "object" ? link.target.id : link.target
            return sourceId === selectedId || targetId === selectedId
          })

          // Highlight the connected nodes with particle effects
          selectedLinks.forEach((link) => {
            fgRef.current?.emitParticle(link)
          })

          // Resume the simulation after a short delay
          setTimeout(() => {
            fgRef.current?.resumeAnimation()
          }, 100)
        }
      }, [selectedId, data.links])}

      <FocusIndicator focusedNode={focusedNode} neighborCount={neighborNodes.size - 1} />
    </div>
  )
}

export default KnowledgeGraphVisualizer
