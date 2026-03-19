'use client'
import { useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useUpload } from '@/hooks/use-upload'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ImageIcon, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  editor: Editor
  className?: string
}

export function ImageUpload({ editor, className }: ImageUploadProps) {
  const { isUploading, progress, error, upload } = useUpload()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const result = await upload(file)
    if (result) {
      editor.chain().focus().setImage({ src: result.url, alt: file.name }).run()
    }
  }, [editor, upload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      className={cn('relative', className)}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="gap-1"
        type="button"
      >
        {isUploading ? <Upload size={14} className="animate-bounce" /> : <ImageIcon size={14} />}
        {isUploading ? 'Uploading...' : 'Image'}
      </Button>
      {isUploading && (
        <div className="absolute top-full left-0 w-48 mt-1 bg-background border rounded-md p-2 shadow-md z-10">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
        </div>
      )}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}
