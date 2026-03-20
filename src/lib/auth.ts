import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { magicLink } from 'better-auth/plugins'
import { prisma } from '@/lib/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO: integrate email provider (Resend/SendGrid)
        console.log(`Magic link for ${email}: ${url}`)
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.profile.upsert({
            where: { id: user.id },
            update: {
              email: user.email,
              fullName: user.name ?? null,
              updatedAt: new Date(),
            },
            create: {
              id: user.id,
              email: user.email,
              fullName: user.name ?? null,
            },
          })
        },
      },
      update: {
        after: async (user) => {
          await prisma.profile.upsert({
            where: { id: user.id },
            update: {
              email: user.email,
              fullName: user.name ?? null,
              updatedAt: new Date(),
            },
            create: {
              id: user.id,
              email: user.email,
              fullName: user.name ?? null,
            },
          })
        },
      },
    },
  },
})
