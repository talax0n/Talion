'use client'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SaveStatusProps {
  status: SaveStatus
}

export function SaveStatus({ status }: SaveStatusProps) {
  if (status === 'idle') return null

  return (
    <div className={cn(
      'flex items-center gap-1 text-xs',
      status === 'saving' && 'text-muted-foreground',
      status === 'saved' && 'text-green-600',
      status === 'error' && 'text-destructive',
    )}>
      {status === 'saving' && (
        <>
          <Loader2 size={12} className="animate-spin" />
          Saving...
        </>
      )}
      {status === 'saved' && (
        <>
          <Check size={12} />
          Saved
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={12} />
          Save failed
        </>
      )}
    </div>
  )
}
