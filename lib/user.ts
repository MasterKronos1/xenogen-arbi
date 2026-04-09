import { getSupabase } from './supabase';
import { generateEmbedding } from './embeddings';
import { UserProfile, Memory } from './core/types';

const supabase = getSupabase();

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function vaultMemory(userId: string, key: string, value: string) {
  const embedding = await generateEmbedding(`${key}: ${value}`);
  const { data, error } = await supabase
    .from('memories')
    .upsert({ user_id: userId, key, value, embedding })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getOrCreateUser(idOrClient: any, userId?: string) {
  const actualId = userId ?? idOrClient;
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: actualId }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserMemory(idOrClient: any, userId?: string) {
  const actualId = userId ?? idOrClient;
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', actualId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getUserConversations(idOrClient: any, userId?: string) {
  const actualId = userId ?? idOrClient;
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', actualId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function resolvePathway(userId: string) {
  const { data, error } = await supabase
    .from('pathway_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function getPathwayProgress(userId: string) {
  return resolvePathway(userId);
}

export function buildMemoryContext(profile: any, memories: any[]) {
  const memoryLines = memories.map(m => `${m.key}: ${m.value}`).join('\n');
  return `User Profile: ${JSON.stringify(profile)}\nMemories:\n${memoryLines}`;
}
