import { betterAuth } from 'better-auth';
// Import the Next.js plugin for cookie handling
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  database: {
    provider: 'pg',
    url: process.env.DATABASE_URL ?? '',
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      name: {
        type: 'string',
        required: false,
        defaultValue: '',
      },
    },
  },
  session: {
    cookieName: 'talion_session',
    expiresIn: 60 * 60 * 24 * 30, // 30 days
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
