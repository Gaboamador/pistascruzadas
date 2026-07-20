import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

import {
  PARTICIPANT_ROLE,
  PARTICIPANT_STATUS,
  TABLE_STATUS,
} from '@/constants/table';
import { db } from '@/services/firebase/firebase';

const FIRESTORE_BATCH_WRITE_LIMIT = 500;

async function restartFinishedTable({
  tableCode,
  hostUid,
}) {
  if (!tableCode || !hostUid) {
    throw new Error(
      'Faltan datos para preparar otra partida.',
    );
  }

  const tableReference = doc(
    db,
    'tables',
    tableCode,
  );

  const hostParticipantReference = doc(
    db,
    'tables',
    tableCode,
    'participants',
    hostUid,
  );

  const participantsReference =
    collection(
      db,
      'tables',
      tableCode,
      'participants',
    );

  const joinRequestsReference =
    collection(
      db,
      'tables',
      tableCode,
      'joinRequests',
    );

  const [
    tableSnapshot,
    hostParticipantSnapshot,
    participantsSnapshot,
    joinRequestsSnapshot,
  ] = await Promise.all([
    getDoc(tableReference),
    getDoc(hostParticipantReference),
    getDocs(participantsReference),
    getDocs(joinRequestsReference),
  ]);

  if (!tableSnapshot.exists()) {
    throw new Error(
      'La mesa ya no existe.',
    );
  }

  if (!hostParticipantSnapshot.exists()) {
    throw new Error(
      'No encontramos la participación del anfitrión.',
    );
  }

  const tableData = tableSnapshot.data();

  const hostParticipantData =
    hostParticipantSnapshot.data();

  if (
    tableData.status
      !== TABLE_STATUS.FINISHED
  ) {
    throw new Error(
      'Sólo puede prepararse otra partida después de finalizar la actual.',
    );
  }

  if (
    tableData.hostUid !== hostUid
    || hostParticipantData.uid
      !== hostUid
    || hostParticipantData.role
      !== PARTICIPANT_ROLE.HOST
    || hostParticipantData.status
      !== PARTICIPANT_STATUS.ACTIVE
  ) {
    throw new Error(
      'Solamente el anfitrión activo puede preparar otra partida.',
    );
  }

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

  const operationCount =
    1
    + participantsSnapshot.size
    + joinRequestsSnapshot.size
    + 3;

  if (
    operationCount
      > FIRESTORE_BATCH_WRITE_LIMIT
  ) {
    throw new Error(
      'La mesa contiene demasiados documentos para preparar otra partida en una sola operación.',
    );
  }

  const batch = writeBatch(db);

  participantsSnapshot.docs.forEach(
    (participantDocument) => {
      batch.update(
        participantDocument.ref,
        {
          currentCoordinate: null,
          failedCoordinates: [],
        },
      );
    },
  );

  joinRequestsSnapshot.docs.forEach(
    (joinRequestDocument) => {
      batch.delete(
        joinRequestDocument.ref,
      );
    },
  );

  batch.delete(setupBoardReference);
  batch.delete(gameBoardReference);
  batch.delete(gameStateReference);

  batch.update(tableReference, {
    status: TABLE_STATUS.LOBBY,
    startedAt: deleteField(),
    finishedAt: deleteField(),
    finishReason: deleteField(),
  });

  await batch.commit();
}

export { restartFinishedTable };
