import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MemberList } from '@/components/members/MemberList'
import { InviteMemberDialog } from '@/components/members/InviteMemberDialog'
import { AccessGroupManager } from '@/components/access/AccessGroupManager'

export default async function MembersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { email: session.user.email } })
  if (!profile) redirect('/login')

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: profile.id },
    orderBy: { createdAt: 'asc' },
    include: { members: true },
  })
  if (!workspace) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Members</h1>
        <p className="text-muted-foreground">No workspace found. Create one first.</p>
      </div>
    )
  }

  // Enrich members with user data
  const enrichedMembers = await Promise.all(
    (workspace.members ?? []).map(async m => {
      const user = await prisma.user.findUnique({ where: { id: m.userId } })
      return { ...m, name: user?.name ?? '', email: user?.email ?? '', joinedAt: m.joinedAt.toISOString() }
    })
  )

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <Badge variant="secondary" className="rounded-md">{enrichedMembers.length}</Badge>
        </div>
        <InviteMemberDialog workspaceId={workspace.id} />
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none p-0 h-auto">
          <TabsTrigger value="members" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Members</TabsTrigger>
          <TabsTrigger value="access-groups" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Access Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="mt-6">
          <MemberList
            members={enrichedMembers}
            ownerId={profile.id}
            currentUserId={profile.id}
          />
        </TabsContent>
        <TabsContent value="access-groups" className="mt-6">
          <AccessGroupManager workspaceId={workspace.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
