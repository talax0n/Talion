'use client'
import { useState, useEffect, useCallback } from 'react'

export interface AccessGroup {
  id: string
  workspaceId: string
  name: string
  _count: { members: number }
}

export interface AccessGroupMember {
  groupId: string
  userId: string
  role: string
}

export interface PageAccessEntry {
  id: string
  pageId: string
  subjectType: string
  subjectId: string | null
  role: string
  expiresAt: string | null
  group: { id: string; name: string } | null
}

export function useAccessGroups(workspaceId: string) {
  const [groups, setGroups] = useState<AccessGroup[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const res = await fetch(`/api/access-groups?workspaceId=${workspaceId}`)
    if (res.ok) setGroups(await res.json())
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const createGroup = useCallback(
    async (name: string) => {
      const res = await fetch('/api/access-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, name }),
      })
      if (res.ok) await refetch()
      return res.json()
    },
    [workspaceId, refetch]
  )

  const deleteGroup = useCallback(
    async (id: string) => {
      await fetch(`/api/access-groups/${id}`, { method: 'DELETE' })
      await refetch()
    },
    [refetch]
  )

  const addMember = useCallback(async (groupId: string, userId: string, role = 'viewer') => {
    const res = await fetch(`/api/access-groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    return res.json()
  }, [])

  const removeMember = useCallback(async (groupId: string, userId: string) => {
    await fetch(`/api/access-groups/${groupId}/members/${userId}`, { method: 'DELETE' })
  }, [])

  return { groups, loading, createGroup, deleteGroup, addMember, removeMember, refetch }
}

export function usePageAccess(pageId: string) {
  const [entries, setEntries] = useState<PageAccessEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!pageId) return
    setLoading(true)
    const res = await fetch(`/api/pages/${pageId}/access`)
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }, [pageId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const setAccess = useCallback(
    async (subjectType: string, subjectId: string | null, role: string) => {
      const res = await fetch(`/api/pages/${pageId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectType, subjectId, role }),
      })
      if (res.ok) await refetch()
      return res.json()
    },
    [pageId, refetch]
  )

  return { entries, loading, setAccess, refetch }
}
