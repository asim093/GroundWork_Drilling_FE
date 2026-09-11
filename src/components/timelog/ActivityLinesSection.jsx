import { ActionIcon, Group, Paper, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { TimePicker } from '@mantine/dates';
import { NavIcon } from '../NavIcon.jsx';
import { BLANK_ACTIVITY_LINE } from '../../constants/timeLogs.js';

const ERROR_LABELS = {
  activityId: 'Select an activity',
  timeFrom: 'Time from is outside your Time in and Time out, or overlaps another line',
  timeTo: 'Time to is outside your Time in and Time out, is before Time from, or overlaps another line'
};

export const ActivityLinesSection = ({
  lines,
  onChange,
  disabled,
  errors,
  activityGroups = [],
  shiftTimeIn = ''
}) => {
  const updateLine = (index, patch) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    const previous = lines[lines.length - 1];
    const timeFrom = previous ? previous.timeTo || '' : shiftTimeIn || '';
    onChange([...lines, { ...BLANK_ACTIVITY_LINE, timeFrom }]);
  };

  const removeLine = (index) => onChange(lines.filter((_, i) => i !== index));

  const errorList = Object.entries(errors || {}).flatMap(([index, fields]) =>
    Object.keys(fields || {}).map(
      (field) => `Line ${Number(index) + 1}: ${ERROR_LABELS[field] || 'Invalid value'}`
    )
  );

  return (
    <Stack gap="sm">
      {lines.length === 0 ? (
        <Text size="sm" c="dimmed">
          No activity lines yet.
        </Text>
      ) : null}

      {lines.map((line, index) => {
        const lineError = errors?.[index] || {};

        return (
          <Paper key={index} withBorder radius="md" p="sm">
            <Stack gap="xs">
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text fw={600} size="sm">
                  Activity {index + 1}
                </Text>
                {disabled ? null : (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={`Remove line ${index + 1}`}
                    onClick={() => removeLine(index)}
                  >
                    <NavIcon name="trash" size={15} />
                  </ActionIcon>
                )}
              </Group>

              <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
                <Select
                  label="Activity"
                  size="sm"
                  placeholder={
                    line.description && !line.activityId ? line.description : 'Select activity'
                  }
                  data={activityGroups}
                  value={line.activityId || null}
                  disabled={disabled}
                  searchable
                  error={lineError.activityId ? ERROR_LABELS.activityId : undefined}
                  comboboxProps={{ position: 'bottom-start' }}
                  onChange={(value) => updateLine(index, { activityId: value || '' })}
                />
                <TimePicker
                  label="Time from"
                  size="sm"
                  format="12h"
                  withDropdown
                  value={line.timeFrom}
                  disabled={disabled}
                  error={Boolean(lineError.timeFrom)}
                  onChange={(value) => updateLine(index, { timeFrom: value || '' })}
                />
                <TimePicker
                  label="Time to"
                  size="sm"
                  format="12h"
                  withDropdown
                  value={line.timeTo}
                  disabled={disabled}
                  error={Boolean(lineError.timeTo)}
                  onChange={(value) => updateLine(index, { timeTo: value || '' })}
                />
              </SimpleGrid>

              <TextInput
                label="Comments"
                size="sm"
                placeholder="Optional note"
                value={line.comments}
                disabled={disabled}
                onChange={(event) => updateLine(index, { comments: event.currentTarget.value })}
              />
            </Stack>
          </Paper>
        );
      })}

      {disabled ? null : (
        <button type="button" className="tl-add-line" onClick={addLine}>
          + Add activity line
        </button>
      )}

      {errorList.length ? (
        <Stack gap={2}>
          {errorList.map((message) => (
            <Text key={message} size="xs" c="red">
              {message}
            </Text>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
};
