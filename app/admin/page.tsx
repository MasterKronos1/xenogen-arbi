'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'nathimthunzini@gmail.com'

const [selectedAction, setSelectedAction] = useState<SovereigntyAction | null>(null);
// ... Render LedgerList on left, SignaturePad on right.

type Stats = {
  users:         number
  conversations: number
  messages:      number
  memories:      number
}

type UserRow = {
  id:         string
  name:       string | null
  location:   string | null
  stage:      string | null
  created_at: string
}

type OrgStatus = {
  id:          string
  name:        string
  status:      string
  url:         string | null
  services:    string[]
  description: string
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #040e14; --surface: #071520; --surface2: #0a1c2a;
    --border: #102336; --border2: #1a3a54;
    --text: #c8dde8; --text-dim: #4a6a7a; --text-muted: #1a3040;
    --accent: #00e5ff; --btn: #0097b2; --btn-hover: #007d94;
    --accent-soft: #00e5ff12; --warn: #f0c040; --danger: #e55039;
    --font-serif: 'Playfair Display', Georgia, serif;
    --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
    --font-mono: 'DM Mono', monospace;
    --r: 8px; --r-lg: 12px;
  }
  html, body { background: var(--bg); color: var(--text); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .shell { min-height: 100vh; padding: 0; }

  /* NAV */
  .nav { height: 54px; display: flex; align-items: center; padding: 0 24px; border-bottom: 1px solid var(--border); background: var(--surface); gap: 16px; position: sticky; top: 0; z-index: 10; }
  .nav-title { font-family: var(--font-serif); font-weight: 700; font-size: 1rem; color: var(--text); }
  .nav-badge { font-size: 0.58rem; padding: 2px 8px; background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2); border-radius: 100px; color: var(--accent); letter-spacing: 1px; text-transform: uppercase; }
  .nav-email { font-size: 0.68rem; color: var(--text-muted); margin-left: auto; font-family: var(--font-mono); }
  .back-btn { font-size: 0.72rem; color: var(--text-dim); cursor: pointer; background: none; border: none; font-family: var(--font-sans); display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: var(--r); transition: all 0.15s; }
  .back-btn:hover { background: var(--surface2); color: var(--text); }

  /* CONTENT */
  .content { max-width: 1100px; margin: 0 auto; padding: 28px 24px; display: flex; flex-direction: column; gap: 28px; }

  /* SECTION */
  .section-title { font-size: 0.58rem; font-weight: 600; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; }

  /* STAT CARDS */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 16px 20px; }
  .stat-value { font-family: var(--font-serif); font-weight: 700; font-size: 2rem; color: var(--accent); line-height: 1; margin-bottom: 6px; }
  .stat-label { font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }

  /* ORG CARDS */
  .orgs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .org-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .org-card:hover { border-color: var(--border2); }
  .org-header { display: flex; align-items: center; gap: 8px; }
  .org-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .org-dot.active  { background: var(--accent); box-shadow: 0 0 6px rgba(0,229,255,0.5); }
  .org-dot.planned { background: var(--text-muted); }
  .org-dot.degraded { background: var(--danger); }
  .org-name { font-size: 0.82rem; font-weight: 600; color: var(--text); }
  .org-status { font-size: 0.58rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-left: auto; }
  .org-desc { font-size: 0.72rem; color: var(--text-dim); line-height: 1.5; }
  .org-url { font-size: 0.66rem; color: var(--btn); font-family: var(--font-mono); cursor: pointer; text-decoration: none; }
  .org-url:hover { color: var(--accent); }
  .org-services { display: flex; flex-wrap: wrap; gap: 4px; }
  .service-tag { font-size: 0.58rem; padding: 2px 7px; background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; color: var(--text-muted); }

  /* USERS TABLE */
  .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; }
  .table-header { display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1.5fr; padding: 10px 16px; background: var(--surface2); border-bottom: 1px solid var(--border); }
  .th { font-size: 0.58rem; font-weight: 600; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase; }
  .table-row { display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1.5fr; padding: 12px 16px; border-bottom: 1px solid var(--border); transition: background 0.15s; }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: var(--surface2); }
  .td { font-size: 0.75rem; color: var(--text-dim); display: flex; align-items: center; }
  .td.name { color: var(--text); font-weight: 500; }
  .stage-badge { font-size: 0.58rem; padding: 2px 8px; border-radius: 100px; background: var(--accent-soft); border: 1px solid rgba(0,229,255,0.15); color: var(--accent); }

  /* MEMORY TABLE */
  .memory-table-header { display: grid; grid-template-columns: 2fr 2fr 3fr 2fr; padding: 10px 16px; background: var(--surface2); border-bottom: 1px solid var(--border); }
  .memory-row { display: grid; grid-template-columns: 2fr 2fr 3fr 2fr; padding: 10px 16px; border-bottom: 1px solid var(--border); transition: background 0.15s; }
  .memory-row:last-child { border-bottom: none; }
  .memory-row:hover { background: var(--surface2); }

  /* REFRESH */
  .refresh-btn { padding: 7px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r); font-size: 0.72rem; color: var(--text-dim); cursor: pointer; font-family: var(--font-sans); transition: all 0.15s; }
  .refresh-btn:hover { border-color: var(--btn); color: var(--btn); }

  .loading { display: flex; align-items: center; justify-content: center; padding: 40px; }
  .spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .access-denied { min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; text-align: center; }
  .access-denied-title { font-family: var(--font-serif); font-size: 1.5rem; color: var(--danger); }
  .access-denied-sub { font-size: 0.82rem; color: var(--text-dim); }

  @media (max-width: 768px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .orgs-grid  { grid-template-columns: 1fr; }
    .table-header, .table-row { grid-template-columns: 2fr 1fr 1fr; }
    .th:nth-child(4), .th:nth-child(5), .td:nth-child(4), .td:nth-child(5) { display: none; }
  }
