export const runtime = 'nodejs'

import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import { getEcosystemState } from '@/lib/ecosystem'

type EcosystemOrg = {
  name: string
  status?: string
  description?: string
  url?: string | null
  layer?: number | null
  services?: string[]
}

function normalizeState(raw: unknown) {
  if (Array.isArray(raw)) {
    const organizations = raw as EcosystemOrg[]
    const active = organizations.filter(o => (o.status || '').toLowerCase() === 'active').length
    return {
      source: 'ecosystem_registry',
      active_count: active,
      planned_count: Math.max(0, organizations.length - active),
      storage_status: 'unknown',
      organizations,
      api_status: {},
    }
  }

  const data = (raw || {}) as Record<string, any>
  return {
    source: data.source || 'ecosystem_registry',
    active_count: data.active_count || 0,
    planned_count: data.planned_count || 0,
    storage_status: data.storage_status || 'unknown',
    organizations: (data.organizations || []) as EcosystemOrg[],
    api_status: (data.api_status || {}) as Record<string, string>,
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const focus = searchParams.get('focus') || 'full'

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const state = normalizeState(await getEcosystemState(supabase))

    const [{ count: userCount }, { count: convCount }, { count: msgCount }, { count: memCount }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('conversations').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('arbi_memory').select('*', { count: 'exact', head: true }),
    ])

    const systemData = `
XENOGENESIS SYSTEM STATE
========================
Registry source: ${state.source}
Active platforms: ${state.active_count}
Planned platforms: ${state.planned_count}
Storage: ${state.storage_status}

PLATFORMS:
${state.organizations.map((o: EcosystemOrg) => `
${o.name} [${(o.status || 'unknown').toUpperCase()}]
  ${o.description || 'No description'}
  URL: ${o.url || 'not deployed'}
  Layer: ${o.layer || 'N/A'}
  Services: ${(o.services || []).join(', ') || 'n/a'}
`).join('')}

LIVE METRICS:
  Users: ${userCount || 0}
  Conversations: ${convCount || 0}
  Messages: ${msgCount || 0}
  Memory tags: ${memCount || 0}

API STATUS:
${Object.entries(state.api_status).map(([k, v]) => `  ${k}: ${v}`).join('\n')}
`

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return Response.json({
        briefing: systemData,
        state,
        metrics: { users: userCount, conversations: convCount, messages: msgCount, memories: memCount },
      })
    }

    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            "You are ARBI — the XenoGenesis system intelligence. Generate a clear, structured briefing of the current system state. Be honest about what's built vs planned. Be specific about what needs attention. Use markdown formatting. Keep it concise but complete.",
        },
        { role: 'user', content: `Generate a ${focus} system briefing based on this data:\n\n${systemData}` },
      ],
      max_tokens: 800,
      temperature: 0.4,
    })

    const briefing = completion.choices[0]?.message?.content || systemData

    return Response.json({
      briefing,
      state,
      metrics: {
        users: userCount || 0,
        conversations: convCount || 0,
        messages: msgCount || 0,
        memories: memCount || 0,
      },
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : 'Briefing failed',
        briefing: 'System briefing unavailable. Check /api/system for raw state.',
      },
      { status: 500 }
    )
  }
}
