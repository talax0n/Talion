'use client'
import { useState, useCallback } from 'react'

interface UploadResult {
  url: string
  path: string
  type: string
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true)
    setProgress(0)
    setError(null)
    setUrl(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress since fetch doesn't support upload progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90))
      }, 100)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Upload failed')
      }

      const result: UploadResult = await res.json()
      setUrl(result.url)
      return result
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Upload failed'
      setError(message)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(0)
    setError(null)
    setUrl(null)
  }, [])

  return { isUploading, progress, error, url, upload, reset }
}
