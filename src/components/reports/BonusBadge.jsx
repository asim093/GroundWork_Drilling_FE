import { Badge } from '@mantine/core';
import { BONUS_ELIGIBILITY } from '../../constants/bonus.js';

export const BonusBadge = ({ eligibility, size }) => {
  const config = BONUS_ELIGIBILITY[eligibility] || BONUS_ELIGIBILITY['not-available'];

  return (
    <Badge color={config.color} variant={config.variant} size={size} radius="sm">
      {config.label}
    </Badge>
  );
};
