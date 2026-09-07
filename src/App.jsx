import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { RoleLanding } from './components/RoleLanding.jsx';
import { AdminLayout } from './components/AdminLayout.jsx';
import { OperatorLayout } from './components/OperatorLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { UsersPage } from './pages/admin/UsersPage.jsx';
import { JobsPage } from './pages/admin/JobsPage.jsx';
import { OperatorJobsPage } from './pages/operator/OperatorJobsPage.jsx';
import { MySubmissionsPage } from './pages/operator/MySubmissionsPage.jsx';
import { TimeLogFormPage } from './pages/operator/TimeLogFormPage.jsx';
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
      <Route path="/operator" element={<OperatorLayout />}>
        <Route index element={<Navigate to="/operator/jobs" replace />} />
        <Route path="jobs" element={<OperatorJobsPage />} />
        <Route path="submissions" element={<MySubmissionsPage />} />
      </Route>
      <Route path="/operator/jobs/:jobId/log" element={<TimeLogFormPage />} />
      <Route path="/operator/log/:id" element={<TimeLogFormPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
