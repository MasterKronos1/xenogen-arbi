// /lib/agents/runner.ts

import { agentRegistry } from "./registry"
import { groqClient } from "@/lib/groq" // your existing setup

export async function runAgent(
  agentName: string,
  ctx: any
): Promise<string> {
  const agent = agentRegistry[agentName]

  if (!agent) throw new Error(`Agent ${agentName} not found`)

  const prompt = agent.systemPrompt(ctx.task, ctx.previousOutputs)

  const completion = await groqClient.chat.completions.create({
    model: agent.model,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: ctx.task },
    ],
  })

  return completion.choices[0]?.message?.content || ""
}
