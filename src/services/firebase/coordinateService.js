import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import {
  CLUE_MAX_LENGTH,
  CLUE_MIN_LENGTH,
  GAME_FINISH_REASON,
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

function normalizeClue(clue) {
  if (typeof clue !== 'string') {
    return '';
  }

  return clue
    .trim()
    .replace(/\s+/g, ' ');
}

function validateFailedClue(clue) {
  if (
    clue.length
      < CLUE_MIN_LENGTH
  ) {
    throw new Error(
      'Ingresá la pista que diste antes de marcar la coordenada como fallada.',
    );
  }

  if (
    clue.length
      > CLUE_MAX_LENGTH
  ) {
    throw new Error(
      `La pista puede tener como máximo ${CLUE_MAX_LENGTH} caracteres.`,
    );
  }
}

async function resolveCurrentCoordinate({
  tableCode,
  uid,
  result,
  clue = '',
}) {
  if (!tableCode || !uid) {
    throw new Error(
      'Faltan datos para procesar la coordenada.',
    );
  }

  validateCoordinateResult(result);

  const normalizedClue =
    normalizeClue(clue);

  if (
    result
      === COORDINATE_RESULT.FAILED
  ) {
    validateFailedClue(
      normalizedClue,
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

  await runTransaction(
    db,
    async (transaction) => {
      const [
        tableSnapshot,
        participantSnapshot,
        boardSnapshot,
        stateSnapshot,
      ] = await Promise.all([
        transaction.get(
          tableReference,
        ),
        transaction.get(
          participantReference,
        ),
        transaction.get(
          gameBoardReference,
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
        tableSnapshot.data().status
          !== TABLE_STATUS.PLAYING
      ) {
        throw new Error(
          'La partida no está actualmente en curso.',
        );
      }

      if (
        !participantSnapshot.exists()
      ) {
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

      const boardData =
        boardSnapshot.data();

      const stateData =
        stateSnapshot.data();

      const revealedCoordinates =
        Array.isArray(
          boardData
            .revealedCoordinates,
        )
          ? boardData
              .revealedCoordinates
          : [];

      const availableCoordinates =
        Array.isArray(
          stateData
            .availableCoordinates,
        )
          ? stateData
              .availableCoordinates
          : [];

      const discardedCoordinates =
        Array.isArray(
          stateData
            .discardedCoordinates,
        )
          ? stateData
              .discardedCoordinates
          : [];

      const failedCoordinates =
        Array.isArray(
          participantData
            .failedCoordinates,
        )
          ? participantData
              .failedCoordinates
          : [];

      const remainingCoordinateCount =
        stateData
          .remainingCoordinateCount;

      if (
        !Number.isInteger(
          remainingCoordinateCount,
        )
        || remainingCoordinateCount
          <= 0
      ) {
        throw new Error(
          'El contador de coordenadas pendientes es inválido.',
        );
      }

      if (
        revealedCoordinates.includes(
          currentCoordinate,
        )
        || discardedCoordinates.includes(
          currentCoordinate,
        )
      ) {
        throw new Error(
          'La coordenada actual ya había sido procesada.',
        );
      }

      const [
        nextCoordinate = null,
        ...remainingCoordinates
      ] = availableCoordinates;

      const nextRemainingCoordinateCount =
        remainingCoordinateCount - 1;

      const participantUpdate = {
        currentCoordinate:
          nextCoordinate,
      };

      if (
        result
          === COORDINATE_RESULT.CORRECT
      ) {
        transaction.update(
          gameBoardReference,
          {
            revealedCoordinates: [
              ...revealedCoordinates,
              currentCoordinate,
            ],
          },
        );
      }

      if (
        result
          === COORDINATE_RESULT.FAILED
      ) {
        participantUpdate
          .failedCoordinates = [
            ...failedCoordinates,
            {
              coordinate:
                currentCoordinate,
              clue:
                normalizedClue,
            },
          ];
      }

      transaction.update(
        participantReference,
        participantUpdate,
      );

      transaction.update(
        gameStateReference,
        {
          availableCoordinates:
            remainingCoordinates,

          discardedCoordinates:
            result
              === COORDINATE_RESULT.FAILED
              ? [
                  ...discardedCoordinates,
                  currentCoordinate,
                ]
              : discardedCoordinates,

          remainingCoordinateCount:
            nextRemainingCoordinateCount,
        },
      );

      if (
        nextRemainingCoordinateCount
          === 0
      ) {
        transaction.update(
          tableReference,
          {
            status:
              TABLE_STATUS.FINISHED,

            finishedAt:
              serverTimestamp(),

            finishReason:
              GAME_FINISH_REASON.COMPLETED,
          },
        );
      }
    },
  );
}

export {
  COORDINATE_RESULT,
  normalizeClue,
  resolveCurrentCoordinate,
};