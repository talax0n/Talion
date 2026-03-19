'use client';

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageTreeItem } from './PageTreeItem';
import type { PageRecord } from '@/lib/pages';

interface SortablePageItemProps {
  page: PageRecord;
  children?: PageRecord[];
  depth: number;
  currentPageId?: string;
  allPages: PageRecord[];
}

function SortablePageItem({
  page,
  children,
  depth,
  currentPageId,
  allPages,
}: SortablePageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PageTreeItem
        page={page}
        children={children}
        depth={depth}
        currentPageId={currentPageId}
        allPages={allPages}
      />
    </div>
  );
}

interface PageTreeProps {
  pages: PageRecord[];
  workspaceId: string;
  currentPageId?: string;
}

export function PageTree({ pages, workspaceId, currentPageId }: PageTreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Only root-level pages at the top
  const rootPages = pages.filter((p) => p.parent_id === null);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedPage = pages.find((p) => p.id === active.id);
    const targetPage = pages.find((p) => p.id === over.id);

    if (!draggedPage || !targetPage) return;

    // Move dragged page to same parent as target page
    const newParentId = targetPage.parent_id;

    try {
      await fetch(`/api/pages/${draggedPage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: newParentId }),
      });
    } catch {
      // Silently fail — the tree will reflect true state on next load
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={rootPages.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0.5">
          {rootPages.map((page) => {
            const children = pages.filter((p) => p.parent_id === page.id);
            return (
              <SortablePageItem
                key={page.id}
                page={page}
                children={children}
                depth={0}
                currentPageId={currentPageId}
                allPages={pages}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
