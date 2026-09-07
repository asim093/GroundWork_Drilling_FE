import { Card, Group, Text } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';

export const StatCard = ({ label, value, hint, icon, color = 'blue' }) => (
  <Card withBorder radius="md" p="md">
    <Group justify="space-between" wrap="nowrap" align="flex-start">
      <div>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {label}
        </Text>
        <Text fw={700} fz={28} lh={1.1} mt={4}>
          {value}
        </Text>
        {hint ? (
          <Text size="xs" c="dimmed" mt={4}>
            {hint}
          </Text>
        ) : null}
      </div>
      {icon ? (
        <div
          style={{
            color: `var(--mantine-color-${color}-6)`,
            display: 'flex',
            flexShrink: 0
          }}
        >
          <NavIcon name={icon} size={22} />
        </div>
      ) : null}
    </Group>
  </Card>
);
