import { useState } from 'react';
import {
  FiCheck,
  FiX,
} from 'react-icons/fi';

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
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState('');

  const hasCoordinate = Boolean(currentCoordinate);

  const handleResolve = async (result) => {
    if (!hasCoordinate || isResolving) {
      return;
    }

    const actionLabel =
      result === COORDINATE_RESULT.CORRECT
        ? 'marcarla como acertada'
        : 'marcarla como fallada';

    const confirmed = window.confirm(
      `¿Confirmás que querés ${actionLabel}?`,
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setIsResolving(true);

    try {
      await resolveCurrentCoordinate({
        tableCode,
        uid,
        result,
      });
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
    <section
      className={`${styles.card} ${
        hasCoordinate ? styles.cardActive : ''
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
        {hasCoordinate ? currentCoordinate : '—'}
      </div>

      {hasCoordinate ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.failedButton}`}
            onClick={() =>
              handleResolve(COORDINATE_RESULT.FAILED)
            }
            disabled={isResolving}
          >
            <FiX aria-hidden="true" />

            {isResolving ? 'Procesando…' : 'Fallaron'}
          </button>

          <button
            type="button"
            className={`${styles.actionButton} ${styles.correctButton}`}
            onClick={() =>
              handleResolve(COORDINATE_RESULT.CORRECT)
            }
            disabled={isResolving}
          >
            <FiCheck aria-hidden="true" />

            {isResolving ? 'Procesando…' : 'Acertaron'}
          </button>
        </div>
      ) : (
        <p className={styles.emptyMessage}>
          No quedan coordenadas disponibles para asignarte.
        </p>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export default PlayerCoordinateCard;