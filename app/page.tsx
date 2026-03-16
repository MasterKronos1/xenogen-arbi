'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle, Plus, Settings, ChevronRight, BookOpen,
  ShoppingBag, Briefcase, User, Layers, Send, X,
  Menu, Zap, MoreHorizontal, Clock, ArrowRight, Home
} from 'lucide-react'
const ARBI_WELCOME = `I'm ARBI — your guide through the XenoGenesis pathway.

Wherever you're starting from — whether that's rebuilding from nothing, learning your first skill, or finding your place in the economy — I'm here to walk that road with you.

No judgement. No rush. One step at a time.

Tell me a bit about where you are right now.`

const ARBI_PRODUCTION_SYSTEM = '' // used in route.ts only

type Message = { role: 'user' | 'assistant'; content: string; time?: string }
type Conversation = { id: string; title: string; preview: string; time: string; stage: string }

// ── MOCK HISTORY ──────────────────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 'c1', title: 'Starting my electrical journey', preview: 'We talked about the Foundation Track...', time: 'Today', stage: 'skills' },
  { id: 'c2', title: 'Understanding SASSA grants', preview: 'I helped you find the right grant...', time: 'Yesterday', stage: 'btu' },
  { id: 'c3', title: 'First steps after shelter', preview: 'You asked about next steps once...', time: '3 days ago', stage: 'groundzero' },
]

const PATHWAY_STAGES = [
  { id: 'groundzero', label: 'GroundZero', done: true,  url: 'https://gzbnos.vercel.app' },
  { id: 'btu',        label: 'BTU',        done: true,  url: 'https://btu-two.vercel.app' },
  { id: 'skills',     label: 'Skills',     done: false, url: 'https://xenogen-skills.vercel.app', current: true },
  { id: 'guuz',       label: 'Guuz',       done: false, url: '#' },
  { id: 'career',     label: 'Career',     done: false, url: '#' },
]

const PLATFORM_LINKS = [
  { id: 'skills',  label: 'XenoGen Skills',  color: '#00e5ff', url: 'https://xenogen-skills.vercel.app' },
  { id: 'guuz',    label: 'Guuz Marketplace', color: '#f0c040', url: '#' },
  { id: 'career',  label: 'Career Engine',    color: '#40c4ff', url: '#' },
  { id: 'profile', label: 'My Profile',       color: '#00b8d4', url: '#' },
]

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
]

