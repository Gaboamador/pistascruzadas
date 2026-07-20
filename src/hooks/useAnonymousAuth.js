import {
  useEffect,
  useState,
} from 'react';

import {
  subscribeToAuthState,
} from '@/services/firebase/authService';

function useAnonymousAuth() {
  const [authState, setAuthState] = useState({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isActive = true;

    const handleUserChanged = (
      user,
    ) => {
      if (!isActive) {
        return;
      }

      setAuthState({
        user,
        isLoading: false,
        error: null,
      });
    };

    const handleAuthError = (
      error,
    ) => {
      if (!isActive) {
        return;
      }

      setAuthState({
        user: null,
        isLoading: false,
        error,
      });
    };

    const unsubscribe =
      subscribeToAuthState(
        handleUserChanged,
        handleAuthError,
      );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  return authState;
}

export default useAnonymousAuth;
