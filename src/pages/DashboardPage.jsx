import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Anchor,
  Box,
  Center,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon
} from '@mantine/core';
import { StatCard } from '../components/dashboard/StatCard.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { NavIcon } from '../components/NavIcon.jsx';
import { TIME_LOG_STATUS_COLORS } from '../constants/timeLogs.js';
import { BONUS_ELIGIBILITY, BONUS_ELIGIBILITY_ORDER } from '../constants/bonus.js';
import { usePageTitle } from '../context/PageTitleContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../lib/dateRange.js';
import { getDashboard } from '../services/dashboardService.js';
import { extractErrorMessage } from '../services/api.js';
import { notifyError } from '../lib/toast.js';

const fmt = (value) =>
  typeof value === 'number'
    ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;

const WelcomeBanner = ({ name, role }) => (
  <Paper withBorder radius="lg" p="lg" bg="var(--mantine-color-brand-0)">
    <Group justify="space-between" align="center" wrap="wrap" gap="md">
      <Group gap="md" wrap="nowrap" align="center">
        <ThemeIcon size={44} radius="xl" variant="white" color="brand">
          <NavIcon name="home" size={22} />
        </ThemeIcon>
        <Stack gap={2}>
          <Text fw={700} fz="lg">
            Welcome back, {name}
          </Text>
          <Text size="sm" c="brand.8">
            {role === 'admin'
              ? "Here's what's happening across your drilling operations today."
              : "Here's a snapshot of your recent activity."}
          </Text>
        </Stack>
      </Group>
      <Group gap={6} c="brand.8" wrap="nowrap">
        <NavIcon name="calendar" size={15} />
        <Text size="sm">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
      </Group>
    </Group>
  </Paper>
);

const ActivityChart = ({ data }) => {
  const rows = data || [];
  const total = rows.reduce((sum, day) => sum + day.count, 0);

  if (!total) {
    return (
      <Text c="dimmed" size="sm">
        No submissions in the last 7 days.
      </Text>
    );
  }

  const max = Math.max(1, ...rows.map((day) => day.count));

  return (
    <Box>
      <Group align="flex-end" gap="xs" wrap="nowrap" h={132}>
        {rows.map((day) => {
          const barHeight = day.count ? Math.max(8, Math.round((day.count / max) * 96)) : 3;
          return (
            <Stack key={day.date} gap={4} align="center" justify="flex-end" style={{ flex: 1 }}>
              <Text size="xs" fw={700} c={day.count ? 'brand.7' : 'dimmed'}>
                {day.count}
              </Text>
              <Box
                w="100%"
                style={{
                  height: barHeight,
                  backgroundColor: day.count
                    ? 'var(--mantine-color-brand-5)'
                    : 'var(--mantine-color-gray-3)',
                  borderRadius: '4px 4px 0 0'
                }}
              />
            </Stack>
          );
        })}
      </Group>
      <Group
        gap="xs"
        wrap="nowrap"
        pt="xs"
        mt={6}
        style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
      >
        {rows.map((day) => (
          <Text key={day.date} size="xs" c="dimmed" ta="center" style={{ flex: 1 }}>
            {day.label}
          </Text>
        ))}
      </Group>
    </Box>
  );
};

