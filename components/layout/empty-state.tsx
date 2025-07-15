"use client"

import { TreePine } from "lucide-react"

interface EmptyStateProps {
  tripleLimit: number
  uploadError: string | null
}

export function EmptyState({ tripleLimit, uploadError }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
      <TreePine className="w-16 h-16 mb-4" />
      <h2 className="text-2xl font-semibold">Upload a Forest Knowledge Graph</h2>
      <p>Upload a Turtle (.ttl) file to visualize forest data with trees, plots, and taxonomic information.</p>
      <p className="mt-2 text-sm">Current limit: {tripleLimit} triples</p>
      {uploadError && <p className="mt-4 text-red-500">{uploadError}</p>}
    </div>
  )
}