`

export default function AdminDashboard() {
  const [authorized, setAuthorized]   = useState<boolean | null>(null)
  const [stats, setStats]             = useState<Stats | null>(null)
  const [users, setUsers]             = useState<UserRow[]>([])
  const [memories, setMemories]       = useState<any[]>([])
  const [orgs, setOrgs]               = useState<OrgStatus[]>([])
  const [loading, setLoading]         = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const router = useRouter()

  async function loadData() {
    setLoading(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const lsKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      if (!lsKey) { router.replace('/auth'); return }
      const session = JSON.parse(localStorage.getItem(lsKey) || '{}')

      // Check email
      if (session?.user?.email !== ADMIN_EMAIL) {
        setAuthorized(false)
        setLoading(false)
        return
      }
      setAuthorized(true)

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }
      )

      // Load all data in parallel
      const [
        { count: userCount },
        { count: convCount },
        { count: msgCount },
        { count: memCount },
        { data: usersData },
        { data: memoriesData },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('arbi_memory').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('arbi_memory').select('*').order('updated_at', { ascending: false }).limit(30),
      ])

      setStats({
        users:         userCount || 0,
        conversations: convCount || 0,
        messages:      msgCount  || 0,
        memories:      memCount  || 0,
      })
      setUsers(usersData || [])
      setMemories(memoriesData || [])

      // Load ecosystem registry from Supabase directly
      const { data: registryData } = await supabase
        .from('ecosystem_registry')
        .select('*')
        .order('layer', { ascending: true, nullsFirst: false })
      if (registryData) setOrgs(registryData)
      else {
        // Fall back to /api/system
        const res = await fetch('/api/system')
        if (res.ok) {
          const { state } = await res.json()
          setOrgs(state.organizations || [])
        }
      }

      setLastRefresh(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('Admin load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  if (authorized === false) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }}/>
        <div className="access-denied">
          <div className="access-denied-title">Access Denied</div>
          <div className="access-denied-sub">This area is restricted to system administrators.</div>
          <button className="back-btn" onClick={() => router.replace('/')}>← Back to ARBI</button>
        </div>
      </>
    )
  }

  if (authorized === null || loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }}/>
        <div className="loading"><div className="spinner"/></div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }}/>
      <div className="shell">

        <div className="nav">
          <button className="back-btn" onClick={() => router.replace('/')}>← ARBI</button>
          <div className="nav-title">XenoGenesis Control Plane</div>
          <div className="nav-badge">Admin</div>
          <div className="nav-email">{ADMIN_EMAIL}</div>
          <button className="refresh-btn" onClick={loadData}>↻ Refresh</button>
        </div>

        <div className="content">

          {/* STATS */}
          <div>
            <div className="section-title">System Overview {lastRefresh && `· Last updated ${lastRefresh}`}</div>
            <div className="stats-grid">
              {[
                { label: 'Users',         value: stats?.users         ?? 0 },
                { label: 'Conversations', value: stats?.conversations  ?? 0 },
                { label: 'Messages',      value: stats?.messages       ?? 0 },
                { label: 'Memory Tags',   value: stats?.memories       ?? 0 },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ECOSYSTEM */}
          {orgs.length > 0 && (
            <div>
              <div className="section-title">Ecosystem Registry · {orgs.filter(o => o.status === 'active').length} active · {orgs.filter(o => o.status === 'planned').length} planned</div>
              <div className="orgs-grid">
                {orgs.map(org => (
                  <div key={org.id} className="org-card">
                    <div className="org-header">
                      <div className={`org-dot ${org.status}`}/>
                      <div className="org-name">{org.name}</div>
                      <div className="org-status">{org.status}</div>
                    </div>
                    <div className="org-desc">{org.description}</div>
                    {org.url && (
                      <a className="org-url" href={org.url} target="_blank" rel="noopener noreferrer">
                        {org.url.replace('https://', '')}
                      </a>
                    )}
                    <div className="org-services">
                      {org.services.map(s => (
                        <span key={s} className="service-tag">{s.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USERS */}
          <div>
            <div className="section-title">Users · {users.length} shown</div>
            <div className="table-wrap">
              <div className="table-header">
                <div className="th">Name</div>
                <div className="th">Location</div>
                <div className="th">User ID</div>
                <div className="th">Stage</div>
                <div className="th">Joined</div>
              </div>
              {users.length === 0 ? (
                <div style={{padding:'20px 16px',fontSize:'0.75rem',color:'var(--text-muted)',fontStyle:'italic'}}>No users yet</div>
              ) : users.map(u => (
                <div key={u.id} className="table-row">
                  <div className="td name">{u.name || '—'}</div>
                  <div className="td">{u.location || '—'}</div>
                  <div className="td" style={{fontFamily:'var(--font-mono)',fontSize:'0.62rem'}}>{u.id.slice(0,8)}...</div>
                  <div className="td">
                    {u.stage ? <span className="stage-badge">{u.stage.trim()}</span> : '—'}
                  </div>
                  <div className="td">{new Date(u.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* MEMORY */}
          <div>
            <div className="section-title">Recent Memory Tags · {memories.length} shown</div>
            <div className="table-wrap">
              <div className="memory-table-header">
                <div className="th">User ID</div>
                <div className="th">Key</div>
                <div className="th">Value</div>
                <div className="th">Updated</div>
              </div>
              {memories.length === 0 ? (
                <div style={{padding:'20px 16px',fontSize:'0.75rem',color:'var(--text-muted)',fontStyle:'italic'}}>No memory tags yet</div>
              ) : memories.map(m => (
                <div key={m.id} className="memory-row">
                  <div className="td" style={{fontFamily:'var(--font-mono)',fontSize:'0.62rem'}}>{m.user_id?.slice(0,8)}...</div>
                  <div className="td" style={{color:'var(--accent)',fontSize:'0.72rem'}}>{m.key}</div>
                  <div className="td">{m.value?.replace(/_/g, ' ')}</div>
                  <div className="td" style={{fontSize:'0.65rem'}}>{new Date(m.updated_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
