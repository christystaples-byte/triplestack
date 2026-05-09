import styles from './Processing.module.css';

export default function Processing() {
  return (
    <main className={styles.processing} aria-live="polite" aria-label="Analyzing your expertise">
      <p className={styles.label}>Analyzing your expertise profile</p>
      <h2 className={styles.title}>
        BUILDING<br />YOUR<br />STACK
      </h2>
      <div className={styles.dots} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </main>
  );
}
