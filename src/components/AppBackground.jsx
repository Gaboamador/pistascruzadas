import styles from '@/components/AppBackground.module.scss';

function AppBackground() {
  return (
    <div
      className={styles.background}
      aria-hidden="true"
    >
      <span
        className={`${styles.spark} ${styles.sparkOne}`}
      />

      <span
        className={`${styles.spark} ${styles.sparkTwo}`}
      />

      <span
        className={`${styles.spark} ${styles.sparkThree}`}
      />
    </div>
  );
}

export default AppBackground;