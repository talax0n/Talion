'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { UserMenu } from '@/components/shell/UserMenu'
import { SidebarNav } from '@/components/shell/SidebarNav'

interface SidebarProps {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
  isOpen: boolean
  onClose: () => void
}

function SidebarContent({ user }: { user: SidebarProps['user'] }) {
  return (
    <div className="flex h-full flex-col bg-background border-r">
      <div className="flex h-14 items-center px-4 border-b">
        <span className="font-semibold text-lg">Talion</span>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <SidebarNav />
      </ScrollArea>
      <div className="p-2">
        <Separator className="mb-2" />
        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-60 md:flex-col md:flex-shrink-0">
        <SidebarContent user={user} />
      </div>
      {/* Mobile sidebar — Sheet drawer */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-60 p-0">
          <SidebarContent user={user} />
        </SheetContent>
      </Sheet>
    </>
  )
}
