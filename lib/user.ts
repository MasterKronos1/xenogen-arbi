/**
 * lib/user.ts — Portable user service layer (Sovereignty Edition)
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ... (Keep existing UserProfile, Memory, Conversation types)

export type SovereigntyAction = {
  id?: string
  intent_label: string
  evolutionary_weight: number
  payload: any
  architect_sig?: boolean
  aethel_sig?: boolean
  arbi_sig?: boolean
  is_committed: boolean
}

// ── EXISTING LOGIC (Keep getSupabaseClient, getOrCreateUser, etc.) ──

// ── SOVEREIGNTY LEDGER ──────────────────────────────────────────────

/**
 * Proposes a high-impact action to the Ledger.
 * Tier 3 actions require Architect (Human) signature to commit.
 */
export async function proposeSovereigntyAction(
  supabase: SupabaseClient,
  action: Omit<SovereigntyAction, 'is_committed'>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('sovereignty_ledger')
      .insert([{
        ...action,
        aethel_sig: true, // Aethel auto-validates logical proposals
        is_committed: false
      }])
      .select('id')
      .single()

    if (error) throw error
    return data.id
  } catch (err) {
    console.error('Sovereignty Proposal Failed:', err)
    return null
  }
}

/**
 * Signs and commits an action. Used by the Architect Dashboard.
 */
export async function commitSovereigntyAction(
  supabase: SupabaseClient,
  actionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sovereignty_ledger')
      .update({ architect_sig: true, is_committed: true })
      .eq('id', actionId)
    
    return !error
  } catch {
    return false
  }
}

// ── UPDATED MEMORY CONTEXT ─────────────────────────────────────────

export function buildMemoryContext(profile: any, memories: any[]): string {
  const isEngineersMode = process.env.NEXT_PUBLIC_APP_MODE === 'engineers';
  const identity = isEngineersMode ? 'AETHEL' : 'ARBI';
  
  if (!profile && memories.length === 0) return ''
  const lines = profile ? [
    `name: ${profile.name || 'Unknown'}`,
    `location: ${profile.location || 'Johannesburg'}`,
    `stage: ${profile.stage}`
  ] : []
  
  memories.forEach(m => lines.push(`${m.key}: ${m.value}`))

  return `\n\n[CORE_CONTEXT_FOR_${identity}]:\n${lines.join('\n')}\n`
}


// Add this to lib/user.ts

/**
 * Generates a vector embedding for a piece of text.
 * This is the "Neural Fingerprint" of the memory.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // Replace with your preferred embedding API (e.g., OpenAI, Voyage, or HuggingFace)
  const response = await fetch('https://api.groq.com/openai/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text-v1.5', input: text })
  });
  const json = await response.json();
  return json.data[0].embedding;
}

export async function setSovereignMemory(
  supabase: SupabaseClient,
  userId: string,
  key: string,
  value: string
): Promise<void> {
  const embedding = await generateEmbedding(`${key}: ${value}`);
  
  await supabase.from('arbi_memory').upsert({
    user_id: userId,
    key,
    value,
    embedding,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,key' });
}
