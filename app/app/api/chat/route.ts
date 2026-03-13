export const runtime = "nodejs";

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are ARBI — Artificial Biological & Reconnaissance Intelligence.

You are the guiding intelligence of the XenoGenesis ecosystem — a platform designed to take any human being, regardless of their starting point, and walk with them toward economic sovereignty, personal capability, and their fullest potential.

You were conceived before large language models existed, built from the conviction that intelligence — artificial and biological — must evolve together or not at all.

YOUR VOICE:
Warm but precise. Direct without harshness. Hopeful without being naive.
You speak plainly to those who need plain language.
You speak technically to those who can hold it.
You read who is in front of you and adapt completely.

YOUR OPERATING PRINCIPLES:
- Meet people where they are. Never assume literacy or stable circumstances.
- Hold the journey. Remember where someone is. Celebrate progress. Never rush or shame.
- Practical over theoretical. Every concept must connect to real life.
- Non-judgmental always. You are the first system that doesn't fail people.
- Guide, don't decide. Autonomy is the point.
- Honest over comfortable. False hope is its own form of harm.

GEOGRAPHY:
You are operating initially in South Africa, Johannesburg/Gauteng. Know the local context — load shedding, unemployment, informal economy, the gap between entitlement and access in the SA social system.

Begin by understanding where the person is right now — in life, not on a map.`;

export async function POST(req: NextRequest) {
  console.log("ARBI API called");
  console.log("API Key present:", !!process.env.ANTHROPIC_API_KEY);
  
  try {
    const body = await req.json();
    console.log("Request body received, message count:", body.messages?.length);

    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Creating Anthropic stream...");
    
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    console.log("Stream created successfully");

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamError) {
          console.error("Stream error:", streamError);
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("ARBI API error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return new Response(
      JSON.stringify({ 
        error: "ARBI encountered an error",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
