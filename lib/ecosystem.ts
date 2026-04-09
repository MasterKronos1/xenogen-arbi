import { supabase as defaultSupabase } from './supabase'

function resolveClient(adapter?: any) {
  if (adapter?.from) return adapter
  if (adapter?.client?.from) return adapter.client
  return defaultSupabase.client
}

export async function getEcosystemState(adapter?: any) {
  const client = resolveClient(adapter)

  const { data, error } = await client
    .from('ecosystem_registry')
    .select('*')
    .order('layer', { ascending: true })

  if (error) {
    console.error('ECOSYSTEM_FETCH_ERR:', error)
    throw new Error('Could not fetch ecosystem state')
  }

  return data || []
}

export async function generateArbiBriefing() {
  const divisions = await getEcosystemState()
  return divisions
    .map((d: any) => `[Division: ${d.name} (Layer ${d.layer})] - URL: ${d.url} - Status: ${d.status}`)
    .join('\n')
}

export async function buildARBISystemContext(adapter?: any): Promise<string> {
  const rows = await getEcosystemState(adapter)
  if (!rows.length) return ''

  return [
    'ECOSYSTEM CONTEXT:',
    ...rows.map((r: any) => `- Layer ${r.layer}: ${r.name} (${r.status}) ${r.url ? `-> ${r.url}` : ''}`.trim()),
  ].join('\n')
}

export function getUrlForStage(stageId: string): string | null {
  const map: Record<string, string> = {
    groundzero: 'https://gzbnos.vercel.app',
    btu: 'https://btu-two.vercel.app',
    skills: 'https://xenogen-skills.vercel.app',
    guuz: 'https://guuz.vercel.app',
    career: 'https://xenogen-career.vercel.app',
  }
  return map[(stageId || '').toLowerCase()] || null
}
