'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { TagCount } from '@/lib/tags';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  workspaceId: string;
  placeholder?: string;
}

export function TagInput({
  value,
  onChange,
  workspaceId,
  placeholder = 'Add a tag...',
}: TagInputProps) {
  const [suggestions, setSuggestions] = React.useState<TagCount[]>([]);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (!workspaceId) return;

    fetch(`/api/tags?workspace_id=${encodeURIComponent(workspaceId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tags)) {
          setSuggestions(data.tags);
        }
      })
      .catch(() => {
        // Silently ignore fetch errors — suggestions are optional
      });
  }, [workspaceId]);

  const addTag = React.useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;

      const alreadyExists = value.some(
        (t) => t.toLowerCase() === trimmed.toLowerCase(),
      );
      if (alreadyExists) return;

      onChange([...value, trimmed]);
      setInputValue('');
      setOpen(false);
    },
    [value, onChange],
  );

  const removeTag = React.useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.some((t) => t.toLowerCase() === s.tag.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full hover:bg-muted p-0.5 focus:outline-none"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Command className="rounded-lg border shadow-none" shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={(val) => {
              setInputValue(val);
              setOpen(val.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue.length > 0) setOpen(true);
            }}
            onBlur={() => {
              // Delay close to allow click on items
              setTimeout(() => setOpen(false), 150);
            }}
          />
          {open && (
            <CommandList>
              {filteredSuggestions.length === 0 && inputValue.trim() ? (
                <CommandEmpty>
                  <button
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-sm cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTag(inputValue);
                    }}
                  >
                    Add &ldquo;{inputValue.trim()}&rdquo;
                  </button>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredSuggestions.map((s) => (
                    <CommandItem
                      key={s.tag}
                      value={s.tag}
                      onSelect={() => addTag(s.tag)}
                    >
                      <span>{s.tag}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {s.count}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          )}
        </Command>
      </div>
    </div>
  );
}
