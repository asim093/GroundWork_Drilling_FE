import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Anchor,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { SectionCard } from '../../components/SectionCard.jsx';
import { NavIcon } from '../../components/NavIcon.jsx';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { JOB_STATUS_COLORS } from '../../constants/jobs.js';
import { TIME_LOG_STATUS_COLORS } from '../../constants/timeLogs.js';
import { useClientTable } from '../../hooks/useClientTable.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { formatDate } from '../../lib/dateRange.js';
import { getJob } from '../../services/jobService.js';
import { listTimeLogs } from '../../services/timeLogService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

const DetailRow = ({ label, children }) => (
  <Stack gap={2}>
    <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: 0.4 }}>
      {label}
    </Text>
    <Text size="sm" component="div">
      {children}
    </Text>
  </Stack>
);

export const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageTitle(job ? `Job ${job.jobNumber}` : 'Job details');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [jobData, logData] = await Promise.all([
        getJob(id),
        listTimeLogs({ job: id, limit: 200, sort: 'date', order: 'desc' })
      ]);
      setJob(jobData);
      setLogs(logData.data);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load this job'));
      navigate('/admin/jobs', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const logRows = useMemo(
    () =>
      logs.map((entry) => ({
        id: entry.id,
        date: entry.date,
        shift: entry.shift || '—',
        crewCount: entry.crew?.length || 0,
        drilled: entry.metersDrilled ?? 0,
        recovered: entry.metersRecovered ?? 0,
        status: entry.status
      })),
    [logs]
  );

  const table = useClientTable(logRows, { defaultSort: 'date', defaultOrder: 'desc' });

  if (loading || !job) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  const th = (field, label) => (
    <SortableTh
      field={field}
      label={label}
      sort={table.sort}
      order={table.order}
      onSort={table.toggleSort}
    />
  );

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Button variant="subtle" leftSection={<NavIcon name="chevronLeft" size={16} />} onClick={() => navigate('/admin/jobs')}>
          Back to jobs
        </Button>
        <Text fw={700} fz="lg">
          {job.jobNumber} — {job.clientName}
        </Text>
      </Group>

      <SectionCard
        title="Job details"
        action={
          <Anchor component={Link} to={`/admin/reports?job=${job.id}`} size="sm">
            Open in Reports
          </Anchor>
        }
      >
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="lg">
          <DetailRow label="Job number">{job.jobNumber}</DetailRow>
          <DetailRow label="Client name">{job.clientName}</DetailRow>
          <DetailRow label="Job location">{job.jobLocation || '—'}</DetailRow>
          <DetailRow label="Client job number">{job.clientJobNumber || '—'}</DetailRow>
          <DetailRow label="Drill number">{job.drillNumber || '—'}</DetailRow>
          <DetailRow label="Rig number">{job.rigNumber?.name || '—'}</DetailRow>
          <DetailRow label="Scheduled date">{formatDate(job.scheduledDate)}</DetailRow>
          <DetailRow label="Status">
            <Badge variant="light" color={JOB_STATUS_COLORS[job.status] || 'brand'}>
              {job.status}
            </Badge>
          </DetailRow>
        </SimpleGrid>
      </SectionCard>

      <SectionCard title="Managers" subtitle="The site managers responsible for each shift on this job">
        {job.siteManagers?.length ? (
          <Group gap="sm" wrap="wrap">
            {job.siteManagers.map((entry) => (
              <Badge
                key={`${entry.userId?.id || entry.userId}-${entry.shift}`}
                size="lg"
                variant="light"
              >
                {entry.userId?.name || 'Unknown'} · {entry.shift}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text c="dimmed" size="sm">
            No managers assigned — this job is not visible to any manager yet.
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Roster" subtitle="Crew available to be logged against this job">
        {job.rosterEmployeeIds?.length ? (
          <Group gap="sm" wrap="wrap">
            {job.rosterEmployeeIds.map((employee) => (
              <Badge key={employee.id || employee} size="lg" variant="light" color="gray">
                {employee.name || 'Unknown'}
                {employee.employeeType ? ` · ${employee.employeeType}` : ''}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text c="dimmed" size="sm">
            No roster set for this job yet.
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Log history" subtitle="Time logs submitted for this job">
        <Table.ScrollContainer minWidth={640}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {th('date', 'Date')}
                {th('shift', 'Shift')}
                {th('crewCount', 'Crew')}
                {th('drilled', 'Drilled (m)')}
                {th('recovered', 'Recovered (m)')}
                {th('status', 'Status')}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.data.length ? (
                table.data.map((row) => (
                  <Table.Tr
                    key={row.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/time-logs/${row.id}`)}
                  >
                    <Table.Td>{formatDate(row.date)}</Table.Td>
                    <Table.Td>{row.shift}</Table.Td>
                    <Table.Td>{row.crewCount}</Table.Td>
                    <Table.Td>{row.drilled}</Table.Td>
                    <Table.Td>{row.recovered}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={TIME_LOG_STATUS_COLORS[row.status] || 'gray'} tt="capitalize">
                        {row.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="md">
                      No time logs for this job yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <ListPagination
          pagination={table.pagination}
          limit={table.limit}
          onPageChange={table.setPage}
          onLimitChange={table.setLimit}
        />
      </SectionCard>
    </Stack>
  );
};
