"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FilterType } from "@/lib/types"

interface FilterControlsProps {
  filterType: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function FilterControls({ filterType, onFilterChange }: FilterControlsProps) {
  return (
    <Select value={filterType} onValueChange={onFilterChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Entities</SelectItem>
        <SelectItem value="trees">Trees</SelectItem>
        <SelectItem value="plots">Plots</SelectItem>
        <SelectItem value="regions">Regions</SelectItem>
        <SelectItem value="observations">Observations</SelectItem>
        <SelectItem value="collections">Collections</SelectItem>
        <SelectItem value="results">Results</SelectItem>
      </SelectContent>
    </Select>
  )
}
