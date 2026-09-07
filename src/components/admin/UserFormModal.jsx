import { useEffect, useState } from 'react';
import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Switch,
  TextInput
} from '@mantine/core';
import { createUser, updateUser } from '../../services/userService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const emptyForm = { name: '', email: '', password: '', role: 'operator', phone: '', active: true };

export const UserFormModal = ({ opened, onClose, user, onSaved }) => {
  const isEdit = Boolean(user);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setForm(
      user
        ? {
            name: user.name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'operator',
            phone: user.phone || '',
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
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          phone: form.phone.trim(),
          active: form.active
        };

        if (form.password) {
          payload.password = form.password;
        }

        await updateUser(user.id, payload);
        notifySuccess('User updated');
      } else {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          phone: form.phone.trim() || undefined
        });
        notifySuccess('User created');
      }

      onSaved();
      onClose();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to save user'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? 'Edit user' : 'Create user'} centered>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
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
          <PasswordInput
            label={isEdit ? 'New password' : 'Password'}
            description={isEdit ? 'Leave blank to keep the current password' : undefined}
            required={!isEdit}
            value={form.password}
            onChange={(event) => setField('password')(event.currentTarget.value)}
          />
          <Select
            label="Role"
            data={[
              { value: 'operator', label: 'Operator' },
              { value: 'admin', label: 'Admin' }
            ]}
            value={form.role}
            onChange={(value) => setField('role')(value || 'operator')}
            allowDeselect={false}
          />
          <TextInput
            label="Phone"
            value={form.phone}
            onChange={(event) => setField('phone')(event.currentTarget.value)}
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
              {isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
