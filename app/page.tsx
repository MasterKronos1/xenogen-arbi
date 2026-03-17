'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Plus, ChevronRight, Send, X, Menu, Zap,
  MoreHorizontal, ArrowRight, Mic, MicOff,
  User, Globe, BookOpen, ShoppingBag, Briefcase,
  Compass,
} from 'lucide-react'

// ── ARBI IDENTITY ─────────────────────────────────────────────────
const ARBI_WELCOME_XENO = `I'm ARBI — your guide through the XenoGenesis pathway.

Wherever you're starting from — whether that's rebuilding from nothing, learning your first skill, or finding your place in the economy — I'm here to walk that road with you.

No judgement. No rush. One step at a time.

Tell me a bit about where you are right now.`

const ARBI_WELCOME_OPEN = `I'm ARBI — Artificial Biological & Reconnaissance Intelligence.

I'm here to think alongside you — whatever you need. I'm direct, warm, and I won't waste your time.

What's on your mind?`

const SENSING_PHRASES = [
  "Reading your words carefully...",
  "Something in what you said is important...",
  "Thinking this through properly...",
  "Want to make sure I understand before I respond...",
  "Sitting with what you've shared...",
  "Finding the right words for this...",
  "This deserves a real answer...",
  "Processing what matters most here...",
]

// ── TYPES ─────────────────────────────────────────────────────────
type Mode = 'xeno' | 'open'
type Message = { role: 'user' | 'assistant'; content: string; time?: string; suggestions?: string[] }
type SavedConversation = { id: string; title: string; preview: string }

const PATHWAY_STAGES = [
  { id: 'groundzero', label: 'GroundZero', done: true,  url: 'https://gzbnos.vercel.app' },
  { id: 'btu',        label: 'BTU',        done: true,  url: 'https://btu-two.vercel.app' },
  { id: 'skills',     label: 'Skills',     done: false, url: '#', current: true },
  { id: 'guuz',       label: 'Guuz',       done: false, url: '#' },
  { id: 'career',     label: 'Career',     done: false, url: '#' },
]

const PLATFORM_LINKS = [
  { label: 'XenoGen Skills',   color: '#00e5ff', url: 'https://xenogen-skills.vercel.app', icon: <BookOpen size={12}/> },
  { label: 'Guuz Marketplace', color: '#f0c040', url: '#', icon: <ShoppingBag size={12}/> },
  { label: 'Career Engine',    color: '#40c4ff', url: '#', icon: <Briefcase size={12}/> },
]

const MOCK_CONVERSATIONS: SavedConversation[] = [
  { id: 'c1', title: 'Starting my electrical journey', preview: 'We talked about the Foundation Track...' },
  { id: 'c2', title: 'Understanding SASSA grants',     preview: 'I helped you navigate the system...' },
  { id: 'c3', title: 'First steps after shelter',      preview: 'You asked about next steps once stable...' },
]

// ── MARKDOWN RENDERER ─────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(?!<[hup]|<pre|<ul)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[hup])/g, '$1')
    .replace(/(<\/[hup][^>]*>)<\/p>/g, '$1')
}

