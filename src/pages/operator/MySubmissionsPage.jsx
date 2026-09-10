import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { TIME_LOG_STATUS_OPTIONS, TIME_LOG_STATUS_COLORS } from '../../constants/timeLogs.js';
import { useListParams } from '../../hooks/useListParams.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { listAssignedJobs, listMyTimeLogs } from '../../services/timeLogService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

export const MySubmissionsPage = () => {
  usePageTitle('My submissions');
  const navigate = useNavigate();
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter, setFilters } =
    useListParams({ sort: 'date', order: 'desc' });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await listMyTimeLogs(queryParams);
      setResult(response);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load submissions'));
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  const loadJobs = useCallback(async () => {
    try {
      const response = await listAssignedJobs({ limit: 100, sort: 'jobNumber', order: 'asc' });
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

  const rows = result.data.map((entry) => (
    <Table.Tr
      key={entry.id}
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/operator/log/${entry.id}`)}
    >
      <Table.Td>{formatDate(entry.date)}</Table.Td>
      <Table.Td>{entry.jobId?.jobNumber || '—'}</Table.Td>
      <Table.Td>{entry.jobId?.clientName || '—'}</Table.Td>
      <Table.Td>{entry.shift || '—'}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={TIME_LOG_STATUS_COLORS[entry.status]}>
          {entry.status}
        </Badge>
      </Table.Td>
      <Table.Td>{entry.status === 'submitted' ? 'View' : 'Edit'}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group gap="sm" wrap="wrap" align="flex-end">
            <Select
              label="Status"
              placeholder="All statuses"
              data={TIME_LOG_STATUS_OPTIONS}
              value={filters.status || null}
              onChange={(value) => setFilter('status', value)}
              clearable
              w={170}
            />
            <Select
              label="Job"
              placeholder="All jobs"
              data={jobs.map((job) => ({ value: job.id, label: `${job.jobNumber} — ${job.clientName}` }))}
              value={filters.job || null}
              onChange={(value) => setFilter('job', value)}
              searchable
              clearable
              w={240}
            />
            <div>
              <Text size="sm" fw={600} mb={4}>
                Date range
              </Text>
              <DateRangePicker
                value={{ from: filters.from || '', to: filters.to || '' }}
                onChange={(range) => setFilters(range)}
                clearable
              />
            </div>
          </Group>

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <Table.ScrollContainer minWidth={640}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="date" label="Date" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th>Job #</Table.Th>
                    <Table.Th>Client</Table.Th>
                    <Table.Th>Shift</Table.Th>
                    <SortableTh field="status" label="Status" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.length ? (
                    rows
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" ta="center" py="md">
                          No submissions match the current filters
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
