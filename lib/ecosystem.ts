/**
 * lib/ecosystem.ts — XenoGenesis Ecosystem Registry
 *
 * Single source of truth for all platform state.
 * Reads from Supabase ecosystem_registry table (live).
 * Falls back to config/registry.json (seed data) if DB unavailable.
 * Portable: swap storage by updating the adapter only.
 */

import registryJson from '@/config/registry.json'

// ── TYPES ─────────────────────────────────────────────────────────

export type OrgStatus = 'active' | 'planned' | 'inactive' | 'degraded'

export type Organization = {
  id:          string
  org_id:      string
  name:        string
  description: string
  status:      OrgStatus
  url:         string | null
  repo:        string | null
  platform:    string
  services:    string[]
  layer:       number | null
  last_checked?: string | null
  last_ping_ok?: boolean | null
  updated_at?:  string
}

export type EcosystemState = {
  organizations:  Organization[]
  active_count:   number
  planned_count:  number
  storage_status: string
  api_status:     Record<string, string>
  pathway_stages: typeof registryJson.pathway_stages
  summary:        string
  source:         'supabase' | 'json'
}

export type PathwayStage = {
  id:      string
  label:   string
  done:    boolean
  current: boolean
  url:     string
}

// ── PATHWAY ───────────────────────────────────────────────────────

const STAGE_ORDER = ['groundzero', 'btu', 'skills', 'guuz', 'career']

const PATHWAY_BASE: PathwayStage[] = [
  { id: 'groundzero', label: 'GroundZero', done: false, current: false, url: 'https://gzbnos.vercel.app' },
  { id: 'btu',        label: 'BTU',        done: false, current: false, url: 'https://btu-two.vercel.app' },
  { id: 'skills',     label: 'Skills',     done: false, current: false, url: 'https://xenogen-skills.vercel.app' },
  { id: 'guuz',       label: 'Guuz',       done: false, current: false, url: '/guuz' },
  { id: 'career',     label: 'Career',     done: false, current: false, url: '#' },
]

export function resolvePathway(currentStage: string): PathwayStage[] {
  const currentIndex = STAGE_ORDER.indexOf(currentStage.trim())
  return PATHWAY_BASE.map((stage, i) => ({
    ...stage,
    done:    i < currentIndex,
    current: i === currentIndex,
  }))
}

export function getPathwayProgress(currentStage: string): {
  completed: number
  total:     number
  percent:   number
} {
  const currentIndex = Math.max(0, STAGE_ORDER.indexOf(currentStage.trim()))
  return {
    completed: currentIndex,
    total:     STAGE_ORDER.length,
    percent:   Math.round((currentIndex / STAGE_ORDER.length) * 100),
  }
}

export function getUrlForStage(stageId: string): string | null {
  const stage = PATHWAY_BASE.find(s => s.id === stageId)
  return stage?.url && stage.url !== '#' ? stage.url : null
}

// ── REGISTRY: read from Supabase, fall back to JSON ───────────────

async function getOrgsFromSupabase(supabase: any): Promise<Organization[] | null> {
  try {
    const { data, error } = await supabase
      .from('ecosystem_registry')
      .select('*')
      .order('layer', { ascending: true, nullsFirst: false })

    if (error || !data) return null

    return data.map((row: any) => ({
      ...row,
      org_id:   row.org_id,
      services: Array.isArray(row.services)
        ? row.services
        : (typeof row.services === 'string' ? JSON.parse(row.services) : []),
    }))
  } catch {
    return null
  }
}

function getOrgsFromJson(): Organization[] {
  return (registryJson.organizations as any[]).map(o => ({
    id:      o.id,
    org_id:  o.id,
    name:    o.name,
    description: o.description,
    status:  o.status,
    url:     o.url,
    repo:    o.repo,
    platform: o.platform,
    services: o.services,
    layer:   null,
  }))
}

// ── ECOSYSTEM STATE ───────────────────────────────────────────────

