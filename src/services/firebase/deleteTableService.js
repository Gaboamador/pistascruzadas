import {
  collection,
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

async function deleteFinishedTable({
  tableCode,
  hostUid,
}) {
  if (!tableCode || !hostUid) {
    throw new Error(
      'Faltan datos para eliminar la mesa.',
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

  const [
    tableSnapshot,
    hostParticipantSnapshot,
  ] = await Promise.all([
    getDoc(tableReference),
    getDoc(hostParticipantReference),
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
      'La mesa sólo puede eliminarse después de finalizar la partida.',
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
      'Solamente el anfitrión activo puede eliminar esta partida.',
    );
  }

  const participantsReference =
    collection(
      db,
      'tables',
      tableCode,
      'participants',
    );

  const playersReference =
    collection(
      db,
      'tables',
      tableCode,
      'players',
    );

  const joinRequestsReference =
    collection(
      db,
      'tables',
      tableCode,
      'joinRequests',
    );

  const [
    participantsSnapshot,
    playersSnapshot,
    joinRequestsSnapshot,
  ] = await Promise.all([
    getDocs(participantsReference),
    getDocs(playersReference),
    getDocs(joinRequestsReference),
  ]);

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

  const documentReferencesToDelete = [
    ...participantsSnapshot.docs.map(
      (documentSnapshot) =>
        documentSnapshot.ref,
    ),
    ...playersSnapshot.docs.map(
      (documentSnapshot) =>
        documentSnapshot.ref,
    ),
    ...joinRequestsSnapshot.docs.map(
      (documentSnapshot) =>
        documentSnapshot.ref,
    ),
    setupBoardReference,
    gameBoardReference,
    gameStateReference,
    tableReference,
  ];

  if (
    documentReferencesToDelete.length
      > FIRESTORE_BATCH_WRITE_LIMIT
  ) {
    throw new Error(
      'La mesa contiene demasiados documentos para eliminarla en una sola operación.',
    );
  }

  const batch = writeBatch(db);

  documentReferencesToDelete.forEach(
    (documentReference) => {
      batch.delete(documentReference);
    },
  );

  await batch.commit();
}

export { deleteFinishedTable };