import { useState } from 'react';
import styles from './Intake.module.css';

const EXPERTISE_OPTIONS = [
  { value: 'intellectual', emoji: '🧠', label: 'The Brain',  sub: 'Knowledge & Strategy' },
  { value: 'skillset',     emoji: '🔨', label: 'The Hands',  sub: 'Craft & Execution'   },
  { value: 'both',         emoji: '⚡', label: 'Both',       sub: 'Brain + Hands'        },
];

function validate(form) {
  if (!form.name.trim())        return 'Your name is required.';
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
                                return 'A valid email address is required.';
  if (!form.profession.trim())  return 'Tell us your profession or role.';
  if (!form.description.trim()) return 'A short description helps us personalize your results.';
  return null;
}

export default function Intake({ onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', profession: '', description: '' });
  const [expertiseHint, setExpertiseHint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    const err = validate(form);
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    await onSubmit({ ...form, expertiseHint });
    setLoading(false);
  };

  return (
    <main className={styles.intake}>
      <p className={styles.step}>Step 01 — Tell Us About You</p>
      <h2 className={styles.heading}>What Do<br />You Do?</h2>
      <p className={styles.sub}>Your expertise is worth more than one income stream. Let's find out how many.</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ts-name">Your name</label>
        <input
          id="ts-name"
          className={styles.input}
          placeholder="First name"
          value={form.name}
          onChange={set('name')}
          autoComplete="given-name"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ts-email">Email address</label>
        <input
          id="ts-email"
          className={styles.input}
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          autoComplete="email"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ts-profession">Your profession or role</label>
        <input
          id="ts-profession"
          className={styles.input}
          placeholder="e.g. Carpenter, School Teacher, Fitness Trainer"
          value={form.profession}
          onChange={set('profession')}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>What kind of expertise do you lead with?</label>
        <div className={styles.toggle} role="group" aria-label="Expertise type">
          {EXPERTISE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.toggleBtn} ${expertiseHint === opt.value ? styles.selected : ''}`}
              onClick={() => setExpertiseHint(expertiseHint === opt.value ? null : opt.value)}
              aria-pressed={expertiseHint === opt.value}
            >
              <span className={styles.toggleEmoji}>{opt.emoji}</span>
              <span className={styles.toggleLabel}>{opt.label}</span>
              <span className={styles.toggleSub}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ts-description">
          Describe what you do in 1–2 sentences
        </label>
        <textarea
          id="ts-description"
          className={styles.textarea}
          placeholder="e.g. I build custom furniture and have been doing it for 12 years, specializing in modern farmhouse styles."
          value={form.description}
          onChange={set('description')}
          rows={4}
        />
      </div>

      {error && (
        <p className={styles.error} role="alert">{error}</p>
      )}

      <button
        className={styles.submit}
        onClick={handleSubmit}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? 'Analyzing…' : 'Analyze My Expertise →'}
      </button>
    </main>
  );
}
