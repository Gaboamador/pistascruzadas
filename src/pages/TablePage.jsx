import { Link, useParams } from 'react-router';

import FailedCoordinatesPanel from '@/components/FailedCoordinatesPanel';
import GameBoard from '@/components/GameBoard';
import PlayerCoordinateCard from '@/components/PlayerCoordinateCard';
import {
  PARTICIPANT_ROLE,
  PARTICIPANT_STATUS,
  TABLE_STATUS,
} from '@/constants/table';
import useTableRoom from '@/hooks/useTableRoom';

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

function StatusContent({
  eyebrow,
  title,
  description,
  children = null,
  role,
}) {
  return (
    <main className={styles.page}>
      <section className={styles.content} role={role}>
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

function TablePage({ user }) {
  const { tableCode = '' } = useParams();

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
    tableCode: normalizedTableCode,
    uid: user.uid,
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
        description="Revisá tu conexión e intentá recargar la página."
        role="alert"
      >
        <button
          type="button"
          className="button button--primary"
          onClick={() =>
            window.location.reload()
          }
        >
          Reintentar
        </button>
      </StatusContent>
    );
  }

  if (!tableExists || !table) {
    return (
      <StatusContent
        eyebrow="Mesa inexistente"
        title={normalizedTableCode}
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
        title={normalizedTableCode}
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

  const activePlayers = players.filter(
    (player) =>
      player.status
      === PARTICIPANT_STATUS.ACTIVE,
  );

  const isHost =
    participant.role
      === PARTICIPANT_ROLE.HOST
    && table.hostUid === user.uid;

  const isPlaying =
    table.status === TABLE_STATUS.PLAYING;

  const canPrepareTable =
    isHost
    && table.status === TABLE_STATUS.LOBBY;

  const failedCoordinates = Array.isArray(
    participant.failedCoordinates,
  )
    ? participant.failedCoordinates
    : [];

  return (
    <main className={styles.page}>
      <section className={styles.room}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              {getTableStatusLabel(
                table.status,
              )}
            </p>

            <h1 className={styles.code}>
              {normalizedTableCode}
            </h1>
          </div>

          <div className={styles.identity}>
            <span
              className={styles.identityLabel}
            >
              Estás jugando como
            </span>

            <strong>
              {participant.nickname}
            </strong>

            {isHost && (
              <span
                className={styles.hostBadge}
              >
                Anfitrión
              </span>
            )}
          </div>
        </header>

        {isPlaying && (
          <>
            <PlayerCoordinateCard
              tableCode={
                normalizedTableCode
              }
              uid={user.uid}
              currentCoordinate={
                participant.currentCoordinate
              }
            />

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
          className={styles.playersPanel}
          aria-labelledby="players-title"
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
                {isPlaying
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
              className={styles.playerCount}
            >
              {activePlayers.length}
            </span>
          </div>

          <ul className={styles.playerList}>
            {activePlayers.map((player) => {
              const playerIsHost =
                player.role
                === PARTICIPANT_ROLE.HOST;

              const isCurrentUser =
                player.uid === user.uid;

              return (
                <li
                  key={player.uid}
                  className={styles.player}
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
                      {player.nickname}
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
            })}
          </ul>
        </section>

        <footer className={styles.footer}>
          <p
            className={styles.footerMessage}
          >
            {isPlaying
              ? 'Da tu pista verbalmente cuando estés listo.'
              : isHost
                ? 'Cuando todos hayan ingresado, prepará las palabras del tablero.'
                : 'Esperá a que el anfitrión prepare la partida.'}
          </p>

          <div
            className={styles.footerActions}
          >
            {canPrepareTable && (
              <Link
                to={`/mesa/${normalizedTableCode}/preparar`}
                className="button button--primary"
              >
                Preparar tablero
              </Link>
            )}

            <Link
              to="/"
              className="button button--secondary"
            >
              Volver al inicio
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default TablePage;