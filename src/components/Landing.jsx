import styles from './Landing.module.css';

export default function Landing({ onStart }) {
  return (
    <main className={styles.landing}>
      <div className={styles.glow} aria-hidden="true" />

      <p className={styles.eyebrow}>Monetize Your Expertise</p>

      <h1 className={styles.title}>
        TRIPLE<span>STACK</span>
      </h1>

      <div className={styles.divider} />

      <p className={styles.subtitle}>
        Discover the three income streams hidden inside your expertise —
        and the roadmap to launch them.
      </p>

      <div className={styles.pills} aria-label="The Triple Threat framework">
        <span className={styles.pill}>Teach It</span>
        <span className={styles.pill}>Package It</span>
        <span className={styles.pill}>Scale It</span>
      </div>

      <button className={styles.cta} onClick={onStart}>
        Find My Streams
      </button>

      <p className={styles.micro}>Free · 2 minutes · Personalized to your expertise</p>
    </main>
  );
}
