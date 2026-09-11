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
  Tooltip
} from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';
import { roleLabel } from '../constants/roles.js';
import { usePageTitleValue } from '../context/PageTitleContext.jsx';
import { notifySuccess } from '../lib/toast.js';
import { NavIcon } from './NavIcon.jsx';
import { HeaderCreateMenu } from './HeaderCreateMenu.jsx';
import { NotificationBell } from './NotificationBell.jsx';

const NAVBAR_WIDTH = 260;
const RAIL_WIDTH = 72;

const QUICK_ACTIONS = {
  admin: [
    { label: 'Add job', to: '/admin/jobs?new=1' },
    { label: 'Add manager', to: '/admin/employees?new=1' }
  ]
};

const initials = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || '?';

const isActive = (pathname, item) =>
  item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);

const BrandMark = ({ size = 30 }) => (
  <Box
    w={size}
    h={size}
    style={{
      borderRadius: 8,
      background: 'var(--mantine-color-brand-6)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: size * 0.42,
      flexShrink: 0
    }}
  >
    GD
  </Box>
);

export const AppLayout = ({ navItems = [], children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageTitle = usePageTitleValue();
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(true);

  const handleLogout = () => {
    logout();
    notifySuccess('You have been signed out');
    navigate('/login', { replace: true });
  };

  const railMode = !expanded;
  const quickActions = QUICK_ACTIONS[user?.role] || [];

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: { base: NAVBAR_WIDTH, sm: expanded ? NAVBAR_WIDTH : RAIL_WIDTH },
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: false }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" gap={0} wrap="nowrap">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" mx="md" />

          <Group
            gap="sm"
            wrap="nowrap"
            visibleFrom="sm"
            justify={railMode ? 'center' : 'flex-start'}
            px={railMode ? 0 : 'md'}
            style={{
              width: railMode ? RAIL_WIDTH : NAVBAR_WIDTH,
              flexShrink: 0,
              borderRight: '1px solid var(--mantine-color-gray-3)',
              height: '100%'
            }}
          >
            <BrandMark size={28} />
            {railMode ? null : (
              <Text fw={700} fz="lg" truncate>
                Groundwork Drilling
              </Text>
            )}
          </Group>

          <Group gap="sm" wrap="nowrap" hiddenFrom="sm" style={{ flexShrink: 0 }}>
            <BrandMark size={26} />
            <Text fw={700} truncate visibleFrom="xs">
              Groundwork Drilling
            </Text>
          </Group>

          <Text fw={600} fz="lg" px="md" truncate style={{ flex: 1, minWidth: 0 }}>
            {pageTitle}
          </Text>

          <Group gap="xs" wrap="nowrap" pr="md" style={{ flexShrink: 0 }}>
            <NotificationBell />
            <HeaderCreateMenu actions={quickActions} />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={railMode ? 'xs' : 'sm'}>
        {railMode ? null : (
          <AppShell.Section>
            <Text size="xs" fw={600} c="dimmed" px="sm" pb={6}>
              Menu
            </Text>
          </AppShell.Section>
        )}

        <AppShell.Section grow component={ScrollArea} pt={railMode ? 'xs' : 0}>
          <Stack gap={railMode ? 8 : 4} align={railMode ? 'center' : 'stretch'}>
            {navItems.map((item) => {
              const active = isActive(pathname, item);
              return railMode ? (
                <Tooltip key={item.to} label={item.label} position="right" withArrow>
                  <ActionIcon
                    component={Link}
                    to={item.to}
                    onClick={closeMobile}
                    aria-label={item.label}
                    variant={active ? 'light' : 'subtle'}
                    color={active ? 'brand' : 'gray'}
                    size={40}
                    radius="md"
                  >
                    <NavIcon name={item.icon} size={20} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <NavLink
                  key={item.to}
                  component={Link}
                  to={item.to}
                  label={item.label}
                  leftSection={<NavIcon name={item.icon} />}
                  active={active}
                  variant="light"
                  onClick={closeMobile}
                />
              );
            })}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider mb="sm" />
          {railMode ? (
            <Stack gap="sm" align="center">
              <Tooltip label={`${user?.name} · ${roleLabel(user?.role)}`} position="right" withArrow>
                <Avatar radius="xl" color="brand" variant="filled">
                  {initials(user?.name)}
                </Avatar>
              </Tooltip>
              <Tooltip label="Sign out" position="right" withArrow>
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
            </Stack>
          ) : (
            <Group gap="sm" wrap="nowrap" justify="space-between">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <Avatar radius="xl" color="brand" variant="filled">
                  {initials(user?.name)}
                </Avatar>
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {user?.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {roleLabel(user?.role)}
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
          )}
        </AppShell.Section>
      </AppShell.Navbar>

      <Tooltip label={expanded ? 'Collapse sidebar' : 'Expand sidebar'} position="right">
        <ActionIcon
          visibleFrom="sm"
          onClick={toggleExpanded}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          variant="default"
          radius="xl"
          size={26}
          style={{
            position: 'fixed',
            top: '50%',
            left: (expanded ? NAVBAR_WIDTH : RAIL_WIDTH) - 13,
            transform: 'translateY(-50%)',
            zIndex: 150,
            transition: 'left 150ms ease',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.18)'
          }}
        >
          <NavIcon name={expanded ? 'chevronLeft' : 'chevronRight'} size={13} />
        </ActionIcon>
      </Tooltip>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
