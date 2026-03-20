'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useSearch } from '@/hooks/use-search'

interface SearchModalProps {
  workspaceId: string
  workspaceSlug: string
}

export function SearchModal({ workspaceId, workspaceSlug }: SearchModalProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { query, setQuery, results, isLoading } = useSearch(workspaceId)

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Reset query when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open, setQuery])

  function handleSelect(slug: string) {
    setOpen(false)
    router.push(`/${workspaceSlug}/${slug}`)
  }

  return (
    <>
      {/* Trigger hint */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
        aria-label="Open search"
        type="button"
      >
        <span>Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search pages..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}
          {!isLoading && query.trim() && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {!isLoading && results.length > 0 && (
            <CommandGroup heading="Pages">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result.slug)}
                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="font-medium">{result.title}</span>
                  {result.excerpt && (
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {result.excerpt}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
