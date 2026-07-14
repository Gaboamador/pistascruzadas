import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import {
  GAME_FINISH_REASON,
  PARTICIPANT_STATUS,
  TABLE_STATUS,
} from '@/constants/table';
import { db } from '@/services/firebase/firebase';

async function finishGameManually({
  tableCode,
  uid,
}) {
  if (!tableCode || !uid) {
    throw new Error(
      'Faltan datos para finalizar la partida.',
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

  await runTransaction(db, async (transaction) => {
    const [
      tableSnapshot,
      participantSnapshot,
    ] = await Promise.all([
      transaction.get(tableReference),
      transaction.get(participantReference),
    ]);

    if (!tableSnapshot.exists()) {
      throw new Error('La mesa no existe.');
    }

    if (!participantSnapshot.exists()) {
      throw new Error(
        'No encontramos tu participación en la mesa.',
      );
    }

    const tableData = tableSnapshot.data();
    const participantData =
      participantSnapshot.data();

    if (tableData.hostUid !== uid) {
      throw new Error(
        'Solamente el anfitrión puede finalizar la partida.',
      );
    }

    if (
      participantData.status
      !== PARTICIPANT_STATUS.ACTIVE
    ) {
      throw new Error(
        'El anfitrión ya no figura como participante activo.',
      );
    }

    if (
      tableData.status !== TABLE_STATUS.PLAYING
    ) {
      throw new Error(
        'La partida no está actualmente en curso.',
      );
    }

    transaction.update(tableReference, {
      status: TABLE_STATUS.FINISHED,
      finishedAt: serverTimestamp(),
      finishReason: GAME_FINISH_REASON.MANUAL,
    });
  });
}

export { finishGameManually };