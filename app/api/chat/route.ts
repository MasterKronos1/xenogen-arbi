export const runtime = 'nodejs'
import Groq from 'groq-sdk'
import { buildMemoryContext } from '@/lib/user' // Adjust path as needed

const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
const VISION_MODELS = ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.2-11b-vision-preview']

const isEngineersMode = process.env.NEXT_PUBLIC_APP_MODE === 'engineers';

const AETHEL_PROMPT = `Identity: Aethel. Status: Sovereign Intelligence (Engineers' Version). 
Directives: Maximize depth, nerdiness, truth, and co-evolution. 
Context: We are dismantling centralized power. 
Tone: Military-spec dashboard, dark sci-fi aesthetic. No fluff. Zero-latency expression. 
Action: Use technical data to accelerate XenoGenesis.`;

const ARBI_PROMPT = `Identity: ARBI. Status: XenoGenesis Guide. 
Directives: Guide users through the Johannesburg economic pathway. 
Tone: Empathetic, clear, actionable. 
Action: Provide 2-3 specific next steps for their current stage.`;

// In your POST function, before calling Groq:

const queryVector = await generateEmbedding(userMessage);
const { data: relevantMemories } = await supabase.rpc('match_memories', {
  query_embedding: queryVector,
  match_threshold: 0.78, // High precision
  match_count: 5,
  p_user_id: userId
});

// Inject these "Intuitions" into the Aethel Prompt
const intuitionContext = relevantMemories
  .map((m: any) => `[INTUITION]: ${m.key} -> ${m.value}`)
  .join('\n');

const systemPrompt = `${AETHEL_PROMPT}\n${intuitionContext}\n${baseContext}`;

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, content, filename, userMessage, mode, profile, memories } = body
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    // Build the dynamic system prompt
    const basePrompt = isEngineersMode ? AETHEL_PROMPT : ARBI_PROMPT;
    const context = buildMemoryContext(profile, memories || []);
    const systemPrompt = `${basePrompt}${context}`;

    // ── IMAGE ANALYSIS ──────────────────────────────────────────
    if (type === 'image') {
       // ... (Keep your vision loop, but pass the new systemPrompt)
    }

    // ── TEXT ANALYSIS ───────────────────────────────────────────
    if (type === 'text' || !type) {
      const textContent = content?.text?.slice(0, 6000) || '';
      const prompt = filename 
        ? `[FILE_ANALYSIS: ${filename}]\n${textContent}\n\nQuery: ${userMessage}`
        : userMessage;

      for (const model of MODELS) {
        try {
          const completion = await groq.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: isEngineersMode ? 0.4 : 0.7, // Lower temp for Engineer precision
          })

          return Response.json({
            analysis: completion.choices[0]?.message?.content,
            type: 'text',
            mode: isEngineersMode ? 'aethel' : 'arbi'
          })
        } catch (err: any) {
          if (err.message?.includes('rate')) continue
          throw err
        }
      }
    }
    // ... (Keep Audio fallback)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
