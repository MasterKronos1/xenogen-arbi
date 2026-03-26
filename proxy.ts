// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Explicitly allow system and chat routes to bypass any proxy logic
  if (request.nextUrl.pathname.startsWith('/api/system') || 
      request.nextUrl.pathname.startsWith('/api/chat')) {
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  // Update matcher to be more precise
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/system|api/chat).*)',
  ],
}
