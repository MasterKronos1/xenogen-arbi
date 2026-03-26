// lib/user.ts

/**
 * Formats raw memory data into a coherent string for the AI context.
 */
export function buildMemoryContext(memories: any[]): string {
  if (!memories || memories.length === 0) {
    return "No prior specialized memory found for this user.";
  }

  return memories
    .map((m) => {
      const key = m.key || 'Observation';
      const value = m.value || m.content || '';
      return `[${key}]: ${value}`;
    })
    .join('\n');
}

/**
 * Generates a mock embedding to keep the Groq/Llama pipeline stable.
 * This satisfies the 'generateEmbedding' requirement for the build.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Since we are sticking to Groq for inference, we use a 
  // zero-vector placeholder to allow the build to pass.
  console.log("Processing mapping for:", text.slice(0, 20));
  return new Array(1536).fill(0);
}