// ── CSS ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #040e14;
    --surface:   #071520;
    --surface2:  #0a1c2a;
    --border:    #102336;
    --border2:   #1a3a54;
    --text:      #c8dde8;
    --text-dim:  #4a6a7a;
    --text-muted:#1a3040;
    --accent:    #00e5ff;
    --btn:       #0097b2;
    --btn-hover: #007d94;
    --accent-soft:#00e5ff12;
    --warn:      #f0c040;
    --font-serif:'Playfair Display', Georgia, serif;
    --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
    --font-mono: 'DM Mono', monospace;
    --r:         8px;
    --r-lg:      12px;
  }

  html, body { height: 100%; overflow: hidden; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-sans); font-size: 14px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
  ::selection { background: rgba(0,168,84,.2); color: var(--accent); }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* ── LAYOUT ── */
  .shell { display: grid; grid-template-columns: 260px 1fr; height: 100vh; gap: 0; }
  .shell.sidebar-closed { grid-template-columns: 0 1fr; }

  /* ── SIDEBAR ── */
  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow: hidden;
    transition: all 0.25s ease;
  }

  .sidebar-top {
    padding: 16px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
    flex-shrink: 0;
  }

  .logo {
    display: flex; align-items: center; gap: 9px;
    flex: 1; text-decoration: none;
  }

  .logo-mark {
    width: 30px; height: 30px;
    background: var(--btn);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative; overflow: hidden;
  }

  /* Ambient presence indicator */
  .logo-mark::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 70%);
    animation: ambientPulse 3s ease-in-out infinite;
  }
  @keyframes ambientPulse {
    0%,100%{opacity:0.4} 50%{opacity:1}
  }

  .logo-text {
    font-family: var(--font-serif);
    font-weight: 700; font-size: 0.9rem;
    color: var(--text); letter-spacing: 0.2px;
  }

  .new-chat-btn {
    width: 30px; height: 30px;
    background: var(--accent-soft);
    border: 1px solid rgba(0,168,84,.2);
    border-radius: var(--r);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--btn); flex-shrink: 0;
    transition: all 0.2s;
  }
  .new-chat-btn:hover { background: rgba(0,168,84,.2); }

  /* PATHWAY */
  .pathway-section { padding: 14px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .section-label {
    font-size: 0.62rem; font-weight: 600;
    color: var(--text-muted); letter-spacing: 1.5px;
    text-transform: uppercase; margin-bottom: 10px;
  }
  .pathway-nodes { display: flex; align-items: center; gap: 0; }
  .pnode {
    display: flex; flex-direction: column; align-items: center;
    gap: 4px; flex: 1; cursor: pointer; padding: 4px 2px;
    border-radius: var(--r); transition: background 0.2s;
  }
  .pnode:hover { background: var(--surface2); }
  .pnode-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--border2); transition: all 0.2s;
    flex-shrink: 0;
  }
  .pnode.done .pnode-dot { background: var(--btn); }
  .pnode.current .pnode-dot {
    background: var(--accent);
    box-shadow: 0 0 8px rgba(0,230,118,0.5);
    animation: nodePulse 2s ease-in-out infinite;
  }
  @keyframes nodePulse { 0%,100%{box-shadow:0 0 6px rgba(0,229,255,.4)} 50%{box-shadow:0 0 14px rgba(0,229,255,.7)} }
  .pnode-label { font-size: 0.52rem; color: var(--text-muted); font-weight: 500; }
  .pnode.done .pnode-label { color: var(--text-dim); }
  .pnode.current .pnode-label { color: var(--accent); }
  .pnode-connector { width: 100%; height: 1px; background: var(--border); flex: 0 0 8px; margin-top: 4px; }

  /* CONVERSATIONS */
  .conv-section { flex: 1; overflow-y: auto; padding: 12px 8px; }
  .conv-group-label {
    font-size: 0.6rem; font-weight: 600;
    color: var(--text-muted); letter-spacing: 1.5px;
    text-transform: uppercase; padding: 6px 8px 4px;
  }
  .conv-item {
    padding: 9px 10px; border-radius: var(--r);
    cursor: pointer; transition: background 0.15s;
    margin-bottom: 2px;
  }
  .conv-item:hover { background: var(--surface2); }
  .conv-item.active { background: var(--accent-soft); }
  .conv-title { font-size: 0.8rem; font-weight: 500; color: var(--text); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .conv-preview { font-size: 0.68rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .conv-time { font-size: 0.6rem; color: var(--text-muted); margin-top: 3px; }

  /* PLATFORM LINKS */
  .platform-section { padding: 12px 8px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .platform-link {
    display: flex; align-items: center; gap: 9px;
    padding: 8px 10px; border-radius: var(--r);
    cursor: pointer; transition: background 0.15s;
    margin-bottom: 2px; text-decoration: none;
  }
  .platform-link:hover { background: var(--surface2); }
  .pl-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .pl-name { font-size: 0.75rem; font-weight: 500; color: var(--text-dim); flex: 1; }
  .pl-arrow { color: var(--text-muted); }

  /* SETTINGS LINK */
  .sidebar-bottom {
    padding: 10px 8px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .settings-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 10px; border-radius: var(--r);
    cursor: pointer; transition: background 0.15s;
    border: none; background: none; width: 100%;
    font-family: var(--font-sans);
  }
  .settings-btn:hover { background: var(--surface2); }
  .settings-label { font-size: 0.75rem; font-weight: 500; color: var(--text-dim); }

  /* ── MAIN CHAT AREA ── */
  .main { display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }

  /* HEADER */
  .header {
    height: 56px;
    display: flex; align-items: center;
    padding: 0 20px; gap: 12px;
    border-bottom: 1px solid var(--border);
    background: rgba(6,16,10,0.95);
    backdrop-filter: blur(16px);
    flex-shrink: 0;
  }

  .menu-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-dim);
    border: none; background: none; border-radius: var(--r);
    transition: all 0.15s; flex-shrink: 0;
  }
  .menu-btn:hover { background: var(--surface); color: var(--text); }

  .header-arbi {
    display: flex; align-items: center; gap: 10px;
    flex: 1;
  }

  /* AMBIENT ORB */
  .ambient-orb {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 1.5px solid rgba(0,230,118,0.3);
    display: flex; align-items: center; justify-content: center;
    position: relative; flex-shrink: 0;
    background: rgba(0,168,84,0.06);
  }
  .ambient-orb::before {
    content: '';
    position: absolute; inset: -4px;
    border-radius: 50%;
    border: 1px solid rgba(0,230,118,0.1);
    animation: orbRing 3s ease-in-out infinite;
  }
  @keyframes orbRing { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.15);opacity:.2} }
  .orb-inner {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--accent);
    animation: orbPulse 2s ease-in-out infinite;
  }
  @keyframes orbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

  .header-name {
    font-family: var(--font-serif);
    font-weight: 700; font-size: 0.95rem; color: var(--text);
  }
  .header-status {
    font-size: 0.62rem; color: var(--text-dim);
    display: flex; align-items: center; gap: 5px;
  }
  .status-live {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--accent);
    animation: liveDot 2s ease-in-out infinite;
  }
  @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .header-right { margin-left: auto; display: flex; gap: 6px; }
  .header-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-dim); border-radius: var(--r);
    border: none; background: none; transition: all 0.15s;
  }
  .header-btn:hover { background: var(--surface); color: var(--text); }

  /* CHAT */
  .chat-area {
    flex: 1; overflow-y: auto;
    padding: 24px 20px;
    display: flex; flex-direction: column;
    gap: 16px; max-width: 780px;
    width: 100%; margin: 0 auto;
  }
  .chat-area::-webkit-scrollbar { width: 3px; }
  .chat-area::-webkit-scrollbar-thumb { background: var(--border); }

  /* WELCOME STATE */
  .welcome {
    display: flex; flex-direction: column;
    align-items: center; text-align: center;
    padding: 48px 24px; gap: 20px;
    margin: auto;
  }
  .welcome-orb {
    width: 72px; height: 72px; border-radius: 50%;
    border: 2px solid rgba(0,230,118,0.25);
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,168,84,0.06);
    position: relative;
  }
  .welcome-orb::before {
    content: '';
    position: absolute; inset: -8px; border-radius: 50%;
    border: 1px solid rgba(0,230,118,0.1);
    animation: orbRing 3s ease-in-out infinite;
  }
  .welcome-orb-inner { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); animation: orbPulse 2s ease-in-out infinite; }
  .welcome-title { font-family: var(--font-serif); font-weight: 900; font-size: 1.8rem; color: #e8f5ee; letter-spacing: -0.5px; }
  .welcome-sub { font-size: 0.88rem; color: var(--text-dim); line-height: 1.75; max-width: 400px; }

  .quick-starts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; max-width: 480px; margin-top: 8px; }
  .qs-btn {
    padding: 12px 16px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--r-lg);
    cursor: pointer; text-align: left; transition: all 0.2s;
    font-family: var(--font-sans);
  }
  .qs-btn:hover { border-color: var(--btn); background: var(--accent-soft); }
  .qs-title { font-size: 0.78rem; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .qs-sub { font-size: 0.68rem; color: var(--text-dim); line-height: 1.4; }

  /* MESSAGES */
  .msg { display: flex; gap: 10px; animation: msgIn 0.2s ease; max-width: 100%; }
  .msg.user { flex-direction: row-reverse; align-self: flex-end; max-width: 72%; }
  @keyframes msgIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

  .msg-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; align-self: flex-start; margin-top: 2px;
  }
  .msg-avatar.arbi {
    background: rgba(0,168,84,0.1);
    border: 1.5px solid rgba(0,230,118,0.3);
  }
  .msg-avatar-orb { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); animation: orbPulse 2s ease-in-out infinite; }
  .msg-avatar.user { background: var(--surface); border: 1px solid var(--border2); }

  .msg-bubble { padding: 12px 16px; border-radius: var(--r-lg); font-size: 0.875rem; line-height: 1.75; }
  .msg-bubble.arbi { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-bottom-left-radius: 4px; }
  .msg-bubble.user { background: rgba(0,168,84,0.1); border: 1px solid rgba(0,168,84,0.2); color: var(--text); border-bottom-right-radius: 4px; }

  .msg-time { font-size: 0.6rem; color: var(--text-muted); margin-top: 4px; padding: 0 4px; }

  .typing-indicator { display: flex; gap: 4px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); border-bottom-left-radius: 4px; width: fit-content; }
  .td { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); animation: td 1.2s ease-in-out infinite; }
  .td:nth-child(2){animation-delay:.2s}.td:nth-child(3){animation-delay:.4s}
  @keyframes td{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-5px);opacity:1}}

  /* STAGE CONTEXT BAR */
  .stage-bar {
    padding: 8px 20px;
    background: var(--accent-soft);
    border-bottom: 1px solid rgba(0,168,84,0.15);
    display: flex; align-items: center; gap: 10px;
    flex-shrink: 0;
  }
  .stage-bar-text { font-size: 0.7rem; color: var(--btn); font-weight: 500; flex: 1; }
  .stage-bar-link {
    font-size: 0.68rem; color: var(--btn); cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    font-weight: 600; background: none; border: none;
    font-family: var(--font-sans); transition: opacity 0.2s;
  }
  .stage-bar-link:hover { opacity: 0.75; }

  /* INPUT */
  .input-section {
    padding: 16px 20px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg);
    flex-shrink: 0;
  }
  .input-inner { max-width: 780px; margin: 0 auto; }
  .input-wrap {
    display: flex; align-items: flex-end; gap: 10px;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--r-lg);
    padding: 10px 12px 10px 16px;
    transition: border-color 0.2s;
  }
  .input-wrap:focus-within { border-color: var(--btn); }

  textarea {
    flex: 1; background: transparent; border: none;
    color: var(--text); font-family: var(--font-sans);
    font-size: 0.875rem; outline: none; resize: none;
    line-height: 1.6; max-height: 140px;
    padding: 0;
  }
  textarea::placeholder { color: var(--text-muted); }

  .send-btn {
    width: 34px; height: 34px; flex-shrink: 0;
    background: var(--btn); color: #fff;
    border: none; border-radius: var(--r);
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; transition: all 0.2s;
  }
  .send-btn:hover { background: var(--btn-hover); }
  .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .input-hint { font-size: 0.62rem; color: var(--text-muted); margin-top: 8px; text-align: center; }

  /* SETTINGS PANEL */
  .settings-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(6,16,10,0.7); backdrop-filter: blur(6px); animation: fadeIn 0.2s; }
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .settings-panel {
    position: fixed; right: 0; top: 0; bottom: 0;
    width: min(360px,100vw); z-index: 201;
    background: var(--surface);
    border-left: 1px solid var(--border);
    display: flex; flex-direction: column;
    animation: slideIn 0.25s cubic-bezier(0.16,1,0.3,1);
    box-shadow: -20px 0 60px rgba(0,0,0,0.4);
  }
  @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
  .settings-head { padding: 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .settings-title { font-family: var(--font-serif); font-weight: 700; font-size: 1.1rem; color: var(--text); }
  .settings-close { width: 30px; height: 30px; border: 1px solid var(--border2); background: none; color: var(--text-dim); cursor: pointer; border-radius: var(--r); display: flex; align-items: center; justify-content: center; }
  .settings-close:hover { border-color: var(--accent); color: var(--accent); }
  .settings-body { flex: 1; overflow-y: auto; padding: 20px; }
  .setting-group { margin-bottom: 28px; }
  .setting-group-title { font-size: 0.65rem; font-weight: 700; color: var(--btn); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; }
  .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--border); }
  .setting-row:last-child { border-bottom: none; }
  .setting-label { font-size: 0.82rem; color: var(--text); }
  .setting-sub { font-size: 0.7rem; color: var(--text-dim); margin-top: 2px; }
  .setting-val { font-size: 0.75rem; color: var(--text-dim); }
  .toggle { width: 36px; height: 20px; background: var(--border2); border-radius: 100px; cursor: pointer; position: relative; transition: background 0.2s; }
  .toggle.on { background: var(--btn); }
  .toggle::after { content:''; position:absolute; width:14px; height:14px; border-radius:50%; background:#fff; top:3px; left:3px; transition:transform 0.2s; }
  .toggle.on::after { transform: translateX(16px); }

  @media(max-width:680px){
    .shell { grid-template-columns: 0 1fr; }
    .shell.sidebar-open { grid-template-columns: 260px 1fr; }
    .quick-starts { grid-template-columns: 1fr; }
  }
`

export default function ARBIProduction() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [started, setStarted] = useState(false)
  const [settings, setSettings] = useState({
    memory: true,
    thoughtStream: false,
    language: 'English',
    stage: 'skills',
  })
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  async function sendMessage(text?: string) {
    const msg = text || input.trim()
    if (!msg || streaming) return

    // If not started yet, set started + build initial messages inline
    // Don't use startChat() — avoids stale state race condition
    const baseMessages: Message[] = started
      ? messages
      : [{ role: 'assistant', content: ARBI_WELCOME, time: now() }]

    if (!started) setStarted(true)

    const userMsg: Message = { role: 'user', content: msg, time: now() }
    const newMsgs = [...baseMessages, userMsg]
    setMessages([...newMsgs, { role: 'assistant', content: '', time: now() }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          stage: settings.stage,
        }),
      })
      const reader = res.body?.getReader()
      const dec = new TextDecoder()
      if (!reader) return
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value)
        setMessages(m => {
          const c = [...m]
          c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + chunk }
          return c
        })
      }
    } catch {
      setMessages(m => {
        const c = [...m]
        c[c.length - 1] = { ...c[c.length - 1], content: 'Connection lost. Please try again.' }
        return c
      })
    } finally { setStreaming(false) }
  }

  const QUICK_STARTS = [
    { title: "I don't know where to start", sub: "Let ARBI assess your situation" },
    { title: "I need help with a grant", sub: "Navigate SASSA and government programs" },
    { title: "I want to learn a skill", sub: "Find the right learning track" },
    { title: "I'm looking for work", sub: "Match to jobs and opportunities" },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={`shell ${sidebarOpen ? '' : 'sidebar-closed'}`}>

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-top">
            <div className="logo">
              <div className="logo-mark">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5"/>
                  <circle cx="7" cy="7" r="2" fill="white"/>
                </svg>
              </div>
              <span className="logo-text">ARBI</span>
            </div>
            <button className="new-chat-btn" onClick={() => { setStarted(false); setMessages([]) }} title="New conversation">
              <Plus size={14} strokeWidth={2.5}/>
            </button>
          </div>

          {/* PATHWAY */}
          <div className="pathway-section">
            <div className="section-label">Your Journey</div>
            <div className="pathway-nodes">
              {PATHWAY_STAGES.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div
                    className={`pnode ${s.done ? 'done' : ''} ${s.current ? 'current' : ''}`}
                    onClick={() => s.url !== '#' && window.open(s.url, '_blank')}
                    title={s.label}
                  >
                    <div className="pnode-dot"/>
                    <div className="pnode-label">{s.label}</div>
                  </div>
                  {i < PATHWAY_STAGES.length - 1 && (
                    <div style={{ width: 12, height: 1, background: 'var(--border)', flexShrink: 0, marginBottom: 10 }}/>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CONVERSATIONS */}
          <div className="conv-section">
            <div className="conv-group-label">Recent</div>
            {MOCK_CONVERSATIONS.map(c => (
              <div
                key={c.id}
                className={`conv-item ${activeConv === c.id ? 'active' : ''}`}
                onClick={() => { setActiveConv(c.id); setStarted(true); setMessages([{ role: 'assistant', content: ARBI_WELCOME }]) }}
              >
                <div className="conv-title">{c.title}</div>
                <div className="conv-preview">{c.preview}</div>
                <div className="conv-time">{c.time}</div>
              </div>
            ))}
          </div>

          {/* PLATFORM LINKS */}
          <div className="platform-section">
            <div className="section-label">Ecosystem</div>
            {PLATFORM_LINKS.map(p => (
              <div
                key={p.id}
                className="platform-link"
                onClick={() => p.url !== '#' && window.open(p.url, '_blank')}
              >
                <div className="pl-dot" style={{ background: p.color }}/>
                <span className="pl-name">{p.label}</span>
                <ChevronRight size={12} className="pl-arrow"/>
              </div>
            ))}
          </div>

          <div className="sidebar-bottom">
            <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
              <Settings size={14} color="var(--text-dim)"/>
              <span className="settings-label">Settings</span>
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">

          {/* HEADER */}
          <div className="header">
            <button className="menu-btn" onClick={() => setSidebarOpen(s => !s)}>
              <Menu size={16}/>
            </button>
            <div className="header-arbi">
              <div className="ambient-orb">
                <div className="orb-inner"/>
              </div>
              <div>
                <div className="header-name">ARBI</div>
                <div className="header-status">
                  <div className="status-live"/>
                  {streaming ? 'Thinking...' : 'Ready'}
                </div>
              </div>
            </div>
            <div className="header-right">
              <button className="header-btn" title="More options"><MoreHorizontal size={16}/></button>
            </div>
          </div>

          {/* STAGE CONTEXT BAR */}
          {started && (
            <div className="stage-bar">
              <Zap size={12} color="var(--btn)"/>
              <div className="stage-bar-text">You're currently on the Skills pathway</div>
              <button className="stage-bar-link" onClick={() => window.open('https://xenogen-skills.vercel.app', '_blank')}>
                Go to Skills <ArrowRight size={11}/>
              </button>
            </div>
          )}

          {/* CHAT AREA */}
          <div className="chat-area">
            {!started ? (
              <div className="welcome">
                <div className="welcome-orb">
                  <div className="welcome-orb-inner"/>
                </div>
                <div className="welcome-title">I'm ARBI.</div>
                <div className="welcome-sub">
                  Your guide through the XenoGenesis pathway. Wherever you're starting from — I'm here to walk that road with you.
                </div>
                <div className="quick-starts">
                  {QUICK_STARTS.map(q => (
                    <button key={q.title} className="qs-btn" onClick={() => sendMessage(q.title)}>
                      <div className="qs-title">{q.title}</div>
                      <div className="qs-sub">{q.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`msg ${msg.role === 'user' ? 'user' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="msg-avatar arbi">
                        <div className="msg-avatar-orb"/>
                      </div>
                    )}
                    {msg.role === 'assistant' && streaming && i === messages.length - 1 && msg.content === '' ? (
                      <div className="typing-indicator">
                        <div className="td"/><div className="td"/><div className="td"/>
                      </div>
                    ) : (
                      <div>
                        <div className={`msg-bubble ${msg.role === 'assistant' ? 'arbi' : 'user'}`}>
                          {msg.content}
                        </div>
                        <div className="msg-time">{msg.time}</div>
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="msg-avatar user">
                        <User size={12} color="var(--text-dim)"/>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={endRef}/>
              </>
            )}
          </div>

          {/* INPUT */}
          <div className="input-section">
            <div className="input-inner">
              <div className="input-wrap">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={e => { setInput(e.target.value); autoResize() }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Talk to ARBI..."
                />
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={streaming || !input.trim()}
                >
                  <Send size={14}/>
                </button>
              </div>
              <div className="input-hint">ENTER to send · SHIFT+ENTER for new line · ARBI knows your pathway</div>
            </div>
          </div>
        </div>

        {/* SETTINGS PANEL */}
        {settingsOpen && (
          <>
            <div className="settings-overlay" onClick={() => setSettingsOpen(false)}/>
            <div className="settings-panel">
              <div className="settings-head">
                <div className="settings-title">Settings</div>
                <button className="settings-close" onClick={() => setSettingsOpen(false)}>
                  <X size={14}/>
                </button>
              </div>
              <div className="settings-body">
                <div className="setting-group">
                  <div className="setting-group-title">Memory & Learning</div>
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Conversation Memory</div>
                      <div className="setting-sub">ARBI remembers your journey across sessions</div>
                    </div>
                    <div className={`toggle ${settings.memory ? 'on' : ''}`} onClick={() => setSettings(s => ({ ...s, memory: !s.memory }))}/>
                  </div>
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Thought Stream</div>
                      <div className="setting-sub">See ARBI's reasoning as she thinks</div>
                    </div>
                    <div className={`toggle ${settings.thoughtStream ? 'on' : ''}`} onClick={() => setSettings(s => ({ ...s, thoughtStream: !s.thoughtStream }))}/>
                  </div>
                </div>
                <div className="setting-group">
                  <div className="setting-group-title">Pathway</div>
                  <div className="setting-row">
                    <div className="setting-label">Current Stage</div>
                    <div className="setting-val">Skills</div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-label">Platforms Completed</div>
                    <div className="setting-val">2 of 7</div>
                  </div>
                </div>
                <div className="setting-group">
                  <div className="setting-group-title">Preferences</div>
                  <div className="setting-row">
                    <div className="setting-label">Language</div>
                    <div className="setting-val">English</div>
                  </div>
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Available for Work</div>
                      <div className="setting-sub">Show to employers on Career platform</div>
                    </div>
                    <div className="toggle on"/>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
