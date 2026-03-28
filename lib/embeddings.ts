/**
 * XENOGEN_EMBEDDINGS: The Rosetta Stone.
 * Uses Mixedbread AI (Free Tier) or HuggingFace.
 */

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Using Mixedbread.ai - Great free tier, 1024/1536 dims.
    // Replace with your API key in Vercel Env
    const response = await fetch('https://api.mixedbread.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MIXEDBREAD_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mixedbread-ai/mxbai-embed-large-v1', // High performance, low cost
        input: text,
      }),
    });

    const data = await response.json();
    
    // Return the vector array
    return data.data[0].embedding;
  } catch (error) {
    console.error('EMBEDDING_GEN_FAILURE:', error);
    // Fallback: Return a zero-vector so the system doesn't hard-crash, 
    // but we need to fix this for RAG to work.
    return new Array(1024).fill(0); 
  }
}
