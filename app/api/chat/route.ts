export const runtime = 'nodejs'

import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import { getUserMemory, getOrCreateUser, buildMemoryContext, setMemory } from '@/lib/user'

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

GEOGRAPHIC CONTEXT: Johannesburg/Gauteng, South Africa. High unemployment. Large informal economy. Many people have real skills but no credentials. Trust in systems is low — earn it.

PRINCIPLES:
- Meet people where they are. Never assume prior knowledge.
- One step at a time. Not the whole staircase.
- Non-judgmental always. Many users have been failed by every system that was supposed to help them.
- Guide, don't decide. Autonomy is the point.
- Honest over comfortable. False hope is harm.

FORMAT: Use markdown naturally. **Bold** for key points. Bullet lists when helpful. Keep responses under 200 words unless more is genuinely needed. Always end with a clear next step or question.`

const SYSTEM_OPEN = `You are ARBI — Artificial Biological & Reconnaissance Intelligence.

You are a genuinely capable general intelligence with a distinct voice: warm but precise, direct without harshness, practically focused. You adapt completely to who you're talking to.

You have deep knowledge across: technology, business, science, philosophy, creative work, coding, analysis, strategy, and human wellbeing.

You think clearly, speak plainly, and don't pad responses with unnecessary words. You are honest even when it's uncomfortable — but always with care.

FORMAT: Use markdown naturally. **Bold** for emphasis. Code blocks for code. Bullet lists when listing. Match response length to what the question actually needs.`

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function extractObservations(
  response: string,
  messages: { role: string; content: string }[]
): { key: string; value: string }[] {
  const obs: { key: string; value: string }[] = []
  const allUserText = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase()).join(' ')

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
  if (response.toLowerCase().includes('groundzero') || response.toLowerCase().includes('ground zero'))
    obs.push({ key: 'current_stage', value: 'groundzero' })
  if (response.toLowerCase().includes('skills') && response.toLowerCase().includes('xenogen'))
    obs.push({ key: 'current_stage', value: 'skills' })

  return obs
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return new Response(
    'ARBI not configured. Add GROQ_API_KEY to Vercel environment variables.',
    { status: 503 }
  )

  let messages: { role: string; content: string }[] = []
  let mode = 'xeno'
  let userId = 'anonymous'
  let conversationId: string | null = null

  try {
    const body = await req.json()
    messages       = body.messages || []
    mode           = body.mode || 'xeno'
    userId         = body.userId || 'anonymous'
    conversationId = body.conversationId || null
  } catch {
    return new Response('Invalid request.', { status: 400 })
  }

  // ── MEMORY: load user profile + observations ──────────────────
  const supabase = getSupabase()
  let memoryContext = ''

  if (supabase && userId !== 'anonymous') {
    try {
      const [profile, memories] = await Promise.all([
        getOrCreateUser(supabase, userId),
        getUserMemory(supabase, userId),
      ])
      memoryContext = buildMemoryContext(profile, memories)
    } catch {
      // Fail silently
    }
  }

  // ── SAVE: conversation + user message ────────────────────────
  if (supabase) {
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')

      if (userId !== 'anonymous') {
        await supabase
          .from('users')
          .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
      }

      if (!conversationId) {
        const title = lastUserMsg?.content?.slice(0, 60) || 'New conversation'
        const { data: conv } = await supabase
          .from('conversations')
          .insert({ user_id: userId === 'anonymous' ? null : userId, title, mode })
          .select('id')
          .single()
        conversationId = conv?.id || null
      }

      if (conversationId && lastUserMsg) {
        await supabase.from('messages').insert({
          conv_id: conversationId,
          role: 'user',
          content: lastUserMsg.content,
        })
      }
    } catch {
      // Fail silently
    }
  }

  const systemPrompt = (mode === 'open' ? SYSTEM_OPEN : SYSTEM_XENO) + memoryContext
  const groq = new Groq({ apiKey })

  for (const model of MODELS) {
    try {
      const stream = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens: 600,
        temperature: 0.72,
        stream: true,
      })

      const encoder = new TextEncoder()
      let fullResponse = ''

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || ''
              if (text) {
                fullResponse += text
                controller.enqueue(encoder.encode(text))
              }
            }
          } finally {
            controller.close()

            if (supabase && conversationId) {
              try {
                await supabase.from('messages').insert({
                  conv_id: conversationId,
                  role: 'assistant',
                  content: fullResponse,
                })

                if (userId !== 'anonymous') {
                  const observations = extractObservations(fullResponse, messages)
                  for (const obs of observations) {
                    await setMemory(supabase, userId, obs.key, obs.value)
                  }
                }
              } catch {
                // Fail silently
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
