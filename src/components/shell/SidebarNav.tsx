'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Settings, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  isActive: (pathname: string) => boolean
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === '/dashboard',
  },
  {
    href: '/pages',
    label: 'Pages',
    icon: FileText,
    isActive: (pathname) => pathname.startsWith('/pages'),
  },
  {
    href: '/members',
    label: 'Members',
    icon: Users,
    isActive: (pathname) => pathname === '/members',
  },
  {
    href: '/search',
    label: 'Search',
    icon: Search,
    isActive: (pathname) => pathname === '/search',
  },
  {
    href: '/settings/profile',
    label: 'Settings',
    icon: Settings,
    isActive: (pathname) => pathname.startsWith('/settings'),
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = item.isActive(pathname)
        return (
          <Button
            key={item.href}
            variant={active ? 'secondary' : 'ghost'}
            className={cn('w-full justify-start gap-2', active && 'font-medium')}
            asChild
          >
            <Link href={item.href}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
