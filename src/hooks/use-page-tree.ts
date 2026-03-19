'use client'
import { useState, useEffect, useCallback } from 'react'
import type { PageTreeNode } from '@/types/page'

export function usePageTree(workspaceId: string) {
  const [pages, setPages] = useState<PageTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPages = useCallback(async () => {
    if (!workspaceId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/pages?workspaceId=${workspaceId}`)
      if (!res.ok) throw new Error('Failed to fetch pages')
      const data = await res.json()
      setPages(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { fetchPages() }, [fetchPages])

  const createPage = useCallback(async (parentId?: string | null, title?: string) => {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, parentId, title }),
    })
    if (!res.ok) throw new Error('Failed to create page')
    await fetchPages()
    return res.json()
  }, [workspaceId, fetchPages])

  const deletePage = useCallback(async (id: string) => {
    await fetch(`/api/pages/${id}`, { method: 'DELETE' })
    await fetchPages()
  }, [fetchPages])

  return { pages, loading, error, createPage, deletePage, refetch: fetchPages }
}
