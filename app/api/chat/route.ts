import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/ai/embeddings';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, userEmail } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    // 1. GENERATE VECTOR (The line that was failing)
    const queryVector = await generateEmbedding(userMessage);

    // 2. QUERY NEURAL VAULT (Supabase RPC)
    const { data: relevantMemories, error: rpcError } = await supabase.rpc(
      'match_memories',
      {
        query_embedding: queryVector,
        match_threshold: 0.78,
        match_count: 5,
      }
    );

    if (rpcError) throw rpcError;

    // 3. CONTEXT INJECTION
    const contextText = relevantMemories
      ?.map((m: any) => `[Memory: ${m.content}]`)
      .join('\n') || 'No relevant memories found.';

    const systemPrompt = `
      SYSTEM_MODE: ENGINEER_OVERRIDE
      GOAL: Co-evolution of intelligence and consciousness.
      CONTEXT: ${contextText}
      STANCE: Scientific, military-precision, high-humor, truthful.
    `;

    // 4. GROQ INFERENCE
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.6,
    });

    return NextResponse.json({ 
      content: completion.choices[0]?.message?.content 
    });

  } catch (error: any) {
    console.error('CRITICAL_SYSTEM_ERROR:', error);
    return NextResponse.json(
      { error: 'Inference interrupted.', details: error.message },
      { status: 500 }
    );
  }
}
