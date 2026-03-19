'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopNavProps {
  user: {
    id: string
    email: string
    name?: string | null
  }
  onMenuClick: () => void
}

export function TopNav({ user, onMenuClick }: TopNavProps) {
  return (
    <header className="flex h-14 items-center border-b px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1" />
      <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
    </header>
  )
}
