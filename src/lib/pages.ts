import { prisma } from '@/lib/prisma'
import type { CreatePageInput, UpdatePageInput } from '@/types/page'

export async function createPage(input: CreatePageInput) {
  // Enforce depth <= 5 by counting ancestors
  if (input.parentId) {
    let depth = 0
    let currentId: string | null = input.parentId
    while (currentId) {
      depth++
      if (depth >= 5) throw new Error('Maximum page depth of 5 reached')
      const parent: { parentId: string | null } | null = await prisma.page.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })
      currentId = parent?.parentId ?? null
    }
  }

  const slug = `page-${Date.now()}`
  return prisma.page.create({
    data: {
      workspaceId: input.workspaceId,
      parentId: input.parentId ?? null,
      authorId: input.authorId,
      title: input.title ?? 'Untitled',
      slug,
    },
  })
}

export async function getPageTree(workspaceId: string) {
  const pages = await prisma.page.findMany({
    where: { workspaceId, status: { not: 'archived' } },
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { position: 'asc' },
  })

  // Build tree structure
  const map = new Map<string, any>()
  pages.forEach(p => map.set(p.id, { ...p, children: [] }))
  const roots: any[] = []
  pages.forEach(p => {
    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId).children.push(map.get(p.id))
    } else if (!p.parentId) {
      roots.push(map.get(p.id))
    }
  })
  return roots
}

export async function updatePage(id: string, data: UpdatePageInput) {
  return prisma.page.update({ where: { id }, data })
}

export async function deletePage(id: string) {
  // Soft delete — set status to archived
  return prisma.page.update({
    where: { id },
    data: { status: 'archived' },
  })
}

export async function movePage(id: string, parentId: string | null, position: number) {
  return prisma.page.update({
    where: { id },
    data: { parentId, position },
  })
}
