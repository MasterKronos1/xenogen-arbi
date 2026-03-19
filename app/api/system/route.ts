export const runtime = 'nodejs'

/**
 * app/api/system/route.ts — System State Endpoint
 *
 * ARBI reads ecosystem state through this endpoint.
 * Returns current registry state + storage health.
 * Used by control dashboard (future) and ARBI's context builder.
 */

import { getEcosystemState } from '@/lib/ecosystem'
import { getStorageAdapter } from '@/lib/adapters/supabase-adapter'

export async function GET() {
  try {
    const adapter = getStorageAdapter()
    const state   = await getEcosystemState(adapter)

    return Response.json({
      ok:        true,
      timestamp: new Date().toISOString(),
      state,
    })
  } catch (err) {
    return Response.json({
      ok:    false,
      error: err instanceof Error ? err.message : 'System state unavailable',
    }, { status: 500 })
  }
}
