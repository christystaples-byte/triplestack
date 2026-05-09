import styles from './ThreatCard.module.css';

const THREAT_META = [
  { tag: 'Threat 1 — Teach It',   accent: 'lime'   },
  { tag: 'Threat 2 — Package It', accent: 'orange' },
  { tag: 'Threat 3 — Scale It',   accent: 'orange' },
];

export default function ThreatCard({ index, threat, unlocked }) {
  const meta = THREAT_META[index];
  const num  = String(index + 1).padStart(2, '0');

  return (
    <article
      className={`${styles.card} ${unlocked ? styles[meta.accent] : styles.locked}`}
      aria-label={`${meta.tag}${unlocked ? '' : ' — locked'}`}
    >
      <div className={styles.header}>
        <span className={styles.number} aria-hidden="true">{num}</span>
        <div className={styles.meta}>
          <span className={styles.tag}>{meta.tag}</span>
          <h3 className={styles.title}>{threat.title}</h3>
        </div>
        {!unlocked && <span className={styles.lockBadge} aria-label="Locked">🔒</span>}
      </div>

      {unlocked ? (
        <div className={styles.body}>
          <p className={styles.description}>{threat.description}</p>
          <p className={styles.earning}>Earning potential: {threat.earning}</p>
        </div>
      ) : (
        <div className={styles.lockedBody}>
          <span>{index === 1
            ? 'Unlock this stream with your full roadmap.'
            : 'Your highest-leverage income stream — included in your full roadmap.'
          }</span>
        </div>
      )}
    </article>
  );
}
