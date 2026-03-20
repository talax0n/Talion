'use client'
import { Button } from '@/components/ui/button'
import { Wand2, Lightbulb, AlignLeft } from 'lucide-react'

interface AIToolbarProps {
  onSummarize?: () => void
  onImprove?: () => void
  onExpand?: () => void
}

export function AIToolbar({ onSummarize, onImprove, onExpand }: AIToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-background shadow-md p-1">
      <Button variant="ghost" size="sm" onClick={onSummarize}>
        <AlignLeft className="h-3 w-3 mr-1" />Summarize
      </Button>
      <Button variant="ghost" size="sm" onClick={onImprove}>
        <Wand2 className="h-3 w-3 mr-1" />Improve
      </Button>
      <Button variant="ghost" size="sm" onClick={onExpand}>
        <Lightbulb className="h-3 w-3 mr-1" />Expand
      </Button>
    </div>
  )
}
