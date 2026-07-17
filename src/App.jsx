import {
  Route,
  Routes,
} from 'react-router';

import AppBackground from '@/components/AppBackground';
import AppStatus from '@/components/AppStatus';
import AuthStatus from '@/components/AuthStatus';
import useAnonymousAuth from '@/hooks/useAnonymousAuth';
import CreateTablePage from '@/pages/CreateTablePage';
import HomePage from '@/pages/HomePage';
import JoinTablePage from '@/pages/JoinTablePage';
import NotFoundPage from '@/pages/NotFoundPage';
import PrepareTablePage from '@/pages/PrepareTablePage';
import TablePage from '@/pages/TablePage';

function App() {
  const {
    user,
    isLoading,
    error,
  } = useAnonymousAuth();

  let content;

  if (isLoading) {
    content = <AuthStatus />;
  } else if (error || !user) {
    content = (
      <AuthStatus error={error} />
    );
  } else {
    content = (
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/crear-mesa"
          element={
            <CreateTablePage
              user={user}
            />
          }
        />

        <Route
          path="/unirse"
          element={
            <JoinTablePage
              user={user}
            />
          }
        />

        <Route
          path="/mesa/:tableCode"
          element={
            <TablePage
              user={user}
            />
          }
        />

        <Route
          path="/mesa/:tableCode/preparar"
          element={
            <PrepareTablePage
              user={user}
            />
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    );
  }

  return (
    <>
      <AppBackground />

      {content}

      <AppStatus />
    </>
  );
}

export default App;