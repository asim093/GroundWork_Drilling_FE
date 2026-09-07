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
import {
  emptyTimeLogForm,
  timeLogFormFromEntry,
  timeLogPayloadFromForm
} from '../../lib/timeLogForm.js';
import {
  createTimeLog,
  getAssignedJob,
  getTimeLog,
  submitTimeLog,
  updateTimeLog
} from '../../services/timeLogService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

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

  const readOnly = entry?.status === 'submitted';

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

  const persist = async () => {
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
      <Stack gap="lg" maw={720}>
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
          <Stack gap="sm">
            <TextInput label="Job number" value={job?.jobNumber || ''} readOnly disabled />
            <TextInput label="Client" value={job?.clientName || ''} readOnly disabled />
            <TextInput label="Job location" value={job?.jobLocation || ''} readOnly disabled />
            <Divider my="xs" />
            <TextInput
              label="Date"
              type="date"
              value={form.date}
              disabled={readOnly}
              onChange={(event) => setField('date', event.currentTarget.value)}
            />
            {timeField('timeIn', 'Time in')}
            {timeField('timeOut', 'Time out')}
          </Stack>
        </Fieldset>

        <Fieldset legend="Hours">
          <Stack gap="sm">
            {timeField('timeStarted', 'Time started')}
            {timeField('timeFinished', 'Time finished')}
            {numberField('hoursOnSite', 'Hours on site')}
            {numberField('standbyHours', 'Standby hours')}
            {numberField('otherHours', 'Other hours')}
            <Divider my="xs" label="Assistant" labelPosition="left" />
            <TextInput
              label="Assistant name"
              value={form.assistantName}
              disabled={readOnly}
              onChange={(event) => setField('assistantName', event.currentTarget.value)}
            />
            {timeField('assistantTimeIn', 'Assistant time in')}
            {timeField('assistantTimeOut', 'Assistant time out')}
            <Divider my="xs" label="Mileage" labelPosition="left" />
            {numberField('mileageStart', 'Mileage start')}
            {numberField('mileageEnd', 'Mileage end')}
            {numberField('mileageTotal', 'Mileage total')}
          </Stack>
        </Fieldset>

        <Fieldset legend="Well tag">
          <Stack gap="sm">
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
            <TextInput
              label="Locates provided by"
              value={form.wellTag.locatesProvidedBy}
              disabled={readOnly}
              onChange={(event) => setWellTag('locatesProvidedBy', event.currentTarget.value)}
            />
            <NumberInput
              label="Recovery % (optional)"
              value={form.recoveryPercent}
              disabled={readOnly}
              onChange={(value) => setField('recoveryPercent', value)}
            />
          </Stack>
        </Fieldset>

        <ActivityLinesSection
          lines={form.activityLines}
          disabled={readOnly}
          onChange={(lines) => setField('activityLines', lines)}
        />

        <Fieldset legend="Fuel">
          <Stack gap="sm">
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
          </Stack>
        </Fieldset>

        <ConsumablesSection
          items={form.consumables}
          disabled={readOnly}
          onChange={(items) => setField('consumables', items)}
        />

        {readOnly ? null : (
          <Card withBorder radius="md" p="md" pos="sticky" bottom={0}>
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
