import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api/system') ||
    pathname.startsWith('/api/chat') ||
    pathname.startsWith('/api/agents')
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api')) {
    console.log(`[PROXY_DEBUG] API Request: ${pathname}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
