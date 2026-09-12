import { useState } from 'react';
import { Button, Paper, PasswordInput, Stack, Text } from '@mantine/core';
import { changePassword } from '../../services/authService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

export const AccountPanel = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      notifyError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      notifyError('The two passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);
      notifySuccess('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to update your password'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper withBorder radius="lg" p="lg" maw={420}>
      <Stack gap="md">
        <div>
          <Text fw={700}>Change password</Text>
          <Text size="xs" c="dimmed">
            Update the password for your own account.
          </Text>
        </div>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.currentTarget.value)}
            />
            <PasswordInput
              label="New password"
              description="At least 8 characters"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.currentTarget.value)}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            />
            <Button type="submit" loading={submitting}>
              Update password
            </Button>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
};
