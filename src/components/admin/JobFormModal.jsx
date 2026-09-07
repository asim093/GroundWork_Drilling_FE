import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { createJob, updateJob } from '../../services/jobService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';
import { JOB_STATUS_OPTIONS } from '../../constants/jobs.js';

const emptyForm = {
  jobNumber: '',
  clientName: '',
  jobLocation: '',
  clientJobNumber: '',
  drillType: '',
  scheduledDate: '',
  status: 'scheduled'
};

export const JobFormModal = ({ opened, onClose, job, onSaved }) => {
  const isEdit = Boolean(job);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

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
            clientJobNumber: job.clientJobNumber || '',
            drillType: job.drillType || '',
            scheduledDate: job.scheduledDate ? job.scheduledDate.slice(0, 10) : '',
            status: job.status || 'scheduled'
          }
        : emptyForm
    );
  }, [opened, job]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      jobNumber: form.jobNumber.trim(),
      clientName: form.clientName.trim(),
      jobLocation: form.jobLocation.trim(),
      clientJobNumber: form.clientJobNumber.trim(),
      drillType: form.drillType.trim(),
      scheduledDate: form.scheduledDate || '',
      status: form.status
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

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? 'Edit job' : 'Create job'} centered>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
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
          <TextInput
            label="Job location"
            value={form.jobLocation}
            onChange={(event) => setField('jobLocation')(event.currentTarget.value)}
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
