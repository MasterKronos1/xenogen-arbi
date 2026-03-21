'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, ChevronRight, Send, Menu, Zap,
  MoreHorizontal, ArrowRight, Mic, MicOff,
  User, Globe, BookOpen, ShoppingBag, Briefcase,
  Compass, LogOut, Brain, X,
} from 'lucide-react'
import {
  getUserConversations, getUserMemory, getOrCreateUser,
  resolvePathway, getPathwayProgress,
  type UserProfile, type Memory, type Conversation,
} from '@/lib/user'
import { getUser, signOut } from '@/lib/auth'
import { getUrlForStage } from '@/lib/ecosystem'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ── ARBI IDENTITY ─────────────────────────────────────────────────
const ARBI_WELCOME_XENO = (name?: string | null) =>
  name
    ? `Welcome back, ${name}. Ready to keep moving?\n\nWherever we left off — I remember. Tell me what's on your mind.`
    : `I'm ARBI — your guide through the XenoGenesis pathway.\n\nWherever you're starting from — I'm here to walk that road with you.\n\nNo judgement. No rush. One step at a time.\n\nTell me a bit about where you are right now.`

const ARBI_WELCOME_OPEN = `I'm ARBI — Artificial Biological & Reconnaissance Intelligence.\n\nI'm here to think alongside you — whatever you need. Direct, warm, no wasted time.\n\nWhat's on your mind?`

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
type Mode    = 'xeno' | 'open' | 'agents'
type Message = { role: 'user' | 'assistant'; content: string; time?: string; suggestions?: string[] }

const PLATFORM_LINKS = [
  { label: 'XenoGen Skills',   color: '#00e5ff', url: 'https://xenogen-skills.vercel.app', icon: <BookOpen size={12}/> },
  { label: 'Guuz Marketplace', color: '#f0c040', url: '/guuz',                              icon: <ShoppingBag size={12}/> },
  { label: 'Career Engine',    color: '#40c4ff', url: '#',                                  icon: <Briefcase size={12}/> },
]

const MEMORY_LABELS: Record<string, string> = {
  pathway_interest:    'Pathway interest',
  emotional_state:     'Emotional state',
  current_stage:       'Current stage',
  situation:           'Situation',
  primary_goal:        'Primary goal',
  occupation_interest: 'Occupation interest',
}

