import { useCallback, useEffect, useState } from 'react';
import {
  Center,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text
} from '@mantine/core';
import { KpiGrid } from '../../components/reports/KpiCard.jsx';
import { ReportExportButtons } from '../../components/reports/ReportExportButtons.jsx';
import { ReportGroupsTable } from '../../components/reports/ReportGroupsTable.jsx';
import { ConsumablesReportTable } from '../../components/reports/ConsumablesReportTable.jsx';
import { ReportEntriesTable } from '../../components/reports/ReportEntriesTable.jsx';
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
import { notifyError } from '../../lib/toast.js';

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'No grouping' },
  { value: 'user', label: 'By user' },
  { value: 'job', label: 'By job' }
];

const kpiItems = (report) => [
  { label: 'Total Hours', value: report.totals.totalHours },
  { label: 'Total Drilled (m)', value: report.totals.metersDrilled },
  { label: 'Total Recovered (m)', value: report.totals.metersRecovered },
  {
    label: 'Overall Recovery %',
    value: report.recoveryPercentOverall === null ? '—' : `${report.recoveryPercentOverall}%`
  },
  {
    label: 'Bonus-Eligible Shifts',
    value: report.bonusEligibility.eligible,
    hint: `${report.bonusEligibility['not-eligible']} not eligible · ${report.bonusEligibility['not-available']} not available`
  },
  { label: 'Total Bonus Amount', value: `$${report.bonusTotalAmount}` }
];

const comparisonKpis = (period) => [
  { label: 'Hours', value: period.totals.totalHours },
  { label: 'Drilled (m)', value: period.totals.metersDrilled },
  { label: 'Recovered (m)', value: period.totals.metersRecovered },
  {
    label: 'Recovery %',
    value: period.recoveryPercentOverall === null ? '—' : `${period.recoveryPercentOverall}%`
  },
  { label: 'Bonus-eligible shifts', value: period.bonusEligibility.eligible },
  { label: 'Bonus amount', value: `$${period.bonusTotalAmount}` }
];

export const ReportsPage = () => {
  usePageTitle('Reports');
  const [range, setRange] = useState(currentMonthRange);
  const [groupBy, setGroupBy] = useState('none');
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(true);
  const [drawerGroup, setDrawerGroup] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const summaryParams = useCallback(() => {
    const params = { from: range.from, to: range.to };
    if (groupBy !== 'none') {
      params.groupBy = groupBy;
    }
    return params;
  }, [range, groupBy]);

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

  const handleExport = (format) =>
    downloadReport({ scope: 'summary', format, params: summaryParams() });

  const openUserDrawer = (group) => {
    setDrawerGroup(group);
    setDrawerOpen(true);
  };

  return (
    <Stack gap="xl">
      <Paper withBorder radius="lg" p="lg">
        <Group gap="lg" wrap="wrap" align="center" justify="space-between">
          <Group gap="lg" wrap="wrap" align="center">
            <DateRangePicker value={range} onChange={setRange} />
            <SegmentedControl data={GROUP_BY_OPTIONS} value={groupBy} onChange={setGroupBy} />
          </Group>
          <ReportExportButtons onExport={handleExport} disabled={loadingSummary || !summary} />
        </Group>
      </Paper>

      {loadingSummary || !summary ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : (
        <Stack gap="lg">
          <KpiGrid items={kpiItems(summary)} />

          {summary.groups?.length ? (
            <ReportGroupsTable
              groups={summary.groups}
              groupBy={summary.groupBy}
              onSelectUser={openUserDrawer}
            />
          ) : null}

          <ConsumablesReportTable consumables={summary.consumables} />

          <ReportEntriesTable entries={summary.entries} showOperator />
        </Stack>
      )}

      <Stack gap="md">
        <Text fw={700} fz="lg">
          Monthly comparison
        </Text>
        {loadingComparison || !comparison ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            {[comparison.current, comparison.previous].map((period) => (
              <Paper key={period.label} withBorder radius="lg" p="lg">
                <Stack gap="md">
                  <Text fw={700}>{period.label}</Text>
                  <KpiGrid items={comparisonKpis(period)} cols={{ base: 2, sm: 3 }} />
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        )}
      </Stack>

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
