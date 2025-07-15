"use client"

import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchControlsProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearchClear: () => void
  onSearch: () => void
  isDebouncing: boolean
  disabled: boolean
}

export function SearchControls({
  searchTerm,
  onSearchChange,
  onSearchClear,
  onSearch,
  isDebouncing,
  disabled,
}: SearchControlsProps) {
  return (
    <>
      <div className="relative">
        <Input
          type="search"
          placeholder="Search entities..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="w-64 pl-8"
          disabled={disabled}
        />
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={onSearchClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isDebouncing && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <Button onClick={onSearch} disabled={disabled}>
        Search
      </Button>
    </>
  )
}
