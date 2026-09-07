import { Card, SimpleGrid, Stack, Text } from '@mantine/core';
import { BonusEligibilityPanel } from './BonusEligibilityPanel.jsx';
import { ConsumablesList } from './ConsumablesList.jsx';

const Metric = ({ label, value }) => (
  <Stack gap={0}>
    <Text size="xs" c="dimmed" tt="uppercase">
      {label}
    </Text>
    <Text fw={700} fz="lg">
      {value}
    </Text>
  </Stack>
);

export const PeriodSummary = ({ title, summary, compact }) => (
  <Card withBorder radius="md" p="md">
    <Stack gap="md">
      {title ? <Text fw={700}>{title}</Text> : null}

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Metric label="Entries" value={summary.entryCount} />
        <Metric label="Hours on site" value={summary.totals.hoursOnSite} />
        <Metric label="Standby hours" value={summary.totals.standbyHours} />
        <Metric label="Other hours" value={summary.totals.otherHours} />
      </SimpleGrid>

      <Stack gap={4}>
        <Text size="sm" fw={600}>
          Bonus eligibility
        </Text>
        <BonusEligibilityPanel counts={summary.bonusEligibility} compact={compact} />
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={600}>
          Consumables used
        </Text>
        <ConsumablesList consumables={summary.consumables} />
      </Stack>
    </Stack>
  </Card>
);
