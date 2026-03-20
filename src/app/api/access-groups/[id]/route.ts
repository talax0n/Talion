import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteGroup, addMember, removeMember } from '@/lib/access-groups'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await deleteGroup(params.id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
