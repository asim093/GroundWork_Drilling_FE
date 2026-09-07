import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { RoleLanding } from './components/RoleLanding.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx';
import { OperatorDashboardPage } from './pages/OperatorDashboardPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<RoleLanding />} />

    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route path="/admin" element={<AdminDashboardPage />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
      <Route path="/operator" element={<OperatorDashboardPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
