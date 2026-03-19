import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/signup', '/verify', '/api/auth']

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Allow _next and static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
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
