"use client"

import { useState, useCallback } from "react"

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    setIsUploading(true)
    setUploadError(null)

    try {
      if (!file.name.endsWith(".ttl")) {
        throw new Error("Please upload a valid Turtle (.ttl) file.")
      }

      const text = await file.text()
      return text
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file"
      setUploadError(errorMessage)
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [])

  return {
    uploadFile,
    isUploading,
    uploadError,
  }
}
