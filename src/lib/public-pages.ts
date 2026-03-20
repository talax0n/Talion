import { prisma } from '@/lib/prisma'

export async function getPublicPage(workspaceSlug: string, pageSlug: string) {
  return prisma.page.findFirst({
    where: {
      workspace: { slug: workspaceSlug },
      slug: pageSlug,
      visibility: 'public',
      status: 'published',
    },
    include: {
      author: true,
      tags: { include: { tag: true } },
      workspace: true,
    },
  })
}

export async function getTopPublicPages(limit = 100) {
  return prisma.page.findMany({
    where: { visibility: 'public', status: 'published' },
    include: { workspace: true },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  })
}
