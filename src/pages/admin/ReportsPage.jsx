import { useCallback, useEffect, useRef, useState } from 'react';
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
import { MobileFilterDrawer } from '../../components/list/MobileFilterDrawer.jsx';
import { NavIcon } from '../../components/NavIcon.jsx';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { currentMonthRange } from '../../lib/dateRange.js';
import {
  downloadReport,
  getConsumablesReport,
  getFuelReport,
  getHoursReport
} from '../../services/reportService.js';
import { employeesService } from '../../services/masterDataService.js';
import { listUsers } from '../../services/userService.js';
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

const BillableVsPaidHint = () => (
  <Tooltip
    multiline
    w={260}
    label="Billable hours = actual work time (Time Started/Finished), billed to the client. Paid hours = full on-site time (Time In/Out), what employees are paid for — always ≥ billable hours."
  >
    <Group gap={4} c="dimmed" style={{ cursor: 'help' }} hiddenFrom="sm">
      <NavIcon name="info" size={15} />
      <Text size="xs">Billable vs paid?</Text>
    </Group>
  </Tooltip>
);

const HoursTab = ({ range, client, job, employee, manager }) => {
  const [scope, setScope] = useState('client');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(
        await getHoursReport({
          from: range.from,
          to: range.to,
          scope,
          client: client || undefined,
          job: job || undefined,
          employee: employee || undefined,
          user: manager || undefined
        })
      );
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the hours report'));
    } finally {
      setLoading(false);
    }
  }, [range, scope, client, job, employee, manager]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format) =>
    downloadReport({
      report: 'hours',
      format,
      params: {
        from: range.from,
        to: range.to,
        scope,
        client: client || undefined,
        job: job || undefined,
        employee: employee || undefined,
        user: manager || undefined
      }
    });

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap" gap="xs" visibleFrom="sm">
        <Group gap="xs" wrap="wrap">
          <SegmentedControl
            data={HOURS_SCOPE_OPTIONS}
            value={scope}
            onChange={setScope}
            size="sm"
            radius="sm"
            style={{ border: '1px solid var(--mantine-color-gray-3)' }}
          />
          <BillableVsPaidHint />
        </Group>
        <ReportExportButtons onExport={handleExport} disabled={loading || !report} size="sm" radius="sm" />
      </Group>

      <Stack gap="xs" hiddenFrom="sm">
        <SegmentedControl
          data={HOURS_SCOPE_OPTIONS}
          value={scope}
          onChange={setScope}
          size="sm"
          radius="sm"
          fullWidth
          style={{ border: '1px solid var(--mantine-color-gray-3)' }}
        />
        <Group justify="flex-end">
          <ReportExportButtons onExport={handleExport} disabled={loading || !report} size="sm" radius="sm" />
        </Group>
      </Stack>

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

const ConsumablesTab = ({ range, client, job, employee, manager }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(
        await getConsumablesReport({
          from: range.from,
          to: range.to,
          client: client || undefined,
          job: job || undefined,
          employee: employee || undefined,
          user: manager || undefined
        })
      );
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the consumables report'));
    } finally {
      setLoading(false);
    }
  }, [range, client, job, employee, manager]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format) =>
    downloadReport({
      report: 'consumables',
      format,
      params: {
        from: range.from,
        to: range.to,
        client: client || undefined,
        job: job || undefined,
        employee: employee || undefined,
        user: manager || undefined
      }
    });

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

