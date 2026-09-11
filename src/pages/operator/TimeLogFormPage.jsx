import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput
} from '@mantine/core';
import { DatePickerInput, TimePicker } from '@mantine/dates';
import { AppLayout } from '../../components/AppLayout.jsx';
import { ADMIN_NAV, OPERATOR_NAV } from '../../constants/nav.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ActivityLinesSection } from '../../components/timelog/ActivityLinesSection.jsx';
import { ConsumablesSection } from '../../components/timelog/ConsumablesSection.jsx';
import { CrewSection } from '../../components/timelog/CrewSection.jsx';
import { TIME_LOG_STATUS_COLORS } from '../../constants/timeLogs.js';
import { SHIFT_OPTIONS } from '../../constants/employees.js';
import {
  emptyTimeLogForm,
  timeLogFormFromEntry,
  timeLogPayloadFromForm
} from '../../lib/timeLogForm.js';
import {
  addClockHours,
  clockDuration,
  findActivityCoverageGap,
  findActivityLineOverlap,
  totalLineHours,
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

const FIELD_SIZE = 'sm';

const COMPUTED_INPUT_STYLES = {
  input: {
    backgroundColor: 'var(--mantine-color-brand-0)',
    color: 'var(--mantine-color-brand-9)',
    fontWeight: 600
  }
};

const idOf = (value) => value?.id || value?._id || value || '';

const rosterOf = (job) =>
  (job?.rosterEmployeeIds || []).map((employee) => ({
    id: idOf(employee),
    name: employee.name || 'Unknown',
    employeeType: employee.employeeType || '—'
  }));

const myShiftsFor = (job, userId) =>
  (job?.siteManagers || [])
    .filter((manager) => idOf(manager.userId) === userId)
    .map((manager) => manager.shift);

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

const PanelCard = ({ id, title, hint, done, stretch, children }) => (
  <Paper
    withBorder
    radius="lg"
    id={id}
    style={{
      height: stretch ? '100%' : undefined,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    <Group
      justify="space-between"
      wrap="nowrap"
      px="lg"
      py="sm"
      style={{
        borderBottom: '1px solid var(--hairline)',
        background: 'var(--mantine-color-gray-0)'
      }}
    >
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        <Box
          w={4}
          h={18}
          style={{ borderRadius: 4, background: 'var(--mantine-color-brand-5)', flexShrink: 0 }}
        />
        <Text fw={700} fz="sm" truncate>
          {title}
        </Text>
        {hint ? (
          <Text size="xs" c="dimmed" truncate visibleFrom="sm">
            {hint}
          </Text>
        ) : null}
      </Group>
      {done ? (
        <Badge size="sm" variant="light" color="teal" radius="sm" style={{ flexShrink: 0 }}>
          Added
        </Badge>
      ) : null}
    </Group>
    <Box p="lg" style={{ flex: 1 }}>
      {children}
    </Box>
  </Paper>
);

const JobFact = ({ label, value }) => (
  <div>
    <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.04em' }}>
      {label}
    </Text>
    <Text fw={600} size="sm" truncate>
      {value || '—'}
    </Text>
  </div>
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

export const TimeLogFormPage = () => {
  usePageTitle('Time & material log');
  const { jobId, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [entry, setEntry] = useState(null);
  const [form, setForm] = useState(emptyTimeLogForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lineErrors, setLineErrors] = useState({});
  const [activityGroups, setActivityGroups] = useState([]);
  const [consumableGroups, setConsumableGroups] = useState([]);
  const workTimeEdited = useRef({ timeStarted: false, timeFinished: false });

  const isAdminMode = user?.role === 'admin';
  const navItems = isAdminMode ? ADMIN_NAV : OPERATOR_NAV;
  const readOnly = entry?.status === 'submitted' && !isAdminMode;

  const roster = useMemo(() => rosterOf(job), [job]);
  const myShifts = useMemo(() => myShiftsFor(job, user?.id), [job, user?.id]);
  const shiftOptions = myShifts.length
    ? SHIFT_OPTIONS.filter((option) => myShifts.includes(option.value))
    : SHIFT_OPTIONS;
  const shiftLocked = readOnly || Boolean(entry) || myShifts.length === 1;

  const totalHours = totalLineHours(form.activityLines);
  const hoursOnSitePreview = clockDuration(form.timeIn, form.timeOut);
  const [gapModal, setGapModal] = useState(null);

  const liveLineErrors = useMemo(
    () =>
      validateActivityLines(form.activityLines, {
        timeIn: form.timeIn,
        timeOut: form.timeOut,
        timeStarted: form.timeStarted,
        timeFinished: form.timeFinished
      }) || {},
    [form.activityLines, form.timeIn, form.timeOut, form.timeStarted, form.timeFinished]
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
        workTimeEdited.current = {
          timeStarted: Boolean(loaded.timeStarted),
          timeFinished: Boolean(loaded.timeFinished)
        };
      } else {
        const loadedJob = await getAssignedJob(jobId);
        const today = new Date().toISOString().slice(0, 10);
        const existing = await listMyTimeLogs({ job: jobId, date: today, limit: 1 });
        if (existing.data?.length) {
          navigate(`/operator/log/${existing.data[0].id}`, { replace: true });
          return;
        }
        const mine = myShiftsFor(loadedJob, user?.id);
        setJob(loadedJob);
        setEntry(null);
        setForm({ ...emptyTimeLogForm(), shift: mine.length === 1 ? mine[0] : null });
        workTimeEdited.current = { timeStarted: false, timeFinished: false };
      }
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to open the time log'));
      navigate('/operator/jobs', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, jobId, navigate, user?.id]);

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

  const setSiteTime = (key, value) =>
    setForm((prev) => {
      const next = value || '';
      const updated = {
        ...prev,
        [key]: next,
        crew: prev.crew.map((member) => ({
          ...member,
          [key]: next || member[key]
        }))
      };
      if (key === 'timeIn' && next && !workTimeEdited.current.timeStarted) {
        updated.timeStarted = addClockHours(next, 2);
      }
      if (key === 'timeOut' && next && !workTimeEdited.current.timeFinished) {
        updated.timeFinished = addClockHours(next, -2);
      }
      return updated;
    });

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
    if (!form.shift) {
      throw new Error('Select the shift before saving');
    }

    const clientLineErrors = validateActivityLines(form.activityLines, {
      timeIn: form.timeIn,
      timeOut: form.timeOut,
      timeStarted: form.timeStarted,
      timeFinished: form.timeFinished
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
      notifySuccess(isAdminMode ? 'Changes saved' : 'Draft saved');
      if (isAdminMode) {
        navigate(-1);
      }
    } catch (error) {
      const serverLineErrors = parseServerLineErrors(error);
      if (serverLineErrors) {
        setLineErrors(serverLineErrors);
      }
      notifyError(extractErrorMessage(error, 'Unable to save changes'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (form.timeIn && form.timeOut) {
      const overlap = findActivityLineOverlap(form.activityLines, form.timeIn, form.timeOut);
      if (overlap?.type === 'reversed') {
        setGapModal(`Line ${overlap.index + 1}: Time To must be after Time From.`);
        return;
      }
      if (overlap?.type === 'overlap') {
        setGapModal(
          `Lines ${overlap.indexA + 1} and ${overlap.indexB + 1} overlap — activity lines can't cover the same time twice.`
        );
        return;
      }
      const gap = findActivityCoverageGap(form.activityLines, form.timeIn, form.timeOut);
      if (gap) {
        setGapModal(
          `You're missing an activity between ${gap.from} and ${gap.to} — please add it before submitting.`
        );
        return;
      }
    }

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
      const message = extractErrorMessage(error, 'Unable to submit time log');
      if (/missing an activity between|overlap|Time To must be after/i.test(message)) {
        setGapModal(message);
      } else {
        notifyError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout navItems={navItems}>
        <Center py="xl">
          <Loader />
        </Center>
      </AppLayout>
    );
  }

  if (entry?.status === 'submitted' && !isAdminMode) {
    return (
      <AppLayout navItems={navItems}>
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

  const timeField = (key, label) => (
    <TimePicker
      label={label}
      size={FIELD_SIZE}
      value={form[key]}
      format="12h"
      withDropdown
      clearable
      disabled={readOnly}
      onChange={(value) => {
        workTimeEdited.current[key] = true;
        setField(key, value || '');
      }}
    />
  );

  const filled = {
    shiftTime:
      Boolean(form.timeIn) ||
      Boolean(form.timeOut) ||
      Boolean(form.timeStarted) ||
      Boolean(form.timeFinished) ||
      hoursOnSitePreview !== null,
    crew: form.crew.length > 0,
    activityLines: form.activityLines.some(
      (line) =>
        Boolean(line.activityId) ||
        Boolean(line.description) ||
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
    )
  };

  return (
    <AppLayout navItems={navItems}>
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

        {isAdminMode && entry?.status === 'submitted' ? (
          <Text c="dimmed" size="sm">
            This log has already been submitted. You're editing it as an admin — changes save
            immediately.
          </Text>
        ) : null}

        <Paper withBorder radius="lg" p="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
            <JobFact label="Job number" value={job?.jobNumber} />
            <JobFact label="Client" value={job?.clientName} />
            <JobFact label="Location" value={job?.jobLocation} />
            <JobFact label="Rig" value={job?.rigNumber?.name} />
          </SimpleGrid>
        </Paper>

        <Stack gap="md">
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" style={{ alignItems: 'stretch' }}>
          <PanelCard
            id="sec-shift-time"
            title="Shift & Time"
            hint="Date, shift and hours"
            done={filled.shiftTime}
            stretch
          >
            <Stack gap="lg">
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <DatePickerInput
                  label="Date"
                  size={FIELD_SIZE}
                  value={form.date}
                  valueFormat="DD MMM YYYY"
                  disabled={readOnly}
                  onChange={(value) => setField('date', value)}
                />
                <Select
                  label="Shift"
                  size={FIELD_SIZE}
                  placeholder="Select shift"
                  data={shiftOptions}
                  value={form.shift}
                  disabled={shiftLocked}
                  onChange={(value) => setField('shift', value)}
                  allowDeselect={false}
                />
                <TextInput
                  label="Hours on site"
                  size={FIELD_SIZE}
                  value={hoursOnSitePreview === null ? '—' : `${hoursOnSitePreview}`}
                  readOnly
                  disabled
                  styles={COMPUTED_INPUT_STYLES}
                />
              </SimpleGrid>

              <SubGroup
                title="Site &amp; work times"
                caption="Time In / Out sets hours on site and bounds the activity lines. Time Started / Finished default to 2 hours inside Time In / Out — adjust if needed."
              >
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                  <TimePicker
                    label="Time In"
                    size={FIELD_SIZE}
                    value={form.timeIn}
                    format="12h"
                    withDropdown
                    clearable
                    disabled={readOnly}
                    onChange={(value) => setSiteTime('timeIn', value)}
                  />
                  <TimePicker
                    label="Time Out"
                    size={FIELD_SIZE}
                    value={form.timeOut}
                    format="12h"
                    withDropdown
                    clearable
                    disabled={readOnly}
                    onChange={(value) => setSiteTime('timeOut', value)}
                  />
                  {timeField('timeStarted', 'Time Started')}
                  {timeField('timeFinished', 'Time Finished')}
                </SimpleGrid>
              </SubGroup>
            </Stack>
          </PanelCard>

          <PanelCard
            id="sec-crew"
            title="Crew"
            hint="Who worked this shift"
            done={filled.crew}
            stretch
          >
            <CrewSection
              crew={form.crew}
              roster={roster}
              disabled={readOnly}
              shiftTimes={{ timeIn: form.timeIn, timeOut: form.timeOut }}
              onChange={(crew) => setField('crew', crew)}
            />
          </PanelCard>
        </SimpleGrid>

        <PanelCard
          id="sec-activity-lines"
          title="Activity Lines"
          hint="Drilling and activity detail"
          done={filled.activityLines}
        >
          <Stack gap="lg">
            <ActivityLinesSection
              lines={form.activityLines}
              disabled={readOnly}
              errors={shownLineErrors}
              activityGroups={activityGroups}
              shiftTimeIn={form.timeIn}
              onChange={(lines) => {
                setLineErrors({});
                setField('activityLines', lines);
              }}
            />

            <Box>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <StatTile label="Total Hours" value={`${totalHours} h`} />
              </SimpleGrid>
              <Text size="xs" c="dimmed" mt="xs">
                Activity lines must fully cover the shift's Time In to Time Out window before you can submit.
              </Text>
            </Box>
          </Stack>
        </PanelCard>

        <PanelCard
          id="sec-consumables"
          title="Consumables"
          hint="Items taken and returned"
          done={filled.consumables}
        >
          <ConsumablesSection
            items={form.consumables}
            disabled={readOnly}
            groupedOptions={consumableGroups}
            onChange={(items) => setField('consumables', items)}
          />
        </PanelCard>

        <PanelCard id="sec-fuel" title="Fuel" hint="Litres used" done={filled.fuel}>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <NumberInput
              label="Dyed (L)"
              size={FIELD_SIZE}
              value={form.fuel.dyedLt}
              disabled={readOnly}
              onChange={(value) => setFuel('dyedLt', value)}
            />
            <NumberInput
              label="Diesel (L)"
              size={FIELD_SIZE}
              value={form.fuel.dieselLt}
              disabled={readOnly}
              onChange={(value) => setFuel('dieselLt', value)}
            />
            <NumberInput
              label="Gasoline (L)"
              size={FIELD_SIZE}
              value={form.fuel.gasolineLt}
              disabled={readOnly}
              onChange={(value) => setFuel('gasolineLt', value)}
            />
          </SimpleGrid>
        </PanelCard>
        </Stack>

        {readOnly ? null : (
          <>
            <Box h={12} aria-hidden />
            <div className="tl-footer-bar">
              <Group justify="flex-end" gap="sm">
                <Button
                  size="sm"
                  variant={isAdminMode ? 'filled' : 'default'}
                  onClick={handleSaveDraft}
                  loading={saving}
                  disabled={submitting}
                >
                  {isAdminMode ? 'Save changes' : 'Save draft'}
                </Button>
                {isAdminMode ? null : (
                  <Button size="sm" onClick={handleSubmit} loading={submitting} disabled={saving}>
                    Submit
                  </Button>
                )}
              </Group>
            </div>
          </>
        )}
      </Stack>

      <Modal
        opened={Boolean(gapModal)}
        onClose={() => setGapModal(null)}
        title="Activity lines don't cover the full shift"
        centered
      >
        <Stack gap="md">
          <Text size="sm">{gapModal}</Text>
          <Group justify="flex-end">
            <Button size="sm" onClick={() => setGapModal(null)}>
              Got it
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppLayout>
  );
};
