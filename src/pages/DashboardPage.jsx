import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Anchor,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title
} from '@mantine/core';
import { StatCard } from '../components/dashboard/StatCard.jsx';
import { BonusEligibilityPanel } from '../components/reports/BonusEligibilityPanel.jsx';
import { SCHEDULING_STATUS_COLORS } from '../constants/scheduling.js';
import { TIME_LOG_STATUS_COLORS } from '../constants/timeLogs.js';
import { usePageTitle } from '../context/PageTitleContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../lib/dateRange.js';
import { getDashboard } from '../services/dashboardService.js';
import { extractErrorMessage } from '../services/api.js';
import { notifyError } from '../lib/toast.js';

const RecentTable = ({ rows, linkBase, showOperator }) => {
  if (!rows.length) {
    return (
      <Text c="dimmed" size="sm">
        Nothing submitted yet.
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={480}>
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

const AdminDashboard = ({ data }) => (
  <Stack gap="lg">
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
      <StatCard
        label="Operators"
        value={data.operators.total}
        hint={`${data.operators.active} active · ${data.operators.pendingInvite} pending invite`}
        icon="users"
      />
      <StatCard label="Jobs" value={data.jobs.total} hint={`${data.jobs.byStatus.scheduled} scheduled`} icon="jobs" />
      <StatCard
        label={`Submitted (${data.thisMonth.label})`}
        value={data.thisMonth.timeLogs.submitted}
        hint={`${data.thisMonth.timeLogs.draft} in draft`}
        icon="clipboard"
        color="green"
      />
      <StatCard
        label={`Hours on site (${data.thisMonth.label})`}
        value={data.thisMonth.totals.hoursOnSite}
        hint={`${data.thisMonth.totals.standbyHours} standby`}
        icon="reports"
      />
    </SimpleGrid>

    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
      <Card withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={700}>Scheduling — {data.thisMonth.label}</Text>
          <SimpleGrid cols={3}>
            {['submitted', 'draft', 'missing'].map((key) => (
              <Stack key={key} gap={2} align="center">
                <Badge size="lg" color={SCHEDULING_STATUS_COLORS[key]} variant="light" tt="capitalize">
                  {key}
                </Badge>
                <Text fw={700} fz="xl">
                  {data.thisMonth.scheduling[key]}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
          <Anchor component={Link} to="/admin/scheduling" size="sm">
            Open scheduling view
          </Anchor>
        </Stack>
      </Card>

      <Card withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={700}>Bonus eligibility — {data.thisMonth.label}</Text>
          <BonusEligibilityPanel counts={data.thisMonth.bonusEligibility} />
        </Stack>
      </Card>
    </SimpleGrid>

    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700}>Recent submissions</Text>
          <Anchor component={Link} to="/admin/reports" size="sm">
            Reports
          </Anchor>
        </Group>
        <RecentTable rows={data.recentSubmissions} showOperator />
      </Stack>
    </Card>
  </Stack>
);

const OperatorDashboard = ({ data }) => (
  <Stack gap="lg">
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
      <StatCard label="Assigned jobs" value={data.assignedJobs.total} icon="jobs" />
      <StatCard label="Drafts in progress" value={data.myTimeLogs.draft} icon="clipboard" color="yellow" />
      <StatCard
        label={`Submitted (${data.thisMonth.label})`}
        value={data.myTimeLogs.thisMonthSubmitted}
        hint={`${data.myTimeLogs.submitted} all time`}
        icon="clipboard"
        color="green"
      />
      <StatCard
        label={`Hours on site (${data.thisMonth.label})`}
        value={data.thisMonth.totals.hoursOnSite}
        hint={`${data.thisMonth.totals.standbyHours} standby`}
        icon="reports"
      />
    </SimpleGrid>

    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700}>Recent entries</Text>
          <Anchor component={Link} to="/operator/submissions" size="sm">
            My submissions
          </Anchor>
        </Group>
        <RecentTable rows={data.recentEntries} linkBase="/operator/log" />
      </Stack>
    </Card>
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
    <Stack gap="md">
      <Title order={3}>Welcome, {user?.name}</Title>
      {data.role === 'admin' ? <AdminDashboard data={data} /> : <OperatorDashboard data={data} />}
    </Stack>
  );
};
