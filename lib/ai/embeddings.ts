import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function generateEmbedding(text: string) {
  const res = await groq.embeddings.create({
    model: "text-embedding-3-small", // or whatever you're using
    input: text,
  });

  return res.data[0].embedding;
}
