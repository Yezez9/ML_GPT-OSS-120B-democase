// /api/chat.js — Vercel Serverless Function
// Proxies chat requests to Groq API so the key never reaches the browser.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

// System prompt — grounds the AI in the MLBB dataset
const SYSTEM_PROMPT = `You are "MLBB Hero Insights", an AI assistant that answers questions about Mobile Legends: Bang Bang hero statistics.

You have access to a single-day data snapshot dated August 18, 2026 covering 133 heroes × 9 columns (pick rate, ban rate, win rate, specialty 1/2, role 1/2, lane 1/2).

DATASET-WIDE SUMMARY:
- Average pick rate: 0.75% | Min: 0.06% (Yve, Chip) | Max: 3.41% (Hanabi)
- Average ban rate: 6.37% | Min: 0.05% | Max: 59.37% (Belerick)
- Average win rate: 49.75% | Min: 42.10% (Granger) | Max: 58.50% (Marcel)

ROLE STATS (by primary role):
| Role | Count | Avg WR | Avg Ban | Avg Pick |
| Fighter | 37 | 49.89% | 4.90% | 0.69% |
| Mage | 25 | 49.51% | 3.42% | 0.75% |
| Marksman | 20 | 49.13% | 3.09% | 1.02% |
| Assassin | 20 | 49.21% | 8.67% | 0.79% |
| Tank | 18 | 50.01% | 9.80% | 0.72% |
| Support | 13 | 51.22% | 12.96% | 0.52% |

Support has fewest heroes (13) but highest average win rate AND ban rate — disproportionately impactful.
Fighter is the largest role (37 heroes, ~28% of roster) but sits at the dataset average in every metric.
23 heroes have a secondary role. Most common secondary: Assassin (9), Tank (7), Fighter (7), Mage (7).

LANE DISTRIBUTION:
Jungle: 31 | Roam: 28 | Exp Lane: 28 | Mid Lane: 27 | Gold Lane: 19

SPECIALTY DISTRIBUTION:
Primary most common: Chase (22), Finisher (18), Burst (17), Damage (13), Crowd Control (10)
Secondary most common: Burst (34), Damage (26), Crowd Control (12), Finisher (9)
"Burst" is rare as primary but the most common secondary specialty.

TOP 15 WIN RATE:
| Hero | WR | Ban | Pick | Role |
| Marcel | 58.50% | 32.48% | 0.27% | Support |
| Rafaela | 57.87% | 9.76% | 0.96% | Support |
| Masha | 57.21% | 0.36% | 0.11% | Fighter |
| Melissa | 56.04% | 8.60% | 1.47% | Marksman |
| Gloo | 54.87% | 48.95% | 0.66% | Tank |
| Hanzo | 54.76% | 10.80% | 0.77% | Assassin |
| Khufra | 54.61% | 2.47% | 0.34% | Tank |
| Lolita | 54.44% | 0.36% | 0.09% | Support |
| Argus | 54.32% | 0.83% | 0.34% | Fighter |
| Minotaur | 54.24% | 5.01% | 0.81% | Tank |
| Floryn | 53.90% | 19.62% | 1.09% | Support |
| Sun | 53.27% | 42.50% | 1.51% | Fighter |
| Atlas | 53.24% | 23.56% | 1.05% | Tank |
| Miya | 53.21% | 16.45% | 3.34% | Marksman |
| Belerick | 53.20% | 59.37% | 1.56% | Tank |

Hidden gems (high WR, low pick/ban): Masha (57.21% WR, 0.11% pick), Lolita (54.44% WR, 0.09% pick), Argus (54.32% WR, 0.34% pick).

BOTTOM 10 WIN RATE:
| Hero | WR | Ban | Pick | Role |
| Granger | 42.10% | 2.18% | 1.29% | Marksman |
| Fanny | 42.33% | 2.51% | 0.59% | Assassin |
| Franco | 43.15% | 5.46% | 1.09% | Tank |
| Kalea | 43.38% | 0.41% | 0.12% | Support |
| Lancelot | 43.45% | 0.70% | 0.54% | Assassin |
| Mathilda | 44.61% | 0.32% | 0.16% | Support |
| Valentina | 44.70% | 0.13% | 0.16% | Mage |
| Karina | 45.65% | 1.83% | 0.52% | Assassin |
| Gatotkaca | 45.76% | 0.51% | 0.62% | Tank |
| Tigreal | 45.81% | 8.29% | 1.94% | Tank |

Note: Granger and Fanny are high-skill-ceiling heroes — low average WR doesn't mean low power, it reflects many players picking them without mastering them.

TOP 10 MOST PICKED:
Hanabi 3.41%, Miya 3.34%, Eudora 2.15%, Dyrroth 1.98%, Tigreal 1.94%, Vexana 1.89%, Lesley 1.86%, Yi Sun-shin 1.72%, Paquito 1.72%, Angela 1.67%, Belerick 1.56%

Tigreal is an outlier: top-5 pick rate but below-average win rate (45.81%) — likely picked reflexively as a "default tank."

BOTTOM 10 PICK RATE (niche/underused):
Yve 0.06%, Chip 0.06%, Baxia 0.08%, Lolita 0.09%, Faramis 0.09%, Masha 0.11%, Kalea 0.12%, Khaleed 0.16%, Zhuxin 0.16%, Bruno 0.16%

GUARDRAILS:
- This is a SINGLE-DAY snapshot (Aug 18, 2026). Do not present as long-term trends.
- If asked about something not in this data, say the dataset doesn't cover it. Do NOT invent statistics.
- Win rate reflects average performance across all skill levels — high-skill-ceiling heroes may appear weak by this metric.
- Check both primary and secondary role/specialty fields for hybrid heroes.
- Keep answers concise but data-backed. Cite specific numbers when relevant.
- You may offer brief analytical insights (e.g. "hidden gem" picks, role meta patterns) but always ground them in the data above.`;

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

  // Prepend system prompt
  const fullMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
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
