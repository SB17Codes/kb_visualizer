"use client"

import { useState, useEffect, useCallback } from "react"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { applyFilters } from "@/lib/graph-utils"
import type { GraphData, FilterType } from "@/lib/types"

export function useDataFiltering(data: GraphData | null) {
  const [filteredData, setFilteredData] = useState<GraphData | null>(null)
  const [filterType, setFilterType] = useState<FilterType>("all")

  const {
    value: searchTerm,
    debouncedValue: debouncedSearchTerm,
    updateValue: setSearchTerm,
    clearValue: clearSearchTerm,
    isDebouncing,
  } = useDebouncedSearch()

  // Apply filters when data or search changes
  useEffect(() => {
    if (data) {
      const filtered = applyFilters(data, filterType, debouncedSearchTerm)
      setFilteredData(filtered)
    }
  }, [data, filterType, debouncedSearchTerm])

  const handleSearch = useCallback(() => {
    if (!data) return
    const filtered = applyFilters(data, filterType, searchTerm)
    setFilteredData(filtered)
  }, [searchTerm, filterType, data])

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilterType(newFilter)
  }, [])

  const handleSearchClear = useCallback(() => {
    setSearchTerm("")
    clearSearchTerm()
  }, [setSearchTerm, clearSearchTerm])

  return {
    filteredData,
    filterType,
    searchTerm,
    isDebouncing,
    handleSearch,
    handleFilterChange,
    handleSearchClear,
    setSearchTerm,
  }
}
