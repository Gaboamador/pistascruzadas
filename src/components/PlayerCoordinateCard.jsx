import { useState } from 'react';
import {
  FiCheck,
  FiX,
} from 'react-icons/fi';

import ConfirmModal, {
  CONFIRM_MODAL_TONES,
} from '@/components/ConfirmModal';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import {
  COORDINATE_RESULT,
  resolveCurrentCoordinate,
} from '@/services/firebase/coordinateService';

import styles from '@/components/PlayerCoordinateCard.module.scss';

function PlayerCoordinateCard({
  tableCode,
  uid,
  currentCoordinate,
}) {
  const isOnline = useOnlineStatus();
  
  const [
    isResolving,
    setIsResolving,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [
    pendingResult,
    setPendingResult,
  ] = useState(null);

  const hasCoordinate =
    Boolean(currentCoordinate);

  const isCorrectResult =
    pendingResult
      === COORDINATE_RESULT.CORRECT;

  const openResolveModal = (result) => {
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

    setError('');
    setPendingResult(result);
  };

  const closeResolveModal = () => {
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

      setError('');
      setIsResolving(true);

      try {
        await resolveCurrentCoordinate({
          tableCode,
          uid,
          result: pendingResult,
        });

        setPendingResult(null);
      } catch (resolveError) {
        console.error(
          'Error al procesar la coordenada:',
          resolveError,
        );

        setError(
          resolveError instanceof Error
            ? resolveError.message
            : 'No se pudo procesar la coordenada.',
        );
      } finally {
        setIsResolving(false);
      }
    };

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

          <p className={styles.description}>
            Sólo vos podés ver esta carta. Da una pista que conecte
            las palabras de esa columna y esa fila.
          </p>
        </div>

        <div
          className={styles.coordinate}
          aria-live="polite"
        >
          {hasCoordinate
            ? currentCoordinate
            : '—'}
        </div>

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
              disabled={isResolving || !isOnline}
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
              disabled={isResolving || !isOnline}
            >
              <FiCheck
                aria-hidden="true"
              />

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
        isOpen={Boolean(pendingResult)}
        title={
          isCorrectResult
            ? 'Confirmar acierto'
            : 'Confirmar fallo'
        }
        description={
          isCorrectResult
            ? `¿Confirmás que acertaron la coordenada ${currentCoordinate}? Se revelará en el tablero y recibirás otra coordenada si quedan disponibles.`
            : `¿Confirmás que fallaron la coordenada ${currentCoordinate}? Se guardará entre tus fallos y recibirás otra coordenada si quedan disponibles.`
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
        isProcessing={isResolving}
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