import { groqClient } from "@/lib/groq"
import { agentRegistry } from "./registry"
import { AgentName, AgentContext, AgentResult } from "./types"

export async function runAgent(
  agentName: AgentName,
  ctx: AgentContext
): Promise<AgentResult> {
  const agent = agentRegistry[agentName]

  if (!agent) {
    return {
      agentName,
      output: "",
      error: `Agent "${agentName}" not found in registry`,
    }
  }

  try {
    const systemPrompt = agent.systemPrompt(ctx.task, ctx.previousOutputs)

    const completion = await groqClient.chat.completions.create({
      model: agent.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: ctx.task },
      ],
    })

    const output = completion.choices[0]?.message?.content ?? ""

    const handoffMatch = output.match(/HANDOFF TO:\s*(\w+)\s*—\s*(.+)/)
    const handoff = handoffMatch ? handoffMatch[0] : undefined

    return { agentName, output, handoff }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return { agentName, output: "", error: message }
  }
}
