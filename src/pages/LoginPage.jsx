import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_ROUTE } from '../constants/nav.js';
import { extractErrorMessage } from '../services/api.js';
import { notifyError, notifySuccess } from '../lib/toast.js';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const user = await login(email.trim(), password);
      notifySuccess('Signed in successfully');
      const fallback = DEFAULT_ROUTE[user.role] || DEFAULT_ROUTE.operator;
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to sign in. Please check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Center mih="100vh" p="md">
      <Card withBorder shadow="sm" radius="md" p="xl" w="100%" maw={380}>
        <Stack gap="lg">
          <Stack gap={4}>
            <Title order={3}>Sign in</Title>
            <Text c="dimmed" size="sm">
              Time &amp; material logging for Groundwork Drilling
            </Text>
          </Stack>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
              <PasswordInput
                label="Password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              <Button type="submit" fullWidth loading={submitting}>
                Sign in
              </Button>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Center>
  );
};
