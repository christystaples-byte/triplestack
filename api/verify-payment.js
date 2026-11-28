// Confirms with Stripe that a Checkout Session was actually paid.
// Prevents anyone unlocking by typing ?paid=true into the URL.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Stripe not configured' });

  const id = String(req.query?.session_id || '');
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ error: 'Bad session id' });

  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return res.status(404).json({ paid: false });
    const s = await r.json();
    // 'no_payment_required' = a 100%-off promo code brought the total to $0
    const paid = s.payment_status === 'paid' || s.payment_status === 'no_payment_required';
    const email = s.metadata?.profile_email || s.customer_details?.email || s.customer_email || '';
    return res.status(200).json({ paid, email: paid ? email : '' });
  } catch (e) {
    console.error('[Verify] Error:', e);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
