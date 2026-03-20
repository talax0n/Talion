import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addMember } from '@/lib/access-groups'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { userId, role } = body
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  try {
    const member = await addMember(params.id, userId, role)
    return NextResponse.json(member, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
