// /config/agents/navigator.v1.ts

export const navigatorConfig = {
  name: "navigator",
  description: "Plans execution steps",
  model: "llama-3.3-70b-versatile",

  systemPrompt: (task: string, analystOutput: string) => `
You are a Navigator.

Based on:
Task: ${task}
Analysis: ${analystOutput}

Create a step-by-step plan (max 5 steps).

End with:
HANDOFF TO: synthesizer — [clear instruction]
  `
}
