import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router';

import {
  JOIN_REQUEST_STATUS,
  JOIN_REQUEST_TYPE,
  NICKNAME_MAX_LENGTH,
  TABLE_CODE_LENGTH,
  TABLE_STATUS,
} from '@/constants/table';
import useJoinRequest from '@/hooks/useJoinRequest';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import {
  deleteCurrentAnonymousUser,
  signInAnonymousUser,
} from '@/services/firebase/authService';
import {
  JOIN_TABLE_ENTRY_TYPES,
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

const PENDING_REQUEST_STORAGE_VERSION = 1;

const PENDING_REQUEST_STORAGE_KEY =
  'pistas-cruzadas:pending-join-request';

function isValidStoredRequestType(
  requestType,
) {
  return requestType
      === JOIN_REQUEST_TYPE.JOIN
    || requestType
      === JOIN_REQUEST_TYPE.REJOIN;
}

function readStoredPendingRequest(uid) {
  if (!uid) {
    return null;
  }

  try {
    const storedValue =
      window.localStorage.getItem(
        PENDING_REQUEST_STORAGE_KEY,
      );

    if (!storedValue) {
      return null;
    }

    const parsedValue =
      JSON.parse(storedValue);

    if (
      parsedValue?.version
        !== PENDING_REQUEST_STORAGE_VERSION
      || parsedValue?.uid !== uid
      || typeof parsedValue?.tableCode
        !== 'string'
      || typeof parsedValue?.nickname
        !== 'string'
      || !isValidStoredRequestType(
        parsedValue?.requestType,
      )
    ) {
      window.localStorage.removeItem(
        PENDING_REQUEST_STORAGE_KEY,
      );

      return null;
    }

    const normalizedTableCode =
      normalizeTableCode(
        parsedValue.tableCode,
      );

    const normalizedNickname =
      normalizeNickname(
        parsedValue.nickname,
      );

    if (
      validateTableCode(
        normalizedTableCode,
      )
      || validateNickname(
        normalizedNickname,
      )
    ) {
      window.localStorage.removeItem(
        PENDING_REQUEST_STORAGE_KEY,
      );

      return null;
    }

    return {
      tableCode:
        normalizedTableCode,
      nickname:
        normalizedNickname,
      requestType:
        parsedValue.requestType,
      hasObservedPending:
        parsedValue.hasObservedPending
          === true,
    };
  } catch (storageError) {
    console.error(
      'Error al recuperar la solicitud guardada:',
      storageError,
    );

    window.localStorage.removeItem(
      PENDING_REQUEST_STORAGE_KEY,
    );

    return null;
  }
}

function savePendingRequest({
  uid,
  pendingRequest,
}) {
  if (!uid || !pendingRequest) {
    return;
  }

  try {
    window.localStorage.setItem(
      PENDING_REQUEST_STORAGE_KEY,
      JSON.stringify({
        version:
          PENDING_REQUEST_STORAGE_VERSION,
        uid,
        tableCode:
          pendingRequest.tableCode,
        nickname:
          pendingRequest.nickname,
        requestType:
          pendingRequest.requestType,
        hasObservedPending:
          pendingRequest
            .hasObservedPending
            === true,
      }),
    );
  } catch (storageError) {
    console.error(
      'Error al guardar la solicitud pendiente:',
      storageError,
    );
  }
}

function clearStoredPendingRequest() {
  try {
    window.localStorage.removeItem(
      PENDING_REQUEST_STORAGE_KEY,
    );
  } catch (storageError) {
    console.error(
      'Error al limpiar la solicitud guardada:',
      storageError,
    );
  }
}

function getJoinErrorMessage(error) {
  if (!(error instanceof JoinTableError)) {
    return 'No se pudo ingresar a la mesa. Revisá tu conexión e intentá nuevamente.';
  }

  switch (error.code) {
    case JOIN_TABLE_ERROR_CODES.TABLE_NOT_FOUND:
      return 'No encontramos una mesa con ese código.';

    case JOIN_TABLE_ERROR_CODES.TABLE_FINISHED:
      return 'Esta partida ya terminó.';

    default:
      return 'No se pudo ingresar a la mesa.';
  }
}

function JoinRequestStatus({
  pendingRequest,
  user,
  onPendingConfirmed,
  onClearPendingRequest,
}) {
  const navigate = useNavigate();

  const {
    tableCode,
    nickname,
    requestType,
    hasObservedPending,
  } = pendingRequest;

  const {
    joinRequest,
    table,
    tableExists,
    isLoading,
    error,
  } = useJoinRequest({
    tableCode,
    uid: user.uid,
  });

  /*
   * El mismo documento puede reutilizarse
   * para solicitudes sucesivas.
   *
   * El tipo evita mezclar join y rejoin.
   * hasObservedPending evita navegar por
   * un approved viejo emitido desde caché
   * antes de recibir la solicitud nueva.
   */
  const isCurrentRequest =
    joinRequest?.type === requestType;

  const isRejoinRequest =
    requestType
      === JOIN_REQUEST_TYPE.REJOIN;

  const isPending =
    isCurrentRequest
    && joinRequest?.status
      === JOIN_REQUEST_STATUS.PENDING;

  const isApproved =
    isCurrentRequest
    && hasObservedPending
    && joinRequest?.status
      === JOIN_REQUEST_STATUS.APPROVED;

  const isRejected =
    isCurrentRequest
    && hasObservedPending
    && joinRequest?.status
      === JOIN_REQUEST_STATUS.REJECTED;

  const isTableFinished =
    table?.status
      === TABLE_STATUS.FINISHED;

  const isTableUnavailable =
    !isLoading
    && !tableExists;

  const isWaitingForCurrentRequest =
    !isLoading
    && Boolean(joinRequest)
    && (
      !isCurrentRequest
      || (
        !hasObservedPending
        && joinRequest.status
          !== JOIN_REQUEST_STATUS.PENDING
      )
    );

  useEffect(() => {
    if (
      !isCurrentRequest
      || joinRequest?.status
        !== JOIN_REQUEST_STATUS.PENDING
      || hasObservedPending
    ) {
      return;
    }

    onPendingConfirmed();
  }, [
    hasObservedPending,
    isCurrentRequest,
    joinRequest?.status,
    onPendingConfirmed,
  ]);

  useEffect(() => {
    if (!isApproved) {
      return;
    }

    onClearPendingRequest();

    navigate(`/mesa/${tableCode}`, {
      replace: true,
      state: {
        tableJoined: true,
        nickname:
          joinRequest?.nickname
          ?? nickname,
        participantRole: 'player',
        wasApproved: true,
      },
    });
  }, [
    isApproved,
    joinRequest?.nickname,
    navigate,
    nickname,
    onClearPendingRequest,
    tableCode,
  ]);

  let title =
    isRejoinRequest
      ? 'Solicitud de reingreso pendiente'
      : 'Esperando al anfitrión';

  let description =
    isRejoinRequest
      ? 'Solicitaste volver a la partida. Si el anfitrión aprueba el reingreso, conservarás tus coordenadas falladas con sus pistas y recibirás una nueva coordenada.'
      : 'La partida ya comenzó. Enviamos una solicitud para que el anfitrión decida si podés incorporarte.';

  if (isApproved) {
    title = 'Ingreso aprobado';
    description =
      'El anfitrión aprobó tu ingreso. Estamos abriendo la mesa.';
  } else if (isRejected) {
    title = 'Solicitud rechazada';
    description =
      'El anfitrión decidió no incorporarte a esta partida.';
  } else if (isTableFinished) {
    title = 'La partida ya terminó';
    description =
      'La partida finalizó antes de que el anfitrión resolviera tu solicitud.';
  } else if (isTableUnavailable) {
    title = 'La mesa ya no está disponible';
    description =
      'No encontramos la mesa asociada a esta solicitud.';
  }

  const hasTerminalTableState =
    isTableFinished
    || isTableUnavailable;

  const shouldShowWaitingStatus =
    !hasTerminalTableState
    && (
      isLoading
      || isWaitingForCurrentRequest
    );

  const shouldShowPendingStatus =
    !hasTerminalTableState
    && !isLoading
    && isPending;

  const shouldShowMissingRequest =
    !hasTerminalTableState
    && !isLoading
    && !error
    && !joinRequest;

  const handleReturnHome = () => {
    onClearPendingRequest();
  };

  return (
    <main className={styles.page}>
      <section
        className={styles.content}
        aria-labelledby="join-request-title"
      >
        <p className={styles.eyebrow}>
          Solicitud de ingreso
        </p>

        <h1
          id="join-request-title"
          className={styles.title}
        >
          {title}
        </h1>

        <p className={styles.description}>
          {description}
        </p>

        <div className={styles.requestSummary}>
          <div className={styles.requestDetail}>
            <span className={styles.requestLabel}>
              Mesa
            </span>

            <strong className={styles.requestCode}>
              {tableCode}
            </strong>
          </div>

          <div className={styles.requestDetail}>
            <span className={styles.requestLabel}>
              Apodo solicitado
            </span>

            <strong>
              {isCurrentRequest
                ? (
                    joinRequest?.nickname
                    ?? nickname
                  )
                : nickname}
            </strong>
          </div>
        </div>

        {shouldShowWaitingStatus && (
          <p
            className={styles.requestStatus}
            role="status"
            aria-live="polite"
          >
            Confirmando la solicitud…
          </p>
        )}

        {shouldShowPendingStatus && (
          <p
            className={styles.requestStatus}
            role="status"
            aria-live="polite"
          >
            Solicitud pendiente
          </p>
        )}

        {!isLoading
          && isApproved && (
          <p
            className={styles.requestApproved}
            role="status"
            aria-live="polite"
          >
            Ingreso aprobado
          </p>
        )}

        {!isLoading
          && isRejected && (
          <p
            className={styles.requestRejected}
            role="status"
            aria-live="polite"
          >
            Solicitud rechazada
          </p>
        )}

        {!isLoading
          && hasTerminalTableState && (
          <p
            className={styles.requestRejected}
            role="status"
            aria-live="polite"
          >
            Solicitud sin resolver
          </p>
        )}

        {shouldShowMissingRequest && (
          <p
            className={styles.requestError}
            role="alert"
          >
            No encontramos la solicitud enviada. Volvé al inicio e
            intentá nuevamente.
          </p>
        )}

        {error && (
          <p
            className={styles.requestError}
            role="alert"
          >
            No se pudo actualizar el estado de la solicitud. Revisá
            tu conexión.
          </p>
        )}

        <p className={styles.requestHelp}>
          {isApproved
            ? 'Ya se creó tu acceso como jugador activo.'
            : isRejected
              ? 'No se creó ningún acceso a la mesa.'
              : hasTerminalTableState
                ? 'La solicitud ya no puede ser aprobada porque la mesa no está activa.'
                : 'Todavía no sos participante y no tenés acceso al tablero ni a la sala.'}
        </p>

        {!isApproved && (
          <Link
            to="/"
            className="button button--secondary"
            onClick={handleReturnHome}
          >
            Volver al inicio
          </Link>
        )}
      </section>
    </main>
  );
}

function JoinTablePage({ user }) {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [
    activeUser,
    setActiveUser,
  ] = useState(user);

  const currentUser =
    user ?? activeUser;

  const [tableCode, setTableCode] =
    useState('');

  const [nickname, setNickname] =
    useState('');

  const [
    pendingRequest,
    setPendingRequest,
  ] = useState(() =>
    readStoredPendingRequest(
      currentUser?.uid,
    ),
  );

  const [errors, setErrors] = useState({
    tableCode: '',
    nickname: '',
  });

  const [submitError, setSubmitError] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (user) {
      setActiveUser(user);
    }
  }, [user]);

  useEffect(() => {
    const storedPendingRequest =
      readStoredPendingRequest(
        currentUser?.uid,
      );

    setPendingRequest(
      storedPendingRequest,
    );
  }, [currentUser?.uid]);

  const updatePendingRequest = (
    nextPendingRequest,
  ) => {
    setPendingRequest(
      nextPendingRequest,
    );

    if (nextPendingRequest) {
      savePendingRequest({
        uid: currentUser.uid,
        pendingRequest:
          nextPendingRequest,
      });
    } else {
      clearStoredPendingRequest();
    }
  };

  const handlePendingConfirmed = () => {
    setPendingRequest(
      (currentPendingRequest) => {
        if (
          !currentPendingRequest
          || currentPendingRequest
            .hasObservedPending
        ) {
          return currentPendingRequest;
        }

        const nextPendingRequest = {
          ...currentPendingRequest,
          hasObservedPending: true,
        };

        savePendingRequest({
          uid: currentUser.uid,
          pendingRequest:
            nextPendingRequest,
        });

        return nextPendingRequest;
      },
    );
  };

  const handleClearPendingRequest =
    () => {
      updatePendingRequest(null);
    };

  const handleTableCodeChange = (
    event,
  ) => {
    setTableCode(
      normalizeTableCode(
        event.target.value,
      ),
    );

    if (errors.tableCode) {
      setErrors(
        (currentErrors) => ({
          ...currentErrors,
          tableCode: '',
        }),
      );
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  const handleNicknameChange = (
    event,
  ) => {
    setNickname(event.target.value);

    if (errors.nickname) {
      setErrors(
        (currentErrors) => ({
          ...currentErrors,
          nickname: '',
        }),
      );
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!isOnline) {
      setSubmitError(
        'Necesitás conexión a internet para unirte a una mesa.',
      );

      return;
    }

    const normalizedTableCode =
      normalizeTableCode(tableCode);

    const normalizedNickname =
      normalizeNickname(nickname);

    const nextErrors = {
      tableCode: validateTableCode(
        normalizedTableCode,
      ),
      nickname: validateNickname(
        normalizedNickname,
      ),
    };

    setErrors(nextErrors);

    if (
      nextErrors.tableCode
      || nextErrors.nickname
    ) {
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    const hadAuthenticatedUser =
      Boolean(currentUser);

    try {
      const authenticatedUser =
        currentUser
        ?? await signInAnonymousUser();

      setActiveUser(
        authenticatedUser,
      );

      const result = await joinTable({
        uid: authenticatedUser.uid,
        tableCode:
          normalizedTableCode,
        nickname:
          normalizedNickname,
      });

      if (
        result.entryType
          === JOIN_TABLE_ENTRY_TYPES.REQUEST
      ) {
        savePendingRequest({
          uid: authenticatedUser.uid,
          pendingRequest: {
            tableCode:
              result.tableCode,
            nickname:
              normalizedNickname,
            requestType:
              result.requestType,
            hasObservedPending: false,
          },
        });

        setPendingRequest({
          tableCode:
            result.tableCode,
          nickname:
            normalizedNickname,
          requestType:
            result.requestType,
          hasObservedPending: false,
        });

        setIsSubmitting(false);

        return;
      }

      clearStoredPendingRequest();

      navigate(
        `/mesa/${result.tableCode}`,
        {
          replace: true,
          state: {
            tableJoined: true,
            nickname:
              normalizedNickname,
            participantRole:
              result.participantRole,
            wasReactivated:
              result.wasReactivated,
          },
        },
      );
    } catch (error) {
      console.error(
        'Error al unirse a la mesa:',
        error,
      );

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
        getJoinErrorMessage(error),
      );

      setIsSubmitting(false);
    }
  };

  if (pendingRequest) {
    return (
      <JoinRequestStatus
        pendingRequest={
          pendingRequest
        }
        user={currentUser}
        onPendingConfirmed={
          handlePendingConfirmed
        }
        onClearPendingRequest={
          handleClearPendingRequest
        }
      />
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <p className={styles.eyebrow}>
          Partida existente
        </p>

        <h1 className={styles.title}>
          Unirse a una mesa
        </h1>

        <p className={styles.description}>
          Ingresá el código compartido por el anfitrión y elegí tu
          apodo.
        </p>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
        >
          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="table-code"
            >
              Código de mesa
            </label>

            <input
              id="table-code"
              name="tableCode"
              type="text"
              className={`input ${
                errors.tableCode
                  ? 'input--error'
                  : ''
              } ${styles.codeInput}`}
              value={tableCode}
              onChange={
                handleTableCodeChange
              }
              maxLength={
                TABLE_CODE_LENGTH
              }
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              inputMode="text"
              disabled={isSubmitting || !isOnline}
              aria-invalid={Boolean(
                errors.tableCode,
              )}
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
              <p
                id="table-code-help"
                className={styles.help}
              >
                El código tiene{' '}
                {TABLE_CODE_LENGTH} letras o
                números.
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="player-nickname"
            >
              Tu apodo
            </label>

            <input
              id="player-nickname"
              name="nickname"
              type="text"
              className={`input ${
                errors.nickname
                  ? 'input--error'
                  : ''
              }`}
              value={nickname}
              onChange={
                handleNicknameChange
              }
              maxLength={
                NICKNAME_MAX_LENGTH
              }
              autoComplete="nickname"
              disabled={isSubmitting || !isOnline}
              aria-invalid={Boolean(
                errors.nickname,
              )}
              aria-describedby={
                errors.nickname
                  ? 'player-nickname-error'
                  : 'player-nickname-help'
              }
              placeholder="Nombre visible"
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
              <p
                id="player-nickname-help"
                className={styles.help}
              >
                Este será tu nombre visible
                dentro de la mesa.
              </p>
            )}
          </div>

          {submitError && (
            <p
              className={
                styles.submitError
              }
              role="alert"
            >
              {submitError}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className="button button--primary"
              disabled={isSubmitting || !isOnline}
            >
              {isSubmitting
                ? 'Ingresando…'
                : 'Unirse'}
            </button>

            <Link
              to="/"
              className="button button--secondary"
              aria-disabled={
                isSubmitting
              }
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
