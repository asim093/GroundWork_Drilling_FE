import { Card, Stack, Text, Title } from '@mantine/core';
import { AppLayout } from '../components/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const OperatorDashboardPage = () => {
  const { user } = useAuth();

  return (
    <AppLayout title="Operator">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={3}>Welcome, {user?.name}</Title>
          <Text c="dimmed">Your assigned jobs will appear here</Text>
        </Stack>
        <Card withBorder radius="md" p="lg">
          <Text fw={600}>Assigned jobs</Text>
          <Text c="dimmed" size="sm">
            Coming soon
          </Text>
        </Card>
      </Stack>
    </AppLayout>
  );
};
