'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #040e14;
    --surface:    #071520;
    --surface2:   #0a1c2a;
    --border:     #102336;
    --border2:    #1a3a54;
    --text:       #c8dde8;
    --text-dim:   #4a6a7a;
    --text-muted: #1a3040;
    --accent:     #00e5ff;
    --btn:        #0097b2;
    --btn-hover:  #007d94;
    --font-serif: 'Playfair Display', Georgia, serif;
    --font-sans:  'Plus Jakarta Sans', system-ui, sans-serif;
    --r-lg:       14px;
  }

  html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }

  .shell {
    min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;
    background: radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.04) 0%, transparent 70%);
  }
  .card {
    width: 100%; max-width: 420px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 20px;
    padding: 40px 36px; display: flex; flex-direction: column; gap: 24px;
  }
  .header { text-align: center; }
  .orb {
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(0,229,255,0.08); border: 1.5px solid rgba(0,229,255,0.25);
    display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
  }
  .orb-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--accent); animation: pulse 2.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  .title { font-family: var(--font-serif); font-weight: 900; font-size: 1.75rem; color: #e0f0f8; margin-bottom: 8px; }
  .subtitle { font-size: 0.82rem; color: var(--text-dim); line-height: 1.6; }

  .divider { display: flex; align-items: center; gap: 12px; }
  .divider-line { flex: 1; height: 1px; background: var(--border); }
  .divider-text { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

  .google-btn {
    width: 100%; padding: 12px; background: var(--surface2);
    border: 1px solid var(--border2); border-radius: var(--r-lg);
    color: var(--text); font-family: var(--font-sans); font-size: 0.875rem; font-weight: 500;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s;
  }
  .google-btn:hover { border-color: var(--btn); background: rgba(0,151,178,0.08); }
  .google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .form { display: flex; flex-direction: column; gap: 10px; }
  .form-label { font-size: 0.72rem; font-weight: 600; color: var(--text-dim); letter-spacing: 0.5px; }
  .form-input {
    width: 100%; padding: 12px 14px; background: var(--surface2);
    border: 1px solid var(--border2); border-radius: var(--r-lg);
    color: var(--text); font-family: var(--font-sans); font-size: 0.875rem;
    outline: none; transition: border-color 0.2s;
  }
  .form-input:focus { border-color: var(--btn); }
  .form-input::placeholder { color: var(--text-muted); }

  .submit-btn {
    width: 100%; padding: 13px; background: var(--btn); border: none;
    border-radius: var(--r-lg); color: #fff; font-family: var(--font-sans);
    font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.2s;
  }
  .submit-btn:hover { background: var(--btn-hover); }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .success-box {
    background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.2);
    border-radius: var(--r-lg); padding: 16px; text-align: center;
    font-size: 0.82rem; color: var(--accent); line-height: 1.6;
  }
  .error-box {
    background: rgba(229,80,57,0.06); border: 1px solid rgba(229,80,57,0.2);
    border-radius: 8px; padding: 10px 14px; font-size: 0.78rem; color: #e55039;
  }
  .footer-text { font-size: 0.7rem; color: var(--text-muted); text-align: center; line-height: 1.6; }
  @keyframes spin { to { transform: rotate(360deg); } }
`

function AuthPageInner() {
  const [email, setEmail]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sent, setSent]                   = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Redirect if already signed in
  useEffect(() => {
    async function checkSession() {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data } = await supabase.auth.getSession()
        if (data.session) router.replace('/')
      } catch {
        // Ignore
      }
    }
    checkSession()
  }, [router])

  // Show error from callback
  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'link_expired') setError('That link has expired. Please request a new one.')
    if (err === 'auth_failed')  setError('Sign in failed. Please try again.')
  }, [searchParams])

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); setGoogleLoading(false) }
    } catch {
      setError('Google sign in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="shell">
        <div className="card">

          <div className="header">
            <div className="orb"><div className="orb-dot"/></div>
            <div className="title">Welcome to ARBI</div>
            <div className="subtitle">
              Sign in to save your journey, pick up where you left off, and let ARBI learn who you are over time.
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="google-btn" onClick={handleGoogle} disabled={googleLoading || loading}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
          </button>

          <div className="divider">
            <div className="divider-line"/>
            <div className="divider-text">or sign in with email</div>
            <div className="divider-line"/>
          </div>

          {sent ? (
            <div className="success-box">
              ✦ Magic link sent to <strong>{email}</strong><br/>
              Check your inbox and click the link to sign in.
            </div>
          ) : (
            <form className="form" onSubmit={handleMagicLink}>
              <label className="form-label">Email address</label>
              <input
                className="form-input" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required disabled={loading}
              />
              <button className="submit-btn" type="submit" disabled={loading || !email.trim()}>
                {loading ? 'Sending link...' : 'Send magic link'}
              </button>
            </form>
          )}

          <div className="footer-text">
            No password needed. Your journey is saved securely across devices.
          </div>

        </div>
      </div>
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',background:'#040e14',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:40,height:40,borderRadius:'50%',border:'2px solid #102336',borderTopColor:'#00e5ff',animation:'spin 0.8s linear infinite'}}/>
      </div>
    }>
      <AuthPageInner/>
    </Suspense>
  )
}
