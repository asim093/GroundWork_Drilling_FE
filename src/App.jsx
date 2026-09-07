import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { RoleLanding } from './components/RoleLanding.jsx';
import { AdminLayout } from './components/AdminLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { UsersPage } from './pages/admin/UsersPage.jsx';
import { JobsPage } from './pages/admin/JobsPage.jsx';
import { OperatorDashboardPage } from './pages/OperatorDashboardPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<RoleLanding />} />

    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/users" replace />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="jobs" element={<JobsPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
      <Route path="/operator" element={<OperatorDashboardPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
