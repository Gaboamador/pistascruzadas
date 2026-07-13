import { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router';
import { startGame } from '@/services/firebase/gameService';

import {
  GRID_SIZE_OPTIONS,
  PARTICIPANT_ROLE,
  PARTICIPANT_STATUS,
  TABLE_STATUS,
} from '@/constants/table';
import useBoardPreparation from '@/hooks/useBoardPreparation';
import useTableRoom from '@/hooks/useTableRoom';
import { updateTableGridSize } from '@/services/firebase/tableService';
import {
  generateBoardWords,
  rerollBoardWord,
} from '@/utils/words';

import styles from '@/pages/PrepareTablePage.module.scss';

function getColumnLabel(index) {
  return String.fromCharCode(65 + index);
}

function StatusPage({
  eyebrow,
  title,
  description = '',
  children = null,
  isAlert = false,
}) {
  return (
    <main className={styles.page}>
      <section
        className={styles.content}
        role={isAlert ? 'alert' : undefined}
      >
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>

        {description && (
          <p className={styles.description}>
            {description}
          </p>
        )}

        {children}
      </section>
    </main>
  );
}

function PrepareTablePage({ user }) {
  const { tableCode = '' } = useParams();
  const normalizedTableCode = tableCode.toUpperCase();

  const {
      table,
      participant,
      players,
      isLoading,
      error,
      tableExists,
      hasAccess,
  } = useTableRoom({
    tableCode: normalizedTableCode,
    uid: user.uid,
  });

  if (isLoading) {
    return (
      <StatusPage
        eyebrow="Pistas Cruzadas"
        title="Cargando preparación…"
      />
    );
  }

  if (error) {
    return (
      <StatusPage
        eyebrow="Error de conexión"
        title="No pudimos cargar la mesa"
        description="Revisá tu conexión e intentá recargar la página."
        isAlert
      >
        <button
          type="button"
          className="button button--primary"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </StatusPage>
    );
  }

  if (!tableExists || !table) {
    return (
      <StatusPage
        eyebrow="Mesa inexistente"
        title={normalizedTableCode}
        description="No encontramos una mesa con ese código."
      >
        <Link to="/" className="button button--secondary">
          Volver al inicio
        </Link>
      </StatusPage>
    );
  }

  const isActiveParticipant =
    hasAccess
    && participant?.status === PARTICIPANT_STATUS.ACTIVE;

  if (!isActiveParticipant) {
    return (
      <StatusPage
        eyebrow="Acceso restringido"
        title={normalizedTableCode}
        description="Este dispositivo no pertenece actualmente a la mesa."
      >
        <Link to="/" className="button button--secondary">
          Volver al inicio
        </Link>
      </StatusPage>
    );
  }

  const isHost =
    participant.role === PARTICIPANT_ROLE.HOST
    && table.hostUid === user.uid;

  if (!isHost) {
    return (
      <StatusPage
        eyebrow="Sólo el anfitrión"
        title="Preparación restringida"
        description="Solamente el anfitrión actual puede preparar el tablero."
      >
        <Link
          to={`/mesa/${normalizedTableCode}`}
          className="button button--secondary"
        >
          Volver a la mesa
        </Link>
      </StatusPage>
    );
  }

  if (table.status !== TABLE_STATUS.LOBBY) {
    return (
      <StatusPage
        eyebrow="Preparación no disponible"
        title="La partida ya no está en espera"
        description="El tablero sólo puede prepararse antes de iniciar la partida."
      >
        <Link
          to={`/mesa/${normalizedTableCode}`}
          className="button button--secondary"
        >
          Volver a la mesa
        </Link>
      </StatusPage>
    );
  }

  return (
    <BoardPreparation
      key={`${normalizedTableCode}-${table.gridSize}`}
      table={table}
      tableCode={normalizedTableCode}
      uid={user.uid}
      players={players}
    />
  );
}

function BoardPreparation({
  table,
  tableCode,
  uid,
  players,
}) {
  const navigate = useNavigate();
  const {
    boardWords,
    isLoading,
    isSaving,
    error: boardError,
    updateBoardWords,
  } = useBoardPreparation({
    tableCode,
    uid,
    gridSize: table.gridSize,
  });

  const [isUpdatingGrid, setIsUpdatingGrid] = useState(false);
  const [gridUpdateError, setGridUpdateError] = useState('');
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [startGameError, setStartGameError] = useState('');

  const axisIndexes = Array.from(
    { length: table.gridSize },
    (_, index) => index,
  );

  const wordCount = table.gridSize * 2;
  const coordinateCount = table.gridSize ** 2;
  const activePlayers = players.filter(
    (player) =>
      player.status === PARTICIPANT_STATUS.ACTIVE,
  );

  const canStartGame =
    activePlayers.length > 0
    && activePlayers.length <= coordinateCount;

  const handleGridSizeChange = async (nextGridSize) => {
    if (
      isUpdatingGrid
      || isSaving
      || nextGridSize === table.gridSize
    ) {
      return;
    }

    setGridUpdateError('');
    setIsUpdatingGrid(true);

    try {
      await updateTableGridSize({
        tableCode,
        uid,
        gridSize: nextGridSize,
      });
    } catch (updateError) {
      console.error(
        'Error al cambiar el tamaño de la grilla:',
        updateError,
      );

      setGridUpdateError(
        'No se pudo cambiar el tamaño de la grilla. Intentá nuevamente.',
      );

      setIsUpdatingGrid(false);
    }
  };

  const handleRegenerateBoard = () => {
    updateBoardWords(() =>
      generateBoardWords(table.gridSize),
    );
  };

  const handleRerollWord = (axis, index) => {
    updateBoardWords((currentBoardWords) =>
      rerollBoardWord({
        ...currentBoardWords,
        axis,
        index,
      }),
    );
  };

  const handleStartGame = async () => {
  if (
    isStartingGame
    || isSaving
    || isUpdatingGrid
    || !boardWords
  ) {
    return;
  }

  if (!canStartGame) {
    setStartGameError(
      `No se puede iniciar: hay ${activePlayers.length} jugadores activos y sólo ${coordinateCount} coordenadas.`,
    );

    return;
  }

  const confirmed = window.confirm(
    '¿Iniciar la partida? Las palabras y el tamaño de la grilla quedarán bloqueados.',
  );

  if (!confirmed) {
    return;
  }

  setStartGameError('');
  setIsStartingGame(true);

  try {
    await startGame({
      tableCode,
      uid,
      activePlayerUids: activePlayers.map(
        (player) => player.uid,
      ),
    });

    navigate(`/mesa/${tableCode}`, {
      replace: true,
    });
  } catch (startError) {
    console.error(
      'Error al iniciar la partida:',
      startError,
    );

    setStartGameError(
      startError instanceof Error
        ? startError.message
        : 'No se pudo iniciar la partida.',
    );

    setIsStartingGame(false);
  }
};

  const controlsDisabled =
    isLoading
    || isSaving
    || isUpdatingGrid
    || isStartingGame;

  return (
    <main className={styles.page}>
      <section className={styles.layout}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              Preparación de la mesa
            </p>

            <h1 className={styles.code}>{tableCode}</h1>
          </div>

          <Link
            to={`/mesa/${tableCode}`}
            className="button button--secondary"
            aria-disabled={controlsDisabled}
            onClick={(event) => {
              if (controlsDisabled) {
                event.preventDefault();
              }
            }}
          >
            Volver a la sala
          </Link>
        </header>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                Configuración
              </p>

              <h2 className={styles.sectionTitle}>
                Tablero {table.gridSize} × {table.gridSize}
              </h2>
            </div>

            <div className={styles.stats}>
              <span className={styles.statBadge}>
                {wordCount} palabras
              </span>

              <span className={styles.statBadge}>
                {coordinateCount} coordenadas
              </span>
            </div>
          </div>

          <section
            className={styles.gridSizeSection}
            aria-labelledby="grid-size-title"
          >
            <div>
              <h3
                id="grid-size-title"
                className={styles.gridSizeTitle}
              >
                Tamaño de la grilla
              </h3>

              <p className={styles.gridSizeHelp}>
                Podés cambiarlo mientras la partida no haya comenzado.
              </p>
            </div>

            <div className={styles.gridSizeOptions}>
              {GRID_SIZE_OPTIONS.map((option) => {
                const isSelected =
                  option.value === table.gridSize;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.gridSizeButton} ${
                      isSelected
                        ? styles.gridSizeButtonSelected
                        : ''
                    }`}
                    onClick={() =>
                      handleGridSizeChange(option.value)
                    }
                    disabled={
                      controlsDisabled || isSelected
                    }
                    aria-pressed={isSelected}
                  >
                    <strong>{option.label}</strong>

                    <span>
                      {option.coordinateCount} coordenadas
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {gridUpdateError && (
            <p className={styles.operationError} role="alert">
              {gridUpdateError}
            </p>
          )}

          {boardError && (
            <p className={styles.operationError} role="alert">
              No se pudo guardar la preparación. El último cambio fue
              revertido.
            </p>
          )}

          {startGameError && (
            <p className={styles.operationError} role="alert">
              {startGameError}
            </p>
          )}

          <div className={styles.preparationToolbar}>
            <p className={styles.description}>
              Cada columna y cada fila tiene una palabra. Podés
              rerrollear cualquiera de ellas o regenerar el tablero
              completo.
            </p>

            <button
              type="button"
              className="button button--secondary"
              onClick={handleRegenerateBoard}
              disabled={controlsDisabled || !boardWords}
            >
              <FiRefreshCw aria-hidden="true" />
              Regenerar todo
            </button>
          </div>

          {isLoading || !boardWords ? (
            <div
              className={styles.boardLoading}
              role="status"
              aria-live="polite"
            >
              Preparando palabras…
            </div>
          ) : (
            <div
              className={styles.board}
              style={{
                '--grid-size': table.gridSize,
              }}
            >
              <div
                className={styles.corner}
                aria-hidden="true"
              />

              {axisIndexes.map((columnIndex) => {
                const columnLabel = getColumnLabel(columnIndex);
                const word =
                  boardWords.columnWords[columnIndex];

                return (
                  <div
                    key={`column-${columnIndex}`}
                    className={styles.columnHeader}
                  >
                    <span className={styles.axisLabel}>
                      {columnLabel}
                    </span>

                    <strong className={styles.axisWord}>
                      {word}
                    </strong>

                    <button
                      type="button"
                      className={styles.rerollButton}
                      onClick={() =>
                        handleRerollWord(
                          'column',
                          columnIndex,
                        )
                      }
                      disabled={controlsDisabled}
                      aria-label={`Cambiar la palabra de la columna ${columnLabel}`}
                      title={`Cambiar ${word}`}
                    >
                      <FiRefreshCw aria-hidden="true" />
                    </button>
                  </div>
                );
              })}

              {axisIndexes.map((rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className={styles.boardRow}
                >
                  <div className={styles.rowHeader}>
                    <span className={styles.axisLabel}>
                      {rowIndex + 1}
                    </span>

                    <strong className={styles.axisWord}>
                      {boardWords.rowWords[rowIndex]}
                    </strong>

                    <button
                      type="button"
                      className={styles.rerollButton}
                      onClick={() =>
                        handleRerollWord('row', rowIndex)
                      }
                      disabled={controlsDisabled}
                      aria-label={`Cambiar la palabra de la fila ${rowIndex + 1}`}
                      title={`Cambiar ${boardWords.rowWords[rowIndex]}`}
                    >
                      <FiRefreshCw aria-hidden="true" />
                    </button>
                  </div>

                  {axisIndexes.map((columnIndex) => {
                    const coordinate = `${getColumnLabel(
                      columnIndex,
                    )}${rowIndex + 1}`;

                    return (
                      <div
                        key={coordinate}
                        className={styles.coordinateCell}
                      >
                        {coordinate}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <div className={styles.startSection}>
            <div>
              <h3 className={styles.startTitle}>
                Iniciar partida
              </h3>

              <p className={styles.startDescription}>
                Se repartirán coordenadas secretas entre los{' '}
                {activePlayers.length} jugadores activos. Después de iniciar,
                las palabras y el tamaño de la grilla quedarán bloqueados.
              </p>
            </div>

            <button
              type="button"
              className="button button--primary"
              onClick={handleStartGame}
              disabled={
                controlsDisabled
                || !boardWords
                || !canStartGame
              }
            >
              {isStartingGame
                ? 'Iniciando partida…'
                : 'Iniciar partida'}
            </button>
          </div>

          <p
            className={styles.saveStatus}
            role="status"
            aria-live="polite"
          >
            {isSaving
              ? 'Guardando cambios…'
              : 'Preparación guardada'}
          </p>
        </section>
      </section>
    </main>
  );
}

export default PrepareTablePage;