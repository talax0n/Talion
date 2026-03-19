'use client'
import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TagBadge } from '@/components/tags/TagBadge'
import { TagFilter } from '@/components/tags/TagFilter'
import { useTags, type Tag } from '@/hooks/use-tags'
import { FileText } from 'lucide-react'

interface Page {
  id: string
  title: string
  icon: string | null
  status: string
  updatedAt: string
  tags: Array<{ tag: Tag }>
}

interface PageListProps {
  workspaceId: string
  onSelect?: (id: string) => void
}

export function PageList({ workspaceId, onSelect }: PageListProps) {
  const { tags } = useTags(workspaceId)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>('OR')
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    setLoading(true)
    const params = new URLSearchParams({ workspaceId, mode: filterMode })
    selectedTagIds.forEach(id => params.append('tagId', id))
    fetch(`/api/tags?${params}`)
      .then(r => {
        if (r.ok) return r.json()
        // Fallback: load pages without tag filter
        return fetch(`/api/pages?workspaceId=${workspaceId}`).then(r2 => r2.json())
      })
      .then(data => {
        // data could be tags list or pages list depending on query
        if (selectedTagIds.length > 0) {
          setPages(Array.isArray(data) ? data : [])
        } else {
          // Flatten tree if needed
          function flatten(nodes: any[]): any[] {
            return nodes.flatMap((n: any) => [n, ...flatten(n.children ?? [])])
          }
          setPages(flatten(Array.isArray(data) ? data : []))
        }
      })
      .finally(() => setLoading(false))
  }, [workspaceId, selectedTagIds, filterMode])

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <div className="space-y-4">
      <TagFilter
        tags={tags}
        selectedTagIds={selectedTagIds}
        mode={filterMode}
        onTagToggle={handleTagToggle}
        onModeChange={setFilterMode}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : pages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No pages found
              </TableCell>
            </TableRow>
          ) : (
            pages.map(page => (
              <TableRow
                key={page.id}
                onClick={() => onSelect?.(page.id)}
                className="cursor-pointer hover:bg-accent/50"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {page.icon ? <span>{page.icon}</span> : <FileText size={14} className="text-muted-foreground" />}
                    {page.title || 'Untitled'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {page.tags?.map(({ tag }) => (
                      <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(page.updatedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
