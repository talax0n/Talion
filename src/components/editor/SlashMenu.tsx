'use client'
import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
} from '@/components/ui/command'
import {
  Heading1, Heading2, Heading3, Code2, List, Table, Quote, Minus
} from 'lucide-react'

interface SlashMenuProps {
  editor: Editor
  onClose: () => void
  position: { top: number; left: number }
}

export function SlashMenu({ editor, onClose, position }: SlashMenuProps) {
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const commands = [
    {
      title: 'Heading 1',
      description: 'Large heading',
      icon: <Heading1 size={14} />,
      command: () => {
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHeading({ level: 1 }).run()
        onClose()
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium heading',
      icon: <Heading2 size={14} />,
      command: () => {
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHeading({ level: 2 }).run()
        onClose()
      },
    },
    {
      title: 'Heading 3',
      description: 'Small heading',
      icon: <Heading3 size={14} />,
      command: () => {
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHeading({ level: 3 }).run()
        onClose()
      },
    },
    {
      title: 'Code Block',
      description: 'Code snippet with syntax highlighting',
      icon: <Code2 size={14} />,
      command: () => {
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleCodeBlock().run()
        onClose()
      },
    },
    {
      title: 'Bullet List',
      description: 'Unordered list',
      icon: <List size={14} />,
      command: () => {
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleBulletList().run()
        onClose()
      },
    },
    {
      title: 'Table',
      description: '3x3 table',
      icon: <Table size={14} />,
      command: () => {
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        onClose()
      },
    },
    {
      title: 'Quote',
      description: 'Blockquote',
      icon: <Quote size={14} />,
      command: () => {
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleBlockquote().run()
        onClose()
      },
    },
    {
      title: 'Divider',
      description: 'Horizontal rule',
      icon: <Minus size={14} />,
      command: () => {
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).setHorizontalRule().run()
        onClose()
      },
    },
  ]

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 w-64 shadow-lg rounded-md border bg-popover"
      style={{ top: position.top, left: position.left }}
    >
      <Command>
        <CommandInput
          placeholder="Search commands..."
          value={query}
          onValueChange={setQuery}
          autoFocus
        />
        <CommandList>
          <CommandGroup heading="Basic Blocks">
            {filtered.map(cmd => (
              <CommandItem
                key={cmd.title}
                onSelect={cmd.command}
                className="flex items-center gap-2 cursor-pointer"
              >
                {cmd.icon}
                <div>
                  <p className="text-sm font-medium">{cmd.title}</p>
                  <p className="text-xs text-muted-foreground">{cmd.description}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
