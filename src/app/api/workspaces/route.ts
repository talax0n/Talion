import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserWorkspaces, createWorkspace } from '@/lib/workspaces'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaces = await getUserWorkspaces(session.user.id)
  return NextResponse.json(workspaces)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, visibility } = body
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const workspace = await createWorkspace(session.user.id, { name, description, visibility })
  return NextResponse.json(workspace, { status: 201 })
}
