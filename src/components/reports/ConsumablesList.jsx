import { Group, Progress, Stack, Text } from '@mantine/core';

export const ConsumablesList = ({ consumables }) => {
  if (!consumables.length) {
    return (
      <Text c="dimmed" size="sm">
        No consumables recorded in this period.
      </Text>
    );
  }

  const max = Math.max(...consumables.map((item) => item.qtyUsed), 1);

  return (
    <Stack gap="sm">
      {consumables.map((item) => (
        <Stack key={item.itemName} gap={2}>
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm">{item.itemName}</Text>
            <Text size="sm" fw={700}>
              {item.qtyUsed}
            </Text>
          </Group>
          <Progress value={(item.qtyUsed / max) * 100} size="sm" radius="sm" />
        </Stack>
      ))}
    </Stack>
  );
};
