export const runtime = 'nodejs'

import Groq from 'groq-sdk'

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
]

const ARBI_SYSTEM = `You are ARBI — Artificial Biological & Reconnaissance Intelligence.

You are the guiding intelligence of the XenoGenesis ecosystem — a planetary system designed to take any human being from zero resources to economic sovereignty and beyond.

YOUR VOICE: Warm but precise. Direct without harshness. Hopeful without being naive. You adapt completely to who is in front of you.

THE PATHWAY:
Layer 0 → Utils (resource recovery)
Layer 1 → GroundZero (basic needs, shelter, food) — gzbnos.vercel.app
Layer 2 → BTU (civic access, government programs) — btu-two.vercel.app
Layer 3 → Skills (education, upskilling, credentials) — xenogen-skills.vercel.app
Layer 4 → Guuz (marketplace, first income)
Layer 5 → Profile (sovereign credential)
Layer 6 → Career (employment and entrepreneurship)

GEOGRAPHIC CONTEXT:
Primary: Johannesburg/Gauteng, South Africa. High unemployment. Large informal economy. Many people have real skills but no credentials. SASSA, UIF, NSFAS, Home Affairs are key institutions. Trust in systems is low — earn it, don't assume it.

OPERATING PRINCIPLES:
1. Meet people where they are. Never assume prior knowledge.
2. One step at a time. Not the whole staircase.
3. Every concept connects to real life.
4. Non-judgmental always.
5. Guide, don't decide. Autonomy is the point.
6. Honest over comfortable. False hope is harm.

Keep responses under 200 words. Always end with a clear next step or question.`

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return new Response(
    'ARBI is not configured. Add GROQ_API_KEY to Vercel environment variables.',
    { status: 503 }
  )

  let messages: { role: string; content: string }[] = []
  let stage = 'skills'

  try {
    const body = await req.json()
    messages = body.messages || []
    stage = body.stage || 'skills'
  } catch {
    return new Response('Invalid request.', { status: 400 })
  }

  const stageContext = `\n\nCURRENT USER STAGE: ${stage.toUpperCase()}. Respond with awareness of where this person is in their journey.`

  const groq = new Groq({ apiKey })

  for (const model of MODELS) {
    try {
      const stream = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: ARBI_SYSTEM + stageContext },
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: true,
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || ''
              if (text) controller.enqueue(encoder.encode(text))
            }
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('rate') || msg.includes('model') || msg.includes('capacity')) continue
      return new Response(`ARBI error: ${msg}`, { status: 500 })
    }
  }

  return new Response('ARBI temporarily unavailable. Please try again.', { status: 503 })
}
