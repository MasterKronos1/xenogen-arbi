/**
 * lib/auth.ts — Auth helpers
 * Magic link + Google OAuth via Supabase Auth.
 * To migrate servers: update NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_APP_URL env vars only.
 */

import { createClient } from '@supabase/supabase-js'

export function getSupabaseAuth() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://xenogen-arbi.vercel.app'
}

// ── MAGIC LINK ────────────────────────────────────────────────────

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseAuth()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  })
  return { error: error?.message || null }
}

// ── GOOGLE OAUTH ──────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const supabase = getSupabaseAuth()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getAppUrl()}/auth/callback`,
    },
  })
  return { error: error?.message || null }
}

// ── SIGN OUT ──────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = getSupabaseAuth()
  await supabase.auth.signOut()
}

// ── GET SESSION ───────────────────────────────────────────────────

export async function getSession() {
  const supabase = getSupabaseAuth()
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser() {
  const supabase = getSupabaseAuth()
  const { data } = await supabase.auth.getUser()
  return data.user
}
