// Session storage backed by Vercel KV (Upstash Redis under the hood).
// The previous implementation used an in-memory Map, which does NOT
// persist across Vercel serverless invocations — a POST and a later GET
// can land on completely different function instances, so it silently
// lost every session. KV is real persistent storage, so this is the fix.
//
// Requires KV_REST_API_URL and KV_REST_API_TOKEN env vars, which Vercel
// auto-injects once you create a KV store and connect it to this project
// (Vercel Dashboard → your project → Storage → Create Database → KV).

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const TTL_SECONDS = 60 * 60 * 24; // 24 hours — plenty for a payment redirect

async function kvCommand(command) {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error('KV not configured — missing KV_REST_API_URL / KV_REST_API_TOKEN');
  }
  const res = await fetch(KV_URL, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`KV command failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.result;
}

function keyFor(email) {
  return `ts_session:${String(email).trim().toLowerCase()}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { email, form, result } = req.body;
    if (!email || !form || !result) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const value = JSON.stringify({ form, result, createdAt: Date.now() });
      await kvCommand(['SET', keyFor(email), value, 'EX', String(TTL_SECONDS)]);
      console.log(`[Session] Saved for ${email}`);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[Session] Save error:', err);
      return res.status(500).json({ error: 'Failed to save session' });
    }
  }

  if (req.method === 'GET') {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    try {
      const raw = await kvCommand(['GET', keyFor(email)]);
      if (!raw) {
        console.log(`[Session] Lookup MISS — raw email param received: "${email}"`);
        return res.status(404).json({ error: 'Not found' });
      }
      console.log(`[Session] Lookup HIT for "${email}"`);
      const session = JSON.parse(raw);
      return res.status(200).json(session);
    } catch (err) {
      console.error('[Session] Fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch session' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
