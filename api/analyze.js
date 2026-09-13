const GHL_WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/H0yigYI8phxslWGsstcA/webhook-trigger/75c52928-c15b-4693-9763-1a4bb0d93194";
const APP_URL = "https://app.hiregetlaunched.com";

// Flattens the 3-step launch plan into one readable text block, since GHL
// custom fields are flat strings — this avoids needing 9 separate fields
// per threat just for steps.
function formatSteps(steps) {
  return (steps || []).map(s => `${s.num}. ${s.title}\n${s.detail}`).join('\n\n');
}

// Same idea for the pricing breakdown — one field instead of four.
function formatPricing(pricing) {
  if (!pricing) return '';
  return `${pricing.price} × ${pricing.quantity} = ${pricing.monthly}/month\n\nScale: ${pricing.scale}`;
}

// Safety net: guarantees a string even if the model ever returns a nested
// object for a field that should be plain text (prevents "[object Object]"
// from reaching the GHL webhook / email templates).
function asText(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'object') {
    return value.text || value.description || value.value || '';
  }
  return String(value);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, profession, description, expertiseHint, email, paid } = req.body;

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

  // Forces the shape of the response — title/description/earning must be
  // strings and pricing must be the 4-field object, so the model can't
  // hand back nested/malformed data the way free-text JSON parsing allowed.
  const threatSchema = {
    type: 'object',
    properties: {
      title:       { type: 'string' },
      description: { type: 'string' },
      earning:     { type: 'string' },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            num:    { type: 'string' },
            title:  { type: 'string' },
            detail: { type: 'string' },
          },
          required: ['num', 'title', 'detail'],
        },
      },
      pricing: {
        type: 'object',
        properties: {
          price:    { type: 'string' },
          quantity: { type: 'string' },
          monthly:  { type: 'string' },
          scale:    { type: 'string' },
        },
        required: ['price', 'quantity', 'monthly', 'scale'],
      },
    },
    required: ['title', 'description', 'earning', 'steps', 'pricing'],
  };

  const outputSchema = {
    type: 'object',
    properties: {
      expertiseType:        { type: 'string' },
      expertiseDescription: { type: 'string' },
      threats: {
        type:     'array',
        items:    threatSchema,
        minItems: 3,
        maxItems: 3,
      },
    },
    required: ['expertiseType', 'expertiseDescription', 'threats'],
  };

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
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
        tools: [{
          name:         'generate_triple_threat',
          description:  'Return the classified expertise type and 3 income streams in strict schema.',
          input_schema: outputSchema,
        }],
        tool_choice: { type: 'tool', name: 'generate_triple_threat' },
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('[Claude API error]', err);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const claudeData = await claudeRes.json();
    const toolUse = claudeData.content?.find((b) => b.type === 'tool_use');

    if (!toolUse) {
      console.error('[Parse error] No tool_use block in response', JSON.stringify(claudeData));
      return res.status(502).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    const result = toolUse.input;

    // Only paid submissions need a link back into the app — free leads
    // just see Threat 1 on the page itself, nothing to send yet.
    const roadmapUrl = email
      ? `${APP_URL}?paid=true&email=${encodeURIComponent(email)}`
      : '';

    // Fire GHL webhook async — non-blocking
    fetch(GHL_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName:          name,
        email:              email || '',
        profession:         profession,
        expertiseType:      result.expertiseType,
        expertiseDesc:      result.expertiseDescription,
        threat1Title:       asText(result.threats[0].title),
        threat1Description: asText(result.threats[0].description),
        threat1Earning:     asText(result.threats[0].earning),
        threat1Steps:       formatSteps(result.threats[0].steps),
        threat1Pricing:     formatPricing(result.threats[0].pricing),
        threat2Title:       asText(result.threats[1].title),
        threat2Description: asText(result.threats[1].description),
        threat2Earning:     asText(result.threats[1].earning),
        threat2Steps:       formatSteps(result.threats[1].steps),
        threat2Pricing:     formatPricing(result.threats[1].pricing),
        threat3Title:       asText(result.threats[2].title),
        threat3Description: asText(result.threats[2].description),
        threat3Earning:     asText(result.threats[2].earning),
        threat3Steps:       formatSteps(result.threats[2].steps),
        threat3Pricing:     formatPricing(result.threats[2].pricing),
        roadmapUrl:         roadmapUrl,
        paid:               paid || false,
        tags:               paid ? 'TripleStack Lead, TripleStack Paid' : 'TripleStack Lead',
        source:             'TripleStack App',
      }),
    }).catch(err => console.warn('[GHL] Webhook failed:', err));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(result);

  } catch (err) {
    console.error('[Server error]', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
