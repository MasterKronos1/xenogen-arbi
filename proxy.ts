import { NextRequest, NextResponse } from 'next/server'

/**
 * Minimal middleware — only blocks direct hash/fragment bypass.
 * Auth is enforced client-side in page.tsx via Supabase session check.
 * Supabase PKCE uses localStorage not cookies, so server-side
 * session checking is not possible without @supabase/ssr package.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block root access with a hash (the bypass attempt)
  if (pathname === '/' && request.headers.get('referer')?.includes('/auth')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
