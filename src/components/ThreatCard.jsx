import styles from './ThreatCard.module.css';

const META = [
  { tag: 'Threat 1 — Teach It',   accent: 'lime',   icon: '🎓', stepIcon: '📌', pricingIcon: '💰' },
  { tag: 'Threat 2 — Package It', accent: 'orange', icon: '📦', stepIcon: '⚡', pricingIcon: '💵' },
  { tag: 'Threat 3 — Scale It',   accent: 'violet', icon: '🚀', stepIcon: '🎯', pricingIcon: '📈' },
];

function ExpandedCard({ threat, meta }) {
  const accentClass = styles[meta.accent];

  return (
    <div className={styles.expanded}>
      <p className={styles.description}>{threat.description}</p>
      <div className={`${styles.separator} ${accentClass}`} />
      {threat.steps && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>{meta.stepIcon}</span>
            <span className={`${styles.sectionLabel} ${accentClass}`}>3 Steps to Launch This Stream</span>
          </div>
          <div className={styles.stepsList}>
            {threat.steps.map((step) => (
              <div key={step.num} className={styles.step}>
                <div className={`${styles.stepNumBadge} ${accentClass}`}>{step.num}</div>
                <div className={styles.stepContent}>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepDetail}>{step.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={`${styles.separator} ${accentClass}`} />
      {threat.pricing && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>{meta.pricingIcon}</span>
            <span className={`${styles.sectionLabel} ${accentClass}`}>Conservative Pricing Breakdown</span>
          </div>
          <div className={styles.pricingRow}>
            <div className={styles.pricingItem}>
              <span className={`${styles.pricingAmount} ${accentClass}`}>{threat.pricing.price}</span>
              <span className={styles.pricingMeta}>per session / sale</span>
            </div>
            <div className={styles.pricingOperator}>×</div>
            <div className={styles.pricingItem}>
              <span className={`${styles.pricingAmount} ${accentClass}`}>{threat.pricing.quantity}</span>
              <span className={styles.pricingMeta}>per month</span>
            </div>
            <div className={styles.pricingOperator}>=</div>
            <div className={`${styles.pricingItem} ${styles.pricingResult}`}>
              <span className={`${styles.pricingTotal} ${accentClass}`}>{threat.pricing.monthly}</span>
              <span className={styles.pricingMeta}>monthly income</span>
            </div>
          </div>
          <div className={`${styles.scaleNote} ${accentClass}`}>
            <span className={styles.scaleArrow}>↑</span>
            <span>{threat.pricing.scale}</span>
          </div>
        </div>
      )}
      <div className={`${styles.separator} ${accentClass}`} />
      <div className={`${styles.earningBadge} ${accentClass}`}>
        <span className={styles.earningIcon}>✦</span>
        <span className={styles.earningLabel}>Full earning potential</span>
        <span className={styles.earningValue}>{threat.earning}</span>
      </div>
    </div>
  );
}

function LockedCard({ threat, meta }) {
  return (
    <div className={styles.lockedWrap}>
      <div className={styles.lockedBlur}>
        <p className={styles.description}>{threat.description}</p>
        <div className={styles.lockedStepsFake}>
          <div className={styles.lockedLine} style={{ width: '60%' }} />
          <div className={styles.lockedLine} style={{ width: '85%' }} />
          <div className={styles.lockedLine} style={{ width: '70%' }} />
          <div className={styles.lockedLine} style={{ width: '90%' }} />
          <div className={styles.lockedLine} style={{ width: '55%' }} />
          <div className={styles.lockedLine} style={{ width: '80%' }} />
        </div>
        <div className={styles.lockedPriceFake}>
          <div className={styles.lockedPriceBox} />
          <div className={styles.lockedPriceBox} />
          <div className={styles.lockedPriceBox} />
        </div>
      </div>
      <div className={styles.lockedOverlay}>
        <div className={styles.lockedBadge}>
          <span className={styles.lockedIcon}>🔒</span>
          <span className={styles.lockedMsg}>Unlock with your full roadmap</span>
        </div>
      </div>
    </div>
  );
}

export default function ThreatCard({ index, threat, unlocked }) {
  const meta = META[index];
  const num  = String(index + 1).padStart(2, '0');

  return (
    <article className={`${styles.card} ${unlocked ? `${styles.unlocked} ${styles[meta.accent]}` : styles.locked}`}>
      <div className={`${styles.header} ${unlocked ? styles[`header_${meta.accent}`] : ''}`}>
        <span className={styles.headerIcon}>{meta.icon}</span>
        <span className={`${styles.number} ${unlocked ? styles[meta.accent] : ''}`}>{num}</span>
        <div className={styles.meta}>
          <span className={`${styles.tag} ${unlocked ? styles[meta.accent] : ''}`}>{meta.tag}</span>
          <h3 className={styles.title}>{threat.title}</h3>
        </div>
        {!unlocked && <span className={styles.lockPill}>Locked</span>}
      </div>
      {unlocked
        ? <ExpandedCard threat={threat} meta={meta} />
        : <LockedCard threat={threat} meta={meta} />
      }
    </article>
  );
}
