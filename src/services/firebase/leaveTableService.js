import {
  doc,
  runTransaction,
} from 'firebase/firestore';

import {
  PARTICIPANT_ROLE,
  PARTICIPANT_STATUS,
  TABLE_STATUS,
} from '@/constants/table';
import { db } from '@/services/firebase/firebase';

async function leaveTable({
  tableCode,
  uid,
}) {
  if (!tableCode || !uid) {
    throw new Error(
      'Faltan datos para abandonar la mesa.',
    );
  }

  const tableReference = doc(
    db,
    'tables',
    tableCode,
  );

  const participantReference = doc(
    db,
    'tables',
    tableCode,
    'participants',
    uid,
  );

  const playerReference = doc(
    db,
    'tables',
    tableCode,
    'players',
    uid,
  );

  const gameStateReference = doc(
    db,
    'tables',
    tableCode,
    'game',
    'state',
  );

  await runTransaction(db, async (transaction) => {
    const [
      tableSnapshot,
      participantSnapshot,
      playerSnapshot,
    ] = await Promise.all([
      transaction.get(tableReference),
      transaction.get(participantReference),
      transaction.get(playerReference),
    ]);

    if (!tableSnapshot.exists()) {
      throw new Error('La mesa no existe.');
    }

    if (!participantSnapshot.exists()) {
      throw new Error(
        'No encontramos tu participación en la mesa.',
      );
    }

    if (!playerSnapshot.exists()) {
      throw new Error(
        'No encontramos tu registro público en la mesa.',
      );
    }

    const tableData = tableSnapshot.data();
    const participantData =
      participantSnapshot.data();

    if (
      participantData.status
      !== PARTICIPANT_STATUS.ACTIVE
    ) {
      throw new Error(
        'Ya no figurás como jugador activo.',
      );
    }

    if (
      participantData.role
        === PARTICIPANT_ROLE.HOST
      || tableData.hostUid === uid
    ) {
      throw new Error(
        'El anfitrión no puede abandonar sin transferir antes el control de la mesa.',
      );
    }

    if (
      tableData.status !== TABLE_STATUS.LOBBY
      && tableData.status !== TABLE_STATUS.PLAYING
      && tableData.status !== TABLE_STATUS.FINISHED
    ) {
      throw new Error(
        'No se puede salir de la mesa en su estado actual.',
      );
    }

    const currentCoordinate =
      participantData.currentCoordinate;

    let stateSnapshot = null;

    if (
      tableData.status === TABLE_STATUS.PLAYING
      && currentCoordinate
    ) {
      stateSnapshot = await transaction.get(
        gameStateReference,
      );

      if (!stateSnapshot.exists()) {
        throw new Error(
          'No encontramos el estado de la partida.',
        );
      }

      const stateData = stateSnapshot.data();

      const availableCoordinates = Array.isArray(
        stateData.availableCoordinates,
      )
        ? stateData.availableCoordinates
        : [];

      const discardedCoordinates = Array.isArray(
        stateData.discardedCoordinates,
      )
        ? stateData.discardedCoordinates
        : [];

      if (
        availableCoordinates.includes(
          currentCoordinate,
        )
        || discardedCoordinates.includes(
          currentCoordinate,
        )
      ) {
        throw new Error(
          'La coordenada actual ya figura procesada o disponible.',
        );
      }

      transaction.update(gameStateReference, {
        availableCoordinates: [
          ...availableCoordinates,
          currentCoordinate,
        ],
      });
    }

    transaction.update(participantReference, {
      status: PARTICIPANT_STATUS.LEFT,
      currentCoordinate: null,
    });

    transaction.update(playerReference, {
      status: PARTICIPANT_STATUS.LEFT,
    });
  });
}

export { leaveTable };
