import { useState, useEffect } from 'react';
import { fetchSession, notifyUnmatchedPayment } from '../api.js';
import { CONFIG } from '../config.js';
import styles from './Unlock.module.css';

const MAX_ATTEMPTS = 3;

// Normalizes the way the server does — trim + lowercase — so a stray
// space or different casing doesn't cause a false "not found".
function normalize(email) {
  return String(email || '').trim().toLowerCase();
}

export default function Unlock({ emailHint, onUnlocked, onGiveUp }) {
  const [phase, setPhase]   = useState('checking'); // checking | confirm | searching | exhausted
  const [input, setInput]   = useState(emailHint || '');
  const [tried, setTried]   = useState([]);
  const [notice, setNotice] = useState('');

  const attempt = async (email) => {
    const clean = normalize(email);
    if (!clean) {
      setPhase('confirm');
      setNotice('Enter the email address you used when you built your profile.');
      return;
    }

    setPhase('searching');
    const session = await fetchSession(clean);

    if (session?.form && session?.result?.threats) {
      onUnlocked(session.form, session.result);
      return;
    }

    const nextTried = tried.includes(clean) ? tried : [...tried, clean];
    setTried(nextTried);

    if (nextTried.length >= MAX_ATTEMPTS) {
      setPhase('exhausted');
      notifyUnmatchedPayment(nextTried, emailHint).catch(() => {});
      return;
    }

    setPhase('confirm');
    setNotice(`We couldn't find a profile under ${clean} — try another email you may have used.`);
  };

  // Auto-attempt the email GHL sent back, once, on load.
  useEffect(() => {
    if (emailHint) {
      attempt(emailHint);
    } else {
      setPhase('confirm');
      setNotice('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    attempt(input);
  };

  if (phase === 'checking' || phase === 'searching') {
    return (
      <main className={styles.unlock} aria-live="polite" aria-label="Confirming your payment">
        <p className={styles.label}>Payment received</p>
        <h2 className={styles.title}>Pulling Up<br />Your Roadmap…</h2>
        <div className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </main>
    );
  }

  if (phase === 'exhausted') {
    return (
      <main className={styles.unlock}>
        <p className={styles.label}>Payment confirmed</p>
        <h2 className={styles.title}>Almost There</h2>
        <p className={styles.body}>
          Your <strong>{CONFIG.PRICE_LABEL} payment went through</strong> — you're not out anything,
          we just couldn't automatically match it to a profile. This happens when a different
          email is used at checkout than the one used to build the profile.
        </p>
        <p className={styles.body}>
          Fastest fix: email <a className={styles.link} href={`mailto:${CONFIG.SUPPORT_EMAIL}`}>{CONFIG.SUPPORT_EMAIL}</a> with
          the email(s) you tried and we'll send your full roadmap directly — usually same day.
        </p>
        <p className={styles.body}>
          Or, build a fresh profile right now — since your payment is already confirmed, it'll unlock immediately.
        </p>
        <button className={styles.submit} onClick={onGiveUp}>
          Start a New Profile — Unlocks Instantly →
        </button>
      </main>
    );
  }

  // phase === 'confirm'
  return (
    <main className={styles.unlock}>
      <p className={styles.label}>Payment confirmed</p>
      <h2 className={styles.title}>Confirm Your<br />Email</h2>
      <p className={styles.body}>
        We couldn't automatically match your payment to a profile. Enter the email you used
        when you built your TripleStack profile and we'll pull it up.
      </p>

      {notice && <p className={styles.notice} role="alert">{notice}</p>}

      <form className={styles.field} onSubmit={handleSubmit}>
        <label className={styles.fieldLabel} htmlFor="ts-unlock-email">Email address</label>
        <input
          id="ts-unlock-email"
          className={styles.input}
          type="email"
          placeholder="you@example.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="email"
          autoFocus
        />
        <button className={styles.submit} type="submit">
          Find My Roadmap →
        </button>
      </form>
    </main>
  );
}
