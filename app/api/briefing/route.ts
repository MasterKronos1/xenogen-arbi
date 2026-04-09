export const runtime = 'nodejs'

/**
 * /api/briefing — System briefing endpoint
 * ARBI reads the full live ecosystem state and generates a briefing.
 * You can ask ARBI "brief me on the system" and she calls this.
 * Also useful for: onboarding collaborators, system health checks,
 * understanding what's built vs planned.
 */

import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import { getEcosystemState } from '@/lib/ecosystem'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const focus = searchParams.get('focus') || 'full'  // full | division | health

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get live ecosystem state
    const state = await getEcosystemState(supabase)

    // Get live user/conversation counts
    const [
      { count: userCount },
      { count: convCount },
      { count: msgCount },
      { count: memCount },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('conversations').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('arbi_memory').select('*', { count: 'exact', head: true }),
    ])

    // Build briefing prompt
    const systemData = `
XENOGENESIS SYSTEM STATE
========================
Registry source: ${state.source}
Active platforms: ${state.active_count}
Planned platforms: ${state.planned_count}
Storage: ${state.storage_status}

PLATFORMS:
${state.organizations.map((o: any) => `
${o.name} [${o.status.toUpperCase()}]
  ${o.description}
  URL: ${o.url || 'not deployed'}
  Layer: ${o.layer || 'N/A'}
  Services: ${o.services.join(', ')}
`).join('')}

LIVE METRICS:
  Users: ${userCount || 0}
  Conversations: ${convCount || 0}
  Messages: ${msgCount || 0}
  Memory tags: ${memCount || 0}

API STATUS:
${Object.entries(state.api_status).map(([k,v]) => `  ${k}: ${v}`).join('\n')}
`

    // Generate AI briefing
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
          content: `You are ARBI — the XenoGenesis system intelligence. Generate a clear, structured briefing of the current system state. Be honest about what's built vs planned. Be specific about what needs attention. Use markdown formatting. Keep it concise but complete.`,
        },
        {
          role: 'user',
          content: `Generate a ${focus} system briefing based on this data:\n\n${systemData}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    })

    const briefing = completion.choices[0]?.message?.content || systemData

    return Response.json({
      briefing,
      state,
      metrics: {
        users:         userCount  || 0,
        conversations: convCount  || 0,
        messages:      msgCount   || 0,
        memories:      memCount   || 0,
      },
      generated_at: new Date().toISOString(),
    })

  } catch (err) {
    return Response.json({
      error:   err instanceof Error ? err.message : 'Briefing failed',
      briefing: 'System briefing unavailable. Check /api/system for raw state.',
    }, { status: 500 })
  }
}
