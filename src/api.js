import { CONFIG } from './config.js';

// ── Claude AI: classify expertise + generate 3 threats ────────────────────
export async function classifyAndGenerate(form) {
  const { name, profession, description, expertiseHint } = form;

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

For each threat provide:
- A short punchy title (4-7 words)
- A 2-3 sentence description tailored to their specific profession
- A realistic earning range (e.g. "$75–$150/hr" or "$500–$2,000/month")

Respond ONLY with valid JSON in this exact format — no markdown fences, no preamble, no trailing text:
{
  "expertiseType": "Type 1 — Intellectual",
  "expertiseDescription": "...",
  "threats": [
    { "title": "...", "description": "...", "earning": "..." },
    { "title": "...", "description": "...", "earning": "..." },
    { "title": "...", "description": "...", "earning": "..." }
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.find((b) => b.type === 'text')?.text || '';
  const clean = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

// ── GHL Webhook: push lead data into GoHighLevel ─────────────────────────
export async function sendToGHL(form, result, paid = false) {
  if (!CONFIG.GHL_WEBHOOK_URL) return;

  const payload = {
    firstName:          form.name,
    email:              form.email,
    profession:         form.profession,
    expertiseType:      result.expertiseType,
    expertiseDesc:      result.expertiseDescription,
    threat1Title:       result.threats[0].title,
    threat1Description: result.threats[0].description,
    threat1Earning:     result.threats[0].earning,
    threat2Title:       result.threats[1].title,
    threat2Description: result.threats[1].description,
    threat2Earning:     result.threats[1].earning,
    threat3Title:       result.threats[2].title,
    threat3Description: result.threats[2].description,
    threat3Earning:     result.threats[2].earning,
    paid,
    tags:   paid ? 'TripleStack Lead, TripleStack Paid' : 'TripleStack Lead',
    source: 'TripleStack App',
  };

  try {
    await fetch(CONFIG.GHL_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    // Non-blocking — log but don't break the user flow
    console.warn('[GHL] Webhook failed:', err);
  }
}
