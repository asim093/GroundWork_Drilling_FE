import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { JobFormModal } from '../../components/admin/JobFormModal.jsx';
import { AssignUsersModal } from '../../components/admin/AssignUsersModal.jsx';
import { JOB_STATUS_OPTIONS, JOB_STATUS_COLORS } from '../../constants/jobs.js';
import { useListParams } from '../../hooks/useListParams.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { NavIcon } from '../../components/NavIcon.jsx';
import { listJobs, archiveJob, unarchiveJob } from '../../services/jobService.js';
import { listUsers } from '../../services/userService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

export const JobsPage = () => {
  usePageTitle('Jobs');
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter } =
    useListParams({ sort: 'createdAt', order: 'desc' });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({ open: false, job: null });
  const [assignModal, setAssignModal] = useState({ open: false, job: null });
  const [archiveModal, setArchiveModal] = useState({ open: false, job: null });
  const [busyId, setBusyId] = useState(null);

  const openNewJob = useCallback(() => setFormModal({ open: true, job: null }), []);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openNewJob();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openNewJob]);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await listJobs(queryParams);
      setResult(response);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load jobs'));
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  const loadOperators = useCallback(async () => {
    try {
      const response = await listUsers({ role: 'operator', active: 'true', limit: 100, sort: 'name', order: 'asc' });
      setOperators(response.data);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load operators'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  const handleUnarchive = async (job) => {
    setBusyId(job.id);

    try {
      await unarchiveJob(job.id);
      notifySuccess(`Job ${job.jobNumber} unarchived`);
      load();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to unarchive job'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmArchive = async () => {
    const job = archiveModal.job;
    setBusyId(job.id);

    try {
      await archiveJob(job.id);
      notifySuccess(`Job ${job.jobNumber} archived`);
      setArchiveModal({ open: false, job: null });
      load();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to archive job'));
    } finally {
      setBusyId(null);
    }
  };

  const rows = result.data.map((job) => (
    <Table.Tr key={job.id}>
      <Table.Td>{job.jobNumber}</Table.Td>
      <Table.Td>{job.clientName}</Table.Td>
      <Table.Td>{job.jobLocation || '—'}</Table.Td>
      <Table.Td>{job.rigNumber?.name || '—'}</Table.Td>
      <Table.Td>{formatDate(job.scheduledDate)}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={JOB_STATUS_COLORS[job.status] || 'blue'}>
          {job.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        {job.assignedUserIds?.length
          ? job.assignedUserIds.map((operator) => operator.name).join(', ')
          : '—'}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" justify="flex-end">
          {job.status === 'archived' ? (
            <>
              <Button
                size="xs"
                variant="light"
                color="green"
                loading={busyId === job.id}
                onClick={() => handleUnarchive(job)}
              >
                Unarchive
              </Button>
            </>
          ) : (
            <>
              <Button size="xs" variant="default" onClick={() => setFormModal({ open: true, job })}>
                Edit
              </Button>
              <Button size="xs" variant="light" onClick={() => setAssignModal({ open: true, job })}>
                Assign
              </Button>
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => setArchiveModal({ open: true, job })}
              >
                Archive
              </Button>
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group gap="sm" wrap="wrap" align="center">
            <Select
              placeholder="All statuses"
              data={JOB_STATUS_OPTIONS}
              value={filters.status || null}
              onChange={(value) => setFilter('status', value)}
              clearable
              w={180}
            />
            <Select
              placeholder="All operators"
              data={operators.map((operator) => ({ value: operator.id, label: operator.name }))}
              value={filters.assignedUser || null}
              onChange={(value) => setFilter('assignedUser', value)}
              searchable
              clearable
              w={220}
            />
            <Button ml="auto" leftSection={<NavIcon name="plus" size={16} />} onClick={openNewJob}>
              New job
            </Button>
          </Group>

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <Table.ScrollContainer minWidth={900}>
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
                    <SortableTh
                      field="scheduledDate"
                      label="Scheduled"
                      sort={sort}
                      order={order}
                      onSort={toggleSort}
                    />
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Assigned</Table.Th>
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
                          No jobs match the current filters
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

      <JobFormModal
        opened={formModal.open}
        job={formModal.job}
        operators={operators}
        onClose={() => setFormModal({ open: false, job: null })}
        onSaved={load}
      />

      <AssignUsersModal
        opened={assignModal.open}
        job={assignModal.job}
        operators={operators}
        onClose={() => setAssignModal({ open: false, job: null })}
        onSaved={load}
      />

      <Modal
        opened={archiveModal.open}
        onClose={() => setArchiveModal({ open: false, job: null })}
        title="Archive job"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Archive job {archiveModal.job?.jobNumber} — {archiveModal.job?.clientName}? It will be
            hidden from operators&apos; assigned jobs and from the default admin list. You can
            unarchive it later.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setArchiveModal({ open: false, job: null })}>
              Cancel
            </Button>
            <Button color="red" loading={busyId === archiveModal.job?.id} onClick={confirmArchive}>
              Archive job
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
