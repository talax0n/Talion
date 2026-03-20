import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { email: session.user.email } })
  return NextResponse.json(profile)
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fullName, avatarUrl } = await req.json()

  const profile = await prisma.profile.update({
    where: { email: session.user.email },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  })
  return NextResponse.json(profile)
}
