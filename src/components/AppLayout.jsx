import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text
} from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';
import { notifySuccess } from '../lib/toast.js';
import { NavIcon } from './NavIcon.jsx';

const initials = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || '?';

export const AppLayout = ({ navItems = [], children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [opened, { toggle, close }] = useDisclosure(false);

  const handleLogout = () => {
    logout();
    notifySuccess('You have been signed out');
    navigate('/login', { replace: true });
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 264, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm" wrap="nowrap">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={700} fz="lg">
            Groundwork Drilling
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm" pb={6}>
            Menu
          </Text>
          <Stack gap={4}>
            {navItems.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <NavLink
                  key={item.to}
                  component={Link}
                  to={item.to}
                  label={item.label}
                  leftSection={<NavIcon name={item.icon} />}
                  active={active}
                  variant="light"
                  onClick={close}
                />
              );
            })}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider my="sm" />
          <Group gap="sm" wrap="nowrap" px="xs" mb="sm">
            <Avatar radius="xl" color="blue" variant="filled">
              {initials(user?.name)}
            </Avatar>
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={600} truncate>
                {user?.name}
              </Text>
              <Text size="xs" c="dimmed" tt="capitalize">
                {user?.role}
              </Text>
            </Box>
          </Group>
          <Button
            fullWidth
            variant="light"
            color="red"
            onClick={handleLogout}
            leftSection={<NavIcon name="logout" size={16} />}
          >
            Sign out
          </Button>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
