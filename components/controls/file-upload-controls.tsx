"use client"

import { FileUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadControlsProps {
  onUploadClick: () => void
  isLoading: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function FileUploadControls({ onUploadClick, isLoading, hasMore, onLoadMore }: FileUploadControlsProps) {
  return (
    <>
      {hasMore && onLoadMore && (
        <Button onClick={onLoadMore} disabled={isLoading} variant="outline" size="sm">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load More"
          )}
        </Button>
      )}
      <Button onClick={onUploadClick} disabled={isLoading}>
        <FileUp className="mr-2 h-4 w-4" />
        {isLoading ? "Loading..." : "Upload TTL"}
      </Button>
    </>
  )
}
