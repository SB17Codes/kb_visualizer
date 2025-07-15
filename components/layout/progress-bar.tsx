"use client"

import { Progress } from "@/components/ui/progress"

interface ProgressBarProps {
  isLoading: boolean
  progress: number
}

export function ProgressBar({ isLoading, progress }: ProgressBarProps) {
  if (!isLoading || progress <= 0) return null

  return (
    <div className="px-4 py-2 bg-background border-b">
      <div className="flex items-center gap-2 text-sm">
        <span>Processing:</span>
        <Progress value={progress} className="flex-1" />
        <span>{progress}%</span>
      </div>
    </div>
  )
}
