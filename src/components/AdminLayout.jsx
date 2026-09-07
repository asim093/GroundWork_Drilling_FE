import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout.jsx';
import { ADMIN_NAV } from '../constants/nav.js';

export const AdminLayout = () => (
  <AppLayout navItems={ADMIN_NAV}>
    <Outlet />
  </AppLayout>
);
