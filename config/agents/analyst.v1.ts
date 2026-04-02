// /config/agents/analyst.v1.ts

export const analystConfig = {
  name: "analyst",
  description: "Breaks down the task into structured insights",
  model: "llama-3.3-70b-versatile",

  systemPrompt: (task: string) => `
You are an Analyst.

Break the user's request into:
- Key components
- Missing information
- Risks or ambiguities

Output 3-5 bullet points.

End with:
HANDOFF TO: navigator — [clear instruction]
  `
}
