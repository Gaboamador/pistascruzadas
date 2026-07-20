import styles from '@/components/AuthStatus.module.scss';

function AuthStatus({ error = null }) {
  const hasError = Boolean(error);

  return (
    <main className={styles.page}>
      <section
        className={styles.status}
        role={hasError ? 'alert' : 'status'}
        aria-live={hasError ? 'assertive' : 'polite'}
      >
        <p className={styles.eyebrow}>Pistas Cruzadas</p>

        <h1 className={styles.title}>
          {hasError
            ? 'No se pudo iniciar la aplicación'
            : 'Preparando la aplicación'}
        </h1>

        <p className={styles.description}>
          {hasError
            ? 'No pudimos recuperar el estado de tu sesión. Revisá tu conexión e intentá recargar la página.'
            : 'Estamos recuperando el estado guardado en este dispositivo.'}
        </p>

        {hasError && (
          <button
            type="button"
            className="button button--primary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        )}
      </section>
    </main>
  );
}

export default AuthStatus;
