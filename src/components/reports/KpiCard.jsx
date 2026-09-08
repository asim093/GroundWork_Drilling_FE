import { Paper, SimpleGrid, Text } from '@mantine/core';

export const KpiCard = ({ label, value, hint }) => (
  <Paper withBorder radius="lg" p="lg">
    <Text size="sm" c="dimmed" fw={600}>
      {label}
    </Text>
    <Text fw={700} fz={26} lh={1.15} mt={6}>
      {value}
    </Text>
    {hint ? (
      <Text size="xs" c="dimmed" mt={4}>
        {hint}
      </Text>
    ) : null}
  </Paper>
);

export const KpiGrid = ({ items, cols = { base: 2, sm: 3, lg: 6 } }) => (
  <SimpleGrid cols={cols} spacing="md">
    {items.map((item) => (
      <KpiCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
    ))}
  </SimpleGrid>
);
