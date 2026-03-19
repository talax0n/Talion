import { prisma } from '@/lib/prisma'

export async function createVersion(pageId: string, authorId: string, contentMd: string) {
  // Create version
  await prisma.pageVersion.create({
    data: { pageId, authorId, contentMd },
  })

  // Prune versions beyond 50
  const versions = await prisma.pageVersion.findMany({
    where: { pageId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (versions.length > 50) {
    const toDelete = versions.slice(50).map(v => v.id)
    await prisma.pageVersion.deleteMany({
      where: { id: { in: toDelete } },
    })
  }
}

export async function getVersions(pageId: string) {
  return prisma.pageVersion.findMany({
    where: { pageId },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, fullName: true, email: true } } },
  })
}

export async function restoreVersion(pageId: string, versionId: string) {
  const version = await prisma.pageVersion.findUnique({
    where: { id: versionId },
  })
  if (!version) throw new Error('Version not found')

  return prisma.page.update({
    where: { id: pageId },
    data: { contentMd: version.contentMd },
  })
}
