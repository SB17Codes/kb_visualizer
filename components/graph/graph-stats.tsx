import type { GraphData } from "@/lib/types"

interface GraphStatsProps {
  data: GraphData | null
  filteredNodeCount: number
  filteredLinkCount: number
  tripleLimit: number
}

export function GraphStats({ data, filteredNodeCount, filteredLinkCount, tripleLimit }: GraphStatsProps) {
  return (
    <div className="absolute top-2 left-2 z-10 bg-background/90 backdrop-blur-sm p-2 rounded-md text-xs border shadow-sm">
      <p>
        Showing: {filteredNodeCount} nodes, {filteredLinkCount} links
      </p>
      {data && data.totalTriples && data.totalTriples > tripleLimit && (
        <p className="text-amber-600">
          Limited to {tripleLimit} of {data.totalTriples} total triples
        </p>
      )}
    </div>
  )
}
