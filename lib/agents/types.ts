
// /lib/agents/types.ts

export type AgentContext = {
  task: string
  previousOutputs?: Record<string, string>
}

export type AgentResult = {
  output: string
  handoff?: string
}

export type Agent = {
  name: string
  description: string
  model: string
  systemPrompt: (ctx: AgentContext) => string
  run: (ctx: AgentContext) => Promise<AgentResult>
}
