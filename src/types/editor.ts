export type EditorMode = 'wysiwyg' | 'markdown'

export interface EditorProps {
  content: string
  onChange: (md: string) => void
  mode?: EditorMode
  readOnly?: boolean
}

export interface EditorState {
  editor: any
  mode: EditorMode
  setMode: (mode: EditorMode) => void
  wordCount: number
  isEmpty: boolean
}

export interface SlashCommand {
  title: string
  description: string
  icon: React.ReactNode
  command: ({ editor }: { editor: any }) => void
}
