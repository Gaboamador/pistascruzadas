import { useState } from 'react';
import {
  FiCheck,
  FiFlag,
  FiLogOut,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router';

import ConfirmModal, {
  CONFIRM_MODAL_TONES,
} from '@/components/ConfirmModal';
import FailedCoordinatesPanel from '@/components/FailedCoordinatesPanel';
import GameBoard from '@/components/GameBoard';
import PlayerCoordinateCard from '@/components/PlayerCoordinateCard';
import {
  GAME_FINISH_REASON,
  JOIN_REQUEST_TYPE,
  PARTICIPANT_ROLE,
  PARTICIPANT_STATUS,
  TABLE_STATUS,
} from '@/constants/table';
import usePendingJoinRequests from '@/hooks/usePendingJoinRequests';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import useTableRoom from '@/hooks/useTableRoom';
import {
  deleteFinishedTable,
} from '@/services/firebase/deleteTableService';
import {
  finishGameManually,
} from '@/services/firebase/finishGameService';
import {
  approveJoinRequest,
  rejectJoinRequest,
} from '@/services/firebase/joinRequestService';
import {
  leaveTable,
} from '@/services/firebase/leaveTableService';

import styles from '@/pages/TablePage.module.scss';

function getTableStatusLabel(status) {
  switch (status) {
    case TABLE_STATUS.LOBBY:
      return 'Esperando jugadores';

    case TABLE_STATUS.PLAYING:
      return 'Partida en curso';

    case TABLE_STATUS.FINISHED:
      return 'Partida finalizada';

    default:
      return 'Estado desconocido';
  }
}

function getFinishedContent(
  finishReason,
) {
  if (
    finishReason
      === GAME_FINISH_REASON.MANUAL
  ) {
    return {
      title:
        'El anfitrión terminó la partida',
      description:
        'La partida terminó antes de procesar todas las coordenadas. El tablero conserva las coordenadas acertadas y tus fallos siguen siendo privados.',
      footer:
        'La partida fue finalizada manualmente por el anfitrión.',
    };
  }

  return {
    title:
      'Se procesaron todas las coordenadas',
    description:
      'El tablero muestra las coordenadas que fueron acertadas. Tus coordenadas falladas permanecen visibles solamente para vos.',
    footer:
      'La partida terminó porque ya no quedan coordenadas pendientes.',
  };
}

function StatusContent({
  eyebrow,
  title,
  description,
  children = null,
  role,
}) {
  return (
    <main className={styles.page}>
      <section
        className={styles.content}
        role={role}
      >
        <p className={styles.eyebrow}>
          {eyebrow}
        </p>

        <h1 className={styles.title}>
          {title}
        </h1>

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

function PendingJoinRequestsPanel({
  tableCode,
  hostUid,
  pendingJoinRequests,
  isLoading,
  error,
  isOnline,
}) {
  const [
    processingRequest,
    setProcessingRequest,
  ] = useState({
    uid: '',
    action: '',
  });

  const [
    requestActionError,
    setRequestActionError,
  ] = useState('');

  const [
    confirmationRequest,
    setConfirmationRequest,
  ] = useState(null);

  const isProcessingRequest =
    Boolean(processingRequest.uid);

  const closeConfirmation = () => {
    if (isProcessingRequest) {
      return;
    }

    setConfirmationRequest(null);
  };

    const openApproveConfirmation = (
    joinRequest,
  ) => {
    if (isProcessingRequest) {
      return;
    }

    if (!isOnline) {
      setRequestActionError(
        'Necesitás conexión a internet para aprobar solicitudes.',
      );

      return;
    }

    setRequestActionError('');

    setConfirmationRequest({
      action: 'approve',
      joinRequest,
    });
  };

    const openRejectConfirmation = (
    joinRequest,
  ) => {
    if (isProcessingRequest) {
      return;
    }

    if (!isOnline) {
      setRequestActionError(
        'Necesitás conexión a internet para rechazar solicitudes.',
      );

      return;
    }

    setRequestActionError('');

    setConfirmationRequest({
      action: 'reject',
      joinRequest,
    });
  };

  const handleConfirmRequest =
    async () => {
      if (
        isProcessingRequest
        || !confirmationRequest
      ) {
        return;
      }

      if (!isOnline) {
        setRequestActionError(
          'Necesitás conexión a internet para resolver solicitudes.',
        );

        setConfirmationRequest(null);

        return;
      }

      const {
        action,
        joinRequest,
      } = confirmationRequest;

      setRequestActionError('');

      setProcessingRequest({
        uid: joinRequest.uid,
        action,
      });

      try {
        if (action === 'approve') {
          await approveJoinRequest({
            tableCode,
            hostUid,
            requestUid:
              joinRequest.uid,
          });
        } else {
          await rejectJoinRequest({
            tableCode,
            hostUid,
            requestUid:
              joinRequest.uid,
          });
        }

        setConfirmationRequest(null);
      } catch (requestError) {
        console.error(
          action === 'approve'
            ? 'Error al aprobar la solicitud:'
            : 'Error al rechazar la solicitud:',
          requestError,
        );

        setRequestActionError(
          requestError instanceof Error
            ? requestError.message
            : action === 'approve'
              ? 'No se pudo aprobar la solicitud.'
              : 'No se pudo rechazar la solicitud.',
        );
      } finally {
        setProcessingRequest({
          uid: '',
          action: '',
        });
      }
    };

  const confirmationJoinRequest =
    confirmationRequest?.joinRequest;

  const isApproveConfirmation =
    confirmationRequest?.action
      === 'approve';

  const isRejoinConfirmation =
    confirmationJoinRequest?.type
      === JOIN_REQUEST_TYPE.REJOIN;

  return (
    <>
      <section
        className={styles.requestsPanel}
        aria-labelledby="join-requests-title"
      >
        <div
          className={styles.sectionHeader}
        >
          <div>
            <p
              className={
                styles.sectionEyebrow
              }
            >
              Control del anfitrión
            </p>

            <h2
              id="join-requests-title"
              className={
                styles.sectionTitle
              }
            >
              Solicitudes de ingreso
            </h2>
          </div>

          <span
            className={
              styles.requestCount
            }
            aria-label={`${pendingJoinRequests.length} solicitudes pendientes`}
          >
            {
              pendingJoinRequests.length
            }
          </span>
        </div>

        {isLoading && (
          <p
            className={
              styles.requestsStatus
            }
            role="status"
            aria-live="polite"
          >
            Cargando solicitudes…
          </p>
        )}

        {error && (
          <p
            className={
              styles.requestsError
            }
            role="alert"
          >
            No se pudieron cargar las solicitudes de ingreso.
          </p>
        )}

        {requestActionError && (
          <p
            className={
              styles.requestsError
            }
            role="alert"
          >
            {requestActionError}
          </p>
        )}

        {!isLoading
          && !error
          && pendingJoinRequests.length
            === 0 && (
            <p
              className={
                styles.requestsEmpty
              }
            >
              No hay solicitudes pendientes.
            </p>
          )}

        {!isLoading
          && !error
          && pendingJoinRequests.length
            > 0 && (
            <>
              <p
                className={
                  styles.requestsDescription
                }
              >
                Podés aprobar una solicitud si queda al menos una
                coordenada disponible, o rechazarla sin darle acceso a
                la mesa.
              </p>

              <ul
                className={
                  styles.requestList
                }
              >
                {pendingJoinRequests.map(
                  (joinRequest) => {
                    const isApproving =
                      processingRequest.uid
                        === joinRequest.uid
                      && processingRequest.action
                        === 'approve';

                    const isRejecting =
                      processingRequest.uid
                        === joinRequest.uid
                      && processingRequest.action
                        === 'reject';

                    const isRejoinRequest =
                      joinRequest.type
                        === JOIN_REQUEST_TYPE.REJOIN;

                    return (
                      <li
                        key={joinRequest.id}
                        className={
                          styles.requestItem
                        }
                      >
                        <div
                          className={
                            styles.requestMain
                          }
                        >
                          <span
                            className={
                              styles.requestNickname
                            }
                          >
                            {
                              joinRequest.nickname
                            }
                          </span>

                          <span
                            className={
                              styles.requestStatusBadge
                            }
                          >
                            {isRejoinRequest
                              ? 'Reingreso'
                              : 'Nuevo jugador'}
                          </span>
                        </div>

                        <div
                          className={
                            styles.requestActions
                          }
                        >
                          <button
                            type="button"
                            className={
                              styles.rejectRequestButton
                            }
                            onClick={() =>
                              openRejectConfirmation(
                                joinRequest,
                              )
                            }
                            disabled={
                              isProcessingRequest || !isOnline
                            }
                          >
                            <FiX
                              aria-hidden="true"
                            />

                            {isRejecting
                              ? 'Rechazando…'
                              : 'Rechazar'}
                          </button>

                          <button
                            type="button"
                            className={
                              styles.approveRequestButton
                            }
                            onClick={() =>
                              openApproveConfirmation(
                                joinRequest,
                              )
                            }
                            disabled={
                              isProcessingRequest || !isOnline
                            }
                          >
                            <FiCheck
                              aria-hidden="true"
                            />

                            {isApproving
                              ? 'Aprobando…'
                              : 'Aprobar'}
                          </button>
                        </div>
                      </li>
                    );
                  },
                )}
              </ul>
            </>
          )}
      </section>

      <ConfirmModal
        isOpen={
          Boolean(
            confirmationRequest,
          )
        }
        title={
          isApproveConfirmation
            ? `Aprobar a ${confirmationJoinRequest?.nickname ?? ''}`
            : `Rechazar a ${confirmationJoinRequest?.nickname ?? ''}`
        }
        description={
          isApproveConfirmation
            ? isRejoinConfirmation
              ? 'Se reactivará su acceso, conservará sus coordenadas falladas y recibirá una nueva coordenada disponible.'
              : 'Se creará su acceso como jugador y se le asignará una coordenada disponible.'
            : 'La solicitud quedará rechazada y el usuario no tendrá acceso a la mesa.'
        }
        confirmLabel={
          isApproveConfirmation
            ? 'Aprobar ingreso'
            : 'Rechazar solicitud'
        }
        processingLabel={
          isApproveConfirmation
            ? 'Aprobando…'
            : 'Rechazando…'
        }
        tone={
          isApproveConfirmation
            ? CONFIRM_MODAL_TONES.SUCCESS
            : CONFIRM_MODAL_TONES.DANGER
        }
        isProcessing={
          isProcessingRequest
        }
        onConfirm={
          handleConfirmRequest
        }
        onCancel={
          closeConfirmation
        }
      />
    </>
  );
}

function TablePage({ user }) {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [
    isLeaving,
    setIsLeaving,
  ] = useState(false);

  const [
    leaveError,
    setLeaveError,
  ] = useState('');

  const [
    isFinishingGame,
    setIsFinishingGame,
  ] = useState(false);

  const [
    finishGameError,
    setFinishGameError,
  ] = useState('');

  const [
    isDeletingTable,
    setIsDeletingTable,
  ] = useState(false);

  const [
    deleteTableError,
    setDeleteTableError,
  ] = useState('');

  const [
    confirmationAction,
    setConfirmationAction,
  ] = useState('');

  const { tableCode = '' } =
    useParams();

  const normalizedTableCode =
    tableCode.toUpperCase();

  const {
    table,
    participant,
    players,
    isLoading,
    error,
    tableExists,
    hasAccess,
  } = useTableRoom({
    tableCode:
      normalizedTableCode,
    uid: user.uid,
  });

  const isHost =
    participant?.role
      === PARTICIPANT_ROLE.HOST
    && table?.hostUid === user.uid;

  const isPlaying =
    table?.status
      === TABLE_STATUS.PLAYING;

  const {
    pendingJoinRequests,
    isLoading:
      arePendingJoinRequestsLoading,
    error:
      pendingJoinRequestsError,
  } = usePendingJoinRequests({
    tableCode:
      normalizedTableCode,
    enabled:
      isHost && isPlaying,
  });

  if (isLoading) {
    return (
      <StatusContent
        eyebrow="Pistas Cruzadas"
        title="Cargando mesa…"
        role="status"
      />
    );
  }

  if (error) {
    return (
      <StatusContent
        eyebrow="Error de conexión"
        title="No pudimos cargar la mesa"
        description="La mesa puede no existir o puede haber ocurrido un problema de conexión."
        role="alert"
      >
        <div className={styles.statusActions}>
          <button
            type="button"
            className="button button--primary"
            onClick={() =>
              window.location.reload()
            }
          >
            Reintentar
          </button>

          <Link
            to="/"
            className="button button--secondary"
          >
            Volver al inicio
          </Link>
        </div>
      </StatusContent>
    );
  }

  if (!tableExists || !table) {
    return (
      <StatusContent
        eyebrow="Mesa inexistente"
        title={
          normalizedTableCode
        }
        description="No encontramos una mesa con ese código."
      >
        <Link
          to="/"
          className="button button--secondary"
        >
          Volver al inicio
        </Link>
      </StatusContent>
    );
  }

  const isActiveParticipant =
    hasAccess
    && participant?.status
      === PARTICIPANT_STATUS.ACTIVE;

  if (!isActiveParticipant) {
    return (
      <StatusContent
        eyebrow="Acceso restringido"
        title={
          normalizedTableCode
        }
        description="Este dispositivo todavía no pertenece a la mesa."
      >
        <Link
          to="/unirse"
          className="button button--primary"
        >
          Unirse a una mesa
        </Link>
      </StatusContent>
    );
  }

  const activePlayers =
    players.filter(
      (player) =>
        player.status
          === PARTICIPANT_STATUS.ACTIVE,
    );

  const isFinished =
    table.status
      === TABLE_STATUS.FINISHED;

  const shouldShowGame =
    isPlaying || isFinished;

  const canPrepareTable =
    isHost
    && table.status
      === TABLE_STATUS.LOBBY;

  const canFinishGame =
    isHost && isPlaying;

  const canLeaveTable =
    !isHost
    && (
      table.status
        === TABLE_STATUS.LOBBY
      || table.status
        === TABLE_STATUS.PLAYING
    );

  const canDeleteFinishedTable =
    isHost && isFinished;

  const failedCoordinates =
    Array.isArray(
      participant.failedCoordinates,
    )
      ? participant
        .failedCoordinates
      : [];

  const finishedContent =
    getFinishedContent(
      table.finishReason,
    );

  const isConfirmingLeave =
    confirmationAction
      === 'leave';

  const isConfirmingFinish =
    confirmationAction
      === 'finish';

  const isConfirmingCleanup =
    confirmationAction
      === 'cleanup';

  const isAnyOperationRunning =
    isLeaving
    || isFinishingGame
    || isDeletingTable;

  const remoteActionsDisabled =
    isAnyOperationRunning
    || !isOnline;

  const closeActionConfirmation =
    () => {
      if (isAnyOperationRunning) {
        return;
      }

      setConfirmationAction('');
    };

    const openLeaveConfirmation =
    () => {
      if (
        !canLeaveTable
        || isAnyOperationRunning
      ) {
        return;
      }

      if (!isOnline) {
        setLeaveError(
          'Necesitás conexión a internet para abandonar la mesa.',
        );

        return;
      }

      setLeaveError('');
      setFinishGameError('');
      setDeleteTableError('');

      setConfirmationAction(
        'leave',
      );
    };

    const openFinishConfirmation =
    () => {
      if (
        !canFinishGame
        || isAnyOperationRunning
      ) {
        return;
      }

      if (!isOnline) {
        setFinishGameError(
          'Necesitás conexión a internet para finalizar la partida.',
        );

        return;
      }

      setFinishGameError('');
      setLeaveError('');
      setDeleteTableError('');

      setConfirmationAction(
        'finish',
      );
    };

    const openCleanupConfirmation =
    () => {
      if (
        !canDeleteFinishedTable
        || isAnyOperationRunning
      ) {
        return;
      }

      if (!isOnline) {
        setDeleteTableError(
          'Necesitás conexión a internet para eliminar los datos de la partida.',
        );

        return;
      }

      setDeleteTableError('');
      setLeaveError('');
      setFinishGameError('');

      setConfirmationAction(
        'cleanup',
      );
    };

  const handleConfirmLeave =
    async () => {
      if (
        !canLeaveTable
        || isAnyOperationRunning
      ) {
        return;
      }

      if (!isOnline) {
        setLeaveError(
          'Necesitás conexión a internet para abandonar la mesa.',
        );

        setConfirmationAction('');

        return;
      }

      setLeaveError('');
      setFinishGameError('');
      setDeleteTableError('');
      setIsLeaving(true);

      try {
        await leaveTable({
          tableCode:
            normalizedTableCode,
          uid: user.uid,
        });

        setConfirmationAction('');

        navigate('/', {
          replace: true,
        });
      } catch (leaveTableError) {
        console.error(
          'Error al abandonar la mesa:',
          leaveTableError,
        );

        setLeaveError(
          leaveTableError
            instanceof Error
            ? leaveTableError.message
            : 'No se pudo abandonar la mesa.',
        );

        setIsLeaving(false);
      }
    };

const handleConfirmFinish =
  async () => {
    if (
      !canFinishGame
      || isAnyOperationRunning
    ) {
      return;
    }

    if (!isOnline) {
      setFinishGameError(
        'Necesitás conexión a internet para finalizar la partida.',
      );

      setConfirmationAction('');

      return;
    }

    setFinishGameError('');
    setLeaveError('');
    setDeleteTableError('');
    setIsFinishingGame(true);

    try {
      await finishGameManually({
        tableCode:
          normalizedTableCode,
        uid: user.uid,
      });

      setConfirmationAction('');
    } catch (finishError) {
      console.error(
        'Error al finalizar la partida:',
        finishError,
      );

      setFinishGameError(
        finishError instanceof Error
          ? finishError.message
          : 'No se pudo finalizar la partida.',
      );
    } finally {
      setIsFinishingGame(false);
    }
  };

  const handleConfirmCleanup =
    async () => {
      if (
        !canDeleteFinishedTable
        || isAnyOperationRunning
      ) {
        return;
      }

      if (!isOnline) {
        setDeleteTableError(
          'Necesitás conexión a internet para eliminar los datos de la partida.',
        );

        setConfirmationAction('');

        return;
      }

      setDeleteTableError('');
      setLeaveError('');
      setFinishGameError('');
      setIsDeletingTable(true);

      try {
        await deleteFinishedTable({
          tableCode:
            normalizedTableCode,
          hostUid: user.uid,
        });

        setConfirmationAction('');

        navigate('/', {
          replace: true,
        });
      } catch (deleteError) {
        console.error(
          'Error al eliminar la partida:',
          deleteError,
        );

        setDeleteTableError(
          deleteError instanceof Error
            ? deleteError.message
            : 'No se pudieron eliminar los datos de la partida.',
        );

        setIsDeletingTable(false);
      }
    };

  return (
    <>
      <main className={styles.page}>
        <section className={styles.room}>
          <header className={styles.header}>
            <div>
              <p
                className={
                  styles.eyebrow
                }
              >
                {getTableStatusLabel(
                  table.status,
                )}
              </p>

              <h1
                className={
                  styles.code
                }
              >
                {
                  normalizedTableCode
                }
              </h1>
            </div>

            <div
              className={
                styles.identity
              }
            >
              <span
                className={
                  styles.identityLabel
                }
              >
                Estás jugando como
              </span>

              <strong>
                {participant.nickname}
              </strong>

              {isHost && (
                <span
                  className={
                    styles.hostBadge
                  }
                >
                  Anfitrión
                </span>
              )}
            </div>
          </header>

          {shouldShowGame && (
            <>
              {isPlaying && (
                <PlayerCoordinateCard
                  tableCode={
                    normalizedTableCode
                  }
                  uid={user.uid}
                  currentCoordinate={
                    participant
                      .currentCoordinate
                  }
                />
              )}

              {isFinished && (
                <section
                  className={
                    styles.finishedPanel
                  }
                >
                  <p
                    className={
                      styles.finishedEyebrow
                    }
                  >
                    Partida finalizada
                  </p>

                  <h2
                    className={
                      styles.finishedTitle
                    }
                  >
                    {
                      finishedContent.title
                    }
                  </h2>

                  <p
                    className={
                      styles.finishedDescription
                    }
                  >
                    {
                      finishedContent.description
                    }
                  </p>
                </section>
              )}

              <FailedCoordinatesPanel
                failedCoordinates={
                  failedCoordinates
                }
              />

              <GameBoard
                tableCode={
                  normalizedTableCode
                }
              />
            </>
          )}

          <section
            className={
              styles.playersPanel
            }
            aria-labelledby="players-title"
          >
            <div
              className={
                styles.sectionHeader
              }
            >
              <div>
                <p
                  className={
                    styles.sectionEyebrow
                  }
                >
                  {shouldShowGame
                    ? 'Participantes'
                    : 'Sala de espera'}
                </p>

                <h2
                  id="players-title"
                  className={
                    styles.sectionTitle
                  }
                >
                  Jugadores
                </h2>
              </div>

              <span
                className={
                  styles.playerCount
                }
              >
                {activePlayers.length}
              </span>
            </div>

            <ul
              className={
                styles.playerList
              }
            >
              {activePlayers.map(
                (player) => {
                  const playerIsHost =
                    player.role
                      === PARTICIPANT_ROLE.HOST;

                  const isCurrentUser =
                    player.uid
                      === user.uid;

                  return (
                    <li
                      key={player.uid}
                      className={
                        styles.player
                      }
                    >
                      <div
                        className={
                          styles.playerMain
                        }
                      >
                        <span
                          className={
                            styles.playerName
                          }
                        >
                          {
                            player.nickname
                          }
                        </span>

                        {isCurrentUser && (
                          <span
                            className={
                              styles.youLabel
                            }
                          >
                            Vos
                          </span>
                        )}
                      </div>

                      {playerIsHost && (
                        <span
                          className={
                            styles.hostBadge
                          }
                        >
                          Anfitrión
                        </span>
                      )}
                    </li>
                  );
                },
              )}
            </ul>
          </section>

          {isHost && isPlaying && (
            <PendingJoinRequestsPanel
              tableCode={
                normalizedTableCode
              }
              hostUid={user.uid}
              pendingJoinRequests={
                pendingJoinRequests
              }
              isLoading={
                arePendingJoinRequestsLoading
              }
              error={
                pendingJoinRequestsError
              }
              isOnline={isOnline}
            />
          )}

          {leaveError && (
            <p
              className={
                styles.leaveError
              }
              role="alert"
            >
              {leaveError}
            </p>
          )}

          {finishGameError && (
            <p
              className={
                styles.finishGameError
              }
              role="alert"
            >
              {finishGameError}
            </p>
          )}

          {deleteTableError && (
            <p
              className={
                styles.finishGameError
              }
              role="alert"
            >
              {deleteTableError}
            </p>
          )}

          <footer
            className={
              styles.footer
            }
          >
            <p
              className={
                styles.footerMessage
              }
            >
              {!isOnline
                ? 'Sin conexión: podés consultar la mesa, pero no realizar cambios.'
                : isFinished
                  ? finishedContent.footer
                  : isPlaying
                    ? 'Da tu pista verbalmente cuando estés listo.'
                    : isHost
                      ? 'Cuando todos hayan ingresado, prepará las palabras del tablero.'
                      : 'Esperá a que el anfitrión prepare la partida.'}
            </p>

            <div
              className={
                styles.footerActions
              }
            >
              {canPrepareTable && (
                <Link
                  to={`/mesa/${normalizedTableCode}/preparar`}
                  className="button button--primary"
                  aria-disabled={
                    !isOnline
                    || isAnyOperationRunning
                  }
                  onClick={(event) => {
                    if (
                      !isOnline
                      || isAnyOperationRunning
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  Preparar tablero
                </Link>
              )}

              {canFinishGame && (
                <button
                  type="button"
                  className={
                    styles.finishGameButton
                  }
                  onClick={
                    openFinishConfirmation
                  }
                  disabled={
                    remoteActionsDisabled
                  }
                >
                  <FiFlag
                    aria-hidden="true"
                  />

                  {isFinishingGame
                    ? 'Finalizando…'
                    : 'Finalizar partida'}
                </button>
              )}

              {canLeaveTable && (
                <button
                  type="button"
                  className={
                    styles.leaveButton
                  }
                  onClick={
                    openLeaveConfirmation
                  }
                  disabled={
                    remoteActionsDisabled
                  }
                >
                  <FiLogOut
                    aria-hidden="true"
                  />

                  {isLeaving
                    ? 'Abandonando…'
                    : 'Abandonar mesa'}
                </button>
              )}

              {canDeleteFinishedTable && (
                <>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={
                      openCleanupConfirmation
                    }
                    disabled={
                      remoteActionsDisabled
                    }
                  >
                    <FiTrash2
                      aria-hidden="true"
                    />

                    {isDeletingTable
                      ? 'Limpiando datos…'
                      : 'Limpiar datos y volver al inicio'}
                  </button>

                  <Link
                    to="/"
                    className="button button--secondary"
                    aria-disabled={
                      isAnyOperationRunning
                    }
                    onClick={(event) => {
                      if (
                        isAnyOperationRunning
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    Volver al inicio y mantener historial
                  </Link>
                </>
              )}

              {isFinished
                && !isHost && (
                <Link
                  to="/"
                  className="button button--secondary"
                >
                  Volver al inicio
                </Link>
              )}

              {table.status === TABLE_STATUS.LOBBY && (
                <Link
                  to="/"
                  className="button button--secondary"
                  aria-disabled={
                    isAnyOperationRunning
                  }
                  onClick={(event) => {
                    if (
                      isAnyOperationRunning
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  Volver al inicio
                </Link>
              )}
            </div>
          </footer>
        </section>
      </main>

      <ConfirmModal
        isOpen={
          isConfirmingLeave
        }
        title={
          isPlaying
            ? 'Abandonar la partida'
            : 'Abandonar la mesa'
        }
        description={
          isPlaying
            ? 'Tu coordenada actual volverá a quedar disponible. Tus coordenadas falladas se conservarán por si más adelante solicitás reingresar.'
            : 'Dejarás de figurar como jugador activo en esta mesa.'
        }
        confirmLabel={
          isPlaying
            ? 'Abandonar partida'
            : 'Abandonar mesa'
        }
        processingLabel="Abandonando…"
        tone={
          CONFIRM_MODAL_TONES.WARNING
        }
        isProcessing={isLeaving}
        onConfirm={
          handleConfirmLeave
        }
        onCancel={
          closeActionConfirmation
        }
      />

      <ConfirmModal
        isOpen={
          isConfirmingFinish
        }
        title="Finalizar la partida"
        description="Quedarán coordenadas sin procesar y esta acción no se puede deshacer. Todos los jugadores verán la partida como finalizada."
        confirmLabel="Finalizar partida"
        processingLabel="Finalizando…"
        tone={
          CONFIRM_MODAL_TONES.DANGER
        }
        isProcessing={
          isFinishingGame
        }
        onConfirm={
          handleConfirmFinish
        }
        onCancel={
          closeActionConfirmation
        }
      />

      <ConfirmModal
        isOpen={
          isConfirmingCleanup
        }
        title="Limpiar los datos de la partida"
        description="Se eliminarán definitivamente el tablero, los jugadores, las solicitudes y todos los datos de esta mesa. Esta acción no se puede deshacer."
        confirmLabel="Limpiar datos y volver al inicio"
        processingLabel="Limpiando datos…"
        tone={
          CONFIRM_MODAL_TONES.DANGER
        }
        isProcessing={
          isDeletingTable
        }
        onConfirm={
          handleConfirmCleanup
        }
        onCancel={
          closeActionConfirmation
        }
      />
    </>
  );
}

export default TablePage;