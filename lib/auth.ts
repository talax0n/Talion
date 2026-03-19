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

// Server-side auth helpers
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server component helper — gets the current session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Server component helper — requires authentication.
 * Redirects to /auth/login if no session.
 * Returns the session if authenticated.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  return session;
}
