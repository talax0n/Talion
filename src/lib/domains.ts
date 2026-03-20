import { prisma } from '@/lib/prisma'

export async function getWorkspaceByDomain(host: string) {
  return prisma.workspace.findFirst({
    where: { customDomain: host },
  })
}
