import styles from './prototype.module.css';

export default function PrototypeLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className={styles.loadingPage} role="status">
      <span className={styles.srOnly}>Cargando prototipo… Loading prototype…</span>
      <div className={styles.loadingShell}>
        <div className={styles.loadingSidebar}>
          <span className={styles.skeleton} />
          <span className={styles.skeleton} />
          <span className={styles.skeleton} />
        </div>
        <div className={styles.loadingMain}>
          <span className={styles.skeletonTitle} />
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonRow} />
          <span className={styles.skeletonRow} />
          <span className={styles.skeletonRow} />
        </div>
      </div>
    </div>
  );
}
