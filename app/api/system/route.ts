// app/api/system/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getEcosystemState } from '@/lib/ecosystem';
import { getStorageAdapter } from '@/lib/adapters/supabase-adapter';

export async function GET() {
  try {
    // 1. Initialize the adapter
    const adapter = getStorageAdapter();
    
    // 2. Fetch state using the adapter logic
    const state = await getEcosystemState(adapter);

    // 3. Explicit JSON Response
    return new Response(JSON.stringify({
      ok: true,
      timestamp: new Date().toISOString(),
      state,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("SYSTEM_ROUTE_CRITICAL_FAILURE:", err);
    return new Response(JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : 'System state unavailable',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
