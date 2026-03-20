import { NextRequest, NextResponse } from 'next/server'
import { getWorkspaceByDomain } from '@/lib/domains'

export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get('host')

  if (!host) {
    return NextResponse.json({ error: 'host query param is required' }, { status: 400 })
  }

  const workspace = await getWorkspaceByDomain(host)

  if (!workspace) {
    return NextResponse.json({ slug: null }, { status: 404 })
  }

  return NextResponse.json({ slug: workspace.slug })
}
