import { TableOfContents } from '@/components/public/TableOfContents'
import type { TocItem } from '@/lib/toc'

interface WikiWorkspace {
  id: string
  name: string
  slug: string
}

interface WikiPage {
  id: string
  title: string
  slug: string
}

interface WikiLayoutProps {
  workspace: WikiWorkspace
  page: WikiPage
  toc: TocItem[]
  children: React.ReactNode
}

export function WikiLayout({ workspace, page, toc, children }: WikiLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{workspace.name}</span>
          <span>/</span>
          <span>{page.title}</span>
        </div>
      </header>

      {/* Two-column layout: content (2/3) + TOC (1/3) */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex gap-12">
          {/* Content */}
          <article className="flex-[2] min-w-0">{children}</article>

          {/* TOC sidebar */}
          {toc.length > 0 && (
            <aside className="flex-[1] min-w-0">
              <TableOfContents toc={toc} />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
