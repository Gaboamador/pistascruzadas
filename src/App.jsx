import { Route, Routes } from 'react-router';

import AuthStatus from '@/components/AuthStatus';
import useAnonymousAuth from '@/hooks/useAnonymousAuth';
import CreateTablePage from '@/pages/CreateTablePage';
import HomePage from '@/pages/HomePage';
import JoinTablePage from '@/pages/JoinTablePage';
import NotFoundPage from '@/pages/NotFoundPage';
import PrepareTablePage from '@/pages/PrepareTablePage';
import TablePage from '@/pages/TablePage';

function App() {
  const { user, isLoading, error } = useAnonymousAuth();

  if (isLoading) {
    return <AuthStatus />;
  }

  if (error || !user) {
    return <AuthStatus error={error} />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/crear-mesa"
        element={<CreateTablePage user={user} />}
      />

      <Route
        path="/unirse"
        element={<JoinTablePage user={user} />}
      />

      <Route
        path="/mesa/:tableCode"
        element={<TablePage user={user} />}
      />

      <Route
        path="/mesa/:tableCode/preparar"
        element={<PrepareTablePage user={user} />}
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;