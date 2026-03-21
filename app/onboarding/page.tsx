'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile, setMemory } from '@/lib/user'

const STEPS = [
  {
    key: 'name',
    arbi: "Before we begin — what should I call you?",
    placeholder: "Your name or what you go by...",
    type: 'text',
  },
  {
    key: 'location',
    arbi: (name: string) => `Good to meet you, ${name}. Where are you based? Even just the area helps me point you to the right resources.`,
    placeholder: "e.g. Soweto, Sandton, East Rand...",
    type: 'text',
  },
  {
    key: 'situation',
    arbi: "What's your situation right now? No wrong answer — I just want to understand where you're starting from.",
    type: 'choice',
    choices: [
      { value: 'no_income',    label: "I have no income right now" },
      { value: 'informal',     label: "I earn something informally" },
      { value: 'employed',     label: "I'm employed but want more" },
      { value: 'entrepreneur', label: "I'm building something" },
    ],
  },
  {
    key: 'goal',
    arbi: "And what's the most important thing you want to change or achieve?",
    type: 'choice',
    choices: [
      { value: 'find_work',         label: "Get a job or stable income" },
      { value: 'learn_skills',      label: "Learn skills I can use" },
      { value: 'start_business',    label: "Start or grow something" },
      { value: 'understand_system', label: "Navigate grants and support" },
    ],
  },
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #040e14; --surface: #071520; --surface2: #0a1c2a;
    --border: #102336; --border2: #1a3a54;
    --text: #c8dde8; --text-dim: #4a6a7a; --text-muted: #1a3040;
    --accent: #00e5ff; --btn: #0097b2; --btn-hover: #007d94;
    --accent-soft: #00e5ff12;
    --font-serif: 'Playfair Display', Georgia, serif;
    --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
    --r: 8px; --r-lg: 14px;
  }
  html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
  .shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.04) 0%, transparent 70%); }
  .card { width: 100%; max-width: 480px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 40px 36px; display: flex; flex-direction: column; gap: 28px; }
  .progress-bar { height: 2px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--btn), var(--accent)); border-radius: 2px; transition: width 0.5s ease; }
  .arbi-block { display: flex; gap: 12px; align-items: flex-start; }
  .arbi-orb { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; background: rgba(0,229,255,0.08); border: 1.5px solid rgba(0,229,255,0.25); display: flex; align-items: center; justify-content: center; margin-top: 2px; }
  .arbi-orb-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); animation: pulse 2.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  .arbi-bubble { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r-lg); border-top-left-radius: 4px; padding: 14px 16px; font-size: 0.9rem; line-height: 1.7; color: var(--text); flex: 1; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  .input-field { width: 100%; padding: 13px 16px; background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--r-lg); color: var(--text); font-family: var(--font-sans); font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
  .input-field:focus { border-color: var(--btn); }
  .input-field::placeholder { color: var(--text-muted); }
  .choices { display: flex; flex-direction: column; gap: 8px; }
  .choice-btn { width: 100%; padding: 13px 16px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r-lg); color: var(--text); font-family: var(--font-sans); font-size: 0.875rem; text-align: left; cursor: pointer; transition: all 0.2s; }
  .choice-btn:hover { border-color: var(--btn); background: var(--accent-soft); }
  .choice-btn.selected { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .continue-btn { width: 100%; padding: 13px; background: var(--btn); border: none; border-radius: var(--r-lg); color: #fff; font-family: var(--font-sans); font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
  .continue-btn:hover { background: var(--btn-hover); }
  .continue-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .step-label { font-size: 0.62rem; color: var(--text-muted); text-align: center; letter-spacing: 0.5px; }
  .completing { text-align: center; }
  .completing-title { font-family: var(--font-serif); font-weight: 700; font-size: 1.4rem; color: #e0f0f8; margin-bottom: 10px; }
  .completing-sub { font-size: 0.82rem; color: var(--text-dim); line-height: 1.6; }
  .spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 20px auto 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error-box { background: rgba(229,80,57,0.06); border: 1px solid rgba(229,80,57,0.2); border-radius: var(--r); padding: 10px 14px; font-size: 0.78rem; color: #e55039; }
`

function goalToStage(goal: string): string {
  switch (goal) {
    case 'find_work':         return 'skills'
    case 'learn_skills':      return 'skills'
    case 'start_business':    return 'guuz'
    case 'understand_system': return 'btu'
    default:                  return 'groundzero'
  }
}

export default function OnboardingPage() {
  const [stepIndex, setStepIndex]   = useState(0)
  const [answers, setAnswers]       = useState<Record<string, string>>({})
  const [inputValue, setInputValue] = useState('')
  const [completing, setCompleting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [userId, setUserId]         = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  useEffect(() => {
    // Read session from localStorage
    const lsKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (!lsKey) { router.replace('/auth'); return }
    try {
      const parsed = JSON.parse(localStorage.getItem(lsKey) || '{}')
      if (parsed?.user?.id) {
        setUserId(parsed.user.id)
        setAccessToken(parsed.access_token || null)
      } else {
        router.replace('/auth')
      }
    } catch {
      router.replace('/auth')
    }
  }, [router])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [stepIndex])

  const step     = STEPS[stepIndex]
  const progress = (stepIndex / STEPS.length) * 100

  const arbiMessage = typeof step.arbi === 'function'
    ? step.arbi(answers['name'] || 'you')
    : step.arbi

  function canContinue() {
    if (step.type === 'text')   return inputValue.trim().length > 0
    if (step.type === 'choice') return !!answers[step.key]
    return false
  }

  async function handleContinue() {
    const value      = step.type === 'text' ? inputValue.trim() : answers[step.key]
    const newAnswers = { ...answers, [step.key]: value }
    setAnswers(newAnswers)
    setInputValue('')

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(i => i + 1)
      return
    }

    // All steps done — save to Supabase
    setCompleting(true)
    setError(null)

    if (!userId) { router.replace('/auth'); return }

    try {
      const { createClient } = await import('@supabase/supabase-js')

      // Use authenticated client with access token so RLS passes
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        accessToken ? {
          global: { headers: { Authorization: `Bearer ${accessToken}` } }
        } : {}
      )

      const stage = goalToStage(newAnswers['goal'] || '')

      // Try upsert with timeout
      const upsertPromise = supabase
        .from('users')
        .upsert({
          id:       userId,
          name:     newAnswers['name'].trim(),
          location: newAnswers['location'].trim(),
          stage,
        }, { onConflict: 'id' })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      )

      const { error: upsertError } = await Promise.race([upsertPromise, timeoutPromise]) as any

      if (upsertError) {
        console.error('User upsert error:', upsertError.message, upsertError.code)
        // If RLS blocking — try insert instead
        if (upsertError.code === '42501' || upsertError.message?.includes('row-level')) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id:       userId,
              name:     newAnswers['name'].trim(),
              location: newAnswers['location'].trim(),
              stage,
            })
          if (insertError) {
            console.error('Insert also failed:', insertError.message)
          }
        }
      }

      // Save memory — fire and forget, don't block navigation
      const memories = [
        { key: 'situation',       value: newAnswers['situation'] || '' },
        { key: 'primary_goal',    value: newAnswers['goal'] || '' },
        { key: 'onboarding_done', value: 'true' },
        { key: 'name',            value: newAnswers['name'].trim() },
        { key: 'location',        value: newAnswers['location'].trim() },
      ]

      // Don't await — let these save in background
      Promise.all(memories.map(m =>
        supabase.from('arbi_memory').upsert({
          user_id:    userId,
          key:        m.key,
          value:      m.value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,key' })
      )).catch(e => console.error('Memory save error:', e))

      // Navigate immediately — don't wait for DB
      router.replace('/')

    } catch (err) {
      console.error('Onboarding save error:', err)
      setError('Something went wrong. Please try again.')
      setCompleting(false)
    }
  }

  function handleChoice(value: string) {
    setAnswers(a => ({ ...a, [step.key]: value }))
  }

  if (completing) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="shell">
          <div className="card">
            <div className="completing">
              <div className="completing-title">Setting up your journey</div>
              <div className="completing-sub">ARBI is learning who you are and where you're headed.</div>
              <div className="spinner"/>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="shell">
        <div className="card">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}/>
          </div>
          <div className="arbi-block">
            <div className="arbi-orb"><div className="arbi-orb-dot"/></div>
            <div className="arbi-bubble">{arbiMessage}</div>
          </div>
          {error && <div className="error-box">{error}</div>}
          {step.type === 'text' && (
            <input
              ref={inputRef} className="input-field" type="text"
              placeholder={step.placeholder} value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && canContinue()) handleContinue() }}
            />
          )}
          {step.type === 'choice' && (
            <div className="choices">
              {step.choices?.map(c => (
                <button key={c.value}
                  className={`choice-btn ${answers[step.key] === c.value ? 'selected' : ''}`}
                  onClick={() => handleChoice(c.value)}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
          <button className="continue-btn" onClick={handleContinue} disabled={!canContinue()}>
            {stepIndex < STEPS.length - 1 ? 'Continue' : "Let's begin"}
          </button>
          <div className="step-label">Step {stepIndex + 1} of {STEPS.length}</div>
        </div>
      </div>
    </>
  )
}
