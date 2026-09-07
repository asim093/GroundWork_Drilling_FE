import { useCallback, useEffect, useState } from 'react';
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
  Text
} from '@mantine/core';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { JOB_STATUS_OPTIONS, JOB_STATUS_COLORS } from '../../constants/jobs.js';
import { useListParams } from '../../hooks/useListParams.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { listAssignedJobs } from '../../services/timeLogService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

export const OperatorJobsPage = () => {
  usePageTitle('Assigned jobs');
  const navigate = useNavigate();
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter } =
    useListParams({ sort: 'scheduledDate', order: 'asc' });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await listAssignedJobs(queryParams);
      setResult(response);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load assigned jobs'));
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = result.data.map((job) => (
    <Table.Tr key={job.id}>
      <Table.Td>{job.jobNumber}</Table.Td>
      <Table.Td>{job.clientName}</Table.Td>
      <Table.Td>{job.jobLocation || '—'}</Table.Td>
      <Table.Td>{formatDate(job.scheduledDate)}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={JOB_STATUS_COLORS[job.status] || 'blue'}>
          {job.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group justify="flex-end">
          <Button size="xs" onClick={() => navigate(`/operator/jobs/${job.id}/log`)}>
            Open log
          </Button>
        </Group>
      </Table.Td>
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
              data={JOB_STATUS_OPTIONS}
              value={filters.status || null}
              onChange={(value) => setFilter('status', value)}
              clearable
              w={200}
            />
          </Group>

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <Table.ScrollContainer minWidth={720}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="jobNumber" label="Job #" sort={sort} order={order} onSort={toggleSort} />
                    <SortableTh field="clientName" label="Client" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th>Location</Table.Th>
                    <SortableTh
                      field="scheduledDate"
                      label="Scheduled"
                      sort={sort}
                      order={order}
                      onSort={toggleSort}
                    />
                    <Table.Th>Status</Table.Th>
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
                          No assigned jobs match the current filters
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
