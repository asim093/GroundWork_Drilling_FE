import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Center,
  Group,
  Loader,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { PeriodSummary } from '../../components/reports/PeriodSummary.jsx';
import { BonusBadge } from '../../components/reports/BonusBadge.jsx';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { currentMonthRange, formatDate } from '../../lib/dateRange.js';
import { getMonthlyComparison, getReportSummary } from '../../services/reportService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'No grouping' },
  { value: 'user', label: 'By user' },
  { value: 'job', label: 'By job' }
];

export const ReportsPage = () => {
  usePageTitle('Reports');
  const [range, setRange] = useState(currentMonthRange);
  const [groupBy, setGroupBy] = useState('none');
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);

    try {
      const params = { from: range.from, to: range.to };
      if (groupBy !== 'none') {
        params.groupBy = groupBy;
      }
      setSummary(await getReportSummary(params));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the report summary'));
    } finally {
      setLoadingSummary(false);
    }
  }, [range, groupBy]);

  const loadComparison = useCallback(async () => {
    setLoadingComparison(true);

    try {
      setComparison(await getMonthlyComparison({}));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the monthly comparison'));
    } finally {
      setLoadingComparison(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  return (
    <Stack gap="xl">
      <Stack gap="md">
        <Card withBorder radius="md" p="md">
          <Group gap="sm" wrap="wrap" align="flex-end">
            <TextInput
              label="From"
              type="date"
              value={range.from}
              onChange={(event) => setRange((prev) => ({ ...prev, from: event.currentTarget.value }))}
              w={160}
            />
            <TextInput
              label="To"
              type="date"
              value={range.to}
              onChange={(event) => setRange((prev) => ({ ...prev, to: event.currentTarget.value }))}
              w={160}
            />
            <Stack gap={4}>
              <Text size="sm" fw={500}>
                Group by
              </Text>
              <SegmentedControl data={GROUP_BY_OPTIONS} value={groupBy} onChange={setGroupBy} />
            </Stack>
          </Group>
        </Card>

        {loadingSummary || !summary ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <Stack gap="md">
            <PeriodSummary title="Selected period totals" summary={summary} />

            {summary.groups?.length ? (
              <Card withBorder radius="md" p="md">
                <Stack gap="sm">
                  <Text fw={700}>Breakdown {groupBy === 'user' ? 'by user' : 'by job'}</Text>
                  <Table.ScrollContainer minWidth={720}>
                    <Table verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{groupBy === 'user' ? 'Operator' : 'Job'}</Table.Th>
                          <Table.Th>Entries</Table.Th>
                          <Table.Th>Hours on site</Table.Th>
                          <Table.Th>Standby hours</Table.Th>
                          <Table.Th>Eligible</Table.Th>
                          <Table.Th>Not eligible</Table.Th>
                          <Table.Th>Not available</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {summary.groups.map((group) => (
                          <Table.Tr key={group.key}>
                            <Table.Td>{group.label}</Table.Td>
                            <Table.Td>{group.entryCount}</Table.Td>
                            <Table.Td>{group.totals.hoursOnSite}</Table.Td>
                            <Table.Td>{group.totals.standbyHours}</Table.Td>
                            <Table.Td>{group.bonusEligibility.eligible}</Table.Td>
                            <Table.Td>{group.bonusEligibility['not-eligible']}</Table.Td>
                            <Table.Td>{group.bonusEligibility['not-available']}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </Card>
            ) : null}

            <Card withBorder radius="md" p="md">
              <Stack gap="sm">
                <Text fw={700}>Bonus eligibility by entry</Text>
                <Table.ScrollContainer minWidth={640}>
                  <Table verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Job #</Table.Th>
                        <Table.Th>Operator</Table.Th>
                        <Table.Th>Recovery %</Table.Th>
                        <Table.Th>Eligibility</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {summary.entries.length ? (
                        summary.entries.map((entry) => (
                          <Table.Tr key={entry.entryId}>
                            <Table.Td>{formatDate(entry.date)}</Table.Td>
                            <Table.Td>{entry.jobNumber || '—'}</Table.Td>
                            <Table.Td>{entry.operator || '—'}</Table.Td>
                            <Table.Td>
                              {entry.recoveryPercent === null ? (
                                <Text c="dimmed" size="sm">
                                  Not entered
                                </Text>
                              ) : (
                                `${entry.recoveryPercent}%`
                              )}
                            </Table.Td>
                            <Table.Td>
                              <BonusBadge eligibility={entry.eligibility} size="sm" />
                            </Table.Td>
                          </Table.Tr>
                        ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={5}>
                            <Text c="dimmed" ta="center" py="md">
                              No submitted entries in this period
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>

      <Stack gap="md">
        <Title order={4}>Monthly comparison</Title>
        {loadingComparison || !comparison ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <PeriodSummary title={comparison.current.label} summary={comparison.current} compact />
            <PeriodSummary title={comparison.previous.label} summary={comparison.previous} compact />
          </SimpleGrid>
        )}
      </Stack>
    </Stack>
  );
};
