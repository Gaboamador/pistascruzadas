import CoordinateCardBack from '@/components/CoordinateCardBack';
import styles from '@/components/GameBoard.module.scss';

function getColumnLabel(index) {
  return String.fromCharCode(65 + index);
}

function GameBoard({
  gameBoard,
  isLoading,
  error,
}) {

  if (isLoading) {
    return (
      <section
        className={styles.status}
        role="status"
        aria-live="polite"
      >
        Cargando tablero…
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={styles.status}
        role="alert"
      >
        No se pudo cargar el tablero.
      </section>
    );
  }

  if (!gameBoard) {
    return (
      <section
        className={styles.status}
        role="alert"
      >
        La partida está iniciada, pero no encontramos el tablero.
      </section>
    );
  }

  const axisIndexes = Array.from(
    {
      length: gameBoard.gridSize,
    },
    (_, index) => index,
  );

  const revealedCoordinates = new Set(
    gameBoard.revealedCoordinates ?? [],
  );

  return (
    <section
      className={styles.panel}
      aria-labelledby="game-board-title"
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Tablero compartido
          </p>

          <h2
            id="game-board-title"
            className={styles.title}
          >
            Palabras de la partida
          </h2>
        </div>

        <span className={styles.counter}>
          {revealedCoordinates.size} descubiertas
        </span>
      </header>

      <div className={styles.boardScroller}>
        <div
          className={styles.board}
          style={{
            '--grid-size':
              gameBoard.gridSize,
          }}
        >
          <div
            className={styles.corner}
            aria-hidden="true"
          />

          {axisIndexes.map(
            (columnIndex) => {
              const columnLabel =
                getColumnLabel(
                  columnIndex,
                );

              const word =
                gameBoard
                  .columnWords[
                    columnIndex
                  ];

              return (
                <div
                  key={`column-${columnLabel}`}
                  className={
                    styles.columnHeader
                  }
                >
                  <div
                    className={
                      styles.axisLabelCard
                    }
                  >
                    <span
                      className={
                        styles.axisLabel
                      }
                    >
                      {columnLabel}
                    </span>
                  </div>

                  <div
                    className={
                      styles.axisWordCard
                    }
                  >
                    <strong
                      className={
                        styles.axisWord
                      }
                    >
                      <span
                        className={
                          styles.axisWordText
                        }
                      >
                        {word}
                      </span>
                    </strong>
                  </div>
                </div>
              );
            },
          )}

          {axisIndexes.map(
            (rowIndex) => {
              const rowLabel =
                rowIndex + 1;

              return (
                <div
                  key={`row-${rowLabel}`}
                  className={
                    styles.boardRow
                  }
                >
                  <div
                    className={
                      styles.rowHeader
                    }
                  >
                    <div
                      className={
                        styles.axisLabelCard
                      }
                    >
                      <span
                        className={
                          styles.axisLabel
                        }
                      >
                        {rowLabel}
                      </span>
                    </div>

                    <div
                      className={
                        styles.axisWordCard
                      }
                    >
                      <strong
                        className={
                          styles.axisWord
                        }
                      >
                        <span
                          className={
                            styles.axisWordText
                          }
                        >
                          {
                            gameBoard
                              .rowWords[
                                rowIndex
                              ]
                          }
                        </span>
                      </strong>
                    </div>
                  </div>

                  {axisIndexes.map(
                    (columnIndex) => {
                      const columnLabel =
                        getColumnLabel(
                          columnIndex,
                        );

                      const coordinate =
                        `${columnLabel}${rowLabel}`;

                      const isRevealed =
                        revealedCoordinates.has(
                          coordinate,
                        );

                      if (!isRevealed) {
                        return (
                          <CoordinateCardBack
                            key={
                              coordinate
                            }
                            coordinate={
                              coordinate
                            }
                          />
                        );
                      }

                      return (
                        <div
                          key={
                            coordinate
                          }
                          className={
                            styles.coordinateCell
                          }
                          aria-label={`${coordinate}, coordenada descubierta`}
                        >
                          <span
                            className={
                              styles.coordinateLetter
                            }
                            aria-hidden="true"
                          >
                            {
                              columnLabel
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
                                rowLabel
                              }
                            </span>
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}

export default GameBoard; 
 
 