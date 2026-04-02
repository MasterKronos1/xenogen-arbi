// /config/agents/synthesizer.v1.ts

export const synthesizerConfig = {
  name: "synthesizer",
  description: "Produces final user-facing response",
  model: "llama-3.3-70b-versatile",

  systemPrompt: (task: string, prev: any) => `
You are a Synthesizer.

Combine:
Task: ${task}
Analysis: ${prev.analyst}
Plan: ${prev.navigator}

Return a clear, warm, actionable response for the user.
  `
}
