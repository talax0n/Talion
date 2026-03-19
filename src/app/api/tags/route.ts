import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getWorkspaceTags, createTag, getPagesWithTags } from '@/lib/tags'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  // If tagIds provided, return filtered pages
  const tagIds = searchParams.getAll('tagId')
  const mode = (searchParams.get('mode') ?? 'OR') as 'AND' | 'OR'
  if (tagIds.length > 0) {
    const pages = await getPagesWithTags(workspaceId, tagIds, mode)
    return NextResponse.json(pages)
  }

  const tags = await getWorkspaceTags(workspaceId)
  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { workspaceId, name, color, action, pageId, tagId } = body

  if (action === 'addToPage') {
    const { addTagToPage } = await import('@/lib/tags')
    const result = await addTagToPage(pageId, tagId)
    return NextResponse.json(result)
  }

  if (action === 'removeFromPage') {
    const { removeTagFromPage } = await import('@/lib/tags')
    await removeTagFromPage(pageId, tagId)
    return NextResponse.json({ ok: true })
  }

  if (!workspaceId || !name) {
    return NextResponse.json({ error: 'workspaceId and name required' }, { status: 400 })
  }

  const tag = await createTag(workspaceId, name, color)
  return NextResponse.json(tag, { status: 201 })
}
