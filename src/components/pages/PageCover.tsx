'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImageIcon } from 'lucide-react'

interface PageCoverProps {
  coverUrl?: string | null
  onUpload?: (url: string) => void
  editable?: boolean
}

export function PageCover({ coverUrl, onUpload, editable }: PageCoverProps) {
  const [hovering, setHovering] = useState(false)

  if (!coverUrl && !editable) return null

  return (
    <div
      className="relative w-full h-48 bg-muted"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      {editable && hovering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Button variant="secondary" size="sm" asChild>
            <label>
              Upload Cover
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !onUpload) return
                  const form = new FormData()
                  form.append('file', file)
                  const res = await fetch('/api/upload', { method: 'POST', body: form })
                  const data = await res.json()
                  if (data.url) onUpload(data.url)
                }}
              />
            </label>
          </Button>
        </div>
      )}
    </div>
  )
}
