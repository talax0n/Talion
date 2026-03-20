import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DocsLayout } from '@/components/public/DocsLayout'
import { BlogLayout } from '@/components/public/BlogLayout'
import { WikiLayout } from '@/components/public/WikiLayout'
import { EditorContent } from '@/components/editor/EditorContent'
import { extractToc } from '@/lib/toc'

export const revalidate = 60

interface WorkspaceIndexPageProps {
  params: { workspace: string }
}

export default async function WorkspaceIndexPage({ params }: WorkspaceIndexPageProps) {
  const workspaceSlug = params.workspace

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace || workspace.visibility !== 'public') {
    notFound()
  }

  const pages = await prisma.page.findMany({
    where: {
      workspaceId: workspace.id,
      status: 'published',
      visibility: 'public',
    },
    orderBy: { createdAt: 'asc' },
  })

  const theme = (workspace.theme ?? {}) as Record<string, unknown>
  const layout = (theme.layout as string) ?? 'docs'

  if (layout === 'blog') {
    return (
      <BlogLayout workspace={workspace} pages={pages} />
    )
  }

  if (layout === 'wiki') {
    // For wiki index, use the first published page as the landing content
    const firstPage = pages[0]
    const toc = firstPage?.contentHtml ? extractToc(firstPage.contentHtml) : []

    return (
      <WikiLayout
        workspace={workspace}
        page={firstPage ?? { id: '', title: workspace.name, slug: '' }}
        toc={toc}
      >
        {firstPage ? (
          <EditorContent contentHtml={firstPage.contentHtml ?? ''} />
        ) : (
          <p className="text-muted-foreground">No pages yet.</p>
        )}
      </WikiLayout>
    )
  }

  // Default: docs layout — show first page content in main area
  const firstPage = pages[0]

  return (
    <DocsLayout workspace={workspace} pages={pages}>
      {firstPage ? (
        <article>
          <h1 className="text-3xl font-bold mb-8">{firstPage.title}</h1>
          <EditorContent contentHtml={firstPage.contentHtml ?? ''} />
        </article>
      ) : (
        <p className="text-muted-foreground">No pages yet.</p>
      )}
    </DocsLayout>
  )
}
