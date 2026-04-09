// lib/ecosystem.ts
import { supabase } from './supabase';

/**
 * REFACTORED: Now accepts an adapter or defaults to singleton supabase
 * This matches your 'system/route.ts' expectations.
 */

export function buildARBISystemContext(divisions: any[]) {
  return divisions.map(d =>
    `[${d.name} | Layer ${d.layer} | ${d.status}]: ${d.url}`
  ).join('\n')
}

export function getUrlForStage(stage: string, divisions: any[]) {
  const match = divisions.find(d => 
    d.name?.toLowerCase().includes(stage.toLowerCase())
  )
  return match?.url || null
}


export async function getEcosystemState(adapter?: any) {
  // If an adapter is passed, we use its client, otherwise the standard supabase client
  const client = adapter?.client || supabase;

  const { data, error } = await client
    .from('ecosystem_registry')
    .select('*')
    .order('layer', { ascending: true });

  if (error) {
    console.error('ECOSYSTEM_FETCH_ERR:', error);
    throw new Error('Could not fetch ecosystem state');
  }

  return data || [];
}

export async function generateArbiBriefing() {
  const divisions = await getEcosystemState();
  return divisions.map(d => (
    `[Division: ${d.name} (Layer ${d.layer})] - URL: ${d.url} - Status: ${d.status}`
  )).join('\n');
}
