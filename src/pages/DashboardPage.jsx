import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Anchor,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon
} from '@mantine/core';
import { StatCard } from '../components/dashboard/StatCard.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { NavIcon } from '../components/NavIcon.jsx';
import { SCHEDULING_STATUS_COLORS } from '../constants/scheduling.js';
import { TIME_LOG_STATUS_COLORS } from '../constants/timeLogs.js';
import { BONUS_ELIGIBILITY, BONUS_ELIGIBILITY_ORDER } from '../constants/bonus.js';
import { usePageTitle } from '../context/PageTitleContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../lib/dateRange.js';
import { getDashboard } from '../services/dashboardService.js';
import { extractErrorMessage } from '../services/api.js';
import { notifyError } from '../lib/toast.js';

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
            {showOperator ? <Table.Th>Operator</Table.Th> : null}
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
                <Badge variant="light" color={TIME_LOG_STATUS_COLORS[entry.status]}>
                  {entry.status}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

const SchedulingBreakdown = ({ counts }) => {
  const total = counts.submitted + counts.draft + counts.missing;

  return (
    <Stack gap="sm">
      <SimpleGrid cols={3}>
        {['submitted', 'draft', 'missing'].map((key) => (
          <Stack key={key} gap={4} align="center">
            <Text fw={700} fz={26} lh={1} c={`${SCHEDULING_STATUS_COLORS[key]}.7`}>
              {counts[key]}
            </Text>
            <Badge size="sm" variant="light" color={SCHEDULING_STATUS_COLORS[key]} tt="capitalize">
              {key}
            </Badge>
          </Stack>
        ))}
      </SimpleGrid>
      {total > 0 ? (
        <Progress.Root size="sm" radius="xl">
          {['submitted', 'draft', 'missing'].map((key) =>
            counts[key] ? (
              <Progress.Section
                key={key}
                value={(counts[key] / total) * 100}
                color={SCHEDULING_STATUS_COLORS[key]}
              />
            ) : null
          )}
        </Progress.Root>
      ) : (
        <Text c="dimmed" size="sm">
          No jobs scheduled this month.
        </Text>
      )}
    </Stack>
  );
};

const BonusBreakdown = ({ counts }) => {
  const total = BONUS_ELIGIBILITY_ORDER.reduce((sum, key) => sum + (counts[key] || 0), 0);

  return (
    <Stack gap="sm">
      <Progress.Root size="xl" radius="sm">
        {BONUS_ELIGIBILITY_ORDER.map((key) =>
          counts[key] ? (
            <Progress.Section
              key={key}
              value={(counts[key] / total) * 100}
              color={BONUS_ELIGIBILITY[key].color}
            >
              {counts[key]}
            </Progress.Section>
          ) : null
        )}
      </Progress.Root>
      <Group gap="lg" wrap="wrap">
        {BONUS_ELIGIBILITY_ORDER.map((key) => (
          <Group key={key} gap={6} wrap="nowrap">
            <Badge
              color={BONUS_ELIGIBILITY[key].color}
              variant={BONUS_ELIGIBILITY[key].variant}
              radius="sm"
              size="sm"
            >
              {BONUS_ELIGIBILITY[key].label}
            </Badge>
            <Text fw={700}>{counts[key] || 0}</Text>
          </Group>
        ))}
      </Group>
      <Text size="xs" c="dimmed">
        Derived from a manually entered recovery % — &quot;Not available&quot; means none was
        entered, not that the entry is ineligible.
      </Text>
    </Stack>
  );
};

const AdminDashboard = ({ data }) => (
  <Stack gap="lg">
    <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="lg">
      <StatCard
        label="Operators"
        value={data.operators.total}
        hint={`${data.operators.active} active · ${data.operators.pendingInvite} pending`}
        icon="users"
        color="blue"
      />
      <StatCard
        label="Jobs"
        value={data.jobs.total}
        hint={`${data.jobs.byStatus.scheduled} scheduled · ${data.jobs.byStatus['in-progress']} in progress`}
        icon="jobs"
        color="grape"
      />
      <StatCard
        label="Submitted this month"
        value={data.thisMonth.timeLogs.submitted}
        hint={`${data.thisMonth.timeLogs.draft} still in draft`}
        icon="clipboard"
        color="teal"
      />
      <StatCard
        label="Hours this month"
        value={data.thisMonth.totals.hoursOnSite}
        hint={`${data.thisMonth.totals.standbyHours} standby hours`}
        icon="reports"
        color="orange"
      />
    </SimpleGrid>

    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <SectionCard
        title={`Scheduling · ${data.thisMonth.label}`}
        action={
          <Anchor component={Link} to="/admin/scheduling" size="sm">
            Open
          </Anchor>
        }
      >
        <SchedulingBreakdown counts={data.thisMonth.scheduling} />
      </SectionCard>

      <SectionCard title={`Bonus eligibility · ${data.thisMonth.label}`}>
        <BonusBreakdown counts={data.thisMonth.bonusEligibility} />
      </SectionCard>
    </SimpleGrid>

    <SectionCard
      title="Recent submissions"
      action={
        <Anchor component={Link} to="/admin/reports" size="sm">
          Reports
        </Anchor>
      }
    >
      <RecentTable
        rows={data.recentSubmissions}
        showOperator
        emptyText="No time logs have been submitted yet."
      />
    </SectionCard>
  </Stack>
);

const OperatorDashboard = ({ data }) => (
  <Stack gap="lg">
    <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="lg">
      <StatCard label="Assigned jobs" value={data.assignedJobs.total} icon="jobs" color="blue" />
      <StatCard
        label="Drafts in progress"
        value={data.myTimeLogs.draft}
        icon="clipboard"
        color="yellow"
      />
      <StatCard
        label="Submitted this month"
        value={data.myTimeLogs.thisMonthSubmitted}
        hint={`${data.myTimeLogs.submitted} all time`}
        icon="clipboard"
        color="teal"
      />
      <StatCard
        label="Hours this month"
        value={data.thisMonth.totals.hoursOnSite}
        hint={`${data.thisMonth.totals.standbyHours} standby hours`}
        icon="reports"
        color="orange"
      />
    </SimpleGrid>

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

  return (
    <Stack gap="lg">
      <Card withBorder radius="lg" p="lg" bg="var(--mantine-color-blue-light)">
        <Group gap="md" wrap="nowrap">
          <ThemeIcon size={44} radius="xl" variant="white" color="blue">
            <NavIcon name="home" size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={700} fz="lg">
              Welcome back, {user?.name}
            </Text>
            <Text size="sm" c="dimmed">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </Stack>
        </Group>
      </Card>

      {data.role === 'admin' ? <AdminDashboard data={data} /> : <OperatorDashboard data={data} />}
    </Stack>
  );
};
