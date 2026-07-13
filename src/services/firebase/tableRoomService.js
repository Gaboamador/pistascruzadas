import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import { db } from '@/services/firebase/firebase';

function subscribeToTable({
  tableCode,
  onTableChanged,
  onError,
}) {
  const tableReference = doc(db, 'tables', tableCode);

  return onSnapshot(
    tableReference,
    (snapshot) => {
      if (!snapshot.exists()) {
        onTableChanged(null);
        return;
      }

      onTableChanged({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    onError,
  );
}

function subscribeToParticipant({
  tableCode,
  uid,
  onParticipantChanged,
  onError,
}) {
  const participantReference = doc(
    db,
    'tables',
    tableCode,
    'participants',
    uid,
  );

  return onSnapshot(
    participantReference,
    (snapshot) => {
      if (!snapshot.exists()) {
        onParticipantChanged(null);
        return;
      }

      onParticipantChanged({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    onError,
  );
}

function subscribeToPlayers({
  tableCode,
  onPlayersChanged,
  onError,
}) {
  const playersReference = collection(
    db,
    'tables',
    tableCode,
    'players',
  );

  const playersQuery = query(
    playersReference,
    orderBy('joinedAt', 'asc'),
  );

  return onSnapshot(
    playersQuery,
    (snapshot) => {
      const players = snapshot.docs.map((playerDocument) => ({
        id: playerDocument.id,
        ...playerDocument.data(),
      }));

      onPlayersChanged(players);
    },
    onError,
  );
}

export {
  subscribeToParticipant,
  subscribeToPlayers,
  subscribeToTable,
};