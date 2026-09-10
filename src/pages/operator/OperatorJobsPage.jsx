import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
import { JOB_STATUS_COLORS } from '../../constants/jobs.js';
import { useListParams } from '../../hooks/useListParams.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { listAssignedJobs } from '../../services/timeLogService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

const POLL_INTERVAL = 15000;

const TODAY_STATUS = {
  submitted: { label: 'Logged today', color: 'green' },
  draft: { label: 'Draft today', color: 'yellow' }
};

const TODAY_FILTER_OPTIONS = [
  { value: 'logged', label: 'Logged today' },
  { value: 'draft', label: 'Draft today' },
  { value: 'none', label: 'Not logged today' }
];

export const OperatorJobsPage = () => {
  usePageTitle('Assigned jobs');
  const navigate = useNavigate();
  const {
    queryParams,
    filters,
    sort,
    order,
    limit,
    setPage,
    setLimit,
    toggleSort,
    setFilter,
    setFilters
  } = useListParams({ sort: 'createdAt', order: 'desc' });
  const [view, setView] = useState('active');
  const [result, setResult] = useState({ data: [], pagination: null });
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [loading, setLoading] = useState(true);
  const paramsRef = useRef(queryParams);
  paramsRef.current = { ...queryParams, view };

  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await listAssignedJobs(paramsRef.current);
      setResult(response);
    } catch (error) {
      if (!silent) {
        notifyError(extractErrorMessage(error, 'Unable to load assigned jobs'));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setFilter('search', debouncedSearch);
  }, [debouncedSearch, setFilter]);

  useEffect(() => {
    load();
  }, [load, queryParams, view]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') {
        load({ silent: true });
      }
    };
    const timer = setInterval(tick, POLL_INTERVAL);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [load]);

  const isCompleted = view === 'completed';

  const rows = result.data.map((job) => {
    const todayStatus = job.todayLog ? TODAY_STATUS[job.todayLog.status] : null;
    const target = job.todayLog
      ? `/operator/log/${job.todayLog.id}`
      : `/operator/jobs/${job.id}/log`;

    return (
      <Table.Tr key={job.id}>
        <Table.Td>{job.jobNumber}</Table.Td>
        <Table.Td>{job.clientName}</Table.Td>
        <Table.Td>{job.jobLocation || '—'}</Table.Td>
        <Table.Td>{job.rigNumber?.name || '—'}</Table.Td>
        <Table.Td>{formatDate(job.scheduledDate)}</Table.Td>
        <Table.Td>
          <Badge variant="light" color={JOB_STATUS_COLORS[job.status] || 'brand'}>
            {job.status}
          </Badge>
        </Table.Td>
        {isCompleted ? null : (
          <Table.Td>
            {todayStatus ? (
              <Badge variant="light" color={todayStatus.color}>
                {todayStatus.label}
              </Badge>
            ) : (
              <Text size="sm" c="dimmed">
                Not logged today
              </Text>
            )}
          </Table.Td>
        )}
        <Table.Td>
          <Group justify="flex-end">
            {isCompleted ? (
              <Button size="xs" variant="default" onClick={() => navigate('/operator/submissions')}>
                View submissions
              </Button>
            ) : (
              <Button
                size="xs"
                variant={job.todayLog?.status === 'submitted' ? 'default' : 'filled'}
                onClick={() => navigate(target)}
              >
                {job.todayLog?.status === 'submitted'
                  ? "View today's log"
                  : job.todayLog
                    ? "Continue today's log"
                    : "Start today's log"}
              </Button>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Tabs value={view} onChange={setView}>
            <Tabs.List>
              <Tabs.Tab value="active">Active</Tabs.Tab>
              <Tabs.Tab value="completed">Completed</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Group gap="sm" wrap="wrap" align="center">
            <TextInput
              placeholder="Search job #, client or location"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              w={260}
            />
            <Select
              placeholder="All rigs"
              data={result.filters?.rigs || []}
              value={filters.rig || null}
              onChange={(value) => setFilter('rig', value)}
              searchable
              clearable
              w={130}
            />
            {isCompleted ? null : (
              <Select
                placeholder="Any day activity"
                data={TODAY_FILTER_OPTIONS}
                value={filters.today || null}
                onChange={(value) => setFilter('today', value)}
                clearable
                w={170}
              />
            )}
            <DateRangePicker
              value={{ from: filters.from || '', to: filters.to || '' }}
              onChange={(range) =>
                setFilters({ from: range.from || undefined, to: range.to || undefined })
              }
              clearable
            />
          </Group>

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <Table.ScrollContainer minWidth={960}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="jobNumber" label="Job #" sort={sort} order={order} onSort={toggleSort} />
                    <SortableTh field="clientName" label="Client" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th>Location</Table.Th>
                    <Table.Th>Rig</Table.Th>
                    <SortableTh
                      field="scheduledDate"
                      label="Scheduled"
                      sort={sort}
                      order={order}
                      onSort={toggleSort}
                    />
                    <Table.Th>Job status</Table.Th>
                    {isCompleted ? null : <Table.Th>Today</Table.Th>}
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.length ? (
                    rows
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={8}>
                        <Text c="dimmed" ta="center" py="md">
                          {isCompleted
                            ? 'No completed jobs yet'
                            : 'No active jobs match the current filters'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}

          <ListPagination
            pagination={result.pagination}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </Stack>
      </Card>
    </Stack>
  );
};
