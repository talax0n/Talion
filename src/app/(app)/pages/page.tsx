import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageList } from '@/components/pages/PageList'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default async function PagesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { email: session.user.email } })
  if (!profile) redirect('/login')

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: profile.id },
    orderBy: { createdAt: 'asc' },
  })

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No workspace yet</h2>
            <p className="text-muted-foreground mb-4">Create a workspace to get started.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pages</h1>
      </div>
      <PageList workspaceId={workspace.id} />
    </div>
  )
}
