import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Button,
  Group,
  Modal,
  MultiSelect,
  Select,
  SimpleGrid,
  Stack,
  TextInput
} from '@mantine/core';
import { createJob, updateJob } from '../../services/jobService.js';
import { locationsService, rigNumbersService } from '../../services/masterDataService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';
import { JOB_STATUS_OPTIONS } from '../../constants/jobs.js';

const emptyForm = {
  jobNumber: '',
  clientName: '',
  jobLocation: '',
  rigNumber: null,
  clientJobNumber: '',
  drillType: '',
  scheduledDate: '',
  status: 'scheduled',
  assignedUserIds: []
};

export const JobFormModal = ({ opened, onClose, job, operators = [], onSaved }) => {
  const isEdit = Boolean(job);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [rigOptions, setRigOptions] = useState([]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setForm(
      job
        ? {
            jobNumber: job.jobNumber || '',
            clientName: job.clientName || '',
            jobLocation: job.jobLocation || '',
            rigNumber: job.rigNumber?.id || null,
            clientJobNumber: job.clientJobNumber || '',
            drillType: job.drillType || '',
            scheduledDate: job.scheduledDate ? job.scheduledDate.slice(0, 10) : '',
            status: job.status || 'scheduled',
            assignedUserIds: (job.assignedUserIds || []).map((entry) => entry.id || entry)
          }
        : emptyForm
    );

    Promise.all([
      locationsService.list({ active: 'true', limit: 100, sort: 'name', order: 'asc' }),
      rigNumbersService.list({ active: 'true', limit: 100, sort: 'name', order: 'asc' })
    ])
      .then(([locations, rigs]) => {
        setLocationOptions(locations.data.map((item) => item.name));
        setRigOptions(rigs.data.map((item) => ({ value: item.id, label: item.name })));
      })
      .catch((error) => notifyError(extractErrorMessage(error, 'Unable to load master data')));
  }, [opened, job]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      jobNumber: form.jobNumber.trim(),
      clientName: form.clientName.trim(),
      jobLocation: form.jobLocation.trim(),
      rigNumber: form.rigNumber || '',
      clientJobNumber: form.clientJobNumber.trim(),
      drillType: form.drillType.trim(),
      scheduledDate: form.scheduledDate || '',
      status: form.status,
      assignedUserIds: form.assignedUserIds
    };

    try {
      if (isEdit) {
        await updateJob(job.id, payload);
        notifySuccess('Job updated');
      } else {
        await createJob(payload);
        notifySuccess('Job created');
      }

      onSaved();
      onClose();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to save job'));
    } finally {
      setSubmitting(false);
    }
  };

  const operatorOptions = operators.map((operator) => ({
    value: operator.id,
    label: `${operator.name} (${operator.email})`
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit job' : 'Create job'}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Job number"
              required
              value={form.jobNumber}
              onChange={(event) => setField('jobNumber')(event.currentTarget.value)}
            />
            <TextInput
              label="Client name"
              required
              value={form.clientName}
              onChange={(event) => setField('clientName')(event.currentTarget.value)}
            />
            <Autocomplete
              label="Job location"
              placeholder="Select or type a location"
              data={locationOptions}
              value={form.jobLocation}
              onChange={setField('jobLocation')}
            />
            <Select
              label="Rig number"
              placeholder="Not assigned"
              data={rigOptions}
              value={form.rigNumber}
              onChange={setField('rigNumber')}
              clearable
            />
            <TextInput
              label="Client job number"
              value={form.clientJobNumber}
              onChange={(event) => setField('clientJobNumber')(event.currentTarget.value)}
            />
            <TextInput
              label="Drill type"
              value={form.drillType}
              onChange={(event) => setField('drillType')(event.currentTarget.value)}
            />
            <TextInput
              label="Scheduled date"
              type="date"
              value={form.scheduledDate}
              onChange={(event) => setField('scheduledDate')(event.currentTarget.value)}
            />
            <Select
              label="Status"
              data={JOB_STATUS_OPTIONS}
              value={form.status}
              onChange={(value) => setField('status')(value || 'scheduled')}
              allowDeselect={false}
            />
          </SimpleGrid>

          <MultiSelect
            label="Assigned operators"
            description="Operators can also be assigned later from the Assign button."
            placeholder={operatorOptions.length ? 'Select operators' : 'No active operators available'}
            data={operatorOptions}
            value={form.assignedUserIds}
            onChange={setField('assignedUserIds')}
            searchable
            clearable
            maxDropdownHeight={200}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save changes' : 'Create job'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
