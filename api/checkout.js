export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { form, result } = req.body;
  if (!form || !result) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    // Encode session into a compact token
    const session = Buffer.from(
      encodeURIComponent(JSON.stringify({ form, result }))
    ).toString('base64');

    // GHL payment URL — after payment GHL redirects to our success URL
    // We encode the session in the redirect URL so it survives the payment
    const successUrl = `https://app.hiregetlaunched.com?paid=true&s=${encodeURIComponent(session)}`;

    // Return the payment URL with success redirect
    // Note: GHL payment links support ?redirect_url= parameter
    const paymentUrl = `https://link.convertandflow.com/payment-link/69feade4c43a7488828c262d?redirect_url=${encodeURIComponent(successUrl)}`;

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ url: paymentUrl, session });
  } catch (e) {
    console.error('[Checkout] Error:', e);
    return res.status(500).json({ error: 'Failed to create checkout' });
  }
}
