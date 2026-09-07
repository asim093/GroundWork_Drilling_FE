import { Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { AppLayout } from '../components/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const upcomingSections = [
  'Projects and jobs',
  'User accounts and assignments',
  'Scheduling view',
  'Reporting dashboard'
];

export const AdminDashboardPage = () => {
  const { user } = useAuth();

  return (
    <AppLayout title="Admin">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={3}>Welcome, {user?.name}</Title>
          <Text c="dimmed">Admin workspace</Text>
        </Stack>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {upcomingSections.map((section) => (
            <Card key={section} withBorder radius="md" p="lg">
              <Text fw={600}>{section}</Text>
              <Text c="dimmed" size="sm">
                Coming soon
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </AppLayout>
  );
};
