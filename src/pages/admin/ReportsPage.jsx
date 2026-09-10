import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Badge,
  Card,
  Center,
  CloseButton,
  Divider,
  Grid,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { ReportExportButtons } from '../../components/reports/ReportExportButtons.jsx';
import { ReportGroupsTable } from '../../components/reports/ReportGroupsTable.jsx';
import { ConsumablesReportTable } from '../../components/reports/ConsumablesReportTable.jsx';
import { ReportEntriesTable } from '../../components/reports/ReportEntriesTable.jsx';
import { ReportCharts } from '../../components/reports/ReportCharts.jsx';
import { UserReportDrawer } from '../../components/reports/UserReportDrawer.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { currentMonthRange } from '../../lib/dateRange.js';
import {
  downloadReport,
  getMonthlyComparison,
  getReportSummary
} from '../../services/reportService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifyInfo } from '../../lib/toast.js';

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'No grouping' },
  { value: 'user', label: 'By user' },
  { value: 'job', label: 'By job' }
];

const COMPARISON_METRICS = [
  { key: 'totalLoggedHours', label: 'Hours' },
  { key: 'metersDrilled', label: 'Drilled (m)' },
  { key: 'metersRecovered', label: 'Recovered (m)' }
];

const fmt = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value !== 'number') {
    return value;
  }
  return Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const recoveryColor = (value, threshold) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  return value >= threshold ? 'green.7' : 'red.7';
};

const CompactStat = ({ label, value, hint }) => (
  <Group justify="space-between" wrap="nowrap" gap="md" py="sm">
    <Text fz="sm" c="dimmed">
      {label}
    </Text>
    <Group gap="sm" wrap="nowrap" align="baseline">
      {hint ? (
        <Text fz="xs" c="dimmed" visibleFrom="sm">
          {hint}
        </Text>
      ) : null}
      <Text fz="sm" fw={700}>
        {value}
      </Text>
    </Group>
  </Group>
);

const SummaryStats = ({ report }) => {
  const recovery = report.recoveryPercentOverall;

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper radius="lg" p="xl" h="100%" bg="var(--mantine-color-brand-6)" c="white">
          <Stack gap={4} h="100%" justify="center">
            <Text fz="sm" fw={600} style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Total bonus amount
            </Text>
            <Text fz={40} fw={800} lh={1.1}>
              ${fmt(report.bonusTotalAmount)}
            </Text>
            <Text fz="xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Across {fmt(report.entryCount)} submitted{' '}
              {report.entryCount === 1 ? 'entry' : 'entries'}
            </Text>
          </Stack>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 8 }}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" h="100%">
          <Paper withBorder radius="lg" p="lg" h="100%">
            <Stack gap={6}>
              <Text fz="sm" c="dimmed" fw={600}>
                Overall recovery
              </Text>
              <Text
                fz={30}
                fw={700}
                lh={1.1}
                c={recoveryColor(recovery, report.recoveryThreshold)}
              >
                {recovery === null || recovery === undefined ? '—' : `${fmt(recovery)}%`}
              </Text>
              <Text fz="xs" c="dimmed">
                Bonus threshold {fmt(report.recoveryThreshold)}%
              </Text>
            </Stack>
          </Paper>

          <Paper withBorder radius="lg" p="lg" h="100%">
            <Stack gap={6}>
              <Text fz="sm" c="dimmed" fw={600}>
                Total hours logged
              </Text>
              <Text fz={30} fw={700} lh={1.1}>
                {fmt(report.totals.totalLoggedHours)}
              </Text>
              <Text fz="xs" c="dimmed">
                On-site, standby &amp; other
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Grid.Col>

      <Grid.Col span={12}>
        <Paper withBorder radius="lg" px="lg" py={4}>
          <CompactStat label="Total drilled" value={`${fmt(report.totals.metersDrilled)} m`} />
          <Divider />
          <CompactStat
            label="Total recovered"
            value={`${fmt(report.totals.metersRecovered)} m`}
          />
          <Divider />
          <CompactStat
            label="Bonus-eligible shifts"
            value={fmt(report.bonusEligibility.eligible)}
            hint={`${fmt(report.bonusEligibility['not-eligible'])} not eligible · ${fmt(
              report.bonusEligibility['not-available']
            )} not available`}
          />
        </Paper>
      </Grid.Col>
    </Grid>
  );
};

const TrendArrow = ({ direction }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ display: 'block', transform: direction === 'down' ? 'rotate(180deg)' : 'none' }}
  >
    <polyline points="6 14 12 8 18 14" />
  </svg>
);

const ComparisonChange = ({ current, previous }) => {
  const comparable = typeof previous === 'number' && previous !== 0 && typeof current === 'number';

  if (!comparable) {
    return (
      <Text fz="sm" c="dimmed">
        —
      </Text>
    );
  }

  const pct = ((current - previous) / previous) * 100;

  if (Math.abs(pct) < 0.05) {
    return (
      <Text fz="sm" c="dimmed">
        No change
      </Text>
    );
  }

  const up = pct > 0;

  return (
    <Group gap={4} wrap="nowrap" justify="flex-end" c={up ? 'green.7' : 'red.7'}>
      <TrendArrow direction={up ? 'up' : 'down'} />
      <Text fz="sm" fw={600} c="inherit">
        {Math.abs(pct).toFixed(1)}%
      </Text>
    </Group>
  );
};

