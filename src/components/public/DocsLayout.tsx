import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DocsWorkspace {
  id: string
  name: string
  slug: string
}

interface DocsPage {
  id: string
  title: string
  slug: string
}

interface DocsLayoutProps {
  workspace: DocsWorkspace
  pages: DocsPage[]
  children: React.ReactNode
}

export function DocsLayout({ workspace, pages, children }: DocsLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r bg-muted/30">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="border-b px-4 py-4">
            <Link
              href={`/${workspace.slug}`}
              className="text-base font-semibold text-foreground hover:text-primary transition-colors"
            >
              {workspace.name}
            </Link>
          </div>
          <nav className="flex-1 overflow-auto px-2 py-4">
            <ul className="space-y-0.5">
              {pages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/${workspace.slug}/${page.slug}`}
                    className={cn(
                      'block rounded-md px-3 py-1.5 text-sm transition-colors',
                      'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
            {pages.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No pages yet.</p>
            )}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-8 py-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  )
}
