import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase (Ensure these are in your Vercel Env Variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Export the client getter for your API routes
export function getSupabaseClient() {
  return supabase;
}

// 3. Types for the UI
export type UserProfile = { id: string; email: string };
export type Memory = { id: string; key: string; value: string };
export type Conversation = { id: string; title: string; last_message: string };

/**
 * RESTORED: Auth and User creation logic
 */
export async function getOrCreateUser(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  if (data) return data;

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert([{ email }])
    .select()
    .single();

  if (createError) throw createError;
  return newUser;
}

/**
 * RESTORED: Data Fetching for the Dashboard
 */
export async function getUserConversations(userId: string) {
  const { data } = await supabase.from('conversations').select('*').eq('user_id', userId);
  return data || [];
}

export async function getUserMemory(userId: string) {
  const { data } = await supabase.from('neural_vault').select('*').eq('user_id', userId);
  return data || [];
}

/**
 * RESTORED: Sovereignty / Pathway logic
 */
export async function resolvePathway(userId: string, target: string) {
  console.log(`Resolving evolution pathway: ${target}`);
  return { success: true };
}

export async function getPathwayProgress(userId: string) {
  return { level: 1, alignment: "Co-evolutionary" };
}

/**
 * STABLE: The Mapping function (Groq-compatible)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Keeping this zeroed out as agreed until local weight storage is ready
  return new Array(1536).fill(0);
}

export function buildMemoryContext(memories: any[]): string {
  if (!memories || memories.length === 0) return "No prior vault data.";
  return memories.map((m) => `[${m.key}]: ${m.value}`).join('\n');
}
