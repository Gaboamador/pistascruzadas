import styles from '@/components/FailedCoordinatesPanel.module.scss';

function normalizeFailedCoordinate(
  failedCoordinate,
) {
  /*
   * Compatibilidad temporal con partidas
   * o datos creados antes de incorporar
   * el registro de pistas.
   */
  if (
    typeof failedCoordinate
      === 'string'
  ) {
    return {
      coordinate:
        failedCoordinate,
      clue: '',
    };
  }

  if (
    !failedCoordinate
    || typeof failedCoordinate
      !== 'object'
  ) {
    return null;
  }

  const coordinate =
    typeof failedCoordinate.coordinate
      === 'string'
      ? failedCoordinate.coordinate
      : '';

  const clue =
    typeof failedCoordinate.clue
      === 'string'
      ? failedCoordinate.clue
      : '';

  if (!coordinate) {
    return null;
  }

  return {
    coordinate,
    clue,
  };
}

function FailedCoordinatesPanel({
  failedCoordinates = [],
}) {
  const normalizedFailedCoordinates =
    failedCoordinates
      .map(
        normalizeFailedCoordinate,
      )
      .filter(Boolean);

  const hasFailedCoordinates =
    normalizedFailedCoordinates.length
      > 0;

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
            Fallos y pistas
          </h2>
        </div>

        <span
          className={styles.counter}
          aria-label={`${normalizedFailedCoordinates.length} fallos registrados`}
        >
          {
            normalizedFailedCoordinates.length
          }
        </span>
      </header>

      {hasFailedCoordinates ? (
        <>
          <p className={styles.description}>
            Estas cartas ya fueron descartadas.
          </p>

          <ol
            className={
              styles.coordinateList
            }
          >
            {normalizedFailedCoordinates.map(
              (
                failedCoordinate,
                index,
              ) => {
                const {
                  coordinate,
                  clue,
                } = failedCoordinate;

                const coordinateLetter =
                  coordinate.charAt(0);

                const coordinateNumber =
                  coordinate.slice(1);

                return (
                  <li
                    key={`${coordinate}-${index}`}
                    className={
                      styles.coordinateItem
                    }
                  >
                    <span
                      className={
                        styles.order
                      }
                    >
                      {index + 1}
                    </span>

                    <strong
                      className={
                        styles.coordinate
                      }
                      aria-label={`Coordenada fallada ${coordinate}`}
                    >
                      <span
                        className={
                          styles.coordinateLetter
                        }
                        aria-hidden="true"
                      >
                        {
                          coordinateLetter
                        }
                      </span>

                      <span
                        className={
                          styles.coordinateBadge
                        }
                        aria-hidden="true"
                      >
                        <span
                          className={
                            styles.coordinateNumber
                          }
                        >
                          {
                            coordinateNumber
                          }
                        </span>
                      </span>
                    </strong>

                    <div
                      className={
                        styles.clueContent
                      }
                    >
                      <span
                        className={
                          styles.clueLabel
                        }
                      >
                        Pista
                      </span>

                      <strong
                        className={
                          styles.clue
                        }
                      >
                        {clue || 'Sin pista registrada'}
                      </strong>
                    </div>
                  </li>
                );
              },
            )}
          </ol>
        </>
      ) : (
        <p
          className={
            styles.emptyMessage
          }
        >
          Todavía no tenés fallos registrados.
        </p>
      )}
    </section>
  );
}

export default FailedCoordinatesPanel;