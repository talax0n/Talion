import { prisma } from '@/lib/prisma'

export async function logActivity(pageId: string, authorId: string, contentMd: string) {
  // Activity is tracked via page versions
  return prisma.pageVersion.create({
    data: { pageId, authorId, contentMd },
  })
}

export async function getPageActivity(pageId: string, limit = 10) {
  return prisma.pageVersion.findMany({
    where: { pageId },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
