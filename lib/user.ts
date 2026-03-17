/**
 * lib/user.ts — Portable user service layer
 * All Supabase DB calls live here. To migrate servers, update env vars only.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  name: string | null
  location: string | null
  stage: string
  created_at: string
}

export type Memory = {
  key: string
  value: string
  updated_at: string
}

export type Conversation = {
  id: string
  title: string
  mode: string
  created_at: string
}

export type PathwayStage = {
  id: string
  label: string
  done: boolean
  current: boolean
  url: string
}

export const PATHWAY: PathwayStage[] = [
  { id: 'groundzero', label: 'GroundZero', done: false, current: false, url: 'https://gzbnos.vercel.app' },
  { id: 'btu',        label: 'BTU',        done: false, current: false, url: 'https://btu-two.vercel.app' },
  { id: 'skills',     label: 'Skills',     done: false, current: false, url: 'https://xenogen-skills.vercel.app' },
  { id: 'guuz',       label: 'Guuz',       done: false, current: false, url: '#' },
  { id: 'career',     label: 'Career',     done: false, current: false, url: '#' },
]

const STAGE_ORDER = ['groundzero', 'btu', 'skills', 'guuz', 'career']

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// ── USER PROFILE ──────────────────────────────────────────────────

export async function getOrCreateUser(
  supabase: SupabaseClient,
  userId: string,
  defaults?: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (existing) return existing as UserProfile

    const { data: created } = await supabase
      .from('users')
      .insert({ id: userId, stage: 'groundzero', ...defaults })
      .select('*')
      .single()

    return created as UserProfile | null
  } catch {
    return null
  }
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
    return !error
  } catch {
    return false
  }
}

// ── MEMORY ────────────────────────────────────────────────────────

export async function getUserMemory(
  supabase: SupabaseClient,
  userId: string
): Promise<Memory[]> {
  try {
    const { data } = await supabase
      .from('arbi_memory')
      .select('key, value, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(30)
    return (data as Memory[]) || []
  } catch {
    return []
  }
}

export async function setMemory(
  supabase: SupabaseClient,
  userId: string,
  key: string,
  value: string
): Promise<void> {
  try {
    await supabase.from('arbi_memory').upsert({
      user_id: userId,
      key,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,key' })
  } catch {
    // Fail silently
  }
}

export async function deleteMemory(
  supabase: SupabaseClient,
  userId: string,
  key: string
): Promise<void> {
  try {
    await supabase
      .from('arbi_memory')
      .delete()
      .eq('user_id', userId)
      .eq('key', key)
  } catch {
    // Fail silently
  }
}

// ── PATHWAY ───────────────────────────────────────────────────────

export function resolvePathway(currentStage: string): PathwayStage[] {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  return PATHWAY.map((stage, i) => ({
    ...stage,
    done:    i < currentIndex,
    current: i === currentIndex,
  }))
}

export function getPathwayProgress(currentStage: string): { completed: number; total: number; percent: number } {
  const currentIndex = Math.max(0, STAGE_ORDER.indexOf(currentStage))
  return {
    completed: currentIndex,
    total:     STAGE_ORDER.length,
    percent:   Math.round((currentIndex / STAGE_ORDER.length) * 100),
  }
}

// ── CONVERSATIONS ─────────────────────────────────────────────────

export async function getUserConversations(
  supabase: SupabaseClient,
  userId: string,
  limit = 10
): Promise<Conversation[]> {
  try {
    const { data } = await supabase
      .from('conversations')
      .select('id, title, mode, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data as Conversation[]) || []
  } catch {
    return []
  }
}

// ── MEMORY CONTEXT STRING (for ARBI system prompt) ─────────────────

export function buildMemoryContext(profile: UserProfile | null, memories: Memory[]): string {
  if (!profile && memories.length === 0) return ''

  const lines: string[] = []

  if (profile) {
    if (profile.name)     lines.push(`name: ${profile.name}`)
    if (profile.location) lines.push(`location: ${profile.location}`)
    if (profile.stage)    lines.push(`current_pathway_stage: ${profile.stage}`)
  }

  for (const m of memories) {
    lines.push(`${m.key}: ${m.value}`)
  }

  return lines.length > 0
    ? `\n\nWHAT YOU KNOW ABOUT THIS USER:\n${lines.join('\n')}\n`
    : ''
}
