import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login')
  }

  const workspaceCount = await prisma.workspace.count({
    where: { ownerId: session.user.id },
  })

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Welcome back, {session.user.name ?? session.user.email}</h1>
      <p className="mt-2 text-muted-foreground">
        You have {workspaceCount} workspace{workspaceCount !== 1 ? 's' : ''}.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Workspaces</h3>
          <p className="mt-1 text-3xl font-bold">{workspaceCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Total workspaces</p>
        </div>
      </div>
    </div>
  )
}
