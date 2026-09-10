import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  NumberInput,
  Paper,
  Radio,
  ScrollArea,
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

const GRID = { base: 1, sm: 2 };
const FIELD_SIZE = 'sm';

const SECTIONS = [
  { value: 'shift-time', label: 'Shift & Time' },
  { value: 'crew', label: 'Crew' },
  { value: 'activity-lines', label: 'Activity Lines' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'well-tag', label: 'Well Tag' },
  { value: 'mileage', label: 'Mileage' }
];

const ACCORDION_SECTIONS = ['shift-time', 'crew', 'activity-lines', 'consumables'];

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

const PanelCard = ({ id, title, done, children }) => (
  <Paper withBorder radius="md" p="md" id={id}>
    <Group gap={8} mb="sm" wrap="nowrap">
      <CompletionDot done={done} />
      <Text fw={600} size="sm">
        {title}
      </Text>
    </Group>
    {children}
  </Paper>
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

  const [openSections, setOpenSections] = useState(ACCORDION_SECTIONS);

  const goToSection = (value) => {
    if (ACCORDION_SECTIONS.includes(value)) {
      setOpenSections((prev) => (prev.includes(value) ? prev : [...prev, value]));
    }
    requestAnimationFrame(() => {
      document
        .getElementById(`sec-${value}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

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
      Boolean(form.shift) ||
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

        <Paper withBorder radius="lg" p="lg">
          <Text fw={700} mb="md">
            Job details
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <TextInput label="Job number" size={FIELD_SIZE} value={job?.jobNumber || ''} readOnly disabled />
            <TextInput label="Client" size={FIELD_SIZE} value={job?.clientName || ''} readOnly disabled />
            <TextInput label="Job location" size={FIELD_SIZE} value={job?.jobLocation || ''} readOnly disabled />
            <TextInput label="Rig number" size={FIELD_SIZE} value={job?.rigNumber?.name || '—'} readOnly disabled />
          </SimpleGrid>
        </Paper>

        {readOnly ? null : (
          <Box
            px="xs"
            py={8}
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              background: 'var(--mantine-color-body)',
              borderBottom: '1px solid var(--hairline)'
            }}
          >
            <ScrollArea type="never">
              <Group gap="xs" wrap="nowrap">
                {SECTIONS.map((section) => (
                  <Button
                    key={section.value}
                    size="xs"
                    variant="light"
                    color="gray"
                    style={{ flexShrink: 0 }}
                    onClick={() => goToSection(section.value)}
                  >
                    {section.label}
                  </Button>
                ))}
              </Group>
            </ScrollArea>
          </Box>
        )}

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
          value={openSections}
          onChange={setOpenSections}
          variant="separated"
          radius="md"
        >
          <Accordion.Item value="shift-time" id="sec-shift-time">
            <Accordion.Control icon={<CompletionDot done={filled.shiftTime} />}>
              Shift &amp; Time
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xl">
                <SubGroup title="Date &amp; Shift">
                  <SimpleGrid cols={GRID} spacing="md">
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
                  </SimpleGrid>
                </SubGroup>

                <Divider />

                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                  <SubGroup
                    title="Time on site"
                    caption="When the crew arrived on and left the site for this shift."
                  >
                    <SimpleGrid cols={2} spacing="md">
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
                    </SimpleGrid>
                  </SubGroup>

                  <SubGroup
                    title="Work time"
                    caption="When drilling / activity work actually started and finished. Activity lines must fall inside this window."
                  >
                    <SimpleGrid cols={2} spacing="md">
                      {timeField('timeStarted', 'Time Started')}
                      {timeField('timeFinished', 'Time Finished')}
                    </SimpleGrid>
                  </SubGroup>
                </SimpleGrid>

                <Divider />

                <SubGroup title="Hours Summary">
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" style={{ alignItems: 'end' }}>
                    <TextInput
                      label="Hours on site"
                      size={FIELD_SIZE}
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

          <Accordion.Item value="crew" id="sec-crew">
            <Accordion.Control icon={<CompletionDot done={filled.crew} />}>Crew</Accordion.Control>
            <Accordion.Panel>
              <CrewSection
                crew={form.crew}
                roster={roster}
                disabled={readOnly}
                shiftTimes={{ timeIn: form.timeIn, timeOut: form.timeOut }}
                onChange={(crew) => setField('crew', crew)}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="activity-lines" id="sec-activity-lines">
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

          <Accordion.Item value="consumables" id="sec-consumables">
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

        </Accordion>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
          <PanelCard id="sec-fuel" title="Fuel" done={filled.fuel}>
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

          <PanelCard id="sec-mileage" title="Mileage" done={filled.mileage}>
            <Stack gap="xs">
              <Text size="xs" c="dimmed">
                Leave blank if no vehicle was driven for this shift.
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" style={{ alignItems: 'end' }}>
                {numberField('mileageStart', 'Mileage start')}
                {numberField('mileageEnd', 'Mileage end')}
                <TextInput
                  label="Mileage total"
                  size={FIELD_SIZE}
                  value={mileagePreview === null ? '—' : `${mileagePreview}`}
                  readOnly
                  disabled
                  styles={COMPUTED_INPUT_STYLES}
                />
              </SimpleGrid>
            </Stack>
          </PanelCard>

          <PanelCard id="sec-well-tag" title="Well Tag" done={filled.wellTag}>
            <Stack gap="md">
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
                size={FIELD_SIZE}
                value={form.wellTag.locatesProvidedBy}
                disabled={readOnly}
                onChange={(event) => setWellTag('locatesProvidedBy', event.currentTarget.value)}
              />
            </Stack>
          </PanelCard>
        </SimpleGrid>
        </Stack>

        {readOnly ? null : (
          <>
            <Box h={56} aria-hidden />
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
