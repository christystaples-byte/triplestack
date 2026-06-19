export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, profession, description, expertiseHint } = req.body;

  if (!name || !profession || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `You are an expert business strategist for service providers using the Triple Threat framework.

A user has submitted the following:
- Name: ${name}
- Profession: ${profession}
- Expertise hint (self-selected): ${expertiseHint || "not specified"}
- Description: ${description}

Your job is to:
1. Classify their expertise type as one of: "Type 1 — Intellectual", "Type 2 — Skill-Set", or "Type 1 & 2 — Blend"
2. Write a 1-2 sentence expertise description that feels personal and affirming
3. Generate exactly 3 income stream ideas using the Triple Threat framework:
   - Threat 1 (Teach It): Share their knowledge in a way people pay for
   - Threat 2 (Package It): Turn expertise into a Product, System, Service, or Software
   - Threat 3 (Scale It): Use their reputation to create ongoing income

For ALL THREE threats provide:
- A short punchy title (4-7 words)
- A 2-3 sentence description tailored to their specific profession
- A realistic earning range (e.g. "$500-$2,000/month")
- 3 concrete action steps they can implement immediately. Each step has a short title and 1-2 sentence detail that is specific and actionable, not generic
- A conservative pricing breakdown with: a specific price point, a realistic monthly quantity, the resulting monthly total, and one sentence on how to scale

Respond ONLY with valid JSON in this exact format — no markdown fences, no preamble, no trailing text:
{
  "expertiseType": "Type 1 — Intellectual",
  "expertiseDescription": "...",
  "threats": [
    {
      "title": "...",
      "description": "...",
      "earning": "...",
      "steps": [
        { "num": "01", "title": "...", "detail": "..." },
        { "num": "02", "title": "...", "detail": "..." },
        { "num": "03", "title": "...", "detail": "..." }
      ],
      "pricing": {
        "price": "...",
        "quantity": "...",
        "monthly": "...",
        "scale": "..."
      }
    },
    {
      "title": "...",
      "description": "...",
      "earning": "...",
      "steps": [
        { "num": "01", "title": "...", "detail": "..." },
        { "num": "02", "title": "...", "detail": "..." },
        { "num": "03", "title": "...", "detail": "..." }
      ],
      "pricing": {
        "price": "...",
        "quantity": "...",
        "monthly": "...",
        "scale": "..."
      }
    },
    {
      "title": "...",
      "description": "...",
      "earning": "...",
      "steps": [
        { "num": "01", "title": "...", "detail": "..." },
        { "num": "02", "title": "...", "detail": "..." },
        { "num": "03", "title": "...", "detail": "..." }
      ],
      "pricing": {
        "price": "...",
        "quantity": "...",
        "monthly": "...",
        "scale": "..."
      }
    }
  ]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 2500,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Claude API error]', err);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data  = await response.json();
    const text  = data.content?.find((b) => b.type === 'text')?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch {
      console.error('[Parse error]', clean);
      return res.status(502).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(result);

  } catch (err) {
    console.error('[Server error]', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
