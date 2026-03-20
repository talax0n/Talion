import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PagesSidebar } from './PagesSidebar'

export default async function PagesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { email: session.user.email } })
  if (!profile) redirect('/login')

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: profile.id },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="flex h-full">
      {workspace && <PagesSidebar workspaceId={workspace.id} />}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
