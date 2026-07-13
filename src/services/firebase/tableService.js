import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import {
  PARTICIPANT_ROLE,
  PARTICIPANT_STATUS,
  TABLE_CODE_CHARACTERS,
  TABLE_CODE_GENERATION_MAX_ATTEMPTS,
  TABLE_CODE_LENGTH,
  TABLE_STATUS,
} from '@/constants/table';
import { db } from '@/services/firebase/firebase';

const JOIN_TABLE_ERROR_CODES = {
  TABLE_NOT_FOUND: 'table-not-found',
  TABLE_ALREADY_STARTED: 'table-already-started',
  TABLE_FINISHED: 'table-finished',
};

class JoinTableError extends Error {
  constructor(code, message) {
    super(message);

    this.name = 'JoinTableError';
    this.code = code;
  }
}

function generateTableCode() {
  let code = '';

  for (let index = 0; index < TABLE_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(
      Math.random() * TABLE_CODE_CHARACTERS.length,
    );

    code += TABLE_CODE_CHARACTERS[randomIndex];
  }

  return code;
}

function getParticipantData({
  uid,
  nickname,
  role,
  joinedAt,
}) {
  return {
    uid,
    nickname,
    role,
    status: PARTICIPANT_STATUS.ACTIVE,
    currentCoordinate: null,
    failedCoordinates: [],
    joinedAt,
  };
}

function getPublicPlayerData({
  uid,
  nickname,
  role,
  joinedAt,
}) {
  return {
    uid,
    nickname,
    role,
    status: PARTICIPANT_STATUS.ACTIVE,
    joinedAt,
  };
}

async function createTable({ uid, nickname, gridSize }) {
  if (!uid) {
    throw new Error('No hay un usuario autenticado.');
  }

  for (
    let attempt = 1;
    attempt <= TABLE_CODE_GENERATION_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const tableCode = generateTableCode();

    const tableReference = doc(db, 'tables', tableCode);

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

    const wasCreated = await runTransaction(
      db,
      async (transaction) => {
        const tableSnapshot = await transaction.get(tableReference);

        if (tableSnapshot.exists()) {
          return false;
        }

        const joinedAt = serverTimestamp();

        transaction.set(tableReference, {
          code: tableCode,
          gridSize,
          hostUid: uid,
          status: TABLE_STATUS.LOBBY,
          createdAt: serverTimestamp(),
        });

        transaction.set(
          participantReference,
          getParticipantData({
            uid,
            nickname,
            role: PARTICIPANT_ROLE.HOST,
            joinedAt,
          }),
        );

        transaction.set(
          playerReference,
          getPublicPlayerData({
            uid,
            nickname,
            role: PARTICIPANT_ROLE.HOST,
            joinedAt,
          }),
        );

        return true;
      },
    );

    if (wasCreated) {
      return {
        tableCode,
      };
    }
  }

  throw new Error(
    'No se pudo generar un código de mesa disponible.',
  );
}

async function joinTable({ uid, nickname, tableCode }) {
  if (!uid) {
    throw new Error('No hay un usuario autenticado.');
  }

  const tableReference = doc(db, 'tables', tableCode);

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

  return runTransaction(db, async (transaction) => {
    const tableSnapshot = await transaction.get(tableReference);

    if (!tableSnapshot.exists()) {
      throw new JoinTableError(
        JOIN_TABLE_ERROR_CODES.TABLE_NOT_FOUND,
        'La mesa no existe.',
      );
    }

    const tableData = tableSnapshot.data();

    if (tableData.status === TABLE_STATUS.FINISHED) {
      throw new JoinTableError(
        JOIN_TABLE_ERROR_CODES.TABLE_FINISHED,
        'La partida ya terminó.',
      );
    }

    if (tableData.status !== TABLE_STATUS.LOBBY) {
      throw new JoinTableError(
        JOIN_TABLE_ERROR_CODES.TABLE_ALREADY_STARTED,
        'La partida ya comenzó.',
      );
    }

    const participantSnapshot = await transaction.get(
      participantReference,
    );

    const playerSnapshot = await transaction.get(playerReference);

    if (participantSnapshot.exists()) {
      const participantData = participantSnapshot.data();

      if (participantData.status === PARTICIPANT_STATUS.LEFT) {
        transaction.update(participantReference, {
          nickname,
          status: PARTICIPANT_STATUS.ACTIVE,
        });

        if (playerSnapshot.exists()) {
          transaction.update(playerReference, {
            nickname,
            status: PARTICIPANT_STATUS.ACTIVE,
          });
        } else {
          transaction.set(
            playerReference,
            getPublicPlayerData({
              uid,
              nickname,
              role: participantData.role,
              joinedAt:
                participantData.joinedAt ?? serverTimestamp(),
            }),
          );
        }

        return {
          tableCode,
          participantRole: participantData.role,
          wasReactivated: true,
        };
      }

      if (!playerSnapshot.exists()) {
        transaction.set(
          playerReference,
          getPublicPlayerData({
            uid,
            nickname: participantData.nickname,
            role: participantData.role,
            joinedAt:
              participantData.joinedAt ?? serverTimestamp(),
          }),
        );
      }

      return {
        tableCode,
        participantRole: participantData.role,
        wasReactivated: false,
      };
    }

    const joinedAt = serverTimestamp();

    transaction.set(
      participantReference,
      getParticipantData({
        uid,
        nickname,
        role: PARTICIPANT_ROLE.PLAYER,
        joinedAt,
      }),
    );

    transaction.set(
      playerReference,
      getPublicPlayerData({
        uid,
        nickname,
        role: PARTICIPANT_ROLE.PLAYER,
        joinedAt,
      }),
    );

    return {
      tableCode,
      participantRole: PARTICIPANT_ROLE.PLAYER,
      wasReactivated: false,
    };
  });
}

async function updateTableGridSize({
  tableCode,
  uid,
  gridSize,
}) {
  if (!uid) {
    throw new Error('No hay un usuario autenticado.');
  }

  const tableReference = doc(db, 'tables', tableCode);

  await runTransaction(db, async (transaction) => {
    const tableSnapshot = await transaction.get(tableReference);

    if (!tableSnapshot.exists()) {
      throw new Error('La mesa no existe.');
    }

    const tableData = tableSnapshot.data();

    if (tableData.hostUid !== uid) {
      throw new Error(
        'Solamente el anfitrión puede cambiar la grilla.',
      );
    }

    if (tableData.status !== TABLE_STATUS.LOBBY) {
      throw new Error(
        'La grilla sólo puede cambiarse antes de iniciar la partida.',
      );
    }

    if (tableData.gridSize === gridSize) {
      return;
    }

    transaction.update(tableReference, {
      gridSize,
    });
  });
}

export {
  JOIN_TABLE_ERROR_CODES,
  JoinTableError,
  createTable,
  joinTable,
  updateTableGridSize,
};