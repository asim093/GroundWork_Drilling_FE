import { useCallback, useEffect, useState } from 'react';
import {
  Center,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { PeriodSummary } from '../../components/reports/PeriodSummary.jsx';
import { BonusBadge } from '../../components/reports/BonusBadge.jsx';
import { BonusEligibilityPanel } from '../../components/reports/BonusEligibilityPanel.jsx';
import { ConsumablesList } from '../../components/reports/ConsumablesList.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import { SectionCard } from '../../components/SectionCard.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
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
      <Stack gap="lg">
        <Paper withBorder radius="lg" p="lg">
          <Group gap="lg" wrap="wrap" align="center">
            <DateRangePicker value={range} onChange={setRange} />
            <SegmentedControl data={GROUP_BY_OPTIONS} value={groupBy} onChange={setGroupBy} />
          </Group>
        </Paper>

        {loadingSummary || !summary ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="lg">
              <StatCard label="Submitted entries" value={summary.entryCount} icon="clipboard" color="teal" />
              <StatCard
                label="Hours on site"
                value={summary.totals.hoursOnSite}
                icon="reports"
                color="blue"
              />
              <StatCard
                label="Standby hours"
                value={summary.totals.standbyHours}
                icon="reports"
                color="orange"
              />
              <StatCard
                label="Bonus eligible"
                value={summary.bonusEligibility.eligible}
                hint={`${summary.bonusEligibility['not-eligible']} not eligible · ${summary.bonusEligibility['not-available']} not available`}
                icon="calendar"
                color="green"
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <SectionCard title="Bonus eligibility">
                <BonusEligibilityPanel
                  counts={summary.bonusEligibility}
                  threshold={summary.recoveryThreshold}
                />
              </SectionCard>
              <SectionCard title="Consumables used">
                <ConsumablesList consumables={summary.consumables} />
              </SectionCard>
            </SimpleGrid>

            {summary.groups?.length ? (
              <SectionCard
                title={`Breakdown ${groupBy === 'user' ? 'by user' : 'by job'}`}
              >
                <Table.ScrollContainer minWidth={groupBy === 'user' ? 960 : 720}>
                  <Table verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{groupBy === 'user' ? 'Operator' : 'Job'}</Table.Th>
                        {groupBy === 'user' ? <Table.Th>Employee type</Table.Th> : null}
                        <Table.Th>Entries</Table.Th>
                        <Table.Th>Hours on site</Table.Th>
                        <Table.Th>Standby hours</Table.Th>
                        <Table.Th>Eligible</Table.Th>
                        <Table.Th>Not eligible</Table.Th>
                        <Table.Th>Not available</Table.Th>
                        {groupBy === 'user' ? <Table.Th>Eligible meters</Table.Th> : null}
                        {groupBy === 'user' ? <Table.Th>Bonus</Table.Th> : null}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {summary.groups.map((group) => (
                        <Table.Tr key={group.key}>
                          <Table.Td>{group.label}</Table.Td>
                          {groupBy === 'user' ? (
                            <Table.Td>{group.employeeType || '—'}</Table.Td>
                          ) : null}
                          <Table.Td>{group.entryCount}</Table.Td>
                          <Table.Td>{group.totals.hoursOnSite}</Table.Td>
                          <Table.Td>{group.totals.standbyHours}</Table.Td>
                          <Table.Td>{group.bonusEligibility.eligible}</Table.Td>
                          <Table.Td>{group.bonusEligibility['not-eligible']}</Table.Td>
                          <Table.Td>{group.bonusEligibility['not-available']}</Table.Td>
                          {groupBy === 'user' ? (
                            <Table.Td>{group.bonus?.eligibleMeters ?? 0}</Table.Td>
                          ) : null}
                          {groupBy === 'user' ? (
                            <Table.Td>
                              {group.bonus && group.bonus.amount !== null ? (
                                <Stack gap={0}>
                                  <Text fw={600}>${group.bonus.amount}</Text>
                                  <Text size="xs" c="dimmed">
                                    {group.bonus.rateType === 'flat'
                                      ? `flat · ${group.bonus.band.fromMeters}–${group.bonus.band.toMeters} m`
                                      : `$${group.bonus.rate}/m · ${group.bonus.band.fromMeters}–${group.bonus.band.toMeters} m`}
                                    {group.bonus.aboveTopBand ? ' · above top band' : ''}
                                  </Text>
                                </Stack>
                              ) : (
                                <Text size="sm" c="dimmed">
                                  {group.bonus?.note || 'Not available'}
                                </Text>
                              )}
                            </Table.Td>
                          ) : null}
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </SectionCard>
            ) : null}

            <SectionCard title="Bonus eligibility by entry">
              <Table.ScrollContainer minWidth={900}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Job #</Table.Th>
                      <Table.Th>Operator</Table.Th>
                      <Table.Th>Drilled (m)</Table.Th>
                      <Table.Th>Recovered (m)</Table.Th>
                      <Table.Th>Hours (calc)</Table.Th>
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
                          <Table.Td>{entry.metersDrilled ?? '—'}</Table.Td>
                          <Table.Td>{entry.metersRecovered ?? '—'}</Table.Td>
                          <Table.Td>{entry.totalHours ?? '—'}</Table.Td>
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
                        <Table.Td colSpan={8}>
                          <Text c="dimmed" ta="center" py="md">
                            No submitted entries in this period
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </SectionCard>
          </Stack>
        )}
      </Stack>

      <Stack gap="md">
        <Text fw={700} fz="lg">
          Monthly comparison
        </Text>
        {loadingComparison || !comparison ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <PeriodSummary title={comparison.current.label} summary={comparison.current} compact />
            <PeriodSummary title={comparison.previous.label} summary={comparison.previous} compact />
          </SimpleGrid>
        )}
      </Stack>
    </Stack>
  );
};
