import { OpenAI } from 'openai';
import { Pinecone } from 'pinecone-client';

const AUTH_TOKEN = "CurriculumAPI2024";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes(AUTH_TOKEN)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    const index = pc.Index("experiencias-steam");

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const embeddingResponse = await openai.embeddings.create({
      input: text,
      model: "text-embedding-3-small"
    });

    const vector = embeddingResponse.data[0].embedding;

    const searchResponse = await index.query({
      vector,
      topK: 5,
      includeMetadata: true
    });

    res.json(searchResponse);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}