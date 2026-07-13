import {
  doc,
  runTransaction,
} from 'firebase/firestore';

import {
  PARTICIPANT_STATUS,
  TABLE_STATUS,
} from '@/constants/table';
import { db } from '@/services/firebase/firebase';

const COORDINATE_RESULT = Object.freeze({
  CORRECT: 'correct',
  FAILED: 'failed',
});

function validateCoordinateResult(result) {
  if (
    result !== COORDINATE_RESULT.CORRECT
    && result !== COORDINATE_RESULT.FAILED
  ) {
    throw new Error(
      `Resultado de coordenada inválido: ${result}`,
    );
  }
}

async function resolveCurrentCoordinate({
  tableCode,
  uid,
  result,
}) {
  if (!tableCode || !uid) {
    throw new Error(
      'Faltan datos para procesar la coordenada.',
    );
  }

  validateCoordinateResult(result);

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

  const gameBoardReference = doc(
    db,
    'tables',
    tableCode,
    'game',
    'board',
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
      boardSnapshot,
      stateSnapshot,
    ] = await Promise.all([
      transaction.get(tableReference),
      transaction.get(participantReference),
      transaction.get(gameBoardReference),
      transaction.get(gameStateReference),
    ]);

    if (!tableSnapshot.exists()) {
      throw new Error('La mesa no existe.');
    }

    if (
      tableSnapshot.data().status
      !== TABLE_STATUS.PLAYING
    ) {
      throw new Error(
        'La partida no está actualmente en curso.',
      );
    }

    if (!participantSnapshot.exists()) {
      throw new Error(
        'No encontramos tu participación en la mesa.',
      );
    }

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

    const currentCoordinate =
      participantData.currentCoordinate;

    if (!currentCoordinate) {
      throw new Error(
        'No tenés una coordenada pendiente.',
      );
    }

    if (!boardSnapshot.exists()) {
      throw new Error(
        'No encontramos el tablero de la partida.',
      );
    }

    if (!stateSnapshot.exists()) {
      throw new Error(
        'No encontramos el estado de la partida.',
      );
    }

    const boardData = boardSnapshot.data();
    const stateData = stateSnapshot.data();

    const revealedCoordinates = Array.isArray(
      boardData.revealedCoordinates,
    )
      ? boardData.revealedCoordinates
      : [];

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

    const failedCoordinates = Array.isArray(
      participantData.failedCoordinates,
    )
      ? participantData.failedCoordinates
      : [];

    if (
      revealedCoordinates.includes(currentCoordinate)
      || discardedCoordinates.includes(currentCoordinate)
    ) {
      throw new Error(
        'La coordenada actual ya había sido procesada.',
      );
    }

    const [
      nextCoordinate = null,
      ...remainingCoordinates
    ] = availableCoordinates;

    const participantUpdate = {
      currentCoordinate: nextCoordinate,
    };

    if (result === COORDINATE_RESULT.CORRECT) {
      transaction.update(gameBoardReference, {
        revealedCoordinates: [
          ...revealedCoordinates,
          currentCoordinate,
        ],
      });
    }

    if (result === COORDINATE_RESULT.FAILED) {
      participantUpdate.failedCoordinates = [
        ...failedCoordinates,
        currentCoordinate,
      ];
    }

    transaction.update(participantReference, {
      ...participantUpdate,
    });

    transaction.update(gameStateReference, {
      availableCoordinates: remainingCoordinates,
      discardedCoordinates:
        result === COORDINATE_RESULT.FAILED
          ? [
              ...discardedCoordinates,
              currentCoordinate,
            ]
          : discardedCoordinates,
    });
  });
}

export {
  COORDINATE_RESULT,
  resolveCurrentCoordinate,
};