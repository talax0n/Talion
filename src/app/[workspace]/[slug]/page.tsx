import { notFound } from 'next/navigation'
import { getPublicPage, getTopPublicPages } from '@/lib/public-pages'
import { EditorContent } from '@/components/editor/EditorContent'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateStaticParams() {
  const pages = await getTopPublicPages(100)
  return pages.map(p => ({ workspace: p.workspace.slug, slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { workspace: string; slug: string }
}): Promise<Metadata> {
  const page = await getPublicPage(params.workspace, params.slug)
  if (!page) return { title: 'Not Found' }
  const fm = page.frontmatter as Record<string, string>
  return {
    title: fm.title ?? page.title,
    description: fm.description ?? '',
    openGraph: {
      title: fm.title ?? page.title,
      description: fm.description ?? '',
      images: fm.ogImage ? [fm.ogImage] : [],
    },
  }
}

export default async function PublicPageView({
  params,
}: {
  params: { workspace: string; slug: string }
}) {
  const page = await getPublicPage(params.workspace, params.slug)
  if (!page) notFound()
  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
      <EditorContent contentHtml={page.contentHtml ?? ''} />
    </article>
  )
}
