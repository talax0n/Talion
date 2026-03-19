'use client'
import { TagBadge } from '@/components/tags/TagBadge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Tag } from '@/hooks/use-tags'

interface TagFilterProps {
  tags: Tag[]
  selectedTagIds: string[]
  mode: 'AND' | 'OR'
  onTagToggle: (tagId: string) => void
  onModeChange: (mode: 'AND' | 'OR') => void
}

export function TagFilter({ tags, selectedTagIds, mode, onTagToggle, onModeChange }: TagFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <button
            key={tag.id}
            onClick={() => onTagToggle(tag.id)}
            className={cn(
              'rounded-full transition-opacity',
              !selectedTagIds.includes(tag.id) && 'opacity-40'
            )}
          >
            <TagBadge name={tag.name} color={tag.color} />
          </button>
        ))}
      </div>
      {selectedTagIds.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Label htmlFor="filter-mode" className="text-xs">OR</Label>
          <Switch
            id="filter-mode"
            checked={mode === 'AND'}
            onCheckedChange={checked => onModeChange(checked ? 'AND' : 'OR')}
            className="scale-75"
          />
          <Label htmlFor="filter-mode" className="text-xs">AND</Label>
        </div>
      )}
    </div>
  )
}
