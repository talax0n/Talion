'use client'
import { useState, useEffect, useCallback } from 'react'

export interface Tag {
  id: string
  name: string
  color: string
  workspaceId: string
}

export function useTags(workspaceId: string) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTags = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const res = await fetch(`/api/tags?workspaceId=${workspaceId}`)
    if (res.ok) setTags(await res.json())
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetchTags() }, [fetchTags])

  const createTag = useCallback(async (name: string, color?: string) => {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, name, color }),
    })
    if (res.ok) {
      const tag = await res.json()
      setTags(prev => [...prev, tag])
      return tag
    }
  }, [workspaceId])

  const addToPage = useCallback(async (pageId: string, tagId: string) => {
    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addToPage', pageId, tagId }),
    })
  }, [])

  const removeFromPage = useCallback(async (pageId: string, tagId: string) => {
    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'removeFromPage', pageId, tagId }),
    })
  }, [])

  return { tags, loading, createTag, addToPage, removeFromPage, refetch: fetchTags }
}