const BonusEligibility = ({ counts }) => (
  <Stack gap="md">
    <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
      {BONUS_ELIGIBILITY_ORDER.map((key) => (
        <Box key={key}>
          <Group gap={7} wrap="nowrap">
            <Box
              w={8}
              h={8}
              style={{
                borderRadius: '50%',
                backgroundColor: `var(--mantine-color-${BONUS_ELIGIBILITY[key].color}-6)`,
                flexShrink: 0
              }}
            />
            <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              {BONUS_ELIGIBILITY[key].label}
            </Text>
          </Group>
          <Text fw={700} fz={26} mt={4}>
            {counts[key] || 0}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
    <Text size="xs" c="dimmed">
      Computed from meters recovered ÷ meters drilled per shift. &quot;Not available&quot; means a
      shift had no meters drilled recorded, not that it is ineligible.
    </Text>
  </Stack>
);

const RecentTable = ({ rows, linkBase, showOperator, emptyText }) => {
  if (!rows.length) {
    return (
      <Text c="dimmed" size="sm">
        {emptyText}
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={460}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Job #</Table.Th>
            {showOperator ? <Table.Th>Site manager</Table.Th> : null}
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((entry) => (
            <Table.Tr key={entry.id}>
              <Table.Td>{formatDate(entry.date)}</Table.Td>
              <Table.Td>
                {linkBase ? (
                  <Anchor component={Link} to={`${linkBase}/${entry.id}`} size="sm">
                    {entry.jobNumber || '—'}
                  </Anchor>
                ) : (
                  entry.jobNumber || '—'
                )}
              </Table.Td>
              {showOperator ? <Table.Td>{entry.operator || '—'}</Table.Td> : null}
              <Table.Td>
                <Group gap={7} wrap="nowrap">
                  <Box
                    w={7}
                    h={7}
                    style={{
                      borderRadius: '50%',
                      backgroundColor: `var(--mantine-color-${TIME_LOG_STATUS_COLORS[entry.status]}-6)`,
                      flexShrink: 0
                    }}
                  />
                  <Text size="sm" tt="capitalize">
                    {entry.status}
                  </Text>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

const AdminDashboard = ({ data, user }) => (
  <Stack gap="lg">
    <WelcomeBanner name={user?.name} role="admin" />

    <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="lg">
      <StatCard
        label="Site managers"
        value={fmt(data.operators.total)}
        hint={`${data.operators.active} active · ${data.operators.pendingInvite} pending`}
        icon="users"
        to="/admin/users"
      />
      <StatCard
        label="Jobs"
        value={fmt(data.jobs.total)}
        hint={`${data.jobs.byStatus.scheduled} scheduled · ${data.jobs.byStatus['in-progress']} in progress`}
        icon="jobs"
        to="/admin/jobs"
      />
      <StatCard
        label="Meters drilled"
        value={fmt(data.thisMonth.totals.metersDrilled)}
        hint={`${fmt(data.thisMonth.totals.metersRecovered)} m recovered this month`}
        icon="reports"
        to="/admin/reports"
      />
      <StatCard
        label="Hours logged"
        value={fmt(data.thisMonth.totals.totalLoggedHours)}
        hint={`${fmt(data.thisMonth.totals.standbyHours)} standby hours this month`}
        icon="calendar"
        to="/admin/reports"
      />
    </SimpleGrid>

    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
      <SectionCard title="Submission activity" subtitle="Submissions in the last 7 days">
        <ActivityChart data={data.submissionActivity} />
      </SectionCard>

      <SectionCard title="Bonus eligibility" subtitle={data.thisMonth.label}>
        <BonusEligibility counts={data.thisMonth.bonusEligibility} />
      </SectionCard>
    </SimpleGrid>

    <SectionCard
      title="Recent submissions"
      action={
        <Anchor component={Link} to="/admin/reports" size="sm">
          View all
        </Anchor>
      }
    >
      <RecentTable
        rows={data.recentSubmissions}
        showOperator
        linkBase="/admin/time-logs"
        emptyText="No time logs have been submitted yet."
      />
    </SectionCard>
  </Stack>
);

const OperatorDashboard = ({ data, user }) => (
  <Stack gap="lg">
    <WelcomeBanner name={user?.name} role="operator" />

    <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="lg">
      <StatCard
        label="Assigned jobs"
        value={fmt(data.assignedJobs.total)}
        icon="jobs"
        to="/operator/jobs"
      />
      <StatCard
        label="Drafts in progress"
        value={fmt(data.myTimeLogs.draft)}
        icon="clipboard"
        to="/operator/submissions"
      />
      <StatCard
        label="Submitted"
        value={fmt(data.myTimeLogs.thisMonthSubmitted)}
        hint={`this month · ${data.myTimeLogs.submitted} all time`}
        icon="clipboard"
        to="/operator/submissions"
      />
      <StatCard
        label="Hours logged"
        value={fmt(data.thisMonth.totals.totalLoggedHours)}
        hint={`${fmt(data.thisMonth.totals.standbyHours)} standby hours this month`}
        icon="calendar"
        to="/operator/my-reports"
      />
    </SimpleGrid>

    <SectionCard title="Submission activity" subtitle="Your submissions in the last 7 days">
      <ActivityChart data={data.submissionActivity} />
    </SectionCard>

    <SectionCard
      title="Recent entries"
      action={
        <Anchor component={Link} to="/operator/submissions" size="sm">
          My submissions
        </Anchor>
      }
    >
      <RecentTable
        rows={data.recentEntries}
        linkBase="/operator/log"
        emptyText="You have not started any time logs yet."
      />
    </SectionCard>
  </Stack>
);

export const DashboardPage = () => {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setData(await getDashboard());
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  return data.role === 'admin' ? (
    <AdminDashboard data={data} user={user} />
  ) : (
    <OperatorDashboard data={data} user={user} />
  );
};
