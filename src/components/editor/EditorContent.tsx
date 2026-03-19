import { cn } from '@/lib/utils'

interface EditorContentProps {
  contentHtml: string
  className?: string
}

export function EditorContent({ contentHtml, className }: EditorContentProps) {
  return (
    <div
      className={cn('prose prose-sm max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  )
}
