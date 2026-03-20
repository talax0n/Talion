'use client'

import { useState, useEffect, useRef } from 'react'
import type { SearchResult } from '@/lib/search'

export function useSearch(workspaceId: string) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, workspaceId })
        const res = await fetch(`/api/search?${params.toString()}`)
        if (!res.ok) throw new Error('Search request failed')
        const data: SearchResult[] = await res.json()
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, workspaceId])

  return { query, setQuery, results, isLoading }
}
