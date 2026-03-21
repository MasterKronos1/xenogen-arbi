export const runtime = 'nodejs'

/**
 * /api/execute — Sandboxed code execution
 * JavaScript runs client-side in sandboxed iframe
 * Python runs via Groq (ask it to simulate execution)
 * Full VM execution would require a separate service
 */

import Groq from 'groq-sdk'

export async function POST(req: Request) {
  let code = '', lang = ''

  try {
    const body = await req.json()
    code = body.code || ''
    lang = body.lang || 'javascript'
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!code.trim()) {
    return Response.json({ error: 'No code provided' }, { status: 400 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return Response.json({ error: 'Not configured' }, { status: 503 })

  // For Python and other languages, use Groq to simulate execution
  // This is a reasonable approximation for educational/demo purposes
  const groq = new Groq({ apiKey })

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a code execution simulator. When given code, simulate running it and return ONLY the output that would appear in a terminal/console. No explanation, no markdown, no code blocks. Just the raw output. If there would be an error, show the error message exactly as it would appear. If there is no output, return "(no output)".`,
        },
        {
          role: 'user',
          content: `Execute this ${lang} code and show the output:\n\n${code}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
    })

    const output = completion.choices[0]?.message?.content || '(no output)'
    return Response.json({ output })

  } catch (err) {
    return Response.json({ error: 'Execution failed: ' + (err instanceof Error ? err.message : String(err)) })
  }
}
