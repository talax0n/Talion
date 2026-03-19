'use client'
import { ScrollArea } from '@/components/ui/scroll-area'

interface VersionDiffProps {
  oldContent: string
  newContent: string
}

export function VersionDiff({ oldContent, newContent }: VersionDiffProps) {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const maxLen = Math.max(oldLines.length, newLines.length)

  const rows: Array<{ type: 'same' | 'removed' | 'added'; text: string }> = []
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i]
    const n = newLines[i]
    if (o === n) {
      rows.push({ type: 'same', text: o ?? '' })
    } else {
      if (o !== undefined) rows.push({ type: 'removed', text: o })
      if (n !== undefined) rows.push({ type: 'added', text: n })
    }
  }

  return (
    <ScrollArea className="h-96">
      <div className="p-4 font-mono text-xs space-y-0.5">
        {rows.map((row, i) => (
          <div
            key={i}
            className={
              row.type === 'removed'
                ? 'bg-red-50 text-red-700 px-2'
                : row.type === 'added'
                ? 'bg-green-50 text-green-700 px-2'
                : 'px-2'
            }
          >
            {row.type === 'removed' ? '- ' : row.type === 'added' ? '+ ' : '  '}
            {row.text}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
