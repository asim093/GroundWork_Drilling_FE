import { useCallback, useEffect, useState } from 'react';
import { Center, Group, Loader, Paper, SegmentedControl, Stack, Tabs, Text } from '@mantine/core';
import { ReportExportButtons } from '../../components/reports/ReportExportButtons.jsx';
import { ClientHoursTable } from '../../components/reports/ClientHoursTable.jsx';
import { PersonHoursTable } from '../../components/reports/PersonHoursTable.jsx';
import { LedgerReportTable } from '../../components/reports/LedgerReportTable.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { currentMonthRange } from '../../lib/dateRange.js';
import {
  downloadReport,
  getConsumablesReport,
  getFuelReport,
  getHoursReport
} from '../../services/reportService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const HOURS_SCOPE_OPTIONS = [
  { value: 'client', label: 'By client' },
  { value: 'employee', label: 'By employee' },
  { value: 'manager', label: 'By manager' }
];

const toConsumablesRows = (items) =>
  (items || []).map((item) => ({
    key: item.itemName,
    label: item.itemName,
    total: item.totalQtyUsed,
    jobs: (item.jobs || []).map((job) => ({ jobId: job.jobId, label: job.label, qty: job.qtyUsed }))
  }));

const toFuelRows = (byType) =>
  (byType || []).map((type) => ({
    key: type.type,
    label: type.type,
    total: `${type.totalLt} L`,
    jobs: (type.jobs || []).map((job) => ({ jobId: job.jobId, label: job.label, qty: `${job.qtyLt} L` }))
  }));

const MonthlyConsumables = ({ monthly }) =>
  monthly?.length ? (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Text fw={700}>Monthly breakdown</Text>
        {monthly.map((month) => (
          <Stack key={month.key} gap={4}>
            <Text fw={600} size="sm">
              {month.label}
            </Text>
            {month.items.length ? (
              month.items.map((item) => (
                <Group key={item.itemName} justify="space-between" py={2}>
                  <Text size="sm" c="dimmed">
                    {item.itemName}
                  </Text>
                  <Text size="sm" fw={600}>
                    {item.qtyUsed}
                  </Text>
                </Group>
              ))
            ) : (
              <Text size="sm" c="dimmed">
                No consumables recorded.
              </Text>
            )}
          </Stack>
        ))}
      </Stack>
    </Paper>
  ) : null;

const MonthlyFuel = ({ monthly }) =>
  monthly?.length ? (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Text fw={700}>Monthly breakdown</Text>
        {monthly.map((month) => (
          <Stack key={month.key} gap={4}>
            <Group justify="space-between">
              <Text fw={600} size="sm">
                {month.label}
              </Text>
              <Text fw={700} size="sm">
                {month.totalLt} L
              </Text>
            </Group>
            {month.byType.map((type) => (
              <Group key={type.type} justify="space-between" py={2} pl="md">
                <Text size="sm" c="dimmed">
                  {type.type}
                </Text>
                <Text size="sm">{type.totalLt} L</Text>
              </Group>
            ))}
          </Stack>
        ))}
      </Stack>
    </Paper>
  ) : null;

const HoursTab = ({ range }) => {
  const [scope, setScope] = useState('client');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(await getHoursReport({ from: range.from, to: range.to, scope }));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the hours report'));
    } finally {
      setLoading(false);
    }
  }, [range, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format) => downloadReport({ report: 'hours', format, params: { from: range.from, to: range.to, scope } });

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <SegmentedControl
          data={HOURS_SCOPE_OPTIONS}
          value={scope}
          onChange={setScope}
          size="sm"
          radius="sm"
          style={{ border: '1px solid var(--mantine-color-gray-3)' }}
        />
        <ReportExportButtons onExport={handleExport} disabled={loading || !report} size="sm" radius="sm" />
      </Group>

      <Text size="xs" c="dimmed">
        Billable hours = actual work time (Time Started/Finished), billed to the client. Paid hours
        = full on-site time (Time In/Out), what employees are paid for — paid hours is always ≥
        billable hours.
      </Text>

      {loading || !report ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : scope === 'client' ? (
        <ClientHoursTable jobs={report.jobs} totals={report.totals} />
      ) : scope === 'employee' ? (
        <PersonHoursTable people={report.employees} title="Hours by employee" personLabel="Employee" showType />
      ) : (
        <PersonHoursTable people={report.managers} title="Hours by manager" personLabel="Manager" showType={false} />
      )}
    </Stack>
  );
};

const ConsumablesTab = ({ range }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(await getConsumablesReport({ from: range.from, to: range.to }));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the consumables report'));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format) => downloadReport({ report: 'consumables', format, params: { from: range.from, to: range.to } });

  return (
    <Stack gap="lg">
      <Group justify="flex-end">
        <ReportExportButtons onExport={handleExport} disabled={loading || !report} size="sm" radius="sm" />
      </Group>

      {loading || !report ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : (
        <Stack gap="lg">
          <LedgerReportTable
            items={toConsumablesRows(report.items)}
            title="Consumables used"
            itemColumnLabel="Item"
            totalColumnLabel="Total qty used"
            emptyLabel="No consumables recorded in this period"
          />
          <MonthlyConsumables monthly={report.monthly} />
        </Stack>
      )}
    </Stack>
  );
};

const FuelTab = ({ range }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(await getFuelReport({ from: range.from, to: range.to }));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the fuel report'));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format) => downloadReport({ report: 'fuel', format, params: { from: range.from, to: range.to } });

  return (
    <Stack gap="lg">
      <Group justify="flex-end">
        <ReportExportButtons onExport={handleExport} disabled={loading || !report} size="sm" radius="sm" />
      </Group>

      {loading || !report ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : (
        <Stack gap="lg">
          <LedgerReportTable
            items={toFuelRows(report.byType)}
            title="Fuel used"
            itemColumnLabel="Fuel type"
            totalColumnLabel="Total litres"
            emptyLabel="No fuel recorded in this period"
          />
          <MonthlyFuel monthly={report.monthly} />
        </Stack>
      )}
    </Stack>
  );
};

export const ReportsPage = () => {
  usePageTitle('Reports');
  const [range, setRange] = useState(currentMonthRange);

  return (
    <Stack gap="xl">
      <Paper withBorder radius="lg" p="lg">
        <DateRangePicker value={range} onChange={setRange} size="sm" radius="sm" />
      </Paper>

      <Tabs defaultValue="hours" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="hours">Hours</Tabs.Tab>
          <Tabs.Tab value="consumables">Consumables</Tabs.Tab>
          <Tabs.Tab value="fuel">Fuel</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="hours" pt="md">
          <HoursTab range={range} />
        </Tabs.Panel>
        <Tabs.Panel value="consumables" pt="md">
          <ConsumablesTab range={range} />
        </Tabs.Panel>
        <Tabs.Panel value="fuel" pt="md">
          <FuelTab range={range} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
