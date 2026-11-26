// Creates a Stripe Checkout Session for the $7 TripleStack unlock.
// Requires env var STRIPE_SECRET_KEY (Vercel → Settings → Environment Variables).

const APP_URL = 'https://app.hiregetlaunched.com';
const AMOUNT_CENTS = 700; // $7.00

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Stripe not configured' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('customer_email', email);
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'usd');
  params.set('line_items[0][price_data][unit_amount]', String(AMOUNT_CENTS));
  params.set('line_items[0][price_data][product_data][name]', 'TripleStack — Full Income Roadmap');
  // The email the profile was saved under — lets us unlock the right profile
  // even if the customer types a different email on Stripe's page.
  params.set('metadata[profile_email]', email);
  params.set('success_url', `${APP_URL}?paid=true&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', APP_URL);

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('[Checkout] Stripe error:', data?.error?.message);
      return res.status(502).json({ error: 'Could not start checkout' });
    }
    return res.status(200).json({ url: data.url });
  } catch (e) {
    console.error('[Checkout] Error:', e);
    return res.status(500).json({ error: 'Failed to create checkout' });
  }
}
