import styles from '@/components/CoordinateCardBack.module.scss';

const TITLE_LINES = [
  ['P', 'I', 's', 'T', 'a', 'S'],
  ['C', 'R', 'u', 'Z', 'a', 'd', 'a', 'S'],
];

function CoordinateCardBack({
  coordinate,
}) {
  return (
    <div
      className={styles.card}
      aria-label={`${coordinate}, coordenada pendiente`}
    >
      <div
        className={styles.frame}
        aria-hidden="true"
      >
        <div className={styles.art}>
          <div className={styles.titleBlock}>
            {TITLE_LINES.map(
              (letters, lineIndex) => (
                <span
                  key={letters.join('')}
                  className={styles.titleLine}
                >
                  {letters.map(
                    (letter, letterIndex) => (
                      <span
                        key={`${letter}-${letterIndex}`}
                        className={styles.titleLetter}
                      >
                        {letter}
                      </span>
                    ),
                  )}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoordinateCardBack;