'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

const themes = ['light', 'dark', 'system'] as const
type Theme = (typeof themes)[number]

const icons: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function cycle() {
    const current = (theme as Theme) ?? 'system'
    const idx = themes.indexOf(current)
    setTheme(themes[(idx + 1) % themes.length])
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label="Toggle theme">
      {icons[(theme as Theme) ?? 'system']}
    </Button>
  )
}
