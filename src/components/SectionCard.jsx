import { Group, Paper, Stack, Text } from '@mantine/core';

export const SectionCard = ({ title, action, children }) => (
  <Paper withBorder radius="lg" p="lg">
    <Stack gap="md">
      {title || action ? (
        <Group justify="space-between" align="center">
          {title ? <Text fw={700}>{title}</Text> : <span />}
          {action}
        </Group>
      ) : null}
      {children}
    </Stack>
  </Paper>
);
