import { supabase } from './supabase';
import { generateEmbedding } from './embeddings';
import { UserProfile, Memory } from './core/types';

/**
 * IDENTITY_SYNC: Updates user profile metadata.
 */
async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * VAULT_MEMORY: The renamed 'setMemory' function.
 * Renamed to 'vaultMemory' to bypass build cache / name collision tulpoids.
 */
async function vaultMemory(userId: string, key: string, value: string) {
  const embedding = await generateEmbedding(`${key}: ${value}`);
  const { data, error } = await supabase
    .from('memories')
    .upsert({ user_id: userId, key, value, embedding })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// THE GATEKEEPER EXPORT
export { 
  updateUserProfile, 
  vaultMemory 
};
