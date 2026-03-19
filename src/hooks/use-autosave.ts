'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutosave(
  pageId: string,
  content: string,
  title: string,
  debounceMs = 1500
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef({ content: '', title: '' })

  const save = useCallback(async (contentMd: string, title: string) => {
    if (
      contentMd === lastSavedRef.current.content &&
      title === lastSavedRef.current.title
    ) return

    setStatus('saving')
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentMd, title }),
      })
      if (!res.ok) throw new Error('Save failed')

      // Create a version
      await fetch(`/api/pages/${pageId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentMd }),
      })

      lastSavedRef.current = { content: contentMd, title }
      setStatus('saved')

      // Reset to idle after 2s
      if (savedRef.current) clearTimeout(savedRef.current)
      savedRef.current = setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
    }
  }, [pageId])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(content, title), debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, title, save, debounceMs])

  return { status, saveNow: () => save(content, title) }
}
