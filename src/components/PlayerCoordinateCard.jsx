import {
  useEffect,
  useState,
} from 'react';
import {
  FiCheck,
  FiX,
} from 'react-icons/fi';

import ConfirmModal, {
  CONFIRM_MODAL_TONES,
} from '@/components/ConfirmModal';
import {
  CLUE_MAX_LENGTH,
} from '@/constants/table';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import {
  COORDINATE_RESULT,
  normalizeClue,
  resolveCurrentCoordinate,
} from '@/services/firebase/coordinateService';

import styles from '@/components/PlayerCoordinateCard.module.scss';

function PlayerCoordinateCard({
  tableCode,
  uid,
  currentCoordinate,
}) {
  const isOnline =
    useOnlineStatus();

  const [
    clue,
    setClue,
  ] = useState('');

  const [
    clueError,
    setClueError,
  ] = useState('');

  const [
    isResolving,
    setIsResolving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    pendingResult,
    setPendingResult,
  ] = useState(null);

  const hasCoordinate =
    Boolean(currentCoordinate);

  const normalizedClue =
    normalizeClue(clue);

  const isCorrectResult =
    pendingResult
      === COORDINATE_RESULT.CORRECT;

  useEffect(() => {
    setClue('');
    setClueError('');
    setError('');
    setPendingResult(null);
  }, [
    currentCoordinate,
  ]);

  const handleClueChange = (
    event,
  ) => {
    setClue(
      event.target.value,
    );

    if (clueError) {
      setClueError('');
    }

    if (error) {
      setError('');
    }
  };

  const openResolveModal =
    (result) => {
      if (
        !hasCoordinate
        || isResolving
      ) {
        return;
      }

      if (!isOnline) {
        setError(
          'Necesitás conexión a internet para resolver la coordenada.',
        );

        return;
      }

      if (
        result
          === COORDINATE_RESULT.FAILED
        && !normalizedClue
      ) {
        setClueError(
          'Ingresá la pista que diste antes de marcar la coordenada como fallada.',
        );

        return;
      }

      setClueError('');
      setError('');
      setPendingResult(result);
    };

  const closeResolveModal =
    () => {
      if (isResolving) {
        return;
      }

      setPendingResult(null);
    };

  const handleConfirmResolve =
    async () => {
      if (
        !hasCoordinate
        || isResolving
        || !pendingResult
      ) {
        return;
      }

      if (!isOnline) {
        setError(
          'Necesitás conexión a internet para resolver la coordenada.',
        );

        setPendingResult(null);

        return;
      }

      if (
        pendingResult
          === COORDINATE_RESULT.FAILED
        && !normalizedClue
      ) {
        setClueError(
          'Ingresá la pista que diste antes de marcar la coordenada como fallada.',
        );

        setPendingResult(null);

        return;
      }

      setClueError('');
      setError('');
      setIsResolving(true);

      try {
        await resolveCurrentCoordinate({
          tableCode,
          uid,
          result:
            pendingResult,
          clue:
            normalizedClue,
        });

        setClue('');
        setPendingResult(null);
      } catch (resolveError) {
        console.error(
          'Error al procesar la coordenada:',
          resolveError,
        );

        setError(
          resolveError
            instanceof Error
            ? resolveError.message
            : 'No se pudo procesar la coordenada.',
        );
      } finally {
        setIsResolving(false);
      }
    };

  const modalDescription =
    isCorrectResult
      ? `¿Confirmás que acertaron la coordenada ${currentCoordinate}? Se revelará en el tablero y recibirás otra coordenada si quedan disponibles.`
      : `¿Confirmás que fallaron la coordenada ${currentCoordinate} con la pista “${normalizedClue}”? Se guardarán juntas y recibirás otra coordenada si quedan disponibles.`;

  return (
    <>
      <section
        className={`${styles.card} ${
          hasCoordinate
            ? styles.cardActive
            : ''
        }`}
        aria-labelledby="current-coordinate-title"
      >
        <div className={styles.content}>
          <p className={styles.eyebrow}>
            Información privada
          </p>

          <h2
            id="current-coordinate-title"
            className={styles.title}
          >
            Tu coordenada actual
          </h2>

          {/* <p className={styles.description}>
            Sólo vos podés ver esta carta. Da una pista que conecte
            las palabras de esa columna y esa fila.
          </p> */}
        </div>

        {hasCoordinate && (
          <div className={styles.clueField}>
            <label
              className={styles.clueLabel}
              htmlFor="current-coordinate-clue"
            >
              Pista que diste
            </label>

            <input
              id="current-coordinate-clue"
              name="clue"
              type="text"
              className={`input ${
                clueError
                  ? 'input--error'
                  : ''
              }`}
              value={clue}
              onChange={
                handleClueChange
              }
              maxLength={
                CLUE_MAX_LENGTH
              }
              autoComplete="off"
              spellCheck="true"
              disabled={
                isResolving
              }
              aria-invalid={
                Boolean(clueError)
              }
              aria-describedby={
                clueError
                  ? 'current-coordinate-clue-error'
                  : 'current-coordinate-clue-help'
              }
              placeholder="Ej.: Hospital"
            />

            <div
              className={
                styles.clueMeta
              }
            >
              {clueError ? (
                <p
                  id="current-coordinate-clue-error"
                  className={
                    styles.clueError
                  }
                  role="alert"
                >
                  {clueError}
                </p>
              ) : (
                <p
                  id="current-coordinate-clue-help"
                  className={
                    styles.clueHelp
                  }
                >
                  Solo se guarda si falla.
                </p>
              )}

              <span
                className={
                  styles.clueCounter
                }
                aria-label={`${clue.length} de ${CLUE_MAX_LENGTH} caracteres`}
              >
                {clue.length}
                /
                {CLUE_MAX_LENGTH}
              </span>
            </div>
          </div>
        )}

        {hasCoordinate ? (
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.failedButton}`}
              onClick={() =>
                openResolveModal(
                  COORDINATE_RESULT.FAILED,
                )
              }
              disabled={
                isResolving
                || !isOnline
              }
            >
              <FiX aria-hidden="true" />

              {isResolving
                ? 'Procesando…'
                : 'Fallaron'}
            </button>

            <button
              type="button"
              className={`${styles.actionButton} ${styles.correctButton}`}
              onClick={() =>
                openResolveModal(
                  COORDINATE_RESULT.CORRECT,
                )
              }
              disabled={
                isResolving
                || !isOnline
              }
            >
              <FiCheck aria-hidden="true" />

              {isResolving
                ? 'Procesando…'
                : 'Acertaron'}
            </button>
          </div>
        ) : (
          <p className={styles.emptyMessage}>
            No quedan coordenadas disponibles para asignarte.
          </p>
        )}

        {error && (
          <p
            className={styles.error}
            role="alert"
          >
            {error}
          </p>
        )}
      </section>

      <ConfirmModal
        isOpen={
          Boolean(
            pendingResult,
          )
        }
        title={
          isCorrectResult
            ? 'Confirmar acierto'
            : 'Confirmar fallo'
        }
        description={
          modalDescription
        }
        confirmLabel={
          isCorrectResult
            ? 'Marcar como acertada'
            : 'Marcar como fallada'
        }
        processingLabel="Procesando…"
        tone={
          isCorrectResult
            ? CONFIRM_MODAL_TONES.SUCCESS
            : CONFIRM_MODAL_TONES.DANGER
        }
        isProcessing={
          isResolving
        }
        onConfirm={
          handleConfirmResolve
        }
        onCancel={
          closeResolveModal
        }
      />
    </>
  );
}

export default PlayerCoordinateCard;