import styles from '@/components/FailedCoordinatesPanel.module.scss';

function FailedCoordinatesPanel({
  failedCoordinates = [],
}) {
  const hasFailedCoordinates =
    failedCoordinates.length > 0;

  return (
    <section
      className={styles.panel}
      aria-labelledby="failed-coordinates-title"
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Información privada
          </p>

          <h2
            id="failed-coordinates-title"
            className={styles.title}
          >
            Coordenadas falladas
          </h2>
        </div>

        <span
          className={styles.counter}
          aria-label={`${failedCoordinates.length} coordenadas falladas`}
        >
          {failedCoordinates.length}
        </span>
      </header>

      {hasFailedCoordinates ? (
        <>
          <p className={styles.description}>
            Estas cartas ya fueron descartadas y no volverán a
            repartirse.
          </p>

          <ol className={styles.coordinateList}>
            {failedCoordinates.map(
              (coordinate, index) => (
                <li
                  key={`${coordinate}-${index}`}
                  className={styles.coordinateItem}
                >
                  <span className={styles.order}>
                    {index + 1}
                  </span>

                  <strong className={styles.coordinate}>
                    {coordinate}
                  </strong>
                </li>
              ),
            )}
          </ol>
        </>
      ) : (
        <p className={styles.emptyMessage}>
          Todavía no fallaste ninguna coordenada.
        </p>
      )}
    </section>
  );
}

export default FailedCoordinatesPanel;