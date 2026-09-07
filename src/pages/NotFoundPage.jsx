import { Link } from 'react-router-dom';
import { Button, Center, Stack, Text, Title } from '@mantine/core';

export const NotFoundPage = () => (
  <Center mih="100vh" p="md">
    <Stack align="center" gap="sm">
      <Title order={2}>Page not found</Title>
      <Text c="dimmed">The page you are looking for does not exist.</Text>
      <Button component={Link} to="/">
        Go back
      </Button>
    </Stack>
  </Center>
);
