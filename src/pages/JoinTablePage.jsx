import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import {
  NICKNAME_MAX_LENGTH,
  TABLE_CODE_LENGTH,
} from '@/constants/table';
import {
  JOIN_TABLE_ERROR_CODES,
  JoinTableError,
  joinTable,
} from '@/services/firebase/tableService';
import {
  normalizeNickname,
  normalizeTableCode,
  validateNickname,
  validateTableCode,
} from '@/utils/forms';

import styles from '@/pages/JoinTablePage.module.scss';

function getJoinErrorMessage(error) {
  if (!(error instanceof JoinTableError)) {
    return 'No se pudo ingresar a la mesa. Revisá tu conexión e intentá nuevamente.';
  }

  switch (error.code) {
    case JOIN_TABLE_ERROR_CODES.TABLE_NOT_FOUND:
      return 'No encontramos una mesa con ese código.';

    case JOIN_TABLE_ERROR_CODES.TABLE_ALREADY_STARTED:
      return 'La partida ya comenzó. Las incorporaciones durante la partida se habilitarán más adelante.';

    case JOIN_TABLE_ERROR_CODES.TABLE_FINISHED:
      return 'Esta partida ya terminó.';

    default:
      return 'No se pudo ingresar a la mesa.';
  }
}

function JoinTablePage({ user }) {
  const navigate = useNavigate();

  const [tableCode, setTableCode] = useState('');
  const [nickname, setNickname] = useState('');

  const [errors, setErrors] = useState({
    tableCode: '',
    nickname: '',
  });

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTableCodeChange = (event) => {
    setTableCode(normalizeTableCode(event.target.value));

    if (errors.tableCode) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        tableCode: '',
      }));
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  const handleNicknameChange = (event) => {
    setNickname(event.target.value);

    if (errors.nickname) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        nickname: '',
      }));
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

    const normalizedTableCode = normalizeTableCode(tableCode);
    const normalizedNickname = normalizeNickname(nickname);

    const nextErrors = {
      tableCode: validateTableCode(normalizedTableCode),
      nickname: validateNickname(normalizedNickname),
    };

    setErrors(nextErrors);

    if (nextErrors.tableCode || nextErrors.nickname) {
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const result = await joinTable({
        uid: user.uid,
        tableCode: normalizedTableCode,
        nickname: normalizedNickname,
      });

      navigate(`/mesa/${result.tableCode}`, {
        replace: true,
        state: {
          tableJoined: true,
          nickname: normalizedNickname,
          participantRole: result.participantRole,
          wasReactivated: result.wasReactivated,
        },
      });
    } catch (error) {
      console.error('Error al unirse a la mesa:', error);

      setSubmitError(getJoinErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <p className={styles.eyebrow}>Partida existente</p>

        <h1 className={styles.title}>Unirse a una mesa</h1>

        <p className={styles.description}>
          Ingresá el código compartido por el anfitrión y elegí tu apodo.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="table-code">
              Código de mesa
            </label>

            <input
              id="table-code"
              name="tableCode"
              type="text"
              className={`input ${errors.tableCode ? 'input--error' : ''} ${styles.codeInput}`}
              value={tableCode}
              onChange={handleTableCodeChange}
              maxLength={TABLE_CODE_LENGTH}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              inputMode="text"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.tableCode)}
              aria-describedby={
                errors.tableCode
                  ? 'table-code-error'
                  : 'table-code-help'
              }
              placeholder="ABC123"
            />

            {errors.tableCode ? (
              <p
                id="table-code-error"
                className={styles.error}
                role="alert"
              >
                {errors.tableCode}
              </p>
            ) : (
              <p id="table-code-help" className={styles.help}>
                El código tiene {TABLE_CODE_LENGTH} letras o números.
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="player-nickname">
              Tu apodo
            </label>

            <input
              id="player-nickname"
              name="nickname"
              type="text"
              className={`input ${errors.nickname ? 'input--error' : ''}`}
              value={nickname}
              onChange={handleNicknameChange}
              maxLength={NICKNAME_MAX_LENGTH}
              autoComplete="nickname"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.nickname)}
              aria-describedby={
                errors.nickname
                  ? 'player-nickname-error'
                  : 'player-nickname-help'
              }
              placeholder="Ejemplo: Gabriel"
            />

            {errors.nickname ? (
              <p
                id="player-nickname-error"
                className={styles.error}
                role="alert"
              >
                {errors.nickname}
              </p>
            ) : (
              <p id="player-nickname-help" className={styles.help}>
                Este será tu nombre visible dentro de la mesa.
              </p>
            )}
          </div>

          {submitError && (
            <p className={styles.submitError} role="alert">
              {submitError}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className="button button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ingresando…' : 'Unirse'}
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

export default JoinTablePage;