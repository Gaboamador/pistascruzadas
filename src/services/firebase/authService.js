import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
} from 'firebase/auth';

import { auth } from '@/services/firebase/firebase';

let anonymousSignInPromise = null;

async function signInAnonymousUser() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!anonymousSignInPromise) {
    anonymousSignInPromise = setPersistence(auth, browserLocalPersistence)
      .then(() => signInAnonymously(auth))
      .then(({ user }) => user)
      .finally(() => {
        anonymousSignInPromise = null;
      });
  }

  return anonymousSignInPromise;
}

function subscribeToAuthState(onUserChanged, onError) {
  return onAuthStateChanged(auth, onUserChanged, onError);
}

export { signInAnonymousUser, subscribeToAuthState };