import { useState } from 'react';
import ThreatCard from './ThreatCard.jsx';
import { CONFIG } from '../config.js';
import styles from './Results.module.css';

export default function Results({ data, form, paid }) {
  const { expertiseType, expertiseDescription, threats } = data;
  const [showCalendar, setShowCalendar] = useState(false);

  const handleUnlock = () => {
    try {
      const session = { form, result: data };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(session))));
      localStorage.setItem('ts_s', encoded);
    } catch (e) {
      console.error('[Results] Save error:', e);
    }
    // Email is the real fallback now — the session was already saved
    // server-side (KV) when the analysis completed. GHL's payment link
    // success URL should be configured to redirect to:
    //   https://app.hiregetlaunched.com?paid=true&email={{contact.email}}
    const emailParam = encodeURIComponent(form.email);
    window.location.href = `${CONFIG.GHL_PAYMENT_URL}?email=${emailParam}`;
  };

  return (
    <main className={styles.results}>

      {paid && (
        <div className={styles.paidBanner} role="alert">
          <span aria-hidden="true">🔓</span>
          <span>
            Payment confirmed — your full roadmap is unlocked.
            A copy has been sent to <strong>{form.email}</strong>.
          </span>
        </div>
      )}

      <p className={styles.eyebrow}>Your TripleStack Profile</p>
      <h2 className={styles.name}>
        {form.name}'s<br /><span>Income Stack</span>
      </h2>

      <div className={styles.badge}>
        <span className={styles.badgeDot} aria-hidden="true" />
        {expertiseType} Expertise
      </div>

      <p className={styles.expertiseDesc}>{expertiseDescription}</p>

      <p className={styles.streamsLabel}>Your 3 Income Streams</p>

      {threats.map((threat, i) => (
        <ThreatCard
          key={i}
          index={i}
          threat={threat}
          unlocked={i === 0 || paid}
        />
      ))}

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
            </div>
          )}
        </div>
      )}
    </main>
  );
}
