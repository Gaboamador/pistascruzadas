import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import { TABLE_STATUS } from '@/constants/table';
import { db } from '@/services/firebase/firebase';
import { generateBoardWords } from '@/utils/words';

function getBoardReference(tableCode) {
  return doc(
    db,
    'tables',
    tableCode,
    'setup',
    'board',
  );
}

function isValidBoardPreparation(boardData, gridSize) {
  return Boolean(
    boardData
      && boardData.gridSize === gridSize
      && Array.isArray(boardData.columnWords)
      && Array.isArray(boardData.rowWords)
      && boardData.columnWords.length === gridSize
      && boardData.rowWords.length === gridSize,
  );
}

function validateHostTable({
  tableSnapshot,
  uid,
  expectedGridSize,
}) {
  if (!tableSnapshot.exists()) {
    throw new Error('La mesa no existe.');
  }

  const tableData = tableSnapshot.data();

  if (tableData.hostUid !== uid) {
    throw new Error(
      'Solamente el anfitrión puede preparar el tablero.',
    );
  }

  if (tableData.status !== TABLE_STATUS.LOBBY) {
    throw new Error(
      'El tablero sólo puede prepararse antes de iniciar la partida.',
    );
  }

  if (tableData.gridSize !== expectedGridSize) {
    throw new Error(
      'El tamaño de la grilla cambió durante la operación.',
    );
  }
}

async function ensureBoardPreparation({
  tableCode,
  uid,
  gridSize,
}) {
  const tableReference = doc(db, 'tables', tableCode);
  const boardReference = getBoardReference(tableCode);

  return runTransaction(db, async (transaction) => {
    const tableSnapshot = await transaction.get(tableReference);
    const boardSnapshot = await transaction.get(boardReference);

    validateHostTable({
      tableSnapshot,
      uid,
      expectedGridSize: gridSize,
    });

    if (
      boardSnapshot.exists()
      && isValidBoardPreparation(
        boardSnapshot.data(),
        gridSize,
      )
    ) {
      const boardData = boardSnapshot.data();

      return {
        columnWords: boardData.columnWords,
        rowWords: boardData.rowWords,
      };
    }

    const boardWords = generateBoardWords(gridSize);

    transaction.set(boardReference, {
      gridSize,
      columnWords: boardWords.columnWords,
      rowWords: boardWords.rowWords,
      updatedAt: serverTimestamp(),
    });

    return boardWords;
  });
}

async function saveBoardPreparation({
  tableCode,
  uid,
  gridSize,
  boardWords,
}) {
  const tableReference = doc(db, 'tables', tableCode);
  const boardReference = getBoardReference(tableCode);

  await runTransaction(db, async (transaction) => {
    const tableSnapshot = await transaction.get(tableReference);

    validateHostTable({
      tableSnapshot,
      uid,
      expectedGridSize: gridSize,
    });

    transaction.set(boardReference, {
      gridSize,
      columnWords: boardWords.columnWords,
      rowWords: boardWords.rowWords,
      updatedAt: serverTimestamp(),
    });
  });
}

function subscribeToBoardPreparation({
  tableCode,
  gridSize,
  onBoardChanged,
  onError,
}) {
  const boardReference = getBoardReference(tableCode);

  return onSnapshot(
    boardReference,
    (snapshot) => {
      if (!snapshot.exists()) {
        onBoardChanged(null);
        return;
      }

      const boardData = snapshot.data();

      if (!isValidBoardPreparation(boardData, gridSize)) {
        onBoardChanged(null);
        return;
      }

      onBoardChanged({
        columnWords: boardData.columnWords,
        rowWords: boardData.rowWords,
      });
    },
    onError,
  );
}

export {
  ensureBoardPreparation,
  saveBoardPreparation,
  subscribeToBoardPreparation,
};