import { betterAuth } from 'better-auth'
import { Pool } from 'pg'
import { magicLink } from 'better-auth/plugins'
import { prisma } from '@/lib/prisma'

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
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
  callbacks: {
    async session({ session, user }) {
      // Sync user into profiles table on each session
      await prisma.profile.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          updatedAt: new Date(),
        },
        create: {
          id: user.id,
          email: user.email,
          fullName: user.name ?? null,
        },
      })
      return session
    },
  },
})
