"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { GraphLegend } from "@/components/graph/graph-legend"
import { GraphStats } from "@/components/graph/graph-stats"
import type { GraphData, SelectedElement } from "@/lib/types"

const KnowledgeGraphVisualizer = dynamic(() => import("@/components/knowledge-graph-visualizer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4">Loading visualizer...</p>
      </div>
    </div>
  ),
})

interface MainVisualizationProps {
  data: GraphData
  entityCounts: Record<string, number>
  tripleLimit: number
  onElementSelect: (element: SelectedElement | null) => void
  selectedId: string | null
}

export function MainVisualization({
  data,
  entityCounts,
  tripleLimit,
  onElementSelect,
  selectedId,
}: MainVisualizationProps) {
  return (
    <>
      <GraphStats
        data={data}
        filteredNodeCount={data.nodes.length}
        filteredLinkCount={data.links.length}
        tripleLimit={tripleLimit}
      />
      <GraphLegend entityCounts={entityCounts} />
      <div className="w-full h-full">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-4">Loading visualizer...</p>
              </div>
            </div>
          }
        >
          <KnowledgeGraphVisualizer data={data} onElementSelect={onElementSelect} selectedId={selectedId} />
        </Suspense>
      </div>
    </>
  )
}
