import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/auth', '/auth/callback']

// Supabase cookie name is based on the project ref
const SUPABASE_PROJECT_REF = 'ocwxyhgcgegdiigpxytc'
const AUTH_COOKIE = `sb-${SUPABASE_PROJECT_REF}-auth-token`

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public routes, API routes, static files
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Check for the exact Supabase auth cookie
  const authCookie = request.cookies.get(AUTH_COOKIE)

  // Also check for code verifier cookie which appears during OAuth flow
  const hasAnySbCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  if (!authCookie && !hasAnySbCookie) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',],
}
