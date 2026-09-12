import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { SectionCard } from '../../components/SectionCard.jsx';
import { NavIcon } from '../../components/NavIcon.jsx';
import { InlineEditField } from '../../components/admin/InlineEditField.jsx';
import { PeopleSummary } from '../../components/admin/PeopleSummary.jsx';
import { PeopleAssignModal } from '../../components/admin/PeopleAssignModal.jsx';
import { DateRangePicker } from '../../components/DateRangePicker.jsx';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { MobileFilterDrawer } from '../../components/list/MobileFilterDrawer.jsx';
import { JOB_STATUS_COLORS } from '../../constants/jobs.js';
import { TIME_LOG_STATUS_COLORS, TIME_LOG_STATUS_OPTIONS } from '../../constants/timeLogs.js';
import { SHIFT_OPTIONS } from '../../constants/employees.js';
import { useClientTable } from '../../hooks/useClientTable.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { formatDate } from '../../lib/dateRange.js';
import { clockDuration } from '../../lib/timeLogMath.js';
import { getJob, updateJob } from '../../services/jobService.js';
import { listUsers } from '../../services/userService.js';
import { listTimeLogs } from '../../services/timeLogService.js';
import { employeesService, rigNumbersService } from '../../services/masterDataService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const EDITABLE_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'archived', label: 'Archived' }
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
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [logs, setLogs] = useState([]);
  const [rigOptions, setRigOptions] = useState([]);
  const [operators, setOperators] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(false);

  usePageTitle(job ? `Job ${job.jobNumber}` : 'Job details');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [jobData, logData, rigData, userData, employeeData] = await Promise.all([
        getJob(id),
        listTimeLogs({ job: id, limit: 200, sort: 'date', order: 'desc' }),
        rigNumbersService.list({ active: 'true', limit: 100, sort: 'name', order: 'asc' }),
        listUsers({ role: 'operator', active: 'true', limit: 200, sort: 'name', order: 'asc' }),
        employeesService.list({ active: 'true', limit: 200, sort: 'name', order: 'asc' })
      ]);
      setJob(jobData);
      setLogs(logData.data);
      setRigOptions(rigData.data.map((rig) => ({ value: rig.id, label: rig.name })));
      setOperators(userData.data);
      setEmployees(employeeData.data);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load this job'));
      navigate('/admin/jobs', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const saveJob = async (patch, message = 'Job updated') => {
    try {
      const updated = await updateJob(id, patch);
      setJob(updated);
      notifySuccess(message);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to update the job'));
      throw error;
    }
  };

  const saveField = (field, value, message) => saveJob({ [field]: value }, message);

  const managerValue = (job?.siteManagers || []).map((entry) => ({
    userId: entry.userId?.id || entry.userId,
    shift: entry.shift
  }));

  const rosterValue = (job?.rosterEmployeeIds || []).map((entry) => entry.id || entry);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || !job || location.hash !== '#log-history') {
      return undefined;
    }
    const timer = setTimeout(() => {
      document.getElementById('log-history')?.scrollIntoView({ block: 'start' });
    }, 150);
    return () => clearTimeout(timer);
  }, [loading, job, location.hash]);

  const [logShift, setLogShift] = useState(null);
  const [logStatus, setLogStatus] = useState(null);
  const [logRange, setLogRange] = useState({ from: '', to: '' });

  const logRows = useMemo(
    () =>
      logs
        .filter((entry) => {
          if (logShift && entry.shift !== logShift) {
            return false;
          }
          if (logStatus && entry.status !== logStatus) {
            return false;
          }
          const day = entry.date ? entry.date.slice(0, 10) : '';
          if (logRange.from && day < logRange.from) {
            return false;
          }
          if (logRange.to && day > logRange.to) {
            return false;
          }
          return true;
        })
        .map((entry) => ({
          id: entry.id,
          date: entry.date,
          shift: entry.shift || '—',
          crewCount: entry.crew?.length || 0,
          billableHours: clockDuration(entry.timeStarted, entry.timeFinished) ?? 0,
          paidHours: entry.hoursOnSite ?? clockDuration(entry.timeIn, entry.timeOut) ?? 0,
          status: entry.status
        })),
    [logs, logShift, logStatus, logRange]
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
        <ActionIcon
          hiddenFrom="sm"
          variant="subtle"
          size="lg"
          onClick={() => navigate('/admin/jobs')}
          aria-label="Back to jobs"
        >
          <NavIcon name="chevronLeft" size={20} />
        </ActionIcon>
        <Button
          visibleFrom="sm"
          variant="subtle"
          leftSection={<NavIcon name="chevronLeft" size={16} />}
          onClick={() => navigate('/admin/jobs')}
        >
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
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
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

      <SectionCard title="People" subtitle="Shift managers and the crew that can be logged against this job">
        <PeopleSummary
          siteManagers={job.siteManagers}
          rosterEmployeeIds={job.rosterEmployeeIds}
          operators={operators}
          employees={employees}
          onManage={() => setPeopleOpen(true)}
        />
      </SectionCard>

      <PeopleAssignModal
        opened={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        siteManagers={managerValue}
        rosterEmployeeIds={rosterValue}
        operators={operators}
        employees={employees}
        onChange={({ siteManagers, rosterEmployeeIds }) =>
          saveJob({ siteManagers, rosterEmployeeIds }, 'People updated')
        }
      />

      <SectionCard
        id="log-history"
        title="Log history"
        subtitle="Time logs submitted for this job"
        action={
          <Group hiddenFrom="lg">
            <MobileFilterDrawer
              title="Filter log history"
              activeCount={[logShift, logStatus, logRange.from || logRange.to].filter(Boolean).length}
            >
              <Select
                label="Shift"
                placeholder="All shifts"
                data={SHIFT_OPTIONS}
                value={logShift}
                onChange={setLogShift}
                clearable
              />
              <Select
                label="Status"
                placeholder="All statuses"
                data={TIME_LOG_STATUS_OPTIONS}
                value={logStatus}
                onChange={setLogStatus}
                clearable
              />
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Date range
                </Text>
                <DateRangePicker value={logRange} onChange={setLogRange} clearable />
              </div>
            </MobileFilterDrawer>
          </Group>
        }
      >
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap" visibleFrom="lg" style={{ overflow: 'auto' }}>
            <Select
              placeholder="All shifts"
              data={SHIFT_OPTIONS}
              value={logShift}
              onChange={setLogShift}
              clearable
              miw={100}
            />
            <Select
              placeholder="All statuses"
              data={TIME_LOG_STATUS_OPTIONS}
              value={logStatus}
              onChange={setLogStatus}
              clearable
              miw={120}
            />
            <DateRangePicker value={logRange} onChange={setLogRange} clearable />
          </Group>

          <Stack gap="xs" hiddenFrom="lg">
            {table.data.length ? (
              table.data.map((row) => (
                <Paper
                  key={row.id}
                  withBorder
                  radius="md"
                  p="sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/time-logs/${row.id}`)}
                >
                  <Stack gap={6}>
                    <Group justify="space-between" wrap="nowrap">
                      <Text fw={600} size="sm">
                        {formatDate(row.date)} · {row.shift}
                      </Text>
                      <Badge variant="light" color={TIME_LOG_STATUS_COLORS[row.status] || 'gray'} tt="capitalize" size="sm">
                        {row.status}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {row.crewCount} crew · {row.billableHours}h billable · {row.paidHours}h paid
                    </Text>
                  </Stack>
                </Paper>
              ))
            ) : (
              <Text c="dimmed" ta="center" py="md" size="sm">
                No time logs for this job yet.
              </Text>
            )}
          </Stack>

          <Table.ScrollContainer minWidth={640} visibleFrom="lg">
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  {th('date', 'Date')}
                  {th('shift', 'Shift')}
                  {th('crewCount', 'Crew')}
                  {th('billableHours', 'Billable hrs')}
                  {th('paidHours', 'Paid hrs')}
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
                      <Table.Td>{row.billableHours}</Table.Td>
                      <Table.Td>{row.paidHours}</Table.Td>
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
        </Stack>
      </SectionCard>
    </Stack>
  );
};
