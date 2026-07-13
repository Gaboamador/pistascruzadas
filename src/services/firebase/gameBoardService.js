import {
  doc,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '@/services/firebase/firebase';

function subscribeToGameBoard({
  tableCode,
  onBoardChanged,
  onError,
}) {
  const boardReference = doc(
    db,
    'tables',
    tableCode,
    'game',
    'board',
  );

  return onSnapshot(
    boardReference,
    (snapshot) => {
      if (!snapshot.exists()) {
        onBoardChanged(null);
        return;
      }

      onBoardChanged({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    onError,
  );
}

export { subscribeToGameBoard };