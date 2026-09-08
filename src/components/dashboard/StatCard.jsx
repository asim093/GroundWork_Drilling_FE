import { Link } from 'react-router-dom';
import { Box, Group, Paper, Text, ThemeIcon } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';

export const StatCard = ({ label, value, hint, icon, to }) => {
  const card = (
    <Paper withBorder radius="lg" p="lg" h="100%">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" color="gray" size={34} radius="md">
            <NavIcon name={icon} size={17} />
          </ThemeIcon>
          <Text size="sm" c="dimmed" fw={600}>
            {label}
          </Text>
        </Group>
      </Group>

      <Text fw={700} fz={30} lh={1.1} mt="md">
        {value}
      </Text>

      <Group justify="space-between" align="center" wrap="nowrap" mt={6} gap="sm">
        <Text size="xs" c="dimmed">
          {hint || ' '}
        </Text>
        {to ? (
          <Box c="blue.6" style={{ display: 'flex', flexShrink: 0 }}>
            <NavIcon name="chevronRight" size={16} />
          </Box>
        ) : null}
      </Group>
    </Paper>
  );

  if (!to) {
    return card;
  }

  return (
    <Link to={to} className="dash-card-link">
      {card}
    </Link>
  );
};
