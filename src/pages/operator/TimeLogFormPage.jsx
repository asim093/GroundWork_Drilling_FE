import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Fieldset,
  Group,
  Loader,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput
} from '@mantine/core';
import { AppLayout } from '../../components/AppLayout.jsx';
import { OPERATOR_NAV } from '../../constants/nav.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { ActivityLinesSection } from '../../components/timelog/ActivityLinesSection.jsx';
import { ConsumablesSection } from '../../components/timelog/ConsumablesSection.jsx';
import { TIME_LOG_STATUS_COLORS } from '../../constants/timeLogs.js';
import { SHIFT_OPTIONS } from '../../constants/employees.js';
import {
  emptyTimeLogForm,
  timeLogFormFromEntry,
  timeLogPayloadFromForm
} from '../../lib/timeLogForm.js';
import {
  shiftRecoveryPercent,
  totalDrilledMeters,
  totalLineHours,
  totalRecoveryMeters,
  validateActivityLines
} from '../../lib/timeLogMath.js';
import {
  createTimeLog,
  getAssignedJob,
  getTimeLog,
  submitTimeLog,
  updateTimeLog
} from '../../services/timeLogService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const GRID = { base: 1, sm: 2 };

export const TimeLogFormPage = () => {
  usePageTitle('Time & material log');
  const { jobId, id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [entry, setEntry] = useState(null);
  const [form, setForm] = useState(emptyTimeLogForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lineErrors, setLineErrors] = useState({});

  const readOnly = entry?.status === 'submitted';

  const totalDrilled = totalDrilledMeters(form.activityLines);
  const totalRecovered = totalRecoveryMeters(form.activityLines);
  const totalHours = totalLineHours(form.activityLines);
  const recoveryPreview = shiftRecoveryPercent(form.activityLines);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      if (id) {
        const loaded = await getTimeLog(id);
        setEntry(loaded);
        setJob(loaded.jobId);
        setForm(timeLogFormFromEntry(loaded));
      } else {
        const loadedJob = await getAssignedJob(jobId);
        setJob(loadedJob);
        setEntry(null);
        setForm(emptyTimeLogForm());
      }
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to open the time log'));
      navigate('/operator/jobs', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, jobId, navigate]);

  useEffect(() => {
    if (id && entry?.id === id) {
      return;
    }
    load();
  }, [id, jobId, entry?.id, load]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setWellTag = (key, value) =>
    setForm((prev) => ({ ...prev, wellTag: { ...prev.wellTag, [key]: value } }));

  const setFuel = (key, value) =>
    setForm((prev) => ({ ...prev, fuel: { ...prev.fuel, [key]: value } }));

  const parseServerLineErrors = (error) => {
    const serverErrors = error?.response?.data?.errors;
    if (!Array.isArray(serverErrors)) {
      return null;
    }
    const byLine = {};
    serverErrors.forEach(({ field, message }) => {
      const match = /^activityLines\[(\d+)\]\.(\w+)$/.exec(field || '');
      if (match) {
        const index = Number(match[1]);
        byLine[index] = { ...byLine[index], [match[2]]: message };
      }
    });
    return Object.keys(byLine).length ? byLine : null;
  };

  const persist = async () => {
    const clientLineErrors = validateActivityLines(form.activityLines);
    if (clientLineErrors) {
      setLineErrors(clientLineErrors);
      throw new Error('Fix the highlighted activity line values before saving');
    }
    setLineErrors({});

    const payload = timeLogPayloadFromForm(form);

    if (entry) {
      const updated = await updateTimeLog(entry.id, payload);
      setEntry(updated);
      return updated;
    }

    const created = await createTimeLog({ ...payload, jobId: job.id });
    setEntry(created);
    navigate(`/operator/log/${created.id}`, { replace: true });
    return created;
  };

  const handleSaveDraft = async () => {
    setSaving(true);

    try {
      await persist();
      notifySuccess('Draft saved');
    } catch (error) {
      const serverLineErrors = parseServerLineErrors(error);
      if (serverLineErrors) {
        setLineErrors(serverLineErrors);
      }
      notifyError(extractErrorMessage(error, 'Unable to save draft'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const saved = await persist();
      const submitted = await submitTimeLog(saved.id);
      setEntry(submitted);
      setForm(timeLogFormFromEntry(submitted));
      notifySuccess('Time log submitted');
      navigate('/operator/submissions');
    } catch (error) {
      const serverLineErrors = parseServerLineErrors(error);
      if (serverLineErrors) {
        setLineErrors(serverLineErrors);
      }
      notifyError(extractErrorMessage(error, 'Unable to submit time log'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout navItems={OPERATOR_NAV}>
        <Center py="xl">
          <Loader />
        </Center>
      </AppLayout>
    );
  }

  const numberField = (key, label) => (
    <NumberInput
      label={label}
      value={form[key]}
      disabled={readOnly}
      onChange={(value) => setField(key, value)}
    />
  );

  const timeField = (key, label) => (
    <TextInput
      label={label}
      type="time"
      value={form[key]}
      disabled={readOnly}
      onChange={(event) => setField(key, event.currentTarget.value)}
    />
  );

  return (
    <AppLayout navItems={OPERATOR_NAV}>
      <Stack gap="lg">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Button variant="subtle" onClick={() => navigate(-1)}>
            Back
          </Button>
          {entry ? (
            <Badge variant="light" color={TIME_LOG_STATUS_COLORS[entry.status]} size="lg">
              {entry.status}
            </Badge>
          ) : (
            <Badge variant="light" color="gray" size="lg">
              new
            </Badge>
          )}
        </Group>

        {readOnly ? (
          <Text c="dimmed" size="sm">
            This log has been submitted and is read-only.
          </Text>
        ) : null}

        <Fieldset legend="Job details">
          <Stack gap="md">
            <SimpleGrid cols={GRID} spacing="md">
              <TextInput label="Job number" value={job?.jobNumber || ''} readOnly disabled />
              <TextInput label="Client" value={job?.clientName || ''} readOnly disabled />
              <TextInput label="Job location" value={job?.jobLocation || ''} readOnly disabled />
              <TextInput label="Rig number" value={job?.rigNumber?.name || '—'} readOnly disabled />
            </SimpleGrid>
            <Divider my="xs" />
            <SimpleGrid cols={GRID} spacing="md">
              <TextInput
                label="Date"
                type="date"
                value={form.date}
                disabled={readOnly}
                onChange={(event) => setField('date', event.currentTarget.value)}
              />
              <Select
                label="Shift"
                placeholder="Select shift"
                data={SHIFT_OPTIONS}
                value={form.shift}
                disabled={readOnly}
                onChange={(value) => setField('shift', value)}
                clearable
              />
              {timeField('timeIn', 'Time in')}
              {timeField('timeOut', 'Time out')}
            </SimpleGrid>
          </Stack>
        </Fieldset>

        <Fieldset legend="Hours">
          <Stack gap="md">
            <SimpleGrid cols={GRID} spacing="md">
              {timeField('timeStarted', 'Time started')}
              {timeField('timeFinished', 'Time finished')}
              {numberField('hoursOnSite', 'Hours on site')}
              {numberField('standbyHours', 'Standby hours')}
              {numberField('otherHours', 'Other hours')}
            </SimpleGrid>
            <Divider my="xs" label="Assistant" labelPosition="left" />
            <SimpleGrid cols={GRID} spacing="md">
              <TextInput
                label="Assistant name"
                value={form.assistantName}
                disabled={readOnly}
                onChange={(event) => setField('assistantName', event.currentTarget.value)}
              />
              {timeField('assistantTimeIn', 'Assistant time in')}
              {timeField('assistantTimeOut', 'Assistant time out')}
            </SimpleGrid>
            <Divider my="xs" label="Mileage" labelPosition="left" />
            <SimpleGrid cols={GRID} spacing="md">
              {numberField('mileageStart', 'Mileage start')}
              {numberField('mileageEnd', 'Mileage end')}
              {numberField('mileageTotal', 'Mileage total')}
            </SimpleGrid>
          </Stack>
        </Fieldset>

        <Fieldset legend="Well tag">
          <Stack gap="md">
            <SimpleGrid cols={GRID} spacing="md">
              <Switch
                label="Installed"
                checked={form.wellTag.installed}
                disabled={readOnly}
                onChange={(event) => setWellTag('installed', event.currentTarget.checked)}
              />
              <Switch
                label="Decommissioned"
                checked={form.wellTag.decommissioned}
                disabled={readOnly}
                onChange={(event) => setWellTag('decommissioned', event.currentTarget.checked)}
              />
            </SimpleGrid>
            <TextInput
              label="Locates provided by"
              value={form.wellTag.locatesProvidedBy}
              disabled={readOnly}
              onChange={(event) => setWellTag('locatesProvidedBy', event.currentTarget.value)}
            />
          </Stack>
        </Fieldset>

        <ActivityLinesSection
          lines={form.activityLines}
          disabled={readOnly}
          errors={lineErrors}
          onChange={(lines) => {
            setLineErrors({});
            setField('activityLines', lines);
          }}
        />

        <Fieldset legend="Shift totals (calculated)">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <TextInput label="Total drilled" value={`${totalDrilled} m`} readOnly disabled />
            <TextInput
              label="Total recovered"
              value={totalRecovered === null ? 'Not entered' : `${totalRecovered} m`}
              readOnly
              disabled
            />
            <TextInput label="Total hours" value={`${totalHours} h`} readOnly disabled />
            <TextInput
              label="Recovery %"
              value={recoveryPreview === null ? 'Not available' : `${recoveryPreview}%`}
              readOnly
              disabled
            />
          </SimpleGrid>
          <Text size="xs" c="dimmed" mt="xs">
            These totals are calculated from the activity lines above and cannot be edited
            directly.
          </Text>
        </Fieldset>

        <Fieldset legend="Fuel">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <NumberInput
              label="Dyed (L)"
              value={form.fuel.dyedLt}
              disabled={readOnly}
              onChange={(value) => setFuel('dyedLt', value)}
            />
            <NumberInput
              label="Diesel (L)"
              value={form.fuel.dieselLt}
              disabled={readOnly}
              onChange={(value) => setFuel('dieselLt', value)}
            />
            <NumberInput
              label="Gasoline (L)"
              value={form.fuel.gasolineLt}
              disabled={readOnly}
              onChange={(value) => setFuel('gasolineLt', value)}
            />
          </SimpleGrid>
        </Fieldset>

        <ConsumablesSection
          items={form.consumables}
          disabled={readOnly}
          onChange={(items) => setField('consumables', items)}
        />

        {readOnly ? null : (
          <Card withBorder radius="md" p="md">
            <Group grow>
              <Button variant="default" onClick={handleSaveDraft} loading={saving}>
                Save draft
              </Button>
              <Button onClick={handleSubmit} loading={submitting}>
                Submit
              </Button>
            </Group>
          </Card>
        )}
      </Stack>
    </AppLayout>
  );
};
