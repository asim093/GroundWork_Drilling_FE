import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Tooltip
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { MobileFilterDrawer } from '../../components/list/MobileFilterDrawer.jsx';
import { MobileFab } from '../../components/list/MobileFab.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
import { JobFormModal } from '../../components/admin/JobFormModal.jsx';
import { JOB_STATUS_COLORS } from '../../constants/jobs.js';
import { useListParams } from '../../hooks/useListParams.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { NavIcon } from '../../components/NavIcon.jsx';
import { listJobs } from '../../services/jobService.js';
import { listUsers } from '../../services/userService.js';
import { rigNumbersService } from '../../services/masterDataService.js';

const JOB_VIEWS = [
  { value: 'active', label: 'Active' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'archived', label: 'Archived' }
];
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

const daysLate = (value) => {
  if (!value) {
    return null;
  }
  const scheduled = new Date(value);
  scheduled.setUTCHours(0, 0, 0, 0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Math.round((today - scheduled) / 86400000);
};

const logStatus = (job) => {
  if (job.status === 'archived') {
    return { variant: 'subtle', color: 'gray', label: 'Archived' };
  }
  if (job.status === 'submitted' || job.hasSubmittedLog) {
    return { variant: 'light', color: 'green', label: 'A log has been submitted' };
  }
  const late = daysLate(job.scheduledDate);
  if (late === null || late <= 0) {
    return { variant: 'default', color: 'gray', label: 'No log yet — not overdue' };
  }
  if (late === 1) {
    return { variant: 'light', color: 'yellow', label: '1 day past schedule with no log' };
  }
  if (late === 2) {
    return { variant: 'light', color: 'orange', label: '2 days past schedule with no log' };
  }
  return { variant: 'light', color: 'red', label: `${late} days past schedule with no log` };
};

const managersLabel = (job) =>
  job.siteManagers?.length
    ? job.siteManagers.map((entry) => `${entry.userId?.name || 'Unknown'} (${entry.shift})`).join(', ')
    : '—';

const countActive = (...values) => values.filter(Boolean).length;

export const JobsPage = () => {
  usePageTitle('Jobs');
  const navigate = useNavigate();
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter, setFilters } =
    useListParams({ sort: 'createdAt', order: 'desc' });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [rigs, setRigs] = useState([]);
  const [managers, setManagers] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const openNewJob = useCallback(() => setFormOpen(true), []);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openNewJob();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openNewJob]);

  const activeView = filters.view || 'active';

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await listJobs({ ...queryParams, view: queryParams.view || 'active' });
      setResult(response);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load jobs'));
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  const loadFilters = useCallback(async () => {
    try {
      const [rigList, managerList] = await Promise.all([
        rigNumbersService.list({ active: 'true', limit: 100, sort: 'name', order: 'asc' }),
        listUsers({ role: 'operator', active: 'true', limit: 200, sort: 'name', order: 'asc' })
      ]);
      setRigs(rigList.data);
      setManagers(managerList.data);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load filters'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    setFilter('search', debouncedSearch);
  }, [debouncedSearch, setFilter]);

  const filterFields = (
    <>
      <Select
        label="Manager"
        placeholder="All managers"
        data={managers.map((manager) => ({ value: manager.id, label: manager.name }))}
        value={filters.assignedUser || null}
        onChange={(value) => setFilter('assignedUser', value)}
        searchable
        clearable
      />
      <Select
        label="Rig"
        placeholder="All rigs"
        data={rigs.map((rig) => ({ value: rig.id, label: rig.name }))}
        value={filters.rigNumber || null}
        onChange={(value) => setFilter('rigNumber', value)}
        searchable
        clearable
      />
      <DateRangePicker
        value={{ from: filters.from || '', to: filters.to || '' }}
        onChange={(range) => setFilters(range)}
        clearable
      />
    </>
  );

  const rows = result.data.map((job) => {
    const status = logStatus(job);
    return (
      <Table.Tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/jobs/${job.id}`)}>
        <Table.Td>{job.jobNumber}</Table.Td>
        <Table.Td>{job.clientName}</Table.Td>
        <Table.Td>{job.jobLocation || '—'}</Table.Td>
        <Table.Td>{job.rigNumber?.name || '—'}</Table.Td>
        <Table.Td>{job.drillNumber || '—'}</Table.Td>
        <Table.Td>{formatDate(job.scheduledDate)}</Table.Td>
        <Table.Td>
          <Badge variant="light" color={JOB_STATUS_COLORS[job.status] || 'brand'}>
            {job.status}
          </Badge>
        </Table.Td>
        <Table.Td>{managersLabel(job)}</Table.Td>
        <Table.Td onClick={(event) => event.stopPropagation()}>
          <Group justify="flex-end">
            <Tooltip label={status.label} withArrow>
              <ActionIcon
                variant={status.variant}
                color={status.color}
                onClick={() => navigate(`/admin/jobs/${job.id}#log-history`)}
                aria-label="Open log history"
              >
                <NavIcon name="clipboard" size={17} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="md">
      <Tabs
        value={activeView}
        onChange={(value) => {
          setFilter('view', value || 'active');
          setPage(1);
        }}
      >
        <Tabs.List>
          {JOB_VIEWS.map((view) => (
            <Tabs.Tab key={view.value} value={view.value}>
              {view.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap" align="center">
            <TextInput
              placeholder="Search job #, client, location or manager"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              leftSection={<NavIcon name="search" size={15} />}
              style={{ flex: 1, minWidth: 0 }}
            />
            <Group gap="xs" wrap="nowrap" hiddenFrom="lg">
              <MobileFilterDrawer
                title="Filter jobs"
                activeCount={countActive(filters.assignedUser, filters.rigNumber, filters.from || filters.to)}
              >
                {filterFields}
              </MobileFilterDrawer>
            </Group>
            <Button
              visibleFrom="lg"
              leftSection={<NavIcon name="plus" size={16} />}
              onClick={openNewJob}
              style={{ flexShrink: 0 }}
            >
              New job
            </Button>
          </Group>

          <Group gap="sm" wrap="wrap" visibleFrom="lg">
            {filterFields}
          </Group>

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <>
              <Stack gap="xs" hiddenFrom="lg">
                {result.data.length ? (
                  result.data.map((job) => {
                    const status = logStatus(job);
                    return (
                      <Paper
                        key={job.id}
                        withBorder
                        radius="md"
                        p="sm"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/jobs/${job.id}`)}
                      >
                        <Stack gap={6}>
                          <Group justify="space-between" wrap="nowrap" align="flex-start">
                            <Stack gap={0} style={{ minWidth: 0 }}>
                              <Text fw={600} size="sm" truncate>
                                {job.jobNumber} — {job.clientName}
                              </Text>
                              <Text size="xs" c="dimmed" truncate>
                                {job.jobLocation || 'No location'}
                              </Text>
                            </Stack>
                            <Badge variant="light" color={JOB_STATUS_COLORS[job.status] || 'brand'} size="sm">
                              {job.status}
                            </Badge>
                          </Group>
                          <Group gap={6} wrap="wrap">
                            <Text size="xs" c="dimmed">
                              Rig {job.rigNumber?.name || '—'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              · Drill {job.drillNumber || '—'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              · Scheduled {formatDate(job.scheduledDate)}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed" truncate>
                            {managersLabel(job)}
                          </Text>
                          <Group justify="space-between" align="center">
                            <Text size="xs" c={status.color}>
                              {status.label}
                            </Text>
                            <ActionIcon
                              variant={status.variant}
                              color={status.color}
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/admin/jobs/${job.id}#log-history`);
                              }}
                              aria-label="Open log history"
                            >
                              <NavIcon name="clipboard" size={17} />
                            </ActionIcon>
                          </Group>
                        </Stack>
                      </Paper>
                    );
                  })
                ) : (
                  <Text c="dimmed" ta="center" py="md" size="sm">
                    No jobs match the current filters
                  </Text>
                )}
              </Stack>

              <Table.ScrollContainer minWidth={1040} visibleFrom="lg">
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <SortableTh
                        field="jobNumber"
                        label="Job #"
                        sort={sort}
                        order={order}
                        onSort={toggleSort}
                      />
                      <SortableTh
                        field="clientName"
                        label="Client"
                        sort={sort}
                        order={order}
                        onSort={toggleSort}
                      />
                      <Table.Th>Location</Table.Th>
                      <Table.Th>Rig</Table.Th>
                      <Table.Th>Drill #</Table.Th>
                      <SortableTh
                        field="scheduledDate"
                        label="Scheduled"
                        sort={sort}
                        order={order}
                        onSort={toggleSort}
                      />
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Managers</Table.Th>
                      <Table.Th>Log</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {rows.length ? (
                      rows
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={9}>
                          <Text c="dimmed" ta="center" py="md">
                            No jobs match the current filters
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </>
          )}

          <ListPagination
            pagination={result.pagination}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </Stack>
      </Card>

      <MobileFab onClick={openNewJob} label="New job" />

      <JobFormModal opened={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
    </Stack>
  );
};
