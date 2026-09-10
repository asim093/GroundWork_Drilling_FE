import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Button,
  Divider,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  TextInput
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { createJob, updateJob } from '../../services/jobService.js';
import {
  employeesService,
  locationsService,
  rigNumbersService
} from '../../services/masterDataService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';
import { JOB_STATUS_OPTIONS } from '../../constants/jobs.js';
import { SiteManagerPicker } from './SiteManagerPicker.jsx';
import { RosterPicker } from './RosterPicker.jsx';

const todayIso = () => new Date().toISOString().slice(0, 10);

const makeEmptyForm = () => ({
  jobNumber: '',
  clientName: '',
  jobLocation: '',
  rigNumber: null,
  drillNumber: '',
  clientJobNumber: '',
  scheduledDate: todayIso(),
  status: 'scheduled',
  siteManagers: [],
  rosterEmployeeIds: []
});

const idOf = (entry) => entry?.id || entry?._id || entry;

export const JobFormModal = ({ opened, onClose, job, operators = [], onSaved }) => {
  const isEdit = Boolean(job);
  const [form, setForm] = useState(makeEmptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [rigOptions, setRigOptions] = useState([]);
  const [employees, setEmployees] = useState([]);

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
            drillNumber: job.drillNumber || '',
            clientJobNumber: job.clientJobNumber || '',
            scheduledDate: job.scheduledDate ? job.scheduledDate.slice(0, 10) : '',
            status: job.status || 'scheduled',
            siteManagers: (job.siteManagers || []).map((entry) => ({
              userId: idOf(entry.userId),
              shift: entry.shift
            })),
            rosterEmployeeIds: (job.rosterEmployeeIds || []).map(idOf)
          }
        : makeEmptyForm()
    );

    Promise.all([
      locationsService.list({ active: 'true', limit: 100, sort: 'name', order: 'asc' }),
      rigNumbersService.list({ active: 'true', limit: 100, sort: 'name', order: 'asc' }),
      employeesService.list({ active: 'true', limit: 200, sort: 'name', order: 'asc' })
    ])
      .then(([locations, rigs, roster]) => {
        setLocationOptions(locations.data.map((item) => item.name));
        setRigOptions(rigs.data.map((item) => ({ value: item.id, label: item.name })));
        setEmployees(roster.data);
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
      drillNumber: form.drillNumber.trim(),
      clientJobNumber: form.clientJobNumber.trim(),
      scheduledDate: form.scheduledDate || '',
      status: form.status,
      siteManagers: form.siteManagers,
      rosterEmployeeIds: form.rosterEmployeeIds,
      assignedUserIds: [...new Set(form.siteManagers.map((entry) => entry.userId))]
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
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit job' : 'Create job'}
      centered
      size="xl"
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
              searchable
              clearable
            />
            <TextInput
              label="Drill Number"
              placeholder="e.g. CME55, NQ, HQ3"
              value={form.drillNumber}
              onChange={(event) => setField('drillNumber')(event.currentTarget.value)}
            />
            <TextInput
              label="Client job number"
              value={form.clientJobNumber}
              onChange={(event) => setField('clientJobNumber')(event.currentTarget.value)}
            />
            <DatePickerInput
              label="Scheduled date"
              valueFormat="DD MMM YYYY"
              value={form.scheduledDate}
              onChange={setField('scheduledDate')}
            />
            <Select
              label="Status"
              data={JOB_STATUS_OPTIONS}
              value={form.status}
              onChange={(value) => setField('status')(value || 'scheduled')}
              allowDeselect={false}
            />
          </SimpleGrid>

          <Divider />

          <SiteManagerPicker
            value={form.siteManagers}
            onChange={setField('siteManagers')}
            operators={operators}
          />

          <Divider />

          <RosterPicker
            value={form.rosterEmployeeIds}
            onChange={setField('rosterEmployeeIds')}
            employees={employees}
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
