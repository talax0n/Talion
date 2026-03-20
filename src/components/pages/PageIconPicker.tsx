'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FileText } from 'lucide-react'

const COMMON_ICONS = [
  '📄', '📝', '📚', '🗂️', '💡',
  '🔗', '⭐', '🎯', '🚀', '🔑',
  '📊', '🗺️', '💬', '🛠️', '🎨',
]

interface PageIconPickerProps {
  icon?: string | null
  onChange?: (icon: string) => void
  editable?: boolean
}

export function PageIconPicker({ icon, onChange, editable }: PageIconPickerProps) {
  const [open, setOpen] = useState(false)

  const display = icon ? (
    <span className="text-3xl">{icon}</span>
  ) : (
    <FileText className="h-8 w-8 text-muted-foreground" />
  )

  if (!editable) return <div className="flex items-center">{display}</div>

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-1 h-auto">{display}</Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1">
          {COMMON_ICONS.map(e => (
            <Button
              key={e}
              variant="ghost"
              size="sm"
              className="text-lg p-1 h-auto"
              onClick={() => { onChange?.(e); setOpen(false) }}
            >
              {e}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
