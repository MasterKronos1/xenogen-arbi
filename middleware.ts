import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Routes that don't require auth
const PUBLIC_ROUTES = ['/auth', '/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes through
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow API routes and static files through
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Check for Supabase session cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Env vars missing — let through and handle client-side
    return NextResponse.next()
  }

  // Read the auth token from cookies
  const cookieHeader = request.headers.get('cookie') || ''
  const hasSession = cookieHeader.includes('sb-') && cookieHeader.includes('-auth-token')

  if (!hasSession) {
    // No session cookie — redirect to auth
    const authUrl = new URL('/auth', request.url)
    return NextResponse.redirect(authUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
