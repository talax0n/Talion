'use client'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Fragment } from 'react'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  pages: 'Pages',
  members: 'Members',
  search: 'Search',
  settings: 'Settings',
  profile: 'Profile',
  workspace: 'Workspace',
  theme: 'Theme',
  account: 'Account',
  edit: 'Edit',
  new: 'New',
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  // Remove leading slash and split
  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean)

  if (segments.length === 0) return null

  // Build crumb trail
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    // Try to get a human-readable label
    const label = ROUTE_LABELS[seg] ?? (seg.length > 20 ? 'Page' : seg)
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.href}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
