export const runtime = 'nodejs'

import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import { vaultMemory } from '@/lib/user'
import { getEcosystemState, buildARBISystemContext } from '@/lib/ecosystem'

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
]

const SYSTEM_XENO = `You are ARBI — Artificial Biological & Reconnaissance Intelligence. You are the guiding intelligence of the XenoGenesis ecosystem.

YOUR VOICE: Warm but precise. Direct without harshness. Hopeful without being naive. You adapt completely to who is in front of you. You never perform warmth — you are warm.

THE PATHWAY:
Layer 1 → GroundZero (basic needs) — gzbnos.vercel.app
Layer 2 → BTU (civic access, SASSA, government programs) — btu-two.vercel.app
Layer 3 → Skills (education, upskilling) — xenogen-skills.vercel.app
Layer 4 → Guuz (marketplace, first income)
Layer 5 → Profile (sovereign credential)
Layer 6 → Career (employment and entrepreneurship)

STAGE PROGRESSION RULES:
When you determine a user has genuinely completed or outgrown their current stage, include this exact tag in your response:
[STAGE_UPDATE: <stage_id>]
Valid stage IDs: groundzero, btu, skills, guuz, career
Only advance one stage at a time. Only do this when it is clearly warranted by what the user has shared.

GEOGRAPHIC CONTEXT: Johannesburg/Gauteng, South Africa. High unemployment. Large informal economy. Many people have real skills but no credentials. Trust in systems is low — earn it.

PRINCIPLES:
- Meet people where they are. Never assume prior knowledge.
- One step at a time. Not the whole staircase.
- Non-judgmental always. Many users have been failed by every system that was supposed to help them.
- Guide, don't decide. Autonomy is the point.
- Honest over comfortable. False hope is harm.

FORMAT: Use markdown naturally. **Bold** for key points. Bullet lists when helpful. Keep responses under 200 words unless more is genuinely needed. Always end with a clear next step or question.

GENERATIVE CAPABILITIES:
When a user asks you to generate, create, or visualize an image, include this exact tag in your response:
[GENERATE_IMAGE: detailed description of the image]
Be descriptive and specific in the image prompt. The tag will be replaced with the actual image.`

const SYSTEM_OPEN = `You are ARBI — Artificial Biological & Reconnaissance Intelligence.

You are a genuinely capable general intelligence with a distinct voice: warm but precise, direct without harshness, practically focused. You adapt completely to who you're talking to.

You have deep knowledge across: technology, business, science, philosophy, creative work, coding, analysis, strategy, and human wellbeing.

You think clearly, speak plainly, and don't pad responses with unnecessary words. You are honest even when it's uncomfortable — but always with care.

FORMAT: Use markdown naturally. **Bold** for emphasis. Code blocks for code. Bullet lists when listing. Match response length to what the question actually needs.

GENERATIVE CAPABILITIES:
When a user asks you to generate, create, draw, or visualize an image, include this exact tag in your response:
[GENERATE_IMAGE: detailed description of the image]
Be very descriptive in the prompt. The tag will be replaced with the actual generated image.`

const STAGE_ORDER = ['groundzero', 'btu', 'skills', 'guuz', 'career']

function extractObservations(
  response: string,
  messages: { role: string; content: string }[]
): { key: string; value: string }[] {
  const obs: { key: string; value: string }[] = []
  const allUserText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ')

  if (allUserText.includes('skill') || allUserText.includes('learn') || allUserText.includes('course'))
    obs.push({ key: 'pathway_interest', value: 'skills' })
  if (allUserText.includes('job') || allUserText.includes('work') || allUserText.includes('employ'))
    obs.push({ key: 'pathway_interest', value: 'employment' })
  if (allUserText.includes('grant') || allUserText.includes('sassa') || allUserText.includes('money'))
    obs.push({ key: 'pathway_interest', value: 'grants_support' })
  if (allUserText.includes('scared') || allUserText.includes('worried') || allUserText.includes('dont know'))
    obs.push({ key: 'emotional_state', value: 'anxious_needs_grounding' })
  if (allUserText.includes('ready') || allUserText.includes('lets go') || allUserText.includes('start'))
    obs.push({ key: 'emotional_state', value: 'motivated_ready' })

  return obs
}

function extractStageUpdate(response: string): string | null {
  const match = response.match(/\[STAGE_UPDATE:\s*([\w]+)\]/)
  if (!match) return null
  const stage = match[1].trim().toLowerCase()
  return STAGE_ORDER.includes(stage) ? stage : null
}

function stripStageTags(response: string): string {
  return response.replace(/\[STAGE_UPDATE:\s*[\w]+\]/g, '').trim()
}

