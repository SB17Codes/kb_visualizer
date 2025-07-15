"use client"

import { useState, useEffect, useCallback } from "react"

export function useDebouncedSearch(delay = 300) {
  const [value, setValue] = useState("")
  const [debouncedValue, setDebouncedValue] = useState("")
  const [isDebouncing, setIsDebouncing] = useState(false)

  useEffect(() => {
    if (value === debouncedValue) {
      setIsDebouncing(false)
      return
    }

    setIsDebouncing(true)
    const handler = setTimeout(() => {
      setDebouncedValue(value)
      setIsDebouncing(false)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay, debouncedValue])

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue)
  }, [])

  const clearValue = useCallback(() => {
    setValue("")
    setDebouncedValue("")
    setIsDebouncing(false)
  }, [])

  return {
    value,
    debouncedValue,
    isDebouncing,
    updateValue,
    clearValue,
  }
}
