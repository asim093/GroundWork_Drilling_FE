import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
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
  TextInput
} from '@mantine/core';
import { DatePickerInput, TimePicker } from '@mantine/dates';
import { AppLayout } from '../../components/AppLayout.jsx';
import { OPERATOR_NAV } from '../../constants/nav.js';
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
  clockDuration,
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

  const readOnly = entry?.status === 'submitted';

  const roster = useMemo(() => rosterOf(job), [job]);
  const myShifts = useMemo(() => myShiftsFor(job, user?.id), [job, user?.id]);
  const shiftOptions = myShifts.length
    ? SHIFT_OPTIONS.filter((option) => myShifts.includes(option.value))
    : SHIFT_OPTIONS;
  const shiftLocked = readOnly || Boolean(entry) || myShifts.length === 1;

  const totalDrilled = totalDrilledMeters(form.activityLines);
  const totalRecovered = totalRecoveryMeters(form.activityLines);
  const totalHours = totalLineHours(form.activityLines);
  const recoveryPreview = shiftRecoveryPercent(form.activityLines);
  const mileagePreview = mileageTotal(form.mileageStart, form.mileageEnd);
  const hoursOnSitePreview = clockDuration(form.timeIn, form.timeOut);

  const liveLineErrors = useMemo(
    () =>
      validateActivityLines(form.activityLines, {
        timeStarted: form.timeStarted,
        timeFinished: form.timeFinished
      }) || {},
    [form.activityLines, form.timeStarted, form.timeFinished]
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
        const mine = myShiftsFor(loadedJob, user?.id);
        setJob(loadedJob);
        setEntry(null);
        setForm({ ...emptyTimeLogForm(), shift: mine.length === 1 ? mine[0] : null });
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
      return {
        ...prev,
        [key]: next,
        crew: prev.crew.map((member) => ({
          ...member,
          [key]: next || member[key]
        }))
      };
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
    if (!form.shift) {
      throw new Error('Select the shift before saving');
    }

    const clientLineErrors = validateActivityLines(form.activityLines, {
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
      size={FIELD_SIZE}
      value={form[key]}
      disabled={readOnly}
      onChange={(value) => setField(key, value)}
    />
  );

  const timeField = (key, label) => (
    <TimePicker
      label={label}
      size={FIELD_SIZE}
      value={form[key]}
      format="12h"
      withDropdown
      clearable
      disabled={readOnly}
      onChange={(value) => setField(key, value || '')}
    />
  );

  const filled = {
    shiftTime:
      Boolean(form.timeIn) ||
      Boolean(form.timeOut) ||
      Boolean(form.timeStarted) ||
      Boolean(form.timeFinished) ||
      hoursOnSitePreview !== null ||
      filledValue(form.standbyHours) ||
      filledValue(form.otherHours),
    crew: form.crew.length > 0,
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
                caption="Time In / Out sets hours on site. Activity lines must fall between Time Started and Time Finished."
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

              <SimpleGrid cols={2} spacing="md">
                {numberField('standbyHours', 'Standby hours')}
                {numberField('otherHours', 'Other hours')}
              </SimpleGrid>
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

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" style={{ alignItems: 'start' }}>
          <PanelCard id="sec-fuel" title="Fuel" hint="Litres used" done={filled.fuel}>
            <SimpleGrid cols={3} spacing="md">
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

          <PanelCard
            id="sec-mileage"
            title="Mileage"
            hint="Blank if no vehicle driven"
            done={filled.mileage}
          >
            <SimpleGrid cols={3} spacing="md" style={{ alignItems: 'end' }}>
              {numberField('mileageStart', 'Start')}
              {numberField('mileageEnd', 'End')}
              <TextInput
                label="Total"
                size={FIELD_SIZE}
                value={mileagePreview === null ? '—' : `${mileagePreview}`}
                readOnly
                disabled
                styles={COMPUTED_INPUT_STYLES}
              />
            </SimpleGrid>
          </PanelCard>
        </SimpleGrid>

        <PanelCard
          id="sec-well-tag"
          title="Well Tag"
          hint="Only if a tag was installed or removed"
          done={filled.wellTag}
        >
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'center' }}>
            <Radio.Group
              value={
                form.wellTag.installed
                  ? 'installed'
                  : form.wellTag.decommissioned
                    ? 'decommissioned'
                    : 'none'
              }
              onChange={setWellTagChoice}
            >
              <Group gap="lg">
                <Radio value="none" label="Not applicable" disabled={readOnly} />
                <Radio value="installed" label="Installed" disabled={readOnly} />
                <Radio value="decommissioned" label="Decommissioned" disabled={readOnly} />
              </Group>
            </Radio.Group>
            <TextInput
              label="Locates provided by"
              size={FIELD_SIZE}
              value={form.wellTag.locatesProvidedBy}
              disabled={readOnly}
              onChange={(event) => setWellTag('locatesProvidedBy', event.currentTarget.value)}
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
                  variant="default"
                  onClick={handleSaveDraft}
                  loading={saving}
                  disabled={submitting}
                >
                  Save draft
                </Button>
                <Button size="sm" onClick={handleSubmit} loading={submitting} disabled={saving}>
                  Submit
                </Button>
              </Group>
            </div>
          </>
        )}
      </Stack>
    </AppLayout>
  );
};