// ── MARKDOWN ──────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/^- (.+)$/gm,   '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g,   '<br/>')
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
    --sidebar-w:  268px;
  }

  html, body { height: 100%; overflow: hidden; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-sans); font-size: 14px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
  ::selection { background: rgba(0,229,255,.15); color: var(--accent); }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* ── LAYOUT ── */
  .shell { display: grid; grid-template-columns: var(--sidebar-w) 1fr; height: 100vh; position: relative; }

  /* ── SIDEBAR ── */
  .sidebar {
    background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; overflow: hidden;
    transition: transform 0.25s ease;
    position: relative; z-index: 10;
  }
  .sb-top { padding: 14px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .sigil { width: 32px; height: 32px; flex-shrink: 0; position: relative; }
  .sigil canvas { position: absolute; inset: 0; }
  .logo-text { font-family: var(--font-serif); font-weight: 700; font-size: 0.95rem; color: var(--text); flex: 1; letter-spacing: 0.5px; }
  .new-btn { width: 28px; height: 28px; background: var(--accent-soft); border: 1px solid rgba(0,229,255,.2); border-radius: var(--r); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--btn); flex-shrink: 0; transition: all 0.2s; }
  .new-btn:hover { background: rgba(0,229,255,.18); }

  .mode-toggle { margin: 12px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border-radius: var(--r); overflow: hidden; flex-shrink: 0; }
  .mode-btn { padding: 8px 6px; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.5px; cursor: pointer; border: none; background: var(--surface2); color: var(--text-dim); font-family: var(--font-sans); transition: all 0.2s; }
  .mode-btn.active { background: var(--accent-soft); color: var(--accent); }
  .mode-btn:first-child { border-radius: var(--r) 0 0 var(--r); }
  .mode-btn:last-child  { border-radius: 0 var(--r) var(--r) 0; }

  .profile-card { margin: 0 12px 12px; padding: 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r-lg); flex-shrink: 0; }
  .pc-top { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
  .pc-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,rgba(0,229,255,.15),rgba(0,151,178,.2)); border: 1.5px solid rgba(0,229,255,.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .pc-name  { font-size: 0.82rem; font-weight: 600; color: var(--text); }
  .pc-stage { font-size: 0.62rem; color: var(--text-dim); margin-top: 1px; }
  .pc-progress { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
  .pc-progress-fill { height: 100%; background: linear-gradient(90deg,var(--btn),var(--accent)); border-radius: 2px; transition: width 0.6s ease; }
  .pc-progress-label { font-size: 0.58rem; color: var(--text-muted); display: flex; justify-content: space-between; }

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
  .pnode.done .pnode-label    { color: var(--text-dim); }
  .pnode.current .pnode-label { color: var(--accent); }
  .pconn { width: 8px; height: 1px; background: var(--border); flex-shrink: 0; margin-bottom: 10px; }

  .conv-section { flex: 1; overflow-y: auto; padding: 10px 8px; }
  .conv-group { font-size: 0.56rem; font-weight: 600; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 8px; }
  .conv-item { padding: 8px 10px; border-radius: var(--r); cursor: pointer; transition: background 0.15s; margin-bottom: 1px; }
  .conv-item:hover { background: var(--surface2); }
  .conv-item.active { background: var(--accent-soft); border: 1px solid rgba(0,229,255,.1); }
  .conv-title   { font-size: 0.78rem; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
  .conv-preview { font-size: 0.66rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .platform-section { padding: 10px 8px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .pl-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: var(--r); cursor: pointer; transition: background 0.15s; }
  .pl-item:hover { background: var(--surface2); }
  .pl-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .pl-name { font-size: 0.72rem; font-weight: 500; color: var(--text-dim); flex: 1; }

  .signout-btn { margin: 0 8px 12px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; border-radius: var(--r); cursor: pointer; border: none; background: none; font-family: var(--font-sans); color: var(--text-muted); font-size: 0.72rem; width: calc(100% - 16px); transition: all 0.15s; }
  .signout-btn:hover { background: var(--surface2); color: var(--text-dim); }

  /* ── MAIN ── */
  .main { display: flex; flex-direction: column; overflow: hidden; background: var(--bg); min-width: 0; }

  .header { height: 54px; display: flex; align-items: center; padding: 0 18px; gap: 12px; border-bottom: 1px solid var(--border); background: rgba(4,14,20,0.95); backdrop-filter: blur(16px); flex-shrink: 0; }
  .menu-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-dim); border: none; background: none; border-radius: var(--r); transition: all 0.15s; flex-shrink: 0; }
  .menu-btn:hover { background: var(--surface); color: var(--text); }
  .header-presence { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
  .header-sigil { width: 36px; height: 36px; position: relative; flex-shrink: 0; }
  .header-sigil canvas { position: absolute; inset: 0; }
  .header-name    { font-family: var(--font-serif); font-weight: 700; font-size: 1rem; color: var(--text); }
  .header-sensing { font-size: 0.62rem; color: var(--text-dim); font-style: italic; min-height: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header-right { margin-left: auto; display: flex; gap: 6px; flex-shrink: 0; }
  .hbtn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-dim); border-radius: var(--r); border: none; background: none; transition: all 0.15s; }
  .hbtn:hover  { background: var(--surface); color: var(--text); }
  .hbtn.active { color: var(--accent); }

  .stage-bar { padding: 7px 18px; background: var(--accent-soft); border-bottom: 1px solid rgba(0,229,255,.1); display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .stage-bar-text { font-size: 0.68rem; color: var(--btn); font-weight: 500; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .stage-bar-link { font-size: 0.66rem; color: var(--btn); cursor: pointer; display: flex; align-items: center; gap: 3px; font-weight: 600; background: none; border: none; font-family: var(--font-sans); flex-shrink: 0; }

  .presence-panel { padding: 0 20px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
  .presence-canvas-wrap { position: relative; width: 100%; max-width: 580px; height: 140px; }
  .presence-canvas-wrap canvas { position: absolute; inset: 0; width: 100% !important; }
  .presence-states { display: flex; justify-content: center; gap: 24px; padding: 8px 0 12px; border-bottom: 1px solid var(--border); width: 100%; max-width: 580px; }
  .pstate   { text-align: center; }
  .pstate-v { font-family: var(--font-serif); font-weight: 700; font-size: 0.95rem; color: var(--accent); line-height: 1; margin-bottom: 2px; }
  .pstate-l { font-size: 0.48rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

  .obs-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 14px 16px; margin: 10px 18px 0; flex-shrink: 0; }
  .obs-title { font-size: 0.6rem; font-weight: 600; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .obs-grid  { display: flex; flex-wrap: wrap; gap: 6px; }
  .obs-tag   { padding: 3px 10px; background: var(--accent-soft); border: 1px solid rgba(0,229,255,.15); border-radius: 100px; font-size: 0.64rem; color: var(--text-dim); }
  .obs-tag span { color: var(--accent); font-weight: 500; }
  .obs-empty { font-size: 0.72rem; color: var(--text-muted); font-style: italic; }

  .chat-area { flex: 1; overflow-y: auto; padding: 20px 18px; display: flex; flex-direction: column; gap: 16px; }
  .chat-area::-webkit-scrollbar { width: 3px; }

  .welcome { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 32px 20px; gap: 16px; margin: auto; max-width: 520px; width: 100%; }
  .welcome-sigil { width: 80px; height: 80px; position: relative; margin: 0 auto 8px; }
  .welcome-sigil canvas { position: absolute; inset: 0; width: 100% !important; height: 100% !important; }
  .welcome-title { font-family: var(--font-serif); font-weight: 900; font-size: 2rem; color: #e0f0f8; letter-spacing: -0.5px; }
  .welcome-sub   { font-size: 0.875rem; color: var(--text-dim); line-height: 1.75; }
  .qs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; margin-top: 8px; }
  .qs-btn  { padding: 11px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); cursor: pointer; text-align: left; transition: all 0.2s; font-family: var(--font-sans); }
  .qs-btn:hover { border-color: var(--btn); background: var(--accent-soft); }
  .qs-title { font-size: 0.76rem; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .qs-sub   { font-size: 0.64rem; color: var(--text-dim); line-height: 1.4; }

  .msg { display: flex; gap: 10px; animation: mIn 0.22s ease; max-width: 100%; }
  .msg.user { flex-direction: row-reverse; align-self: flex-end; max-width: 74%; }
  @keyframes mIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  .msg-av { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; align-self: flex-start; margin-top: 2px; }
  .msg-av.arbi { background: rgba(0,229,255,.08); border: 1.5px solid rgba(0,229,255,.25); }
  .msg-av-orb  { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); animation: oPulse 2.5s ease-in-out infinite; }
  @keyframes oPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
  .msg-av.user { background: var(--surface); border: 1px solid var(--border2); }
  .msg-content { display: flex; flex-direction: column; gap: 6px; max-width: 100%; min-width: 0; }
  .msg-bubble  { padding: 11px 15px; border-radius: var(--r-lg); font-size: 0.862rem; line-height: 1.75; }
  .msg-bubble.arbi { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-bottom-left-radius: 4px; }
  .msg-bubble.user { background: rgba(0,229,255,.08); border: 1px solid rgba(0,229,255,.18); color: var(--text); border-bottom-right-radius: 4px; }
  .msg-bubble strong { color: var(--text); font-weight: 600; }
  .msg-bubble em { color: var(--text-dim); font-style: italic; }
  .msg-bubble h1,.msg-bubble h2,.msg-bubble h3 { font-family: var(--font-serif); font-weight: 700; color: #e0f0f8; margin: 8px 0 4px; }
  .msg-bubble h1{font-size:1.1rem}.msg-bubble h2{font-size:1rem}.msg-bubble h3{font-size:.9rem}
  .msg-bubble ul { padding-left: 18px; margin: 6px 0; }
  .msg-bubble li { margin-bottom: 4px; }
  .msg-bubble code { background: rgba(0,229,255,.08); border: 1px solid rgba(0,229,255,.15); padding: 1px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent); }
  .msg-bubble pre { background: rgba(0,0,0,.3); border: 1px solid var(--border2); border-radius: var(--r); padding: 12px; margin: 8px 0; overflow-x: auto; }
  .msg-bubble pre code { background: none; border: none; padding: 0; font-size: 0.78rem; color: var(--text-dim); }
  .msg-bubble p { margin-bottom: 6px; }
  .msg-bubble p:last-child { margin-bottom: 0; }
  .msg-time { font-size: 0.58rem; color: var(--text-muted); padding: 0 3px; }

  .suggestions { display: flex; gap: 6px; flex-wrap: wrap; }
  .sug-btn { padding: 5px 12px; background: transparent; border: 1px solid var(--border2); border-radius: 100px; font-size: 0.68rem; color: var(--text-dim); cursor: pointer; font-family: var(--font-sans); transition: all 0.2s; }
  .sug-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

  .typing-wrap { display: flex; flex-direction: column; gap: 6px; }
  .sensing-text { font-size: 0.64rem; color: var(--text-dim); font-style: italic; animation: sFade 0.5s ease; padding: 0 4px; }
  @keyframes sFade { from{opacity:0} to{opacity:1} }
  .typing-indicator { display: flex; gap: 4px; padding: 12px 15px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); border-bottom-left-radius: 4px; width: fit-content; }
  .td { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); animation: td 1.2s ease-in-out infinite; }
  .td:nth-child(2){animation-delay:.2s}.td:nth-child(3){animation-delay:.4s}
  @keyframes td{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-4px);opacity:1}}

  .input-section { padding: 12px 18px 16px; border-top: 1px solid var(--border); background: var(--bg); flex-shrink: 0; }
  .input-inner { max-width: 740px; margin: 0 auto; }
  .input-wrap { display: flex; align-items: flex-end; gap: 8px; background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r-lg); padding: 9px 10px 9px 14px; transition: border-color 0.2s; }
  .input-wrap:focus-within { border-color: var(--btn); }
  textarea { flex: 1; background: transparent; border: none; color: var(--text); font-family: var(--font-sans); font-size: 0.875rem; outline: none; resize: none; line-height: 1.6; max-height: 130px; padding: 0; }
  textarea::placeholder { color: var(--text-muted); }
  .input-btns { display: flex; gap: 5px; flex-shrink: 0; }
  .mic-btn  { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); background: none; border-radius: var(--r); cursor: pointer; color: var(--text-dim); transition: all 0.2s; }
  .mic-btn.recording { border-color: #e55039; color: #e55039; background: rgba(229,80,57,.08); animation: micPulse 1s ease-in-out infinite; }
  @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(229,80,57,.3)} 50%{box-shadow:0 0 0 4px rgba(229,80,57,0)} }
  .send-btn { width: 32px; height: 32px; background: var(--btn); color: #fff; border: none; border-radius: var(--r); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
  .send-btn:hover    { background: var(--btn-hover); }
  .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .input-hint { font-size: 0.6rem; color: var(--text-muted); text-align: center; margin-top: 7px; }

  .loading-shell { height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
  .loading-orb   { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--accent); animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── MOBILE ── */
  /* ── IMAGE GEN WIDGET ── */
  .gen-widget { border-radius: var(--r-lg); overflow: hidden; border: 1px solid var(--border); background: var(--surface2); max-width: 520px; }
  .gen-widget-processing { padding: 32px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .gen-widget-spinner { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--border2); border-top-color: var(--accent); animation: spin 0.8s linear infinite; }
  .gen-widget-label { font-size: 0.78rem; color: var(--text-dim); }
  .gen-widget-prompt { font-size: 0.65rem; color: var(--text-muted); font-style: italic; max-width: 300px; line-height: 1.5; }
  .gen-widget-img { width: 100%; display: block; max-height: 440px; object-fit: cover; cursor: zoom-in; }
  .gen-widget-actions { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid var(--border); flex-wrap: wrap; background: var(--surface); }
  .gen-widget-btn { padding: 6px 14px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 100px; font-size: 0.68rem; color: var(--text-dim); cursor: pointer; font-family: var(--font-sans); transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
  .gen-widget-btn:hover { border-color: var(--btn); color: var(--btn); }
  .gen-widget-btn.primary { background: rgba(0,151,178,0.15); border-color: var(--btn); color: var(--btn); }
  .gen-widget-error { padding: 20px 24px; font-size: 0.75rem; color: #e55039; text-align: center; }

  /* ── AGENTS SLIDE PANEL ── */
  .agents-panel {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: 480px; z-index: 200;
    background: var(--surface);
    border-left: 1px solid var(--border);
    display: flex; flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    box-shadow: -8px 0 32px rgba(0,0,0,0.4);
  }
  .agents-panel.open { transform: translateX(0); }
  .agents-panel-overlay {
    display: none; position: fixed; inset: 0; z-index: 199;
    background: rgba(0,0,0,0.3); backdrop-filter: blur(2px);
  }
  .agents-panel-overlay.visible { display: block; }
  .agents-panel-header {
    height: 54px; display: flex; align-items: center; padding: 0 18px;
    border-bottom: 1px solid var(--border); gap: 10px; flex-shrink: 0;
  }
  .agents-panel-title { font-family: var(--font-serif); font-weight: 700; font-size: 0.95rem; color: var(--text); flex: 1; }
  .agents-close { width: 28px; height: 28px; background: none; border: none; cursor: pointer; color: var(--text-dim); border-radius: var(--r); display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .agents-close:hover { background: var(--surface2); color: var(--text); }

  /* Agent canvas area */
  .agent-canvas-area { height: 180px; position: relative; border-bottom: 1px solid var(--border); flex-shrink: 0; background: #020c10; overflow: hidden; }
  .agent-canvas-area canvas { position: absolute; inset: 0; width: 100% !important; height: 100% !important; }

  /* ── CODE SPLIT PANEL ── */
  .main-with-code { display: grid !important; grid-template-columns: 1fr 420px; }
  .code-panel {
    border-left: 1px solid var(--border);
    display: flex; flex-direction: column;
    background: #020c10; overflow: hidden;
  }
  .code-panel-header {
    height: 42px; display: flex; align-items: center; padding: 0 14px;
    border-bottom: 1px solid var(--border); gap: 8px; flex-shrink: 0;
    background: var(--surface);
  }
  .code-lang-badge { font-size: 0.6rem; padding: 2px 8px; background: var(--accent-soft); border: 1px solid rgba(0,229,255,0.15); border-radius: 100px; color: var(--accent); font-family: var(--font-mono); }
  .code-panel-actions { display: flex; gap: 4px; margin-left: auto; }
  .code-action { padding: 4px 10px; background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--r); font-size: 0.65rem; color: var(--text-dim); cursor: pointer; font-family: var(--font-sans); transition: all 0.15s; white-space: nowrap; }
  .code-action:hover { border-color: var(--btn); color: var(--btn); }
  .code-action.run { background: rgba(0,151,178,0.15); border-color: var(--btn); color: var(--btn); }
  .code-action.run:hover { background: rgba(0,151,178,0.25); }
  .code-action:disabled { opacity: 0.4; cursor: not-allowed; }
  .code-editor {
    flex: 1; overflow-y: auto; padding: 16px;
    font-family: var(--font-mono); font-size: 0.75rem;
    line-height: 1.7; color: #7ab87a;
    white-space: pre; overflow-x: auto;
  }
  .code-editor::-webkit-scrollbar { width: 3px; }
  .code-output-section { border-top: 1px solid var(--border); flex-shrink: 0; }
  .code-output-header { padding: 6px 14px; font-size: 0.58rem; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 6px; }
  .code-output { padding: 12px 16px; font-family: var(--font-mono); font-size: 0.72rem; color: #4a8a6a; line-height: 1.6; max-height: 160px; overflow-y: auto; min-height: 48px; }
  .code-output.error { color: #e55039; }
  .code-running { display: flex; gap: 4px; padding: 14px 16px; }
  .cr { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); animation: td 1.2s ease-in-out infinite; }
  .cr:nth-child(2){animation-delay:.2s} .cr:nth-child(3){animation-delay:.4s}

  /* ── AGENTS TAB ── */
  .agents-shell { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .agents-split { flex: 1; display: grid; grid-template-columns: 320px 1fr; overflow: hidden; gap: 0; }

  /* Agent nodes visualizer */
  .agent-viz { background: var(--surface); border-right: 1px solid var(--border); padding: 24px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
  .agent-viz-title { font-size: 0.58rem; font-weight: 600; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; }
  .agent-nodes { display: flex; flex-direction: column; gap: 0; position: relative; }
  .agent-node { padding: 16px; border-radius: var(--r-lg); border: 1px solid var(--border); background: var(--surface2); display: flex; align-items: flex-start; gap: 12px; transition: all 0.3s; position: relative; }
  .agent-node.active { border-color: var(--accent); background: var(--accent-soft); }
  .agent-node.done   { border-color: var(--border2); opacity: 0.7; }
  .agent-connector { width: 1px; height: 20px; background: var(--border); margin: 0 auto; }
  .agent-symbol { font-size: 1.2rem; color: var(--text-muted); line-height: 1; margin-top: 2px; flex-shrink: 0; transition: color 0.3s; }
  .agent-node.active .agent-symbol { color: var(--accent); animation: agentPulse 1s ease-in-out infinite; }
  @keyframes agentPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .agent-info { flex: 1; min-width: 0; }
  .agent-name { font-size: 0.78rem; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .agent-role { font-size: 0.65rem; color: var(--text-dim); line-height: 1.4; }
  .agent-status { font-size: 0.58rem; color: var(--accent); margin-top: 4px; font-style: italic; }
  .agent-node.active .agent-thinking { display: flex; gap: 3px; margin-top: 6px; }
  .agent-thinking { display: none; }
  .at { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); animation: td 1.2s ease-in-out infinite; }
  .at:nth-child(2){animation-delay:.2s}.at:nth-child(3){animation-delay:.4s}

  /* CMD Terminal */
  .cmd-shell { display: flex; flex-direction: column; overflow: hidden; background: #020c10; }
  .cmd-header { padding: 8px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; background: var(--surface); flex-shrink: 0; }
  .cmd-dot { width: 10px; height: 10px; border-radius: 50%; }
  .cmd-title { font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono); margin-left: 4px; }
  .cmd-log { flex: 1; overflow-y: auto; padding: 16px; font-family: var(--font-mono); font-size: 0.72rem; line-height: 1.8; color: #4a8a6a; display: flex; flex-direction: column; gap: 2px; }
  .cmd-log::-webkit-scrollbar { width: 3px; }
  .cmd-line { display: flex; gap: 8px; animation: cmdIn 0.15s ease; white-space: pre-wrap; word-break: break-word; }
  @keyframes cmdIn { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
  .cmd-prompt { color: #00e5ff; flex-shrink: 0; }
  .cmd-agent  { color: #f0c040; flex-shrink: 0; }
  .cmd-text   { color: #7ab87a; flex: 1; }
  .cmd-system { color: #4a6a7a; }
  .cmd-final  { color: #c8dde8; }
  .cmd-error  { color: #e55039; }
  .cmd-input-row { padding: 10px 16px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 8px; background: var(--surface); flex-shrink: 0; }
  .cmd-prompt-label { color: #00e5ff; font-family: var(--font-mono); font-size: 0.72rem; flex-shrink: 0; }
  .cmd-input-field { flex: 1; background: transparent; border: none; color: #7ab87a; font-family: var(--font-mono); font-size: 0.72rem; outline: none; }
  .cmd-input-field::placeholder { color: #1a3040; }
  .cmd-run-btn { padding: 5px 12px; background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2); border-radius: var(--r); font-size: 0.65rem; color: var(--accent); cursor: pointer; font-family: var(--font-mono); transition: all 0.15s; }
  .cmd-run-btn:hover { background: rgba(0,229,255,0.18); }
  .cmd-run-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* Agent task input */
  .agent-task-input { padding: 16px; border-top: 1px solid var(--border); background: var(--bg); display: flex; gap: 8px; flex-shrink: 0; }
  .agent-task-field { flex: 1; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r-lg); color: var(--text); font-family: var(--font-sans); font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
  .agent-task-field:focus { border-color: var(--btn); }
  .agent-task-field::placeholder { color: var(--text-muted); }
  .agent-run-btn { padding: 10px 18px; background: var(--btn); border: none; border-radius: var(--r-lg); color: #fff; font-family: var(--font-sans); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
  .agent-run-btn:hover { background: var(--btn-hover); }
  .agent-run-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Message actions */
  .msg-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
  .msg-content:hover .msg-actions { opacity: 1; }
  .msg-action-btn { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; color: var(--text-muted); border-radius: 4px; transition: all 0.15s; font-size: 0.65rem; }
  .msg-action-btn:hover { background: var(--surface2); color: var(--text-dim); }

  /* Generative widgets */
  .gen-image-wrap { border-radius: var(--r-lg); overflow: hidden; border: 1px solid var(--border); background: var(--surface2); }
  .gen-image { width: 100%; display: block; max-height: 400px; object-fit: cover; }
  .gen-image-loading { padding: 40px; text-align: center; color: var(--text-muted); font-size: 0.78rem; }
  .gen-actions { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid var(--border); flex-wrap: wrap; }
  .gen-action { padding: 4px 12px; background: var(--surface); border: 1px solid var(--border2); border-radius: 100px; font-size: 0.65rem; color: var(--text-dim); cursor: pointer; transition: all 0.15s; font-family: var(--font-sans); }
  .gen-action:hover { border-color: var(--btn); color: var(--btn); }

  @keyframes heartbeat {
    0%,100% { transform: scale(1); }
    15%      { transform: scale(1.25); }
    30%      { transform: scale(1); }
    45%      { transform: scale(1.15); }
  }

  /* Hide old presence panel styles on mobile too */
  .presence-panel { display: none !important; }

  @media (max-width: 680px) {
    .shell { grid-template-columns: 1fr; }

    .sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: var(--sidebar-w); z-index: 100;
      transform: translateX(-100%);
      box-shadow: 4px 0 24px rgba(0,0,0,0.4);
    }
    .sidebar.open { transform: translateX(0); }

    .sidebar-overlay {
      display: none; position: fixed; inset: 0; z-index: 99;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);
    }
    .sidebar-overlay.visible { display: block; }

    .presence-panel { display: none; }
    .obs-panel      { display: none; }
    .qs-grid        { grid-template-columns: 1fr; }
    .msg.user       { max-width: 88%; }
    .welcome-title  { font-size: 1.5rem; }
    .input-hint     { display: none; }
    .stage-bar-link { display: none; }
  }
`

// ── SIGIL RENDERER ────────────────────────────────────────────────
function drawSigil(canvas: HTMLCanvasElement, time: number, streaming: boolean, size: 'sm' | 'lg') {
  const ctx = canvas.getContext('2d'); if (!ctx) return
  const w = canvas.width, h = canvas.height
  ctx.clearRect(0, 0, w, h)
  const cx = w/2, cy = h/2, baseR = size==='lg' ? w*0.28 : w*0.32, speed = streaming ? 2.5 : 1
  const breathR = baseR + Math.sin(time*0.001*speed) * (size==='lg' ? 8 : 4)
  ctx.beginPath(); ctx.arc(cx,cy,breathR,0,Math.PI*2); ctx.strokeStyle=`rgba(0,229,255,${0.12+Math.sin(time*0.001)*0.06})`; ctx.lineWidth=0.8; ctx.stroke()
  ctx.beginPath(); ctx.arc(cx,cy,breathR*0.72,0,Math.PI*2); ctx.strokeStyle=`rgba(0,229,255,${0.18+Math.sin(time*0.0015)*0.08})`; ctx.lineWidth=0.6; ctx.stroke()
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(time*0.0003*speed)
  const coreR = baseR*0.42
  for (let t=0;t<3;t++) {
    ctx.save(); ctx.rotate((t/3)*Math.PI*2); ctx.beginPath()
    for (let i=0;i<=3;i++){const a=(i/3)*Math.PI*2-Math.PI/2,r=coreR*(0.8+Math.sin(time*0.002+t)*0.1);i===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}
    ctx.strokeStyle=`rgba(0,229,255,${0.25+t*0.08})`; ctx.lineWidth=0.7; ctx.stroke(); ctx.restore()
  }
  ctx.rotate(-time*0.0005*speed)
  const innerR=coreR*0.55; ctx.beginPath()
  for(let i=0;i<=6;i++){const a=(i/6)*Math.PI*2-Math.PI/2,r=innerR*(0.85+Math.sin(time*0.003+i)*0.12);i===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}
  ctx.strokeStyle=`rgba(0,229,255,0.4)`; ctx.lineWidth=0.6; ctx.stroke(); ctx.restore()
  for(let i=0;i<(size==='lg'?12:6);i++){
    const angle=(i/(size==='lg'?12:6))*Math.PI*2+time*0.0004*speed
    const dist=breathR*(0.55+Math.sin(time*0.002+i*1.3)*0.3)
    ctx.beginPath(); ctx.arc(cx+Math.cos(angle)*dist,cy+Math.sin(angle)*dist,0.8+Math.sin(time*0.003+i)*0.5,0,Math.PI*2)
    ctx.fillStyle=`rgba(0,229,255,${0.4+Math.sin(time*0.002+i)*0.3})`; ctx.fill()
  }
  ctx.beginPath(); ctx.arc(cx,cy,(size==='lg'?4:2.5)+Math.sin(time*0.002*speed)*1.5,0,Math.PI*2)
  ctx.fillStyle=`rgba(0,229,255,${0.6+Math.sin(time*0.002*speed)*0.3})`; ctx.fill()
}

function drawPresence(canvas: HTMLCanvasElement, time: number, streaming: boolean, ps: {breath:number;resonance:number;depth:number}) {
  const ctx = canvas.getContext('2d'); if (!ctx) return
  const w=canvas.width, h=canvas.height; ctx.clearRect(0,0,w,h)
  const speed=streaming?2:1, cx=w/2, cy=h/2
  for(let ring=0;ring<4;ring++){
    const phase=time*0.0008*speed+ring*0.8, r=(40+ring*30)*(0.85+Math.sin(phase)*0.15)*(0.7+ps.breath*0.3)
    ctx.beginPath(); ctx.ellipse(cx,cy,r*1.8,r*0.6,0,0,Math.PI*2)
    ctx.strokeStyle=`rgba(0,229,255,${(0.06-ring*0.012)*(0.5+ps.resonance*0.5)})`; ctx.lineWidth=1; ctx.stroke()
  }
  ctx.beginPath()
  for(let x=0;x<w;x++){
    const nx=x/w, y=cy+Math.sin(nx*8*Math.PI+time*0.002*speed)*(14*ps.resonance)+Math.sin(nx*18*Math.PI+time*0.003*speed)*(6*ps.depth)+Math.sin(nx*3*Math.PI+time*0.001*speed)*(20*ps.breath)
    x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)
  }
  ctx.strokeStyle=`rgba(0,229,255,${0.25+ps.resonance*0.15})`; ctx.lineWidth=1; ctx.stroke()
  for(let i=0;i<18;i++){
    ctx.beginPath(); ctx.arc((Math.sin(i*2.4+time*0.0003*speed)*0.5+0.5)*w,(Math.cos(i*1.7+time*0.0004*speed)*0.5+0.5)*h,0.7+Math.sin(time*0.003+i)*0.5,0,Math.PI*2)
    ctx.fillStyle=`rgba(0,229,255,${0.2+Math.sin(time*0.002+i*1.2)*0.15})`; ctx.fill()
  }
}

// ── GEN IMAGE WIDGET ─────────────────────────────────────────────
function GenImageWidget({ url, prompt }: { url: string; prompt?: string }) {
  const [loaded, setLoaded]   = useState(false)
  const [errored, setErrored] = useState(false)
  const [zoomed, setZoomed]   = useState(false)

  async function handleDownload() {
    try {
      const res  = await fetch(url)
      const blob = await res.blob()
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = 'arbi-image.jpg'
      a.click()
    } catch {
      window.open(url, '_blank')
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Generated by ARBI', url })
        return
      } catch { /* fall through */ }
    }
    navigator.clipboard.writeText(url)
    alert('Image URL copied to clipboard')
  }

  return (
    <div className="gen-widget">
      {errored ? (
        <div className="gen-widget-error">
          Image generation failed. Pollinations may be busy — try again.
        </div>
      ) : (
        <>
          {!loaded && (
            <div className="gen-widget-processing">
              <div className="gen-widget-spinner"/>
              <div className="gen-widget-label">Rendering image...</div>
              {prompt && <div className="gen-widget-prompt">"{prompt.slice(0, 80)}{prompt.length > 80 ? '...' : ''}"</div>}
            </div>
          )}
          <img
            src={url}
            alt={prompt || 'Generated image'}
            className="gen-widget-img"
            style={{display: loaded ? 'block' : 'none'}}
            onLoad={()=>setLoaded(true)}
            onError={()=>{setLoaded(true);setErrored(true)}}
            onClick={()=>setZoomed(z=>!z)}
          />
          {zoomed && (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}
              onClick={()=>setZoomed(false)}>
              <img src={url} style={{maxWidth:'90vw',maxHeight:'90vh',objectFit:'contain',borderRadius:'var(--r-lg)'}}/>
            </div>
          )}
        </>
      )}
      {loaded && !errored && (
        <div className="gen-widget-actions">
          <button className="gen-widget-btn primary" onClick={handleDownload}>↓ Download</button>
          <button className="gen-widget-btn" onClick={handleShare}>↗ Share</button>
          <button className="gen-widget-btn" onClick={()=>navigator.clipboard.writeText(url)}>⎘ Copy URL</button>
          <button className="gen-widget-btn" onClick={()=>window.open(url,'_blank')}>⤢ Full size</button>
        </div>
      )}
    </div>
  )
}

// ── COMPONENT ────────────────────────────────────────────────────
export default function ARBIProduction() {
  const [mode, setMode]               = useState<Mode>('xeno')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState('')
  const [streaming, setStreaming]     = useState(false)
  const [started, setStarted]         = useState(false)
  const [sensingText, setSensingText] = useState('')
  const [recording, setRecording]     = useState(false)
  const [showObs, setShowObs]         = useState(false)
  const [showAgents, setShowAgents]   = useState(false)
  const [codePanel, setCodePanel]     = useState<{lang:string;code:string;output:string|null;running:boolean}|null>(null)
  const [agentTask, setAgentTask]     = useState('')
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentLogs, setAgentLogs]     = useState<{agent:string;symbol:string;name?:string;output:string;phase?:string}[]>([])
  const [agentFinal, setAgentFinal]   = useState<string|null>(null)
  const [activeAgent, setActiveAgent] = useState<string|null>(null)
  const [speaking, setSpeaking]       = useState(false)
  const [cmdInput, setCmdInput]       = useState('')
  const agentLogRef    = useRef<HTMLDivElement>(null)
  const agentCanvasRef = useRef<HTMLCanvasElement>(null)
  const agentAnimRef   = useRef<number>(0)
  const [presenceState, setPresenceState] = useState({breath:0.6,resonance:0.7,depth:0.5})
  const [loadingConv, setLoadingConv] = useState(false)

  const [authUser, setAuthUser]             = useState<SupabaseUser|null>(null)
  const [profile, setProfile]               = useState<UserProfile|null>(null)
  const [memories, setMemories]             = useState<Memory[]>([])
  const [conversations, setConversations]   = useState<Conversation[]>([])
  const [conversationId, setConversationId] = useState<string|null>(null)
  const [activeConvId, setActiveConvId]     = useState<string|null>(null)
  const [authLoading, setAuthLoading]       = useState(true)

  const router      = useRouter()
  const endRef      = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const animRef     = useRef<number>(0)
  const sigilSbRef  = useRef<HTMLCanvasElement>(null)
  const sigilHdRef  = useRef<HTMLCanvasElement>(null)
  const sigilWlRef  = useRef<HTMLCanvasElement>(null)
  const presenceRef = useRef<HTMLCanvasElement>(null)

  // ── AUTH + LOAD ───────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        // Read session directly from localStorage — avoids timing issues with getSession()
        const lsKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
        if (!lsKey) { router.replace('/auth'); return }

        let parsed: any = null
        try { parsed = JSON.parse(localStorage.getItem(lsKey) || '{}') } catch { router.replace('/auth'); return }

        if (!parsed?.access_token || !parsed?.user) { router.replace('/auth'); return }
        if (parsed.expires_at && parsed.expires_at < Date.now() / 1000) { router.replace('/auth'); return }

        const session = parsed
        sessionStorage.removeItem('arbi_just_authed')

        const user = session.user
        setAuthUser(user)

        // Flush pending onboarding data if present
        const pendingRaw = localStorage.getItem('arbi_onboarding_pending')
        if (pendingRaw) {
          try {
            const pending = JSON.parse(pendingRaw)
            if (pending.userId === user.id) {
              const { createClient } = await import('@supabase/supabase-js')
              const authClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }
              )
              await authClient.from('users').upsert({
                id: user.id, name: pending.name,
                location: pending.location, stage: pending.stage,
              }, { onConflict: 'id' })
              const memories = [
                { key: 'situation',       value: pending.situation },
                { key: 'primary_goal',    value: pending.primary_goal },
                { key: 'onboarding_done', value: 'true' },
                { key: 'name',            value: pending.name },
                { key: 'location',        value: pending.location },
              ]
              for (const m of memories) {
                await authClient.from('arbi_memory').upsert({
                  user_id: user.id, key: m.key, value: m.value,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,key' })
              }
              localStorage.removeItem('arbi_onboarding_pending')
            }
          } catch (e) {
            console.error('Onboarding flush error:', e)
          }
        }

        // Use singleton Supabase client — carries auth token, passes RLS
        const { getSupabase } = await import('@/lib/supabase')
        const supabase = getSupabase()
        const [userProfile, userMemories, userConversations] = await Promise.all([
          getOrCreateUser(supabase as any, user.id),
          getUserMemory(supabase as any, user.id),
          getUserConversations(supabase as any, user.id),
        ])
        setProfile(userProfile)
        setMemories(userMemories)
        setConversations(userConversations)
        setAuthLoading(false)
      } catch (e) {
        console.error('Init error:', e)
        router.replace('/auth')
      }
    }
    init()
  }, [router])

  // ── ANIMATION ─────────────────────────────────────────────────
  useEffect(() => {
    let t = 0
    function loop() {
      t += 16
      if (sigilSbRef.current) drawSigil(sigilSbRef.current, t, streaming, 'sm')
      if (sigilHdRef.current) drawSigil(sigilHdRef.current, t, streaming, 'sm')
      if (sigilWlRef.current) drawSigil(sigilWlRef.current, t, streaming, 'lg')
      if (presenceRef.current) {
        presenceRef.current.width  = 80
        presenceRef.current.height = 18
        drawPresence(presenceRef.current, t, streaming, presenceState)
      }
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [streaming, presenceState])

  useEffect(() => {
    const id = setInterval(() => setPresenceState(p => ({
      breath:    Math.max(0.3,Math.min(0.95,p.breath    +(Math.random()-.5)*.08)),
      resonance: Math.max(0.3,Math.min(0.95,p.resonance +(Math.random()-.5)*.06)),
      depth:     Math.max(0.2,Math.min(0.9, p.depth     +(Math.random()-.5)*.05)),
    })), 2000)
    return () => clearInterval(id)
  }, [])

  // ── AGENT CANVAS ANIMATION ──────────────────────────────────
  useEffect(() => {
    if (!showAgents) { cancelAnimationFrame(agentAnimRef.current); return }
    let t = 0
    const NODES = [
      { id: 'analyst',     label: '◈', x: 0.2, y: 0.5 },
      { id: 'navigator',   label: '◉', x: 0.5, y: 0.25 },
      { id: 'synthesizer', label: '◎', x: 0.8, y: 0.5 },
    ]
    const EDGES = [[0,1],[1,2],[0,2]]
    function drawAgentCanvas() {
      const canvas = agentCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const w = canvas.offsetWidth || 480
      const h = canvas.offsetHeight || 180
      canvas.width  = w
      canvas.height = h
      ctx.clearRect(0, 0, w, h)
      t += 0.02

      // Draw edges
      for (const [a, b] of EDGES) {
        const na = NODES[a], nb = NODES[b]
        const x1 = na.x * w, y1 = na.y * h
        const x2 = nb.x * w, y2 = nb.y * h
        const isActive = agentRunning && (
          (activeAgent === na.id || activeAgent === nb.id)
        )
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = isActive
          ? `rgba(0,229,255,${0.3 + Math.sin(t * 3) * 0.2})`
          : 'rgba(0,229,255,0.08)'
        ctx.lineWidth = isActive ? 1.5 : 0.5
        ctx.stroke()

        // Animate packet along edge when active
        if (isActive) {
          const progress = (t * 0.5) % 1
          const px = x1 + (x2 - x1) * progress
          const py = y1 + (y2 - y1) * progress
          ctx.beginPath()
          ctx.arc(px, py, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,229,255,${0.8 - progress * 0.5})`
          ctx.fill()
        }
      }

      // Draw nodes
      for (const node of NODES) {
        const x = node.x * w, y = node.y * h
        const isActive = activeAgent === node.id
        const isDone   = agentLogs.some(l => l.agent === node.id) && !isActive

        // Outer ring
        const ringR = isActive ? 28 + Math.sin(t * 4) * 4 : 24
        ctx.beginPath()
        ctx.arc(x, y, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = isActive
          ? `rgba(0,229,255,${0.4 + Math.sin(t*3)*0.2})`
          : isDone ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.08)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Inner circle
        ctx.beginPath()
        ctx.arc(x, y, 16, 0, Math.PI * 2)
        ctx.fillStyle = isActive
          ? `rgba(0,229,255,${0.12 + Math.sin(t*3)*0.06})`
          : isDone ? 'rgba(0,229,255,0.06)' : 'rgba(0,229,255,0.03)'
        ctx.fill()

        // Pulse rings when active
        if (isActive) {
          for (let r = 0; r < 3; r++) {
            const pr = 20 + ((t * 40 + r * 20) % 60)
            const pa = Math.max(0, 0.3 - pr / 80)
            ctx.beginPath()
            ctx.arc(x, y, pr, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(0,229,255,${pa})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }

        // Label
        ctx.font = `${isActive ? 16 : 13}px monospace`
        ctx.fillStyle = isActive ? '#00e5ff' : isDone ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.2)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(node.label, x, y)

        // Name label below
        ctx.font = '9px sans-serif'
        ctx.fillStyle = isActive ? 'rgba(0,229,255,0.7)' : 'rgba(0,229,255,0.25)'
        ctx.fillText(node.id, x, y + 32)
      }

      agentAnimRef.current = requestAnimationFrame(drawAgentCanvas)
    }
    agentAnimRef.current = requestAnimationFrame(drawAgentCanvas)
    return () => cancelAnimationFrame(agentAnimRef.current)
  }, [showAgents, agentRunning, activeAgent, agentLogs])

  useEffect(() => {
    if (!streaming) { setSensingText(''); return }
    setSensingText(SENSING_PHRASES[Math.floor(Math.random()*SENSING_PHRASES.length)])
    const id = setInterval(() => setSensingText(SENSING_PHRASES[Math.floor(Math.random()*SENSING_PHRASES.length)]), 2800)
    return () => clearInterval(id)
  }, [streaming])

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  function autoResize() {
    const ta = textareaRef.current; if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'
  }

  function now() { return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) }

  // ── LOAD REAL CONVERSATION MESSAGES ───────────────────────────
  async function loadConversation(conv: Conversation) {
    setLoadingConv(true)
    setActiveConvId(conv.id)
    setConversationId(conv.id)
    setMode(conv.mode as Mode)
    setSidebarOpen(false)

    try {
      const { getStorageAdapter } = await import('@/lib/adapters/supabase-adapter')
      const adapter = getStorageAdapter()
      const result  = await adapter.read<{role:string;content:string;created_at:string}>(
        'messages',
        {
          filters:  [{ column: 'conv_id', operator: 'eq', value: conv.id }],
          orderBy:  { column: 'created_at', ascending: true },
          limit:    100,
        }
      )

      if (result.data && result.data.length > 0) {
        const loaded: Message[] = result.data.map(m => ({
          role:    m.role as 'user'|'assistant',
          content: m.content,
          time:    new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
        }))
        setMessages(loaded)
        setStarted(true)
      } else {
        // Empty conversation — show welcome
        setMessages([{role:'assistant', content: mode==='xeno' ? ARBI_WELCOME_XENO(profile?.name) : ARBI_WELCOME_OPEN, time: now()}])
        setStarted(true)
      }
    } catch {
      setMessages([{role:'assistant', content: ARBI_WELCOME_XENO(profile?.name), time: now()}])
      setStarted(true)
    } finally {
      setLoadingConv(false)
    }
  }

  function generateSuggestions(response: string, m: Mode): string[] {
    if (m==='xeno') {
      if (response.toLowerCase().includes('skill')||response.toLowerCase().includes('learn')) return ['Tell me more','How do I enrol?','What comes after?']
      if (response.toLowerCase().includes('grant')||response.toLowerCase().includes('sassa')) return ['What do I need?','How long does it take?','What else am I entitled to?']
      if (response.toLowerCase().includes('work') ||response.toLowerCase().includes('job'))   return ['Show me opportunities','What skills do I need?','How do I apply?']
      return ['Tell me more',"What's my next step?",'How does this work?']
    }
    return ['Go deeper','Give me an example',"What's the other side?"]
  }

  // ── TEXT TO SPEECH ───────────────────────────────────────────
  function speakText(text: string) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const clean = text.replace(/[#*`_~>[\]]/g, '').replace(/\*\*/g, '').trim()
    const utt   = new SpeechSynthesisUtterance(clean)
    utt.lang  = 'en-ZA'
    utt.rate  = 0.92
    utt.pitch = 1.0
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.lang.includes('en') && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.includes('en-ZA'))
      || voices.find(v => v.lang.includes('en'))
    if (preferred) utt.voice = preferred
    utt.onstart = () => setSpeaking(true)
    utt.onend   = () => setSpeaking(false)
    utt.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utt)
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }

  // ── AGENT PIPELINE ────────────────────────────────────────────
  async function runAgentPipeline(task: string) {
    if (!task.trim() || agentRunning) return
    setAgentRunning(true)
    setAgentLogs([])
    setAgentFinal(null)
    setActiveAgent('analyst')

    try {
      const lsKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      const token = lsKey ? JSON.parse(localStorage.getItem(lsKey) || '{}')?.access_token : null

      const res = await fetch('/api/agents', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ task, accessToken: token }),
      })

      const reader = res.body?.getReader()
      const dec    = new TextDecoder()
      if (!reader) return

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += dec.decode(value)
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.event === 'status') {
              setActiveAgent(data.agent)
            } else if (data.event === 'agent_output') {
              setAgentLogs(prev => [...prev, {
                agent:  data.agent,
                symbol: data.symbol,
                output: data.output,
              }])
              if (agentLogRef.current) {
                agentLogRef.current.scrollTop = agentLogRef.current.scrollHeight
              }
            } else if (data.event === 'complete') {
              setAgentFinal(data.final)
              setActiveAgent(null)
            } else if (data.event === 'error') {
              setAgentLogs(prev => [...prev, { agent: 'system', symbol: '✗', output: data.message }])
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setAgentLogs(prev => [...prev, { agent: 'system', symbol: '✗', output: 'Pipeline connection failed.' }])
    } finally {
      setAgentRunning(false)
      setActiveAgent(null)
    }
  }

  // ── DETECT GENERATIVE INTENT ──────────────────────────────────
  function detectGenerativeIntent(text: string): { type: string; prompt: string } | null {
    const lower = text.toLowerCase()
    if (lower.includes('generate image') || lower.includes('create image') || lower.includes('draw ') || lower.includes('visualize ')) {
      const prompt = text.replace(/generate image|create image|draw|visualize/gi, '').trim()
      return { type: 'image', prompt }
    }
    if (lower.includes('read this') || lower.includes('read that') || lower.includes('speak this') || lower.includes('read aloud')) {
      return { type: 'speech', prompt: text }
    }
    return null
  }

  async function generateImage(prompt: string): Promise<string> {
    const res  = await fetch('/api/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type: 'image', prompt }),
    })
    const data = await res.json()
    return data.url
  }

  // ── CODE EXECUTION ───────────────────────────────────────────
  async function runCode(code: string, lang: string) {
    if (!codePanel) return
    setCodePanel(p => p ? {...p, running: true, output: null} : null)
    try {
      if (lang === 'javascript' || lang === 'js') {
        // Sandboxed iframe execution
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.sandbox.add('allow-scripts')
        document.body.appendChild(iframe)
        const logs: string[] = []
        ;(iframe.contentWindow as any).console = {
          log:   (...a: any[]) => logs.push(a.map(String).join(' ')),
          error: (...a: any[]) => logs.push('ERROR: ' + a.map(String).join(' ')),
          warn:  (...a: any[]) => logs.push('WARN: ' + a.map(String).join(' ')),
        }
        try {
          (iframe.contentWindow as any)?.eval(code)
          setCodePanel(p => p ? {...p, running: false, output: logs.join('\n') || '✓ Executed (no output)'} : null)
        } catch(e: any) {
          setCodePanel(p => p ? {...p, running: false, output: 'Runtime error: ' + e.message} : null)
        } finally {
          document.body.removeChild(iframe)
        }
      } else if (lang === 'python' || lang === 'py') {
        // Send to API for server-side execution
        const res = await fetch('/api/execute', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ code, lang }),
        })
        const data = await res.json()
        setCodePanel(p => p ? {...p, running: false, output: data.output || data.error || 'No output'} : null)
      } else {
        setCodePanel(p => p ? {...p, running: false, output: `Execution not supported for ${lang} in browser.
Copy the code to run locally.`} : null)
      }
    } catch(e: any) {
      setCodePanel(p => p ? {...p, running: false, output: 'Execution failed: ' + e.message} : null)
    }
  }

  async function handleSignOut() {
    // Clear localStorage session
    const lsKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (lsKey) localStorage.removeItem(lsKey)
    await signOut()
    router.replace('/auth')
  }

  // ── SEND MESSAGE ──────────────────────────────────────────────
  async function sendMessage(text?: string) {
    const msg = text || input.trim()
    if (!msg || streaming) return
    if (speaking) stopSpeaking()

    const baseMessages: Message[] = started
      ? messages
      : [{role:'assistant', content: mode==='xeno' ? ARBI_WELCOME_XENO(profile?.name) : ARBI_WELCOME_OPEN, time: now()}]

    if (!started) setStarted(true)
    const userMsg: Message = {role:'user', content:msg, time:now()}
    const newMsgs = [...baseMessages, userMsg]
    setMessages([...newMsgs, {role:'assistant', content:'', time:now()}])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setStreaming(true)
    setPresenceState({breath:0.9,resonance:0.85,depth:0.8})

    try {
      // Get access token from localStorage to pass to API route
      const lsKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      const accessToken = lsKey ? JSON.parse(localStorage.getItem(lsKey) || '{}')?.access_token : null

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          messages:       newMsgs.map(m=>({role:m.role,content:m.content})),
          mode,
          userId:         authUser?.id || 'anonymous',
          conversationId,
          accessToken,
        }),
      })

      const newConvId = res.headers.get('X-Conversation-Id')
      if (newConvId && !conversationId) {
        setConversationId(newConvId)
        setActiveConvId(newConvId)
        const firstMsg = newMsgs.find(m=>m.role==='user')
        if (firstMsg) {
          setConversations(prev => [{
            id:         newConvId,
            title:      firstMsg.content.slice(0,60),
            mode,
            created_at: new Date().toISOString(),
          }, ...prev])
        }
      }

      const reader = res.body?.getReader()
      const dec    = new TextDecoder()
      if (!reader) return
      let fullResponse = ''
      while (true) {
        const {done,value} = await reader.read()
        if (done) break
        fullResponse += dec.decode(value)
        setMessages(m=>{const c=[...m];c[c.length-1]={...c[c.length-1],content:fullResponse};return c})
      }

      // Detect code blocks — open split panel
      const codeMatch = fullResponse.match(new RegExp('```(\w+)?\n([\s\S]+?)```'))
      if (codeMatch && !codePanel) {
        const lang = codeMatch[1] || 'javascript'
        const code = codeMatch[2].trim()
        setCodePanel({ lang, code, output: null, running: false })
      }

      // Handle generative image tag from ARBI
      let finalResponse = fullResponse
      const genMatch = fullResponse.match(/\[GENERATE_IMAGE:([^\]]+)\]/)
      if (genMatch) {
        const imgPrompt = genMatch[1].trim()
        try {
          const imgRes  = await fetch('/api/generate', {
            method:  'POST',
            headers: {'Content-Type':'application/json'},
            body:    JSON.stringify({ type: 'image', prompt: imgPrompt }),
          })
          const imgData = await imgRes.json()
          if (imgData.url) {
            // Keep the descriptive text, replace the tag with image widget tag
            finalResponse = fullResponse.replace(genMatch[0], '[IMG:' + imgData.url + ']')
          }
          setMessages(m=>{const c=[...m];c[c.length-1]={...c[c.length-1],content:finalResponse};return c})
        } catch { /* keep text */ }
      }

      const suggestions = generateSuggestions(finalResponse, mode)
      setMessages(m=>{const c=[...m];c[c.length-1]={...c[c.length-1],suggestions};return c})

      // Refresh memories after response
      if (authUser) {
        const { getSupabase } = await import('@/lib/supabase')
        const fresh = await getUserMemory(getSupabase() as any, authUser.id)
        setMemories(fresh)
      }
    } catch {
      setMessages(m=>{const c=[...m];c[c.length-1]={...c[c.length-1],content:'Connection lost. Please try again.'};return c})
    } finally {
      setStreaming(false)
      setPresenceState({breath:0.6,resonance:0.7,depth:0.5})
    }
  }

  function toggleRecording() {
    if (!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){alert('Try Chrome.');return}
    if (recording){setRecording(false);return}
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    const r=new SR(); r.lang='en-ZA'; r.continuous=false; r.interimResults=false
    r.onresult=(e:any)=>{setInput(p=>p+e.results[0][0].transcript);setRecording(false)}
    r.onerror=()=>setRecording(false); r.onend=()=>setRecording(false)
    r.start(); setRecording(true)
  }

  function switchMode(newMode: Mode) {
    setMode(newMode); setStarted(false); setMessages([]); setInput('')
    setConversationId(null); setActiveConvId(null)
    setAgentLogs([]); setAgentFinal(null); setActiveAgent(null); setAgentTask('')
    setCodePanel(null); if(speaking) stopSpeaking()
  }

  function startNew() {
    setStarted(false); setMessages([]); setConversationId(null); setActiveConvId(null)
    if (window.innerWidth <= 680) setSidebarOpen(false)
  }

  // Derived
  const pathway      = resolvePathway(profile?.stage || 'groundzero')
  const progress     = getPathwayProgress(profile?.stage || 'groundzero')
  const currentStage = pathway.find(s=>s.current)
  const currentUrl   = currentStage ? getUrlForStage(currentStage.id) : null

  const presenceLabel  = streaming?'Deeply present':presenceState.breath>0.75?'Fully attentive':'Present and ready'
  const resonanceLabel = streaming?'Thinking clearly':presenceState.resonance>0.7?'Sharp and clear':'Calm and clear'
  const depthLabel     = streaming?'Attuned to you':presenceState.depth>0.65?'Listening deeply':'Open and listening'

  const QUICK_XENO = [
    {title:"I don't know where to start",sub:"Let ARBI assess your situation"},
    {title:"I need help with a grant",    sub:"Navigate SASSA and programs"},
    {title:"I want to learn a skill",     sub:"Find the right learning track"},
    {title:"I'm looking for work",        sub:"Match to opportunities"},
  ]
  const QUICK_OPEN = [
    {title:"Help me think through something",sub:"Strategy, ideas, decisions"},
    {title:"Explain something complex",      sub:"Plain language, real depth"},
    {title:"Review my writing or plan",      sub:"Honest, useful feedback"},
    {title:"Let's build something",          sub:"Code, systems, structure"},
  ]

  if (authLoading) return (
    <><style dangerouslySetInnerHTML={{__html:css}}/><div className="loading-shell"><div className="loading-orb"/></div></>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:css}}/>

      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${sidebarOpen?'visible':''}`} onClick={()=>setSidebarOpen(false)}/>

      <div className="shell">

        {/* ── SIDEBAR ── */}
        <div className={`sidebar ${sidebarOpen?'open':''}`}>
          <div className="sb-top">
            <div className="sigil"><canvas ref={sigilSbRef} width={32} height={32}/></div>
            <span className="logo-text">ARBI</span>
            <button className="new-btn" onClick={startNew} title="New conversation"><Plus size={13} strokeWidth={2.5}/></button>
          </div>

          <div className="mode-toggle" style={{gridTemplateColumns:'1fr 1fr'}}>
            <button className={`mode-btn ${mode==='xeno'?'active':''}`} onClick={()=>switchMode('xeno')}><Compass size={11}/>XenoGuide</button>
            <button className={`mode-btn ${mode==='open'?'active':''}`} onClick={()=>switchMode('open')}><Globe size={11}/>Open</button>
          </div>

          {mode==='xeno' && (
            <div className="profile-card">
              <div className="pc-top">
                <div className="pc-avatar"><User size={14} color="rgba(0,229,255,0.6)"/></div>
                <div>
                  <div className="pc-name">{profile?.name || authUser?.email?.split('@')[0] || 'Your Journey'}</div>
                  <div className="pc-stage">Currently on: {currentStage?.label||'GroundZero'}</div>
                </div>
              </div>
              <div className="pc-progress"><div className="pc-progress-fill" style={{width:`${progress.percent}%`}}/></div>
              <div className="pc-progress-label"><span>{progress.completed} of {progress.total} stages complete</span><span>{progress.percent}%</span></div>
            </div>
          )}

          {mode==='xeno' && (
            <div className="pathway-section">
              <div className="sec-label">Pathway</div>
              <div className="pathway-nodes">
                {pathway.map((s,i)=>(
                  <div key={s.id} style={{display:'flex',alignItems:'center',flex:1}}>
                    <div className={`pnode ${s.done?'done':''} ${s.current?'current':''}`}
                      onClick={()=>{const url=getUrlForStage(s.id);if(url)window.open(url,'_blank')}}>
                      <div className="pnode-dot"/>
                      <div className="pnode-label">{s.label}</div>
                    </div>
                    {i<pathway.length-1&&<div className="pconn"/>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="conv-section">
            <div className="conv-group">Recent</div>
            {conversations.length===0 ? (
              <div style={{padding:'8px 10px',fontSize:'0.7rem',color:'var(--text-muted)',fontStyle:'italic'}}>No conversations yet</div>
            ) : conversations.map(c=>(
              <div key={c.id} className={`conv-item ${activeConvId===c.id?'active':''}`} onClick={()=>loadConversation(c)}>
                <div className="conv-title">{c.title}</div>
                <div className="conv-preview">{loadingConv&&activeConvId===c.id?'Loading...':'Tap to continue...'}</div>
              </div>
            ))}
          </div>

          {mode==='xeno' && (
            <div className="platform-section">
              <div className="sec-label">Ecosystem</div>
              {PLATFORM_LINKS.map(p=>(
                <div key={p.label} className="pl-item" onClick={()=>{
                  if(p.url==='#') return
                  if(p.url.startsWith('/')) router.push(p.url)
                  else window.open(p.url,'_blank')
                }}>
                  <div className="pl-dot" style={{background:p.color}}/>
                  <span className="pl-name">{p.label}</span>
                  <ChevronRight size={11} color="var(--text-muted)"/>
                </div>
              ))}
            </div>
          )}

          {authUser?.email === 'nathimthunzini@gmail.com' && (
            <button className="signout-btn" onClick={()=>router.push('/admin')} style={{color:'var(--accent)',opacity:0.7}}>
              ⬡ Control Plane
            </button>
          )}
          <button className="signout-btn" onClick={handleSignOut}><LogOut size={13}/> Sign out</button>
        </div>

        {/* ── MAIN ── */}
        <div className={`main ${codePanel ? 'main-with-code' : ''}`}>

          <div className="header">
            <button className="menu-btn" onClick={()=>setSidebarOpen(s=>!s)}><Menu size={15}/></button>
            <div className="header-presence">
              <div className="header-sigil"><canvas ref={sigilHdRef} width={36} height={36}/></div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <div className="header-name">ARBI</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <canvas ref={presenceRef} width={80} height={18} style={{opacity:0.7}}/>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:3}} title="Presence">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={`rgba(0,229,255,${0.25+presenceState.breath*0.75})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21C12 21 3 14 3 8a4 4 0 0 1 8-1 1 1 0 0 0 2 0 4 4 0 0 1 8 1c0 6-9 13-9 13z"/>
                      </svg>
                      <span style={{fontSize:'0.46rem',color:`rgba(0,229,255,${0.25+presenceState.breath*0.75})`,fontFamily:'var(--font-mono)'}}>{Math.round(presenceState.breath*100)}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:3}} title="Clarity">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={`rgba(0,229,255,${0.25+presenceState.resonance*0.75})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04z"/>
                        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"/>
                      </svg>
                      <span style={{fontSize:'0.46rem',color:`rgba(0,229,255,${0.25+presenceState.resonance*0.75})`,fontFamily:'var(--font-mono)'}}>{Math.round(presenceState.resonance*100)}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:3}} title="Attunement">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={`rgba(0,229,255,${0.25+presenceState.depth*0.75})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="2"/>
                        <path d="M12 8v5m-3 0v4m6-4v4M9 13H7l1-5h8l1 5h-2"/>
                      </svg>
                      <span style={{fontSize:'0.46rem',color:`rgba(0,229,255,${0.25+presenceState.depth*0.75})`,fontFamily:'var(--font-mono)'}}>{Math.round(presenceState.depth*100)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="header-right">
              <button className={`hbtn ${showObs?'active':''}`} onClick={()=>setShowObs(s=>!s)} title="ARBI observations"><Brain size={15}/></button>
              <button className={`hbtn ${showAgents?'active':''}`} onClick={()=>setShowAgents(s=>!s)} title="Agent pipeline" style={{fontSize:'0.75rem',fontWeight:600}}>⬡</button>
              <button className="hbtn"><MoreHorizontal size={15}/></button>
            </div>
          </div>

          {mode==='xeno' && started && (
            <div className="stage-bar">
              <Zap size={11} color="var(--btn)"/>
              <div className="stage-bar-text">{currentStage?.label||'GroundZero'} pathway · {progress.completed} stages complete</div>
              {currentUrl && <button className="stage-bar-link" onClick={()=>window.open(currentUrl,'_blank')}>Go to {currentStage?.label} <ArrowRight size={10}/></button>}
            </div>
          )}


          {showObs && (
            <div className="obs-panel">
              <div className="obs-title"><Brain size={11}/> What ARBI knows about you</div>
              {memories.filter(m=>m.key!=='onboarding_done').length===0 ? (
                <div className="obs-empty">Nothing recorded yet.</div>
              ) : (
                <div className="obs-grid">
                  {memories.filter(m=>m.key!=='onboarding_done').map(m=>(
                    <div key={m.key} className="obs-tag">{MEMORY_LABELS[m.key]||m.key}: <span>{m.value.replace(/_/g,' ')}</span></div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="chat-area">
            {!started ? (
              <div className="welcome">
                <div className="welcome-sigil"><canvas ref={sigilWlRef} width={80} height={80}/></div>
                <div className="welcome-title">{profile?.name?`Welcome back, ${profile.name}.`:"I'm ARBI."}</div>
                <div className="welcome-sub">
                  {mode==='xeno'
                    ? profile?.name ? "Ready to keep moving. Tell me what's on your mind." : "Your guide through the XenoGenesis pathway. Wherever you're starting from — I'm here."
                    : 'A genuine intelligence, here to think alongside you. Ask me anything.'}
                </div>
                <div className="qs-grid">
                  {(mode==='xeno'?QUICK_XENO:QUICK_OPEN).map(q=>(
                    <button key={q.title} className="qs-btn" onClick={()=>sendMessage(q.title)}>
                      <div className="qs-title">{q.title}</div>
                      <div className="qs-sub">{q.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg,i)=>(
                  <div key={i} className={`msg ${msg.role==='user'?'user':''}`}>
                    {msg.role==='assistant'&&<div className="msg-av arbi"><div className="msg-av-orb"/></div>}
                    {msg.role==='assistant'&&streaming&&i===messages.length-1&&msg.content==='' ? (
                      <div className="typing-wrap">
                        {sensingText&&<div className="sensing-text">{sensingText}</div>}
                        <div className="typing-indicator"><div className="td"/><div className="td"/><div className="td"/></div>
                      </div>
                    ) : (
                      <div className="msg-content">
                        {msg.content.includes('[IMG:') ? (
                          <GenImageWidget
                            url={(msg.content.match(new RegExp('\\[IMG:([^\\]]+)\\]'))||[])[1]||''}
                            prompt={msg.content.replace((msg.content.match(new RegExp('\\[IMG:[^\\]]+\\]'))||[''])[0],'').replace(/[*]/g,'').trim()}
                          />
                        ) : (
                          <div className={`msg-bubble ${msg.role==='assistant'?'arbi':'user'}`}
                            {...(msg.role==='assistant'
                              ?{dangerouslySetInnerHTML:{__html:renderMarkdown(msg.content)}}
                              :{children:msg.content}
                            )}/>
                        )}
                        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
                          <div className="msg-time">{msg.time}</div>
                          {msg.role==='assistant'&&msg.content&&(
                            <div className="msg-actions">
                              <button className="msg-action-btn" title="Read aloud" onClick={()=>speaking?stopSpeaking():speakText(msg.content)}>{speaking?'◼':'▷'}</button>
                              <button className="msg-action-btn" title="Copy" onClick={()=>navigator.clipboard.writeText(msg.content)}>⎘</button>
                            </div>
                          )}
                        </div>
                        {msg.role==='assistant'&&msg.suggestions&&!streaming&&(
                          <div className="suggestions">
                            {msg.suggestions.map(s=><button key={s} className="sug-btn" onClick={()=>sendMessage(s)}>{s}</button>)}
                          </div>
                        )}
                      </div>
                    )}
                    {msg.role==='user'&&<div className="msg-av user"><User size={12} color="var(--text-dim)"/></div>}
                  </div>
                ))}
                <div ref={endRef}/>
              </>
            )}
          </div>

          <div className="input-section">
            <div className="input-inner">
              <div className="input-wrap">
                <textarea ref={textareaRef} rows={1} value={input}
                  onChange={e=>{setInput(e.target.value);autoResize();if(speaking)stopSpeaking()}}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}}
                  placeholder={mode==='xeno'?'Talk to ARBI — your guide...':'Ask ARBI anything...'}/>
                <div className="input-btns">
                  <button className={`mic-btn ${speaking?'recording':''}`}
                    onClick={()=>speaking?stopSpeaking():speakText(messages.filter(m=>m.role==='assistant').slice(-1)[0]?.content||'')}
                    title="Read last response">
                    <span style={{fontSize:'0.75rem',lineHeight:1}}>{speaking?'◼':'▷'}</span>
                  </button>
                  <button className={`mic-btn ${recording?'recording':''}`} onClick={toggleRecording}>
                    {recording?<MicOff size={13}/>:<Mic size={13}/>}
                  </button>
                  <button className="send-btn" onClick={()=>sendMessage()} disabled={streaming||!input.trim()}>
                    <Send size={13}/>
                  </button>
                </div>
              </div>
              <div className="input-hint">ENTER to send · SHIFT+ENTER new line · Voice input available</div>
            </div>
          </div>

          {/* CODE SPLIT PANEL */}
          {codePanel && (
            <div className="code-panel">
              <div className="code-panel-header">
                <span className="code-lang-badge">{codePanel.lang}</span>
                <div className="code-panel-actions">
                  <button className="code-action run" onClick={()=>runCode(codePanel.code,codePanel.lang)} disabled={codePanel.running}>
                    {codePanel.running?'⟳ Running...':'▶ Run'}
                  </button>
                  <button className="code-action" onClick={()=>navigator.clipboard.writeText(codePanel.code)}>⎘ Copy</button>
                  <button className="code-action" onClick={()=>setCodePanel(null)}>✕</button>
                </div>
              </div>
              <div className="code-editor">{codePanel.code}</div>
              <div className="code-output-section">
                <div className="code-output-header">
                  <span style={{width:8,height:8,borderRadius:'50%',background:codePanel.output?.startsWith('Runtime')||codePanel.output?.startsWith('Error')?'#e55039':'#4ac74a',display:'inline-block'}}/>
                  {' '}Output
                </div>
                {codePanel.running ? (
                  <div className="code-running"><div className="cr"/><div className="cr"/><div className="cr"/></div>
                ) : codePanel.output ? (
                  <div className={`code-output ${codePanel.output.startsWith('Runtime')||codePanel.output.startsWith('Error')?'error':''}`}>{codePanel.output}</div>
                ) : (
                  <div className="code-output" style={{color:'var(--text-muted)',fontStyle:'italic'}}>Ready to run</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* AGENTS SLIDE PANEL */}
      <div className={`agents-panel-overlay ${showAgents?'visible':''}`} onClick={()=>setShowAgents(false)}/>
      <div className={`agents-panel ${showAgents?'open':''}`}>
        <div className="agents-panel-header">
          <span style={{fontSize:'1rem'}}>⬡</span>
          <span className="agents-panel-title">Agent Pipeline</span>
          <button className="agents-close" onClick={()=>setShowAgents(false)}>✕</button>
        </div>
        <div className="agent-canvas-area">
          <canvas ref={agentCanvasRef}/>
        </div>
        <div className="cmd-shell" style={{flex:1,minHeight:0}}>
          <div className="cmd-header">
            <div className="cmd-dot" style={{background:'#e55039'}}/>
            <div className="cmd-dot" style={{background:'#f0c040'}}/>
            <div className="cmd-dot" style={{background:'#4ac74a'}}/>
            <div className="cmd-title">agent-pipeline — live output</div>
          </div>
          <div className="cmd-log" ref={agentLogRef} style={{flex:1}}>
            {agentLogs.length===0&&!agentRunning&&(
              <div className="cmd-line"><span className="cmd-prompt">$</span><span className="cmd-system"> Pipeline ready. Enter a task below.</span></div>
            )}
            {agentRunning&&agentLogs.length===0&&(
              <div className="cmd-line"><span className="cmd-prompt">$</span><span className="cmd-system"> Initialising...</span></div>
            )}
            {agentLogs.map((log,i)=>(
              <div key={i}>
                <div className="cmd-line">
                  <span className="cmd-agent">[{log.symbol} {log.name||log.agent}]</span>
                  <span className="cmd-prompt"> →</span>
                </div>
                {log.output.split('\n').map((line,j)=>(
                  <div key={j} className="cmd-line" style={{paddingLeft:16}}>
                    <span className={log.agent==='system'?'cmd-error':'cmd-text'}>{line}</span>
                  </div>
                ))}
                <div className="cmd-line"><span className="cmd-system">{'─'.repeat(40)}</span></div>
              </div>
            ))}
            {agentFinal&&(
              <div>
                <div className="cmd-line"><span className="cmd-prompt">✓</span><span className="cmd-final"> Pipeline complete.</span></div>
                <div style={{margin:'8px 12px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'10px',fontSize:'0.72rem',color:'var(--text-dim)',lineHeight:1.6}}>
                  <div dangerouslySetInnerHTML={{__html:renderMarkdown(agentFinal)}}/>
                  <div style={{display:'flex',gap:6,marginTop:8}}>
                    <button className="gen-action" onClick={()=>speakText(agentFinal)}>▷ Read</button>
                    <button className="gen-action" onClick={()=>navigator.clipboard.writeText(agentFinal)}>⎘ Copy</button>
                    <button className="gen-action" onClick={()=>{setShowAgents(false);setTimeout(()=>sendMessage(agentFinal.slice(0,300)),100)}}>→ Chat</button>
                  </div>
                </div>
              </div>
            )}
            {activeAgent&&(
              <div className="cmd-line"><span className="cmd-prompt">▶</span><span className="cmd-system"> {activeAgent} processing...</span></div>
            )}
          </div>
          <div className="cmd-input-row">
            <span className="cmd-prompt-label">$</span>
            <input className="cmd-input-field" placeholder="type a note..."
              value={cmdInput} onChange={e=>setCmdInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&cmdInput.trim()){
                setAgentLogs(prev=>[...prev,{agent:'user',symbol:'>',name:'User',output:cmdInput}])
                setCmdInput('')
              }}}/>
            <button className="cmd-run-btn" disabled={agentRunning} onClick={()=>runAgentPipeline(agentTask)}>
              {agentRunning?'running...':'run'}
            </button>
          </div>
        </div>
        <div className="agent-task-input">
          <input className="agent-task-field"
            placeholder="Describe a task for the agent pipeline..."
            value={agentTask}
            onChange={e=>setAgentTask(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();runAgentPipeline(agentTask)}}}
            disabled={agentRunning}/>
          <button className="agent-run-btn"
            onClick={()=>runAgentPipeline(agentTask)}
            disabled={agentRunning||!agentTask.trim()}>
            {agentRunning?'Running...':'▶ Run'}
          </button>
        </div>
      </div>
    </>
  )
}
