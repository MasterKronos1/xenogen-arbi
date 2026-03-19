'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthExchange() {
  const [status, setStatus] = useState('Completing sign in...')
  const router = useRouter()

  useEffect(() => {
    async function exchange() {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Handle OAuth code from URL params
        const params = new URLSearchParams(window.location.search)
        const code   = params.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setStatus('Sign in failed. Redirecting...')
            setTimeout(() => router.replace('/auth?error=auth_failed'), 1500)
            return
          }
        }

        // Wait for Supabase to detect hash fragment (magic link) and set cookies
        await new Promise(r => setTimeout(r, 800))

        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setStatus('Session not found. Redirecting...')
          setTimeout(() => router.replace('/auth?error=auth_failed'), 1500)
          return
        }

        // Check onboarding
        setStatus('Setting up your profile...')
        const { data: profile } = await supabase
          .from('users')
          .select('name')
          .eq('id', session.user.id)
          .single()

        if (!profile?.name) {
          router.replace('/onboarding')
        } else {
          router.replace('/')
        }

      } catch {
        setStatus('Something went wrong. Redirecting...')
        setTimeout(() => router.replace('/auth'), 2000)
      }
    }

    exchange()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', background: '#040e14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid #102336', borderTopColor: '#00e5ff',
        animation: 'spin 0.8s linear infinite',
      }}/>
      <div style={{ color: '#4a6a7a', fontSize: '0.82rem', fontFamily: 'sans-serif' }}>
        {status}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
