'use client'
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronRight, MoreHorizontal, Plus, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PageTreeNode } from '@/types/page'

interface PageTreeItemProps {
  node: PageTreeNode
  depth?: number
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
  onCreate?: (parentId: string) => void
  selectedId?: string
}

export function PageTreeItem({
  node,
  depth = 0,
  onSelect,
  onDelete,
  onCreate,
  selectedId,
}: PageTreeItemProps) {
  const [open, setOpen] = useState(false)
  const hasChildren = node.children && node.children.length > 0

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div
          className={cn(
            'flex items-center group rounded-sm hover:bg-accent/50 cursor-pointer',
            selectedId === node.id && 'bg-accent',
          )}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab p-0.5"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={12} className="text-muted-foreground" />
          </button>

          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'p-0.5 text-muted-foreground hover:text-foreground',
                !hasChildren && 'invisible',
              )}
              onClick={e => e.stopPropagation()}
            >
              <ChevronRight
                size={12}
                className={cn('transition-transform', open && 'rotate-90')}
              />
            </button>
          </CollapsibleTrigger>

          <button
            className="flex-1 flex items-center gap-1.5 py-1 px-1 text-sm text-left truncate"
            onClick={() => onSelect?.(node.id)}
          >
            {node.icon && <span>{node.icon}</span>}
            <span className="truncate">{node.title || 'Untitled'}</span>
          </button>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={e => { e.stopPropagation(); onCreate?.(node.id) }}
            >
              <Plus size={10} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={e => e.stopPropagation()}
                >
                  <MoreHorizontal size={10} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(node.id)}
                >
                  <Trash2 size={12} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {node.children.map(child => (
              <PageTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                onDelete={onDelete}
                onCreate={onCreate}
                selectedId={selectedId}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}
