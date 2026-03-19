'use client'
import { useState, useEffect, useCallback } from 'react'
import { EditorContent as TipTapEditorContent } from '@tiptap/react'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { SlashMenu } from '@/components/editor/SlashMenu'
import { useEditor } from '@/hooks/use-editor'
import { Button } from '@/components/ui/button'
import { Code, Eye } from 'lucide-react'
import type { EditorProps } from '@/types/editor'

export function Editor({ content, onChange, mode: _initialMode = 'wysiwyg', readOnly = false }: EditorProps) {
  const { editor, mode, setMode, wordCount } = useEditor(content, onChange)
  const [markdownContent, setMarkdownContent] = useState(content)
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    setMarkdownContent(content)
  }, [content])

  const handleMarkdownChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setMarkdownContent(val)
    onChange(val)
  }, [onChange])

  useEffect(() => {
    if (!editor || mode !== 'wysiwyg') return
    const handleKeyUp = (e: KeyboardEvent) => {
      const { state } = editor
      const { $from } = state.selection
      const textBefore = $from.nodeBefore?.text ?? ''
      if (textBefore.endsWith('/')) {
        const domPos = editor.view.coordsAtPos($from.pos)
        setSlashMenuPos({ top: domPos.bottom + window.scrollY, left: domPos.left })
        setSlashMenuOpen(true)
      } else {
        setSlashMenuOpen(false)
      }
    }
    editor.view.dom.addEventListener('keyup', handleKeyUp)
    return () => editor.view.dom.removeEventListener('keyup', handleKeyUp)
  }, [editor, mode])

  if (!editor) return null

  return (
    <div className="relative flex flex-col h-full border rounded-md overflow-hidden bg-background">
      {!readOnly && (
        <div className="flex items-center justify-between">
          <EditorToolbar editor={editor} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(mode === 'wysiwyg' ? 'markdown' : 'wysiwyg')}
            className="mr-2 gap-1"
            type="button"
          >
            {mode === 'wysiwyg' ? <Code size={14} /> : <Eye size={14} />}
            {mode === 'wysiwyg' ? 'Markdown' : 'WYSIWYG'}
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {mode === 'wysiwyg' ? (
          <>
            <TipTapEditorContent editor={editor} className="h-full" />
            {slashMenuOpen && !readOnly && (
              <SlashMenu
                editor={editor}
                onClose={() => setSlashMenuOpen(false)}
                position={slashMenuPos}
              />
            )}
          </>
        ) : (
          <textarea
            value={markdownContent}
            onChange={handleMarkdownChange}
            readOnly={readOnly}
            className="w-full h-full min-h-[200px] p-4 font-mono text-sm resize-none border-0 outline-none bg-background"
            placeholder="Write markdown..."
          />
        )}
      </div>
      {!readOnly && (
        <div className="px-4 py-1 border-t text-xs text-muted-foreground">
          {wordCount} words
        </div>
      )}
    </div>
  )
}
