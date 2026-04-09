// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. EXEMPTIONS: Let these through to their specific files
  if (
    pathname.startsWith('/api/system') || 
    pathname.startsWith('/api/chat') ||
    pathname.startsWith('/api/agents')
  ) {
    return NextResponse.next();
  }

  // 2. LOGGING (For your Engineers' Version)
  // This helps you see exactly what is hitting the "Unsupported" error
  if (pathname.startsWith('/api')) {
    console.log(`[PROXY_DEBUG] API Request: ${pathname}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
