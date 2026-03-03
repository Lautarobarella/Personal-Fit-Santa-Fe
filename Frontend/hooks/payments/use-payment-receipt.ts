"use client"

import { useEffect, useState } from "react"

interface FileData {
  url: string
  type: string
  name: string
}

export function usePaymentReceipt(
  fileId: number | null | undefined,
  fileName?: string,
) {
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!fileId) {
      setIsLoading(false)
      return
    }

    const loadFile = async () => {
      try {
        setIsLoading(true)
        setError(false)

        const response = await fetch(`/payments/files/${fileId}`)

        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.status}`)
        }

        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)

        setFileData({
          url: objectUrl,
          type: blob.type,
          name: fileName || `comprobante-${fileId}`,
        })
      } catch (err) {
        console.error("Error loading payment receipt:", err)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadFile()

    return () => {
      if (fileData?.url && fileData.url.startsWith("blob:")) {
        URL.revokeObjectURL(fileData.url)
      }
    }
  }, [fileId, fileName])

  const handleDownload = () => {
    if (!fileData) return

    const link = document.createElement("a")
    link.href = fileData.url
    link.download = fileData.name
    link.click()
  }

  const handleViewFullSize = () => {
    if (!fileData) return
    window.open(fileData.url, "_blank")
  }

  const handleImageError = () => {
    setError(true)
  }

  return {
    fileData,
    isLoading,
    error,
    handleDownload,
    handleViewFullSize,
    handleImageError,
  }
}
