"use client"

import { useState, useCallback } from "react"
import { EnhancedTTLParser } from "@/lib/ttl-parser-enhanced"
import type { GraphData } from "@/lib/types"

export function useProgressiveLoading(initialLimit = 1000) {
  const [data, setData] = useState<GraphData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalTriples, setTotalTriples] = useState(0)
  const [currentLimit, setCurrentLimit] = useState(initialLimit)
  const [parser] = useState(() => new EnhancedTTLParser())

  const loadData = useCallback(
    async (ttlString: string, fileHash: string, reset = false) => {
      setIsLoading(true)
      setProgress(0)

      try {
        const result = await parser.parseWithCache(ttlString, fileHash, currentLimit)

        if (reset || !data) {
          setData(result)
        } else {
          // Merge with existing data
          setData((prevData) => {
            if (!prevData) return result

            const existingNodeIds = new Set(prevData.nodes.map((n) => n.id))
            const existingLinkIds = new Set(prevData.links.map((l) => `${l.source}-${l.target}-${l.name}`))

            const newNodes = result.nodes.filter((n) => !existingNodeIds.has(n.id))
            const newLinks = result.links.filter((l) => !existingLinkIds.has(`${l.source}-${l.target}-${l.name}`))

            return {
              nodes: [...prevData.nodes, ...newNodes],
              links: [...prevData.links, ...newLinks],
              totalTriples: result.totalTriples,
            }
          })
        }

        setTotalTriples(result.totalTriples || 0)
        setHasMore((result.totalTriples || 0) > currentLimit)
        setProgress(100)

        // Clear progress after a short delay
        setTimeout(() => setProgress(0), 1000)
      } catch (error) {
        console.error("Error loading data:", error)
        setProgress(0)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [parser, currentLimit, data],
  )

  const loadMore = useCallback(
    async (ttlString: string, fileHash: string) => {
      const newLimit = currentLimit + initialLimit
      setCurrentLimit(newLimit)
      await loadData(ttlString, fileHash, false)
    },
    [currentLimit, initialLimit, loadData],
  )

  const reset = useCallback(() => {
    setData(null)
    setProgress(0)
    setHasMore(false)
    setTotalTriples(0)
    setCurrentLimit(initialLimit)
  }, [initialLimit])

  return {
    data,
    isLoading,
    progress,
    hasMore,
    totalTriples,
    loadData,
    loadMore,
    reset,
  }
}
