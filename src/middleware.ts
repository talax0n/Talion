import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/signup', '/verify', '/api/auth']

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path))
}

/**
 * Derive the bare hostname from the NEXT_PUBLIC_APP_URL env var.
 * e.g. "https://app.talion.io:3000" → "app.talion.io"
 */
function getAppHost(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return null
  try {
    return new URL(appUrl).hostname
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow _next and static files early — before any custom-domain logic
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // ── Custom domain detection ──────────────────────────────────────────────
  // Prisma cannot run in the Edge runtime, so we only set a header here and
  // let server components / API routes perform the actual DB lookup.
  const host = request.headers.get('host') ?? ''
  const appHost = getAppHost()
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.')

  if (appHost && host && host !== appHost && !isLocalhost) {
    // Pass the raw custom domain to downstream server components via a
    // request header. The layout/page can call getWorkspaceByDomain(host).
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-custom-domain', host)

    // For public paths under a custom domain, allow through with the header.
    if (isPublicPath(pathname)) {
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    // Auth check — same pattern as the standard flow below.
    try {
      const sessionUrl = new URL('/api/auth/get-session', request.url)
      const sessionRes = await fetch(sessionUrl.toString(), {
        headers: request.headers,
      })

      if (!sessionRes.ok) throw new Error('Session fetch failed')

      const session = await sessionRes.json()

      if (!session?.user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next({ request: { headers: requestHeaders } })
  }
  // ── End custom domain detection ──────────────────────────────────────────

  // Allow public paths (standard app host)
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check session via internal fetch — avoids importing pg/crypto in edge runtime
  try {
    const sessionUrl = new URL('/api/auth/get-session', request.url)
    const sessionRes = await fetch(sessionUrl.toString(), {
      headers: request.headers,
    })

    if (!sessionRes.ok) {
      throw new Error('Session fetch failed')
    }

    const session = await sessionRes.json()

    if (!session?.user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
