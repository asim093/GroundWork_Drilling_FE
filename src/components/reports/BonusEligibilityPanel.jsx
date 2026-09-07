import { Group, Progress, Stack, Text } from '@mantine/core';
import { BonusBadge } from './BonusBadge.jsx';
import {
  BONUS_ELIGIBILITY,
  BONUS_ELIGIBILITY_ORDER,
  BONUS_THRESHOLD
} from '../../constants/bonus.js';

export const BonusEligibilityPanel = ({ counts, compact }) => {
  const total = BONUS_ELIGIBILITY_ORDER.reduce((sum, key) => sum + (counts[key] || 0), 0);

  return (
    <Stack gap="xs">
      <Progress.Root size="xl" radius="sm">
        {BONUS_ELIGIBILITY_ORDER.map((key) => {
          const value = counts[key] || 0;
          if (!value) {
            return null;
          }
          return (
            <Progress.Section
              key={key}
              value={(value / total) * 100}
              color={BONUS_ELIGIBILITY[key].color}
            >
              {value}
            </Progress.Section>
          );
        })}
      </Progress.Root>

      <Group gap="lg" wrap="wrap">
        {BONUS_ELIGIBILITY_ORDER.map((key) => (
          <Group key={key} gap={6} wrap="nowrap">
            <BonusBadge eligibility={key} size="sm" />
            <Text fw={700}>{counts[key] || 0}</Text>
          </Group>
        ))}
      </Group>

      {compact ? null : (
        <Text size="xs" c="dimmed">
          Bonus eligibility is not auto-calculated. It is derived only from a manually entered
          recovery % on a submitted log (eligible at ≥ {BONUS_THRESHOLD}%). &quot;Not available&quot;
          means no recovery % was entered — it is not the same as &quot;not eligible&quot;.
        </Text>
      )}
    </Stack>
  );
};
