import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Center,
  Loader,
  PasswordInput,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';
import { acceptInvite, fetchInvite } from '../services/authService.js';
import { extractErrorMessage } from '../services/api.js';
import { notifyError, notifySuccess } from '../lib/toast.js';

export const SetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { applySession } = useAuth();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInvite = useCallback(async () => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    try {
      setInvite(await fetchInvite(token));
    } catch {
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirm) {
      notifyError('The two passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const { token: sessionToken, user } = await acceptInvite(token, password);
      applySession(sessionToken, user);
      notifySuccess('Your password has been set');
      navigate(user.role === 'admin' ? '/admin' : '/operator', { replace: true });
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to set your password'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Center mih="100vh" p="md">
      <Card withBorder shadow="sm" radius="md" p="xl" w="100%" maw={400}>
        {loading ? (
          <Center py="lg">
            <Loader />
          </Center>
        ) : invalid ? (
          <Stack gap="md">
            <Title order={3}>Link expired</Title>
            <Alert color="red" variant="light">
              This invitation link is invalid or has expired. Ask your administrator to send a new
              one.
            </Alert>
            <Button component={Link} to="/login" variant="light">
              Go to sign in
            </Button>
          </Stack>
        ) : (
          <Stack gap="lg">
            <Stack gap={4}>
              <Title order={3}>Set your password</Title>
              <Text c="dimmed" size="sm">
                Welcome, {invite.name}. Choose a password for {invite.email} to activate your
                Groundwork Drilling account.
              </Text>
            </Stack>
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <PasswordInput
                  label="New password"
                  description="At least 8 characters"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                />
                <PasswordInput
                  label="Confirm password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(event) => setConfirm(event.currentTarget.value)}
                />
                <Button type="submit" fullWidth loading={submitting}>
                  Set password and sign in
                </Button>
              </Stack>
            </form>
          </Stack>
        )}
      </Card>
    </Center>
  );
};
