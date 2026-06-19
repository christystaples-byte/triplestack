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

For Threat 1 (Teach It) specifically, also provide:
- 3 concrete action steps they can implement immediately to launch this income stream (each step should be 1-2 sentences, specific and
