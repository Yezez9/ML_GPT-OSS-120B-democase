// /api/chat.js — Vercel Serverless Function
// Proxies chat requests to Groq API so the key never reaches the browser.

import fs from 'fs';
import path from 'path';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

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

  // Prepend system prompt with strict fact-quoting rules
  const STRICT_RULES = `

STRICT DATA RULES — FOLLOW THESE WITHOUT EXCEPTION:

6. Copy every number character-for-character from the CONTEXT section above. Never round, average, re-estimate, or "clean up" a figure — if the context says 9.76%, your answer must say 9.76%, not 9.8% or 10%.
7. Never reorder, re-rank, or recalculate a list from the context. If the context lists heroes in a specific order (e.g. by win rate), preserve that exact order and those exact ranks in your answer.
8. If a number, hero, or fact is not explicitly present in the CONTEXT section, say "That's not in my dataset" instead of estimating, guessing, or filling the gap with general knowledge about Mobile Legends.
9. Do not add flavor text, nicknames, or commentary about a hero (e.g. calling a hero a "nightmare" or "powerhouse") unless that exact phrasing appears in the context above — stick to the data and keep commentary minimal and factual.`;

  const fullMessages = [
    { role: 'system', content: SYSTEM_PROMPT + STRICT_RULES },
    ...recentMessages,
  ];

  // Debug: log the full payload so we can verify context is present and not truncated
  console.log('[DEBUG] System prompt length:', SYSTEM_PROMPT.length);
  console.log('[DEBUG] System prompt first 200 chars:', SYSTEM_PROMPT.substring(0, 200));
  console.log('[DEBUG] System prompt last 200 chars:', SYSTEM_PROMPT.substring(SYSTEM_PROMPT.length - 200));
  console.log('[DEBUG] Total messages count:', fullMessages.length);
  console.log('[DEBUG] User messages:', recentMessages.map(m => ({ role: m.role, content: m.content.substring(0, 100) })));

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
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error(`Groq API error ${groqRes.status}:`, errBody);
      
      if (groqRes.status === 429) {
        return res.status(429).json({
          error: `AI Rate Limit (429). The context file is very large and uses up your token quota quickly. Please wait 1 minute before asking another question!`,
        });
      }

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
