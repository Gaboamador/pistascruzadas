import {
  useEffect,
  useState,
} from 'react';

import { subscribeToOwnJoinRequest } from '@/services/firebase/joinRequestService';
import { subscribeToTable } from '@/services/firebase/tableRoomService';

const INITIAL_JOIN_REQUEST_STATE = {
  joinRequest: null,
  table: null,
  tableExists: true,
  isLoading: false,
  error: null,
};

function useJoinRequest({
  tableCode,
  uid,
  enabled = true,
}) {
  const [requestState, setRequestState] =
    useState(INITIAL_JOIN_REQUEST_STATE);

  useEffect(() => {
    if (!enabled || !tableCode || !uid) {
      setRequestState(
        INITIAL_JOIN_REQUEST_STATE,
      );

      return undefined;
    }

    let isActive = true;

    let joinRequestLoaded = false;
    let tableLoaded = false;

    const updateLoadingState = () => {
      if (
        !isActive
        || !joinRequestLoaded
        || !tableLoaded
      ) {
        return;
      }

      setRequestState(
        (currentState) => ({
          ...currentState,
          isLoading: false,
        }),
      );
    };

    const handleError = (
      subscriptionError,
    ) => {
      if (!isActive) {
        return;
      }

      setRequestState(
        (currentState) => ({
          ...currentState,
          isLoading: false,
          error: subscriptionError,
        }),
      );
    };

    setRequestState({
      joinRequest: null,
      table: null,
      tableExists: true,
      isLoading: true,
      error: null,
    });

    const unsubscribeJoinRequest =
      subscribeToOwnJoinRequest({
        tableCode,
        uid,
        onJoinRequestChanged: (
          nextJoinRequest,
        ) => {
          if (!isActive) {
            return;
          }

          joinRequestLoaded = true;

          setRequestState(
            (currentState) => ({
              ...currentState,
              joinRequest:
                nextJoinRequest,
              error: null,
            }),
          );

          updateLoadingState();
        },
        onError: handleError,
      });

    const unsubscribeTable =
      subscribeToTable({
        tableCode,
        onTableChanged: (
          nextTable,
        ) => {
          if (!isActive) {
            return;
          }

          tableLoaded = true;

          setRequestState(
            (currentState) => ({
              ...currentState,
              table: nextTable,
              tableExists:
                Boolean(nextTable),
              error: null,
            }),
          );

          updateLoadingState();
        },
        onError: handleError,
      });

    return () => {
      isActive = false;

      unsubscribeJoinRequest();
      unsubscribeTable();
    };
  }, [
    enabled,
    tableCode,
    uid,
  ]);

  return requestState;
}

export default useJoinRequest;