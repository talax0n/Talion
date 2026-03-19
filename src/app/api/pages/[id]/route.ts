import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updatePage, deletePage } from '@/lib/pages'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const page = await updatePage(params.id, body)
  return NextResponse.json(page)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deletePage(params.id)
  return NextResponse.json({ ok: true })
}
