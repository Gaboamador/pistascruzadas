import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import {
  DEFAULT_GRID_SIZE,
  GRID_SIZE_OPTIONS,
  NICKNAME_MAX_LENGTH,
} from '@/constants/table';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import {
  deleteCurrentAnonymousUser,
  signInAnonymousUser,
} from '@/services/firebase/authService';
import { createTable } from '@/services/firebase/tableService';
import {
  normalizeNickname,
  validateNickname,
} from '@/utils/forms';

import styles from '@/pages/CreateTablePage.module.scss';

function CreateTablePage({ user }) {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [nickname, setNickname] = useState('');
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [nicknameError, setNicknameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNicknameChange = (event) => {
    setNickname(event.target.value);

    if (nicknameError) {
      setNicknameError('');
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!isOnline) {
      setSubmitError(
        'Necesitás conexión a internet para crear una mesa.',
      );

      return;
    }

    const error = validateNickname(nickname);

    if (error) {
      setNicknameError(error);
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    const hadAuthenticatedUser =
      Boolean(user);

    try {
      const normalizedNickname = normalizeNickname(nickname);

      const authenticatedUser =
        user
        ?? await signInAnonymousUser();

      const { tableCode } = await createTable({
        uid: authenticatedUser.uid,
        nickname: normalizedNickname,
        gridSize,
      });

      navigate(`/mesa/${tableCode}`, {
        replace: true,
        state: {
          tableCreated: true,
          nickname: normalizedNickname,
        },
      });
    } catch (error) {
      console.error('Error al crear la mesa:', error);

      if (!hadAuthenticatedUser) {
        try {
          await deleteCurrentAnonymousUser();
        } catch (cleanupError) {
          console.error(
            'No se pudo limpiar la identidad anónima creada para el intento fallido:',
            cleanupError,
          );
        }
      }

      setSubmitError(
        'No se pudo crear la mesa. Revisá tu conexión e intentá nuevamente.',
      );

      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <p className={styles.eyebrow}>Nueva partida</p>

        <h1 className={styles.title}>Crear mesa</h1>

        <p className={styles.description}>
          Elegí tu apodo y el tamaño del tablero.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="host-nickname">
              Tu apodo
            </label>

            <input
              id="host-nickname"
              name="nickname"
              type="text"
              className={`input ${nicknameError ? 'input--error' : ''}`}
              value={nickname}
              onChange={handleNicknameChange}
              maxLength={NICKNAME_MAX_LENGTH}
              autoComplete="nickname"
              disabled={isSubmitting || !isOnline}
              aria-invalid={Boolean(nicknameError)}
              aria-describedby={
                nicknameError
                  ? 'host-nickname-error'
                  : 'host-nickname-help'
              }
              placeholder="Nombre visible"
            />

            {nicknameError ? (
              <p
                id="host-nickname-error"
                className={styles.error}
                role="alert"
              >
                {nicknameError}
              </p>
            ) : (
              <p id="host-nickname-help" className={styles.help}>
                Este será tu nombre visible dentro de la mesa.
              </p>
            )}
          </div>

          <fieldset
            className={styles.fieldset}
            disabled={isSubmitting || !isOnline}
          >
            <legend className={styles.legend}>
              Tamaño de la grilla
            </legend>

            <div className={styles.gridOptions}>
              {GRID_SIZE_OPTIONS.map((option) => {
                const inputId = `grid-size-${option.value}`;

                return (
                  <label
                    key={option.value}
                    className={styles.gridOption}
                    htmlFor={inputId}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name="gridSize"
                      value={option.value}
                      checked={gridSize === option.value}
                      onChange={() => setGridSize(option.value)}
                      className={styles.radio}
                    />

                    <span className={styles.gridOptionContent}>
                      <strong>{option.label}</strong>
                      <span>
                        {option.coordinateCount} coordenadas
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {submitError && (
            <p className={styles.submitError} role="alert">
              {submitError}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className="button button--primary"
              disabled={isSubmitting || !isOnline}
            >
              {isSubmitting ? 'Creando mesa…' : 'Crear mesa'}
            </button>

            <Link
              to="/"
              className="button button--secondary"
              aria-disabled={isSubmitting}
              onClick={(event) => {
                if (isSubmitting) {
                  event.preventDefault();
                }
              }}
            >
              Volver al inicio
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default CreateTablePage;
