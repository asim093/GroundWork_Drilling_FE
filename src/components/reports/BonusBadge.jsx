import { Box, Group, Text } from '@mantine/core';
import { BONUS_ELIGIBILITY } from '../../constants/bonus.js';

export const BonusBadge = ({ eligibility }) => {
  const config = BONUS_ELIGIBILITY[eligibility] || BONUS_ELIGIBILITY['not-available'];

  return (
    <Group gap={7} wrap="nowrap">
      <Box
        w={8}
        h={8}
        style={{
          borderRadius: '50%',
          backgroundColor: `var(--mantine-color-${config.color}-6)`,
          flexShrink: 0
        }}
      />
      <Text size="sm">{config.label}</Text>
    </Group>
  );
};
