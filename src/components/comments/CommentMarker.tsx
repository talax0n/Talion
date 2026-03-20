'use client'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

interface CommentMarkerProps {
  count?: number
  onClick?: () => void
}

export function CommentMarker({ count = 0, onClick }: CommentMarkerProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 rounded-full"
      onClick={onClick}
    >
      <MessageSquare className="h-3 w-3" />
      {count > 0 && <span className="ml-1 text-xs">{count}</span>}
    </Button>
  )
}