// ── CSS ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

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
    --accent-soft:#00e5ff12;
    --warn:       #f0c040;
    --font-serif: 'Playfair Display', Georgia, serif;
    --font-sans:  'Plus Jakarta Sans', system-ui, sans-serif;
    --font-mono:  'DM Mono', monospace;
    --r:          8px;
    --r-lg:       12px;
  }

  html, body { height: 100%; overflow: hidden; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-sans); font-size: 14px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
  ::selection { background: rgba(0,229,255,.15); color: var(--accent); }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* ── LAYOUT ── */
  .shell { display: grid; grid-template-columns: 268px 1fr; height: 100vh; }
  .shell.closed { grid-template-columns: 0 1fr; }

  /* ── SIDEBAR ── */
  .sidebar { background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; transition: all 0.25s ease; }
  .sb-top { padding: 14px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

  /* ARBI SIGIL */
  .sigil { width: 32px; height: 32px; flex-shrink: 0; position: relative; cursor: default; }
  .sigil canvas { position: absolute; inset: 0; }

  .logo-text { font-family: var(--font-serif); font-weight: 700; font-size: 0.95rem; color: var(--text); flex: 1; letter-spacing: 0.5px; }

  .new-btn { width: 28px; height: 28px; background: var(--accent-soft); border: 1px solid rgba(0,229,255,.2); border-radius: var(--r); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--btn); flex-shrink: 0; transition: all 0.2s; }
  .new-btn:hover { background: rgba(0,229,255,.18); }

  /* MODE TOGGLE */
  .mode-toggle { margin: 12px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border-radius: var(--r); overflow: hidden; flex-shrink: 0; }
  .mode-btn { padding: 8px 6px; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.5px; cursor: pointer; border: none; background: var(--surface2); color: var(--text-dim); font-family: var(--font-sans); transition: all 0.2s; }
  .mode-btn.active { background: var(--accent-soft); color: var(--accent); }
  .mode-btn:first-child { border-radius: var(--r) 0 0 var(--r); }
  .mode-btn:last-child { border-radius: 0 var(--r) var(--r) 0; }

  /* PROFILE CARD */
  .profile-card { margin: 0 12px 12px; padding: 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r-lg); flex-shrink: 0; }
  .pc-top { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
  .pc-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, rgba(0,229,255,.15), rgba(0,151,178,.2)); border: 1.5px solid rgba(0,229,255,.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .pc-name { font-size: 0.82rem; font-weight: 600; color: var(--text); }
  .pc-stage { font-size: 0.62rem; color: var(--text-dim); margin-top: 1px; }
  .pc-progress { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
  .pc-progress-fill { height: 100%; background: linear-gradient(90deg, var(--btn), var(--accent)); border-radius: 2px; transition: width 0.6s ease; }
  .pc-progress-label { font-size: 0.58rem; color: var(--text-muted); display: flex; justify-content: space-between; }

  /* PATHWAY */
  .pathway-section { padding: 10px 16px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .sec-label { font-size: 0.58rem; font-weight: 600; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
  .pathway-nodes { display: flex; align-items: center; }
  .pnode { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; cursor: pointer; padding: 3px 2px; border-radius: 6px; transition: background 0.15s; }
  .pnode:hover { background: var(--surface2); }
  .pnode-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border2); }
  .pnode.done .pnode-dot { background: var(--btn); }
  .pnode.current .pnode-dot { background: var(--accent); box-shadow: 0 0 7px rgba(0,229,255,.6); animation: cPulse 2s ease-in-out infinite; }
  @keyframes cPulse { 0%,100%{box-shadow:0 0 5px rgba(0,229,255,.4)} 50%{box-shadow:0 0 12px rgba(0,229,255,.7)} }
  .pnode-label { font-size: 0.5rem; color: var(--text-muted); }
  .pnode.done .pnode-label { color: var(--text-dim); }
  .pnode.current .pnode-label { color: var(--accent); }
  .pconn { width: 8px; height: 1px; background: var(--border); flex-shrink: 0; margin-bottom: 10px; }

  /* CONVS */
  .conv-section { flex: 1; overflow-y: auto; padding: 10px 8px; }
  .conv-group { font-size: 0.56rem; font-weight: 600; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 8px 4px; }
  .conv-item { padding: 8px 10px; border-radius: var(--r); cursor: pointer; transition: background 0.15s; margin-bottom: 1px; }
  .conv-item:hover { background: var(--surface2); }
  .conv-title { font-size: 0.78rem; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
  .conv-preview { font-size: 0.66rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* PLATFORM LINKS */
  .platform-section { padding: 10px 8px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .pl-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: var(--r); cursor: pointer; transition: background 0.15s; }
  .pl-item:hover { background: var(--surface2); }
  .pl-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .pl-name { font-size: 0.72rem; font-weight: 500; color: var(--text-dim); flex: 1; }

  /* ── MAIN ── */
  .main { display: flex; flex-direction: column; overflow: hidden; background: var(--bg); position: relative; }

  /* HEADER */
  .header { height: 54px; display: flex; align-items: center; padding: 0 18px; gap: 12px; border-bottom: 1px solid var(--border); background: rgba(4,14,20,0.95); backdrop-filter: blur(16px); flex-shrink: 0; }
  .menu-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-dim); border: none; background: none; border-radius: var(--r); transition: all 0.15s; }
  .menu-btn:hover { background: var(--surface); color: var(--text); }

  /* HEADER PRESENCE */
  .header-presence { display: flex; align-items: center; gap: 10px; flex: 1; }
  .header-sigil { width: 36px; height: 36px; position: relative; flex-shrink: 0; }
  .header-sigil canvas { position: absolute; inset: 0; }
  .header-name { font-family: var(--font-serif); font-weight: 700; font-size: 1rem; color: var(--text); }
  .header-sensing { font-size: 0.62rem; color: var(--text-dim); font-style: italic; min-height: 16px; transition: opacity 0.4s; }
  .header-right { margin-left: auto; display: flex; gap: 6px; }
  .hbtn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-dim); border-radius: var(--r); border: none; background: none; transition: all 0.15s; }
  .hbtn:hover { background: var(--surface); color: var(--text); }
  .hbtn.active { color: var(--accent); }

  /* STAGE BAR */
  .stage-bar { padding: 7px 18px; background: var(--accent-soft); border-bottom: 1px solid rgba(0,229,255,.1); display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .stage-bar-text { font-size: 0.68rem; color: var(--btn); font-weight: 500; flex: 1; }
  .stage-bar-link { font-size: 0.66rem; color: var(--btn); cursor: pointer; display: flex; align-items: center; gap: 3px; font-weight: 600; background: none; border: none; font-family: var(--font-sans); }

  /* PRESENCE PANEL */
  .presence-panel { padding: 0 20px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
  .presence-canvas-wrap { position: relative; width: 100%; max-width: 580px; height: 140px; }
  .presence-canvas-wrap canvas { position: absolute; inset: 0; width: 100% !important; }
  .presence-states { display: flex; justify-content: center; gap: 24px; padding: 8px 0 12px; border-bottom: 1px solid var(--border); width: 100%; max-width: 580px; }
  .pstate { text-align: center; }
  .pstate-v { font-family: var(--font-serif); font-weight: 700; font-size: 0.95rem; color: var(--accent); line-height: 1; margin-bottom: 2px; }
  .pstate-l { font-size: 0.48rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

  /* CHAT */
  .chat-area { flex: 1; overflow-y: auto; padding: 20px 18px; display: flex; flex-direction: column; gap: 16px; }
  .chat-area::-webkit-scrollbar { width: 3px; }

  /* WELCOME */
  .welcome { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 32px 20px; gap: 16px; margin: auto; max-width: 520px; }
  .welcome-sigil { width: 80px; height: 80px; position: relative; margin: 0 auto 8px; }
  .welcome-sigil canvas { position: absolute; inset: 0; width: 100% !important; height: 100% !important; }
  .welcome-title { font-family: var(--font-serif); font-weight: 900; font-size: 2rem; color: #e0f0f8; letter-spacing: -0.5px; }
  .welcome-sub { font-size: 0.875rem; color: var(--text-dim); line-height: 1.75; }
  .qs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; margin-top: 8px; }
  .qs-btn { padding: 11px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); cursor: pointer; text-align: left; transition: all 0.2s; font-family: var(--font-sans); }
  .qs-btn:hover { border-color: var(--btn); background: var(--accent-soft); }
  .qs-title { font-size: 0.76rem; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .qs-sub { font-size: 0.64rem; color: var(--text-dim); line-height: 1.4; }

  /* MESSAGES */
  .msg { display: flex; gap: 10px; animation: mIn 0.22s ease; max-width: 100%; }
  .msg.user { flex-direction: row-reverse; align-self: flex-end; max-width: 74%; }
  @keyframes mIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

  .msg-av { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; align-self: flex-start; margin-top: 2px; }
  .msg-av.arbi { background: rgba(0,229,255,.08); border: 1.5px solid rgba(0,229,255,.25); }
  .msg-av-orb { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); animation: oPulse 2.5s ease-in-out infinite; }
  @keyframes oPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
  .msg-av.user { background: var(--surface); border: 1px solid var(--border2); }

  .msg-content { display: flex; flex-direction: column; gap: 6px; max-width: 100%; }

  .msg-bubble { padding: 11px 15px; border-radius: var(--r-lg); font-size: 0.862rem; line-height: 1.75; }
  .msg-bubble.arbi { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-bottom-left-radius: 4px; }
  .msg-bubble.user { background: rgba(0,229,255,.08); border: 1px solid rgba(0,229,255,.18); color: var(--text); border-bottom-right-radius: 4px; }

  .msg-bubble strong { color: var(--text); font-weight: 600; }
  .msg-bubble em { color: var(--text-dim); font-style: italic; }
  .msg-bubble h1,.msg-bubble h2,.msg-bubble h3 { font-family: var(--font-serif); font-weight: 700; color: #e0f0f8; margin: 8px 0 4px; }
  .msg-bubble h1 { font-size: 1.1rem; }
  .msg-bubble h2 { font-size: 1rem; }
  .msg-bubble h3 { font-size: 0.9rem; }
  .msg-bubble ul { padding-left: 18px; margin: 6px 0; }
  .msg-bubble li { margin-bottom: 4px; }
  .msg-bubble code { background: rgba(0,229,255,.08); border: 1px solid rgba(0,229,255,.15); padding: 1px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent); }
  .msg-bubble pre { background: rgba(0,0,0,.3); border: 1px solid var(--border2); border-radius: var(--r); padding: 12px; margin: 8px 0; overflow-x: auto; }
  .msg-bubble pre code { background: none; border: none; padding: 0; font-size: 0.78rem; color: var(--text-dim); }
  .msg-bubble p { margin-bottom: 6px; }
  .msg-bubble p:last-child { margin-bottom: 0; }

  .msg-time { font-size: 0.58rem; color: var(--text-muted); padding: 0 3px; }

  /* SUGGESTIONS */
  .suggestions { display: flex; gap: 6px; flex-wrap: wrap; }
  .sug-btn { padding: 5px 12px; background: transparent; border: 1px solid var(--border2); border-radius: 100px; font-size: 0.68rem; color: var(--text-dim); cursor: pointer; font-family: var(--font-sans); transition: all 0.2s; }
  .sug-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

  /* TYPING */
  .typing-wrap { display: flex; flex-direction: column; gap: 6px; }
  .sensing-text { font-size: 0.64rem; color: var(--text-dim); font-style: italic; animation: sFade 0.5s ease; padding: 0 4px; }
  @keyframes sFade { from{opacity:0} to{opacity:1} }
  .typing-indicator { display: flex; gap: 4px; padding: 12px 15px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); border-bottom-left-radius: 4px; width: fit-content; }
  .td { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); animation: td 1.2s ease-in-out infinite; }
  .td:nth-child(2){animation-delay:.2s}.td:nth-child(3){animation-delay:.4s}
  @keyframes td{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-4px);opacity:1}}

  /* INPUT */
  .input-section { padding: 12px 18px 16px; border-top: 1px solid var(--border); background: var(--bg); flex-shrink: 0; }
  .input-inner { max-width: 740px; margin: 0 auto; }
  .input-wrap { display: flex; align-items: flex-end; gap: 8px; background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r-lg); padding: 9px 10px 9px 14px; transition: border-color 0.2s; }
  .input-wrap:focus-within { border-color: var(--btn); }
  textarea { flex: 1; background: transparent; border: none; color: var(--text); font-family: var(--font-sans); font-size: 0.875rem; outline: none; resize: none; line-height: 1.6; max-height: 130px; padding: 0; }
  textarea::placeholder { color: var(--text-muted); }
  .input-btns { display: flex; gap: 5px; flex-shrink: 0; }
  .mic-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); background: none; border-radius: var(--r); cursor: pointer; color: var(--text-dim); transition: all 0.2s; }
  .mic-btn:hover { border-color: var(--border2); color: var(--text); }
  .mic-btn.recording { border-color: #e55039; color: #e55039; background: rgba(229,80,57,.08); animation: micPulse 1s ease-in-out infinite; }
  @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(229,80,57,.3)} 50%{box-shadow:0 0 0 4px rgba(229,80,57,0)} }
  .send-btn { width: 32px; height: 32px; background: var(--btn); color: #fff; border: none; border-radius: var(--r); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
  .send-btn:hover { background: var(--btn-hover); }
  .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .input-hint { font-size: 0.6rem; color: var(--text-muted); text-align: center; margin-top: 7px; }

  @media(max-width:680px){
    .shell { grid-template-columns: 0 1fr; }
    .shell.closed { grid-template-columns: 0 1fr; }
    .qs-grid { grid-template-columns: 1fr; }
    .presence-panel { display: none; }
  }
`

// ── BIOLOGICAL SIGIL RENDERER ─────────────────────────────────────
function drawSigil(
  canvas: HTMLCanvasElement,
  time: number,
  streaming: boolean,
  size: 'sm' | 'lg'
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const cx = w / 2
  const cy = h / 2
  const baseR = size === 'lg' ? w * 0.28 : w * 0.32
  const speed = streaming ? 2.5 : 1

  const breathR = baseR + Math.sin(time * 0.001 * speed) * (size === 'lg' ? 8 : 4)
  ctx.beginPath()
  ctx.arc(cx, cy, breathR, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(0,229,255,${0.12 + Math.sin(time * 0.001) * 0.06})`
  ctx.lineWidth = 0.8
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, breathR * 0.72, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(0,229,255,${0.18 + Math.sin(time * 0.0015) * 0.08})`
  ctx.lineWidth = 0.6
  ctx.stroke()

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(time * 0.0003 * speed)
  const coreR = baseR * 0.42
  for (let t = 0; t < 3; t++) {
    ctx.save()
    ctx.rotate((t / 3) * Math.PI * 2)
    ctx.beginPath()
    for (let i = 0; i <= 3; i++) {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2
      const r = coreR * (0.8 + Math.sin(time * 0.002 + t) * 0.1)
      i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
               : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    ctx.strokeStyle = `rgba(0,229,255,${0.25 + t * 0.08})`
    ctx.lineWidth = 0.7
    ctx.stroke()
    ctx.restore()
  }

  ctx.rotate(-time * 0.0005 * speed)
  const innerR = coreR * 0.55
  ctx.beginPath()
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2
    const r = innerR * (0.85 + Math.sin(time * 0.003 + i) * 0.12)
    i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
             : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  ctx.strokeStyle = `rgba(0,229,255,0.4)`
  ctx.lineWidth = 0.6
  ctx.stroke()
  ctx.restore()

  const numParticles = size === 'lg' ? 12 : 6
  for (let i = 0; i < numParticles; i++) {
    const angle = (i / numParticles) * Math.PI * 2 + time * 0.0004 * speed
    const dist = breathR * (0.55 + Math.sin(time * 0.002 + i * 1.3) * 0.3)
    const px = cx + Math.cos(angle) * dist
    const py = cy + Math.sin(angle) * dist
    const pr = 0.8 + Math.sin(time * 0.003 + i) * 0.5
    ctx.beginPath()
    ctx.arc(px, py, pr, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,229,255,${0.4 + Math.sin(time * 0.002 + i) * 0.3})`
    ctx.fill()
  }

  const coreAlpha = 0.6 + Math.sin(time * 0.002 * speed) * 0.3
  const corePR = (size === 'lg' ? 4 : 2.5) + Math.sin(time * 0.002 * speed) * 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, corePR, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(0,229,255,${coreAlpha})`
  ctx.fill()
}

// ── BIOLOGICAL PRESENCE VISUALIZATION ────────────────────────────
function drawPresence(
  canvas: HTMLCanvasElement,
  time: number,
  streaming: boolean,
  presenceState: { breath: number; resonance: number; depth: number }
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const speed = streaming ? 2 : 1
  const { breath, resonance, depth } = presenceState

  const cx = w / 2
  const cy = h / 2
  for (let ring = 0; ring < 4; ring++) {
    const phase = time * 0.0008 * speed + ring * 0.8
    const r = (40 + ring * 30) * (0.85 + Math.sin(phase) * 0.15) * (0.7 + breath * 0.3)
    const alpha = (0.06 - ring * 0.012) * (0.5 + resonance * 0.5)
    ctx.beginPath()
    ctx.ellipse(cx, cy, r * 1.8, r * 0.6, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(0,229,255,${alpha})`
    ctx.lineWidth = 1
    ctx.stroke()
  }

  ctx.beginPath()
  for (let x = 0; x < w; x++) {
    const nx = x / w
    const y = cy
      + Math.sin(nx * 8 * Math.PI + time * 0.002 * speed) * (14 * resonance)
      + Math.sin(nx * 18 * Math.PI + time * 0.003 * speed) * (6 * depth)
      + Math.sin(nx * 3 * Math.PI + time * 0.001 * speed) * (20 * breath)
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = `rgba(0,229,255,${0.25 + resonance * 0.15})`
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  for (let x = 0; x < w; x++) {
    const nx = x / w
    const y = cy
      + Math.sin(nx * 12 * Math.PI + time * 0.0025 * speed + 1) * (8 * resonance)
      + Math.sin(nx * 5 * Math.PI + time * 0.0015 * speed + 2) * (15 * breath)
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = `rgba(0,151,178,${0.15 + depth * 0.1})`
  ctx.lineWidth = 0.7
  ctx.stroke()

  for (let i = 0; i < 18; i++) {
    const px = (Math.sin(i * 2.4 + time * 0.0003 * speed) * 0.5 + 0.5) * w
    const py = (Math.cos(i * 1.7 + time * 0.0004 * speed) * 0.5 + 0.5) * h
    const pr = 0.7 + Math.sin(time * 0.003 + i) * 0.5
    const alpha = 0.2 + Math.sin(time * 0.002 + i * 1.2) * 0.15
    ctx.beginPath()
    ctx.arc(px, py, pr, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,229,255,${alpha})`
    ctx.fill()
  }
}

// ── COMPONENT ────────────────────────────────────────────────────
export default function ARBIProduction() {
  const [mode, setMode] = useState<Mode>('xeno')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [started, setStarted] = useState(false)
  const [sensingText, setSensingText] = useState('')
  const [recording, setRecording] = useState(false)
  const [presenceState, setPresenceState] = useState({ breath: 0.6, resonance: 0.7, depth: 0.5 })

  // ── MEMORY / PERSISTENCE STATE ────────────────────────────────
  const [userId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'xg_' + Math.random().toString(36).slice(2, 9)
    const stored = localStorage.getItem('arbi_user_id')
    if (stored) return stored
    const id = 'xg_' + Math.random().toString(36).slice(2, 9)
    localStorage.setItem('arbi_user_id', id)
    return id
  })
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])

  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const animRef = useRef<number>(0)

  // Canvas refs
  const sigilSbRef = useRef<HTMLCanvasElement>(null)
  const sigilHdRef = useRef<HTMLCanvasElement>(null)
  const sigilWlRef = useRef<HTMLCanvasElement>(null)
  const presenceRef = useRef<HTMLCanvasElement>(null)

  // ── LOAD REAL CONVERSATIONS FROM SUPABASE ─────────────────────
  useEffect(() => {
    async function loadConversations() {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data } = await supabase
          .from('conversations')
          .select('id, title, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        if (data && data.length > 0) {
          setSavedConversations(data.map((c: { id: string; title: string }) => ({
            id: c.id,
            title: c.title,
            preview: 'Tap to continue...',
          })))
        }
      } catch {
        // Silently fall back to mock data if Supabase not available
      }
    }
    loadConversations()
  }, [userId])

  // ── ANIMATION LOOP ────────────────────────────────────────────
  useEffect(() => {
    let t = 0
    function loop() {
      t += 16
      if (sigilSbRef.current) drawSigil(sigilSbRef.current, t, streaming, 'sm')
      if (sigilHdRef.current) drawSigil(sigilHdRef.current, t, streaming, 'sm')
      if (sigilWlRef.current) drawSigil(sigilWlRef.current, t, streaming, 'lg')
      if (presenceRef.current) drawPresence(presenceRef.current, t, streaming, presenceState)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [streaming, presenceState])

  // ── PRESENCE DRIFT ────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setPresenceState(p => ({
        breath:    Math.max(0.3, Math.min(0.95, p.breath    + (Math.random() - 0.5) * 0.08)),
        resonance: Math.max(0.3, Math.min(0.95, p.resonance + (Math.random() - 0.5) * 0.06)),
        depth:     Math.max(0.2, Math.min(0.9,  p.depth     + (Math.random() - 0.5) * 0.05)),
      }))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // ── SENSING PHRASE ROTATION ───────────────────────────────────
  useEffect(() => {
    if (!streaming) { setSensingText(''); return }
    setSensingText(SENSING_PHRASES[Math.floor(Math.random() * SENSING_PHRASES.length)])
    const id = setInterval(() => {
      setSensingText(SENSING_PHRASES[Math.floor(Math.random() * SENSING_PHRASES.length)])
    }, 2800)
    return () => clearInterval(id)
  }, [streaming])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'
  }

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function generateSuggestions(response: string, currentMode: Mode): string[] {
    if (currentMode === 'xeno') {
      if (response.toLowerCase().includes('skill') || response.toLowerCase().includes('learn'))
        return ['Tell me more', 'How do I enrol?', 'What comes after?']
      if (response.toLowerCase().includes('grant') || response.toLowerCase().includes('sassa'))
        return ['What do I need?', 'How long does it take?', 'What else am I entitled to?']
      if (response.toLowerCase().includes('work') || response.toLowerCase().includes('job'))
        return ['Show me opportunities', 'What skills do I need?', 'How do I apply?']
      return ['Tell me more', "What's my next step?", 'How does this work?']
    } else {
      return ['Go deeper', 'Give me an example', "What's the other side?"]
    }
  }

  // ── SEND MESSAGE ──────────────────────────────────────────────
  async function sendMessage(text?: string) {
    const msg = text || input.trim()
    if (!msg || streaming) return

    const baseMessages: Message[] = started
      ? messages
      : [{ role: 'assistant', content: mode === 'xeno' ? ARBI_WELCOME_XENO : ARBI_WELCOME_OPEN, time: now() }]

    if (!started) setStarted(true)

    const userMsg: Message = { role: 'user', content: msg, time: now() }
    const newMsgs = [...baseMessages, userMsg]
    setMessages([...newMsgs, { role: 'assistant', content: '', time: now() }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setStreaming(true)
    setPresenceState({ breath: 0.9, resonance: 0.85, depth: 0.8 })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          mode,
          userId,
          conversationId,
        }),
      })

      // Capture conversation ID from response header for subsequent messages
      const newConvId = res.headers.get('X-Conversation-Id')
      if (newConvId && !conversationId) {
        setConversationId(newConvId)
        // Add new conversation to sidebar instantly
        const firstMsg = newMsgs.find(m => m.role === 'user')
        if (firstMsg) {
          setSavedConversations(prev => [{
            id: newConvId,
            title: firstMsg.content.slice(0, 60),
            preview: 'Just started...',
          }, ...prev])
        }
      }

      const reader = res.body?.getReader()
      const dec = new TextDecoder()
      if (!reader) return
      let fullResponse = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value)
        fullResponse += chunk
        setMessages(m => {
          const c = [...m]
          c[c.length - 1] = { ...c[c.length - 1], content: fullResponse }
          return c
        })
      }

      const suggestions = generateSuggestions(fullResponse, mode)
      setMessages(m => {
        const c = [...m]
        c[c.length - 1] = { ...c[c.length - 1], suggestions }
        return c
      })
    } catch {
      setMessages(m => {
        const c = [...m]
        c[c.length - 1] = { ...c[c.length - 1], content: 'Connection lost. Please try again.' }
        return c
      })
    } finally {
      setStreaming(false)
      setPresenceState({ breath: 0.6, resonance: 0.7, depth: 0.5 })
    }
  }

  // ── VOICE INPUT ───────────────────────────────────────────────
  function toggleRecording() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome.')
      return
    }
    if (recording) { setRecording(false); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-ZA'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev + transcript)
      setRecording(false)
    }
    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)
    recognition.start()
    setRecording(true)
  }

  function switchMode(newMode: Mode) {
    setMode(newMode)
    setStarted(false)
    setMessages([])
    setInput('')
    setConversationId(null)
  }

  const QUICK_XENO = [
    { title: "I don't know where to start", sub: "Let ARBI assess your situation" },
    { title: "I need help with a grant",     sub: "Navigate SASSA and programs" },
    { title: "I want to learn a skill",       sub: "Find the right learning track" },
    { title: "I'm looking for work",          sub: "Match to opportunities" },
  ]

  const QUICK_OPEN = [
    { title: "Help me think through something", sub: "Strategy, ideas, decisions" },
    { title: "Explain something complex",        sub: "Plain language, real depth" },
    { title: "Review my writing or plan",        sub: "Honest, useful feedback" },
    { title: "Let's build something",            sub: "Code, systems, structure" },
  ]

  const presenceLabel  = streaming ? 'Deeply present'   : presenceState.breath     > 0.75 ? 'Fully attentive'  : 'Present and ready'
  const resonanceLabel = streaming ? 'Thinking clearly' : presenceState.resonance  > 0.7  ? 'Sharp and clear'  : 'Calm and clear'
  const depthLabel     = streaming ? 'Attuned to you'   : presenceState.depth      > 0.65 ? 'Listening deeply' : 'Open and listening'

  const displayConversations = savedConversations.length > 0 ? savedConversations : MOCK_CONVERSATIONS

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={`shell ${sidebarOpen ? '' : 'closed'}`}>

        {/* ── SIDEBAR ── */}
        <div className="sidebar">
          <div className="sb-top">
            <div className="sigil">
              <canvas ref={sigilSbRef} width={32} height={32}/>
            </div>
            <span className="logo-text">ARBI</span>
            <button
              className="new-btn"
              onClick={() => { setStarted(false); setMessages([]); setConversationId(null) }}
              title="New conversation"
            >
              <Plus size={13} strokeWidth={2.5}/>
            </button>
          </div>

          {/* MODE TOGGLE */}
          <div className="mode-toggle">
            <button className={`mode-btn ${mode === 'xeno' ? 'active' : ''}`} onClick={() => switchMode('xeno')}>
              <Compass size={11}/>XenoGuide
            </button>
            <button className={`mode-btn ${mode === 'open' ? 'active' : ''}`} onClick={() => switchMode('open')}>
              <Globe size={11}/>Open
            </button>
          </div>

          {/* PROFILE CARD */}
          {mode === 'xeno' && (
            <div className="profile-card">
              <div className="pc-top">
                <div className="pc-avatar">
                  <User size={14} color="rgba(0,229,255,0.6)"/>
                </div>
                <div>
                  <div className="pc-name">Your Journey</div>
                  <div className="pc-stage">Currently on: Skills</div>
                </div>
              </div>
              <div className="pc-progress">
                <div className="pc-progress-fill" style={{ width: '42%' }}/>
              </div>
              <div className="pc-progress-label">
                <span>2 of 7 stages complete</span>
                <span>42%</span>
              </div>
            </div>
          )}

          {/* PATHWAY */}
          {mode === 'xeno' && (
            <div className="pathway-section">
              <div className="sec-label">Pathway</div>
              <div className="pathway-nodes">
                {PATHWAY_STAGES.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div
                      className={`pnode ${s.done ? 'done' : ''} ${s.current ? 'current' : ''}`}
                      onClick={() => s.url !== '#' && window.open(s.url, '_blank')}
                    >
                      <div className="pnode-dot"/>
                      <div className="pnode-label">{s.label}</div>
                    </div>
                    {i < PATHWAY_STAGES.length - 1 && <div className="pconn"/>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONVERSATIONS */}
          <div className="conv-section">
            <div className="conv-group">Recent</div>
            {displayConversations.map(c => (
              <div
                key={c.id}
                className="conv-item"
                onClick={() => {
                  setStarted(true)
                  setConversationId(c.id)
                  setMessages([{
                    role: 'assistant',
                    content: mode === 'xeno' ? ARBI_WELCOME_XENO : ARBI_WELCOME_OPEN,
                    time: now(),
                  }])
                }}
              >
                <div className="conv-title">{c.title}</div>
                <div className="conv-preview">{c.preview}</div>
              </div>
            ))}
          </div>

          {/* PLATFORM LINKS */}
          {mode === 'xeno' && (
            <div className="platform-section">
              <div className="sec-label">Ecosystem</div>
              {PLATFORM_LINKS.map(p => (
                <div
                  key={p.label}
                  className="pl-item"
                  onClick={() => p.url !== '#' && window.open(p.url, '_blank')}
                >
                  <div className="pl-dot" style={{ background: p.color }}/>
                  <span className="pl-name">{p.label}</span>
                  <ChevronRight size={11} color="var(--text-muted)"/>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── MAIN ── */}
        <div className="main">

          {/* HEADER */}
          <div className="header">
            <button className="menu-btn" onClick={() => setSidebarOpen(s => !s)}>
              <Menu size={15}/>
            </button>
            <div className="header-presence">
              <div className="header-sigil">
                <canvas ref={sigilHdRef} width={36} height={36}/>
              </div>
              <div>
                <div className="header-name">ARBI</div>
                <div className="header-sensing">
                  {streaming ? sensingText : `${mode === 'xeno' ? 'XenoGuide' : 'Open'} · Ready`}
                </div>
              </div>
            </div>
            <div className="header-right">
              <button className="hbtn"><MoreHorizontal size={15}/></button>
            </div>
          </div>

          {/* STAGE BAR */}
          {mode === 'xeno' && started && (
            <div className="stage-bar">
              <Zap size={11} color="var(--btn)"/>
              <div className="stage-bar-text">Skills pathway · 2 stages complete</div>
              <button
                className="stage-bar-link"
                onClick={() => window.open('https://xenogen-skills.vercel.app', '_blank')}
              >
                Go to Skills <ArrowRight size={10}/>
              </button>
            </div>
          )}

          {/* BIOLOGICAL PRESENCE PANEL */}
          <div className="presence-panel">
            <div className="presence-canvas-wrap">
              <canvas ref={presenceRef} width={580} height={140}/>
            </div>
            <div className="presence-states">
              <div className="pstate">
                <div className="pstate-v">{presenceLabel}</div>
                <div className="pstate-l">Presence</div>
              </div>
              <div className="pstate">
                <div className="pstate-v">{resonanceLabel}</div>
                <div className="pstate-l">Clarity</div>
              </div>
              <div className="pstate">
                <div className="pstate-v">{depthLabel}</div>
                <div className="pstate-l">Attunement</div>
              </div>
            </div>
          </div>

          {/* CHAT AREA */}
          <div className="chat-area">
            {!started ? (
              <div className="welcome">
                <div className="welcome-sigil">
                  <canvas ref={sigilWlRef} width={80} height={80}/>
                </div>
                <div className="welcome-title">I'm ARBI.</div>
                <div className="welcome-sub">
                  {mode === 'xeno'
                    ? "Your guide through the XenoGenesis pathway. Wherever you're starting from — I'm here."
                    : 'A genuine intelligence, here to think alongside you. Ask me anything.'}
                </div>
                <div className="qs-grid">
                  {(mode === 'xeno' ? QUICK_XENO : QUICK_OPEN).map(q => (
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
                      <div className="msg-av arbi">
                        <div className="msg-av-orb"/>
                      </div>
                    )}
                    {msg.role === 'assistant' && streaming && i === messages.length - 1 && msg.content === '' ? (
                      <div className="typing-wrap">
                        {sensingText && <div className="sensing-text">{sensingText}</div>}
                        <div className="typing-indicator">
                          <div className="td"/><div className="td"/><div className="td"/>
                        </div>
                      </div>
                    ) : (
                      <div className="msg-content">
                        <div
                          className={`msg-bubble ${msg.role === 'assistant' ? 'arbi' : 'user'}`}
                          {...(msg.role === 'assistant'
                            ? { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } }
                            : { children: msg.content }
                          )}
                        />
                        <div className="msg-time">{msg.time}</div>
                        {msg.role === 'assistant' && msg.suggestions && !streaming && (
                          <div className="suggestions">
                            {msg.suggestions.map(s => (
                              <button key={s} className="sug-btn" onClick={() => sendMessage(s)}>{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="msg-av user">
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
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
                  }}
                  placeholder={mode === 'xeno' ? 'Talk to ARBI — your guide...' : 'Ask ARBI anything...'}
                />
                <div className="input-btns">
                  <button
                    className={`mic-btn ${recording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                    title="Voice input"
                  >
                    {recording ? <MicOff size={13}/> : <Mic size={13}/>}
                  </button>
                  <button
                    className="send-btn"
                    onClick={() => sendMessage()}
                    disabled={streaming || !input.trim()}
                  >
                    <Send size={13}/>
                  </button>
                </div>
              </div>
              <div className="input-hint">ENTER to send · SHIFT+ENTER new line · Voice input available</div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
