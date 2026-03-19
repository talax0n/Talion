import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPageTree, createPage } from '@/lib/pages'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  const pages = await getPageTree(workspaceId)
  return NextResponse.json(pages)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { workspaceId, parentId, title } = body
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  try {
    const page = await createPage({
      workspaceId,
      parentId,
      title,
      authorId: session.user.id,
    })
    return NextResponse.json(page, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
