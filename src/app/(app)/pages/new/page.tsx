import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function NewPagePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { email: session.user.email } })
  if (!profile) redirect('/login')

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: profile.id },
    orderBy: { createdAt: 'asc' },
  })
  if (!workspace) redirect('/pages')

  const base = 'untitled'
  const count = await prisma.page.count({
    where: { workspaceId: workspace.id, slug: { startsWith: base } },
  })
  const slug = count === 0 ? base : `${base}-${count}`

  const page = await prisma.page.create({
    data: {
      workspaceId: workspace.id,
      authorId: profile.id,
      title: 'Untitled',
      slug,
      status: 'draft',
      visibility: 'private',
    },
  })

  redirect(`/pages/${page.id}/edit`)
}
