'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ExchangeInner() {
  const [status, setStatus] = useState('Completing sign in...')
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function run() {
      try {
        const { getSupabase } = await import('@/lib/supabase')
        const supabase = getSupabase()

        const code = searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Exchange error:', error.message)
            router.replace('/auth?error=auth_failed')
            return
          }
        }

        // Poll for session
        let session = null
        for (let i = 0; i < 8; i++) {
          await new Promise(r => setTimeout(r, 400))
          const { data } = await supabase.auth.getSession()
          if (data.session) { session = data.session; break }
        }

        // Fallback: read from localStorage directly
        if (!session) {
          const lsKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
          if (lsKey) {
            try {
              const raw = JSON.parse(localStorage.getItem(lsKey) || '{}')
              if (raw?.user?.id) session = raw
            } catch {}
          }
        }

        if (!session) {
          console.error('No session after polling')
          router.replace('/auth?error=auth_failed')
          return
        }

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

      } catch (err) {
        console.error('Auth exchange error:', err)
        router.replace('/auth')
      }
    }
    run()
  }, [router, searchParams])

  return (
    <div style={{
      minHeight:'100vh', background:'#040e14',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:20,
    }}>
      <div style={{
        width:40, height:40, borderRadius:'50%',
        border:'2px solid #102336', borderTopColor:'#00e5ff',
        animation:'spin 0.8s linear infinite',
      }}/>
      <div style={{color:'#4a6a7a', fontSize:'0.82rem', fontFamily:'sans-serif'}}>
        {status}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function AuthExchange() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',background:'#040e14',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:40,height:40,borderRadius:'50%',border:'2px solid #102336',borderTopColor:'#00e5ff',animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ExchangeInner/>
    </Suspense>
  )
}
