import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiX,
} from 'react-icons/fi';
import { registerSW } from 'virtual:pwa-register';

import useOnlineStatus from '@/hooks/useOnlineStatus';

import styles from '@/components/AppStatus.module.scss';

const CONNECTION_RECOVERED_DURATION = 4000;

function AppStatus() {
  const isOnline = useOnlineStatus();

  const [
    isUpdateAvailable,
    setIsUpdateAvailable,
  ] = useState(false);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const [
    showConnectionRecovered,
    setShowConnectionRecovered,
  ] = useState(false);

  const updateServiceWorkerRef =
    useRef(null);

  const recoveredTimeoutRef =
    useRef(null);

  const hasBeenOfflineRef =
    useRef(!isOnline);

  useEffect(() => {
    if (!import.meta.env.PROD) {
      return undefined;
    }

    updateServiceWorkerRef.current =
      registerSW({
        immediate: true,

        onNeedRefresh() {
          setIsUpdateAvailable(true);
        },

        onRegisterError(error) {
          console.error(
            'No se pudo registrar el service worker:',
            error,
          );
        },
      });

    return undefined;
  }, []);

  useEffect(() => {
    if (!isOnline) {
      hasBeenOfflineRef.current = true;

      setShowConnectionRecovered(false);

      if (recoveredTimeoutRef.current) {
        window.clearTimeout(
          recoveredTimeoutRef.current,
        );

        recoveredTimeoutRef.current =
          null;
      }

      return undefined;
    }

    if (!hasBeenOfflineRef.current) {
      return undefined;
    }

    setShowConnectionRecovered(true);

    if (recoveredTimeoutRef.current) {
      window.clearTimeout(
        recoveredTimeoutRef.current,
      );
    }

    recoveredTimeoutRef.current =
      window.setTimeout(() => {
        setShowConnectionRecovered(false);

        recoveredTimeoutRef.current =
          null;
      }, CONNECTION_RECOVERED_DURATION);

    return () => {
      if (recoveredTimeoutRef.current) {
        window.clearTimeout(
          recoveredTimeoutRef.current,
        );

        recoveredTimeoutRef.current =
          null;
      }
    };
  }, [isOnline]);

  const handleUpdate = async () => {
    if (
      isUpdating
      || !updateServiceWorkerRef.current
    ) {
      return;
    }

    setIsUpdating(true);

    try {
      await updateServiceWorkerRef.current(
        true,
      );
    } catch (error) {
      console.error(
        'No se pudo aplicar la actualización:',
        error,
      );

      setIsUpdating(false);
    }
  };

  const hasVisibleStatus =
    !isOnline
    || showConnectionRecovered
    || isUpdateAvailable;

  if (!hasVisibleStatus) {
    return null;
  }

  return (
    <aside
      className={styles.container}
      aria-label="Estado de la aplicación"
    >
      {!isOnline && (
        <section
          className={`${styles.notice} ${styles.offlineNotice}`}
          role="alert"
          aria-live="assertive"
        >
          <FiWifiOff
            className={styles.icon}
            aria-hidden="true"
          />

          <div className={styles.content}>
            <strong>Sin conexión</strong>

            <p>
              La mesa no puede actualizarse hasta recuperar internet.
            </p>
          </div>
        </section>
      )}

      {isOnline
        && showConnectionRecovered && (
        <section
          className={`${styles.notice} ${styles.onlineNotice}`}
          role="status"
          aria-live="polite"
        >
          <FiWifi
            className={styles.icon}
            aria-hidden="true"
          />

          <div className={styles.content}>
            <strong>
              Conexión recuperada
            </strong>

            <p>
              La aplicación volvió a estar conectada.
            </p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={() =>
              setShowConnectionRecovered(
                false,
              )
            }
            aria-label="Cerrar aviso de conexión"
          >
            <FiX aria-hidden="true" />
          </button>
        </section>
      )}

      {isUpdateAvailable && (
        <section
          className={`${styles.notice} ${styles.updateNotice}`}
          role="status"
          aria-live="polite"
        >
          <FiRefreshCw
            className={styles.icon}
            aria-hidden="true"
          />

          <div className={styles.content}>
            <strong>
              Nueva versión disponible
            </strong>

            <p>
              Actualizá cuando puedas interrumpir la partida.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.laterButton}
              onClick={() =>
                setIsUpdateAvailable(false)
              }
              disabled={isUpdating}
            >
              Más tarde
            </button>

            <button
              type="button"
              className={styles.updateButton}
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating
                ? 'Actualizando…'
                : 'Actualizar'}
            </button>
          </div>
        </section>
      )}
    </aside>
  );
}

export default AppStatus;