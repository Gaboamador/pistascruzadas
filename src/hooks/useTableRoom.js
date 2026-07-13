import { useEffect, useState } from 'react';

import {
  subscribeToParticipant,
  subscribeToPlayers,
  subscribeToTable,
} from '@/services/firebase/tableRoomService';

const INITIAL_ROOM_STATE = {
  table: null,
  participant: null,
  players: [],
  isLoading: true,
  error: null,
  tableExists: true,
  hasAccess: true,
};

function useTableRoom({ tableCode, uid }) {
  const [roomState, setRoomState] = useState(
    INITIAL_ROOM_STATE,
  );

  useEffect(() => {
    if (!tableCode || !uid) {
      setRoomState({
        ...INITIAL_ROOM_STATE,
        isLoading: false,
        error: new Error(
          'Faltan datos para cargar la mesa.',
        ),
      });

      return undefined;
    }

    let isActive = true;

    let tableLoaded = false;
    let participantLoaded = false;
    let playersLoaded = false;

    const updateLoadingState = () => {
      if (
        !isActive
        || !tableLoaded
        || !participantLoaded
        || !playersLoaded
      ) {
        return;
      }

      setRoomState((currentState) => ({
        ...currentState,
        isLoading: false,
      }));
    };

    const handleError = (error) => {
      if (!isActive) {
        return;
      }

      setRoomState((currentState) => ({
        ...currentState,
        isLoading: false,
        error,
      }));
    };

    const unsubscribeTable = subscribeToTable({
      tableCode,
      onTableChanged: (table) => {
        if (!isActive) {
          return;
        }

        tableLoaded = true;

        setRoomState((currentState) => ({
          ...currentState,
          table,
          tableExists: Boolean(table),
        }));

        updateLoadingState();
      },
      onError: handleError,
    });

    const unsubscribeParticipant = subscribeToParticipant({
      tableCode,
      uid,
      onParticipantChanged: (participant) => {
        if (!isActive) {
          return;
        }

        participantLoaded = true;

        setRoomState((currentState) => ({
          ...currentState,
          participant,
          hasAccess: Boolean(participant),
        }));

        updateLoadingState();
      },
      onError: handleError,
    });

    const unsubscribePlayers = subscribeToPlayers({
      tableCode,
      onPlayersChanged: (players) => {
        if (!isActive) {
          return;
        }

        playersLoaded = true;

        setRoomState((currentState) => ({
          ...currentState,
          players,
        }));

        updateLoadingState();
      },
      onError: handleError,
    });

    return () => {
      isActive = false;

      unsubscribeTable();
      unsubscribeParticipant();
      unsubscribePlayers();
    };
  }, [tableCode, uid]);

  return roomState;
}

export default useTableRoom;