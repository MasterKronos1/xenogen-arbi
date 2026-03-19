import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      // Exchange code on the CLIENT side by redirecting to a page
      // that completes the exchange — this ensures cookies are set
      // in the browser context, not the server context
      const exchangeUrl = new URL('/auth/exchange', origin)
      exchangeUrl.searchParams.set('code', code)
      return NextResponse.redirect(exchangeUrl.toString())
    } catch {
      return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
    }
  }

  // Magic link — token is handled client-side via hash fragment
  // Supabase handles this automatically when the client initialises
  return NextResponse.redirect(`${origin}/auth/exchange`)
}
