import {
  browserLocalPersistence,
  deleteUser,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signOut,
} from 'firebase/auth';

import { auth } from '@/services/firebase/firebase';

let anonymousSignInPromise = null;
let anonymousDeletePromise = null;

async function signInAnonymousUser() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!anonymousSignInPromise) {
    anonymousSignInPromise =
      setPersistence(
        auth,
        browserLocalPersistence,
      )
        .then(() =>
          signInAnonymously(auth),
        )
        .then(({ user }) => user)
        .finally(() => {
          anonymousSignInPromise = null;
        });
  }

  return anonymousSignInPromise;
}

async function deleteCurrentAnonymousUser() {
  if (anonymousDeletePromise) {
    return anonymousDeletePromise;
  }

  const currentUser =
    auth.currentUser;

  if (!currentUser) {
    return undefined;
  }

  anonymousDeletePromise = (
    currentUser.isAnonymous
      ? deleteUser(currentUser)
      : signOut(auth)
  ).finally(() => {
    anonymousDeletePromise = null;
  });

  return anonymousDeletePromise;
}

function subscribeToAuthState(
  onUserChanged,
  onError,
) {
  return onAuthStateChanged(
    auth,
    onUserChanged,
    onError,
  );
}

export {
  deleteCurrentAnonymousUser,
  signInAnonymousUser,
  subscribeToAuthState,
};
