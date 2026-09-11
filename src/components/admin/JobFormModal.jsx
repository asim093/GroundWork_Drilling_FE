import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Button,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  TextInput
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { createJob, updateJob } from '../../services/jobService.js';
import { listUsers } from '../../services/userService.js';
import {
  employeesService,
  locationsService,
  rigNumbersService
} from '../../services/masterDataService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';
import { JOB_STATUS_OPTIONS } from '../../constants/jobs.js';
import { PeopleSummary } from './PeopleSummary.jsx';
import { PeopleAssignModal } from './PeopleAssignModal.jsx';

const todayIso = () => new Date().toISOString().slice(0, 10);
const FIELD = { size: 'sm', radius: 'sm' };

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

export const JobFormModal = ({ opened, onClose, job, onSaved }) => {
  const isEdit = Boolean(job);
  const [form, setForm] = useState(makeEmptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [rigOptions, setRigOptions] = useState([]);
  const [operators, setOperators] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [peopleOpen, setPeopleOpen] = useState(false);

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
            siteManagers: [],
            rosterEmployeeIds: []
          }
        : makeEmptyForm()
    );

    const requests = [
      locationsService.list({ active: 'true', limit: 100, sort: 'name', order: 'asc' }),
      rigNumbersService.list({ active: 'true', limit: 100, sort: 'name', order: 'asc' })
    ];
    if (!job) {
      requests.push(
        listUsers({ role: 'operator', active: 'true', limit: 200, sort: 'name', order: 'asc' }),
        employeesService.list({ active: 'true', limit: 200, sort: 'name', order: 'asc' })
      );
    }

    Promise.all(requests)
      .then(([locations, rigs, users, roster]) => {
        setLocationOptions(locations.data.map((item) => item.name));
        setRigOptions(rigs.data.map((item) => ({ value: item.id, label: item.name })));
        setOperators(users?.data || []);
        setEmployees(roster?.data || []);
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
      status: form.status
    };
    if (!isEdit) {
      payload.siteManagers = form.siteManagers;
      payload.rosterEmployeeIds = form.rosterEmployeeIds;
    }

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
      size="lg"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="md">
            <TextInput
              {...FIELD}
              label="Job number"
              required
              value={form.jobNumber}
              onChange={(event) => setField('jobNumber')(event.currentTarget.value)}
            />
            <TextInput
              {...FIELD}
              label="Client name"
              required
              value={form.clientName}
              onChange={(event) => setField('clientName')(event.currentTarget.value)}
            />
            <Autocomplete
              {...FIELD}
              label="Job location"
              placeholder="Select or type a location"
              data={locationOptions}
              value={form.jobLocation}
              onChange={setField('jobLocation')}
            />
            <Select
              {...FIELD}
              label="Rig number"
              placeholder="Not assigned"
              data={rigOptions}
              value={form.rigNumber}
              onChange={setField('rigNumber')}
              searchable
              clearable
            />
            <TextInput
              {...FIELD}
              label="Drill Number"
              placeholder="e.g. CME55, NQ, HQ3"
              value={form.drillNumber}
              onChange={(event) => setField('drillNumber')(event.currentTarget.value)}
            />
            <TextInput
              {...FIELD}
              label="Client job number"
              value={form.clientJobNumber}
              onChange={(event) => setField('clientJobNumber')(event.currentTarget.value)}
            />
            <DatePickerInput
              {...FIELD}
              label="Scheduled date"
              valueFormat="DD MMM YYYY"
              value={form.scheduledDate}
              onChange={setField('scheduledDate')}
            />
            <Select
              {...FIELD}
              label="Status"
              data={JOB_STATUS_OPTIONS}
              value={form.status}
              onChange={(value) => setField('status')(value || 'scheduled')}
              allowDeselect={false}
            />
          </SimpleGrid>

          {isEdit ? null : (
            <>
              <Divider label="People" labelPosition="left" />
              <PeopleSummary
                siteManagers={form.siteManagers.map((entry) => ({
                  userId: operators.find((operator) => operator.id === entry.userId) || entry.userId,
                  shift: entry.shift
                }))}
                rosterEmployeeIds={form.rosterEmployeeIds.map(
                  (id) => employees.find((employee) => employee.id === id) || id
                )}
                operators={operators}
                employees={employees}
                onManage={() => setPeopleOpen(true)}
              />
            </>
          )}

          <Group justify="flex-end" gap="sm" wrap="nowrap">
            <Button variant="default" onClick={onClose} type="button" size="sm">
              Cancel
            </Button>
            <Button type="submit" loading={submitting} size="sm">
              {isEdit ? 'Save changes' : 'Create job'}
            </Button>
          </Group>
        </Stack>
      </form>

      <PeopleAssignModal
        opened={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        siteManagers={form.siteManagers}
        rosterEmployeeIds={form.rosterEmployeeIds}
        operators={operators}
        employees={employees}
        onChange={({ siteManagers, rosterEmployeeIds }) =>
          setForm((prev) => ({ ...prev, siteManagers, rosterEmployeeIds }))
        }
      />
    </Modal>
  );
};
