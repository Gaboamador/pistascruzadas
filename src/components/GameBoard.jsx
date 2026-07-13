import useGameBoard from '@/hooks/useGameBoard';

import styles from '@/components/GameBoard.module.scss';

function getColumnLabel(index) {
  return String.fromCharCode(65 + index);
}

function GameBoard({ tableCode }) {
  const {
    gameBoard,
    isLoading,
    error,
  } = useGameBoard({
    tableCode,
  });

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
      <section className={styles.status} role="alert">
        No se pudo cargar el tablero.
      </section>
    );
  }

  if (!gameBoard) {
    return (
      <section className={styles.status} role="alert">
        La partida está iniciada, pero no encontramos el tablero.
      </section>
    );
  }

  const axisIndexes = Array.from(
    { length: gameBoard.gridSize },
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
            '--grid-size': gameBoard.gridSize,
          }}
        >
          <div
            className={styles.corner}
            aria-hidden="true"
          />

          {axisIndexes.map((columnIndex) => {
            const columnLabel = getColumnLabel(columnIndex);
            const word =
              gameBoard.columnWords[columnIndex];

            return (
              <div
                key={`column-${columnLabel}`}
                className={styles.columnHeader}
              >
                <span className={styles.axisLabel}>
                  {columnLabel}
                </span>

                <strong className={styles.axisWord}>
                  {word}
                </strong>
              </div>
            );
          })}

          {axisIndexes.map((rowIndex) => (
            <div
              key={`row-${rowIndex + 1}`}
              className={styles.boardRow}
            >
              <div className={styles.rowHeader}>
                <span className={styles.axisLabel}>
                  {rowIndex + 1}
                </span>

                <strong className={styles.axisWord}>
                  {gameBoard.rowWords[rowIndex]}
                </strong>
              </div>

              {axisIndexes.map((columnIndex) => {
                const coordinate = `${getColumnLabel(
                  columnIndex,
                )}${rowIndex + 1}`;

                const isRevealed =
                  revealedCoordinates.has(coordinate);

                return (
                  <div
                    key={coordinate}
                    className={`${styles.coordinateCell} ${
                      isRevealed
                        ? styles.coordinateCellRevealed
                        : ''
                    }`}
                    aria-label={
                      isRevealed
                        ? `${coordinate}, coordenada descubierta`
                        : `${coordinate}, coordenada pendiente`
                    }
                  >
                    {coordinate}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default GameBoard;