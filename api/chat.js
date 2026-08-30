// /api/chat.js — Vercel Serverless Function
// Proxies chat requests to Groq API so the key never reaches the browser.

import fs from 'fs';
import path from 'path';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'qwen/qwen3.8-27b';

// Dynamically load the system prompt from the markdown file
let SYSTEM_PROMPT = '';
try {
  let rawContext = fs.readFileSync(path.join(process.cwd(), 'mlbb_chatbot_context.md'), 'utf8');
  
  // Compress whitespace and blank lines to fit more data into the token limit
  rawContext = rawContext.replace(/ {2,}/g, ' ').replace(/\n{2,}/g, '\n');
  
  // 413 error means the payload exceeds the AI model's token limit. 
  // We cap the context to ~14000 characters to ensure it fits, while minification ensures most data is retained.
  SYSTEM_PROMPT = rawContext.length > 14000 
    ? rawContext.slice(0, 14000) + '\n\n[...Context truncated due to AI token limits...]'
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

  // 1. Filter out internal error messages
  const cleanMessages = messages.filter(m => !m.isError && !m.content.startsWith('⚠️'));

  // 2. To prevent token limits, take only the last 2 messages (1 question/answer pair)
  let recentMessages = cleanMessages.slice(-2);

  // 3. Groq (Llama models) throw 400 Bad Request if history starts with an 'assistant' message. 
  // Ensure the first message after the system prompt is a 'user' message.
  if (recentMessages.length > 0 && recentMessages[0].role === 'assistant') {
    recentMessages.shift();
  }

  // 4. Strip non-standard properties (OpenAPI validator rejects unknown fields)
  recentMessages = recentMessages.map(m => ({
    role: m.role,
    content: m.content
  }));

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
        max_completion_tokens: 2048,
        top_p: 1,
        reasoning_effort: 'medium',
        stop: null,
        stream: true,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error(`Groq API error ${groqRes.status}:`, errBody);
      
      if (groqRes.status === 429) {
        return res.status(429).json({
          error: `AI Rate Limit (429). Please wait 1 minute before asking another question!`,
        });
      }

      return res.status(502).json({
        error: `AI service error (${groqRes.status}). Please try again.`,
      });
    }

    // Stream SSE back to the client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          break;
        }
        try {
          const json = JSON.parse(payload);
          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
        } catch (e) {
          // skip malformed chunks
        }
      }
    }

    res.end();
  } catch (err) {
    console.error('Failed to reach Groq API:', err);
    return res.status(502).json({ error: 'Could not connect to the AI service. Please try again later.' });
  }
}
