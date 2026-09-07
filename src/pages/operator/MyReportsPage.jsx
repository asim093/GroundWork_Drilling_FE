import { useCallback, useEffect, useState } from 'react';
import { Center, Group, Loader, Paper, Stack } from '@mantine/core';
import { KpiGrid } from '../../components/reports/KpiCard.jsx';
import { ReportExportButtons } from '../../components/reports/ReportExportButtons.jsx';
import { ConsumablesReportTable } from '../../components/reports/ConsumablesReportTable.jsx';
import { ReportEntriesTable } from '../../components/reports/ReportEntriesTable.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { currentMonthRange } from '../../lib/dateRange.js';
import { downloadReport, getMyReport } from '../../services/reportService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const bonusValue = (bonus) =>
  bonus && typeof bonus.amount === 'number' ? `$${bonus.amount}` : '—';

const bonusHint = (bonus) => {
  if (!bonus || typeof bonus.amount !== 'number') {
    return bonus?.note || 'No bonus for this period';
  }
  const band = `band ${bonus.band.fromMeters}–${bonus.band.toMeters} m`;
  const rate = bonus.rateType === 'flat' ? 'flat' : `$${bonus.rate}/m`;
  return `${rate} · ${band} · ${bonus.eligibleMeters} eligible m`;
};

const kpiItems = (report) => [
  { label: 'My Total Hours', value: report.totals.totalHours },
  { label: 'My Drilled (m)', value: report.totals.metersDrilled },
  { label: 'My Recovered (m)', value: report.totals.metersRecovered },
  {
    label: 'My Recovery %',
    value: report.recoveryPercentOverall === null ? '—' : `${report.recoveryPercentOverall}%`
  },
  {
    label: 'My Bonus Eligibility',
    value: report.bonusEligibility.eligible,
    hint: `${report.bonusEligibility['not-eligible']} not eligible · ${report.bonusEligibility['not-available']} not available`
  },
  { label: 'My Bonus Amount', value: bonusValue(report.bonus), hint: bonusHint(report.bonus) }
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

  const handleExport = (format) =>
    downloadReport({ scope: 'mine', format, params: { from: range.from, to: range.to } });

  return (
    <Stack gap="xl">
      <Paper withBorder radius="lg" p="lg">
        <Group gap="lg" wrap="wrap" align="center" justify="space-between">
          <DateRangePicker value={range} onChange={setRange} />
          <ReportExportButtons onExport={handleExport} disabled={loading || !report} />
        </Group>
      </Paper>

      {loading || !report ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : (
        <Stack gap="lg">
          <KpiGrid items={kpiItems(report)} />
          <ConsumablesReportTable consumables={report.consumables} />
          <ReportEntriesTable entries={report.entries} showOperator={false} title="My submitted entries" />
        </Stack>
      )}
    </Stack>
  );
};
