'use client'
import { useState, useCallback } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TagBadge } from '@/components/tags/TagBadge'
import { Button } from '@/components/ui/button'
import { Hash, Plus } from 'lucide-react'
import { useTags, type Tag } from '@/hooks/use-tags'

interface TagInputProps {
  workspaceId: string
  pageId: string
  selectedTags: Tag[]
  onChange?: () => void
}

export function TagInput({ workspaceId, pageId, selectedTags, onChange }: TagInputProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { tags, createTag, addToPage, removeFromPage } = useTags(workspaceId)

  const unselected = tags.filter(t => !selectedTags.some(s => s.id === t.id))
  const filtered = unselected.filter(t => t.name.includes(query.toLowerCase()))

  const handleSelect = useCallback(async (tag: Tag) => {
    await addToPage(pageId, tag.id)
    onChange?.()
    setQuery('')
  }, [pageId, addToPage, onChange])

  const handleCreate = useCallback(async () => {
    if (!query.trim()) return
    const tag = await createTag(query.trim())
    if (tag) {
      await addToPage(pageId, tag.id)
      onChange?.()
    }
    setQuery('')
    setOpen(false)
  }, [query, pageId, createTag, addToPage, onChange])

  const handleRemove = useCallback(async (tagId: string) => {
    await removeFromPage(pageId, tagId)
    onChange?.()
  }, [pageId, removeFromPage, onChange])

  return (
    <div className="flex flex-wrap items-center gap-1">
      {selectedTags.map(tag => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          onRemove={() => handleRemove(tag.id)}
        />
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
            <Hash size={10} />
            Add tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0">
          <Command>
            <CommandInput
              placeholder="Search or create..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {filtered.length === 0 && query && (
                <CommandEmpty>
                  <button
                    onClick={handleCreate}
                    className="flex items-center gap-1 text-sm w-full px-2 py-1 hover:bg-accent rounded"
                  >
                    <Plus size={12} />
                    Create &quot;{query}&quot;
                  </button>
                </CommandEmpty>
              )}
              <CommandGroup>
                {filtered.map(tag => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleSelect(tag)}
                  >
                    <TagBadge name={tag.name} color={tag.color} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
