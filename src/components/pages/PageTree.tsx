'use client'
import { useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { PageTreeItem } from '@/components/pages/PageTreeItem'
import { NewPageButton } from '@/components/pages/NewPageButton'
import { usePageTree } from '@/hooks/use-page-tree'
import { Skeleton } from '@/components/ui/skeleton'
import type { PageTreeNode } from '@/types/page'

interface PageTreeProps {
  workspaceId: string
  selectedId?: string
  onSelect?: (id: string) => void
}

function flattenTree(nodes: PageTreeNode[]): string[] {
  return nodes.flatMap(n => [n.id, ...flattenTree(n.children)])
}

export function PageTree({ workspaceId, selectedId, onSelect }: PageTreeProps) {
  const { pages, loading, createPage, deletePage } = usePageTree(workspaceId)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    await fetch(`/api/pages/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: over.id }),
    })
  }, [])

  const handleCreate = useCallback(async (parentId?: string | null) => {
    await createPage(parentId)
  }, [createPage])

  if (loading) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}
      </div>
    )
  }

  const allIds = flattenTree(pages)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pages</span>
        <NewPageButton workspaceId={workspaceId} onCreated={id => onSelect?.(id)} />
      </div>
      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
            {pages.map(node => (
              <PageTreeItem
                key={node.id}
                node={node}
                onSelect={onSelect}
                onDelete={deletePage}
                onCreate={handleCreate}
                selectedId={selectedId}
              />
            ))}
          </SortableContext>
        </DndContext>
        {pages.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No pages yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}
