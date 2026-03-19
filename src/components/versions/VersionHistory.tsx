'use client'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { History, RotateCcw } from 'lucide-react'
import { VersionDiff } from '@/components/versions/VersionDiff'

interface Version {
  id: string
  contentMd: string
  createdAt: string
  author: { fullName: string | null; email: string }
}

interface VersionHistoryProps {
  pageId: string
  currentContent: string
  onRestore?: (contentMd: string) => void
}

export function VersionHistory({ pageId, currentContent, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [selected, setSelected] = useState<Version | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/pages/${pageId}/versions`)
      .then(r => r.json())
      .then(setVersions)
      .finally(() => setLoading(false))
  }, [open, pageId])

  const handleRestore = async (version: Version) => {
    await fetch(`/api/pages/${pageId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true, versionId: version.id }),
    })
    onRestore?.(version.contentMd)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <History size={14} />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:max-w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 gap-4 mt-4 min-h-0">
          <ScrollArea className="w-48 shrink-0">
            {loading ? (
              <p className="text-sm text-muted-foreground p-2">Loading...</p>
            ) : (
              <div className="space-y-1">
                {versions.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className={`w-full text-left p-2 rounded text-xs hover:bg-accent ${selected?.id === v.id ? 'bg-accent' : ''}`}
                  >
                    <p className="font-medium">{new Date(v.createdAt).toLocaleString()}</p>
                    <p className="text-muted-foreground">{v.author.fullName ?? v.author.email}</p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex-1 min-w-0">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">
                    {new Date(selected.createdAt).toLocaleDateString()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(selected)}
                    className="gap-1"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </Button>
                </div>
                <VersionDiff oldContent={currentContent} newContent={selected.contentMd} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a version to compare</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
