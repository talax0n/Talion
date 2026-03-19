import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getVersions, createVersion, restoreVersion } from '@/lib/versions'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const versions = await getVersions(params.id)
  return NextResponse.json(versions)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { contentMd, restore, versionId } = body

  if (restore && versionId) {
    const page = await restoreVersion(params.id, versionId)
    return NextResponse.json(page)
  }

  if (!contentMd) return NextResponse.json({ error: 'contentMd required' }, { status: 400 })
  await createVersion(params.id, session.user.id, contentMd)
  return NextResponse.json({ ok: true }, { status: 201 })
}
