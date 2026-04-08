export type AgentName = "analyst" | "navigator" | "synthesizer"

export type AgentContext = {
  task: string
  previousOutputs?: Record<string, string>
}

export type AgentResult = {
  agentName: AgentName
  output: string
  handoff?: string
  error?: string
}

export type AgentConfig = {
  name: AgentName
  description: string
  model: string
  systemPrompt: (task: string, previousOutputs?: Record<string, string>) => string
}

export type PipelineResult = {
  task: string
  outputs: Record<string, string>
  final: string
  error?: string
}
