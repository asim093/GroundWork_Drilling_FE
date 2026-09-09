import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  NumberInput,
  Paper,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip
} from '@mantine/core';
import { DatePickerInput, TimePicker } from '@mantine/dates';
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
  clockDuration,
  defaultJobTimes,
  mileageTotal,
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
  listMyTimeLogs,
  submitTimeLog,
  updateTimeLog
} from '../../services/timeLogService.js';
import { TimeLogEntryView } from '../../components/timelog/TimeLogEntryView.jsx';
import { listActivityOptions, listConsumableOptions } from '../../services/catalogService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const GRID = { base: 1, sm: 2 };

const COMPUTED_INPUT_STYLES = {
  input: {
    backgroundColor: 'var(--mantine-color-brand-0)',
    color: 'var(--mantine-color-brand-9)',
    fontWeight: 600
  }
};

const CompletionDot = ({ done }) => (
  <Tooltip
    label={done ? 'This section has entries' : 'Nothing entered here yet'}
    position="top"
    withArrow
  >
    <Box
      w={9}
      h={9}
      style={{
        borderRadius: '50%',
        backgroundColor: done ? 'var(--mantine-color-brand-6)' : 'transparent',
        border: done ? 0 : '1.5px solid var(--mantine-color-gray-4)'
      }}
    />
  </Tooltip>
);

const SubGroup = ({ title, caption, children }) => (
  <Stack gap="xs">
    <Box>
      <Text fw={600} size="sm">
        {title}
      </Text>
      {caption ? (
        <Text size="xs" c="dimmed">
          {caption}
        </Text>
      ) : null}
    </Box>
    {children}
  </Stack>
);

const StatTile = ({ label, value }) => (
  <Paper radius="md" p="sm" bg="var(--mantine-color-brand-0)">
    <Text fw={700} fz="lg" lh={1.2}>
      {value}
    </Text>
    <Text size="xs" c="dimmed" mt={2}>
      {label}
    </Text>
  </Paper>
);

const filledValue = (value) => value !== '' && value !== null && value !== undefined;