export async function getEcosystemState(supabase?: any): Promise<EcosystemState> {
  let orgs: Organization[]
  let source: 'supabase' | 'json' = 'json'

  if (supabase) {
    const fromDb = await getOrgsFromSupabase(supabase)
    if (fromDb && fromDb.length > 0) {
      orgs   = fromDb
      source = 'supabase'
    } else {
      orgs = getOrgsFromJson()
    }
  } else {
    orgs = getOrgsFromJson()
  }

  const active  = orgs.filter(o => o.status === 'active')
  const planned = orgs.filter(o => o.status === 'planned')

  // Ping storage
  let storageStatus = 'unknown'
  if (supabase) {
    try {
      const { error } = await supabase.from('users').select('id').limit(1)
      storageStatus = error ? 'degraded' : 'active'
    } catch {
      storageStatus = 'degraded'
    }
  }

  const apiStatus: Record<string, string> = {}
  for (const [key, val] of Object.entries((registryJson as any).api_connections || {})) {
    apiStatus[key] = (val as any).status ?? 'unknown'
  }

  const summary = buildSystemSummary(active, planned, storageStatus, source)

  return {
    organizations:  orgs,
    active_count:   active.length,
    planned_count:  planned.length,
    storage_status: storageStatus,
    api_status:     apiStatus,
    pathway_stages: registryJson.pathway_stages,
    summary,
    source,
  }
}

// ── SYSTEM SUMMARY FOR ARBI ───────────────────────────────────────

function buildSystemSummary(
  active:  Organization[],
  planned: Organization[],
  storage: string,
  source:  string
): string {
  const activeNames  = active.map(o => o.name).join(', ')
  const plannedNames = planned.map(o => o.name).join(', ')

  return `
XENOGENESIS ECOSYSTEM STATE (source: ${source}):
Active platforms (${active.length}): ${activeNames}
Planned platforms (${planned.length}): ${plannedNames}
Storage: ${storage}

ACTIVE PLATFORM URLS:
${active.filter(o => o.url).map(o => `- ${o.name}: ${o.url}`).join('\n')}

PATHWAY LAYERS:
${active.filter(o => o.layer).sort((a,b)=>(a.layer||0)-(b.layer||0)).map(o => `- Layer ${o.layer}: ${o.name} — ${o.url}`).join('\n')}

When guiding users between platforms, use these exact URLs. Only reference active platforms unless specifically asked about planned ones.
`.trim()
}

// ── ARBI CONTEXT BUILDER ──────────────────────────────────────────

export async function buildARBISystemContext(supabase?: any): Promise<string> {
  const state = await getEcosystemState(supabase)
  return state.summary
}

// ── OBSERVATION PIPELINE ──────────────────────────────────────────

export async function logObservation(
  supabase: any,
  userId:   string,
  key:      string,
  value:    string,
  source:   string = 'arbi_conversation'
): Promise<void> {
  try {
    await supabase.from('arbi_memory').upsert({
      user_id:    userId,
      key,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,key' })

    await supabase.from('observation_log').insert({
      user_id:    userId,
      key,
      value,
      source,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Fail silently
  }
}

// ── REGISTRY UPDATER (for admin/ARBI use) ─────────────────────────

export async function updateOrgStatus(
  supabase:  any,
  orgId:     string,
  updates:   Partial<Organization>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ecosystem_registry')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('org_id', orgId)
    return !error
  } catch {
    return false
  }
}

export async function pingOrg(
  supabase: any,
  org:      Organization
): Promise<boolean> {
  if (!org.url || org.url.startsWith('/')) return false
  try {
    const res    = await fetch(org.url, { method: 'HEAD' })
    const ok     = res.ok
    await supabase.from('ecosystem_registry').update({
      last_checked: new Date().toISOString(),
      last_ping_ok: ok,
      status:       ok ? 'active' : 'degraded',
      updated_at:   new Date().toISOString(),
    }).eq('org_id', org.org_id)
    return ok
  } catch {
    await supabase.from('ecosystem_registry').update({
      last_checked: new Date().toISOString(),
      last_ping_ok: false,
      status:       'degraded',
      updated_at:   new Date().toISOString(),
    }).eq('org_id', org.org_id)
    return false
  }
}
