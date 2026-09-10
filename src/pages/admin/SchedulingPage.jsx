import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
import { SCHEDULING_STATUS_OPTIONS, SCHEDULING_STATUS_COLORS } from '../../constants/scheduling.js';
import { useListParams } from '../../hooks/useListParams.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { currentMonthRange, formatDate } from '../../lib/dateRange.js';
import { listScheduling } from '../../services/schedulingService.js';
import { listJobs } from '../../services/jobService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

export const SchedulingPage = () => {
  usePageTitle('Scheduling');
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter, setFilters } =
    useListParams({ sort: 'scheduledDate', order: 'asc', filters: currentMonthRange() });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await listScheduling(queryParams);
      setResult(response);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the scheduling view'));
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  const loadJobs = useCallback(async () => {
    try {
      const response = await listJobs({ limit: 100, sort: 'jobNumber', order: 'asc' });
      setJobs(response.data);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load jobs'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const rows = result.data.map((row) => (
    <Table.Tr key={row.jobId}>
      <Table.Td>{formatDate(row.date)}</Table.Td>
      <Table.Td>{row.jobNumber}</Table.Td>
      <Table.Td>{row.clientName}</Table.Td>
      <Table.Td>{row.jobLocation || '—'}</Table.Td>
      <Table.Td>
        {row.operators.length ? (
          <Group gap={4} wrap="wrap">
            {row.operators.map((operator) => (
              <Badge
                key={operator.id}
                size="sm"
                variant="dot"
                color={SCHEDULING_STATUS_COLORS[operator.status]}
              >
                {operator.name}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text c="dimmed" size="sm">
            Unassigned
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Badge color={SCHEDULING_STATUS_COLORS[row.status]} tt="capitalize">
          {row.status}
        </Badge>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group gap="sm" wrap="wrap" align="center">
            <DateRangePicker
              value={{ from: filters.from, to: filters.to }}
              onChange={(range) => setFilters(range)}
            />
            <Select
              placeholder="All jobs"
              data={jobs.map((job) => ({ value: job.id, label: `${job.jobNumber} — ${job.clientName}` }))}
              value={filters.job || null}
              onChange={(value) => setFilter('job', value)}
              searchable
              clearable
              w={240}
            />
            <Select
              placeholder="All statuses"
              data={SCHEDULING_STATUS_OPTIONS}
              value={filters.status || null}
              onChange={(value) => setFilter('status', value)}
              clearable
              w={180}
            />
          </Group>

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <Table.ScrollContainer minWidth={820}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="scheduledDate" label="Date" sort={sort} order={order} onSort={toggleSort} />
                    <SortableTh field="jobNumber" label="Job #" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th>Client</Table.Th>
                    <Table.Th>Location</Table.Th>
                    <Table.Th>Site managers</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.length ? (
                    rows
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" ta="center" py="md">
                          No scheduled jobs match the current filters
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
