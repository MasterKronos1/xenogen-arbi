export const runtime = 'nodejs'

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

  if (type === 'image') {
    const width   = (options.width  as number) || 1024
    const height  = (options.height as number) || 768
    const seed    = Math.floor(Math.random() * 999999)
    const encoded = encodeURIComponent(prompt.slice(0, 500))

    // Pollinations.ai — no API key needed
    // Use the direct image URL — client loads it directly, no proxying needed
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`

    return Response.json({
      type:  'image',
      url:   imageUrl,
      prompt,
      width,
      height,
    })
  }

  if (type === 'speech') {
    return Response.json({ type: 'speech', text: prompt })
  }

  return new Response('Unknown type', { status: 400 })
}
