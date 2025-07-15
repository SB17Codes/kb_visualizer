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
  const [lastProcessedHash, setLastProcessedHash] = useState<string | null>(null)

  const loadData = useCallback(
    async (ttlString: string, fileHash: string, reset = false) => {
      // Skip if we're already processing the same file
      if (isLoading) {
        console.log("Already loading, skipping...")
        return
      }

      // Skip if this exact file+limit combination was already processed
      if (!reset && lastProcessedHash === `${fileHash}-${currentLimit}` && data) {
        console.log("Data already loaded for this file and limit, skipping...")
        return
      }

      console.log("Loading data:", { fileHash: fileHash.substring(0, 8), currentLimit, reset })
      setIsLoading(true)
      setProgress(0)

      try {
        const result = await parser.parseWithCache(ttlString, fileHash, currentLimit)

        if (reset || !data) {
          console.log("Setting new data:", result.nodes.length, "nodes")
          setData(result)
        } else {
          // Merge with existing data
          setData((prevData) => {
            if (!prevData) return result

            const existingNodeIds = new Set(prevData.nodes.map((n) => n.id))
            const existingLinkIds = new Set(prevData.links.map((l) => `${l.source}-${l.target}-${l.name}`))

            const newNodes = result.nodes.filter((n) => !existingNodeIds.has(n.id))
            const newLinks = result.links.filter((l) => !existingLinkIds.has(`${l.source}-${l.target}-${l.name}`))

            console.log("Merging data:", newNodes.length, "new nodes")
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
        setLastProcessedHash(`${fileHash}-${currentLimit}`)

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
    [parser, currentLimit, data, isLoading, lastProcessedHash],
  )

  const loadMore = useCallback(
    async (ttlString: string, fileHash: string) => {
      const newLimit = currentLimit + initialLimit
      setCurrentLimit(newLimit)
      setLastProcessedHash(null) // Reset to allow new processing
      await loadData(ttlString, fileHash, false)
    },
    [currentLimit, initialLimit, loadData],
  )

  const reset = useCallback(() => {
    console.log("Resetting progressive loading state")
    setData(null)
    setProgress(0)
    setHasMore(false)
    setTotalTriples(0)
    setCurrentLimit(initialLimit)
    setLastProcessedHash(null)
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
