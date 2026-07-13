import { Link } from 'react-router';

import styles from '@/pages/NotFoundPage.module.scss';

function NotFoundPage() {
  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <p className={styles.code}>404</p>

        <h1 className={styles.title}>Página no encontrada</h1>

        <p className={styles.description}>
          La dirección ingresada no corresponde a una página disponible.
        </p>

        <Link to="/" className="button button--primary">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}

export default NotFoundPage;