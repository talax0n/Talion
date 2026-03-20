import Link from 'next/link'

interface BlogWorkspace {
  id: string
  name: string
  slug: string
  description?: string | null
}

interface BlogPage {
  id: string
  title: string
  slug: string
  contentMd: string
  createdAt: Date
}

interface BlogLayoutProps {
  workspace: BlogWorkspace
  pages: BlogPage[]
  children?: React.ReactNode
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

function getExcerpt(contentMd: string): string {
  return contentMd.replace(/[#*`_\[\]()>~]/g, '').trim().slice(0, 150)
}

export function BlogLayout({ workspace, pages, children }: BlogLayoutProps) {
  const sorted = [...pages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link href={`/${workspace.slug}`} className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-bold text-foreground">{workspace.name}</h1>
          </Link>
          {workspace.description && (
            <p className="mt-2 text-muted-foreground">{workspace.description}</p>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        {children ? (
          children
        ) : (
          <div className="grid gap-8">
            {sorted.map((page) => (
              <article key={page.id} className="group">
                <Link href={`/${workspace.slug}/${page.slug}`}>
                  <div className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
                    <time className="text-xs text-muted-foreground">
                      {formatDate(page.createdAt)}
                    </time>
                    <h2 className="mt-2 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {page.title}
                    </h2>
                    {page.contentMd && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {getExcerpt(page.contentMd)}
                        {page.contentMd.length > 150 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </Link>
              </article>
            ))}
            {sorted.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No posts yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
