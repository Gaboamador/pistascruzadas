import {
  useEffect,
  useState,
} from 'react';

import { subscribeToPendingJoinRequests } from '@/services/firebase/joinRequestService';

const INITIAL_PENDING_REQUESTS_STATE = {
  pendingJoinRequests: [],
  isLoading: false,
  error: null,
};

function usePendingJoinRequests({
  tableCode,
  enabled = true,
}) {
  const [
    pendingRequestsState,
    setPendingRequestsState,
  ] = useState(
    INITIAL_PENDING_REQUESTS_STATE,
  );

  useEffect(() => {
    if (!enabled || !tableCode) {
      setPendingRequestsState(
        INITIAL_PENDING_REQUESTS_STATE,
      );

      return undefined;
    }

    setPendingRequestsState({
      pendingJoinRequests: [],
      isLoading: true,
      error: null,
    });

    const unsubscribe =
      subscribeToPendingJoinRequests({
        tableCode,
        onJoinRequestsChanged: (
          nextJoinRequests,
        ) => {
          setPendingRequestsState({
            pendingJoinRequests:
              nextJoinRequests,
            isLoading: false,
            error: null,
          });
        },
        onError: (subscriptionError) => {
          setPendingRequestsState({
            pendingJoinRequests: [],
            isLoading: false,
            error: subscriptionError,
          });
        },
      });

    return unsubscribe;
  }, [
    enabled,
    tableCode,
  ]);

  return pendingRequestsState;
}

export default usePendingJoinRequests;