import { prisma } from '@/lib/prisma'

export async function getComments(pageId: string) {
  return prisma.comment.findMany({
    where: { pageId },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createComment(data: {
  pageId: string
  authorId: string
  body: string
  anchor?: string
}) {
  return prisma.comment.create({ data })
}

export async function resolveComment(id: string) {
  return prisma.comment.update({ where: { id }, data: { resolved: true } })
}
