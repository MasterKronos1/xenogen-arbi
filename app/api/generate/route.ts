export const runtime = 'nodejs'

/**
 * /api/generate — Generative capabilities router
 * Handles: image (Pollinations), speech (returns prompt for client TTS)
 */

export async function POST(req: Request) {
  let type = '', prompt = '', options: Record<string, unknown> = {}

  try {
    const body = await req.json()
    type    = body.type    || ''
    prompt  = body.prompt  || ''
    options = body.options || {}
  } catch {
    return new Response('Invalid request', { status: 400 })
  }

  // ── IMAGE — Pollinations.ai (no key needed) ───────────────────
  if (type === 'image') {
    const width   = (options.width  as number) || 1024
    const height  = (options.height as number) || 768
    const model   = (options.model  as string) || 'flux'
    const encoded = encodeURIComponent(prompt)
    const seed    = Math.floor(Math.random() * 999999)

    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`

    return Response.json({
      type:  'image',
      url:   imageUrl,
      prompt,
      model,
      width,
      height,
    })
  }

  // ── SPEECH — returns text for client-side Web Speech API ──────
  if (type === 'speech') {
    return Response.json({
      type: 'speech',
      text: prompt,
    })
  }

  return new Response('Unknown generation type', { status: 400 })
}
