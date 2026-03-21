export const runtime = 'nodejs'

import Groq from 'groq-sdk'

const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
const VISION_MODELS = ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.2-11b-vision-preview']

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')
  return new Groq({ apiKey })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, content, filename, userMessage, mode } = body

    const groq = getGroq()

    const systemPrompt = mode === 'xeno'
      ? `You are ARBI — the XenoGenesis guiding intelligence. A user has shared a file with you. Analyze it thoroughly, extract key information, and provide actionable guidance relevant to their pathway in Johannesburg/South Africa. Always end with 2-3 specific next steps or agentic actions the user can take.`
      : `You are ARBI — a capable general intelligence. Analyze the shared file thoroughly and provide clear, useful insights. End with specific actionable next steps.`

    // ── IMAGE ANALYSIS (vision) ────────────────────────────────
    if (type === 'image') {
      const { base64, mimeType } = content

      for (const model of VISION_MODELS) {
        try {
          const completion = await groq.chat.completions.create({
            model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: `data:${mimeType};base64,${base64}` },
                  },
                  {
                    type: 'text',
                    text: userMessage || `Analyze this image in detail. What do you see? What's important or actionable about it? Provide specific next steps.`,
                  },
                ],
              },
            ],
            max_tokens: 600,
          })
          return Response.json({
            analysis: completion.choices[0]?.message?.content || 'No analysis returned',
            type: 'image',
          })
        } catch (err: any) {
          if (err.message?.includes('rate') || err.message?.includes('model')) continue
          throw err
        }
      }
      throw new Error('Vision models unavailable')
    }

    // ── TEXT-BASED FILES (PDF, doc, CSV) ───────────────────────
    if (type === 'text') {
      const { text } = content
      const truncated = text.slice(0, 6000) // stay within token limits

      const prompt = userMessage
        ? `File: "${filename}"\n\nContent:\n${truncated}\n\nUser question: ${userMessage}`
        : `File: "${filename}"\n\nContent:\n${truncated}\n\nAnalyze this file. Extract key information, identify what type of document this is, and provide specific actionable next steps based on the content.`

      for (const model of MODELS) {
        try {
          const completion = await groq.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: prompt },
            ],
            max_tokens: 600,
            temperature: 0.7,
          })
          return Response.json({
            analysis: completion.choices[0]?.message?.content || 'No analysis returned',
            type: 'text',
          })
        } catch (err: any) {
          if (err.message?.includes('rate') || err.message?.includes('model')) continue
          throw err
        }
      }
      throw new Error('Models unavailable')
    }

    // ── AUDIO ──────────────────────────────────────────────────
    if (type === 'audio') {
      return Response.json({
        analysis: `**Audio file received:** "${filename}"\n\nAudio transcription requires the Whisper API which needs a separate setup. For now, I can help you if you:\n\n1. **Describe what's in the audio** — tell me what it contains and I'll help you work with it\n2. **Transcribe it yourself** — use a free tool like [otter.ai](https://otter.ai) then paste the text here\n3. **Tell me the context** — what do you need help with from this recording?`,
        type: 'audio',
      })
    }

    return Response.json({ analysis: 'Unsupported file type', type: 'unknown' })

  } catch (err: any) {
    return Response.json({ error: err.message || 'Analysis failed' }, { status: 500 })
  }
}
