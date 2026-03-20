import { PrismaClient } from '@prisma/client'
import { userIdStorage } from './rls'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

prisma.$use(async (params, next) => {
  const userId = userIdStorage.getStore()
  if (userId) {
    await prisma.$executeRaw`SET LOCAL app.user_id = ${userId}`
  }
  return next(params)
})
