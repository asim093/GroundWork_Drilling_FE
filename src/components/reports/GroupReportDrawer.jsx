import { useEffect, useState } from 'react';
import { Center, Divider, Drawer, Group, Loader, Stack, Text } from '@mantine/core';
import { KpiGrid } from './KpiCard.jsx';
import { ReportEntriesTable } from './ReportEntriesTable.jsx';
import { ReportExportButtons } from './ReportExportButtons.jsx';
import { downloadReport, getReportSummary } from '../../services/reportService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const recoveryPercent = (drilled, recovered) => {
  if (!drilled || drilled <= 0) {
    return null;
  }
  return Math.round((recovered / drilled) * 10000) / 100;
};

const bonusValue = (bonus) =>
  bonus && typeof bonus.amount === 'number' ? `$${bonus.amount}` : '—';

const bonusHint = (bonus) => {
  if (!bonus || typeof bonus.amount !== 'number' || !bonus.band) {
    return bonus?.note || 'No bonus for this period';
  }
  const rate = bonus.rateType === 'flat' ? 'flat' : `$${bonus.rate}/m`;
  return `${rate} · band ${bonus.band.fromMeters}–${bonus.band.toMeters} m · ${bonus.eligibleMeters} eligible m`;
};

const SCOPE_KEY = { employee: 'employee', manager: 'user' };

export const GroupReportDrawer = ({ opened, onClose, group, variant, range }) => {
  const scopeKey = SCOPE_KEY[variant] || 'employee';
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!opened || !group) {
      return;
    }

    setLoading(true);
    getReportSummary({ from: range.from, to: range.to, [scopeKey]: group.key })
      .then((report) => setEntries(report.entries || []))
      .catch((error) => notifyError(extractErrorMessage(error, 'Unable to load this breakdown')))
      .finally(() => setLoading(false));
  }, [opened, group, range, scopeKey]);

  if (!group) {
    return <Drawer opened={opened} onClose={onClose} position="right" size="xl" title="Breakdown" />;
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

  const handleExport = (format) =>
    downloadReport({
      scope: 'summary',
      format,
      params: { from: range.from, to: range.to, [scopeKey]: group.key }
    });

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
            {group.employeeType || 'No type'} · {group.entryCount}{' '}
            {group.entryCount === 1 ? 'shift' : 'shifts'}
          </Text>
        </Stack>
      }
    >
      <Stack gap="lg">
        <Group justify="flex-end">
          <ReportExportButtons onExport={handleExport} />
        </Group>

        <KpiGrid items={kpis} cols={{ base: 2, sm: 3 }} />

        <Divider />

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <ReportEntriesTable
            entries={entries}
            showOperator
            title={variant === 'manager' ? 'Shifts logged by this manager' : "Shifts this employee worked"}
            entryHref={(entryId) => `/admin/time-logs/${entryId}`}
          />
        )}
      </Stack>
    </Drawer>
  );
};
