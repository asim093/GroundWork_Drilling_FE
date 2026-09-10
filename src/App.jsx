import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { RoleLanding } from './components/RoleLanding.jsx';
import { AdminLayout } from './components/AdminLayout.jsx';
import { OperatorLayout } from './components/OperatorLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SetPasswordPage } from './pages/SetPasswordPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { UsersPage } from './pages/admin/UsersPage.jsx';
import { EmployeesPage } from './pages/admin/EmployeesPage.jsx';
import { JobsPage } from './pages/admin/JobsPage.jsx';
import { SchedulingPage } from './pages/admin/SchedulingPage.jsx';
import { ReportsPage } from './pages/admin/ReportsPage.jsx';
import { SettingsPage } from './pages/admin/SettingsPage.jsx';
import { AdminTimeLogPage } from './pages/admin/AdminTimeLogPage.jsx';
import { OperatorJobsPage } from './pages/operator/OperatorJobsPage.jsx';
import { MySubmissionsPage } from './pages/operator/MySubmissionsPage.jsx';
import { MyReportsPage } from './pages/operator/MyReportsPage.jsx';
import { TimeLogFormPage } from './pages/operator/TimeLogFormPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/set-password" element={<SetPasswordPage />} />
    <Route path="/" element={<RoleLanding />} />

    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="scheduling" element={<SchedulingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="time-logs/:id" element={<AdminTimeLogPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
      <Route path="/operator" element={<OperatorLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="jobs" element={<OperatorJobsPage />} />
        <Route path="submissions" element={<MySubmissionsPage />} />
        <Route path="my-reports" element={<MyReportsPage />} />
      </Route>
      <Route path="/operator/jobs/:jobId/log" element={<TimeLogFormPage />} />
      <Route path="/operator/log/:id" element={<TimeLogFormPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
