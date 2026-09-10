import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CopyButton,
  Group,
  Modal,
  Select,
  Stack,
  Switch,
  Text,
  TextInput
} from '@mantine/core';
import { createUser, updateUser } from '../../services/userService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';
import {
  EMPLOYEE_CATEGORY_OPTIONS,
  EMPLOYEE_TYPE_OPTIONS
} from '../../constants/employees.js';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  employeeType: null,
  employeeCategory: null,
  active: true
};

export const UserFormModal = ({ opened, onClose, user, onSaved }) => {
  const isEdit = Boolean(user);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setInviteResult(null);
    setForm(
      user
        ? {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            employeeType: user.employeeType || null,
            employeeCategory: user.employeeCategory || null,
            active: user.active
          }
        : emptyForm
    );
  }, [opened, user]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (isEdit) {
        await updateUser(user.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          employeeType: form.employeeType,
          employeeCategory: form.employeeCategory,
          active: form.active
        });
        notifySuccess('Site manager updated');
        onSaved();
        onClose();
      } else {
        const { data, invite } = await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          employeeType: form.employeeType || undefined,
          employeeCategory: form.employeeCategory || undefined
        });
        notifySuccess(
          invite.delivered
            ? `Invitation email sent to ${data.email}`
            : 'Site manager created — send them the invite link below'
        );
        onSaved();
        setInviteResult(invite);
      }
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to save site manager'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit site manager' : inviteResult ? 'Invitation' : 'New site manager'}
      centered
    >
      {inviteResult ? (
        <Stack gap="md">
          <Alert color={inviteResult.delivered ? 'green' : 'brand'} variant="light">
            {inviteResult.delivered
              ? 'The site manager has been emailed a link to set their password.'
              : 'Email delivery is not configured. Share this one-time link with the site manager so they can set their password.'}
          </Alert>
          <TextInput label="Invite link" value={inviteResult.link} readOnly />
          <Group justify="space-between">
            <CopyButton value={inviteResult.link}>
              {({ copied, copy }) => (
                <Button variant="light" onClick={copy}>
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              )}
            </CopyButton>
            <Button onClick={onClose}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {!isEdit ? (
              <Text size="sm" c="dimmed">
                The site manager sets their own password from an emailed invitation link.
              </Text>
            ) : null}
            <TextInput
              label="Name"
              required
              value={form.name}
              onChange={(event) => setField('name')(event.currentTarget.value)}
            />
            <TextInput
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setField('email')(event.currentTarget.value)}
            />
            <TextInput
              label="Phone"
              value={form.phone}
              onChange={(event) => setField('phone')(event.currentTarget.value)}
            />
            <Select
              label="Employee type"
              placeholder="Not set"
              data={EMPLOYEE_TYPE_OPTIONS}
              value={form.employeeType}
              onChange={setField('employeeType')}
              clearable
            />
            <Select
              label="Employee category"
              placeholder="Not set"
              data={EMPLOYEE_CATEGORY_OPTIONS}
              value={form.employeeCategory}
              onChange={setField('employeeCategory')}
              clearable
            />
            {isEdit ? (
              <Switch
                label="Active"
                checked={form.active}
                onChange={(event) => setField('active')(event.currentTarget.checked)}
              />
            ) : null}
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {isEdit ? 'Save changes' : 'Create and invite'}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
};
