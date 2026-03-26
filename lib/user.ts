// lib/user.ts

/**
 * Generates embeddings using a free Hugging Face model.
 * No cost, high performance for Llama-based systems.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
    {
      headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
      method: "POST",
      body: JSON.stringify({ inputs: text }),
    }
  );

  const result = await response.json();
  
  // Handle potential array wrapping from HF API
  return Array.isArray(result) ? result : result.data; 
}
