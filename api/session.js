const sessions = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { sessionId, form, result } = req.body;
    if (!sessionId || !form || !result) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    sessions.set(sessionId, { form, result, createdAt: Date.now() });
    console.log(`[Session] Saved ${sessionId} for ${form.email}`);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const session = sessions.get(id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    const now = Date.now();
    for (const [k, v] of sessions.entries()) {
      if (now - v.createdAt > 7200000) sessions.delete(k);
    }
    return res.status(200).json(session);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
