import {
  Navigate,
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

function ProtectedRoute({
  user,
  children,
}) {
  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          sessionUnavailable: true,
        }}
      />
    );
  }

  return children;
}

function App() {
  const {
    user,
    isLoading,
    error,
  } = useAnonymousAuth();

  let content;

  if (isLoading) {
    content = <AuthStatus />;
  } else if (error) {
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
            <ProtectedRoute
              user={user}
            >
              <TablePage
                user={user}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mesa/:tableCode/preparar"
          element={
            <ProtectedRoute
              user={user}
            >
              <PrepareTablePage
                user={user}
              />
            </ProtectedRoute>
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
