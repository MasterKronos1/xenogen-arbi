// lib/user.ts
import { createClient } from '@supabase/supabase-js';

// 1. Ensure the Client Getter exists for the API routes
export const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// 2. Export the specific functions the UI is failing on
export async function getOrCreateUser(supabase: any, user: any) {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserConversations(supabase: any, userId: string) {
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return data || [];
}

export async function getUserMemory(supabase: any, userId: string) {
  const { data } = await supabase
    .from('arbi_memory')
    .select('*')
    .eq('user_id', userId);
  return data || [];
}

// 3. Pathway Logic (If these are used for your mission progress)
export async function getPathwayProgress(supabase: any, userId: string) {
  const { data } = await supabase
    .from('pathway_progress')
    .select('*')
    .eq('user_id', userId);
  return data || [];
}

export async function resolvePathway(supabase: any, pathwayId: string) {
  // Logic for pathway resolution
  return { status: 'active' };
}

// 4. Types (Turbopack needs these for line 14 of your page.tsx)
export type UserProfile = { id: string; email: string };
export type Memory = { key: string; value: string };
export type Conversation = { id: string; title: string };
