'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { TocItem } from '@/lib/toc'

interface TableOfContentsProps {
  toc: TocItem[]
}

export function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    if (toc.length === 0) return

    const headingIds = toc.map((item) => item.id)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      {
        rootMargin: '0px 0px -70% 0px',
        threshold: 0,
      }
    )

    headingIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) return null

  return (
    <nav className="sticky top-6">
      <p className="mb-3 text-sm font-semibold text-foreground">On this page</p>
      <ul className="space-y-1">
        {toc.map((item) => (
          <li key={item.id} className={cn(item.level === 3 && 'pl-3')}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block text-sm leading-5 transition-colors hover:text-foreground',
                activeId === item.id
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
