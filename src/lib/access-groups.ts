import { prisma } from '@/lib/prisma'

export async function createGroup(workspaceId: string, name: string) {
  return prisma.accessGroup.create({
    data: { workspaceId, name },
  })
}

export async function deleteGroup(id: string) {
  return prisma.accessGroup.delete({ where: { id } })
}

export async function listGroups(workspaceId: string) {
  return prisma.accessGroup.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function addMember(groupId: string, userId: string, role = 'viewer') {
  return prisma.accessGroupMember.create({
    data: { groupId, userId, role },
  })
}

export async function removeMember(groupId: string, userId: string) {
  return prisma.accessGroupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  })
}

export async function setPageAccess(
  pageId: string,
  subjectType: string,
  subjectId: string | null,
  role: string
) {
  // Build a unique where clause: pageId + subjectType + subjectId
  // PageAccess has no @@unique on these three columns in the schema, so we
  // findFirst then upsert by id to achieve idempotent set semantics.
  const existing = await prisma.pageAccess.findFirst({
    where: { pageId, subjectType, subjectId: subjectId ?? undefined },
  })

  if (existing) {
    return prisma.pageAccess.update({
      where: { id: existing.id },
      data: { role },
    })
  }

  return prisma.pageAccess.create({
    data: { pageId, subjectType, subjectId, role },
  })
}

export async function getPageAccess(pageId: string) {
  return prisma.pageAccess.findMany({
    where: { pageId },
    include: { group: true },
    orderBy: { createdAt: 'asc' },
  })
}
