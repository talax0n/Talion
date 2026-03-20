import { NextRequest, NextResponse } from 'next/server'
import { validateShareLink } from '@/lib/share-links'
import { PageAccess, Page } from '@prisma/client'

type AccessWithPage = PageAccess & { page: Page }

// Intentionally unauthenticated: share links are designed for public access.
// Access control is enforced by validateShareLink (expiry + bcrypt password check).
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password') ?? undefined

  const result = await validateShareLink(token, password)

  if (result === null) {
    return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
  }

  if ('requiresPassword' in result && result.requiresPassword) {
    return NextResponse.json({ requiresPassword: true }, { status: 401 })
  }

  const access = result as AccessWithPage

  return NextResponse.json({
    page: {
      id: access.page.id,
      title: access.page.title,
      contentHtml: access.page.contentHtml,
    },
    role: access.role,
  })
}
