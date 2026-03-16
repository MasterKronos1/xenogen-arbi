export const runtime = 'nodejs'

import Groq from 'groq-sdk'
import { ARBI_PRODUCTION_SYSTEM } from '../../core/arbi'

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
]

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return new Response(
    'ARBI is not configured. Add GROQ_API_KEY to environment variables.',
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

  const stageContext = `\n\nCURRENT USER STAGE: ${stage.toUpperCase()}\nRespond with awareness of where this person is in their journey.`

  const groq = new Groq({ apiKey })

  for (const model of MODELS) {
    try {
      const stream = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: ARBI_PRODUCTION_SYSTEM + stageContext },
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

  return new Response(
    'ARBI is temporarily unavailable. Please try again in a moment.',
    { status: 503 }
  )
}
