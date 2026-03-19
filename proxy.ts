import { NextRequest, NextResponse } from 'next/server'

// Minimal proxy - auth handled client-side via Supabase localStorage session
export async function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',],
}
