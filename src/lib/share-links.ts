import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function createShareLink(
  pageId: string,
  options: {
    role?: string
    expiresAt?: Date
    password?: string
  }
) {
  const token = crypto.randomBytes(32).toString('hex')
  const passwordHash = options.password
    ? await bcrypt.hash(options.password, 10)
    : null
  return prisma.pageAccess.create({
    data: {
      pageId,
      subjectType: 'link',
      token,
      passwordHash,
      expiresAt: options.expiresAt,
      role: options.role ?? 'viewer',
    },
  })
}

export async function validateShareLink(token: string, password?: string) {
  const access = await prisma.pageAccess.findUnique({
    where: { token },
    include: { page: true },
  })
  if (!access) return null
  if (access.expiresAt && access.expiresAt < new Date()) return null
  if (access.passwordHash) {
    if (!password) return { requiresPassword: true }
    const valid = await bcrypt.compare(password, access.passwordHash)
    if (!valid) return null
  }
  return access
}
