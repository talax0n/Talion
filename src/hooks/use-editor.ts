'use client'
import { useState } from 'react'
import { useEditor as useTipTapEditor } from '@tiptap/react'
import { getExtensions } from '@/lib/editor/extensions'
import type { EditorMode } from '@/types/editor'

export function useEditor(content: string, onChange: (md: string) => void) {
  const [mode, setMode] = useState<EditorMode>('wysiwyg')

  const editor = useTipTapEditor({
    extensions: getExtensions(),
    content,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getText())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  const wordCount =
    editor?.storage?.characterCount?.words() ??
    editor?.getText().split(/\s+/).filter(Boolean).length ??
    0
  const isEmpty = editor?.isEmpty ?? true

  return { editor, mode, setMode, wordCount, isEmpty }
}
