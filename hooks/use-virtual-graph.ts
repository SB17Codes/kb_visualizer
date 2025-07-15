"use client"

import { useState, useMemo } from "react"
import { VirtualRenderer } from "@/lib/virtual-renderer"
import type { GraphData } from "@/lib/types"

export function useVirtualGraph(data: GraphData | null) {
  const [virtualRenderer] = useState(() => new VirtualRenderer())
  const [viewportBounds, setViewportBounds] = useState({
    minX: -1000,
    maxX: 1000,
    minY: -1000,
    maxY: 1000,
  })

  const virtualData = useMemo(() => {
    if (!data) return null

    virtualRenderer.updateViewport(viewportBounds)
    return virtualRenderer.getVisibleData(data)
  }, [data, viewportBounds, virtualRenderer])

  const updateViewport = (bounds: { minX: number; maxX: number; minY: number; maxY: number }) => {
    setViewportBounds(bounds)
  }

  return {
    virtualData,
    updateViewport,
  }
}
