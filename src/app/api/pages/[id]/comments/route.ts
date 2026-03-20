import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const comments = await prisma.comment.findMany({
    where: { pageId: params.id },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()
  const profile = await prisma.profile.findUnique({ where: { email: session.user.email } })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const comment = await prisma.comment.create({
    data: { pageId: params.id, authorId: profile.id, body },
    include: { author: true },
  })
  return NextResponse.json(comment)
}
