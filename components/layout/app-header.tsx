"use client"

import { SearchControls } from "@/components/controls/search-controls"
import { FilterControls } from "@/components/controls/filter-controls"
import { TripleLimitControls } from "@/components/controls/triple-limit-controls"
import { FileUploadControls } from "@/components/controls/file-upload-controls"
import type { FilterType } from "@/lib/types"
import { ViewToggle } from "./view-toggle"

interface AppHeaderProps {
  tripleLimit: number
  onLimitChange: (limit: number) => void
  onApplyLimit: () => void
  filterType: FilterType
  onFilterChange: (filter: FilterType) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearchClear: () => void
  onSearch: () => void
  isDebouncing: boolean
  hasData: boolean
  onUploadClick: () => void
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  currentView: "graph" | "map"
  onViewChange: (view: "graph" | "map") => void
  hasGeoData: boolean
}

export function AppHeader({
  tripleLimit,
  onLimitChange,
  onApplyLimit,
  filterType,
  onFilterChange,
  searchTerm,
  onSearchChange,
  onSearchClear,
  onSearch,
  isDebouncing,
  hasData,
  onUploadClick,
  isLoading,
  hasMore,
  onLoadMore,
  currentView,
  onViewChange,
  hasGeoData,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
      <h1 className="text-xl font-bold">OneForestKB Visualizer</h1>
      <div className="flex items-center gap-2">
        <TripleLimitControls
          tripleLimit={tripleLimit}
          onLimitChange={onLimitChange}
          onApply={onApplyLimit}
          disabled={!hasData || isLoading}
        />
        <FilterControls filterType={filterType} onFilterChange={onFilterChange} />
        <ViewToggle currentView={currentView} onViewChange={onViewChange} hasGeoData={hasGeoData} />
        <SearchControls
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onSearchClear={onSearchClear}
          onSearch={onSearch}
          isDebouncing={isDebouncing}
          disabled={!hasData}
        />
        <FileUploadControls
          onUploadClick={onUploadClick}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
        />
      </div>
    </header>
  )
}
