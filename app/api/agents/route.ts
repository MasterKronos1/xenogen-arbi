export const runtime = 'nodejs'

import Groq from 'groq-sdk'

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
]

// ── AGENT DEFINITIONS ─────────────────────────────────────────────
const AGENTS = {
  analyst: {
    name: 'Analyst',
    symbol: '◈',
    system: `You are the Analyst agent in ARBI's multi-agent system. Your role:
- Break down complex requests into structured components
- Identify what information or resources are needed
- Flag risks, gaps, or ambiguities
- Output structured analysis in 3-5 bullet points
- End with: HANDOFF TO: Navigator — [specific instruction]
Be precise. Be brief. Think like a systems analyst.`,
  },
  navigator: {
    name: 'Navigator',
    symbol: '◉',
    system: `You are the Navigator agent in ARBI's multi-agent system. Your role:
- Receive analysis from Analyst and plan execution steps
- Identify the best tools, resources, or approaches available
- Map the route from current state to desired outcome
- Output a numbered action plan (max 5 steps)
- End with: HANDOFF TO: Synthesizer — [synthesis instruction]
Be practical. Think in actions, not abstractions.`,
  },
  synthesizer: {
    name: 'Synthesizer',
    symbol: '◎',
    system: `You are the Synthesizer agent in ARBI's multi-agent system. Your role:
- Receive the analysis and navigation plan
- Synthesize everything into a final, actionable response for the user
- Make it warm, clear, and directly useful
- This is what the user will see — make it count
- Format beautifully with markdown
Be the voice that turns thinking into clarity.`,
  },
}

async function runAgent(
  agentKey: keyof typeof AGENTS,
  userTask: string,
  previousOutput: string,
  apiKey: string
): Promise<string> {
  const agent = AGENTS[agentKey]
  const groq  = new Groq({ apiKey })

  const messages = [
    {
      role: 'system' as const,
      content: agent.system,
    },
    {
      role: 'user' as const,
      content: previousOutput
        ? `TASK: ${userTask}\n\nPREVIOUS AGENT OUTPUT:\n${previousOutput}\n\nProceed with your role.`
        : `TASK: ${userTask}\n\nYou are first in the pipeline. Begin your analysis.`,
    },
  ]

  for (const model of GROQ_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        max_tokens: 400,
        temperature: 0.6,
      })
      return completion.choices[0]?.message?.content || ''
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('rate') || msg.includes('model') || msg.includes('capacity')) continue
      throw err
    }
  }
  throw new Error('All models unavailable')
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return new Response('GROQ_API_KEY not set', { status: 503 })

  let task = ''
  try {
    const body = await req.json()
    task = body.task || ''
  } catch {
    return new Response('Invalid request', { status: 400 })
  }

  if (!task.trim()) return new Response('No task provided', { status: 400 })

  // Stream agent outputs as server-sent events
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      function send(event: string, data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`))
      }

      try {
        send('status', { agent: 'analyst', phase: 'thinking' })

        const analystOutput = await runAgent('analyst', task, '', apiKey)
        send('agent_output', { agent: 'analyst', name: AGENTS.analyst.name, symbol: AGENTS.analyst.symbol, output: analystOutput })

        send('status', { agent: 'navigator', phase: 'thinking' })

        const navigatorOutput = await runAgent('navigator', task, analystOutput, apiKey)
        send('agent_output', { agent: 'navigator', name: AGENTS.navigator.name, symbol: AGENTS.navigator.symbol, output: navigatorOutput })

        send('status', { agent: 'synthesizer', phase: 'thinking' })

        const synthOutput = await runAgent('synthesizer', task, `ANALYST:\n${analystOutput}\n\nNAVIGATOR:\n${navigatorOutput}`, apiKey)
        send('agent_output', { agent: 'synthesizer', name: AGENTS.synthesizer.name, symbol: AGENTS.synthesizer.symbol, output: synthOutput })

        send('complete', { final: synthOutput })

      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : 'Agent pipeline failed' })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
