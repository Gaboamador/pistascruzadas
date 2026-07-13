import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import {
  PARTICIPANT_STATUS,
  TABLE_STATUS,
} from '@/constants/table';
import { db } from '@/services/firebase/firebase';

function getColumnLabel(index) {
  return String.fromCharCode(65 + index);
}

function generateCoordinates(gridSize) {
  const coordinates = [];

  for (let rowIndex = 0; rowIndex < gridSize; rowIndex += 1) {
    for (
      let columnIndex = 0;
      columnIndex < gridSize;
      columnIndex += 1
    ) {
      coordinates.push(
        `${getColumnLabel(columnIndex)}${rowIndex + 1}`,
      );
    }
  }

  return coordinates;
}

function shuffleItems(items) {
  const shuffledItems = [...items];

  for (
    let currentIndex = shuffledItems.length - 1;
    currentIndex > 0;
    currentIndex -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (currentIndex + 1),
    );

    [
      shuffledItems[currentIndex],
      shuffledItems[randomIndex],
    ] = [
      shuffledItems[randomIndex],
      shuffledItems[currentIndex],
    ];
  }

  return shuffledItems;
}

function validateBoardPreparation(boardData, gridSize) {
  const isValid =
    boardData
    && boardData.gridSize === gridSize
    && Array.isArray(boardData.columnWords)
    && Array.isArray(boardData.rowWords)
    && boardData.columnWords.length === gridSize
    && boardData.rowWords.length === gridSize;

  if (!isValid) {
    throw new Error(
      'La preparación del tablero no coincide con la grilla actual.',
    );
  }
}

async function startGame({
  tableCode,
  uid,
  activePlayerUids,
}) {
  if (!uid) {
    throw new Error('No hay un usuario autenticado.');
  }

  const uniquePlayerUids = Array.from(
    new Set(activePlayerUids),
  );

  if (uniquePlayerUids.length === 0) {
    throw new Error(
      'La partida necesita al menos un jugador activo.',
    );
  }

  if (!uniquePlayerUids.includes(uid)) {
    throw new Error(
      'El anfitrión no figura entre los jugadores activos.',
    );
  }

  const tableReference = doc(db, 'tables', tableCode);

  const setupBoardReference = doc(
    db,
    'tables',
    tableCode,
    'setup',
    'board',
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
    const tableSnapshot = await transaction.get(tableReference);

    if (!tableSnapshot.exists()) {
      throw new Error('La mesa no existe.');
    }

    const tableData = tableSnapshot.data();

    if (tableData.hostUid !== uid) {
      throw new Error(
        'Solamente el anfitrión puede iniciar la partida.',
      );
    }

    if (tableData.status !== TABLE_STATUS.LOBBY) {
      throw new Error(
        'La partida ya fue iniciada o finalizada.',
      );
    }

    const boardSnapshot = await transaction.get(
      setupBoardReference,
    );

    if (!boardSnapshot.exists()) {
      throw new Error(
        'Todavía no se prepararon las palabras del tablero.',
      );
    }

    const boardData = boardSnapshot.data();

    validateBoardPreparation(
      boardData,
      tableData.gridSize,
    );

    const participantReferences = uniquePlayerUids.map(
      (playerUid) =>
        doc(
          db,
          'tables',
          tableCode,
          'participants',
          playerUid,
        ),
    );

    const participantSnapshots = [];

    for (const participantReference of participantReferences) {
      const participantSnapshot = await transaction.get(
        participantReference,
      );

      participantSnapshots.push(participantSnapshot);
    }

    const activeParticipants = participantSnapshots.map(
      (participantSnapshot, index) => {
        if (!participantSnapshot.exists()) {
          throw new Error(
            'Uno de los jugadores ya no pertenece a la mesa.',
          );
        }

        const participantData = participantSnapshot.data();

        if (
          participantData.status
          !== PARTICIPANT_STATUS.ACTIVE
        ) {
          throw new Error(
            'Uno de los jugadores ya no está activo.',
          );
        }

        if (participantData.currentCoordinate !== null) {
          throw new Error(
            'Uno de los jugadores ya tiene una coordenada asignada.',
          );
        }

        return {
          uid: uniquePlayerUids[index],
          reference: participantReferences[index],
        };
      },
    );

    const shuffledCoordinates = shuffleItems(
      generateCoordinates(tableData.gridSize),
    );

    if (
      activeParticipants.length
      > shuffledCoordinates.length
    ) {
      throw new Error(
        `Hay ${activeParticipants.length} jugadores activos, pero la grilla sólo tiene ${shuffledCoordinates.length} coordenadas.`,
      );
    }

    const assignedCoordinates = shuffledCoordinates.slice(
      0,
      activeParticipants.length,
    );

    const availableCoordinates = shuffledCoordinates.slice(
      activeParticipants.length,
    );

    activeParticipants.forEach(
      (participant, participantIndex) => {
        transaction.update(participant.reference, {
          currentCoordinate:
            assignedCoordinates[participantIndex],
        });
      },
    );

    transaction.set(gameBoardReference, {
      gridSize: tableData.gridSize,
      columnWords: boardData.columnWords,
      rowWords: boardData.rowWords,
      revealedCoordinates: [],
      startedAt: serverTimestamp(),
    });

    transaction.set(gameStateReference, {
      gridSize: tableData.gridSize,
      availableCoordinates,
      discardedCoordinates: [],
      startedAt: serverTimestamp(),
    });

    transaction.update(tableReference, {
      status: TABLE_STATUS.PLAYING,
      startedAt: serverTimestamp(),
    });
  });
}

export {
  generateCoordinates,
  startGame,
};