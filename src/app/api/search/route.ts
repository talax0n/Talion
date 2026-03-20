import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchPages } from '@/lib/search'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const workspaceId = searchParams.get('workspaceId')

  if (!q || !workspaceId) {
    return NextResponse.json(
      { error: 'q and workspaceId query params are required' },
      { status: 400 }
    )
  }

  try {
    const results = await searchPages(q, workspaceId)
    return NextResponse.json(results)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
