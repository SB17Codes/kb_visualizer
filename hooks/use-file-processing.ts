"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useProgressiveLoading } from "@/hooks/use-progressive-loading"

export function useFileProcessing() {
  const [currentFile, setCurrentFile] = useState<{ text: string; hash: string } | null>(null)
  const [isProcessed, setIsProcessed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, isUploading, uploadError } = useFileUpload()
  const progressiveLoading = useProgressiveLoading(1000) // Moved to top level

  // Generate file hash for caching
  const generateFileHash = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }, [])

  // Handle file upload - only parse once
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        console.log("=== FILE UPLOAD STARTED ===")
        const text = await uploadFile(file)
        const fileHash = await generateFileHash(file)

        // Check if this is the same file that's already processed
        if (currentFile?.hash === fileHash && isProcessed) {
          console.log("File already processed, skipping parsing")
          return
        }

        setCurrentFile({ text, hash: fileHash })
        setIsProcessed(false)

        console.log("Starting file processing...")
        progressiveLoading.reset()
        await progressiveLoading.loadData(text, fileHash, true)

        setIsProcessed(true)
        console.log("=== FILE PROCESSING COMPLETED ===")
      } catch (error) {
        setIsProcessed(false)
        console.error("=== FILE PROCESSING ERROR ===", error)
      }
    },
    [uploadFile, generateFileHash, currentFile, isProcessed, progressiveLoading],
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleLoadMore = useCallback(async () => {
    if (currentFile && isProcessed && progressiveLoading.loadMore) {
      console.log("Loading more data...")
      await progressiveLoading.loadMore(currentFile.text, currentFile.hash)
    }
  }, [currentFile, isProcessed, progressiveLoading])

  const handleLimitChange = useCallback(
    async (newLimit: number) => {
      if (currentFile && isProcessed && progressiveLoading.loadData && progressiveLoading.reset) {
        console.log("Applying new limit:", newLimit)
        progressiveLoading.reset()
        await progressiveLoading.loadData(currentFile.text, currentFile.hash, true)
      }
    },
    [currentFile, isProcessed, progressiveLoading],
  )

  return {
    fileInputRef,
    currentFile,
    progressiveLoading,
    isUploading,
    uploadError,
    isProcessed,
    handleFileChange,
    handleUploadClick,
    handleLoadMore,
    handleLimitChange,
  }
}