const FuelTab = ({ range, client, job, employee, manager }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setReport(
        await getFuelReport({
          from: range.from,
          to: range.to,
          client: client || undefined,
          job: job || undefined,
          employee: employee || undefined,
          user: manager || undefined
        })
      );
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the fuel report'));
    } finally {
      setLoading(false);
    }
  }, [range, client, job, employee, manager]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format) =>
    downloadReport({
      report: 'fuel',
      format,
      params: {
        from: range.from,
        to: range.to,
        client: client || undefined,
        job: job || undefined,
        employee: employee || undefined,
        user: manager || undefined
      }
    });

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
  const [job, setJob] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [manager, setManager] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsListRef = useRef(null);
  const scrollCheckTimeoutRef = useRef(null);

  // Check and update scroll state
  const updateScrollState = () => {
    if (!tabsListRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current;
    const tolerance = 5; // pixels

    // Can scroll left if scrollLeft > 0
    setCanScrollLeft(scrollLeft > tolerance);

    // Can scroll right if there's more content beyond visible area
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - tolerance);
  };

  // Auto-scroll active tab into view and update scroll state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tabsListRef.current) {
        const activeTabElement = tabsListRef.current.querySelector('[role="tab"][aria-selected="true"]');
        if (activeTabElement) {
          activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
        updateScrollState();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [tab]);

  // Handle scroll events
  const handleTabsScroll = () => {
    if (scrollCheckTimeoutRef.current) clearTimeout(scrollCheckTimeoutRef.current);
    scrollCheckTimeoutRef.current = setTimeout(updateScrollState, 100);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    updateScrollState(); // Initial check
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollCheckTimeoutRef.current) clearTimeout(scrollCheckTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    getHoursReport({ from: range.from, to: range.to, scope: 'client', client: client || undefined })
      .then((report) => {
        const jobs = report.jobs || [];
        if (!client) {
          const names = [...new Set(jobs.map((j) => j.clientName).filter(Boolean))].sort();
          setClientOptions(names.map((name) => ({ value: name, label: name })));
        }
        setJobOptions(
          jobs.map((j) => ({ value: j.jobId, label: `${j.jobNumber || '—'} — ${j.clientName || 'Unknown'}` }))
        );
      })
      .catch(() => {
        if (!client) {
          setClientOptions([]);
        }
        setJobOptions([]);
      });
  }, [range, client]);

  useEffect(() => {
    setJob(null);
  }, [client]);

  useEffect(() => {
    employeesService
      .list({ active: 'true', limit: 200, sort: 'name', order: 'asc' })
      .then((response) =>
        setEmployeeOptions((response.data || []).map((e) => ({ value: e.id, label: e.name })))
      )
      .catch(() => setEmployeeOptions([]));
    listUsers({ role: 'operator', active: 'true', limit: 200, sort: 'name', order: 'asc' })
      .then((response) =>
        setManagerOptions((response.data || []).map((u) => ({ value: u.id, label: u.name })))
      )
      .catch(() => setManagerOptions([]));
  }, []);

  const filterFields = (
    <>
      <Select
        label="Client"
        placeholder="All clients"
        data={clientOptions}
        value={client}
        onChange={setClient}
        clearable
        searchable
      />
      <Select
        label="Job"
        placeholder="All jobs"
        data={jobOptions}
        value={job}
        onChange={setJob}
        clearable
        searchable
      />
      <Select
        label="Employee"
        placeholder="All employees"
        data={employeeOptions}
        value={employee}
        onChange={setEmployee}
        clearable
        searchable
      />
      <Select
        label="Manager"
        placeholder="All managers"
        data={managerOptions}
        value={manager}
        onChange={setManager}
        clearable
        searchable
      />
    </>
  );

  return (
    <Tabs value={tab} onChange={setTab} keepMounted={false}>
      <Stack gap="lg">
        <Paper withBorder radius="lg" p="md">
          <Stack gap="md">
            <Group justify="space-between" wrap="nowrap" align="center" gap="sm" style={{ flex: 1 }}>
              <Tabs.List
                ref={tabsListRef}
                onScroll={handleTabsScroll}
                className={`${canScrollLeft ? 'has-scroll-left' : ''} ${canScrollRight ? 'has-scroll-right' : ''}`.trim()}
                style={{ flex: '1 1 auto', minWidth: 0, overflow: 'auto' }}
              >
                <Tabs.Tab value="hours">Hours</Tabs.Tab>
                <Tabs.Tab value="consumables">Consumables</Tabs.Tab>
                <Tabs.Tab value="fuel">Fuel</Tabs.Tab>
              </Tabs.List>

            </Group>
            {/* <Group gap="xs" wrap="nowrap" hiddenFrom="sm" style={{ flexShrink: 0 }}>
              <MobileFilterDrawer title="Filter reports" activeCount={[client, job].filter(Boolean).length}>
                {filterFields}
              </MobileFilterDrawer>
            </Group> */}

            <Group gap="xs" wrap="nowrap" hiddenFrom="sm" style={{ width: '100%' }}>
              
              <div style={{ flexShrink: 0 }}>
                <MobileFilterDrawer
                  title="Filter reports"
                  activeCount={[client, job, employee, manager].filter(Boolean).length}
                >
                  {filterFields}
                </MobileFilterDrawer>
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <DateRangePicker
                  value={range}
                  onChange={setRange}
                  size="sm"
                  radius="sm"
                  style={{ width: '100%' }}
                />
              </div>
            </Group>

            <Group gap="sm" wrap="nowrap" visibleFrom="sm" style={{ overflow: 'auto' }}>
              <Select
                placeholder="All clients"
                data={clientOptions}
                value={client}
                onChange={setClient}
                clearable
                size="sm"
                radius="sm"
                searchable
                miw={160}
              />
              <Select
                placeholder="All jobs"
                data={jobOptions}
                value={job}
                onChange={setJob}
                clearable
                size="sm"
                radius="sm"
                searchable
                miw={180}
              />
              <Select
                placeholder="All employees"
                data={employeeOptions}
                value={employee}
                onChange={setEmployee}
                clearable
                size="sm"
                radius="sm"
                searchable
                miw={170}
              />
              <Select
                placeholder="All managers"
                data={managerOptions}
                value={manager}
                onChange={setManager}
                clearable
                size="sm"
                radius="sm"
                searchable
                miw={170}
              />
              <DateRangePicker value={range} onChange={setRange} size="sm" radius="sm" />
            </Group>
          </Stack>
        </Paper>

        <Tabs.Panel value="hours">
          <HoursTab range={range} client={client} job={job} employee={employee} manager={manager} />
        </Tabs.Panel>
        <Tabs.Panel value="consumables">
          <ConsumablesTab range={range} client={client} job={job} employee={employee} manager={manager} />
        </Tabs.Panel>
        <Tabs.Panel value="fuel">
          <FuelTab range={range} client={client} job={job} employee={employee} manager={manager} />
        </Tabs.Panel>
      </Stack>
    </Tabs>
  );
};
