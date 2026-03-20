import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPageAccess, setPageAccess } from '@/lib/access-groups'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entries = await getPageAccess(params.id)
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { subjectType, subjectId, role } = body
  if (!subjectType) return NextResponse.json({ error: 'subjectType required' }, { status: 400 })
  if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 })

  try {
    const entry = await setPageAccess(params.id, subjectType, subjectId ?? null, role)
    return NextResponse.json(entry, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
