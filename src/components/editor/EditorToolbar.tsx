'use client'
import type { Editor } from '@tiptap/react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote, Minus, Table, Undo, Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  editor: Editor
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const ToolButton = ({ onClick, active, disabled, icon: Icon, title }: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    icon: LucideIcon
    title: string
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn('h-8 w-8 p-0', active && 'bg-accent text-accent-foreground')}
      type="button"
    >
      <Icon size={14} />
    </Button>
  )

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b flex-wrap">
      <ToolButton
        icon={Undo}
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      />
      <ToolButton
        icon={Redo}
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      />
      <Separator orientation="vertical" className="h-5 mx-1" />
      <ToolButton
        icon={Heading1}
        title="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolButton
        icon={Heading2}
        title="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolButton
        icon={Heading3}
        title="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <Separator orientation="vertical" className="h-5 mx-1" />
      <ToolButton
        icon={Bold}
        title="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().toggleBold()}
      />
      <ToolButton
        icon={Italic}
        title="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().toggleItalic()}
      />
      <ToolButton
        icon={Strikethrough}
        title="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolButton
        icon={Code}
        title="Inline Code"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <Separator orientation="vertical" className="h-5 mx-1" />
      <ToolButton
        icon={List}
        title="Bullet List"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolButton
        icon={ListOrdered}
        title="Ordered List"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolButton
        icon={CheckSquare}
        title="Task List"
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />
      <Separator orientation="vertical" className="h-5 mx-1" />
      <ToolButton
        icon={Quote}
        title="Blockquote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolButton
        icon={Minus}
        title="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <ToolButton
        icon={Table}
        title="Table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
    </div>
  )
}
