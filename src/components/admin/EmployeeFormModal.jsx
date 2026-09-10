import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, Switch, TextInput } from '@mantine/core';
import { employeesService } from '../../services/masterDataService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';
import {
  EMPLOYEE_CATEGORY_OPTIONS,
  EMPLOYEE_TYPE_OPTIONS
} from '../../constants/employees.js';

const emptyForm = {
  name: '',
  employeeType: null,
  employeeCategory: null,
  active: true
};

export const EmployeeFormModal = ({ opened, onClose, employee, onSaved }) => {
  const isEdit = Boolean(employee);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setForm(
      employee
        ? {
            name: employee.name || '',
            employeeType: employee.employeeType || null,
            employeeCategory: employee.employeeCategory || null,
            active: employee.active
          }
        : emptyForm
    );
  }, [opened, employee]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      employeeType: form.employeeType,
      employeeCategory: form.employeeCategory || ''
    };

    try {
      if (isEdit) {
        await employeesService.update(employee.id, { ...payload, active: form.active });
        notifySuccess('Employee updated');
      } else {
        await employeesService.create(payload);
        notifySuccess('Employee added');
      }

      onSaved();
      onClose();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to save employee'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit employee' : 'New employee'}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Name"
            required
            value={form.name}
            onChange={(event) => setField('name')(event.currentTarget.value)}
            data-autofocus
          />
          <Select
            label="Employee type"
            placeholder="Select a type"
            required
            data={EMPLOYEE_TYPE_OPTIONS}
            value={form.employeeType}
            onChange={setField('employeeType')}
            searchable
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
            <Button type="submit" loading={submitting} disabled={!form.name.trim() || !form.employeeType}>
              {isEdit ? 'Save changes' : 'Add employee'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
