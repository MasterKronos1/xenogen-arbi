export const runtime = 'nodejs'

import Groq from 'groq-sdk'

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

FORMAT: Use markdown naturally. **Bold** for emphasis. Code blocks for code. Bullet lists when listing. Match response length to what the question actually needs — brief for simple questions, thorough for complex ones.`

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return new Response(
    'ARBI not configured. Add GROQ_API_KEY to Vercel environment variables.',
    { status: 503 }
  )

  let messages: { role: string; content: string }[] = []
  let mode = 'xeno'

  try {
    const body = await req.json()
    messages = body.messages || []
    mode = body.mode || 'xeno'
  } catch {
    return new Response('Invalid request.', { status: 400 })
  }

  const systemPrompt = mode === 'open' ? SYSTEM_OPEN : SYSTEM_XENO
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
