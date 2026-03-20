'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageTree } from '@/components/pages/PageTree'
import { NewPageButton } from '@/components/pages/NewPageButton'
import { TagFilter } from '@/components/tags/TagFilter'
import type { Tag } from '@/hooks/use-tags'

interface PagesSidebarProps {
  workspaceId: string
}

export function PagesSidebar({ workspaceId }: PagesSidebarProps) {
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [mode, setMode] = useState<'AND' | 'OR'>('OR')

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/tags`)
      .then(r => r.json())
      .then(data => setTags(Array.isArray(data) ? data : []))
      .catch(() => setTags([]))
  }, [workspaceId])

  function handleTagToggle(tagId: string) {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <div className="w-64 flex-shrink-0 border-r flex flex-col h-full">
      <div className="p-3 border-b">
        <NewPageButton
          workspaceId={workspaceId}
          onCreated={(pageId) => router.push(`/pages/${pageId}/edit`)}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <PageTree workspaceId={workspaceId} onSelect={(id) => router.push(`/pages/${id}`)} />
      </div>
      {tags.length > 0 && (
        <div className="p-3 border-t">
          <TagFilter
            tags={tags}
            selectedTagIds={selectedTagIds}
            mode={mode}
            onTagToggle={handleTagToggle}
            onModeChange={setMode}
          />
        </div>
      )}
    </div>
  )
}
