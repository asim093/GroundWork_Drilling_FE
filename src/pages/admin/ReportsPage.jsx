import { useCallback, useEffect, useState } from 'react';
import {
  Center,
  Group,
  Loader,
  Paper,
  Select,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  Tooltip
} from '@mantine/core';
import { ReportExportButtons } from '../../components/reports/ReportExportButtons.jsx';
import { ClientHoursTable } from '../../components/reports/ClientHoursTable.jsx';
import { PersonHoursTable } from '../../components/reports/PersonHoursTable.jsx';
import { LedgerReportTable } from '../../components/reports/LedgerReportTable.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
import { NavIcon } from '../../components/NavIcon.jsx';
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

const HoursTab = ({ range, client }) => {
  const [scope, setScope] = useState('client');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(await getHoursReport({ from: range.from, to: range.to, scope, client: client || undefined }));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the hours report'));
    } finally {
      setLoading(false);
    }
  }, [range, scope, client]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format) =>
    downloadReport({ report: 'hours', format, params: { from: range.from, to: range.to, scope, client: client || undefined } });

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="xs" wrap="wrap">
          <SegmentedControl
            data={HOURS_SCOPE_OPTIONS}
            value={scope}
            onChange={setScope}
            size="sm"
            radius="sm"
            style={{ border: '1px solid var(--mantine-color-gray-3)' }}
          />
          <Tooltip
            multiline
            w={260}
            label="Billable hours = actual work time (Time Started/Finished), billed to the client. Paid hours = full on-site time (Time In/Out), what employees are paid for — always ≥ billable hours."
          >
            <Group gap={4} c="dimmed" style={{ cursor: 'help' }}>
              <NavIcon name="info" size={15} />
              <Text size="xs">Billable vs paid?</Text>
            </Group>
          </Tooltip>
        </Group>
        <ReportExportButtons onExport={handleExport} disabled={loading || !report} size="sm" radius="sm" />
      </Group>

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

const ConsumablesTab = ({ range, client }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(await getConsumablesReport({ from: range.from, to: range.to, client: client || undefined }));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the consumables report'));
    } finally {
      setLoading(false);
    }
  }, [range, client]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format) =>
    downloadReport({ report: 'consumables', format, params: { from: range.from, to: range.to, client: client || undefined } });

  return (
    <Stack gap="md">
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

const FuelTab = ({ range, client }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(await getFuelReport({ from: range.from, to: range.to, client: client || undefined }));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the fuel report'));
    } finally {
      setLoading(false);
    }
  }, [range, client]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format) =>
    downloadReport({ report: 'fuel', format, params: { from: range.from, to: range.to, client: client || undefined } });

  return (
    <Stack gap="md">
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
  const [tab, setTab] = useState('hours');
  const [range, setRange] = useState(currentMonthRange);
  const [client, setClient] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);

  useEffect(() => {
    getHoursReport({ from: range.from, to: range.to, scope: 'client' })
      .then((report) => {
        const names = [...new Set((report.jobs || []).map((job) => job.clientName).filter(Boolean))].sort();
        setClientOptions(names.map((name) => ({ value: name, label: name })));
      })
      .catch(() => setClientOptions([]));
  }, [range]);

  return (
    <Tabs value={tab} onChange={setTab} keepMounted={false}>
      <Stack gap="lg">
        <Paper withBorder radius="lg" p="md">
          <Group justify="space-between" wrap="wrap" gap="md">
            <Tabs.List>
              <Tabs.Tab value="hours">Hours</Tabs.Tab>
              <Tabs.Tab value="consumables">Consumables</Tabs.Tab>
              <Tabs.Tab value="fuel">Fuel</Tabs.Tab>
            </Tabs.List>
            <Group gap="sm" wrap="wrap">
              <Select
                placeholder="All clients"
                data={clientOptions}
                value={client}
                onChange={setClient}
                clearable
                size="sm"
                radius="sm"
                searchable
                w={220}
              />
              <DateRangePicker value={range} onChange={setRange} size="sm" radius="sm" />
            </Group>
          </Group>
        </Paper>

        <Tabs.Panel value="hours">
          <HoursTab range={range} client={client} />
        </Tabs.Panel>
        <Tabs.Panel value="consumables">
          <ConsumablesTab range={range} client={client} />
        </Tabs.Panel>
        <Tabs.Panel value="fuel">
          <FuelTab range={range} client={client} />
        </Tabs.Panel>
      </Stack>
    </Tabs>
  );
};