const MonthlyComparison = ({ comparison, loading, failed }) => {
  const current = comparison?.current;
  const previous = comparison?.previous;
  const ready = Boolean(current?.totals && previous?.totals);

  return (
    <Card withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Stack gap={2}>
          <Text fw={700}>Monthly comparison</Text>
          <Text fz="xs" c="dimmed">
            {ready ? `${previous.label} vs ${current.label}` : 'Current month vs previous month'}
          </Text>
        </Stack>

        {loading ? (
          <Center py="lg">
            <Loader size="sm" />
          </Center>
        ) : !ready ? (
          <Text c="dimmed" size="sm" py="xs">
            {failed
              ? 'Comparison data could not be loaded right now.'
              : 'Not enough history yet to compare months.'}
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={460}>
            <Table verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Metric</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{current.label}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{previous.label}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Change</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {COMPARISON_METRICS.map((metric) => {
                  const cur = current.totals[metric.key];
                  const prev = previous.totals[metric.key];

                  return (
                    <Table.Tr key={metric.key}>
                      <Table.Td>{metric.label}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }} fw={600}>
                        {fmt(cur)}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }} c="dimmed">
                        {fmt(prev)}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <ComparisonChange current={cur} previous={prev} />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>
    </Card>
  );
};

export const ReportsPage = () => {
  usePageTitle('Reports');
  const [searchParams, setSearchParams] = useSearchParams();
  const jobFilter = searchParams.get('job') || null;
  const [range, setRange] = useState(currentMonthRange);
  const [groupBy, setGroupBy] = useState('none');
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(true);
  const [comparisonFailed, setComparisonFailed] = useState(false);
  const [drawerGroup, setDrawerGroup] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const chartsRef = useRef(null);

  const summaryParams = useCallback(() => {
    const params = { from: range.from, to: range.to };
    if (groupBy !== 'none') {
      params.groupBy = groupBy;
    }
    if (jobFilter) {
      params.job = jobFilter;
    }
    return params;
  }, [range, groupBy, jobFilter]);

  const clearJobFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('job');
    setSearchParams(next, { replace: true });
  };

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);

    try {
      setSummary(await getReportSummary(summaryParams()));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the report summary'));
    } finally {
      setLoadingSummary(false);
    }
  }, [summaryParams]);

  const loadComparison = useCallback(async () => {
    setLoadingComparison(true);
    setComparisonFailed(false);

    try {
      setComparison(await getMonthlyComparison({}));
    } catch (error) {
      setComparisonFailed(true);
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

  const handleExport = async (format) => {
    let charts;
    if (format === 'pdf' && chartsRef.current) {
      try {
        charts = await chartsRef.current.capture();
      } catch {
        notifyInfo('Charts could not be added to the PDF; exporting without them');
      }
    }
    return downloadReport({ scope: 'summary', format, params: summaryParams(), charts });
  };

  const openUserDrawer = (group) => {
    setDrawerGroup(group);
    setDrawerOpen(true);
  };

  return (
    <Stack gap="xl">
      <Paper withBorder radius="lg" p="lg">
        <Stack gap="sm">
          <Group gap="sm" wrap="wrap" align="center" justify="space-between">
            <Group gap="sm" wrap="wrap" align="center">
              <DateRangePicker value={range} onChange={setRange} size="sm" radius="sm" />
              <SegmentedControl
                data={GROUP_BY_OPTIONS}
                value={groupBy}
                onChange={setGroupBy}
                size="sm"
                radius="sm"
                style={{ border: '1px solid var(--mantine-color-gray-3)' }}
              />
            </Group>
            <ReportExportButtons
              onExport={handleExport}
              disabled={loadingSummary || !summary}
              size="sm"
              radius="sm"
            />
          </Group>
          {jobFilter ? (
            <Group gap={6}>
              <Badge
                variant="light"
                size="lg"
                rightSection={<CloseButton size="xs" onClick={clearJobFilter} aria-label="Clear job filter" />}
              >
                {summary?.scope || 'Filtered to one job'}
              </Badge>
            </Group>
          ) : null}
        </Stack>
      </Paper>

      {loadingSummary || !summary ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : (
        <Stack gap="lg">
          <SummaryStats report={summary} />

          <ReportCharts
            ref={chartsRef}
            visible={false}
            mode={summary.groupBy || 'none'}
            entries={summary.entries}
            eligibility={summary.bonusEligibility}
            recoveryPercent={summary.recoveryPercentOverall}
          />

          {summary.groups?.length ? (
            <ReportGroupsTable
              groups={summary.groups}
              groupBy={summary.groupBy}
              onSelectUser={openUserDrawer}
            />
          ) : null}

          <ConsumablesReportTable consumables={summary.consumables} />

          <ReportEntriesTable
            entries={summary.entries}
            showOperator
            entryHref={(entryId) => `/admin/time-logs/${entryId}`}
          />

          <MonthlyComparison
            comparison={comparison}
            loading={loadingComparison}
            failed={comparisonFailed}
          />
        </Stack>
      )}

      <UserReportDrawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        group={drawerGroup}
        entries={summary?.entries}
        range={range}
      />
    </Stack>
  );
};
