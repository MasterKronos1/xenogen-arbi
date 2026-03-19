import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PREFIX = '/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith(PUBLIC_PREFIX) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const cookies = request.cookies.getAll()
  const hasAuth = cookies.some(c =>
    c.name.startsWith('sb-') ||
    c.name.includes('auth-token') ||
    c.name.includes('supabase')
  )

  if (!hasAuth) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',],
}
