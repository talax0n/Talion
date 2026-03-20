import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { RecentPages } from '@/components/dashboard/RecentPages'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { ActivitySnapshot } from '@/components/dashboard/ActivitySnapshot'
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog'

import { LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const profile = await prisma.profile.upsert({
    where: { id: session.user.id },
    update: { email: session.user.email, fullName: session.user.name ?? null },
    create: { id: session.user.id, email: session.user.email, fullName: session.user.name ?? null },
  })

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: profile.id },
    orderBy: { createdAt: 'asc' },
  })

  // No workspace — show onboarding
  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
        <LayoutDashboard className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-3xl font-bold text-center">Welcome to Talion</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Create your first workspace to start organizing your pages, collaborating with team
          members, and publishing content.
        </p>
        <CreateWorkspaceDialog />
      </div>
    )
  }

  // Fetch stats in parallel
  const [totalPages, publishedPages, recentPages, recentActivity, totalMembers] = await Promise.all(
    [
      prisma.page.count({
        where: { workspaceId: workspace.id, status: { not: 'archived' } },
      }),
      prisma.page.count({
        where: { workspaceId: workspace.id, status: 'published' },
      }),
      prisma.page.findMany({
        where: { workspaceId: workspace.id, status: { not: 'archived' } },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { author: true, tags: { include: { tag: true } } },
      }),
      prisma.pageVersion.findMany({
        where: { page: { workspaceId: workspace.id } },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { page: true, author: true },
      }),
      prisma.workspaceMember
        .count({
          where: { workspaceId: workspace.id },
        })
        .catch(() => 1),
    ]
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Welcome back, {profile.fullName ?? session.user.email}
        </h1>
        <p className="text-muted-foreground mt-1">{workspace.name}</p>
      </div>

      <StatsRow
        totalPages={totalPages}
        publishedPages={publishedPages}
        totalMembers={totalMembers}
      />

      <div className="grid grid-cols-5 gap-6 mt-6">
        <div className="col-span-3 flex flex-col gap-6">
          <RecentPages pages={recentPages as any} />
        </div>
        <div className="col-span-2 flex flex-col gap-6">
          <QuickActions workspaceId={workspace.id} />
          <ActivitySnapshot activity={recentActivity as any} />
        </div>
      </div>
    </div>
  )
}
