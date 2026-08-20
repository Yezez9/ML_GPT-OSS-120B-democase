// /api/chat.js — Vercel Serverless Function
// Proxies chat requests to Groq API so the key never reaches the browser.

import fs from 'fs';
import path from 'path';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

// Dynamically load the system prompt from the markdown file
let SYSTEM_PROMPT = '';
try {
  const rawContext = fs.readFileSync(path.join(process.cwd(), 'mlbb_chatbot_context.md'), 'utf8');
  // 413 error means the payload exceeds the AI model's token limit. 
  // We cap the context to ~12000 characters (approx 3000 tokens) to ensure it fits.
  SYSTEM_PROMPT = rawContext.length > 12000 
    ? rawContext.slice(0, 12000) + '\n\n[...Context truncated due to AI token limits...]'
    : rawContext;
} catch (error) {
  console.error("Failed to load mlbb_chatbot_context.md:", error);
  // Fallback just in case
  SYSTEM_PROMPT = `You are MLBB Hero Insights assistant. Context file could not be loaded.`;
}

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Check API key
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is not set in environment variables.');
    return res.status(401).json({ error: 'Server misconfiguration: missing API key.' });
  }

  // Validate request body
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Request body must include a non-empty "messages" array.' });
  }

  // To prevent token limits, only send the last 6 messages of history
  const recentMessages = messages.slice(-6);

  // Prepend system prompt
  const fullMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...recentMessages,
  ];

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: fullMessages,
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error(`Groq API error ${groqRes.status}:`, errBody);
      return res.status(502).json({
        error: `AI service error (${groqRes.status}). Please try again.`,
      });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || 'No response generated.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Failed to reach Groq API:', err);
    return res.status(502).json({ error: 'Could not connect to the AI service. Please try again later.' });
  }
}