const AUTO_FLAG = {
  assistantTimeIn: 'assistantTimeInAuto',
  assistantTimeOut: 'assistantTimeOutAuto',
  timeStarted: 'timeStartedAuto',
  timeFinished: 'timeFinishedAuto'
};

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
  const [activityGroups, setActivityGroups] = useState([]);
  const [consumableGroups, setConsumableGroups] = useState([]);

  const readOnly = entry?.status === 'submitted';

  const totalDrilled = totalDrilledMeters(form.activityLines);
  const totalRecovered = totalRecoveryMeters(form.activityLines);
  const totalHours = totalLineHours(form.activityLines);
  const recoveryPreview = shiftRecoveryPercent(form.activityLines);
  const mileagePreview = mileageTotal(form.mileageStart, form.mileageEnd);
  const hoursOnSitePreview = clockDuration(form.timeIn, form.timeOut);

  const liveLineErrors = useMemo(
    () =>
      validateActivityLines(form.activityLines, {
        timeIn: form.timeIn,
        timeOut: form.timeOut
      }) || {},
    [form.activityLines, form.timeIn, form.timeOut]
  );

  const shownLineErrors = useMemo(() => {
    const merged = { ...liveLineErrors };
    Object.entries(lineErrors).forEach(([index, fields]) => {
      merged[index] = { ...merged[index], ...fields };
    });
    return merged;
  }, [liveLineErrors, lineErrors]);

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
        const today = new Date().toISOString().slice(0, 10);
        const existing = await listMyTimeLogs({ job: jobId, date: today, limit: 1 });
        if (existing.data?.length) {
          navigate(`/operator/log/${existing.data[0].id}`, { replace: true });
          return;
        }
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

  useEffect(() => {
    listActivityOptions()
      .then((result) => setActivityGroups(result.grouped))
      .catch(() => setActivityGroups([]));
    listConsumableOptions()
      .then((result) => setConsumableGroups(result.grouped))
      .catch(() => setConsumableGroups([]));
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateTime = (key, value) =>
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (AUTO_FLAG[key]) {
        next[AUTO_FLAG[key]] = false;
      }

      if (key === 'timeIn' || key === 'timeOut') {
        if (prev.assistantName.trim()) {
          if (key === 'timeIn' && (prev.assistantTimeInAuto || !prev.assistantTimeIn)) {
            next.assistantTimeIn = value;
            next.assistantTimeInAuto = true;
          }
          if (key === 'timeOut' && (prev.assistantTimeOutAuto || !prev.assistantTimeOut)) {
            next.assistantTimeOut = value;
            next.assistantTimeOutAuto = true;
          }
        }
        const jobTimes = defaultJobTimes(next.timeIn, next.timeOut);
        if (jobTimes) {
          if (prev.timeStartedAuto || !prev.timeStarted) {
            next.timeStarted = jobTimes.timeStarted;
            next.timeStartedAuto = true;
          }
          if (prev.timeFinishedAuto || !prev.timeFinished) {
            next.timeFinished = jobTimes.timeFinished;
            next.timeFinishedAuto = true;
          }
        }
      }

      return next;
    });

  const setAssistantName = (value) =>
    setForm((prev) => {
      const next = { ...prev, assistantName: value };
      const nowHasName = Boolean(value.trim());
      const hadName = Boolean(prev.assistantName.trim());

      if (nowHasName && !hadName) {
        if (!prev.assistantTimeIn && prev.timeIn) {
          next.assistantTimeIn = prev.timeIn;
          next.assistantTimeInAuto = true;
        }
        if (!prev.assistantTimeOut && prev.timeOut) {
          next.assistantTimeOut = prev.timeOut;
          next.assistantTimeOutAuto = true;
        }
      }

      if (!nowHasName && hadName) {
        if (prev.assistantTimeInAuto) {
          next.assistantTimeIn = '';
          next.assistantTimeInAuto = false;
        }
        if (prev.assistantTimeOutAuto) {
          next.assistantTimeOut = '';
          next.assistantTimeOutAuto = false;
        }
      }

      return next;
    });

  const setWellTagChoice = (value) =>
    setForm((prev) => ({
      ...prev,
      wellTag: {
        ...prev.wellTag,
        installed: value === 'installed',
        decommissioned: value === 'decommissioned'
      }
    }));

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
    const clientLineErrors = validateActivityLines(form.activityLines, {
      timeIn: form.timeIn,
      timeOut: form.timeOut
    });
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

  if (entry?.status === 'submitted') {
    return (
      <AppLayout navItems={OPERATOR_NAV}>
        <Stack gap="lg">
          <Group>
            <Button variant="subtle" onClick={() => navigate(-1)}>
              Back
            </Button>
          </Group>
          <TimeLogEntryView entry={entry} />
        </Stack>
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
    <TimePicker
      label={label}
      value={form[key]}
      format="12h"
      withDropdown
      clearable
      disabled={readOnly}
      onChange={(value) => updateTime(key, value)}
    />
  );

  const filled = {
    shiftTime:
      Boolean(form.shift) ||
      Boolean(form.timeIn) ||
      Boolean(form.timeOut) ||
      Boolean(form.timeStarted) ||
      Boolean(form.timeFinished) ||
      hoursOnSitePreview !== null ||
      filledValue(form.standbyHours) ||
      filledValue(form.otherHours),
    wellTag:
      form.wellTag.installed ||
      form.wellTag.decommissioned ||
      Boolean(form.wellTag.locatesProvidedBy),
    activityLines: form.activityLines.some(
      (line) =>
        Boolean(line.activityId) ||
        Boolean(line.description) ||
        filledValue(line.depthFrom) ||
        filledValue(line.depthTo) ||
        filledValue(line.recoveryMeters) ||
        Boolean(line.timeFrom) ||
        Boolean(line.timeTo) ||
        Boolean(line.comments)
    ),
    fuel:
      filledValue(form.fuel.dyedLt) ||
      filledValue(form.fuel.dieselLt) ||
      filledValue(form.fuel.gasolineLt),
    consumables: form.consumables.some(
      (item) =>
        Boolean(item.itemName) ||
        filledValue(item.qtyTaken) ||
        filledValue(item.qtyReturned) ||
        filledValue(item.qtyUsed)
    ),
    assistant: Boolean(form.assistantName || form.assistantTimeIn || form.assistantTimeOut),
    mileage: filledValue(form.mileageStart) || filledValue(form.mileageEnd)
  };

  return (
    <AppLayout navItems={OPERATOR_NAV}>
      <Stack gap="lg">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Button variant="subtle" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Badge
            variant="light"
            color={entry ? TIME_LOG_STATUS_COLORS[entry.status] : 'gray'}
            size="lg"
          >
            {entry ? entry.status : 'new'}
          </Badge>
        </Group>

        {readOnly ? (
          <Text c="dimmed" size="sm">
            This log has been submitted and is read-only.
          </Text>
        ) : null}

        <Paper withBorder radius="lg" p="lg">
          <Text fw={700} mb="md">
            Job details
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <TextInput label="Job number" value={job?.jobNumber || ''} readOnly disabled />
            <TextInput label="Client" value={job?.clientName || ''} readOnly disabled />
            <TextInput label="Job location" value={job?.jobLocation || ''} readOnly disabled />
            <TextInput label="Rig number" value={job?.rigNumber?.name || '—'} readOnly disabled />
          </SimpleGrid>
        </Paper>

        <Stack gap="sm">
        <Group gap={7} wrap="nowrap" px={4}>
          <Box
            w={9}
            h={9}
            style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-brand-6)', flexShrink: 0 }}
          />
          <Text size="xs" c="dimmed">
            A filled dot marks a section that already has entries.
          </Text>
        </Group>

        <Accordion
          multiple
          defaultValue={[
            'shift-time',
            'activity-lines',
            'consumables',
            'fuel',
            'assistant',
            'well-tag',
            'mileage'
          ]}
          variant="separated"
          radius="md"
        >
          <Accordion.Item value="shift-time">
            <Accordion.Control icon={<CompletionDot done={filled.shiftTime} />}>
              Shift &amp; Time
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <SubGroup title="Date &amp; Shift">
                  <SimpleGrid cols={GRID} spacing="md">
                    <DatePickerInput
                      label="Date"
                      value={form.date}
                      valueFormat="DD MMM YYYY"
                      disabled={readOnly}
                      onChange={(value) => setField('date', value)}
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
                  </SimpleGrid>
                </SubGroup>

                <SubGroup title="Your Time" caption="When you personally arrived and left the site.">
                  <SimpleGrid cols={GRID} spacing="md">
                    {timeField('timeIn', 'Time in')}
                    {timeField('timeOut', 'Time out')}
                  </SimpleGrid>
                </SubGroup>

                <SubGroup
                  title="Job Time"
                  caption="When drilling actually started and finished (can differ from your own time)."
                >
                  <SimpleGrid cols={GRID} spacing="md">
                    {timeField('timeStarted', 'Time started')}
                    {timeField('timeFinished', 'Time finished')}
                  </SimpleGrid>
                </SubGroup>

                <SubGroup title="Hours Summary">
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" style={{ alignItems: 'end' }}>
                    <TextInput
                      label="Hours on site"
                      value={hoursOnSitePreview === null ? '—' : `${hoursOnSitePreview}`}
                      readOnly
                      disabled
                      styles={COMPUTED_INPUT_STYLES}
                    />
                    {numberField('standbyHours', 'Standby hours')}
                    {numberField('otherHours', 'Other hours')}
                  </SimpleGrid>
                </SubGroup>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="activity-lines">
            <Accordion.Control icon={<CompletionDot done={filled.activityLines} />}>
              Activity Lines
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <ActivityLinesSection
                  lines={form.activityLines}
                  disabled={readOnly}
                  errors={shownLineErrors}
                  activityGroups={activityGroups}
                  onChange={(lines) => {
                    setLineErrors({});
                    setField('activityLines', lines);
                  }}
                />

                <Box>
                  <Text fw={600} size="sm" mb="xs">
                    Shift totals (calculated)
                  </Text>
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                    <StatTile label="Total Drilled" value={`${totalDrilled} m`} />
                    <StatTile
                      label="Total Recovered"
                      value={totalRecovered === null ? '—' : `${totalRecovered} m`}
                    />
                    <StatTile label="Total Hours" value={`${totalHours} h`} />
                    <StatTile
                      label="Recovery %"
                      value={recoveryPreview === null ? '—' : `${recoveryPreview}%`}
                    />
                  </SimpleGrid>
                  <Text size="xs" c="dimmed" mt="xs">
                    Calculated from the activity lines and cannot be edited directly.
                  </Text>
                </Box>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="consumables">
            <Accordion.Control icon={<CompletionDot done={filled.consumables} />}>
              Consumables
            </Accordion.Control>
            <Accordion.Panel>
              <ConsumablesSection
                items={form.consumables}
                disabled={readOnly}
                groupedOptions={consumableGroups}
                onChange={(items) => setField('consumables', items)}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="fuel">
            <Accordion.Control icon={<CompletionDot done={filled.fuel} />}>Fuel</Accordion.Control>
            <Accordion.Panel>
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
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="assistant">
            <Accordion.Control icon={<CompletionDot done={filled.assistant} />}>
              Assistant
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">
                  Fill this in only if you had an assistant on this shift.
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                  <TextInput
                    label="Assistant name"
                    value={form.assistantName}
                    disabled={readOnly}
                    onChange={(event) => setAssistantName(event.currentTarget.value)}
                  />
                  {timeField('assistantTimeIn', 'Time in')}
                  {timeField('assistantTimeOut', 'Time out')}
                </SimpleGrid>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="well-tag">
            <Accordion.Control icon={<CompletionDot done={filled.wellTag} />}>
              Well Tag
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <Radio.Group
                  label="Well tag"
                  value={
                    form.wellTag.installed
                      ? 'installed'
                      : form.wellTag.decommissioned
                        ? 'decommissioned'
                        : 'none'
                  }
                  onChange={setWellTagChoice}
                >
                  <Group mt="xs" gap="lg">
                    <Radio value="none" label="Not applicable" disabled={readOnly} />
                    <Radio value="installed" label="Installed" disabled={readOnly} />
                    <Radio value="decommissioned" label="Decommissioned" disabled={readOnly} />
                  </Group>
                </Radio.Group>
                <TextInput
                  label="Locates provided by"
                  value={form.wellTag.locatesProvidedBy}
                  disabled={readOnly}
                  onChange={(event) => setWellTag('locatesProvidedBy', event.currentTarget.value)}
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="mileage">
            <Accordion.Control icon={<CompletionDot done={filled.mileage} />}>
              Mileage
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">
                  Leave blank if you did not drive a vehicle for this shift.
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" style={{ alignItems: 'end' }}>
                  {numberField('mileageStart', 'Mileage start')}
                  {numberField('mileageEnd', 'Mileage end')}
                  <TextInput
                    label="Mileage total"
                    value={mileagePreview === null ? '—' : `${mileagePreview}`}
                    readOnly
                    disabled
                    styles={COMPUTED_INPUT_STYLES}
                  />
                </SimpleGrid>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        </Stack>

        {readOnly ? null : (
          <div className="tl-footer-bar">
            <Group grow>
              <Button variant="default" onClick={handleSaveDraft} loading={saving}>
                Save draft
              </Button>
              <Button onClick={handleSubmit} loading={submitting}>
                Submit
              </Button>
            </Group>
          </div>
        )}
      </Stack>
    </AppLayout>
  );
};
