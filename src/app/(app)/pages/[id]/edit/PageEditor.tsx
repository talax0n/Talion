'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Editor } from '@/components/editor/Editor'
import { SaveStatus } from '@/components/editor/SaveStatus'
import { AIToolbar } from '@/components/editor/AIToolbar'
import { PageCover } from '@/components/pages/PageCover'
import { PageIconPicker } from '@/components/pages/PageIconPicker'
import { TagInput } from '@/components/tags/TagInput'
import { VersionHistory } from '@/components/versions/VersionHistory'
import { ShareLinkDialog } from '@/components/access/ShareLinkDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Globe, Lock } from 'lucide-react'
import type { Tag } from '@/hooks/use-tags'

interface PageData {
  id: string
  title: string
  contentMd: string
  contentHtml: string
  icon: string | null
  coverUrl: string | null
  status: string
  visibility: string
  workspaceId: string
  tags: Array<{ tag: Tag }>
}

interface PageEditorProps {
  page: PageData
}

export function PageEditor({ page }: PageEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(page.title)
  const [icon, setIcon] = useState(page.icon)
  const [coverUrl, setCoverUrl] = useState(page.coverUrl)
  const [status, setStatus] = useState(page.status)
  const [visibility, setVisibility] = useState(page.visibility)
  const [contentMd, setContentMd] = useState(page.contentMd)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [selectedTags, setSelectedTags] = useState<Tag[]>(page.tags.map(pt => pt.tag))

  async function patchPage(data: Record<string, unknown>) {
    setSaveStatus('saving')
    try {
      await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  async function handleTitleBlur() {
    if (title !== page.title) {
      await patchPage({ title })
    }
  }

  async function handlePublish() {
    await patchPage({ status: 'published', visibility: 'public' })
    setStatus('published')
    setVisibility('public')
    router.refresh()
  }

  async function handleToggleVisibility() {
    const newVis = visibility === 'public' ? 'private' : 'public'
    await patchPage({ visibility: newVis })
    setVisibility(newVis)
  }

  const handleContentChange = useCallback(
    async (md: string) => {
      setContentMd(md)
      setSaveStatus('saving')
      try {
        await fetch(`/api/pages/${page.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentMd: md }),
        })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    },
    [page.id]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/pages" className="hover:underline">Pages</a>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <SaveStatus status={saveStatus} />
          <VersionHistory
            pageId={page.id}
            currentContent={contentMd}
            onRestore={(restored) => {
              setContentMd(restored)
            }}
          />
          <ShareLinkDialog pageId={page.id} />
          <Badge
            variant={visibility === 'public' ? 'default' : 'secondary'}
            className="cursor-pointer select-none"
            onClick={handleToggleVisibility}
          >
            {visibility === 'public' ? (
              <><Globe className="h-3 w-3 mr-1" />Public</>
            ) : (
              <><Lock className="h-3 w-3 mr-1" />Private</>
            )}
          </Badge>
          {status !== 'published' && (
            <Button size="sm" onClick={handlePublish}>Publish</Button>
          )}
        </div>
      </div>

      {/* Cover */}
      <PageCover
        coverUrl={coverUrl}
        editable
        onUpload={async (url) => {
          setCoverUrl(url)
          await patchPage({ coverUrl: url })
        }}
      />

      {/* AI Toolbar — shown above editor for discoverability */}
      <div className="px-8 pt-4 flex justify-end">
        <AIToolbar
          onSummarize={() => {}}
          onImprove={() => {}}
          onExpand={() => {}}
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-8 py-4">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-2">
            <PageIconPicker
              icon={icon}
              editable
              onChange={async (newIcon) => {
                setIcon(newIcon)
                await patchPage({ icon: newIcon })
              }}
            />
          </div>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-4xl font-bold border-none shadow-none focus-visible:ring-0 px-0 mb-4 h-auto"
            placeholder="Untitled"
          />

          {/* Tags */}
          <div className="mb-4">
            <TagInput
              pageId={page.id}
              workspaceId={page.workspaceId}
              selectedTags={selectedTags}
              onChange={() => {
                // Refresh tags from server is handled by useTags hook internally
                setSelectedTags(prev => [...prev])
              }}
            />
          </div>

          {/* Editor */}
          <Editor
            content={contentMd}
            onChange={handleContentChange}
          />
        </div>
      </div>
    </div>
  )
}
