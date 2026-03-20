import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageEditor } from './PageEditor'

export default async function EditPagePage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { email: session.user.email } })
  if (!profile) redirect('/login')

  const page = await prisma.page.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  })

  if (!page) notFound()

  if (page.authorId !== profile.id) {
    redirect(`/pages/${params.id}`)
  }

  return (
    <PageEditor
      page={{
        id: page.id,
        title: page.title,
        contentMd: page.contentMd ?? '',
        contentHtml: page.contentHtml ?? '',
        icon: page.icon,
        coverUrl: page.coverUrl,
        status: page.status,
        visibility: page.visibility,
        workspaceId: page.workspaceId,
        tags: page.tags.map(pt => ({ tag: pt.tag })),
      }}
    />
  )
}
