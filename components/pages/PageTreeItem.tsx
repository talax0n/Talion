'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { PageRecord } from '@/lib/pages';

interface PageTreeItemProps {
  page: PageRecord;
  children?: PageRecord[];
  depth: number;
  currentPageId?: string;
  allPages?: PageRecord[];
}

export function PageTreeItem({
  page,
  children = [],
  depth,
  currentPageId,
  allPages = [],
}: PageTreeItemProps) {
  const [open, setOpen] = useState(false);
  const hasChildren = children.length > 0;
  const isActive = page.id === currentPageId;

  const indent = depth * 12;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors',
          isActive
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100',
        )}
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <button
              className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 transition-colors"
              aria-label={open ? 'Collapse' : 'Expand'}
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
          </CollapsibleTrigger>
        ) : (
          <span className="flex-shrink-0 w-5" />
        )}

        <span className="flex-shrink-0 text-gray-400">
          {page.icon ? (
            <span className="text-base leading-none">{page.icon}</span>
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
        </span>

        <Link
          href={`/dashboard/pages/${page.id}`}
          className="flex-1 truncate"
          title={page.title}
        >
          {page.title || 'Untitled'}
        </Link>
      </div>

      {hasChildren && (
        <CollapsibleContent>
          <div className="mt-0.5">
            {children.map((child) => {
              const grandchildren = allPages.filter((p) => p.parent_id === child.id);
              return (
                <PageTreeItem
                  key={child.id}
                  page={child}
                  children={grandchildren}
                  depth={depth + 1}
                  currentPageId={currentPageId}
                  allPages={allPages}
                />
              );
            })}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
