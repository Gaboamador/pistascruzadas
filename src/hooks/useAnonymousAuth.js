import { useEffect, useState } from 'react';

import {
  signInAnonymousUser,
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

    const handleUserChanged = async (user) => {
      if (!isActive) {
        return;
      }

      if (user) {
        setAuthState({
          user,
          isLoading: false,
          error: null,
        });

        return;
      }

      try {
        await signInAnonymousUser();
      } catch (error) {
        if (!isActive) {
          return;
        }

        setAuthState({
          user: null,
          isLoading: false,
          error,
        });
      }
    };

    const handleAuthError = (error) => {
      if (!isActive) {
        return;
      }

      setAuthState({
        user: null,
        isLoading: false,
        error,
      });
    };

    const unsubscribe = subscribeToAuthState(
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