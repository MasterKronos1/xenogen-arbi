/**
 * lib/ecosystem.ts — XenoGenesis Ecosystem Registry
 *
 * Single source of truth for all platform state.
 * ARBI reads this to understand the ecosystem she operates within.
 * All platform integrations are defined here.
 * To add a new platform: update config/registry.json only.
 */

import registry from '@/config/registry.json'
import type { StorageAdapter } from './adapters/storage'

// ── TYPES ─────────────────────────────────────────────────────────

export type OrgStatus = 'active' | 'planned' | 'inactive' | 'degraded'

export type Organization = {
  id:          string
  name:        string
  description: string
  status:      OrgStatus
  url:         string | null
  repo:        string | null
  platform:    string
  services:    string[]
}

export type ServiceStatus = {
  org_id:      string
  org_name:    string
  service:     string
  status:      OrgStatus
  url:         string | null
  last_checked: string
}

export type EcosystemState = {
  organizations:   Organization[]
  active_count:    number
  planned_count:   number
  storage_status:  string
  api_status:      Record<string, string>
  pathway_stages:  typeof registry.pathway_stages
  summary:         string
}

// ── REGISTRY READS ─────────────────────────────────────────────────

export function getAllOrganizations(): Organization[] {
  return registry.organizations as Organization[]
}

export function getOrganization(id: string): Organization | null {
  return (registry.organizations as Organization[]).find(o => o.id === id) ?? null
}

export function getActiveOrganizations(): Organization[] {
  return (registry.organizations as Organization[]).filter(o => o.status === 'active')
}

export function getOrgForStage(stageId: string): Organization | null {
  const stage = registry.pathway_stages.find(s => s.id === stageId)
  if (!stage) return null
  return getOrganization(stage.org_id) ?? null
}

export function getPathwayStages() {
  return registry.pathway_stages
}

export function getUrlForStage(stageId: string): string | null {
  const org = getOrgForStage(stageId)
  return org?.url ?? null
}

// ── SYSTEM STATE ──────────────────────────────────────────────────

export async function getEcosystemState(
  adapter?: StorageAdapter
): Promise<EcosystemState> {
  const orgs    = getAllOrganizations()
  const active  = orgs.filter(o => o.status === 'active')
  const planned = orgs.filter(o => o.status === 'planned')

  // Ping storage if adapter provided
  let storageStatus = 'unknown'
  if (adapter) {
    const alive = await adapter.ping()
    storageStatus = alive ? 'active' : 'degraded'
  }

  const apiStatus: Record<string, string> = {}
  for (const [key, val] of Object.entries(registry.api_connections)) {
    apiStatus[key] = (val as any).status ?? 'unknown'
  }

  const summary = buildSystemSummary(active, planned, storageStatus)

  return {
    organizations:  orgs,
    active_count:   active.length,
    planned_count:  planned.length,
    storage_status: storageStatus,
    api_status:     apiStatus,
    pathway_stages: registry.pathway_stages,
    summary,
  }
}

// ── SYSTEM SUMMARY FOR ARBI ───────────────────────────────────────
// Injected into ARBI's system prompt so she understands the ecosystem

function buildSystemSummary(
  active:  Organization[],
  planned: Organization[],
  storage: string
): string {
  const activeNames  = active.map(o => o.name).join(', ')
  const plannedNames = planned.map(o => o.name).join(', ')

  return `
XENOGENESIS ECOSYSTEM STATE:
Active platforms (${active.length}): ${activeNames}
Planned platforms (${planned.length}): ${plannedNames}
Storage: ${storage}
Registry version: ${registry.version}

ACTIVE PLATFORM URLS:
${active.filter(o => o.url).map(o => `- ${o.name}: ${o.url}`).join('\n')}

When guiding users between platforms, use these exact URLs. Only reference active platforms unless specifically asked about planned ones.
`.trim()
}

// ── PIPELINE: Observation logging ─────────────────────────────────
// The one automated pipeline: observation → storage → registry update

export type ObservationLog = {
  user_id:    string
  key:        string
  value:      string
  source:     string
  created_at: string
}

export async function logObservation(
  adapter:  StorageAdapter,
  userId:   string,
  key:      string,
  value:    string,
  source:   string = 'arbi_conversation'
): Promise<void> {
  try {
    // 1. Write to arbi_memory via adapter (no direct Supabase call)
    await adapter.upsert('arbi_memory', {
      user_id:    userId,
      key,
      value,
      updated_at: new Date().toISOString(),
    }, 'user_id,key')

    // 2. Log to observation_log table for audit trail
    await adapter.insert('observation_log', {
      user_id:    userId,
      key,
      value,
      source,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Fail silently — observations are enhancement, not critical path
  }
}

// ── CONTEXT BUILDER FOR ARBI ──────────────────────────────────────
// Builds the full system context string injected into ARBI's prompt

export async function buildARBISystemContext(
  adapter?: StorageAdapter
): Promise<string> {
  const state = await getEcosystemState(adapter)
  return state.summary
}
