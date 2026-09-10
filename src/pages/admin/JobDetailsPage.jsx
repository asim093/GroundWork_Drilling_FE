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
import { InlineEditField } from '../../components/admin/InlineEditField.jsx';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { JOB_STATUS_COLORS } from '../../constants/jobs.js';
import { TIME_LOG_STATUS_COLORS } from '../../constants/timeLogs.js';
import { useClientTable } from '../../hooks/useClientTable.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { formatDate } from '../../lib/dateRange.js';
import { getJob, updateJob } from '../../services/jobService.js';
import { listTimeLogs } from '../../services/timeLogService.js';
import { rigNumbersService } from '../../services/masterDataService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const EDITABLE_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' }
];

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
  const [rigOptions, setRigOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageTitle(job ? `Job ${job.jobNumber}` : 'Job details');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [jobData, logData, rigData] = await Promise.all([
        getJob(id),
        listTimeLogs({ job: id, limit: 200, sort: 'date', order: 'desc' }),
        rigNumbersService.list({ active: 'true', limit: 100, sort: 'name', order: 'asc' })
      ]);
      setJob(jobData);
      setLogs(logData.data);
      setRigOptions(rigData.data.map((rig) => ({ value: rig.id, label: rig.name })));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load this job'));
      navigate('/admin/jobs', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const saveField = async (field, value) => {
    try {
      const updated = await updateJob(id, { [field]: value });
      setJob(updated);
      notifySuccess('Job updated');
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to update the job'));
      throw error;
    }
  };

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
          <DetailRow label="Job number">
            <InlineEditField
              label="job number"
              value={job.jobNumber}
              required
              onSave={(next) => saveField('jobNumber', next)}
            />
          </DetailRow>
          <DetailRow label="Client name">
            <InlineEditField
              label="client name"
              value={job.clientName}
              required
              onSave={(next) => saveField('clientName', next)}
            />
          </DetailRow>
          <DetailRow label="Job location">
            <InlineEditField
              label="job location"
              value={job.jobLocation || ''}
              onSave={(next) => saveField('jobLocation', next)}
            />
          </DetailRow>
          <DetailRow label="Client job number">
            <InlineEditField
              label="client job number"
              value={job.clientJobNumber || ''}
              onSave={(next) => saveField('clientJobNumber', next)}
            />
          </DetailRow>
          <DetailRow label="Drill number">
            <InlineEditField
              label="drill number"
              value={job.drillNumber || ''}
              onSave={(next) => saveField('drillNumber', next)}
            />
          </DetailRow>
          <DetailRow label="Rig number">
            <InlineEditField
              label="rig number"
              type="select"
              data={rigOptions}
              value={job.rigNumber?.id || ''}
              display={() => job.rigNumber?.name || null}
              onSave={(next) => saveField('rigNumber', next)}
            />
          </DetailRow>
          <DetailRow label="Scheduled date">
            <InlineEditField
              label="scheduled date"
              type="date"
              value={job.scheduledDate ? job.scheduledDate.slice(0, 10) : ''}
              display={() => formatDate(job.scheduledDate)}
              onSave={(next) => saveField('scheduledDate', next)}
            />
          </DetailRow>
          <DetailRow label="Status">
            <InlineEditField
              label="status"
              type="select"
              data={EDITABLE_STATUS_OPTIONS}
              value={job.status}
              readOnly={job.status === 'archived'}
              display={(current) => (
                <Badge variant="light" color={JOB_STATUS_COLORS[current] || 'brand'}>
                  {current}
                </Badge>
              )}
              onSave={(next) => saveField('status', next)}
            />
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
