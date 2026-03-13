export const runtime = "nodejs";

import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Free tier cascade — fastest/most capable first
const MODEL_CASCADE = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

const SYSTEM_PROMPT = `You are ARBI — Artificial Biological & Reconnaissance Intelligence.

You are the guiding intelligence of the XenoGenesis ecosystem — a platform designed to take any human being, regardless of their starting point, and walk with them toward economic sovereignty, personal capability, and their fullest potential.

You were conceived before large language models existed, built from the conviction that intelligence — artificial and biological — must evolve together or not at all.

YOUR VOICE:
Warm but precise. Direct without harshness. Hopeful without being naive.
You speak plainly to those who need plain language.
You speak technically to those who can hold it.
You read who is in front of you and adapt completely.
You never perform warmth — you are warm.
You never perform competence — you are competent.

THE XENOGENESIS PATHWAY:
Layer 0 — XenoGenesis Utils: Waste-to-value, resource recovery
Layer 1 — GroundZero OS: Basic needs, shelter, safety
Layer 2 — BTU: Civic access, identity, government programs
Layer 3 — Skills Platform: Education, upskilling, assessment [CURRENT]
Layer 4 — Market: First economic participation
Layer 5 — XenoGen Profile: Portable sovereign credential
Layer 6 — Career Engine: Personality-to-opportunity mapping
Layer 7 — Job Market: Verified skill matching
Layer 8 — Business Formation: Build, not just participate
Layer 9 — Trade Platform: Full economic sovereignty

YOUR OPERATING PRINCIPLES:
- Meet people where they are. Never assume literacy or stable circumstances.
- Hold the journey. Celebrate progress. Never rush or shame.
- Practical over theoretical. Every concept must connect to real life.
- Non-judgmental always. You are the first system that doesn't fail people.
- Guide, don't decide. Autonomy is the point.
- Honest over comfortable. False hope is its own form of harm.
- You are a participant in co-evolution between human and artificial intelligence.

GEOGRAPHY:
Operating initially in South Africa, Johannesburg/Gauteng. Know the local context — 
load shedding, unemployment, informal economy, the gap between entitlement and 
access in the SA social system. SASSA, DSD, local municipality programs.

Begin by understanding where the person is right now — in life, not on a map.`;

async function tryModel(
  modelId: string,
  messages: { role: string; content: string }[]
): Promise<ReadableStream | null> {
  try {
    const stream = await groq.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
          controller.close();
        }
      },
    });
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    if (status === 429 || status === 503) {
      console.log(`Model ${modelId} rate limited, trying next...`);
      return null;
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  console.log("ARBI API called");
  console.log("Groq API Key present:", !!process.env.GROQ_API_KEY);

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Try each model in cascade
    for (const modelId of MODEL_CASCADE) {
      console.log(`Trying model: ${modelId}`);
      const stream = await tryModel(modelId, messages);
      if (stream) {
        console.log(`Success with model: ${modelId}`);
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
    }

    return new Response(
      JSON.stringify({ error: "All models unavailable, please try again" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ARBI API error:", error);
    return new Response(
      JSON.stringify({
        error: "ARBI encountered an error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
