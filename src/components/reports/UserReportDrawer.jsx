import { useMemo, useRef } from 'react';
import { Divider, Drawer, Group, Stack, Text } from '@mantine/core';
import { KpiGrid } from './KpiCard.jsx';
import { ReportEntriesTable } from './ReportEntriesTable.jsx';
import { ReportExportButtons } from './ReportExportButtons.jsx';
import { ReportCharts } from './ReportCharts.jsx';
import { downloadReport } from '../../services/reportService.js';
import { notifyInfo } from '../../lib/toast.js';

const recoveryPercent = (drilled, recovered) => {
  if (!drilled || drilled <= 0) {
    return null;
  }
  return Math.round((recovered / drilled) * 10000) / 100;
};

const bonusValue = (bonus) => {
  if (!bonus || typeof bonus.amount !== 'number') {
    return '—';
  }
  return `$${bonus.amount}`;
};

const bonusHint = (bonus) => {
  if (!bonus || typeof bonus.amount !== 'number' || !bonus.band) {
    return bonus?.note || 'No bonus for this period';
  }
  if (bonus.rateType === 'flat') {
    return `flat · band ${bonus.band.fromMeters}–${bonus.band.toMeters} m · ${bonus.eligibleMeters} eligible m`;
  }
  return `$${bonus.rate}/m · band ${bonus.band.fromMeters}–${bonus.band.toMeters} m · ${bonus.eligibleMeters} eligible m`;
};

export const UserReportDrawer = ({ opened, onClose, group, entries, range }) => {
  const chartsRef = useRef(null);
  const userEntries = useMemo(
    () => (group ? (entries || []).filter((entry) => entry.userId === group.key) : []),
    [group, entries]
  );

  if (!group) {
    return <Drawer opened={opened} onClose={onClose} position="right" size="xl" title="Manager report" />;
  }

  const rec = recoveryPercent(group.totals.metersDrilled, group.totals.metersRecovered);
  const kpis = [
    { label: 'Hours', value: group.totals.totalLoggedHours },
    { label: 'Drilled (m)', value: group.totals.metersDrilled },
    { label: 'Recovered (m)', value: group.totals.metersRecovered },
    { label: 'Recovery %', value: rec === null ? '—' : `${rec}%` },
    {
      label: 'Bonus eligible',
      value: group.bonusEligibility.eligible,
      hint: `${group.bonusEligibility['not-eligible']} not eligible · ${group.bonusEligibility['not-available']} not available`
    },
    { label: 'Bonus amount', value: bonusValue(group.bonus), hint: bonusHint(group.bonus) }
  ];

  const handleExport = async (format) => {
    let charts;
    if (format === 'pdf' && chartsRef.current) {
      try {
        charts = await chartsRef.current.capture();
      } catch {
        notifyInfo('Charts could not be added to the PDF; exporting without them');
      }
    }
    return downloadReport({
      scope: 'summary',
      format,
      params: { from: range.from, to: range.to, user: group.key, groupBy: 'user' },
      charts
    });
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="xl"
      title={
        <Stack gap={0}>
          <Text fw={700} fz="lg">
            {group.label}
          </Text>
          <Text size="xs" c="dimmed">
            {group.employeeType || 'No employee type'} · {group.entryCount} submitted{' '}
            {group.entryCount === 1 ? 'entry' : 'entries'}
          </Text>
        </Stack>
      }
    >
      <Stack gap="lg">
        <Group justify="flex-end">
          <ReportExportButtons onExport={handleExport} />
        </Group>

        <KpiGrid items={kpis} cols={{ base: 2, sm: 3 }} />

        <ReportCharts
          ref={chartsRef}
          mode="none"
          entries={userEntries}
          eligibility={group.bonusEligibility}
          recoveryPercent={rec}
        />

        <Divider />

        <ReportEntriesTable
          entries={userEntries}
          showOperator={false}
          title="This manager's submitted entries"
          entryHref={(entryId) => `/admin/time-logs/${entryId}`}
        />
      </Stack>
    </Drawer>
  );
};
