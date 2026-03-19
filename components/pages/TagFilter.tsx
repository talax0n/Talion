'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TagCount } from '@/lib/tags';

interface TagFilterProps {
  workspaceId: string;
  selectedTags: string[];
  mode: 'AND' | 'OR';
  onTagToggle: (tag: string) => void;
  onModeChange: (mode: 'AND' | 'OR') => void;
}

export function TagFilter({
  workspaceId,
  selectedTags,
  mode,
  onTagToggle,
  onModeChange,
}: TagFilterProps) {
  const [tags, setTags] = React.useState<TagCount[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);
    fetch(`/api/tags?workspace_id=${encodeURIComponent(workspaceId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tags)) {
          setTags(data.tags);
        }
      })
      .catch(() => {
        // Silently ignore fetch errors
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground px-2 py-1">Loading tags...</div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-2 py-1">No tags found.</div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {selectedTags.length > 1 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Match:</span>
          <Button
            type="button"
            size="sm"
            variant={mode === 'OR' ? 'default' : 'outline'}
            className="h-6 px-2 text-xs"
            onClick={() => onModeChange('OR')}
          >
            Any
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'AND' ? 'default' : 'outline'}
            className="h-6 px-2 text-xs"
            onClick={() => onModeChange('AND')}
          >
            All
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {tags.map(({ tag, count }) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTagToggle(tag)}
              className="focus:outline-none"
              aria-pressed={isSelected}
            >
              <Badge
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer select-none hover:opacity-80 transition-opacity"
              >
                {tag}
                <span className="ml-1 text-xs opacity-60">{count}</span>
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
