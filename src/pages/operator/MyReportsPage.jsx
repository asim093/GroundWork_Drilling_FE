import { useCallback, useEffect, useState } from 'react';
import { Center, Group, Loader, Paper, Stack } from '@mantine/core';
import { KpiGrid } from '../../components/reports/KpiCard.jsx';
import { ConsumablesReportTable } from '../../components/reports/ConsumablesReportTable.jsx';
import { ReportEntriesTable } from '../../components/reports/ReportEntriesTable.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { currentMonthRange } from '../../lib/dateRange.js';
import { getMyReport } from '../../services/reportService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const kpiItems = (report) => [
  { label: 'Billable hours', value: report.totals.billableHours, hint: 'Actual work time — billed to the client' },
  { label: 'Paid hours', value: report.totals.paidHours, hint: 'Full on-site time — what you get paid for' },
  { label: 'Submitted shifts', value: report.entryCount }
];

export const MyReportsPage = () => {
  usePageTitle('My reports');
  const [range, setRange] = useState(currentMonthRange);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(await getMyReport({ from: range.from, to: range.to }));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load your report'));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Stack gap="xl">
      <Paper withBorder radius="lg" p="lg">
        <Group gap="lg" wrap="wrap" align="center" justify="space-between">
          <DateRangePicker value={range} onChange={setRange} />
        </Group>
      </Paper>

      {loading || !report ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : (
        <Stack gap="lg">
          <KpiGrid items={kpiItems(report)} cols={{ base: 1, sm: 3 }} />
          <ConsumablesReportTable consumables={report.consumables} />
          <ReportEntriesTable
            entries={report.entries}
            showManager={false}
            title="My submitted entries"
            entryHref={(entryId) => `/operator/log/${entryId}`}
          />
        </Stack>
      )}
    </Stack>
  );
};
