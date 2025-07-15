"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TripleLimitControlsProps {
  tripleLimit: number
  onLimitChange: (limit: number) => void
  onApply: () => void
  disabled: boolean
}

export function TripleLimitControls({ tripleLimit, onLimitChange, onApply, disabled }: TripleLimitControlsProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="triple-limit" className="whitespace-nowrap">
        Triple Limit:
      </label>
      <Input
        id="triple-limit"
        type="number"
        min="10"
        max="10000"
        step="10"
        value={tripleLimit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="w-20"
      />
      <Button variant="outline" size="sm" onClick={onApply} disabled={disabled}>
        Apply
      </Button>
    </div>
  )
}
