'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppBreadcrumb } from './Breadcrumb'

interface TopNavProps {
  user: {
    id: string
    email: string
    name?: string | null
  }
  onMenuClick: () => void
}

export function TopNav({ user: _user, onMenuClick }: TopNavProps) {
  return (
    <header className="flex h-12 items-center bg-background px-4 gap-4 sticky top-0 z-10">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <AppBreadcrumb />
      </div>
    </header>
  )
}
