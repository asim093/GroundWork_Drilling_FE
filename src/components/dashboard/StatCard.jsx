import { Group, Paper, Text, ThemeIcon } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';

export const StatCard = ({ label, value, hint, icon, color = 'blue' }) => (
  <Paper withBorder radius="lg" p="lg" mih={132}>
    <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
      <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: 0.4 }}>
        {label}
      </Text>
      <ThemeIcon variant="light" color={color} size={40} radius="md" style={{ flexShrink: 0 }}>
        <NavIcon name={icon} size={20} />
      </ThemeIcon>
    </Group>
    <Text fw={700} fz={32} lh={1.1}>
      {value}
    </Text>
    {hint ? (
      <Text size="xs" c="dimmed" mt={4}>
        {hint}
      </Text>
    ) : null}
  </Paper>
);
