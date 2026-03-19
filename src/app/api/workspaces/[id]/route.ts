import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateWorkspace, deleteWorkspace } from '@/lib/workspaces'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ws = await prisma.workspace.findUnique({ where: { id: params.id } })
  if (!ws || ws.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const workspace = await updateWorkspace(params.id, body)
  return NextResponse.json(workspace)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ws = await prisma.workspace.findUnique({ where: { id: params.id } })
  if (!ws || ws.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteWorkspace(params.id)
  return NextResponse.json({ ok: true })
}
