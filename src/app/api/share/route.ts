import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createShareLink } from '@/lib/share-links'

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    pageId?: string
    role?: string
    expiresAt?: string
    password?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { pageId, role, expiresAt, password } = body

  if (!pageId) {
    return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
  }

  try {
    const access = await createShareLink(pageId, {
      role,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      password,
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
    const url = `${baseUrl}/share/${access.token}`

    return NextResponse.json({ token: access.token, url }, { status: 201 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to create share link'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
