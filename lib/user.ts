import { getSupabase } from './supabase'
import { generateEmbedding } from './embeddings'

export interface UserProfile {
  id: string
  email?: string | null
  name?: string | null
  location?: string | null
  stage?: string | null
  created_at?: string
}

export interface Memory {
  id?: string
  user_id: string
  key: string
  value: string
  embedding?: number[]
  updated_at?: string
}

export interface Conversation {
  id: string
  user_id?: string | null
  title: string
  mode?: string | null
  created_at?: string
  updated_at?: string
}

type DbAdapter = {
  from: (table: string) => any
  rpc?: (fn: string, args?: Record<string, unknown>) => Promise<any>
}

function client(adapter?: any): DbAdapter {
  return (adapter as DbAdapter) || (getSupabase() as unknown as DbAdapter)
}

export function getSupabaseClient() {
  return getSupabase()
}

export const supabase = {
  from: (...args: any[]) => (getSupabase() as any).from(...args),
  rpc: (...args: any[]) => (getSupabase() as any).rpc(...args),
}
export { generateEmbedding }

export async function getOrCreateUser(adapter: any, userId: string): Promise<UserProfile> {
  const db = client(adapter)

  const { data: existing } = await db
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return existing as UserProfile

  const { data, error } = await db
    .from('users')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw error
  return data as UserProfile
}

export async function getUserMemory(adapter: any, userId: string): Promise<Memory[]> {
  const db = client(adapter)

  const primary = await db
    .from('arbi_memory')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (!primary.error) return (primary.data || []) as Memory[]

  const fallback = await db
    .from('memories')
    .select('*')
    .eq('user_id', userId)

  if (fallback.error) throw fallback.error
  return (fallback.data || []) as Memory[]
}

export function buildMemoryContext(profile?: UserProfile | null, memories: Memory[] = []): string {
  const bits: string[] = []

  if (profile) {
    bits.push('USER PROFILE:')
    bits.push(`- id: ${profile.id}`)
    if (profile.name) bits.push(`- name: ${profile.name}`)
    if (profile.location) bits.push(`- location: ${profile.location}`)
    if (profile.stage) bits.push(`- stage: ${profile.stage}`)
  }

  if (memories.length) {
    bits.push('')
    bits.push('USER MEMORY:')
    for (const m of memories.slice(0, 20)) {
      bits.push(`- ${m.key}: ${m.value}`)
    }
  }

  return bits.join('\n')
}

export async function getUserConversations(adapter: any, userId: string): Promise<Conversation[]> {
  const db = client(adapter)
  const { data, error } = await db
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Conversation[]
}

export function resolvePathway(stage: string) {
  const order = ['groundzero', 'btu', 'skills', 'guuz', 'career']
  const currentIdx = Math.max(0, order.indexOf((stage || 'groundzero').toLowerCase()))

  return order.map((id, idx) => ({
    id,
    label: id === 'groundzero' ? 'GroundZero' : id === 'btu' ? 'BTU' : id[0].toUpperCase() + id.slice(1),
    done: idx < currentIdx,
    current: idx === currentIdx,
  }))
}

export function getPathwayProgress(stage: string) {
  const pathway = resolvePathway(stage)
  const done = pathway.filter(s => s.done).length
  const current = pathway.findIndex(s => s.current)
  return {
    completed: done,
    total: pathway.length,
    percent: Math.round(((current + 1) / pathway.length) * 100),
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await getSupabase()
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function vaultMemory(userId: string, key: string, value: string) {
  const embedding = await generateEmbedding(`${key}: ${value}`)
  const { data, error } = await getSupabase()
    .from('memories')
    .upsert({ user_id: userId, key, value, embedding })
    .select()
    .single()

  if (error) throw error
  return data
}
