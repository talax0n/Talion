import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, role } = await req.json()

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: session.user.id },
  })
  if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const member = await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: params.userId } },
    data: { role },
  })
  return NextResponse.json(member)
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const workspaceId = url.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: session.user.id },
  })
  if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId: params.userId } },
  })
  return NextResponse.json({ ok: true })
}
