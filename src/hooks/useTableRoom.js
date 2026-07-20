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
  wasTableRemoved: false,
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

    let tableWasAvailable = false;
    let tableIsMissing = false;

    const updateLoadingState = () => {
      if (
        !isActive
        || tableIsMissing
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
      if (
        !isActive
        || tableIsMissing
      ) {
        return;
      }

      setRoomState((currentState) => ({
        ...currentState,
        isLoading: false,
        error,
      }));
    };

    setRoomState(INITIAL_ROOM_STATE);

    const unsubscribeTable = subscribeToTable({
      tableCode,
      onTableChanged: (table) => {
        if (!isActive) {
          return;
        }

        tableLoaded = true;

        if (!table) {
          tableIsMissing = true;

          setRoomState({
            table: null,
            participant: null,
            players: [],
            isLoading: false,
            error: null,
            tableExists: false,
            hasAccess: false,
            wasTableRemoved:
              tableWasAvailable,
          });

          return;
        }

        tableWasAvailable = true;
        tableIsMissing = false;

        setRoomState((currentState) => ({
          ...currentState,
          table,
          tableExists: true,
          wasTableRemoved: false,
          error: null,
        }));

        updateLoadingState();
      },
      onError: handleError,
    });

    const unsubscribeParticipant = subscribeToParticipant({
      tableCode,
      uid,
      onParticipantChanged: (participant) => {
        if (
          !isActive
          || tableIsMissing
        ) {
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
        if (
          !isActive
          || tableIsMissing
        ) {
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
