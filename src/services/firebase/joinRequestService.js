import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import {
  JOIN_REQUEST_STATUS,
  JOIN_REQUEST_TYPE,
  PARTICIPANT_ROLE,
  PARTICIPANT_STATUS,
  TABLE_STATUS,
} from '@/constants/table';
import { db } from '@/services/firebase/firebase';

function getRequestedAtMillis(
  joinRequest,
) {
  const requestedAt =
    joinRequest.requestedAt;

  if (
    requestedAt
    && typeof requestedAt.toMillis
      === 'function'
  ) {
    return requestedAt.toMillis();
  }

  return 0;
}

function subscribeToOwnJoinRequest({
  tableCode,
  uid,
  onJoinRequestChanged,
  onError,
}) {
  const joinRequestReference = doc(
    db,
    'tables',
    tableCode,
    'joinRequests',
    uid,
  );

  return onSnapshot(
    joinRequestReference,
    (snapshot) => {
      if (!snapshot.exists()) {
        onJoinRequestChanged(null);
        return;
      }

      onJoinRequestChanged({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    onError,
  );
}

function subscribeToPendingJoinRequests({
  tableCode,
  onJoinRequestsChanged,
  onError,
}) {
  const joinRequestsReference =
    collection(
      db,
      'tables',
      tableCode,
      'joinRequests',
    );

  const pendingJoinRequestsQuery =
    query(
      joinRequestsReference,
      where(
        'status',
        '==',
        JOIN_REQUEST_STATUS.PENDING,
      ),
    );

  return onSnapshot(
    pendingJoinRequestsQuery,
    (snapshot) => {
      const pendingJoinRequests =
        snapshot.docs
          .map(
            (
              joinRequestDocument,
            ) => ({
              id:
                joinRequestDocument.id,
              ...joinRequestDocument.data(),
            }),
          )
          .sort(
            (
              firstJoinRequest,
              secondJoinRequest,
            ) =>
              getRequestedAtMillis(
                firstJoinRequest,
              )
              - getRequestedAtMillis(
                secondJoinRequest,
              ),
          );

      onJoinRequestsChanged(
        pendingJoinRequests,
      );
    },
    onError,
  );
}

function validateHost({
  tableData,
  hostParticipantData,
  hostUid,
}) {
  if (
    tableData.status
    !== TABLE_STATUS.PLAYING
  ) {
    throw new Error(
      'La partida ya no está en curso.',
    );
  }

  if (
    tableData.hostUid !== hostUid
    || hostParticipantData.role
      !== PARTICIPANT_ROLE.HOST
    || hostParticipantData.status
      !== PARTICIPANT_STATUS.ACTIVE
  ) {
    throw new Error(
      'Solamente el anfitrión activo puede resolver solicitudes.',
    );
  }
}

async function rejectJoinRequest({
  tableCode,
  hostUid,
  requestUid,
}) {
  if (
    !tableCode
    || !hostUid
    || !requestUid
  ) {
    throw new Error(
      'Faltan datos para rechazar la solicitud.',
    );
  }

  const tableReference = doc(
    db,
    'tables',
    tableCode,
  );

  const hostParticipantReference =
    doc(
      db,
      'tables',
      tableCode,
      'participants',
      hostUid,
    );

  const joinRequestReference =
    doc(
      db,
      'tables',
      tableCode,
      'joinRequests',
      requestUid,
    );

  await runTransaction(
    db,
    async (transaction) => {
      const [
        tableSnapshot,
        hostParticipantSnapshot,
        joinRequestSnapshot,
      ] = await Promise.all([
        transaction.get(
          tableReference,
        ),
        transaction.get(
          hostParticipantReference,
        ),
        transaction.get(
          joinRequestReference,
        ),
      ]);

      if (!tableSnapshot.exists()) {
        throw new Error(
          'La mesa no existe.',
        );
      }

      if (
        !hostParticipantSnapshot.exists()
      ) {
        throw new Error(
          'No encontramos la participación del anfitrión.',
        );
      }

      if (
        !joinRequestSnapshot.exists()
      ) {
        throw new Error(
          'La solicitud ya no existe.',
        );
      }

      validateHost({
        tableData:
          tableSnapshot.data(),
        hostParticipantData:
          hostParticipantSnapshot.data(),
        hostUid,
      });

      const joinRequestData =
        joinRequestSnapshot.data();

      if (
        joinRequestData.uid
          !== requestUid
        || joinRequestData.status
          !== JOIN_REQUEST_STATUS.PENDING
      ) {
        throw new Error(
          'La solicitud ya fue resuelta.',
        );
      }

      transaction.update(
        joinRequestReference,
        {
          status:
            JOIN_REQUEST_STATUS.REJECTED,
          resolvedAt:
            serverTimestamp(),
          resolvedBy: hostUid,
        },
      );
    },
  );
}

async function approveJoinRequest({
  tableCode,
  hostUid,
  requestUid,
}) {
  if (
    !tableCode
    || !hostUid
    || !requestUid
  ) {
    throw new Error(
      'Faltan datos para aprobar la solicitud.',
    );
  }

  const tableReference = doc(
    db,
    'tables',
    tableCode,
  );

  const hostParticipantReference =
    doc(
      db,
      'tables',
      tableCode,
      'participants',
      hostUid,
    );

  const joinRequestReference = doc(
    db,
    'tables',
    tableCode,
    'joinRequests',
    requestUid,
  );

  const participantReference = doc(
    db,
    'tables',
    tableCode,
    'participants',
    requestUid,
  );

  const playerReference = doc(
    db,
    'tables',
    tableCode,
    'players',
    requestUid,
  );

  const gameStateReference = doc(
    db,
    'tables',
    tableCode,
    'game',
    'state',
  );

  await runTransaction(
    db,
    async (transaction) => {
      const [
        tableSnapshot,
        hostParticipantSnapshot,
        joinRequestSnapshot,
        playerSnapshot,
        gameStateSnapshot,
      ] = await Promise.all([
        transaction.get(
          tableReference,
        ),
        transaction.get(
          hostParticipantReference,
        ),
        transaction.get(
          joinRequestReference,
        ),
        transaction.get(
          playerReference,
        ),
        transaction.get(
          gameStateReference,
        ),
      ]);

      if (!tableSnapshot.exists()) {
        throw new Error(
          'La mesa no existe.',
        );
      }

      if (
        !hostParticipantSnapshot.exists()
      ) {
        throw new Error(
          'No encontramos la participación del anfitrión.',
        );
      }

      if (
        !joinRequestSnapshot.exists()
      ) {
        throw new Error(
          'La solicitud ya no existe.',
        );
      }

      if (
        !gameStateSnapshot.exists()
      ) {
        throw new Error(
          'No encontramos el estado de la partida.',
        );
      }

      validateHost({
        tableData:
          tableSnapshot.data(),
        hostParticipantData:
          hostParticipantSnapshot.data(),
        hostUid,
      });

      const joinRequestData =
        joinRequestSnapshot.data();

      if (
        joinRequestData.uid
          !== requestUid
        || joinRequestData.status
          !== JOIN_REQUEST_STATUS.PENDING
      ) {
        throw new Error(
          'La solicitud ya fue resuelta.',
        );
      }

      const requestType =
        joinRequestData.type
        ?? JOIN_REQUEST_TYPE.JOIN;

      if (
        requestType
          === JOIN_REQUEST_TYPE.JOIN
        && playerSnapshot.exists()
      ) {
        throw new Error(
          'Este usuario ya tuvo participación en la mesa.',
        );
      }

      if (
        requestType
          === JOIN_REQUEST_TYPE.REJOIN
        && (
          !playerSnapshot.exists()
          || playerSnapshot.data().role
            !== PARTICIPANT_ROLE.PLAYER
          || playerSnapshot.data().status
            !== PARTICIPANT_STATUS.LEFT
        )
      ) {
        throw new Error(
          'El jugador ya no está en condiciones de reingresar.',
        );
      }

      if (
        requestType
          !== JOIN_REQUEST_TYPE.JOIN
        && requestType
          !== JOIN_REQUEST_TYPE.REJOIN
      ) {
        throw new Error(
          'El tipo de solicitud es inválido.',
        );
      }

      const gameStateData =
        gameStateSnapshot.data();

      const availableCoordinates =
        Array.isArray(
          gameStateData
            .availableCoordinates,
        )
          ? gameStateData
              .availableCoordinates
          : [];

      if (
        availableCoordinates.length
        === 0
      ) {
        throw new Error(
          'No quedan coordenadas disponibles para incorporar a otro jugador.',
        );
      }

      if (
        !Number.isInteger(
          gameStateData
            .remainingCoordinateCount,
        )
      ) {
        throw new Error(
          'El contador de coordenadas pendientes es inválido.',
        );
      }

      const [
        assignedCoordinate,
        ...remainingAvailableCoordinates
      ] = availableCoordinates;

      if (
        requestType
        === JOIN_REQUEST_TYPE.JOIN
      ) {
        const joinedAt =
          serverTimestamp();

        transaction.set(
          participantReference,
          {
            uid: requestUid,
            nickname:
              joinRequestData.nickname,
            role:
              PARTICIPANT_ROLE.PLAYER,
            status:
              PARTICIPANT_STATUS.ACTIVE,
            currentCoordinate:
              assignedCoordinate,
            failedCoordinates: [],
            joinedAt,
          },
        );

        transaction.set(
          playerReference,
          {
            uid: requestUid,
            nickname:
              joinRequestData.nickname,
            role:
              PARTICIPANT_ROLE.PLAYER,
            status:
              PARTICIPANT_STATUS.ACTIVE,
            joinedAt,
          },
        );
      } else {
        transaction.update(
          participantReference,
          {
            nickname:
              joinRequestData.nickname,
            status:
              PARTICIPANT_STATUS.ACTIVE,
            currentCoordinate:
              assignedCoordinate,
          },
        );

        transaction.update(
          playerReference,
          {
            nickname:
              joinRequestData.nickname,
            status:
              PARTICIPANT_STATUS.ACTIVE,
          },
        );
      }

      transaction.update(
        gameStateReference,
        {
          availableCoordinates:
            remainingAvailableCoordinates,
        },
      );

      transaction.update(
        joinRequestReference,
        {
          status:
            JOIN_REQUEST_STATUS.APPROVED,
          resolvedAt:
            serverTimestamp(),
          resolvedBy: hostUid,
        },
      );
    },
  );
}

export {
  approveJoinRequest,
  rejectJoinRequest,
  subscribeToOwnJoinRequest,
  subscribeToPendingJoinRequests,
};