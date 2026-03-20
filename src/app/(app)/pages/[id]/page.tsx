import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EditorContent } from '@/components/editor/EditorContent'
import { CommentThread } from '@/components/comments/CommentThread'
import { VersionHistory } from '@/components/versions/VersionHistory'
import { TagBadge } from '@/components/tags/TagBadge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageCover } from '@/components/pages/PageCover'
import Link from 'next/link'
import { Edit } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function PageViewPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const page = await prisma.page.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      tags: { include: { tag: true } },
      workspace: true,
    },
  })

  if (!page || page.status === 'archived') notFound()

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto">
        {page.coverUrl && <PageCover coverUrl={page.coverUrl} editable={false} />}
        <div className="max-w-3xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {page.icon && <span className="text-3xl">{page.icon}</span>}
            </div>
            <div className="flex items-center gap-2">
              <VersionHistory
                pageId={page.id}
                currentContent={page.contentMd ?? ''}
              />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/pages/${page.id}/edit`}>
                  <Edit className="h-4 w-4 mr-1" />Edit
                </Link>
              </Button>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {(page.author.fullName ?? page.author.email)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{page.author.fullName ?? page.author.email}</span>
            <span>·</span>
            <span>Updated {formatDistanceToNow(page.updatedAt, { addSuffix: true })}</span>
          </div>
          {page.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {page.tags.map(pt => (
                <TagBadge key={pt.tagId} name={pt.tag.name} color={pt.tag.color} />
              ))}
            </div>
          )}
          <EditorContent contentHtml={page.contentHtml ?? ''} />
        </div>
      </div>
      <div className="w-72 border-l overflow-auto">
        <CommentThread pageId={page.id} />
      </div>
    </div>
  )
}
