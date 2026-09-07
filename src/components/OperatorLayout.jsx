import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout.jsx';
import { OPERATOR_NAV } from '../constants/nav.js';

export const OperatorLayout = () => (
  <AppLayout navItems={OPERATOR_NAV}>
    <Outlet />
  </AppLayout>
);
