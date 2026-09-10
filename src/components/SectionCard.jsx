import { Group, Paper, Stack, Text } from '@mantine/core';

export const SectionCard = ({ id, title, subtitle, action, children }) => (
  <Paper id={id} withBorder radius="lg" p="lg">
    <Stack gap="md">
      {title || subtitle || action ? (
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          {title || subtitle ? (
            <Stack gap={2}>
              {title ? <Text fw={700}>{title}</Text> : null}
              {subtitle ? (
                <Text size="xs" c="dimmed">
                  {subtitle}
                </Text>
              ) : null}
            </Stack>
          ) : (
            <span />
          )}
          {action}
        </Group>
      ) : null}
      {children}
    </Stack>
  </Paper>
);