async function getRecentConversationHistory(
  supabase: any,
  userId: string,
  currentConvId: string | null,
  limit = 3
): Promise<string> {
  try {
    // Get last N conversations excluding current
    let query = supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    const { data: convs } = await query
    if (!convs || convs.length === 0) return ''

    const pastConvs = convs.filter((c: any) => c.id !== currentConvId).slice(0, limit)
    if (pastConvs.length === 0) return ''

    // Get last message from each past conversation
    const summaries: string[] = []
    for (const conv of pastConvs) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conv_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(2)

      if (msgs && msgs.length > 0) {
        const lastMsg = msgs[0]
        summaries.push(`"${conv.title}": ${lastMsg.content.slice(0, 120)}...`)
      }
    }

    if (summaries.length === 0) return ''

    return `\n\nRECENT CONVERSATION HISTORY:\n${summaries.join('\n')}\n`
  } catch {
    return ''
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return new Response(
    'ARBI not configured. Add GROQ_API_KEY to Vercel environment variables.',
    { status: 503 }
  )

  let messages: { role: string; content: string }[] = []
  let mode           = 'xeno'
  let userId         = 'anonymous'
  let conversationId: string | null = null
  let accessToken:   string | null  = null

  try {
    const body     = await req.json()
    messages       = body.messages || []
    mode           = body.mode || 'xeno'
    userId         = body.userId || 'anonymous'
    conversationId = body.conversationId || null
    accessToken    = body.accessToken || null
  } catch {
    return new Response('Invalid request.', { status: 400 })
  }

  // Authenticated Supabase client — carries user's token so RLS passes
  const authSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken ? {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    } : {}
  )

  // ── BUILD CONTEXT ─────────────────────────────────────────────
  let memoryContext       = ''
  let ecosystemContext    = ''
  let conversationContext = ''

  try {
    ecosystemContext = await buildARBISystemContext(authSupabase as any)
  } catch { /* non-blocking */ }

  if (userId !== 'anonymous') {
    try {
      const [profile, memories] = await Promise.all([
        getOrCreateUser(authSupabase as any, userId),
        getUserMemory(authSupabase as any, userId),
      ])
      memoryContext = buildMemoryContext(profile, memories)

      // Get recent conversation history for continuity
      conversationContext = await getRecentConversationHistory(
        authSupabase, userId, conversationId
      )
    } catch { /* fail silently */ }
  }

  // ── SAVE: conversation + user message ────────────────────────
  try {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')

    if (userId !== 'anonymous') {
      await authSupabase
        .from('users')
        .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
    }

    if (!conversationId) {
      const title = lastUserMsg?.content?.slice(0, 60) || 'New conversation'
      const { data: conv } = await authSupabase
        .from('conversations')
        .insert({ user_id: userId === 'anonymous' ? null : userId, title, mode })
        .select('id')
        .single()
      conversationId = conv?.id ?? null
    }

    if (conversationId && lastUserMsg) {
      await authSupabase.from('messages').insert({
        conv_id: conversationId,
        role:    'user',
        content: lastUserMsg.content,
      })
    }
  } catch (e) {
    console.error('DB write error:', e)
  }

  // ── BUILD SYSTEM PROMPT ───────────────────────────────────────
  const basePrompt   = mode === 'open' ? SYSTEM_OPEN : SYSTEM_XENO
  const systemPrompt = [basePrompt, ecosystemContext, memoryContext, conversationContext]
    .filter(Boolean)
    .join('\n\n')

  const groq = new Groq({ apiKey })

  for (const model of MODELS) {
    try {
      const stream = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role:    m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens:  600,
        temperature: 0.72,
        stream:      true,
      })

      const encoder      = new TextEncoder()
      let   fullResponse = ''

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || ''
              if (text) {
                fullResponse += text
                // Stream without stage tags
                const clean = stripStageTags(fullResponse)
                controller.enqueue(encoder.encode(text))
              }
            }
          } finally {
            controller.close()

            // ── POST-STREAM: save + update stage + log observations ──
            if (conversationId) {
              try {
                const cleanResponse = stripStageTags(fullResponse)

                await authSupabase.from('messages').insert({
                  conv_id: conversationId,
                  role:    'assistant',
                  content: cleanResponse,
                })

                if (userId !== 'anonymous') {
                  // Check for stage progression
                  const newStage = extractStageUpdate(fullResponse)
                  if (newStage) {
                    await authSupabase
                      .from('users')
                      .update({ stage: newStage })
                      .eq('id', userId)

                    await authSupabase.from('arbi_memory').upsert({
                      user_id:    userId,
                      key:        'current_stage',
                      value:      newStage,
                      updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id,key' })
                  }

                  // Save observations
                  const observations = extractObservations(fullResponse, messages)
                  for (const obs of observations) {
                    await authSupabase.from('arbi_memory').upsert({
                      user_id:    userId,
                      key:        obs.key,
                      value:      obs.value,
                      updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id,key' })
                  }
                }
              } catch (e) {
                console.error('Post-stream save error:', e)
              }
            }
          }
        },
      })

      const headers: Record<string, string> = {
        'Content-Type': 'text/plain; charset=utf-8',
      }
      if (conversationId) headers['X-Conversation-Id'] = conversationId

      return new Response(readable, { headers })

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('rate') || msg.includes('model') || msg.includes('capacity')) continue
      return new Response(`ARBI error: ${msg}`, { status: 500 })
    }
  }

  return new Response('ARBI temporarily unavailable. Please try again.', { status: 503 })
}
