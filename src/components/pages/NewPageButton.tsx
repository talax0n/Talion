'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'

interface NewPageButtonProps {
  workspaceId: string
  parentId?: string | null
  onCreated?: (pageId: string) => void
}

export function NewPageButton({ workspaceId, parentId, onCreated }: NewPageButtonProps) {
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, parentId }),
      })
      if (res.ok) {
        const page = await res.json()
        onCreated?.(page.id)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCreate}
      disabled={creating}
      className="gap-1"
    >
      {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      New Page
    </Button>
  )
}
