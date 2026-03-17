import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const token = searchParams.get('token')
  const type  = searchParams.get('type')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ── MAGIC LINK (OTP token in URL) ─────────────────────────────
  if (token && type === 'magiclink') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink',
    })
    if (error) {
      console.error('Magic link verify error:', error.message)
      return NextResponse.redirect(`${origin}/auth?error=link_expired`)
    }
  }

  // ── GOOGLE OAUTH (code exchange) ──────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('OAuth code exchange error:', error.message)
      return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
    }
  }

  // ── CHECK USER PROFILE → route to onboarding or home ─────────
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single()

      if (!profile?.name) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  } catch {
    // Profile check failed — just go home
  }

  return NextResponse.redirect(`${origin}/`)
}
