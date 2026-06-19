import styles from './ThreatCard.module.css';

const META = [
  { tag: 'Threat 1 — Teach It',   accent: 'lime'   },
  { tag: 'Threat 2 — Package It', accent: 'orange' },
  { tag: 'Threat 3 — Scale It',   accent: 'orange' },
];

function TeachItExpanded({ threat }) {
  return (
    <div className={styles.expanded}>
      <p className={styles.description}>{threat.description}</p>

      {threat.steps && (
        <div className={styles.stepsBlock}>
          <p className={styles.blockLabel}>
            <span className={styles.labelDot} />
            3 Steps to Launch This Stream
          </p>
          <div className={styles.stepsList}>
            {threat.steps.map((step) => (
              <div key={step.num} className={styles.step}>
                <span className={styles.stepNum}>{step.num}</span>
                <div className={styles.stepContent}>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepDetail}>{step.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {threat.pricing && (
        <div className={styles.pricingBlock}>
          <p className={styles.blockLabel}>
            <span className={styles.labelDot} />
            Conservative Pricing Breakdown
          </p>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCell}>
              <span className={styles.pricingValue}>{threat.pricing.price}</span>
              <span className={styles.pricingLabel}>Per session / sale</span>
            </div>
            <div className={styles.pricingDivider}>×</div>
            <div className={styles.pricingCell}>
              <span className={styles.pricingValue}>{threat.pricing.quantity}</span>
              <span className={styles.pricingLabel}>Per month (conservative)</span>
            </div>
            <div className={styles.pricingDivider}>=</div>
            <div className={`${styles.pricingCell} ${styles.pricingTotal}`}>
              <span className={styles.pricingValue}>{threat.pricing.monthly}</span>
              <span className={styles.pricingLabel}>Monthly income</span>
            </div>
          </div>
          <p className={styles.pricingScale}>{threat.pricing.scale}</p>
        </div>
      )}

      <p className={`${styles.earning} ${styles.lime}`}>
        Full earning potential: {threat.earning}
      </p>
    </div>
  );
}

export default function ThreatCard({ index, threat, unlocked }) {
  const meta = META[index];
  const num  = String(index + 1).padStart(2, '0');
  const isTeachIt = index === 0;

  return (
    <article className={`${styles.card} ${unlocked ? styles.unlocked : styles.locked} ${styles[meta.accent]}`}>
      <div className={styles.header}>
        <span className={styles.number}>{num}</span>
        <div className={styles.meta}>
          <span className={styles.tag}>{meta.tag}</span>
          <h3 className={styles.title}>{threat.title}</h3>
        </div>
        {!unlocked && <span className={styles.lockBadge}>Locked</span>}
      </div>

      {unlocked ? (
        isTeachIt ? (
          <TeachItExpanded threat={threat} />
        ) : (
          <div className={styles.body}>
            <p className={styles.description}>{threat.description}</p>
            <p className={`${styles.earning} ${styles[meta.accent]}`}>
              Earning potential: {threat.earning}
            </p>
          </div>
        )
      ) : (
        <div className={styles.lockedBody}>
          {index === 1
            ? 'Unlocks with your full roadmap.'
            : 'Your highest-leverage stream — revealed in your session.'}
        </div>
      )}
    </article>
  );
}
