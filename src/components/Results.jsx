import { useState } from 'react';
import ThreatCard from './ThreatCard.jsx';
import { CONFIG } from '../config.js';
import styles from './Results.module.css';

export default function Results({ data, form, paid }) {
  const { expertiseType, expertiseDescription, threats } = data;
  const [showCalendar, setShowCalendar] = useState(false);

const handleUnlock = async () => {
  try {
    console.log('[Results] Creating checkout session...');

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, result: data })
    });

    if (res.ok) {
      const { url, session } = await res.json();
      console.log('[Results] Checkout URL received ✅');
      // Save session locally as backup
      localStorage.setItem('ts_s', session);
      // Redirect to payment with session encoded in return URL
      window.location.href = url;
    } else {
      console.warn('[Results] Checkout API failed, using direct link');
      localStorage.setItem('ts_s', btoa(unescape(encodeURIComponent(JSON.stringify({ form, result: data })))));
      window.location.href = CONFIG.GHL_PAYMENT_URL;
    }
  } catch (e) {
    console.error('[Results] Checkout error:', e);
    localStorage.setItem('ts_s', btoa(unescape(encodeURIComponent(JSON.stringify({ form, result: data })))));
    window.location.href = CONFIG.GHL_PAYMENT_URL;
  }
};

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(session))));

  // Try every storage method available
  try { localStorage.setItem('ts_s', encoded); } catch(e) {}
  try { sessionStorage.setItem('ts_s', encoded); } catch(e) {}
  try { document.cookie = `ts_s=${encoded}; path=/; max-age=3600; SameSite=None; Secure`; } catch(e) {}

  // Also store email alone as a simple key
  try { localStorage.setItem('ts_email', form.email); } catch(e) {}

  console.log('[Results] Session saved — redirecting');
  console.log('[Results] localStorage ts_s:', localStorage.getItem('ts_s') ? 'SAVED ✅' : 'FAILED ❌');
  console.log('[Results] cookie:', document.cookie.includes('ts_s') ? 'SAVED ✅' : 'FAILED ❌');

  // Small delay to ensure saves complete before redirect
  setTimeout(() => {
    window.location.href = CONFIG.GHL_PAYMENT_URL;
  }, 500);
};

  return (
    <main className={styles.results}>

      {/* ── Payment confirmation banner ── */}
      {paid && (
        <div className={styles.paidBanner} role="alert">
          <span aria-hidden="true">🔓</span>
          <span>
            Payment confirmed — your full roadmap is unlocked.
            A copy has been sent to <strong>{form.email}</strong>.
          </span>
        </div>
      )}

      {/* ── Profile header ── */}
      <p className={styles.eyebrow}>Your TripleStack Profile</p>
      <h2 className={styles.name}>
        {form.name}'s<br /><span>Income Stack</span>
      </h2>

      <div className={styles.badge}>
        <span className={styles.badgeDot} aria-hidden="true" />
        {expertiseType} Expertise
      </div>

      <p className={styles.expertiseDesc}>{expertiseDescription}</p>

      {/* ── Threat cards ── */}
      <p className={styles.streamsLabel}>Your 3 Income Streams</p>

      {threats.map((threat, i) => (
        <ThreatCard
          key={i}
          index={i}
          threat={threat}
          unlocked={i === 0 || paid}
        />
      ))}

      {/* ── Free state: hook + $7 upsell ── */}
      {!paid && (
        <>
          <div className={styles.hook}>
            <span className={styles.hookLabel}>What You're Leaving on the Table</span>
            <h3 className={styles.hookTitle}>Two streams are still locked.</h3>
            <p className={styles.hookBody}>
              You just saw one way to monetize your expertise as a <strong>{form.profession}</strong>.
              But the real leverage — packaging your expertise as a product and scaling your
              reputation into recurring income — that's what most service providers never figure
              out on their own. <strong>Your full roadmap is one small investment away.</strong>
            </p>
          </div>

          <div className={styles.upsell}>
            <p className={styles.upsellPrice}>{CONFIG.PRICE_LABEL}</p>
            <p className={styles.upsellMeta}>One-time · Instant access · No subscription</p>
            <ul className={styles.upsellList}>
              <li>Threat 2 — Package It (fully unlocked)</li>
              <li>Threat 3 — Scale It (fully unlocked)</li>
              <li>Your complete personalized income roadmap</li>
              <li>Full roadmap delivered to your email</li>
            </ul>
            <button className={styles.btnOrange} onClick={handleUnlock}>
              Unlock My Full Roadmap — {CONFIG.PRICE_LABEL} →
            </button>
          </div>
        </>
      )}

      {/* ── Paid state: book discovery call ── */}
      {paid && (
        <div className={styles.cta}>
          <div className={styles.ctaHook}>
            <span className={styles.ctaHookLabel}>You Have the Roadmap — Now Let's Launch It</span>
            <h3 className={styles.ctaTitle}>Ready to activate all three streams?</h3>
            <p className={styles.ctaBody}>
              You now have your complete TripleStack roadmap. The next step is a{' '}
              <strong>free discovery call</strong> where we map out exactly how to launch your
              first additional income stream — with a real plan, real timelines, and real support.
            </p>
          </div>

          {!showCalendar ? (
            <button className={styles.btnLime} onClick={() => setShowCalendar(true)}>
              Book My Launch Call — Free →
            </button>
          ) : (
            <div className={styles.calendarWrap}>
              <iframe
                src={CONFIG.GHL_CALENDAR_URL}
                title="Book a Discovery Call"
                scrolling="no"
              />
              <script
                src="https://link.convertandflow.com/js/form_embed.js"
                type="text/javascript"
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
