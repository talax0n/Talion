import { prisma } from '@/lib/prisma'

export async function getUserWorkspaces(ownerId: string) {
  return prisma.workspace.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createWorkspace(
  ownerId: string,
  data: {
    name: string
    description?: string
    visibility?: string
  }
) {
  const slug = await generateSlug(data.name)
  return prisma.workspace.create({
    data: {
      ownerId,
      name: data.name,
      slug,
      description: data.description,
      visibility: data.visibility ?? 'private',
    },
  })
}

export async function updateWorkspace(
  id: string,
  data: {
    name?: string
    description?: string
    visibility?: string
  }
) {
  return prisma.workspace.update({ where: { id }, data })
}

export async function deleteWorkspace(id: string) {
  return prisma.workspace.delete({ where: { id } })
}

export async function generateSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

  let slug = base
  let i = 1
  while (true) {
    const exists = await prisma.workspace.findUnique({ where: { slug } })
    if (!exists) break
    slug = `${base}-${i++}`
  }
  return slug
}
