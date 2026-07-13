import { Link } from 'react-router';

import styles from '@/pages/HomePage.module.scss';

function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>Pistas Cruzadas</p>

        <h1 className={styles.title}>¿Cómo querés empezar?</h1>

        <p className={styles.description}>
          Creá una nueva mesa o ingresá a una partida preparada por otra
          persona.
        </p>

        <div className={styles.actions}>
          <Link to="/crear-mesa" className="button button--primary">
            Crear mesa
          </Link>

          <Link to="/unirse" className="button button--secondary">
            Unirse a una mesa
          </Link>
        </div>
      </section>
    </main>
  );
}

export default HomePage;