'use client'
import { useState, useEffect, useCallback } from 'react'

interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: string
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/workspaces')
    if (res.ok) setWorkspaces(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  const create = useCallback(
    async (data: { name: string; description?: string; visibility?: string }) => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) await fetch_()
      return res.json()
    },
    [fetch_]
  )

  const update = useCallback(
    async (id: string, data: Partial<Workspace>) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) await fetch_()
    },
    [fetch_]
  )

  const remove = useCallback(
    async (id: string) => {
      await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
      await fetch_()
    },
    [fetch_]
  )

  return { workspaces, loading, create, update, remove, refetch: fetch_ }
}
