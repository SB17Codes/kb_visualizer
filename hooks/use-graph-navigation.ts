"use client"

import { useState, useCallback, useMemo } from "react"
import type { GraphData, GraphNode, GraphLink } from "@/lib/types"

export interface NavigationPath {
  node: GraphNode
  relationship?: string
  direction?: "incoming" | "outgoing"
}

export function useGraphNavigation(data: GraphData | null) {
  const [navigationHistory, setNavigationHistory] = useState<NavigationPath[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  // Get all relationships for a node
  const getNodeRelationships = useCallback(
    (nodeId: string) => {
      if (!data) return { incoming: [], outgoing: [] }

      const incoming: Array<{ link: GraphLink; node: GraphNode }> = []
      const outgoing: Array<{ link: GraphLink; node: GraphNode }> = []

      data.links.forEach((link) => {
        const sourceId = typeof link.source === "object" ? link.source.id : link.source
        const targetId = typeof link.target === "object" ? link.target.id : link.target

        if (targetId === nodeId) {
          const sourceNode = data.nodes.find((n) => n.id === sourceId)
          if (sourceNode) {
            incoming.push({ link, node: sourceNode })
          }
        }

        if (sourceId === nodeId) {
          const targetNode = data.nodes.find((n) => n.id === targetId)
          if (targetNode) {
            outgoing.push({ link, node: targetNode })
          }
        }
      })

      return { incoming, outgoing }
    },
    [data],
  )

  // Navigate to a node
  const navigateTo = useCallback(
    (node: GraphNode, relationship?: string, direction?: "incoming" | "outgoing") => {
      const newPath: NavigationPath = { node, relationship, direction }

      // Remove any history after current index (when navigating from middle of history)
      const newHistory = [...navigationHistory.slice(0, currentIndex + 1), newPath]

      setNavigationHistory(newHistory)
      setCurrentIndex(newHistory.length - 1)
    },
    [navigationHistory, currentIndex],
  )

  // Navigate back
  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  // Navigate forward
  const goForward = useCallback(() => {
    if (currentIndex < navigationHistory.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, navigationHistory.length])

  // Clear navigation history
  const clearHistory = useCallback(() => {
    setNavigationHistory([])
    setCurrentIndex(-1)
  }, [])

  // Get current node
  const currentNode = useMemo(() => {
    return currentIndex >= 0 ? navigationHistory[currentIndex]?.node : null
  }, [navigationHistory, currentIndex])

  // Navigation state
  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < navigationHistory.length - 1

  // Get path breadcrumbs
  const breadcrumbs = useMemo(() => {
    return navigationHistory.slice(0, currentIndex + 1)
  }, [navigationHistory, currentIndex])

  return {
    navigationHistory,
    currentNode,
    currentIndex,
    canGoBack,
    canGoForward,
    breadcrumbs,
    getNodeRelationships,
    navigateTo,
    goBack,
    goForward,
    clearHistory,
  }
}
