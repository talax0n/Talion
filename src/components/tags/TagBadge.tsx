import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagBadgeProps {
  name: string
  color: string
  onRemove?: () => void
  className?: string
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function TagBadge({ name, color, onRemove, className }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('gap-1 text-xs font-normal', className)}
      style={{
        backgroundColor: hexToRgba(color, 0.15),
        borderColor: hexToRgba(color, 0.4),
        color,
      }}
    >
      #{name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70"
          type="button"
        >
          ×
        </button>
      )}
    </Badge>
  )
}
