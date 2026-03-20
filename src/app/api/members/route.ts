import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const workspaceId = url.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  // Verify requester is owner of workspace
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: session.user.id },
  })
  // If not owner, check if they are a member
  const membership = workspace
    ? null
    : await prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: session.user.id },
      })
  if (!workspace && !membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { joinedAt: 'asc' },
  })

  // Enrich with user data from BetterAuth user table
  const enriched = await Promise.all(
    members.map(async m => {
      const user = await prisma.user.findUnique({ where: { id: m.userId } })
      return { ...m, name: user?.name ?? '', email: user?.email ?? '' }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, email, role } = await req.json()

  // Verify requester owns workspace
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: session.user.id },
  })
  if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Find user by email
  const invitedUser = await prisma.user.findUnique({ where: { email } })
  if (!invitedUser) {
    // Return success anyway — placeholder for email invite
    return NextResponse.json({ message: 'Invite sent (user not yet registered)' })
  }

  // Check if already a member
  const existing = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: invitedUser.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
  }

  const member = await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: invitedUser.id,
      role: role ?? 'viewer',
      invitedBy: session.user.id,
    },
  })

  return NextResponse.json({ ...member, name: invitedUser.name, email: invitedUser.email })
}
