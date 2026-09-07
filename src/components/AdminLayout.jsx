import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button, Group, Stack } from '@mantine/core';
import { AppLayout } from './AppLayout.jsx';

const NAV_ITEMS = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/jobs', label: 'Jobs' }
];

const NavButton = ({ to, label }) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Button component={Link} to={to} variant={active ? 'light' : 'subtle'} size="sm">
      {label}
    </Button>
  );
};

export const AdminLayout = () => (
  <AppLayout title="Admin">
    <Stack gap="lg">
      <Group gap="xs">
        {NAV_ITEMS.map((item) => (
          <NavButton key={item.to} to={item.to} label={item.label} />
        ))}
      </Group>
      <Outlet />
    </Stack>
  </AppLayout>
);
