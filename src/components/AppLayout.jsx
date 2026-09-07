import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Burger,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip
} from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitleValue } from '../context/PageTitleContext.jsx';
import { notifySuccess } from '../lib/toast.js';
import { NavIcon } from './NavIcon.jsx';

const initials = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || '?';

const isActive = (pathname, item) =>
  item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);

export const AppLayout = ({ navItems = [], children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageTitle = usePageTitleValue();
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const handleLogout = () => {
    logout();
    notifySuccess('You have been signed out');
    navigate('/login', { replace: true });
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 264,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm" wrap="nowrap">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          <Box
            w={28}
            h={28}
            style={{
              borderRadius: 8,
              background: 'var(--mantine-color-blue-6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0
            }}
          >
            GD
          </Box>
          <Text fw={700} fz="lg" truncate>
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
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                leftSection={<NavIcon name={item.icon} />}
                active={isActive(pathname, item)}
                variant="light"
                onClick={closeMobile}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider mb="sm" />
          <Group gap="sm" wrap="nowrap" justify="space-between">
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
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
            <Tooltip label="Sign out" position="top">
              <ActionIcon
                variant="subtle"
                color="red"
                size="lg"
                onClick={handleLogout}
                aria-label="Sign out"
              >
                <NavIcon name="logout" size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {pageTitle ? (
          <Title order={3} mb="lg">
            {pageTitle}
          </Title>
        ) : null}
        {children}
      </AppShell.Main>
    </AppShell>
  );
};
