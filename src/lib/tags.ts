import { prisma } from '@/lib/prisma'

export async function getWorkspaceTags(workspaceId: string) {
  return prisma.tag.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
  })
}

export async function createTag(workspaceId: string, name: string, color?: string) {
  return prisma.tag.create({
    data: {
      workspaceId,
      name: name.toLowerCase().trim(),
      color: color ?? '#6366f1',
    },
  })
}

export async function addTagToPage(pageId: string, tagId: string) {
  return prisma.pageTag.create({
    data: { pageId, tagId },
  })
}

export async function removeTagFromPage(pageId: string, tagId: string) {
  return prisma.pageTag.delete({
    where: { pageId_tagId: { pageId, tagId } },
  })
}

export async function getPagesWithTags(
  workspaceId: string,
  tagIds: string[],
  mode: 'AND' | 'OR'
) {
  if (tagIds.length === 0) {
    return prisma.page.findMany({
      where: { workspaceId, status: { not: 'archived' } },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' },
    })
  }

  if (mode === 'AND') {
    // Pages where matching page_tag count = tagIds.length
    const pages = await prisma.page.findMany({
      where: {
        workspaceId,
        status: { not: 'archived' },
        tags: { some: { tagId: { in: tagIds } } },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    // Filter to pages that have ALL tags
    return pages.filter(p =>
      tagIds.every(tid => p.tags.some(pt => pt.tagId === tid))
    )
  } else {
    // OR: pages where any page_tag matches
    return prisma.page.findMany({
      where: {
        workspaceId,
        status: { not: 'archived' },
        tags: { some: { tagId: { in: tagIds } } },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' },
    })
  }
}
