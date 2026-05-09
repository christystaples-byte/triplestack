import { CONFIG } from './config.js';

export async function classifyAndGenerate(form) {
  const { name, profession, description, expertiseHint } = form;

  const response = await fetch('/api/analyze', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, profession, description, expertiseHint }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Analysis failed. Please try again.');
  }

  return response.json();
}

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
    console.warn('[GHL] Webhook failed:', err);
  }
}
