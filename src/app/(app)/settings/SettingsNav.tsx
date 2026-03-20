'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  {
    section: 'Personal',
    items: [
      { href: '/settings/profile', label: 'Profile' },
      { href: '/settings/account', label: 'Account & Security' },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { href: '/settings/workspace', label: 'General' },
      { href: '/settings/workspace/theme', label: 'Theme' },
    ],
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-4">
      {navItems.map(({ section, items }) => (
        <div key={section}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {section}
          </p>
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                size="sm"
                className="justify-start"
                asChild
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
          <Separator className="mt-3" />
        </div>
      ))}
    </nav>
  )
}
