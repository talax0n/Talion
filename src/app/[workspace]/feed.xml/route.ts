import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { workspace: string } }
) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspace },
  })

  if (!workspace || workspace.visibility !== 'public') {
    return new NextResponse('Not Found', { status: 404 })
  }

  const pages = await prisma.page.findMany({
    where: {
      workspaceId: workspace.id,
      visibility: 'public',
      status: 'published',
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const workspaceUrl = `${appUrl}/${workspace.slug}`

  const items = pages.map(page => {
    const pubDate = page.createdAt.toUTCString()
    const link = `${workspaceUrl}/${page.slug}`
    const excerpt = page.contentMd.slice(0, 300).replace(/[<>&"']/g, c =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] ?? c)
    )
    const title = page.title.replace(/[<>&"']/g, c =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] ?? c)
    )
    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${excerpt}</description>
      <pubDate>${pubDate}</pubDate>
      <guid>${link}</guid>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${workspace.name}</title>
    <link>${workspaceUrl}</link>
    <description>${workspace.description ?? ''}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
