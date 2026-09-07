import { useNavigate } from 'react-router-dom';
import { AppShell, Badge, Button, Group, Text } from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';
import { notifySuccess } from '../lib/toast.js';

export const AppLayout = ({ title, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    notifySuccess('You have been signed out');
    navigate('/login', { replace: true });
  };

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Text fw={700}>Groundwork Drilling</Text>
            {title ? (
              <Text c="dimmed" visibleFrom="sm">
                {title}
              </Text>
            ) : null}
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Badge variant="light" tt="capitalize">
              {user?.role}
            </Badge>
            <Text size="sm" visibleFrom="sm">
              {user?.name}
            </Text>
            <Button variant="subtle" onClick={handleLogout}>
              Sign out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
