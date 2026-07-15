import { useSyncExternalStore } from 'react';

function subscribeToOnlineStatus(
  onStatusChanged,
) {
  window.addEventListener(
    'online',
    onStatusChanged,
  );

  window.addEventListener(
    'offline',
    onStatusChanged,
  );

  return () => {
    window.removeEventListener(
      'online',
      onStatusChanged,
    );

    window.removeEventListener(
      'offline',
      onStatusChanged,
    );
  };
}

function getOnlineStatusSnapshot() {
  return navigator.onLine;
}

function getServerOnlineStatusSnapshot() {
  return true;
}

function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatusSnapshot,
    getServerOnlineStatusSnapshot,
  );
}

export default useOnlineStatus;